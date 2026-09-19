import mongoose, { Schema, Model, Document } from "mongoose";
import { ILeadershipMessage } from "@/types/content";

export interface ILeadershipMessageDocument extends Omit<ILeadershipMessage, "id">, Document {}

const LeadershipMessageSchema = new Schema<ILeadershipMessageDocument>(
  {
    leaderName: { type: String, required: true },
    designation: { type: String, required: true },
    institution: {
      type: String,
      default: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
      required: true,
    },
    message: { type: String, required: true },
    avatarUrl: { type: String },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const LeadershipMessageModel: Model<ILeadershipMessageDocument> =
  mongoose.models.LeadershipMessage ||
  mongoose.model<ILeadershipMessageDocument>("LeadershipMessage", LeadershipMessageSchema);

export default LeadershipMessageModel;
