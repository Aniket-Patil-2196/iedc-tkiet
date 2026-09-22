import mongoose, { Schema, Model, Document } from "mongoose";
import { ITeamMember } from "@/types/content";

export interface ITeamMemberDocument extends Omit<ITeamMember, "id">, Document {}

const TeamMemberSchema = new Schema<ITeamMemberDocument>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String },
    category: {
      type: String,
      enum: ["faculty_coordinator", "student_lead", "core_team", "advisory"],
      required: true,
      index: true,
    },
    avatarUrl: { type: String },
    bio: { type: String },
    email: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String },
    twitterUrl: { type: String },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const TeamMemberModel: Model<ITeamMemberDocument> =
  mongoose.models.TeamMember ||
  mongoose.model<ITeamMemberDocument>("TeamMember", TeamMemberSchema);

export default TeamMemberModel;
