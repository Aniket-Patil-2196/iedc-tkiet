import mongoose, { Schema, Model, Document } from "mongoose";
import { IBlog } from "@/types/content";

export interface IBlogDocument extends Omit<IBlog, "id">, Document {}

const BlogImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    caption: { type: String },
    order: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const BlogReferenceSchema = new Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number },
  },
  { _id: false }
);

const BlogSeoSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
  },
  { _id: false }
);

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
    images: {
      type: [BlogImageSchema],
      default: [],
    },
    references: {
      type: [BlogReferenceSchema],
      default: [],
    },
    publicationDate: { type: String, index: true },
    publishedAt: { type: Date, default: Date.now, index: true },
    readTimeMinutes: { type: Number, default: 4 },
    published: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    category: { type: String, default: null },
    tags: { type: [String], default: [] },
    location: { type: String, default: null },
    seo: { type: BlogSeoSchema, default: undefined },
  },
  { timestamps: true }
);

const BlogModel: Model<IBlogDocument> =
  mongoose.models.Blog || mongoose.model<IBlogDocument>("Blog", BlogSchema);

export default BlogModel;
