import mongoose, { Schema, Model, Document } from "mongoose";
import { IAboutContent } from "@/types/content";

export interface IAboutContentDocument
  extends Omit<IAboutContent, "id">,
    Document {}

const AboutContentSchema = new Schema<IAboutContentDocument>(
  {
    whoWeAre: { type: String, required: true },
    vision: { type: String, required: true },
    mission: { type: String, required: true },
  },
  { timestamps: true }
);

const AboutContentModel: Model<IAboutContentDocument> =
  mongoose.models.AboutContent ||
  mongoose.model<IAboutContentDocument>("AboutContent", AboutContentSchema);

export default AboutContentModel;
