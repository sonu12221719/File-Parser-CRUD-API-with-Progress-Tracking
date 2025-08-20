import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const fileSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    filename: String,
    mimetype: String,
    size: Number,
    status: { type: String, enum: ['uploading', 'processing', 'ready', 'failed'], default: 'uploading' },
    uploadProgress: { type: Number, default: 0 },
    processProgress: { type: Number, default: 0 },
    error: String,
    storedPath: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const FileModel = mongoose.model('files', fileSchema);