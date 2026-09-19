import mongoose, { Schema, Model, Document } from "mongoose";
import { IGalleryImage } from "@/types/content";

export interface IGalleryImageDocument extends Omit<IGalleryImage, "id">, Document {}

const GalleryImageSchema = new Schema<IGalleryImageDocument>(
  {
    title: { type: String, required: true },
    caption: { type: String },
    imageUrl: { type: String, required: true },
    aspectRatio: {
      type: String,
      enum: ["square", "wide", "tall"],
      default: "square",
    },
    tags: [{ type: String }],
    eventRefId: { type: String },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const GalleryImageModel: Model<IGalleryImageDocument> =
  mongoose.models.GalleryImage ||
  mongoose.model<IGalleryImageDocument>("GalleryImage", GalleryImageSchema);

export default GalleryImageModel;
