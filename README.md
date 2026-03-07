# Memory-Core (Zensys)

Memory-Core is a local-first desktop knowledge system built with Tauri, React, and Rust.  
It helps users store and retrieve information by **priority** instead of only recency.

![Memory-Core preview](public/content.png)

## Why This Exists

Most note tools optimize for documents, folders, and timelines.  
Memory-Core treats knowledge as discrete items with metadata and importance scores, so high-value information surfaces first.

## Key Principles

- Local-first by default: content and metadata stay on device.
- Priority is core data: not a tag workaround.
- Retrieval over storage UI: rank what matters, reduce noise.

## Tech Stack

- Frontend: React 19 + TypeScript + Vite + Sass
- Desktop shell/backend: Tauri v2 + Rust
- State/UI: Zustand, custom hooks, reusable component modules

## Project Structure

- `src/`: frontend app source
- `src/workspace/`: feature-level views and flows
- `src/components/`: reusable UI components
- `src/service/`: frontend service boundary to Tauri commands
- `src/store/`: state stores
- `src-tauri/src/`: Rust commands, models, storage, settings

## Getting Started

### Prerequisites

- Node.js (LTS)
- `pnpm`
- Rust toolchain (`rustup`, `cargo`)
- Tauri system prerequisites for your OS

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Runs frontend only on Vite dev server.

```bash
pnpm tauri dev
```

Runs the full desktop app (frontend + Rust backend).

## Build & Quality

```bash
pnpm lint        # ESLint checks
pnpm lint:fix    # Fix lint issues
pnpm build       # Type check + Vite production build
pnpm tauri build # Desktop binary build
```

## Current Status

- Version: `0.6.0`
- Pre-1.0 and actively evolving
- Breaking changes can occur before stable `1.0.0`


## License

Apache License 2.0. See [LICENSE](LICENSE).
