export type Snapshot = {
  readonly id: string;
  readonly pageId: string
  parentSnapshotId: string;
  contentJson: string;
  readonly createdAt: string;
  comment?: string;
};