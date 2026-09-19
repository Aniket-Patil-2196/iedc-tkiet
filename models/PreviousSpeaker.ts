import mongoose, { Schema, Model, Document } from "mongoose";
import { IPreviousSpeaker } from "@/types/content";

export interface IPreviousSpeakerDocument
  extends Omit<IPreviousSpeaker, "id">,
    Document {}

const PreviousSpeakerSchema = new Schema<IPreviousSpeakerDocument>(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    organization: { type: String },
    photo: { type: String, required: true },
    shortDescription: { type: String },
    eventAssociation: { type: String },
    displayOrder: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const PreviousSpeakerModel: Model<IPreviousSpeakerDocument> =
  mongoose.models.PreviousSpeaker ||
  mongoose.model<IPreviousSpeakerDocument>(
    "PreviousSpeaker",
    PreviousSpeakerSchema
  );

export default PreviousSpeakerModel;
