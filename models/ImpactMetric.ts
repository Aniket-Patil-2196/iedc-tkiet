import mongoose, { Schema, Model, Document } from "mongoose";
import { IImpactMetric } from "@/types/content";

export interface IImpactMetricDocument
  extends Omit<IImpactMetric, "id">,
    Document {}

const ImpactMetricSchema = new Schema<IImpactMetricDocument>(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    displayOrder: { type: Number, default: 0, index: true },
    enabled: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ImpactMetricModel: Model<IImpactMetricDocument> =
  mongoose.models.ImpactMetric ||
  mongoose.model<IImpactMetricDocument>("ImpactMetric", ImpactMetricSchema);

export default ImpactMetricModel;
