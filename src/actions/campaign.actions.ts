"use server";

import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import Recipient from "@/models/Recipient";
import { createTransporter, buildPersonalizedContent } from "@/lib/mailer";
import { decrypt } from "@/lib/encrypt";
import { parseCSV } from "@/lib/csv-parser";
import { sendEmail } from "@/actions/mail.actions";
import path from "path";
import fs from "fs/promises";

// Absolute path to the uploads/attachments folder at project root
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "attachments");

/**
 * Saves an attachment (from FormData File) to disk and returns its path.
 */
async function saveAttachment(file: File): Promise<{ diskPath: string; fileName: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize filename and make unique
  const safeExt = path.extname(file.name).toLowerCase();
  const baseName = path.basename(file.name, safeExt).replace(/[^a-z0-9_\-]/gi, "_");
  const uniqueName = `${Date.now()}_${baseName}${safeExt}`;
  const diskPath = path.join(UPLOADS_DIR, uniqueName);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(diskPath, buffer);

  return { diskPath, fileName: file.name };
}

export async function createCampaignAndSend(formData: FormData) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return { error: "Unauthorized" };
    }

    const title = (formData.get("title") as string)?.trim();
    const subject = (formData.get("subject") as string)?.trim();
    const body = (formData.get("body") as string)?.trim();
    const csvContent = (formData.get("csvContent") as string)?.trim();
    const csvFileName = (formData.get("csvFileName") as string)?.trim() || "upload.csv";
    const attachmentFile = formData.get("attachment") as File | null;

    if (!title || !subject || !body || !csvContent) {
      return { error: "All fields including CSV are required." };
    }

    // Parse CSV
    const parseResult = parseCSV(csvContent);
    if (parseResult.errors.length > 0 || parseResult.data.length === 0) {
      return { error: parseResult.errors[0] || "Invalid CSV" };
    }
    const recipientsList = parseResult.data;

    // Get User and Email Config
    const user = await User.findById(session.userId);
    if (!user || !user.emailConfig) {
      return { error: "Please configure your email settings in Profile first." };
    }

    // Decrypt password and create transporter
    const appPassword = decrypt(user.emailConfig.appPassword);
    const transporter = createTransporter({
      fromEmail: user.emailConfig.fromEmail,
      appPassword,
      host: user.emailConfig.host,
      port: user.emailConfig.port,
      secure: user.emailConfig.secure,
    });

    // Handle attachment upload
    let attachmentPath: string | undefined;
    let attachmentFileName: string | undefined;

    if (attachmentFile && attachmentFile.size > 0) {
      const saved = await saveAttachment(attachmentFile);
      attachmentPath = saved.diskPath;
      attachmentFileName = saved.fileName;
    }

    // Create Campaign in DB
    const campaign = new Campaign({
      userId: user._id,
      title,
      subject,
      body,
      csvFileName,
      attachmentPath: attachmentPath || null,
      attachmentFileName: attachmentFileName || null,
      totalRecipients: recipientsList.length,
      status: "sending",
    });
    await campaign.save();

    // Prepare recipients
    const recipientDocs = recipientsList.map((r) => ({
      campaignId: campaign._id,
      userId: user._id,
      email: r.email,
      companyName: r.companyName || "",
      hrName: r.hrName || "",
      role: r.role || "",
      contactNo: r.contactNo || "",
      notes: Object.keys(r)
        .filter(k => !["email", "companyName", "hrName", "role", "contactNo"].includes(k))
        .map(k => `${k}: ${r[k]}`)
        .join(", "),
      lastStatus: "pending",
      sendHistory: [],
    }));

    // Bulk insert recipients
    const insertedRecipients = await Recipient.insertMany(recipientDocs);

    // Trigger async processing (don't await this so the UI returns immediately)
    processEmails(
      transporter,
      campaign._id,
      insertedRecipients,
      subject,
      body,
      user.name,
      attachmentPath,
      attachmentFileName
    );

    return { success: true, campaignId: campaign._id.toString() };
  } catch (err: any) {
    console.error("Create campaign error:", err);
    return { error: "Failed to create campaign." };
  }
}

