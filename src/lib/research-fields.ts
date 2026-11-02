/**
 * Canonical research fields shown on the homepage.
 * An article binds to a field through the journal chosen at submission —
 * journal.subjects are matched against each field’s aliases.
 */

export type ResearchFieldDef = {
  id: string;
  label: string;
  summary: string;
  /** Lowercase tokens matched against journal.subjects / title / description */
  aliases: string[];
  /** ACS-style browse labels that resolve to this field */
  browseLabels: string[];
};

export const RESEARCH_FIELDS: ResearchFieldDef[] = [
  {
    id: "chemistry",
    label: "Chemistry",
    summary:
      "Synthesis, materials, and analytical methods that support experimental discovery.",
    aliases: [
      "chemistry",
      "chemical",
      "science",
      "materials",
      "nanoscience",
      "polymer",
      "energy",
    ],
    browseLabels: [
      "Agriculture and Food Chemistry",
      "Analytical Chemistry",
      "Biological and Medicinal Chemistry",
      "Chemical Engineering",
      "Earth, Space, and Environmental Chemistry",
      "Inorganic Chemistry",
      "Organic Chemistry",
      "Physical Chemistry",
      "Polymer Science",
      "Materials Science",
      "Nanoscience",
      "Energy",
    ],
  },
  {
    id: "biology",
    label: "Biology",
    summary:
      "Cellular systems, molecular life sciences, and organism-level research.",
    aliases: [
      "biology",
      "biological",
      "biomedicine",
      "life science",
      "agriculture",
      "food science",
      "sustainability",
      "environment",
    ],
    browseLabels: ["Biology", "Agriculture and Food Chemistry"],
  },
  {
    id: "physics",
    label: "Physics",
    summary:
      "Theory and experiment spanning condensed matter, optics, and applied physics.",
    aliases: ["physics", "science", "technology", "applied research"],
    browseLabels: ["Physics"],
  },
  {
    id: "medicine",
    label: "Medicine",
    summary:
      "Biomedical findings and clinical research that strengthen patient-facing science.",
    aliases: [
      "medicine",
      "medical",
      "health",
      "biomedicine",
      "clinical",
      "public health",
    ],
    browseLabels: ["Biological and Medicinal Chemistry"],
  },
  {
    id: "engineering",
    label: "Engineering",
    summary:
      "Applied design, systems, and technology research across engineering fields.",
    aliases: [
      "engineering",
      "technology",
      "applied research",
      "innovation",
      "interdisciplinary",
    ],
    browseLabels: ["Engineering", "Chemical Engineering"],
  },
  {
    id: "earth",
    label: "Earth science",
    summary:
      "Climate, geoscience, and environmental studies grounded in rigorous evidence.",
    aliases: [
      "earth",
      "environment",
      "environmental",
      "sustainability",
      "agriculture",
      "climate",
      "geoscience",
    ],
    browseLabels: ["Earth, Space, and Environmental Chemistry"],
  },
  {
    id: "education",
    label: "Education",
    summary:
      "Pedagogy, learning technology, and research that improves teaching practice.",
    aliases: ["education", "pedagogy", "edtech", "learning", "development"],
    browseLabels: ["Education"],
  },
  {
    id: "business",
    label: "Business & economics",
    summary:
      "Management, markets, economics, and innovation studies for practice and policy.",
    aliases: [
      "business",
      "economics",
      "innovation",
      "management",
      "trade",
      "industry",
    ],
    browseLabels: ["Business, Trade & Industry"],
  },
  {
    id: "social",
    label: "Social sciences & humanities",
    summary:
      "Society, culture, history, and the humanities in rigorous scholarly form.",
    aliases: [
      "sociology",
      "humanities",
      "culture",
      "history",
      "social",
      "anthropology",
    ],
    browseLabels: [],
  },
];

export type JournalFieldSource = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string | null;
  subjects: string[];
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function journalHaystack(journal: JournalFieldSource) {
  return [
    journal.title ?? "",
    journal.description ?? "",
    journal.slug ?? "",
    ...journal.subjects,
  ]
    .map(normalize)
    .join(" ");
}

/** True when a journal’s subjects/title map onto a research field. */
export function journalMatchesField(
  journal: JournalFieldSource,
  field: ResearchFieldDef | string,
) {
  const def =
    typeof field === "string"
      ? RESEARCH_FIELDS.find((f) => f.id === field)
      : field;
  if (!def) return false;
  const hay = journalHaystack(journal);
  return def.aliases.some((alias) => hay.includes(normalize(alias)));
}

export function fieldById(id: string) {
  return RESEARCH_FIELDS.find((f) => f.id === id) ?? null;
}

/** Resolve ACS-style browse label → field id when possible. */
export function fieldIdForBrowseLabel(label: string) {
  const n = normalize(label);
  for (const field of RESEARCH_FIELDS) {
    if (normalize(field.label) === n) return field.id;
    if (field.browseLabels.some((b) => normalize(b) === n)) return field.id;
    if (field.aliases.some((a) => n.includes(a) || a.includes(n))) {
      return field.id;
    }
  }
  return null;
}

export function articlesPathForField(fieldId: string) {
  return `/articles?field=${encodeURIComponent(fieldId)}`;
}

export function articlesPathForSubject(subject: string) {
  const fieldId = fieldIdForBrowseLabel(subject);
  if (fieldId) return articlesPathForField(fieldId);
  return `/articles?subject=${encodeURIComponent(subject)}`;
}

/** Flat ACS-style browse list (3 columns), each bound to a field or subject filter. */
export function browseSubjectColumns(): { label: string; href: string }[][] {
  const labels = RESEARCH_FIELDS.flatMap((f) =>
    f.browseLabels.length > 0 ? f.browseLabels : [f.label],
  );
  // De-dupe while preserving order
  const seen = new Set<string>();
  const items = labels
    .filter((label) => {
      const key = normalize(label);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((label) => ({
      label,
      href: articlesPathForSubject(label),
    }));

  const cols: { label: string; href: string }[][] = [[], [], []];
  items.forEach((item, i) => {
    cols[i % 3].push(item);
  });
  return cols;
}

/**
 * Recommended subjects to store on each seeded journal so submission →
 * publication automatically binds into the homepage fields.
 */
export const JOURNAL_SUBJECT_DEFAULTS: Record<string, string[]> = {
  "omicron-journal-of-science-and-technology": [
    "Chemistry",
    "Physics",
    "Engineering",
    "Science",
    "Technology",
    "Materials Science",
  ],
  "omicron-journal-of-health-and-biomedical-research": [
    "Medicine",
    "Biology",
    "Public Health",
    "Biomedicine",
    "Clinical Research",
  ],
  "omicron-journal-of-agriculture-food-and-sustainability": [
    "Biology",
    "Earth science",
    "Agriculture",
    "Food Science",
    "Sustainability",
    "Environment",
  ],
  "omicron-journal-of-education-learning-and-development": [
    "Education",
    "Pedagogy",
    "EdTech",
    "Development",
  ],
  "omicron-journal-of-business-economics-and-innovation": [
    "Business",
    "Economics",
    "Innovation",
    "Management",
  ],
  "omicron-journal-of-social-sciences-and-humanities": [
    "Sociology",
    "Humanities",
    "Culture",
    "History",
  ],
  "omicron-journal-of-interdisciplinary-research": [
    "Engineering",
    "Science",
    "Interdisciplinary Studies",
    "Methods",
    "Applied Research",
    "Innovation",
  ],
};
