import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mailora — Bulk Email for Job Seekers",
    template: "%s | Mailora",
  },
  description:
    "Mailora helps job seekers automate bulk outreach emails to companies using their own email credentials. Upload a CSV, craft your message, and send to hundreds of HR contacts instantly.",
  keywords: ["bulk email", "job search", "email automation", "job outreach", "HR email"],
  authors: [{ name: "Mailora" }],
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
