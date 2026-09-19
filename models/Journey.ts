import mongoose, { Schema, Model, Document } from "mongoose";
import { IJourneyMilestone } from "@/types/content";

export interface IJourneyMilestoneDocument extends Omit<IJourneyMilestone, "id">, Document {}

const JourneySchema = new Schema<IJourneyMilestoneDocument>(
  {
    year: { type: String, required: true },
    title: { type: String, required: true },
    label: { type: String },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    highlightMetric: { type: String },
    detailedStory: { type: String },
    accent: { type: String, default: "oceanic" },
    image: { type: String },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const JourneyModel: Model<IJourneyMilestoneDocument> =
  mongoose.models.Journey ||
  mongoose.model<IJourneyMilestoneDocument>("Journey", JourneySchema);

export default JourneyModel;
