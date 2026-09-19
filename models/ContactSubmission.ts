import mongoose, { Schema, Model, Document } from "mongoose";

export interface IContactSubmission {
  id: string;
  name: string;
  email: string;
  category?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IContactSubmissionDocument
  extends Omit<IContactSubmission, "id">,
    Document {}

const ContactSubmissionSchema = new Schema<IContactSubmissionDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, default: "General" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const ContactSubmissionModel: Model<IContactSubmissionDocument> =
  mongoose.models.ContactSubmission ||
  mongoose.model<IContactSubmissionDocument>(
    "ContactSubmission",
    ContactSubmissionSchema
  );

export default ContactSubmissionModel;
