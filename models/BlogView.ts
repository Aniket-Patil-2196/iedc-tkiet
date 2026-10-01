import mongoose, { Schema, Model, Document } from "mongoose";

export interface IBlogViewDocument extends Document {
  blogSlug: string;
  visitorId: string;
  createdAt: Date;
}

const BlogViewSchema = new Schema<IBlogViewDocument>(
  {
    blogSlug: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7200, // 2-hour TTL: automatically purges expired deduplication records
    },
  },
  { timestamps: false }
);

// Unique compound index ensures atomic deduplication per visitor per blog within TTL window
BlogViewSchema.index({ blogSlug: 1, visitorId: 1 }, { unique: true });

const BlogViewModel: Model<IBlogViewDocument> =
  mongoose.models.BlogView ||
  mongoose.model<IBlogViewDocument>("BlogView", BlogViewSchema);

export default BlogViewModel;
