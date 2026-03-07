import type { NormalizedVersionedPage } from "@/types/page";

export type RankedPage = {
  page: NormalizedVersionedPage;
  score: number;
  reasons: string[];
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const daysSince = (iso: string) => {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return 9999;
  return Math.max(0, (Date.now() - ts) / (1000 * 60 * 60 * 24));
};

export const rankPage = (page: NormalizedVersionedPage): RankedPage => {
  const { pageMeta, normalizedSnapshots } = page;
  const lastActiveAt = pageMeta.lastUpdatedAt || pageMeta.lastOpenedAt || pageMeta.createdAt;

  const recentDays = daysSince(lastActiveAt);
  const freshness = clamp(100 - recentDays * 3.2, 0, 100);
  const tagWeight = clamp(pageMeta.tags.length * 7, 0, 28);
  const depthWeight = clamp(normalizedSnapshots.ids.length * 3, 0, 24);
  const typeWeight = pageMeta.type === "fact" ? 12 : pageMeta.type === "event" ? 8 : 4;
  const score = Math.round(clamp(freshness * 0.58 + tagWeight + depthWeight + typeWeight, 0, 100));

  const reasons = [
    `Recency signal ${Math.round(freshness)}/100 from ${Math.round(recentDays)} day(s) since activity`,
    `${pageMeta.tags.length} tag(s) contribute contextual importance`,
    `${normalizedSnapshots.ids.length} snapshot(s) indicate content depth`,
    `${pageMeta.type} page type weighting applied`,
  ];

  return { page, score, reasons };
};

export const rankPages = (pages: NormalizedVersionedPage[]) => {
  return pages.map(rankPage);
};
