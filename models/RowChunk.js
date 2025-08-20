import mongoose from 'mongoose';

const rowSchema = new mongoose.Schema(
  {
    fileId: { type: String, index: true },
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
    chunkIndex: { type: Number, index: true },
  },
  { timestamps: true }
);

export const RowChunkModel = mongoose.model('parsed_rows', rowSchema);
