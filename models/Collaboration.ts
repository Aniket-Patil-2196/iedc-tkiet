import mongoose, { Schema, Model, Document } from "mongoose";
import { ICollaboration } from "@/types/content";

export interface ICollaborationDocument extends Omit<ICollaboration, "id">, Document {}

const CollaborationSchema = new Schema<ICollaborationDocument>(
  {
    partnerName: { type: String, required: true },
    partnerType: { type: String, required: true },
    logoUrl: { type: String },
    description: { type: String, required: true },
    websiteUrl: { type: String },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const CollaborationModel: Model<ICollaborationDocument> =
  mongoose.models.Collaboration ||
  mongoose.model<ICollaborationDocument>("Collaboration", CollaborationSchema);

export default CollaborationModel;
