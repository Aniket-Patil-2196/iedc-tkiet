import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  ICertificateBatch,
  CertificateBatchStatus,
  ITemplateSnapshot,
} from "@/types/certificate";

export interface ICertificateBatchDocument
  extends Omit<ICertificateBatch, "_id" | "eventId" | "completedAt">,
    Document {
  eventId?: Types.ObjectId;
  completedAt?: Date;
}

const FieldConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    fontSize: { type: Number, required: true, default: 24 },
    fontFamily: { type: String, required: true, default: "HelveticaBold" },
    color: { type: String, required: true, default: "#111827" },
    alignment: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    maxWidth: { type: Number, default: 80 },
    minFontSize: { type: Number, default: 12 },
    defaultValue: { type: String, default: "" },
  },
  { _id: false }
);

const TemplateSnapshotSchema = new Schema(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "CertificateTemplate" },
    fileReference: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: {
      type: String,
      required: true,
      enum: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
    },
    pageWidth: { type: Number, required: true, default: 842 },
    pageHeight: { type: Number, required: true, default: 595 },
    orientation: {
      type: String,
      required: true,
      enum: ["landscape", "portrait"],
      default: "landscape",
    },
    fields: [FieldConfigSchema],
  },
  { _id: false }
);

const CertificateBatchSchema = new Schema<ICertificateBatchDocument>(
  {
    batchName: { type: String, required: true, trim: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", index: true },
    eventName: { type: String, required: true, trim: true },
    eventDate: { type: String, trim: true },
    certificateType: { type: String, trim: true, default: "Participation" },
    templateSnapshot: { type: TemplateSnapshotSchema, required: true },
    status: {
      type: String,
      enum: [
        "draft",
        "ready",
        "generating",
        "generated",
        "sending",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },
    totalParticipants: { type: Number, default: 0 },
    validParticipants: { type: Number, default: 0 },
    invalidParticipants: { type: Number, default: 0 },
    generationCounts: {
      total: { type: Number, default: 0 },
      generated: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    emailCounts: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    emailSubject: {
      type: String,
      default: "Your Certificate of Participation — {{eventName}}",
    },
    emailBody: {
      type: String,
      default:
        "Dear {{participantName}},\n\nThank you for participating in {{eventName}} organized by IEDC TKIET.\n\nPlease find your personalized certificate attached to this email.\n\nCertificate ID: {{certificateId}}\n\nWe appreciate your participation and look forward to seeing you at our future events.\n\nRegards,\nInnovation and Entrepreneurship Development Cell (IEDC)\nTKIET",
    },
    createdBy: { type: String, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const CertificateBatchModel: Model<ICertificateBatchDocument> =
  mongoose.models.CertificateBatch ||
  mongoose.model<ICertificateBatchDocument>(
    "CertificateBatch",
    CertificateBatchSchema
  );

export default CertificateBatchModel;
