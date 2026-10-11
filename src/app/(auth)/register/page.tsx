"use client";

import { useState } from "react";
import { registerUser } from "@/actions/auth.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await registerUser(formData);

    if (res.error) {
      setError(res.error);
    } else if (res.success && res.email) {
      router.push(`/verify-otp?email=${encodeURIComponent(res.email)}`);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="card-header" style={{ textAlign: "center", borderBottom: "none" }}>
          <h1 className="text-headline-lg">Create an Account</h1>
          <p className="card-description">Join Mailora to automate your job outreach.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full ${loading ? "btn-loading" : ""}`}
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            Sign Up
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p className="text-body-sm text-secondary">
            Already have an account?{" "}
            <Link href="/login" style={{ fontWeight: 500 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
