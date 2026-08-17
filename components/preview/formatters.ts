import type { Metadata } from "@/lib/schema";

type Locale = Metadata["locale"];

const PRESENT: Record<Locale, string> = { "zh-CN": "至今", "en-US": "Present" };

/** '2023-07' → '2023.07'；'2023' → '2023'；'' → '' */
export function formatDate(value: string, locale: Locale): string {
  if (!value) return "";
  if (value === "present") return PRESENT[locale];
  return value.replace("-", ".");
}

/** 起止区间。缺一头就只显示另一头，两头都缺返回空串（模板据此隐藏整个元素）。 */
export function formatDateRange(start: string, end: string, locale: Locale): string {
  const from = formatDate(start, locale);
  const to = formatDate(end, locale);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

/** 把若干可能为空的片段用分隔符连起来，自动跳过空值 */
export function joinNonEmpty(parts: (string | undefined | null)[], separator = " · "): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(separator);
}
