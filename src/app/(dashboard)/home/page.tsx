"use client";

import { useState } from "react";
import { createCampaignAndSend } from "@/actions/campaign.actions";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [csvContent, setCsvContent] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 20MB guard on client
    if (file.size > 20 * 1024 * 1024) {
      setError("Attachment must be under 20MB.");
      return;
    }
    setAttachmentFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!csvContent) {
      setError("Please upload a CSV file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("csvContent", csvContent);
    formData.append("csvFileName", csvFileName);

    // Attach file as a real File object — server action will write it to disk
    if (attachmentFile) {
      formData.append("attachment", attachmentFile);
    }

    const res = await createCampaignAndSend(formData);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.success && res.campaignId) {
      router.push(`/campaigns/${res.campaignId}`);
    }
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div className="page-header" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Dispatch Campaign</h1>
          <p className="page-subtitle">Send personalized bulk emails to recruiters and HRs.</p>
        </div>
        <a href="/sample-template.csv" download className="btn btn-secondary">
          ⬇ Download Sample CSV
        </a>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label" htmlFor="title">Campaign Title</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-input"
            placeholder="e.g. Frontend Engineer Outreach - Nov 2026"
            required
          />
        </div>

        <div className="divider"></div>

        <div className="form-group">
          <label className="form-label" htmlFor="subject">Email Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            className="form-input"
            placeholder="Application for {role} at {companyName}"
            required
          />
          <span className="form-hint">Supports: {"{hrName}"}, {"{companyName}"}, {"{role}"}</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="body">Email Body</label>
          <textarea
            id="body"
            name="body"
            className="form-textarea"
            placeholder="Hi {hrName},&#10;&#10;I am writing to express my interest in the {role} position at {companyName}..."
            style={{ minHeight: "250px" }}
            required
          ></textarea>
          <span className="form-hint">Supports: {"{hrName}"}, {"{companyName}"}, {"{role}"}, {"{senderName}"}</span>
        </div>

        <div className="divider"></div>

        <div className="form-group">
          <label className="form-label">Upload Recipients (CSV)</label>
          <div
            style={{
              border: "2px dashed var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-xl)",
              textAlign: "center",
              backgroundColor: "var(--color-surface-low)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
            {csvFileName ? (
              <div>
                <span style={{ fontSize: "2rem" }}>📄</span>
                <p className="text-body-md" style={{ marginTop: "var(--space-sm)", fontWeight: 500 }}>
                  {csvFileName}
                </p>
                <p className="text-body-sm text-secondary">Click or drag to replace file</p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: "2rem" }}>📤</span>
                <p className="text-body-md" style={{ marginTop: "var(--space-sm)", fontWeight: 500 }}>
                  Click to upload CSV or drag and drop
                </p>
                <p className="text-body-sm text-secondary">Make sure it has an 'email' column.</p>
              </div>
            )}
          </div>
        </div>

        <div className="divider"></div>

        {/* Attachment Upload */}
        <div className="form-group">
          <label className="form-label">
            Attachment <span className="text-muted text-body-sm" style={{ fontWeight: 400 }}>(Optional — PDF, DOCX, etc. max 20MB)</span>
          </label>
          <div
            style={{
              border: "2px dashed var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-lg)",
              textAlign: "center",
              backgroundColor: "var(--color-surface-low)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
              onChange={handleAttachmentUpload}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
            {attachmentFile ? (
              <div>
                <span style={{ fontSize: "2rem" }}>📎</span>
                <p className="text-body-md" style={{ marginTop: "var(--space-sm)", fontWeight: 500 }}>
                  {attachmentFile.name}
                </p>
                <p className="text-body-sm text-secondary">
                  {(attachmentFile.size / 1024).toFixed(1)} KB — Click to replace
                </p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: "2rem" }}>📎</span>
                <p className="text-body-md" style={{ marginTop: "var(--space-sm)", fontWeight: 500 }}>
                  Click to attach a file
                </p>
                <p className="text-body-sm text-secondary">
                  PDF, DOCX, TXT, images, ZIP supported
                </p>
              </div>
            )}
          </div>
          {attachmentFile && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: "0.5rem", color: "var(--color-error-text)" }}
              onClick={() => setAttachmentFile(null)}
            >
              ✕ Remove attachment
            </button>
          )}
        </div>

        <div style={{ marginTop: "var(--space-xl)", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className={`btn btn-primary btn-lg ${loading ? "btn-loading" : ""}`}
            disabled={loading || !csvContent}
            style={{ minWidth: "200px" }}
          >
            {loading ? "Preparing..." : "Send Campaign Now"}
          </button>
        </div>
      </form>
    </div>
  );
}
