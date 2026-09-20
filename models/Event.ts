import mongoose, { Schema, Model, Document } from "mongoose";
import { IEvent } from "@/types/content";

export interface IEventDocument extends Omit<IEvent, "id">, Document {}

const EventSchema = new Schema<IEventDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    shortDescription: { type: String },
    summary: { type: String },
    description: { type: String, required: true },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    date: { type: String },
    venue: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
      index: true,
    },
    statusOverride: {
      type: String,
      enum: [
        "Registration Open",
        "Registration Closed",
        "Upcoming",
        "Ongoing",
        "Completed",
        "Postponed",
        "Cancelled",
        null,
      ],
      default: null,
    },
    registrationMode: {
      type: String,
      enum: ["external", "onsite", "none"],
      default: "external",
    },
    registrationUrl: { type: String },
    registrationLink: { type: String },
    coverImage: { type: String },
    posterUrl: { type: String },
    posterWidth: { type: Number },
    posterHeight: { type: Number },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    category: { type: String, required: true, index: true },
    highlights: [{ type: String }],
    fee: { type: Number, default: 0, min: 0 },
    registrationDeadline: { type: Date, default: null },
    capacity: { type: Number, default: null, min: 1 },
    registrationOpen: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const EventModel: Model<IEventDocument> =
  mongoose.models.Event || mongoose.model<IEventDocument>("Event", EventSchema);

export default EventModel;
