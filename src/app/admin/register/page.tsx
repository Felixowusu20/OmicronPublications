"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin-auth-provider";
import {
  AUTH_IMAGES,
  AuthSplitLayout,
} from "@/components/auth-split-layout";
import { PasswordField } from "@/components/password-field";
import { TurnstileField } from "@/components/turnstile-field";
import { turnstileEnabled } from "@/lib/turnstile-public";

export default function AdminRegisterPage() {
  const { register, user, ready } = useAdminAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    institution: "Omicron Publications",
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const needsTurnstile = turnstileEnabled();
  const onToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  useEffect(() => {
    if (ready && user) router.replace("/admin");
  }, [ready, user, router]);

  useEffect(() => {
    void fetch("/api/admin/auth/bootstrap")
      .then((res) => res.json())
      .then((data) => setBootstrapAvailable(Boolean(data.available)))
      .catch(() => setBootstrapAvailable(false))
      .finally(() => setChecking(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (needsTurnstile && !turnstileToken) {
      setError("Please complete the human verification.");
      return;
    }
    setLoading(true);
    const result = await register({
      name: form.name,
      email: form.email,
      password: form.password,
      institution: form.institution,
      turnstileToken,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Registration failed");
      return;
    }
    router.push("/admin");
  }

  return (
    <AuthSplitLayout
      imageSrc={AUTH_IMAGES.adminRegister}
      imageAlt="Focused workspace with laptop"
      brand="Omicron Admin"
      headline="Bootstrap the Omicron publishing control panel."
      subhead="Create the first super admin, then add reviewers."
    >
      <div className="auth-card shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          Bootstrap
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          {bootstrapAvailable ? "Create super admin" : "Admin already set up"}
        </h1>

        {checking ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Checking setup…</p>
        ) : !bootstrapAvailable ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
              A super admin account already exists, so this bootstrap form is
              closed. Sign in with that admin email, or ask the super admin to
              create a reviewer account for you.
            </p>
            <Link
              href="/admin/login"
              className="btn-primary inline-flex w-full justify-center"
            >
              Go to admin sign in
            </Link>
            <p className="text-center text-xs text-[var(--muted)]">
              Need an author account instead?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--accent)]"
              >
                Register as author
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={onSubmit}
              className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            >
              <label className="field sm:col-span-2">
                <span>Full name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label className="field sm:col-span-2">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </label>
              <label className="field sm:col-span-2">
                <span>Institution</span>
                <input
                  required
                  value={form.institution}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      institution: e.target.value,
                    }))
                  }
                />
              </label>
              <PasswordField
                label="Password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm password"
                required
                value={form.confirm}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, confirm: e.target.value }))
                }
                autoComplete="new-password"
              />
              <div className="sm:col-span-2">
                <TurnstileField onToken={onToken} />
              </div>
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700 sm:col-span-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary w-full sm:col-span-2"
                disabled={loading}
              >
                {loading ? "Creating…" : "Create super admin"}
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Already have access?{" "}
              <Link
                href="/admin/login"
                className="font-semibold text-[var(--accent)]"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}
