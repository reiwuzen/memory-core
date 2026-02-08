export type Result<T = never, E = string> =
  [T] extends [never]
    ? { ok: true }
      | { ok: false; error: E }
    : { ok: true; value: T }
      | { ok: false; error: E };
