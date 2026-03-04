import { VersionedPage, NormalizedVersionedPage } from "@/types/page"
import { normalizeSnapshots } from "./normalizeSnapshots"

export function normalizeVersionedPage(
  vpToNormalize: VersionedPage
): NormalizedVersionedPage {

  const normalizedSnapshots = normalizeSnapshots(vpToNormalize.snapshots)

  return {
    pageMeta: vpToNormalize.pageMeta,
    normalizedSnapshots
  }
}
export function normalizeVersionedPages(vpsToNormalize: VersionedPage[]){
    return vpsToNormalize.map(vp=> normalizeVersionedPage(vp))
}