import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { IRegistration, RegistrationStatus } from "@/types/content";

export interface IRegistrationDocument
  extends Omit<IRegistration, "id" | "eventId">,
    Document {
  eventId: Types.ObjectId;
}

const RegistrationSchema = new Schema<IRegistrationDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cancelled"],
      default: "pending",
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in paise
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    receiptToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundId: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent the same email from having multiple PAID registrations for the same event
RegistrationSchema.index(
  { eventId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "paid" } }
);

// Index for seat hold capacity check (pending in last 15 min)
RegistrationSchema.index({ eventId: 1, status: 1, createdAt: 1 });

const RegistrationModel: Model<IRegistrationDocument> =
  mongoose.models.Registration ||
  mongoose.model<IRegistrationDocument>("Registration", RegistrationSchema);

export default RegistrationModel;
