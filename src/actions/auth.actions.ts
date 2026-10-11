"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { createOtpTransporter } from "@/lib/mailer";

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(formData: FormData) {
  try {
    await connectDB();
    const name = formData.get("name") as string;
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name || !email || !password || !confirmPassword) {
      return { error: "All fields are required." };
    }
    if (!EMAIL_REGEX.test(email)) {
      return { error: "Invalid email format." };
    }
    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "Email is already registered." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiresAt,
    });

    await newUser.save();

    // Send OTP email
    await sendOtpEmail(email, otp);

    return { success: true, email };
  } catch (error: any) {
    console.error("Register error:", error);
    return { error: "Registration failed. Please try again." };
  }
}

export async function verifyOTP(formData: FormData) {
  try {
    await connectDB();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const otp = formData.get("otp") as string;

    if (!email || !otp) {
      return { error: "Email and OTP are required." };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { error: "User not found." };
    }

    if (user.isVerified) {
      return { error: "User is already verified." };
    }

    if (user.otp !== otp) {
      return { error: "Invalid OTP." };
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return { error: "OTP has expired. Please request a new one." };
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Set Session
    const session = await getSession();
    session.userId = user._id.toString();
    session.name = user.name;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return { success: true };
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return { error: "Verification failed. Please try again." };
  }
}

export async function resendOTP(formData: FormData) {
  try {
    await connectDB();
    const email = (formData.get("email") as string)?.toLowerCase().trim();

    if (!email) {
      return { error: "Email is required." };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { error: "User not found." };
    }

    if (user.isVerified) {
      return { error: "User is already verified." };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP email
    await sendOtpEmail(email, otp);

    return { success: true };
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return { error: "Failed to resend OTP." };
  }
}

export async function loginUser(formData: FormData) {
  try {
    await connectDB();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { error: "Invalid email or password." };
    }

    if (!user.isVerified) {
      return { error: "Please verify your email first.", unverifiedEmail: email };
    }

    // Set Session
    const session = await getSession();
    session.userId = user._id.toString();
    session.name = user.name;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return { success: true };
  } catch (error: any) {
    console.error("Login error:", error);
    return { error: "Login failed. Please try again." };
  }
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
  return { success: true };
}

// Helper for sending OTPs
async function sendOtpEmail(toEmail: string, otp: string) {
  try {
    const transporter = createOtpTransporter();
    await transporter.sendMail({
      from: `"Mailora" <${process.env.OTP_EMAIL}>`,
      to: toEmail,
      subject: "Your Mailora Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify your Mailora account</h2>
          <p>Thank you for registering. Please use the following 6-digit code to verify your email address:</p>
          <div style="background-color: #F2F3FF; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // Even if it fails, we don't throw, we just log it. 
    // Usually we might throw to tell the user the email failed to send.
    throw new Error("Failed to send verification email. Please check your SMTP settings in .env.local");
  }
}
