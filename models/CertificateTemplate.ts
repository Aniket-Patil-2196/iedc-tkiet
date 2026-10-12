import mongoose, { Schema, Model, Document } from "mongoose";
import {
  SupportedFontFamily,
  TextAlignment,
  CertificateFieldType,
  ICertificateFieldConfig,
} from "@/types/certificate";

export interface ICertificateTemplateDocument extends Document {
  name: string;
  fileReference: string;
  fileName: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  pageWidth: number;
  pageHeight: number;
  orientation: "landscape" | "portrait";
  fields: ICertificateFieldConfig[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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

const CertificateTemplateSchema = new Schema<ICertificateTemplateDocument>(
  {
    name: { type: String, required: true, trim: true },
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
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

const CertificateTemplateModel: Model<ICertificateTemplateDocument> =
  mongoose.models.CertificateTemplate ||
  mongoose.model<ICertificateTemplateDocument>(
    "CertificateTemplate",
    CertificateTemplateSchema
  );

export default CertificateTemplateModel;
