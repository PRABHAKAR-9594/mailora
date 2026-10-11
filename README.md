# 📧 MailOra — Complete Project Documentation

> **MailOra** is a self-hosted bulk email campaign platform built with **Next.js 16**, **MongoDB (Mongoose)**, and **Nodemailer**. It lets users send personalized emails to a list of recipients (e.g., recruiters, HRs) using their own SMTP credentials — with full delivery tracking, retry support, and attachment sending.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Authentication System](#5-authentication-system)
6. [User Profile & Email Configuration](#6-user-profile--email-configuration)
7. [Campaign System](#7-campaign-system)
8. [CSV Recipient Upload](#8-csv-recipient-upload)
9. [Email Sending Engine](#9-email-sending-engine)
10. [Personalization / Templating](#10-personalization--templating)
11. [Attachment Support](#11-attachment-support)
12. [Campaign Tracking & Status](#12-campaign-tracking--status)
13. [Retry & Resend Features](#13-retry--resend-features)
14. [Data Models](#14-data-models)
15. [Server Actions (API Layer)](#15-server-actions-api-layer)
16. [Utility Libraries](#16-utility-libraries)
17. [Pages & Routes](#17-pages--routes)
18. [UI & Components](#18-ui--components)
19. [Security Features](#19-security-features)
20. [Getting Started / Setup Guide](#20-getting-started--setup-guide)

---

## 1. Project Overview

MailOra is designed for **job seekers, freelancers, and outreach professionals** who need to send personalized bulk emails to many recipients (e.g., HR contacts, recruiters, potential clients) without relying on expensive third-party email marketing services.

### Key Highlights

| Feature | Description |
|---|---|
| 🔐 OTP-based Registration | Email verification via a 6-digit OTP before access is granted |
| 📧 BYOS (Bring Your Own SMTP) | Users configure their own Gmail/SMTP credentials |
| 📋 CSV-driven Recipients | Upload a CSV file; each row becomes a recipient |
| 🎯 Email Personalization | Template variables: `{hrName}`, `{companyName}`, `{role}`, `{senderName}` |
| 📎 File Attachments | Attach PDFs, DOCX, images, ZIP files (up to 20 MB) per campaign |
| 📊 Live Delivery Tracking | Real-time sent/failed counters with per-recipient status history |
| 🔄 Retry Failed Emails | One-click retry for all failed recipients |
| ✉️ Resend to All | Re-dispatch the entire campaign to all recipients again |
| 🔒 AES-256 Encryption | SMTP app passwords are encrypted before being stored in the DB |
| 📱 Responsive Design | Mobile card view + desktop table view for all list pages |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB via [Mongoose 9](https://mongoosejs.com/) |
| **Email Sending** | [Nodemailer 10](https://nodemailer.com/) |
| **Authentication** | [iron-session 9](https://github.com/vvo/iron-session) (encrypted cookie sessions) |
| **CSV Parsing** | [PapaParse 5](https://www.papaparse.com/) |
| **Password Hashing** | [bcryptjs 3](https://github.com/dcodeIO/bcrypt.js) |
| **Encryption** | Node.js built-in `crypto` module (AES-256-CBC) |
| **Form Validation** | [react-hook-form 7](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) |
| **Date Formatting** | [date-fns 4](https://date-fns.org/) |
| **Runtime** | Node.js |
| **Styling** | Vanilla CSS (custom design system via CSS variables) |

---

## 3. Folder Structure

```
mailora/
├── src/
│   ├── actions/                   # Next.js Server Actions (API layer)
│   │   ├── auth.actions.ts        # Register, login, OTP verification, logout
│   │   ├── campaign.actions.ts    # Create, fetch, retry, send-again campaigns
│   │   ├── mail.actions.ts        # Core sendEmail wrapper (Nodemailer)
│   │   └── profile.actions.ts    # Get profile, save email SMTP config
│   │
│   ├── app/                       # Next.js App Router pages
│   │   ├── (auth)/                # Unauthenticated route group
│   │   │   ├── login/             # Login page
│   │   │   ├── register/          # Registration page
│   │   │   └── verify-otp/        # OTP verification page
│   │   │
│   │   ├── (dashboard)/           # Authenticated route group (wrapped in DashboardShell)
│   │   │   ├── home/              # Campaign compose / dispatch page
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx       # Campaign history list
│   │   │   │   └── [id]/page.tsx  # Campaign detail & recipient tracking
│   │   │   └── profile/           # User profile & SMTP configuration
│   │   │
│   │   ├── globals.css            # Global design system styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Root landing page
│   │
│   ├── components/
│   │   └── layout/
│   │       ├── DashboardShell.tsx # Outer layout wrapper (Sidebar + Navbar + content)
│   │       ├── Navbar.tsx         # Top navigation bar
│   │       └── Sidebar.tsx        # Side navigation with links
│   │
│   ├── lib/                       # Shared utilities
│   │   ├── csv-parser.ts          # PapaParse CSV processor
│   │   ├── db.ts                  # MongoDB connection singleton
│   │   ├── encrypt.ts             # AES-256-CBC encrypt/decrypt
│   │   ├── mailer.ts              # Nodemailer transporter factory + template engine
│   │   └── session.ts             # iron-session configuration
│   │
│   ├── models/                    # Mongoose data models
│   │   ├── Campaign.ts
│   │   ├── Recipient.ts
│   │   └── User.ts
│   │
│   └── proxy.ts                   # (Misc proxy/utility)
│
├── uploads/
│   └── attachments/               # Attachment files saved to disk by the server
│
├── public/                        # Static assets
├── .env.local                     # Environment configuration
├── next.config.ts
├── tsconfig.json
├── package.json
└── PROJECT_DOCS.md                # This file
```

---

## 4. Environment Variables

Create a `.env.local` file at the project root with the following variables:

```env
# ─── MongoDB ────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mailora

# ─── Session (iron-session) ─────────────────────────────────────────────────
# Must be a long random secret string (at least 32 characters)
SESSION_SECRET=your_super_secret_session_key_here

# ─── SMTP Encryption Key ────────────────────────────────────────────────────
# Used for AES-256 encryption of stored app passwords. Min 32 characters.
ENCRYPTION_KEY=your_32_plus_character_encryption_key_here

# ─── Platform OTP Email (used to send registration OTPs) ────────────────────
OTP_EMAIL=your_platform_email@gmail.com
OTP_EMAIL_PASSWORD=your_gmail_app_password
OTP_EMAIL_HOST=smtp.gmail.com
OTP_EMAIL_PORT=587
```

> **Note:** `OTP_EMAIL` is the platform's own email account used to send verification codes. This is separate from each user's individual SMTP credentials.

---

## 5. Authentication System

**File:** [`src/actions/auth.actions.ts`](src/actions/auth.actions.ts)

MailOra uses a **registration → OTP verification → session login** flow.

### 5.1 Registration (`registerUser`)

1. Validates: name, email (regex), password (min 6 chars), confirm password match.
2. Checks if email is already registered.
3. Hashes password using **bcrypt** (cost factor 10).
4. Generates a **6-digit numeric OTP** with a **10-minute expiry**.
5. Saves the user to MongoDB with `isVerified: false`.
6. Sends OTP via the platform's OTP email transporter (`sendOtpEmail`).

### 5.2 OTP Verification (`verifyOTP`)

1. Finds user by email.
2. Checks OTP match and expiry.
3. Sets `isVerified: true`, clears OTP fields.
4. Creates an **iron-session** cookie with `userId`, `name`, `email`, `isLoggedIn: true`.
5. Session cookie is valid for **7 days**.

### 5.3 Resend OTP (`resendOTP`)

- Generates a new OTP and updates the user document.
- Re-sends the OTP email.

### 5.4 Login (`loginUser`)

1. Validates email + password.
2. Verifies password using bcrypt.
3. Checks `isVerified` flag — unverified users are redirected to verify-otp.
4. Creates session on success.

### 5.5 Logout (`logoutUser`)

- Destroys the iron-session cookie immediately.

### OTP Email Template

The platform sends a styled HTML email containing the 6-digit OTP with Mailora branding. Codes expire after **10 minutes**.

---

## 6. User Profile & Email Configuration

**File:** [`src/actions/profile.actions.ts`](src/actions/profile.actions.ts)

Each user must configure their own SMTP credentials before sending campaigns. This is done from the **Profile** page.

### 6.1 Get Profile (`getProfile`)

- Returns user's name, email, and SMTP config (host, port, secure, fromEmail).
- **The stored app password is NEVER returned to the client** — it stays encrypted server-side only.

### 6.2 Save Email Config (`saveEmailConfig`)

1. Reads: `fromEmail`, `appPassword`, `host`, `port`, `secure` from FormData.
2. **Pre-validates SMTP credentials** by calling `verifyTransporter()` — this performs a real SMTP connection test via Nodemailer's `transporter.verify()`.
3. If verification fails, returns an error without saving anything.
4. On success: encrypts the `appPassword` using **AES-256-CBC** (see [Security](#19-security-features)) and saves to MongoDB.

### SMTP Fields

| Field | Description | Example |
|---|---|---|
| `fromEmail` | The sender email address | `john@gmail.com` |
| `appPassword` | Gmail App Password or SMTP password | `xxxx xxxx xxxx xxxx` |
| `host` | SMTP host | `smtp.gmail.com` |
| `port` | SMTP port | `587` or `465` |
| `secure` | Use SSL/TLS | `true` for port 465, `false` for 587 |

---

## 7. Campaign System

**File:** [`src/actions/campaign.actions.ts`](src/actions/campaign.actions.ts)

### 7.1 Create & Send Campaign (`createCampaignAndSend`)

This is the primary action triggered when the user submits the "Dispatch Campaign" form.

**Step-by-step flow:**

```
FormData submitted
  ↓
Session auth check
  ↓
Validate required fields (title, subject, body, csvContent)
  ↓
Parse CSV → extract recipient list
  ↓
Fetch user's email config from DB
  ↓
Decrypt SMTP app password
  ↓
Create Nodemailer transporter
  ↓
Save attachment to disk (if provided)
  ↓
Insert Campaign document to MongoDB (status: "sending")
  ↓
Bulk insert Recipient documents (lastStatus: "pending")
  ↓
Trigger processEmails() asynchronously (non-blocking)
  ↓
Return campaignId to client → redirect to campaign detail page
```

> **Key design:** Email sending is **non-blocking** — the server action returns immediately after creating the DB records, and the actual email loop runs in the background. The client is redirected to the campaign detail page which polls for live progress.

### 7.2 Background Email Processing (`processEmails`)

This internal async function handles the actual sending loop:

1. Iterates over each recipient.
2. Personalizes the subject and body using `buildPersonalizedContent()`.
3. Converts newlines (`\n`) to `<br/>` for proper HTML rendering.
4. Calls `sendEmail()` from `mail.actions.ts`.
5. Appends a `sendHistory` entry to the Recipient document.
6. Updates Campaign's `sentCount` / `failedCount` after each email — providing **live progress** visible via polling.
7. After all emails, sets the Campaign status:
   - `"completed"` — all sent successfully
   - `"partial_failed"` — some sent, some failed
   - `"failed"` — all failed (implicit via `partial_failed` logic)

### 7.3 Get All Campaigns (`getCampaigns`)

- Fetches all campaigns owned by the current user.
- Sorted by `createdAt` descending (newest first).
- Returns lean MongoDB documents (serialized as JSON).

### 7.4 Get Campaign by ID (`getCampaignById`)

- Fetches a single campaign and all its recipient documents.
- Auth-checked: users can only view their own campaigns.

---

## 8. CSV Recipient Upload

**File:** [`src/lib/csv-parser.ts`](src/lib/csv-parser.ts)

### How It Works

The user uploads a `.csv` file on the compose page. The file is read client-side via `FileReader` and its text content is sent to the server action as a string.

On the server, `parseCSV()` uses **PapaParse** to process the CSV:

- Headers are normalized: trimmed, lowercased, spaces removed.
- Requires at least an `email` column (also accepts `emailaddress` or `e-mail`).
- Empty rows are skipped.
- Extra/unknown columns are stored in the `notes` field of the recipient.

### Accepted CSV Columns

| Column Name (case-insensitive) | Aliases | Description |
|---|---|---|
| `email` | `emailaddress`, `e-mail` | **Required.** Recipient email |
| `companyName` | `company` | Company name |
| `hrName` | `hr`, `name` | Recipient's name (used in personalization) |
| `role` | `jobtitle`, `position` | Job role being applied to |
| `contactNo` | `phone`, `contact` | Phone number |
| *(any other column)* | — | Stored as notes |

### Sample CSV Format

```csv
email,companyName,hrName,role,contactNo
hr@techcorp.com,TechCorp,Alice Johnson,Frontend Engineer,+1-555-0101
recruit@startup.io,StartupIO,Bob Smith,Full Stack Developer,+1-555-0202
```

> A sample CSV template can be downloaded from the compose page via the **"⬇ Download Sample CSV"** button.

---

## 9. Email Sending Engine

**Files:** [`src/lib/mailer.ts`](src/lib/mailer.ts), [`src/actions/mail.actions.ts`](src/actions/mail.actions.ts)

### 9.1 Transporter Factory (`createTransporter`)

Creates a Nodemailer SMTP transport using the user's own credentials:

```typescript
nodemailer.createTransport({
  host, port, secure,
  auth: { user: fromEmail, pass: appPassword }
})
```

### 9.2 SMTP Verification (`verifyTransporter`)

Before saving SMTP config, the system calls `transporter.verify()` to confirm the credentials actually work. If the SMTP server rejects the connection, the config is not saved and the user gets a descriptive error.

### 9.3 OTP Transporter (`createOtpTransporter`)

A separate Nodemailer transporter using the **platform's own email credentials** (from `.env.local`), used exclusively for sending OTP verification emails during registration.

### 9.4 Sending an Email (`sendEmail`)

Accepts a pre-created transporter, recipient email, personalized subject, personalized HTML body, and optional attachment. Returns `{ success: true }` or `{ success: false, error: string }`.

---

## 10. Personalization / Templating

**File:** [`src/lib/mailer.ts`](src/lib/mailer.ts) — `buildPersonalizedContent()`

Both the email **subject** and **body** support template variables that are replaced with actual recipient data at send time.

### Supported Variables

| Variable | Replaced With |
|---|---|
| `{hrName}` | Recipient's HR/contact name from CSV |
| `{companyName}` | Company name from CSV |
| `{role}` | Job role from CSV |
| `{senderName}` | The logged-in user's name |

### Example

**Template:**
```
Subject: Application for {role} at {companyName}

Hi {hrName},

I'm excited to apply for the {role} position at {companyName}.
Best regards,
{senderName}
```

**After personalization (for Alice at TechCorp):**
```
Subject: Application for Frontend Engineer at TechCorp

Hi Alice Johnson,

I'm excited to apply for the Frontend Engineer position at TechCorp.
Best regards,
John Doe
```

---

## 11. Attachment Support

**Files:** [`src/actions/campaign.actions.ts`](src/actions/campaign.actions.ts), [`uploads/attachments/`](uploads/attachments/)

### How Attachments Work

1. User selects a file on the compose page (optional).
2. Client-side validates file size ≤ **20 MB**.
3. File is sent via `FormData` to the server action.
4. Server saves the file to `uploads/attachments/` with a unique timestamped filename.
5. The disk path and original filename are stored in the Campaign document.
6. Every email in the campaign includes this attachment via Nodemailer's `attachments` array.

### Supported File Types

- `.pdf` — PDF documents
- `.doc`, `.docx` — Microsoft Word documents
- `.txt` — Plain text files
- `.png`, `.jpg`, `.jpeg` — Images
- `.zip` — Compressed archives

### Attachment Persistence

The attachment file is stored **once on disk** and reused for all retry and resend operations — no need to re-upload the file for retries.

---

## 12. Campaign Tracking & Status

### Campaign Statuses

| Status | Description |
|---|---|
| `draft` | Campaign created but not yet started (reserved for future use) |
| `sending` | Email sending is currently in progress |
| `completed` | All emails sent successfully |
| `partial_failed` | Some emails sent, some failed |

### Recipient Statuses

| Status | Description |
|---|---|
| `pending` | Not yet attempted |
| `sent` | Successfully delivered to SMTP server |
| `failed` | Send attempt failed; error message recorded |

### Send History

Each recipient maintains a `sendHistory` array — a complete log of every send attempt, including:
- `sentAt` — exact timestamp
- `status` — `"sent"` or `"failed"`
- `errorMessage` — the SMTP error message if failed

This allows full audit of every delivery attempt across retries.

### Live Progress Polling

The Campaign Detail page (`/campaigns/[id]`) automatically polls every **3 seconds** while the campaign status is `"sending"`, giving the user a real-time view of sent/failed counts.

---

## 13. Retry & Resend Features

### 13.1 Retry Failed Recipients (`retryFailedRecipients`)

- **Trigger:** "↻ Retry Failed (N)" button on Campaign Detail page.
- **What it does:** Finds all recipients with `lastStatus: "failed"`, re-creates the Nodemailer transporter, and calls `processEmails()` again — only for the failed ones.
- The original attachment (stored on disk) is reused automatically.
- Campaign status resets to `"sending"` during retry.

### 13.2 Send Again to All (`sendAgainToAll`)

- **Trigger:** "✈️ Send Again to All" button on Campaign Detail page.
- **What it does:** Resets all recipients to `pending` and re-sends to the entire recipient list.
- Resets campaign `sentCount` and `failedCount` to 0 for this new wave.
- Requires confirmation dialog (`window.confirm`) before proceeding.

---

## 14. Data Models

### 14.1 User Model

**File:** [`src/models/User.ts`](src/models/User.ts)

```typescript
interface IUser {
  name: string;           // Display name
  email: string;          // Unique login email (lowercase)
  password: string;       // bcrypt-hashed password
  isVerified: boolean;    // Email verification status
  otp: string | null;     // Current OTP (cleared after use)
  otpExpiresAt: Date | null; // OTP expiry (10 minutes)
  emailConfig: IEmailConfig | null; // Per-user SMTP settings
  createdAt: Date;
  updatedAt: Date;
}

interface IEmailConfig {
  fromEmail: string;      // SMTP sender address
  appPassword: string;    // AES-256 encrypted app password
  host: string;           // SMTP host (e.g., smtp.gmail.com)
  port: number;           // SMTP port (e.g., 587, 465)
  secure: boolean;        // true for SSL (port 465), false for TLS (port 587)
}
```

### 14.2 Campaign Model

**File:** [`src/models/Campaign.ts`](src/models/Campaign.ts)

```typescript
interface ICampaign {
  userId: ObjectId;           // Owner reference
  title: string;              // Campaign display name
  subject: string;            // Email subject template
  body: string;               // Email body template (HTML)
  csvFileName: string;        // Original uploaded CSV file name
  attachmentPath?: string;    // Absolute disk path to attachment file
  attachmentFileName?: string;// Original attachment filename shown to recipients
  totalRecipients: number;    // Total count from CSV
  sentCount: number;          // Successfully sent so far
  failedCount: number;        // Failed sends so far
  status: CampaignStatus;     // 'draft' | 'sending' | 'completed' | 'partial_failed'
  createdAt: Date;
  updatedAt: Date;
}
```

### 14.3 Recipient Model

**File:** [`src/models/Recipient.ts`](src/models/Recipient.ts)

```typescript
interface IRecipient {
  campaignId: ObjectId;       // Parent campaign reference
  userId: ObjectId;           // Owner reference
  // From CSV:
  email: string;
  companyName: string;
  hrName: string;
  role: string;
  contactNo: string;
  notes: string;              // Extra CSV columns concatenated as key: value
  // Tracking:
  sendHistory: ISendHistoryEntry[]; // Full log of every send attempt
  lastStatus: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface ISendHistoryEntry {
  sentAt: Date;
  status: 'sent' | 'failed';
  errorMessage: string | null;
}
```

---

## 15. Server Actions (API Layer)

MailOra uses **Next.js Server Actions** instead of a traditional REST API. All mutations and queries happen through these server-side functions called directly from React components.

| Action File | Functions | Purpose |
|---|---|---|
| `auth.actions.ts` | `registerUser`, `verifyOTP`, `resendOTP`, `loginUser`, `logoutUser` | Full auth lifecycle |
| `profile.actions.ts` | `getProfile`, `saveEmailConfig` | User & SMTP config management |
| `campaign.actions.ts` | `createCampaignAndSend`, `getCampaigns`, `getCampaignById`, `retryFailedRecipients`, `sendAgainToAll` | Campaign CRUD + sending |
| `mail.actions.ts` | `sendEmail` | Core email dispatch wrapper |

---

## 16. Utility Libraries

### 16.1 Database Connection (`src/lib/db.ts`)

Singleton MongoDB connection using Mongoose. Caches the connection across hot-reloads in development to prevent connection pool exhaustion.

### 16.2 Encryption (`src/lib/encrypt.ts`)

Encrypts and decrypts user SMTP app passwords.

- **Algorithm:** AES-256-CBC
- **Key derivation:** `crypto.scryptSync(ENCRYPTION_KEY, 'mailora-salt', 32)` — derives a 32-byte key from the env variable.
- **Storage format:** `<iv_hex>:<encrypted_hex>` (IV is randomly generated per encryption).
- **Decryption:** The stored IV is extracted and used to decrypt.

### 16.3 Session Management (`src/lib/session.ts`)

Uses **iron-session** to create signed + encrypted HTTP-only cookies.

```typescript
interface SessionData {
  userId: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}
```

- Cookie name: `mailora_session`
- Max age: **7 days**
- `httpOnly: true` — not accessible via JavaScript
- `secure: true` in production (HTTPS only)
- `sameSite: 'lax'`

### 16.4 CSV Parser (`src/lib/csv-parser.ts`)

Wraps PapaParse with Mailora-specific validation: requires an `email` column, normalizes headers, filters out rows without valid email addresses, and returns typed `ParsedRecipient[]`.

### 16.5 Mailer (`src/lib/mailer.ts`)

- `createTransporter()` — user SMTP transporter factory
- `verifyTransporter()` — SMTP credential pre-validation
- `createOtpTransporter()` — platform OTP email transporter
- `buildPersonalizedContent()` — template variable replacement engine

---

## 17. Pages & Routes

### Route Groups

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Root landing page |
| `/login` | No | Login form |
| `/register` | No | Registration form |
| `/verify-otp` | No | OTP entry form |
| `/home` | ✅ Yes | Compose & dispatch a new campaign |
| `/campaigns` | ✅ Yes | Campaign history list |
| `/campaigns/[id]` | ✅ Yes | Campaign detail, recipient table, retry/resend |
| `/profile` | ✅ Yes | User info & SMTP email configuration |

### Dashboard Shell

All authenticated routes are wrapped in `DashboardShell`, which renders:
- `Sidebar` — Left navigation with links to Home, Campaigns, Profile
- `Navbar` — Top bar with user info and logout
- Page content area

---

## 18. UI & Components

### Design System

The app uses a **custom CSS design system** via global CSS variables defined in `src/app/globals.css`:

- Color tokens (primary, surface, error, success, warning, muted, border)
- Typography scale (headline-lg, headline-md, body-md, body-sm, label-sm)
- Spacing scale (sm, md, lg, xl, 2xl)
- Border radius tokens (sm, md, lg, full)
- Component classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-loading`
- Form classes: `.form-input`, `.form-label`, `.form-textarea`, `.form-hint`, `.form-error`
- Card classes: `.card`, `.card-sm`
- Badge classes: `.badge`, `.badge-success`, `.badge-error`, `.badge-warning`, `.badge-muted`
- Alert classes: `.alert`, `.alert-error`
- Spinner: `.spinner` (CSS animation)

### Responsive Layout

- `.desktop-only` — shown only on larger screens (table views)
- `.mobile-only` — shown on small screens (card views)
- Campaign list and recipient list both have **separate desktop table layouts and mobile card layouts**.

---

## 19. Security Features

| Security Measure | Implementation |
|---|---|
| Password hashing | bcrypt with salt factor 10 |
| Email verification | 6-digit OTP, 10-minute expiry |
| Session management | iron-session (signed + encrypted HTTP-only cookie, 7-day TTL) |
| SMTP password encryption | AES-256-CBC with scrypt-derived key |
| App password never exposed | Profile API omits `appPassword` from response |
| SMTP pre-validation | Credentials verified via `transporter.verify()` before saving |
| Authorization checks | All server actions verify `session.isLoggedIn` and `session.userId` |
| Campaign ownership | Queries always filter by both campaign `_id` AND `userId` |
| Filename sanitization | Attachment filenames are sanitized (alphanumeric + `_-`) and made unique with timestamps |
| Client-side file validation | File type and size limits enforced before upload |

---

## 20. Getting Started / Setup Guide

### Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Gmail account with **App Password** enabled (for OTP sending)
- A Gmail/SMTP account for users to configure (can be the same)

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd mailora
npm install
```

### Step 2: Configure Environment

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mailora
SESSION_SECRET=some_long_random_secret_at_least_32_chars
ENCRYPTION_KEY=another_long_random_key_at_least_32_chars
OTP_EMAIL=your_gmail@gmail.com
OTP_EMAIL_PASSWORD=your_gmail_app_password
OTP_EMAIL_HOST=smtp.gmail.com
OTP_EMAIL_PORT=587
```

### Step 3: Enable Gmail App Password

1. Go to your Google Account → Security
2. Enable **2-Step Verification**
3. Go to **App Passwords** → Generate one for "Mail"
4. Use that 16-character password as `OTP_EMAIL_PASSWORD`

### Step 4: Run in Development

```bash
npm run dev
```

App runs at `http://localhost:3000`

### Step 5: Register & Configure

1. Navigate to `/register` and create an account.
2. Check your email for the OTP and verify.
3. Go to **Profile** → fill in your SMTP settings.
4. Go to **Home** → upload a CSV and dispatch your first campaign.

### Step 6: Production Build

```bash
npm run build
npm start
```

### CSV Template

Download the sample CSV from the compose page (`/home` → "⬇ Download Sample CSV") or create a file with these columns:

```csv
email,companyName,hrName,role,contactNo
recipient@company.com,Company Name,HR Person Name,Job Title,Phone Number
```

---

## Summary of All Features

```
MailOra Feature Map
├── 🔐 Authentication
│   ├── User Registration (name, email, password)
│   ├── Email OTP Verification (6-digit, 10-min expiry)
│   ├── OTP Resend
│   ├── Login (email + password)
│   └── Logout (session destroy)
│
├── 👤 User Profile
│   ├── View profile info
│   └── Configure SMTP email settings (with live validation)
│
├── 📧 Campaign Compose (/home)
│   ├── Set campaign title
│   ├── Write personalized email subject & body
│   ├── Upload recipient CSV
│   ├── Attach optional file (PDF, DOCX, etc., ≤20MB)
│   └── Dispatch campaign
│
├── 📊 Campaign Management
│   ├── View all past campaigns (list with status & progress)
│   ├── View campaign detail (subject, status, counts)
│   ├── View per-recipient status (HR name, company, email, role, status)
│   ├── View send history per recipient (full audit log)
│   ├── Retry failed recipients only
│   └── Resend campaign to all recipients
│
├── ⚙️ Email Engine
│   ├── Personalized subject & body per recipient
│   ├── Template variables: {hrName}, {companyName}, {role}, {senderName}
│   ├── Attachment support (reused across retries)
│   ├── Live delivery progress (polling every 3s)
│   └── Per-recipient error tracking
│
└── 🔒 Security
    ├── bcrypt password hashing
    ├── OTP email verification
    ├── iron-session encrypted cookies
    ├── AES-256-CBC SMTP password encryption
    ├── Credentials never exposed to client
    ├── Session-based authorization on all actions
    └── Campaign ownership enforcement
```

---

*Documentation generated: October 2026 | MailOra v0.1.0*
