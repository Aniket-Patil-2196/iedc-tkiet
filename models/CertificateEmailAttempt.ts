import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { ICertificateEmailAttempt } from "@/types/certificate";

export interface ICertificateEmailAttemptDocument
  extends Omit<ICertificateEmailAttempt, "_id" | "recipientId" | "batchId" | "attemptedAt">,
    Document {
  recipientId: Types.ObjectId;
  batchId: Types.ObjectId;
  attemptedAt: Date;
}

const CertificateEmailAttemptSchema =
  new Schema<ICertificateEmailAttemptDocument>(
    {
      recipientId: {
        type: Schema.Types.ObjectId,
        ref: "CertificateRecipient",
        required: true,
        index: true,
      },
      batchId: {
        type: Schema.Types.ObjectId,
        ref: "CertificateBatch",
        required: true,
        index: true,
      },
      attemptNumber: { type: Number, required: true },
      attemptedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["sent", "failed"],
        required: true,
        index: true,
      },
      providerMessageId: { type: String },
      errorCategory: {
        type: String,
        enum: ["transient", "permanent", "config"],
      },
      errorMessage: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  );

const CertificateEmailAttemptModel: Model<ICertificateEmailAttemptDocument> =
  mongoose.models.CertificateEmailAttempt ||
  mongoose.model<ICertificateEmailAttemptDocument>(
    "CertificateEmailAttempt",
    CertificateEmailAttemptSchema
  );

export default CertificateEmailAttemptModel;
