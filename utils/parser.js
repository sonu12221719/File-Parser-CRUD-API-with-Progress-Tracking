import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { parse as csvParse } from 'csv-parse';
import { FileModel } from '../models/File.js';
import { RowChunkModel } from '../models/RowChunk.js';
import { broadcastProgress } from './progress.js';

/**
 * Count total rows in a CSV file (used for progress calculation)
 */
function countRows(filePath) {
  return new Promise((resolve, reject) => {
    let total = 0;
    fs.createReadStream(filePath)
      .pipe(csvParse({ skip_empty_lines: true }))
      .on('data', () => total++)
      .on('end', () => resolve(total))
      .on('error', reject);
  });
}

export async function parseFileAsync(fileId, filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  if (!(mimeType?.includes('csv') || ext === '.csv')) throw new Error('Unsupported file type');

  await RowChunkModel.deleteMany({ fileId });
  await FileModel.updateOne({ _id: fileId }, { status: 'processing', processProgress: 0 });

  const totalRows = await countRows(filePath);
  if (totalRows === 0) {
    await FileModel.updateOne({ _id: fileId }, { status: 'ready', processProgress: 100 });
    broadcastProgress(fileId, { file_id: fileId, status: 'ready', progress: 100 });
    return;
  }

  const parser = csvParse({ columns: true, skip_empty_lines: true });
  const readStream = fs.createReadStream(filePath);

  let buffer = [];
  let chunkIndex = 0;
  let processed = 0;

  parser.on('readable', async () => {
    let record;
    while ((record = parser.read()) !== null) {
      buffer.push(record);
      processed++;

      if (buffer.length >= 1000) {
        await RowChunkModel.create({ fileId, rows: buffer, chunkIndex });
        buffer = [];
        chunkIndex++;
      }

      const progressPercent = Math.min(100, Math.floor((processed / totalRows) * 100));
      if (processed % 100 === 0 || processed === totalRows) {
        await FileModel.updateOne({ _id: fileId }, { processProgress: progressPercent });
        broadcastProgress(fileId, { file_id: fileId, status: 'processing', progress: progressPercent });
      }
    }
  });

  parser.on('end', async () => {
    if (buffer.length) await RowChunkModel.create({ fileId, rows: buffer, chunkIndex });
    await FileModel.updateOne({ _id: fileId }, { status: 'ready', processProgress: 100 });
    broadcastProgress(fileId, { file_id: fileId, status: 'ready', progress: 100 });
  });

  await pipeline(readStream, parser);
}
