"use server";

import { Transporter } from "nodemailer";

export async function sendEmail(
  transporter: Transporter,
  to: string,
  subject: string,
  html: string,
  attachmentPath?: string,
  attachmentFileName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = (transporter.options as any).auth?.user;

    const mailOptions: any = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    // Attach file if provided
    if (attachmentPath && attachmentFileName) {
      mailOptions.attachments = [
        {
          filename: attachmentFileName,
          path: attachmentPath,
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
