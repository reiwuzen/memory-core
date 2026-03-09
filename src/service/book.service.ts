import { invoke } from "@tauri-apps/api/core";
import { Result } from "@reiwuzen/result";
import { v7 } from "uuid";
import type { Book } from "@/types/book";
import type { PageType } from "@/types/page";

async function invokeSafe<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<Result<T, unknown>> {
  try {
    const value = await invoke<T>(command, args);
    return Result.Ok(value);
  } catch (err) {
    return Result.Err(err);
  }
}

export const BookService = () => {
  const create = (title: string, type: PageType) => {
    const book: Book = {
      id: `book-${v7()}`,
      title,
      createdAt: new Date().toISOString(),
      type,
    };
    return invokeSafe<Book>("create_book", { book });
  };

  const loadAll = () => invokeSafe<Book[]>("load_all_books");

  return {
    create,
    loadAll,
  };
};

