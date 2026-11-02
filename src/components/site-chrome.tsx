"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthorNotifications } from "@/components/author-notifications";
import { BrandLogo } from "@/components/brand-logo";
import { NavbarSearch } from "@/components/navbar-search";
import { initials } from "@/lib/auth";

type NavChild = { label: string; href: string; hint?: string };

type NavItem = {
  label: string;
  href: string;
  children: NavChild[];
};

type NavJournal = { slug: string; title: string };

function useNavItems(journals: NavJournal[]): NavItem[] {
  return useMemo(
    () => [
      {
        label: "Read",
        href: "/articles",
        children: [
          {
            label: "Latest articles",
            href: "/articles",
            hint: "Published articles",
          },
          {
            label: "Current issues",
            href: "/articles/current-issues",
            hint: "Latest issue of each journal",
          },
          {
            label: "Past issues",
            href: "/articles/past-issues",
            hint: "Archives by year and journal",
          },
          {
            label: "Search articles",
            href: "/search",
            hint: "Title, author, OID, keyword",
          },
          { label: "Open access", href: "/articles?access=oa" },
        ],
      },
      {
        label: "Publish",
        href: "/authors/guidelines",
        children: [
          {
            label: "Submit a manuscript",
            href: "/submissions/new",
            hint: "Start a new submission",
          },
          {
            label: "Author dashboard",
            href: "/dashboard",
            hint: "Track manuscripts",
          },
          { label: "Author guidelines", href: "/authors/guidelines" },
          { label: "Article types", href: "/authors/article-types" },
          { label: "Fees & waivers", href: "/authors/fees" },
        ],
      },
      {
        label: "Journals",
        href: "/journals",
        children: [
          {
            label: "Browse all journals",
            href: "/journals",
            hint: "Titles, ISSN, scope",
          },
          ...journals.map((j) => ({
            label: j.title,
            href: `/journals/${j.slug}`,
          })),
        ],
      },
      {
        label: "Help",
        href: "/help",
        children: [
          { label: "Help centre & FAQ", href: "/help" },
          { label: "Contact support", href: "/help#contact" },
          { label: "About Omicron", href: "/about" },
          { label: "Terms & Conditions", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
        ],
      },
    ],
    [journals],
  );
}

export function SiteHeader() {
  const [navJournals, setNavJournals] = useState<NavJournal[]>([]);
  const nav = useNavItems(navJournals);
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/cms/journals");
        const data = await res.json();
        if (cancelled || !res.ok) return;
        const list = ((data.journals ?? []) as NavJournal[])
          .map((j) => ({ slug: j.slug, title: j.title }))
          .slice(0, 12);
        setNavJournals(list);
      } catch {
        if (!cancelled) setNavJournals([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOpen(null);
    setAccountOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (navRef.current && !navRef.current.contains(target)) {
        setOpen(null);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/pay")) return null;
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  function handleSignOut() {
    void logout().then(() => {
      setAccountOpen(false);
      setMobileOpen(false);
      setOpen(null);
      router.replace("/login");
    });
  }

  return (
    <header className="sticky top-0 z-50">
      {/* ACS-style utility bar — Omicron navy */}
      <div className="bg-[var(--brand-navy)] text-white">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-3 px-4 text-[12px] sm:px-6">
          <nav className="flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap sm:gap-4">
            <Link href="/" className="font-semibold text-white">
              Omicron
            </Link>
            <span className="text-white/35" aria-hidden>
              |
            </span>
            <Link href="/journals" className="text-white/90 hover:text-white">
              Journals
            </Link>
            <Link href="/articles" className="text-white/90 hover:text-white">
              Articles
            </Link>
            <Link href="/about" className="hidden text-white/90 hover:text-white sm:inline">
              About
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            {ready && user ? (
              <>
                <Link href="/dashboard" className="hidden text-white/90 hover:text-white sm:inline">
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-white/90 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white/90 hover:text-white">
                  Sign in
                </Link>
                <Link href="/register" className="font-semibold text-white hover:underline">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main white bar — logo + ACS-style primary nav */}
      <div className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-[5.5rem] w-full max-w-6xl min-w-0 items-center gap-5 px-4 sm:h-[6.25rem] sm:gap-6 sm:px-6 lg:h-[6.75rem]">
          <BrandLogo
            variant="full"
            priority
            className="!h-[4.25rem] !max-w-[200px] sm:!h-[5rem] sm:!max-w-[260px] lg:!h-[5.5rem] lg:!max-w-[300px]"
          />

          <nav
            ref={navRef}
            className="relative ml-auto hidden min-w-0 items-center gap-0.5 md:flex"
          >
            {nav.map((item) => {
              const isOpen = open === item.label;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                item.children.some((c) => {
                  const base = c.href.split("?")[0];
                  return pathname === base || pathname.startsWith(`${base}/`);
                });

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    if (hydrated.current) setOpen(item.label);
                  }}
                  onMouseLeave={() => setOpen(null)}
                >
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`px-3 py-2 text-[15px] font-medium transition ${
                        active
                          ? "text-[var(--accent)]"
                          : "text-[var(--ink)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      className={`-ml-1 rounded p-1.5 transition ${
                        active || isOpen
                          ? "text-[var(--accent)]"
                          : "text-[var(--muted)] hover:text-[var(--accent)]"
                      }`}
                      aria-label={`${item.label} menu`}
                      aria-expanded={isOpen}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!hydrated.current) return;
                        setOpen((prev) =>
                          prev === item.label ? null : item.label,
                        );
                      }}
                    >
                      <Chevron open={isOpen} />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2">
                      <div className="overflow-hidden rounded border border-[var(--line)] bg-white shadow-[0_8px_28px_rgba(26,58,90,0.12)]">
                        <div className="h-0.5 bg-[var(--accent)]" />
                        <div className="p-1.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.href + child.label}
                              href={child.href}
                              className="block rounded px-3 py-2.5 transition hover:bg-[var(--accent-soft)]"
                            >
                              <span className="block text-sm font-medium text-[var(--ink)]">
                                {child.label}
                              </span>
                              {child.hint ? (
                                <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
                                  {child.hint}
                                </span>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2 md:ml-3">
            {/* ACS puts search in the hero on home; compact search only on small screens elsewhere */}
            {pathname !== "/" ? (
              <div className="min-w-0 flex-1 sm:max-w-[200px] md:hidden">
                <Suspense
                  fallback={
                    <div className="h-9 rounded border border-[var(--line)] bg-[var(--surface)]" />
                  }
                >
                  <NavbarSearch variant="bar" />
                </Suspense>
              </div>
            ) : null}

            {ready && user ? (
              <>
                <AuthorNotifications />
                <div className="relative shrink-0" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen((v) => !v);
                      setOpen(null);
                    }}
                    className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white py-1 pl-1 pr-2.5 text-left transition hover:border-[var(--accent)]/35"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
                      {initials(user.name)}
                    </span>
                    <Chevron open={accountOpen} />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded border border-[var(--line)] bg-white shadow-[0_8px_28px_rgba(26,58,90,0.12)]">
                      <div className="border-b border-[var(--line)] bg-[var(--surface)] px-3.5 py-3">
                        <p className="truncate text-sm font-semibold text-[var(--ink)]">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/dashboard" className="menu-link">
                          My dashboard
                        </Link>
                        <Link href="/profile" className="menu-link">
                          My profile
                        </Link>
                        <Link href="/notifications" className="menu-link">
                          Notifications
                        </Link>
                        <button
                          type="button"
                          className="menu-link w-full text-left text-rose-700"
                          onClick={handleSignOut}
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            <button
              type="button"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border transition md:hidden ${
                mobileOpen
                  ? "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] bg-white text-[var(--ink)]"
              }`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4">
              <BrandLogo variant="full" className="!h-14 !max-w-[200px]" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-[var(--line)] text-[var(--ink)]"
              >
                <HamburgerIcon open />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <nav className="space-y-0.5">
                {nav.map((item) => {
                  const sectionOpen = mobileSection === item.label;
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`) ||
                    item.children.some((c) => {
                      const base = c.href.split("?")[0];
                      return (
                        pathname === base || pathname.startsWith(`${base}/`)
                      );
                    });

                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 rounded px-3 py-3 text-left transition ${
                          sectionOpen || active
                            ? "bg-[var(--accent-soft)]"
                            : "hover:bg-[var(--surface)]"
                        }`}
                        aria-expanded={sectionOpen}
                        onClick={() =>
                          setMobileSection((prev) =>
                            prev === item.label ? null : item.label,
                          )
                        }
                      >
                        <span
                          className={`text-[15px] font-semibold ${
                            sectionOpen || active
                              ? "text-[var(--accent)]"
                              : "text-[var(--ink)]"
                          }`}
                        >
                          {item.label}
                        </span>
                        <Chevron open={sectionOpen} />
                      </button>

                      {sectionOpen && (
                        <div className="mt-1 mb-2 ml-2 space-y-0.5 border-l-2 border-[var(--accent)]/25 pl-3">
                          <Link
                            href={item.href}
                            className="block rounded px-3 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface)]"
                            onClick={() => setMobileOpen(false)}
                          >
                            View all {item.label.toLowerCase()}
                          </Link>
                          {item.children.map((child) => (
                            <Link
                              key={child.href + child.label}
                              href={child.href}
                              className="block rounded px-3 py-2.5 text-sm text-[var(--ink)] transition hover:bg-[var(--surface)]"
                              onClick={() => setMobileOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="shrink-0 border-t border-[var(--line)] bg-[var(--surface)] p-4">
              {user ? (
                <>
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {user.email}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href="/dashboard"
                      className="rounded border border-[var(--line)] bg-white px-3 py-2.5 text-center text-sm font-semibold text-[var(--ink)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="rounded bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="rounded border border-[var(--line)] bg-white px-3 py-3 text-center text-sm font-semibold text-[var(--ink)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded bg-[var(--accent)] px-3 py-3 text-center text-sm font-semibold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-4" aria-hidden>
      <span
        className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition duration-200 ${
          open ? "top-1.5 rotate-45" : "top-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-current transition duration-200 ${
          open ? "scale-x-0 opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition duration-200 ${
          open ? "top-1.5 -rotate-45" : "top-3"
        }`}
      />
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/pay")) return null;
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  return (
    <footer className="mt-auto max-w-[100%] overflow-x-clip border-t border-[var(--line)] bg-[var(--ink)] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-12 lg:grid-cols-4">
        <div>
          <BrandLogo href="/" variant="onDark" className="h-10 sm:h-11" />
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Submission and publishing for researchers worldwide.
          </p>
        </div>
        <FooterCol
          title="Publish"
          links={[
            ["/journals", "Journals"],
            ["/submissions/new", "Submit manuscript"],
            ["/authors/guidelines", "Author guidelines"],
            ["/authors/fees", "Fees & waivers"],
          ]}
        />
        <FooterCol
          title="Discover"
          links={[
            ["/articles", "Articles"],
            ["/articles/current-issues", "Current issues"],
            ["/articles/past-issues", "Past issues"],
            ["/search", "Search"],
            ["/authors/article-types", "Article types"],
            ["/about", "About"],
          ]}
        />
        <FooterCol
          title="Trust & support"
          links={[
            ["/help", "Help & FAQ"],
            ["/terms", "Terms & Conditions"],
            ["/privacy", "Privacy Policy"],
            ["/login", "Sign in"],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 Omicron Publications.</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/help" className="hover:text-white">
              FAQ
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-slate-400 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
