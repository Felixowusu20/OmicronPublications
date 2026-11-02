"use client";

import { useEffect, useId } from "react";

export type ConfirmPaymentDetails = {
  manuscriptId: string;
  title: string;
  amountLabel: string;
  authorName: string;
  authorEmail: string;
  journalTitle?: string | null;
  paypalReference?: string | null;
  proofUrl?: string | null;
};

type Props = {
  open: boolean;
  busy?: boolean;
  details: ConfirmPaymentDetails | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Polished APC confirmation dialog for editors —
 * replaces the browser `window.confirm` prompt.
 */
export function ConfirmPaymentModal({
  open,
  busy = false,
  details,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open || !details) return null;

  return (
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-[var(--ink)]/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        disabled={busy}
        onClick={() => {
          if (!busy) onCancel();
        }}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_64px_rgba(26,58,90,0.28)] sm:rounded-2xl">
        <header className="relative overflow-hidden bg-[var(--brand-navy)] px-5 py-5 text-white sm:px-6">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[var(--accent)]/35 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mark-omicron.png"
                alt=""
                className="h-11 w-11 rounded-lg bg-white object-contain p-1.5"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Omicron Publications
                </p>
                <h2
                  id={titleId}
                  className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Confirm APC payment
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-white/20 px-2.5 py-1 text-sm text-white/90 transition hover:bg-white/10 disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="relative mt-5 rounded-xl bg-white/10 px-4 py-4 ring-1 ring-white/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
              Amount received
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {details.amountLabel}
            </p>
            <p className="mt-1 text-sm text-white/80">USD · PayPal</p>
          </div>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-[1.05rem] leading-relaxed text-[var(--muted)]">
            Confirm that PayPal funds have arrived. An official Omicron
            receipt will be emailed to the submitting author.
          </p>

          <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
            <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[8.5rem_1fr]">
              <dt className="text-[var(--muted)]">Manuscript</dt>
              <dd className="font-mono text-xs font-semibold text-[var(--ink)] sm:text-sm">
                {details.manuscriptId}
              </dd>
            </div>
            <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[8.5rem_1fr]">
              <dt className="text-[var(--muted)]">Title</dt>
              <dd className="font-semibold leading-snug text-[var(--ink)]">
                {details.title}
              </dd>
            </div>
            {details.journalTitle ? (
              <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[8.5rem_1fr]">
                <dt className="text-[var(--muted)]">Journal</dt>
                <dd className="text-[var(--ink)]">{details.journalTitle}</dd>
              </div>
            ) : null}
            <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[8.5rem_1fr]">
              <dt className="text-[var(--muted)]">Author</dt>
              <dd className="text-[var(--ink)]">
                <span className="font-semibold">{details.authorName}</span>
                <span className="mt-0.5 block text-[var(--muted)]">
                  {details.authorEmail}
                </span>
              </dd>
            </div>
            {details.paypalReference ? (
              <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[8.5rem_1fr]">
                <dt className="text-[var(--muted)]">Reference</dt>
                <dd className="break-all font-mono text-xs font-semibold text-[var(--ink)]">
                  {details.paypalReference}
                </dd>
              </div>
            ) : null}
          </dl>

          {details.proofUrl ? (
            <a
              href={details.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={details.proofUrl}
                alt="Payment screenshot"
                className="max-h-40 w-full object-contain"
              />
              <span className="block border-t border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--accent)]">
                Review proof of payment →
              </span>
            </a>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--paper)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a83f1f] disabled:opacity-60"
          >
            {busy ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
                Confirming…
              </>
            ) : (
              "Confirm & email receipt"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
