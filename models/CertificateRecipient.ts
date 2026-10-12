import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  ICertificateRecipient,
  RecipientGenerationStatus,
  RecipientEmailStatus,
} from "@/types/certificate";

export interface ICertificateRecipientDocument
  extends Omit<
      ICertificateRecipient,
      "_id" | "batchId" | "lastEmailAttemptAt" | "sentAt" | "additionalFields"
    >,
    Document {
  batchId: Types.ObjectId;
  lastEmailAttemptAt?: Date;
  sentAt?: Date;
  additionalFields?: Map<string, string>;
}

const CertificateRecipientSchema = new Schema<ICertificateRecipientDocument>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "CertificateBatch",
      required: true,
      index: true,
    },
    sourceRowNumber: { type: Number, required: true },
    participantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    certificateType: { type: String, trim: true },
    additionalFields: { type: Map, of: String, default: {} },
    generationStatus: {
      type: String,
      enum: ["pending", "generating", "generated", "failed"],
      default: "pending",
      index: true,
    },
    generationError: { type: String },
    certificateFileReference: { type: String },
    emailStatus: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    emailAttempts: { type: Number, default: 0 },
    lastEmailAttemptAt: { type: Date },
    lastEmailError: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for querying recipients by batch and status
CertificateRecipientSchema.index({ batchId: 1, generationStatus: 1 });
CertificateRecipientSchema.index({ batchId: 1, emailStatus: 1 });
CertificateRecipientSchema.index({ batchId: 1, email: 1 });

const CertificateRecipientModel: Model<ICertificateRecipientDocument> =
  mongoose.models.CertificateRecipient ||
  mongoose.model<ICertificateRecipientDocument>(
    "CertificateRecipient",
    CertificateRecipientSchema
  );

export default CertificateRecipientModel;