// Background process to send emails
async function processEmails(
  transporter: any,
  campaignId: any,
  recipients: any[],
  subjectTemplate: string,
  bodyTemplate: string,
  senderName: string,
  attachmentPath?: string,
  attachmentFileName?: string
) {
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    // Personalize
    const subject = buildPersonalizedContent(subjectTemplate, {
      hrName: recipient.hrName,
      companyName: recipient.companyName,
      role: recipient.role,
      senderName,
    });
    
    // Convert newlines in plain text body to <br> for HTML sending
    const formattedBodyTemplate = bodyTemplate.replace(/\n/g, "<br/>");
    
    const body = buildPersonalizedContent(formattedBodyTemplate, {
      hrName: recipient.hrName,
      companyName: recipient.companyName,
      role: recipient.role,
      senderName,
    });

    const result = await sendEmail(
      transporter,
      recipient.email,
      subject,
      body,
      attachmentPath,
      attachmentFileName
    );

    const status = result.success ? "sent" : "failed";
    const historyEntry = {
      sentAt: new Date(),
      status,
      errorMessage: result.error || null,
    };

    // Update Recipient Document
    await Recipient.findByIdAndUpdate(recipient._id, {
      lastStatus: status,
      $push: { sendHistory: historyEntry },
    });

    if (result.success) sentCount++;
    else failedCount++;

    // Update Campaign Document iteratively so UI sees progress
    await Campaign.findByIdAndUpdate(campaignId, {
      sentCount,
      failedCount,
    });
  }

  // Mark Campaign as Completed
  const finalStatus = failedCount > 0 ? (sentCount > 0 ? "partial_failed" : "failed") : "completed";
  await Campaign.findByIdAndUpdate(campaignId, {
    status: finalStatus,
  });
}

export async function getCampaigns() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) return { error: "Unauthorized" };

    const campaigns = await Campaign.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, campaigns: JSON.parse(JSON.stringify(campaigns)) };
  } catch (err: any) {
    console.error("Get campaigns error:", err);
    return { error: "Failed to fetch campaigns." };
  }
}

export async function getCampaignById(campaignId: string) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) return { error: "Unauthorized" };

    const campaign = await Campaign.findOne({ _id: campaignId, userId: session.userId }).lean();
    if (!campaign) return { error: "Campaign not found" };

    const recipients = await Recipient.find({ campaignId }).lean();

    return { 
      success: true, 
      campaign: JSON.parse(JSON.stringify(campaign)), 
      recipients: JSON.parse(JSON.stringify(recipients)) 
    };
  } catch (err: any) {
    console.error("Get campaign by ID error:", err);
    return { error: "Failed to fetch campaign details." };
  }
}

export async function retryFailedRecipients(campaignId: string) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) return { error: "Unauthorized" };

    const campaign = await Campaign.findOne({ _id: campaignId, userId: session.userId });
    if (!campaign) return { error: "Campaign not found" };

    const failedRecipients = await Recipient.find({ 
      campaignId, 
      lastStatus: "failed" 
    });

    if (failedRecipients.length === 0) {
      return { error: "No failed recipients to retry." };
    }

    const user = await User.findById(session.userId);
    if (!user || !user.emailConfig) return { error: "Email configuration missing." };

    const appPassword = decrypt(user.emailConfig.appPassword);
    const transporter = createTransporter({
      fromEmail: user.emailConfig.fromEmail,
      appPassword,
      host: user.emailConfig.host,
      port: user.emailConfig.port,
      secure: user.emailConfig.secure,
    });

    campaign.status = "sending";
    await campaign.save();

    // Pass stored attachment from campaign document
    processEmails(
      transporter,
      campaignId,
      failedRecipients,
      campaign.subject,
      campaign.body,
      user.name,
      campaign.attachmentPath || undefined,
      campaign.attachmentFileName || undefined
    );

    return { success: true };
  } catch (err: any) {
    console.error("Retry failed error:", err);
    return { error: "Failed to initiate retry." };
  }
}

export async function sendAgainToAll(campaignId: string) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) return { error: "Unauthorized" };

    const campaign = await Campaign.findOne({ _id: campaignId, userId: session.userId });
    if (!campaign) return { error: "Campaign not found" };

    const allRecipients = await Recipient.find({ campaignId });

    if (allRecipients.length === 0) {
      return { error: "No recipients found for this campaign." };
    }

    const user = await User.findById(session.userId);
    if (!user || !user.emailConfig) return { error: "Email configuration missing." };

    const appPassword = decrypt(user.emailConfig.appPassword);
    const transporter = createTransporter({
      fromEmail: user.emailConfig.fromEmail,
      appPassword,
      host: user.emailConfig.host,
      port: user.emailConfig.port,
      secure: user.emailConfig.secure,
    });

    // Reset counts for this new wave
    campaign.sentCount = 0;
    campaign.failedCount = 0;
    campaign.status = "sending";
    await campaign.save();

    // Mark all as pending
    await Recipient.updateMany({ campaignId }, { lastStatus: "pending" });

    // Pass stored attachment from campaign document
    processEmails(
      transporter,
      campaignId,
      allRecipients,
      campaign.subject,
      campaign.body,
      user.name,
      campaign.attachmentPath || undefined,
      campaign.attachmentFileName || undefined
    );

    return { success: true };
  } catch (err: any) {
    console.error("Send again error:", err);
    return { error: "Failed to initiate send again." };
  }
}
