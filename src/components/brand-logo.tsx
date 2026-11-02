import Link from "next/link";

type Props = {
  /** Pass null to render without a link wrapper. */
  href?: string | null;
  /** Prefer full lockup. Use onDark on dark surfaces (footer, auth). */
  variant?: "full" | "onDark" | "mark";
  className?: string;
  priority?: boolean;
};

/**
 * Omicron logo (transparent background).
 * Navbar / light surfaces: full lockup.
 * Footer / dark surfaces: on-dark lockup for contrast.
 */
export function BrandLogo({
  href = "/",
  variant = "full",
  className = "",
  priority = false,
}: Props) {
  const src =
    variant === "onDark"
      ? "/brand/logo-omicron-on-dark.png"
      : variant === "mark"
        ? "/favicon.png"
        : "/brand/logo-omicron.png";

  const isMark = variant === "mark";

  const inner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Omicron Publications"
      width={isMark ? 40 : 240}
      height={isMark ? 40 : 70}
      className={
        isMark
          ? `h-10 w-10 rounded-lg object-contain ${className}`
          : `h-14 w-auto max-w-[240px] object-contain object-left sm:h-16 md:max-w-[300px] ${className}`
      }
      // hint cache-bust after transparent re-export
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );

  if (href == null || href === "") return inner;
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center"
      aria-label="Omicron Publications home"
    >
      {inner}
    </Link>
  );
}
