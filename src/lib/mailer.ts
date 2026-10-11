import nodemailer, { Transporter } from "nodemailer";

export interface MailerConfig {
  fromEmail: string;
  appPassword: string; // already decrypted
  host: string;
  port: number;
  secure: boolean;
}

/**
 * Creates a Nodemailer transporter using the user's own SMTP credentials.
 */
export function createTransporter(config: MailerConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.fromEmail,
      pass: config.appPassword,
    },
  });
}

/**
 * Verifies the SMTP connection without sending any email.
 * Returns true if credentials are valid, throws an error if not.
 */
export async function verifyTransporter(config: MailerConfig): Promise<void> {
  const transporter = createTransporter(config);
  await transporter.verify();
}

/**
 * Creates a transporter using the platform's own OTP email account.
 */
export function createOtpTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.OTP_EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.OTP_EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.OTP_EMAIL,
      pass: process.env.OTP_EMAIL_PASSWORD,
    },
  });
}

/**
 * Replaces template variables in subject/body with actual recipient data.
 * Supported: {hrName}, {companyName}, {role}, {senderName}
 */
export function buildPersonalizedContent(
  template: string,
  vars: {
    hrName?: string;
    companyName?: string;
    role?: string;
    senderName?: string;
  }
): string {
  return template
    .replace(/\{hrName\}/g, vars.hrName || "")
    .replace(/\{companyName\}/g, vars.companyName || "")
    .replace(/\{role\}/g, vars.role || "")
    .replace(/\{senderName\}/g, vars.senderName || "");
}
