"use client";

import { useEffect, useState } from "react";
import { getProfile, saveEmailConfig } from "@/actions/profile.actions";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-fill port based on host
  const handleHostChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const portInput = document.getElementById("port") as HTMLInputElement;
    const secureSelect = document.getElementById("secure") as HTMLSelectElement;
    if (!portInput || !secureSelect) return;

    if (val.includes("gmail.com")) {
      portInput.value = "587";
      secureSelect.value = "false";
    } else if (val.includes("office365.com") || val.includes("outlook.com")) {
      portInput.value = "587";
      secureSelect.value = "false";
    }
  };

  useEffect(() => {
    async function load() {
      const res = await getProfile();
      if (res.success) {
        setProfile(res.user);
      } else {
        setError(res.error || "Failed to load profile.");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const res = await saveEmailConfig(formData);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setSuccess("Email configuration verified and saved successfully!");
      // Reload profile to reflect saved state if needed
      const profRes = await getProfile();
      if (profRes.success) setProfile(profRes.user);
    }
    setSaving(false);
  }

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account and email sending credentials.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          {success}
        </div>
      )}

      {/* Section 1: Personal Info */}
      <section className="card" style={{ marginBottom: "var(--space-xl)" }}>
        <div className="card-header">
          <h2 className="card-title">Personal Information</h2>
          <p className="card-description">Your basic account details.</p>
        </div>
        <div className="grid-2">
          <div>
            <label className="form-label text-muted">Full Name</label>
            <p className="text-body-md" style={{ fontWeight: 500, marginTop: "0.25rem" }}>
              {profile?.name}
            </p>
          </div>
          <div>
            <label className="form-label text-muted">Email Address</label>
            <p className="text-body-md" style={{ fontWeight: 500, marginTop: "0.25rem" }}>
              {profile?.email}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Email Config */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">SMTP Configuration</h2>
          <p className="card-description">
            Connect your email account to send bulk emails. We use AES-256 encryption to securely store your App Password.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="fromEmail">Sender Email</label>
              <input
                type="email"
                id="fromEmail"
                name="fromEmail"
                className="form-input"
                placeholder="you@gmail.com"
                defaultValue={profile?.emailConfig?.fromEmail || ""}
                required
              />
              <span className="form-hint">The email address your campaigns will be sent from.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="appPassword">App Password</label>
              <input
                type="password"
                id="appPassword"
                name="appPassword"
                className="form-input"
                placeholder={profile?.emailConfig ? "•••••••• (Saved)" : "Enter 16-digit app password"}
                required={!profile?.emailConfig}
              />
              <span className="form-hint">Do not use your main password. Create an App Password.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="host">SMTP Host</label>
              <select 
                id="host" 
                name="host" 
                className="form-select" 
                defaultValue={profile?.emailConfig?.host || ""} 
                onChange={handleHostChange}
                required
              >
                <option value="" disabled>Select Provider</option>
                <option value="smtp.gmail.com">Google Workspace / Gmail (smtp.gmail.com)</option>
                <option value="smtp.office365.com">Microsoft 365 / Outlook (smtp.office365.com)</option>
                <option value="smtp.mail.yahoo.com">Yahoo (smtp.mail.yahoo.com)</option>
                <option value="custom">Custom SMTP Server</option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="port">Port</label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  className="form-input"
                  placeholder="587"
                  defaultValue={profile?.emailConfig?.port || "587"}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="secure">Connection Security</label>
                <select 
                  id="secure" 
                  name="secure" 
                  className="form-select"
                  defaultValue={profile?.emailConfig?.secure ? "true" : "false"}
                >
                  <option value="false">STARTTLS (Port 587)</option>
                  <option value="true">SSL/TLS (Port 465)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className={`btn btn-primary ${saving ? "btn-loading" : ""}`}
              disabled={saving}
            >
              Verify & Save Configuration
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
