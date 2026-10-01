import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type CommentStatus = "approved" | "rejected" | "flagged" | "pending";

export interface IComment {
  id?: string;
  blogId: Types.ObjectId | string;
  blogSlug: string;
  parentId?: Types.ObjectId | string | null;
  replyToUser?: string | null;
  name: string;
  email?: string;
  body: string;
  likesCount: number;
  likedBy?: string[];
  authorTokenHash?: string;
  status: CommentStatus;
  reportsCount?: number;
  isDeleted?: boolean;
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
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    replyToUser: {
      type: String,
      trim: true,
      maxlength: 60,
      default: null,
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
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    likedBy: {
      type: [String],
      default: [],
      select: false, // Internal identity hashes for duplicate like prevention
    },
    authorTokenHash: {
      type: String,
      select: false, // Secret hash for author-level deletion
      index: true,
    },
    status: {
      type: String,
      enum: ["approved", "rejected", "flagged", "pending"],
      default: "approved", // Published immediately without admin approval requirement
      index: true,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

// Compound indexes for efficient tree traversal, rate limit checks and status querying
CommentSchema.index({ ipHash: 1, createdAt: -1 });
CommentSchema.index({ email: 1, createdAt: -1 });
CommentSchema.index({ blogSlug: 1, status: 1, createdAt: 1 });
CommentSchema.index({ blogSlug: 1, parentId: 1, createdAt: 1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });

const CommentModel: Model<ICommentDocument> =
  mongoose.models.Comment ||
  mongoose.model<ICommentDocument>("Comment", CommentSchema);

export default CommentModel;
