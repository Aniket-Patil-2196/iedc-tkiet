import mongoose, { Schema, Model, Document } from "mongoose";
import { IAchievement } from "@/types/content";

export interface IAchievementDocument extends Omit<IAchievement, "id">, Document {}

const AchievementSchema = new Schema<IAchievementDocument>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    year: { type: String, required: true, index: true },
    shortDescription: { type: String },
    description: { type: String, required: true },
    recipientOrTeam: { type: String },
    verifiedLink: { type: String },
    mediaUrl: { type: String },
    certificateImage: { type: String },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const AchievementModel: Model<IAchievementDocument> =
  mongoose.models.Achievement ||
  mongoose.model<IAchievementDocument>("Achievement", AchievementSchema);

export default AchievementModel;

