"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/session";
import { encrypt } from "@/lib/encrypt";
import { verifyTransporter } from "@/lib/mailer";

export async function getProfile() {
  try {
    await connectDB();
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return { error: "Unauthorized" };
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      return { error: "User not found" };
    }

    return {
      success: true,
      user: {
        name: user.name,
        email: user.email,
        emailConfig: user.emailConfig
          ? {
              fromEmail: user.emailConfig.fromEmail,
              host: user.emailConfig.host,
              port: user.emailConfig.port,
              secure: user.emailConfig.secure,
              // DO NOT return the appPassword back to the client!
            }
          : null,
      },
    };
  } catch (err: any) {
    console.error("Get profile error:", err);
    return { error: "Failed to load profile." };
  }
}

export async function saveEmailConfig(formData: FormData) {
  try {
    await connectDB();
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return { error: "Unauthorized" };
    }

    const fromEmail = (formData.get("fromEmail") as string)?.trim();
    const appPassword = (formData.get("appPassword") as string)?.trim();
    const host = (formData.get("host") as string)?.trim();
    const port = parseInt(formData.get("port") as string, 10);
    const secure = formData.get("secure") === "true";

    if (!fromEmail || !appPassword || !host || isNaN(port)) {
      return { error: "All fields are required." };
    }

    // Pre-validate SMTP credentials using Nodemailer verify()
    try {
      await verifyTransporter({
        fromEmail,
        appPassword,
        host,
        port,
        secure,
      });
    } catch (verifyError: any) {
      console.error("SMTP Verification failed:", verifyError);
      return { 
        error: "Failed to connect to SMTP server. Please check your credentials, app password, host, and port." 
      };
    }

    // Since verification succeeded, encrypt and save
    const encryptedPassword = encrypt(appPassword);

    await User.findByIdAndUpdate(session.userId, {
      $set: {
        emailConfig: {
          fromEmail,
          appPassword: encryptedPassword,
          host,
          port,
          secure,
        },
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Save email config error:", err);
    return { error: "Failed to save configuration." };
  }
}
