import { Snapshot } from "@/types/snapshot";

export type NormalizedSnapshots = {
  byId: Map<string, Snapshot>
  ids: string[]
}

export function normalizeSnapshots(
  snapshots: Snapshot[]
): NormalizedSnapshots {

  const byId = new Map<string, Snapshot>()
  const ids: string[] = []

  for (const snapshot of snapshots) {
    byId.set(snapshot.id, snapshot)
    ids.push(snapshot.id)
  }

  return { byId, ids }
}

export function denormalizeSnapshots(
  normalized: NormalizedSnapshots
): Snapshot[] {

  return normalized.ids.map(id => normalized.byId.get(id)!)
}