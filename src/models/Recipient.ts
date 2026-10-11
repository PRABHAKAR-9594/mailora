import mongoose, { Document, Schema, Types } from "mongoose";

export type SendStatus = "sent" | "failed";
export type RecipientLastStatus = "pending" | "sent" | "failed";

export interface ISendHistoryEntry {
  sentAt: Date;
  status: SendStatus;
  errorMessage: string | null;
}

export interface IRecipient extends Document {
  campaignId: Types.ObjectId;
  userId: Types.ObjectId;
  // From CSV
  email: string;
  companyName: string;
  hrName: string;
  role: string;
  contactNo: string;
  notes: string;
  // Tracking
  sendHistory: ISendHistoryEntry[];
  lastStatus: RecipientLastStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SendHistorySchema = new Schema<ISendHistoryEntry>(
  {
    sentAt: { type: Date, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    errorMessage: { type: String, default: null },
  },
  { _id: false }
);

const RecipientSchema = new Schema<IRecipient>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    companyName: { type: String, default: "" },
    hrName: { type: String, default: "" },
    role: { type: String, default: "" },
    contactNo: { type: String, default: "" },
    notes: { type: String, default: "" },
    sendHistory: { type: [SendHistorySchema], default: [] },
    lastStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Recipient =
  mongoose.models.Recipient ||
  mongoose.model<IRecipient>("Recipient", RecipientSchema);

export default Recipient;
