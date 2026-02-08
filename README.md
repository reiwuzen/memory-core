# Memory-Core

**Memory-Core** is a local-first, privacy-respecting knowledge and memory management application designed to store, organize, and retrieve information based on **importance**, not just recency or location.

Most tools treat notes as flat text.  
Memory-Core treats knowledge as **weighted**.

---

## The Problem

Not all information is equally important, even when it lives in the same document.

Traditional note-taking tools prioritize:

- chronology
- folders
- documents as indivisible units

This leads to cognitive overload, where critical facts are buried alongside low-value context.

---

## The Core Idea

Memory-Core models knowledge as **discrete memory items**, each with its own importance.

Users store *Memory Items* such as:

- facts
- definitions
- notes
- decisions
- references

Each memory item includes:

- rich metadata (tags, context, category, source, timestamps)
- a **priority / importance weight** that can be adjusted over time

Retrieval is **priority-aware**, not just keyword-based.

The system surfaces what matters most — not what was written last.

> If a notebook stores information, Memory-Core augments memory.

---

## Architecture Philosophy

### 1. Local-First by Default (Non-Negotiable)

All memory content and metadata are stored locally on the user’s device.

- No forced cloud
- No dark patterns
- No implicit data ownership transfer

Cloud sync, if ever introduced, will be optional and explicit.

This avoids unnecessary:

- privacy risks
- cost
- architectural complexity

---

### 2. API-Driven, Not Storage-Driven

Backend APIs exist primarily to:

- fetch
- process
- rank
- return results

They are **not** treated as the primary storage layer.

Storage is considered **user territory**, not platform territory.

---

### 3. Priority Is a First-Class Concept

Priority is not:

- a tag
- a folder
- a workaround

It is core data.

Examples:

- A single paragraph may be more important than an entire document
- Exam facts > background explanations
- Definitions > commentary
- Decisions > discussions

Memory-Core respects this hierarchy by design.

---

## Functional Capabilities

- Store memory items across domains (subjects, projects, personal knowledge)
- Attach structured metadata to each item
- Assign and adjust importance over time
- Retrieve information based on:
  - importance
  - context
  - relevance
- Reduce cognitive overload by filtering low-value noise

In short:  
**Memory-Core is an external brain that understands what you care about most.**

---

## What This Is Not

- Not a traditional note-taking app
- Not a document-centric editor
- Not “Notion but local”
- Not an AI gimmick without clear priority mechanics

This is a **priority-weighted memory retrieval system**.

---

## Project Status

- Current status: **pre-1.0**
- APIs, data models, and architecture may change
- Active development with focus on:
  - architectural stabilization
  - editor reliability
  - priority-based retrieval

Breaking changes are expected before `v1.0.0`.

---

## Versioning

Memory-Core follows **Semantic Versioning**.

- `0.x` → active development, no stability guarantees
- `1.0.0` → planned once core concepts and APIs stabilize

---

## One-Line Identity

> **Memory-Core is a local-first system for storing and retrieving knowledge based on what matters most, not what was written last.**

---

## License

This project is licensed under the [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) **Apache License, Version 2.0**.
See the [LICENSE](LICENSE) file for details.
