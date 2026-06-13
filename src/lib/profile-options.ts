import {
  SSC_EXAM_YEARS,
  HSC_EXAM_YEARS,
  type StudentLevel,
} from "@/lib/profile-utils";

export const CLASS_OPTIONS = [
  { value: "SSC", label: "SSC" },
  { value: "HSC", label: "HSC" },
] as const;

export function examYearOptions(level: StudentLevel | null) {
  const years = level === "ssc" ? SSC_EXAM_YEARS : level === "hsc" ? HSC_EXAM_YEARS : [];
  return years.map((y) => ({
    value: String(y),
    label: y.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]),
  }));
}

export { examYearBanglaLabel } from "@/lib/profile-utils";
export const SUBJECT_OPTIONS = [
  { value: "physics", label: "পদার্থবিজ্ঞান" },
  { value: "chemistry", label: "রসায়ন" },
  { value: "biology", label: "জীববিজ্ঞান" },
  { value: "higher-math", label: "উচ্চতর গণিত" },
  { value: "math", label: "সাধারণ গণিত" },
] as const;

export function subjectLabel(value: string): string {
  const found = SUBJECT_OPTIONS.find((s) => s.value === value);
  return found?.label ?? value;
}
