/**
 * templates.ts 
 * type
 */

import type { PageType } from "./page";

export type CreateTemplate = {
  id: string;
  label: string;
  description: string;
  templateType: PageType;
  createType: "page" | "book";
  initialTitle: string;
  initialContent?: string;
};
