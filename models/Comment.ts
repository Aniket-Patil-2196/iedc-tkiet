import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type CommentStatus = "pending" | "approved" | "rejected";

export interface IComment {
  id?: string;
  blogId: Types.ObjectId | string;
  blogSlug: string;
  name: string;
  email?: string;
  body: string;
  status: CommentStatus;
  ipHash?: string;
  adminReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentDocument extends Omit<IComment, "id">, Document {}

const CommentSchema = new Schema<ICommentDocument>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    blogSlug: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      select: false, // Security: Never selected by default
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    ipHash: {
      type: String,
      required: true,
      select: false, // Privacy: Never selected by default
      index: true,
    },
    adminReply: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient rate limit checks and status querying
CommentSchema.index({ ipHash: 1, createdAt: -1 });
CommentSchema.index({ email: 1, createdAt: -1 });
CommentSchema.index({ blogSlug: 1, status: 1, createdAt: -1 });

const CommentModel: Model<ICommentDocument> =
  mongoose.models.Comment ||
  mongoose.model<ICommentDocument>("Comment", CommentSchema);

export default CommentModel;
