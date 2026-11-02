import Link from "next/link";
import { browseSubjectColumns } from "@/lib/research-fields";

/** ACS-style “Browse by Subject” — each link filters articles by bound field/journal. */
export function BrowseBySubject() {
  const columns = browseSubjectColumns();

  return (
    <section
      className="border-b border-[var(--line)] bg-white"
      aria-labelledby="browse-by-subject-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 id="browse-by-subject-heading" className="acs-section-title">
          Browse by Subject
        </h2>
        <p className="mt-2 max-w-2xl text-[1.05rem] text-[var(--muted)]">
          Subjects map to Omicron journals. When authors submit to a journal,
          published articles appear under that journal’s fields.
        </p>
        <div className="mt-8 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {columns.map((col, i) => (
            <ul key={i} className="space-y-2.5">
              {col.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="acs-subject-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
