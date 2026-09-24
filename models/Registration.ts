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
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "cancelled",
        "verification_required",
        "payment_rejected",
      ],
      default: "pending",
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in paise (stage amount / recorded paid so far for installments)
      min: 0,
    },
    totalAmount: {
      type: Number, // full event fee in paise, snapshotted at registration
      default: null,
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
    paymentMode: {
      type: String,
      enum: ["razorpay", "manual_upi", "free", null],
      default: null,
    },
    // Student detail extension
    department: {
      type: String,
      trim: true,
      default: null,
    },
    // Manual UPI Payment and Verification fields
    upiProofUrl: {
      type: String,
      default: null,
    },
    upiTransactionRef: {
      type: String,
      trim: true,
      default: null,
    },
    // Snapshot of UPI config at submission time (never re-read live from Event)
    upiId: {
      type: String,
      default: null,
    },
    upiQrUrl: {
      type: String,
      default: null,
    },
    adminNote: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: String,
      default: null,
    },
    // Installment fields (for 2-part payment)
    installmentPlan: {
      type: String,
      enum: ["full", "installment", null],
      default: null,
    },
    installmentStatus: {
      type: String,
      enum: ["part1_pending", "part1_paid", "part2_pending", "complete", null],
      default: null,
    },
    part1PaidAt: {
      type: Date,
      default: null,
    },
    part2ProofUrl: {
      type: String,
      default: null,
    },
    part2TransactionRef: {
      type: String,
      trim: true,
      default: null,
    },
    part2PaidAt: {
      type: Date,
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
