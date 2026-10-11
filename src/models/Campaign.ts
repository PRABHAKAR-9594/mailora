import mongoose, { Document, Schema, Types } from "mongoose";

export type CampaignStatus = "draft" | "sending" | "completed" | "partial_failed";

export interface ICampaign extends Document {
  userId: Types.ObjectId;
  title: string;
  subject: string;
  body: string;
  csvFileName: string;
  attachmentPath?: string;     // Absolute disk path to saved attachment
  attachmentFileName?: string; // Original file name shown to recipients
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    csvFileName: { type: String, required: true },
    attachmentPath: { type: String, default: null },
    attachmentFileName: { type: String, default: null },
    totalRecipients: { type: Number, required: true, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sending", "completed", "partial_failed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Campaign =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
