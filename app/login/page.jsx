"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6efe6]">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-[#ae7189] px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7ecd0]">
            <BagIcon className="h-5 w-5 text-[#5a3a49]" />
          </span>
          <span className="font-playfair text-2xl text-white">Storelo</span>
        </div>
        <Link
          href="/"
          className="text-sm text-white/90 transition hover:text-white"
        >
          ← Back to Store
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#fbf6ee] via-[#f6efe6] to-[#efe2d4] px-5 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-[#ae7189]/10 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f7ecd0]">
              <BagIcon className="h-8 w-8 text-[#5a3a49]" />
            </span>
            <p className="mt-2 font-playfair text-xl text-[#ae7189]">Storelo</p>
            <h1 className="mt-4 font-playfair text-3xl text-[#1f2119]">
              Welcome Back, Admin
            </h1>
            <p className="mt-2 text-sm text-[#6b675e]">
              Sign in to manage your store
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#1f2119]"
              >
                Admin Email
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-[#e5dccf] bg-white px-4 py-3 focus-within:border-[#ae7189] focus-within:ring-2 focus-within:ring-[#ae7189]/20">
                <MailIcon className="h-5 w-5 shrink-0 text-[#9a9486]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-black outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#1f2119]"
              >
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-[#e5dccf] bg-white px-4 py-3 focus-within:border-[#ae7189] focus-within:ring-2 focus-within:ring-[#ae7189]/20">
                <LockIcon className="h-5 w-5 shrink-0 text-[#9a9486]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-black outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-[#9a9486] transition hover:text-[#1f2119]"
                >
                  <EyeIcon className="h-5 w-5" off={showPassword} />
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#ae7189] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#9a5f77] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In to Dashboard"}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-[#8b8679]">
            <LockIcon className="h-4 w-4" />
            Secure admin access
          </p>
        </div>
      </main>
    </div>
  );
}

/* ---------- Small inline icons (no extra package needed) ---------- */

function BagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ className, off }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}