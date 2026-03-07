import type { NormalizedVersionedPage } from "@/types/page";

const NSFW_TAGS = new Set(["nsfw", "adult", "explicit", "18+"]);

export const isNsfwPage = (page: NormalizedVersionedPage): boolean => {
  return page.pageMeta.tags.some((tag) => NSFW_TAGS.has(tag.trim().toLowerCase()));
};
