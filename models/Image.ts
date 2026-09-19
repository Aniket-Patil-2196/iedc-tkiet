import mongoose, { Schema, Model, Document } from "mongoose";

/**
 * Binary image storage model.
 * Stores processed image data (sharp-optimized WebP) directly in MongoDB.
 * Served via GET /api/images/[id].
 */
export interface IImageDocument extends Document {
  data: Buffer;
  contentType: string;
  size: number;
  createdAt: Date;
}

const ImageSchema = new Schema<IImageDocument>(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

const ImageModel: Model<IImageDocument> =
  mongoose.models.Image ||
  mongoose.model<IImageDocument>("Image", ImageSchema);

export default ImageModel;
