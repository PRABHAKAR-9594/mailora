"use client";

import { useEffect, useState } from "react";
import { getCampaigns } from "@/actions/campaign.actions";
import Link from "next/link";
import { format } from "date-fns";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getCampaigns();
      if (res.success) setCampaigns(res.campaigns);
      else setError(res.error || "Failed to load campaigns.");
      setLoading(false);
    }
    load();
  }, []);

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <span className="badge badge-success">Completed</span>;
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
      default:
        return <span className="badge badge-muted">{status}</span>;
    }
  }

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Campaign History</h1>
          <p className="page-subtitle">View and track all your bulk email campaigns.</p>
        </div>
        <Link href="/home" className="btn btn-primary">
          + New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <span style={{ fontSize: "3rem" }}>📬</span>
          <h2 className="text-headline-md" style={{ marginTop: "1rem" }}>No campaigns yet</h2>
          <p className="text-body-md text-secondary" style={{ marginBottom: "1.5rem" }}>
            You haven't sent any email campaigns yet.
          </p>
          <Link href="/home" className="btn btn-primary">
            Create your first campaign
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-wrapper desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp._id.toString()}>
                    <td style={{ fontWeight: 500 }}>{camp.title}</td>
                    <td>{getStatusBadge(camp.status)}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8125rem" }}>
                        <span className="text-success">Sent: {camp.sentCount}</span>
                        <span className="text-error">Failed: {camp.failedCount}</span>
                        <span className="text-muted">Total: {camp.totalRecipients}</span>
                      </div>
                    </td>
                    <td className="text-muted text-body-sm">
                      {format(new Date(camp.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td>
                      <Link href={`/campaigns/${camp._id.toString()}`} className="btn btn-secondary btn-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {campaigns.map((camp) => (
              <div key={camp._id.toString()} className="card card-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 className="card-title" style={{ fontSize: "1.125rem" }}>{camp.title}</h3>
                  {getStatusBadge(camp.status)}
                </div>
                
                <div className="text-muted text-body-sm" style={{ marginBottom: "1rem" }}>
                  {format(new Date(camp.createdAt), "MMM d, yyyy h:mm a")}
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8125rem", padding: "0.75rem", backgroundColor: "var(--color-surface-low)", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                  <span className="text-success">Sent: <strong>{camp.sentCount}</strong></span>
                  <span className="text-error">Failed: <strong>{camp.failedCount}</strong></span>
                  <span className="text-muted">Total: <strong>{camp.totalRecipients}</strong></span>
                </div>
                
                <Link href={`/campaigns/${camp._id.toString()}`} className="btn btn-secondary btn-full">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
