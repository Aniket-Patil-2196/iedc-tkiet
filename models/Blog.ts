import mongoose, { Schema, Model, Document } from "mongoose";
import { IBlog } from "@/types/content";

export interface IBlogDocument extends Omit<IBlog, "id">, Document {}

const BlogSchema = new Schema<IBlogDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: String,
      default: "IEDC TKIET",
      required: true,
    },
    coverImage: { type: String },
    publicationDate: { type: String, required: true, index: true },
    publishedAt: { type: String },
    readTimeMinutes: { type: Number, default: 4 },
    published: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const BlogModel: Model<IBlogDocument> =
  mongoose.models.Blog || mongoose.model<IBlogDocument>("Blog", BlogSchema);

export default BlogModel;
