import mongoose, { Document, Schema } from "mongoose";

export interface IEmailConfig {
  fromEmail: string;
  appPassword: string; // AES-256 encrypted
  host: string;
  port: number;
  secure: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  otp: string | null;
  otpExpiresAt: Date | null;
  emailConfig: IEmailConfig | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmailConfigSchema = new Schema<IEmailConfig>(
  {
    fromEmail: { type: String, required: true },
    appPassword: { type: String, required: true }, // stored encrypted
    host: { type: String, required: true },
    port: { type: Number, required: true },
    secure: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    emailConfig: { type: EmailConfigSchema, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
