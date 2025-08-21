import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import Busboy from "busboy";
import { v4 as uuidv4 } from "uuid";
import { pipeline } from "stream/promises";
import { FileModel } from "../models/File.js";
import { RowChunkModel } from "../models/RowChunk.js";
import { parseFileAsync } from "../utils/parser.js";
import { broadcastProgress, sseClients } from "../utils/progress.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export async function handleUpload(req, res) {
  const contentLength = Number(req.headers["content-length"] || 0);
  const id = uuidv4();
  const fileDoc = new FileModel({ _id: id, status: "uploading" });
  await fileDoc.save();

  const bb = Busboy({ headers: req.headers });
  let uploadedBytes = 0;

  bb.on("file", async (name, file, info) => {
    const { filename, mimeType } = info;
    const storedPath = path.join(UPLOAD_DIR, `${id}__${filename}`);

    file.on("data", async (chunk) => {
      uploadedBytes += chunk.length;
      const progress =
        contentLength > 0
          ? Math.min(99, Math.floor((uploadedBytes / contentLength) * 100))
          : 0;
      await FileModel.updateOne(
        { _id: id },
        { size: uploadedBytes, uploadProgress: progress }
      );
      broadcastProgress(id, { file_id: id, status: "uploading", progress });
    });

    await pipeline(file, fs.createWriteStream(storedPath));

    await FileModel.updateOne(
      { _id: id },
      {
        filename,
        mimetype: mimeType,
        storedPath,
        status: "processing",
        uploadProgress: 100,
      }
    );
    broadcastProgress(id, { file_id: id, status: "processing", progress: 100 });

    parseFileAsync(id, storedPath, mimeType).catch(async (err) => {
      await FileModel.updateOne(
        { _id: id },
        { status: "failed", error: String(err) }
      );
      broadcastProgress(id, { file_id: id, status: "failed", progress: 100 });
    });
  });

  bb.on("finish", () => res.status(201).json({ file_id: id }));

  req.pipe(bb);
}

export async function getProgress(id) {
  const doc = await FileModel.findById(id).lean();
  if (!doc) return null;
  let status = doc.status;
  let progress =
    status === "uploading"
      ? doc.uploadProgress
      : status === "processing"
      ? Math.min(doc.uploadProgress, doc.processProgress)
      : 100;
  
  if(doc.status==="processing"){
    const msg="uploading";
    return {file_id: id, status:msg,progress};
  }
  return { file_id: id, status, progress };
}

export function handleSSE(req, res) {
  const { id } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!sseClients.has(id)) sseClients.set(id, new Set());
  sseClients.get(id).add(res);

  req.on("close", () => sseClients.get(id)?.delete(res));
}

export async function getFileContent(id, query) {
  const doc = await FileModel.findById(id).lean();
  if (!doc) return { status: 404, body: { error: "Not found" } };
  if (doc.status !== "ready")
    return { status: 202, body: { message: "File upload or processing in progress. Please try again later." } };

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(1000, Math.max(1, Number(query.limit || 100)));

  const chunks = await RowChunkModel.find({ fileId: id })
    .sort({ chunkIndex: 1 })
    .lean();
  const allRows = chunks.flatMap((c) => c.rows);

  return {
    status: 200,
    body: {
      file_id: id,
      filename: doc.filename,
      total_rows: allRows.length,
      page,
      limit,
      rows: allRows.slice((page - 1) * limit, page * limit),
    },
  };
}

export async function listFiles() {
  return FileModel.find({}, { error: 0 }).sort({ created_at: -1 }).lean();
}

export async function deleteFile(id) {
  const doc = await FileModel.findById(id);
  if (!doc) throw new Error("Not found");
  await RowChunkModel.deleteMany({ fileId: id });
  if (doc.storedPath && fs.existsSync(doc.storedPath))
    await fsp.unlink(doc.storedPath);
  await FileModel.deleteOne({ _id: id });
  return true;
}
