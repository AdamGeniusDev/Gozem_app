// utils/date.ts
export function formatAppwriteDate(iso?: string | null, locale = "fr-FR"): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}
