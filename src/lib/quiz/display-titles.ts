/** Programmatic headline from route slugs — no hardcoded mock values. */
export function formatSubjectHeadline(
  subject: string,
  paper?: string,
): string {
  const base = subject
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (!paper) return base;

  const paperLabel = paper
    .replace("-paper", " Paper")
    .replace(/\b(\d)(st|nd|rd|th)\b/i, "$1$2");

  return `${base} ${paperLabel.charAt(0).toUpperCase()}${paperLabel.slice(1)}`;
}
