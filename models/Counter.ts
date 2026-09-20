import mongoose, { Schema, Model, Document } from "mongoose";

export interface ICounterDocument extends Omit<Document, "_id"> {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel: Model<ICounterDocument> =
  mongoose.models.Counter ||
  mongoose.model<ICounterDocument>("Counter", CounterSchema);

export default CounterModel;

/**
 * Atomically increments and returns the next sequential receipt number.
 * Format: IEDC-YYYY-XXXX (e.g., IEDC-2026-0001)
 */
export async function getNextReceiptNumber(year?: number): Promise<string> {
  const receiptYear = year || new Date().getFullYear();
  const counterId = `receipt_${receiptYear}`;

  const counter = await CounterModel.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqNumber = counter ? counter.seq : 1;
  const seqStr = String(seqNumber).padStart(4, "0");
  return `IEDC-${receiptYear}-${seqStr}`;
}
