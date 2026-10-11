"use client";

import { useEffect, useState, use } from "react";
import { getCampaignById, retryFailedRecipients, sendAgainToAll } from "@/actions/campaign.actions";
import Link from "next/link";
import { format } from "date-fns";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;

  const [campaign, setCampaign] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    const res = await getCampaignById(campaignId);
    if (res.success) {
      setCampaign(res.campaign);
      setRecipients(res.recipients);
    } else {
      setError(res.error || "Failed to load campaign.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Simple polling if sending
    let interval: NodeJS.Timeout;
    if (campaign?.status === "sending") {
      interval = setInterval(load, 3000);
    }
    return () => clearInterval(interval);
  }, [campaignId, campaign?.status]);

  async function handleRetryFailed() {
    setActionLoading(true);
    const res = await retryFailedRecipients(campaignId);
    if (res.error) {
      alert(res.error);
    }
    setActionLoading(false);
    load();
  }

  async function handleSendAgain() {
    if (!confirm("Are you sure you want to resend to ALL recipients?")) return;
    setActionLoading(true);
    const res = await sendAgainToAll(campaignId);
    if (res.error) {
      alert(res.error);
    }
    setActionLoading(false);
    load();
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
      case "sent":
        return <span className="badge badge-success">Success</span>;
      case "sending":
        return (
          <span className="badge badge-warning">
            <span className="spinner" style={{ width: "10px", height: "10px", borderWidth: "2px" }}></span>
            Sending
          </span>
        );
      case "partial_failed":
      case "failed":
        return <span className="badge badge-error">Failed</span>;
      case "pending":
        return <span className="badge badge-warning">Pending</span>;
      default:
        return <span className="badge badge-muted">{status}</span>;
    }
  }

  if (loading && !campaign) return <div>Loading campaign details...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/campaigns" className="text-primary-color text-body-sm" style={{ fontWeight: 500 }}>
          ← Back to Campaigns
        </Link>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-lg)" }}>
          <div>
            <h1 className="text-headline-lg" style={{ marginBottom: "0.25rem" }}>{campaign.title}</h1>
            <p className="text-body-md text-secondary">
              Subject: <strong>{campaign.subject}</strong>
            </p>
            {campaign.attachmentFileName && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", padding: "0.25rem 0.75rem", backgroundColor: "var(--color-surface-low)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-full)", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                <span>📎</span>
                <span>{campaign.attachmentFileName}</span>
              </div>
            )}
          </div>
          <div>{getStatusBadge(campaign.status)}</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginBottom: "var(--space-lg)" }}>
          <div>
            <div className="text-label-sm text-muted uppercase tracking-wide">Total</div>
            <div className="text-headline-md">{campaign.totalRecipients}</div>
          </div>
          <div>
            <div className="text-label-sm text-success uppercase tracking-wide">Sent</div>
            <div className="text-headline-md text-success">{campaign.sentCount}</div>
          </div>
          <div>
            <div className="text-label-sm text-error uppercase tracking-wide">Failed</div>
            <div className="text-headline-md text-error">{campaign.failedCount}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--space-md)" }}>
          <button
            onClick={handleRetryFailed}
            disabled={campaign.failedCount === 0 || campaign.status === "sending" || actionLoading}
            className={`btn btn-secondary ${actionLoading ? "btn-loading" : ""}`}
          >
            ↻ Retry Failed ({campaign.failedCount})
          </button>
          
          <button
            onClick={handleSendAgain}
            disabled={campaign.status === "sending" || actionLoading}
            className={`btn btn-primary ${actionLoading ? "btn-loading" : ""}`}
          >
            ✈️ Send Again to All
          </button>
        </div>
      </div>

      <h2 className="text-headline-md" style={{ marginBottom: "var(--space-md)" }}>Recipients</h2>
      
      <>
        {/* Desktop Table View */}
        <div className="table-wrapper desktop-only">
          <table>
            <thead>
              <tr>
                <th>HR Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Attempt</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((rec) => {
                const lastHistory = rec.sendHistory?.length > 0 
                  ? rec.sendHistory[rec.sendHistory.length - 1] 
                  : null;
                
                return (
                  <tr key={rec._id.toString()}>
                    <td style={{ fontWeight: 500 }}>{rec.hrName || "-"}</td>
                    <td>{rec.companyName || "-"}</td>
                    <td>{rec.email}</td>
                    <td>{rec.role || "-"}</td>
                    <td>
                      {getStatusBadge(rec.lastStatus)}
                      {lastHistory?.errorMessage && (
                        <div className="form-error" style={{ maxWidth: "200px", whiteSpace: "normal" }}>
                          {lastHistory.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="text-muted text-body-sm">
                      {lastHistory?.sentAt 
                        ? format(new Date(lastHistory.sentAt), "MMM d, h:mm a") 
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recipients.map((rec) => {
            const lastHistory = rec.sendHistory?.length > 0 
              ? rec.sendHistory[rec.sendHistory.length - 1] 
              : null;

            return (
              <div key={rec._id.toString()} className="card card-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 className="card-title" style={{ fontSize: "1.125rem", wordBreak: "break-all" }}>{rec.email}</h3>
                  {getStatusBadge(rec.lastStatus)}
                </div>
                
                <div className="grid-2" style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <div>
                    <span className="text-muted">Name:</span> <span style={{ fontWeight: 500 }}>{rec.hrName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted">Company:</span> <span style={{ fontWeight: 500 }}>{rec.companyName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted">Role:</span> <span>{rec.role || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted">Last Attempt:</span> <span>{lastHistory?.sentAt ? format(new Date(lastHistory.sentAt), "MMM d, h:mm a") : "-"}</span>
                  </div>
                </div>

                {lastHistory?.errorMessage && (
                  <div className="alert alert-error" style={{ padding: "0.5rem", fontSize: "0.75rem" }}>
                    {lastHistory.errorMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    </div>
  );
}
