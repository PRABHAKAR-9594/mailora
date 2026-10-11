"use client";

import { useState, useEffect, Suspense } from "react";
import { verifyOTP, resendOTP } from "@/actions/auth.actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("email", email);
    
    const res = await verifyOTP(formData);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      router.push("/home");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("email", email);

    const res = await resendOTP(formData);
    
    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      setSuccessMsg("A new verification code has been sent to your email.");
    }
    setResending(false);
  }

  return (
    <div className="auth-page">
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="card-header" style={{ textAlign: "center", borderBottom: "none" }}>
          <h1 className="text-headline-lg">Verify Email</h1>
          <p className="card-description">
            We've sent a 6-digit code to <br />
            <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="otp">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              name="otp"
              className="form-input"
              placeholder="123456"
              maxLength={6}
              style={{ textAlign: "center", letterSpacing: "0.25em", fontSize: "1.25rem", fontWeight: 600 }}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full ${loading ? "btn-loading" : ""}`}
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            Verify Account
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p className="text-body-sm text-secondary">
            Didn't receive the code?{" "}
            <button
              type="button"
              className="btn-ghost"
              style={{ fontWeight: 500, padding: 0, border: "none", backgroundColor: "transparent", color: "var(--color-primary)", cursor: "pointer" }}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend"}
            </button>
          </p>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/login" className="text-body-sm text-secondary hover:text-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
