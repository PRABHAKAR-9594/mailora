"use client";

import { useState } from "react";
import { loginUser } from "@/actions/auth.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginUser(formData);

    if (res.error) {
      setError(res.error);
      if (res.unverifiedEmail) {
        router.push(`/verify-otp?email=${encodeURIComponent(res.unverifiedEmail)}`);
      }
    } else if (res.success) {
      router.push("/home");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="card-header" style={{ textAlign: "center", borderBottom: "none" }}>
          <h1 className="text-headline-lg">Welcome Back</h1>
          <p className="card-description">Sign in to Mailora to continue.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="name@company.com"
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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full ${loading ? "btn-loading" : ""}`}
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            Sign In
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p className="text-body-sm text-secondary">
            Don't have an account?{" "}
            <Link href="/register" style={{ fontWeight: 500 }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
