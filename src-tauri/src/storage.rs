use std::path::PathBuf;

use crate::{
    schema::{Book, MemoryItem, MemoryNode, MemoryPayload, PageMeta, VersionedPage, Snapshot, Tag},
    utils::get_app_dir,
};
use tauri::{
    //  Manager,
    command,
    AppHandle,
};

/// Creates or ensures the existence of the page store directory.
///
/// # Overview
///
/// `page_store_dir` is a utility function that initializes the application's
/// page storage directory. If the directory does not exist, it is created.
/// The function is idempotent and safe to call multiple times.
///
/// # Directory Structure
///
/// The page store is organized as follows:
///
/// ```text
/// {app_data_dir}/
/// └─ page_store/
///    ├─ {page_id_1}/
///    │  ├─ page.json
///    │  └─ snapshots/
///    ├─ {page_id_2}/
///    │  ├─ page.json
///    │  └─ snapshots/
///    └─ .staging/
///       └─ (temporary staging directories)
/// ```
///
/// # Parameters
///
/// - `app`: Tauri application handle used to resolve the application data directory.
///
/// # Returns
///
/// - `Ok(PathBuf)` containing the path to the page store directory.
/// - `Err(String)` if the application directory cannot be resolved or if
///   directory creation fails.
///
/// # Errors
///
/// Errors may occur if:
/// - The application handle is invalid or not properly initialized.
/// - The filesystem is read-only or inaccessible.
/// - Permission issues prevent directory creation.
///
/// # Examples
///
/// ```rust,ignore
/// let page_store = page_store_dir(app)?;
/// println!("Page store location: {:?}", page_store);
/// ```
#[command]
pub fn page_store_dir(app: AppHandle) -> Result<PathBuf, String> {
    let app_dir = get_app_dir(&app)?;
    let page_store_dir = app_dir.join("page_store");
    std::fs::create_dir_all(&page_store_dir)
        .map_err(|err| format!("Can not create page_store_dir: {}", err))?;
    Ok(page_store_dir)
}

/// Loads all pages stored in the page store directory.
///
/// # Overview
///
/// `load_all_pages` is a bulk read operation that loads all `VersionedPage`
/// instances from disk. Each page includes its metadata and all associated
/// snapshots. The function scans the page store directory and deserializes
/// each page's configuration file.
///
/// # Discovery & Loading Logic
///
/// - Scans `page_store/` for top-level directories.
/// - For each directory, attempts to load `page.json` as page metadata.
/// - Orphaned directories (missing `page.json`) are silently skipped.
/// - For each page, loads all snapshots from the `snapshots/` subdirectory.
/// - Returns only fully valid pages; partially corrupted pages are skipped.
///
/// # File Structure
///
/// ```text
/// page_store/
/// ├─ page_id_1/
/// │  ├─ page.json                    <- Page metadata
/// │  └─ snapshots/
/// │     ├─ snapshot_id_1/
/// │     │  ├─ metadata.json
/// │     │  └─ content.json
/// │     └─ snapshot_id_2/
/// │        ├─ metadata.json
/// │        └─ content.json
/// └─ page_id_2/
///    └─ ...
/// ```
///
/// # Invariants
///
/// - The function performs integrity checks: each snapshot's `page_id`
///   must match its parent page's `id`.
/// - Each page must have a `head_snapshot` identified by `head_snapshot_id`.
/// - If the head snapshot is missing, the entire page is treated as invalid
///   and an error is returned.
///
/// # Return Behavior
///
/// - `Ok(Vec<VersionedPage>)`: A list of all valid pages, each with full
///   snapshot history.
/// - `Err(String)`: If any invariant violation or filesystem error occurs.
///
/// # Errors
///
/// Errors include:
/// - The page store directory cannot be read.
/// - A `page.json` file is malformed or unreadable.
/// - Snapshot metadata is invalid or corrupt.
/// - The head snapshot referenced by a page does not exist.
/// - Memory ID mismatches between snapshots and their parent page.
///
/// # Performance Notes
///
/// - This is a **full scan** operation; time complexity is O(P × S), where
///   P is the number of pages and S is the average number of snapshots per page.
/// - For large page stores with many snapshots, consider using
///   [`load_page_details`] to load individual pages on demand.
///
/// # Examples
///
/// ```rust,ignore
/// let all_pages = load_all_pages(app)?;
/// println!("Loaded {} pages", all_pages.len());
/// for page in all_pages {
///     println!("Page: {} with {} snapshots", page.page_meta.id, page.snapshots.len());
/// }
/// ```
#[command]
pub fn load_all_pages(app: AppHandle) -> Result<Vec<VersionedPage>, String> {
    let page_store_dir = page_store_dir(app)?;

    let mut result = Vec::new();

    let page_entries = std::fs::read_dir(&page_store_dir)
        .map_err(|e| format!("Failed to read memory_spaces dir: {}", e))?;

    for entry in page_entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let page_dir = entry.path();

        if !page_dir.is_dir() {
            continue;
        }

        /* ─────────────────── load Page ─────────────────── */

        let page_json_path = page_dir.join("page.json");
        if !page_json_path.exists() {
            continue; // orphaned dir, ignore
        }

        let page_json_str = std::fs::read_to_string(&page_json_path)
            .map_err(|e| format!("Failed to read {:?}: {}", page_json_path, e))?;

        let page_meta: PageMeta = serde_json::from_str(&page_json_str)
            .map_err(|e| format!("Invalid page.json in {:?}: {}", page_json_path, e))?;

        /* ─────────────────── load nodes ─────────────────── */

        let snapshots_dir = page_dir.join("snapshots");
        let mut snapshots = Vec::new();
        let mut head_snapshot: Option<Snapshot> = None;

        if snapshots_dir.exists() {
            let snapshots_entries = std::fs::read_dir(&snapshots_dir)
                .map_err(|e| format!("Failed to read nodes dir {:?}: {}", snapshots_dir, e))?;

            for snapshot_entry in snapshots_entries {
                let snapshot_entry = snapshot_entry.map_err(|e| e.to_string())?;
                let snapshot_dir = snapshot_entry.path();

                if !snapshot_dir.is_dir() {
                    continue;
                }

                let snapshot_metadata_path = snapshot_dir.join("metadata.json");
                if !snapshot_metadata_path.exists() {
                    continue;
                }

                let snapshot_metadata_str = std::fs::read_to_string(&snapshot_metadata_path)
                    .map_err(|e| format!("Failed to read {:?}: {}", snapshot_metadata_path, e))?;

                let snapshot: Snapshot =
                    serde_json::from_str(&snapshot_metadata_str).map_err(|e| {
                        format!(
                            "Invalid metadata.json in {:?}: {}",
                            snapshot_metadata_path, e
                        )
                    })?;

                // integrity check
                if snapshot.page_id != page_meta.id {
                    return Err(format!(
                        "Memory ID mismatch in node {:?}",
                        snapshot_metadata_path
                    ));
                }

                if snapshot.id == page_meta.head_snapshot_id {
                    head_snapshot = Some(snapshot.clone());
                }

                snapshots.push(snapshot);
            }
        }

        let head_snapshot = head_snapshot.ok_or_else(|| {
            format!(
                "Active node '{}' not found for memory '{}'",
                page_meta.head_snapshot_id, page_meta.id
            )
        })?;

        result.push(VersionedPage {
            page_meta,
            snapshots,
            head_snapshot,
        });
    }

    Ok(result)
}

/// Loads a single page and all its snapshots by page ID.
///
/// # Overview
///
/// `load_page_details` retrieves a specific `VersionedPage` from disk by ID.
/// It loads the page metadata and all associated snapshots in a single operation.
/// This function is more efficient than [`load_all_pages`] when you need to
/// access a single page.
///
/// # File Structure Expectations
///
/// The function expects the following layout:
///
/// ```text
/// page_store/
/// └─ {page_id}/
///    ├─ page.json                 <- Required: page metadata
///    └─ snapshots/                <- Required: snapshots directory
///       ├─ snapshot_id_1/
///       │  ├─ metadata.json       <- Snapshot metadata
///       │  └─ content.json        <- Snapshot content
///       └─ snapshot_id_2/
///          └─ ...
/// ```
///
/// # Invariants
///
/// - The page directory must exist; if not, `Err` is returned.
/// - Both `page.json` and `snapshots/` directory must exist.
/// - Each snapshot's `page_id` field must match the requested `page_id`.
/// - A head snapshot (identified by `page_meta.head_snapshot_id`) must exist.
///
/// # Parameters
///
/// - `app`: Tauri application handle for resolving the page store directory.
/// - `page_id`: The unique identifier of the page to load.
///
/// # Returns
///
/// - `Ok(VersionedPage)`: The fully loaded page with all snapshots.
/// - `Err(String)`: If the page does not exist, metadata is corrupted,
///   or invariant checks fail.
///
/// # Errors
///
/// Errors include:
/// - The page directory does not exist.
/// - `page.json` or `snapshots/` directory is missing.
/// - Metadata files are malformed or unreadable.
/// - The head snapshot does not exist.
/// - A snapshot's `page_id` does not match the parent page's `id` (invariant violation).
///
/// # Examples
///
/// ```rust,ignore
/// let page = load_page_details(app, "page_123".to_string())?;
/// println!("Page title: {}", page.page_meta.title);
/// println!("Total snapshots: {}", page.snapshots.len());
/// println!("Current snapshot: {}", page.head_snapshot.id);
/// ```
#[command]
pub fn load_page_details(app: AppHandle, page_id: String) -> Result<VersionedPage, String> {
    let page_store_dir = page_store_dir(app)?;

    let page_dir = page_store_dir.join(&page_id);

    if !page_dir.exists() || !page_dir.is_dir() {
        return Err(format!("Memory '{}' does not exist", page_id));
    }

    /* ─────────────────── load MemoryItem ─────────────────── */

    let page_json_path = page_dir.join("page.json");
    if !page_json_path.exists() {
        return Err(format!("metadata.json missing for memory '{}'", page_id));
    }

    let page_json_str = std::fs::read_to_string(&page_json_path)
        .map_err(|e| format!("Failed to read {:?}: {}", page_json_path, e))?;

    let page_meta: PageMeta = serde_json::from_str(&page_json_str)
        .map_err(|e| format!("Invalid page.json in {:?}: {}", page_json_path, e))?;

    /* ─────────────────── load snapshots ─────────────────── */

    let snapshots_dir = page_dir.join("snapshots");
    if !snapshots_dir.exists() {
        return Err(format!(
            "Snapshots directory missing for memory '{}'",
            page_id
        ));
    }

    let mut snapshots = Vec::new();
    let mut head_snapshot: Option<Snapshot> = None;

    let snapshots_entries = std::fs::read_dir(&snapshots_dir)
        .map_err(|e| format!("Failed to read snapshots dir {:?}: {}", snapshots_dir, e))?;

    for entry in snapshots_entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let snapshot_dir = entry.path();

        if !snapshot_dir.is_dir() {
            continue;
        }

        let snapshot_metadata_path = snapshot_dir.join("metadata.json");
        if !snapshot_metadata_path.exists() {
            continue;
        }

        let snapshot_metadata_str = std::fs::read_to_string(&snapshot_metadata_path)
            .map_err(|e| format!("Failed to read {:?}: {}", snapshot_metadata_path, e))?;

        let snapshot: Snapshot = serde_json::from_str(&snapshot_metadata_str)
            .map_err(|e| format!("Invalid metadata.json in {:?}: {}", snapshot_metadata_path, e))?;

        // HARD invariant — no silent corruption
        if snapshot.page_id != page_id {
            return Err(format!(
                "Memory ID mismatch in snapshot {:?}",
                snapshot_metadata_path
            ));
        }

        if snapshot.id == page_meta.head_snapshot_id {
            head_snapshot = Some(snapshot.clone());
        }

        snapshots.push(snapshot);
    }

    let head_snapshot = head_snapshot.ok_or_else(|| {
        format!(
            "Active snapshot '{}' not found for memory '{}'",
            page_meta.head_snapshot_id, page_id
        )
    })?;

    Ok(VersionedPage {
        page_meta,
        head_snapshot,
        snapshots,
    })
}


/// Creates a new `Page` with its initial `Snapshot`, persisted atomically.
///
/// # Overview
///
/// `create_page_with_initial_snapshot` is a **strict, non-idempotent constructor**
/// for a `Page`. It persists the page metadata and its first `Snapshot`
/// using a staging directory followed by a single atomic rename.
///
/// The `page.id` is treated as a **strong, immutable identity**.
/// If a page with the same id already exists, the function fails
/// and performs no overwrite.
///
/// # Persistence Model
///
/// All data is written to a staging directory first:
///
/// ```text
/// page_store/
/// ├─ .staging/
/// │  └─ {page_id}/
/// │     ├─ page.json
/// │     └─ snapshots/
/// │        └─ {snapshot_id}/
/// │           ├─ metadata.json
/// │           └─ content.json
/// ```
///
/// After all writes succeed, the staging directory is atomically renamed to:
///
/// ```text
/// page_store/{page_id}/
/// ```
///
/// This guarantees that callers never observe a partially written page
/// at its final location.
///
/// # Staging Semantics
///
/// - If `.staging/{page_id}` already exists, it is fully deleted before use.
///   This allows safe retries after crashes or partial failures.
/// - Staging cleanup is local to this operation.
/// - The final `rename` is the only visibility boundary.
///
/// # Identity & Idempotency
///
/// - `page.id` is a unique, immutable identifier.
/// - This function is **not idempotent**.
/// - If `page_store/{page_id}` already exists, the function returns `Err`
///   and performs no overwrite.
///
/// Replacement or mutation must be handled by a separate, explicit API
/// (e.g. `replace_page`, `add_snapshot`, etc.).
///
/// # Failure Guarantees
///
/// - If serialization fails, nothing is written.
/// - If any filesystem operation fails before commit, the final page
///   directory is untouched.
/// - On error, partial data may exist only under
///   `.staging/{page_id}`.
/// - If the function returns `Err`, the final page path is guaranteed
///   to remain unchanged.
///
/// # Parameters
///
/// - `app`: Application handle used to resolve the page store directory.
/// - `page`: Page metadata (persisted as `page.json`).
/// - `snapshot`: Initial snapshot, including metadata and `content_json`.
///
/// # Returns
///
/// - `Ok(VersionedPage)` with the newly created page and its snapshot.
/// - `Err(String)` if serialization, filesystem operations, or identity
///   invariants fail.
///
/// # Concurrency Assumptions
///
/// This function assumes exclusive ownership of `page.id`.
/// Concurrent creates with the same id result in a failure at commit time.
///
/// # Panics
///
/// This function does not panic. All failures are returned as `Err(String)`.
///
/// # Examples
///
/// ```rust,ignore
/// let page_meta = PageMeta {
///     id: "page_1".to_string(),
///     title: "My First Page".to_string(),
///     ..Default::default()
/// };
/// let snapshot = Snapshot {
///     id: "snapshot_1".to_string(),
///     page_id: "page_1".to_string(),
///     content_json: serde_json::json!({}),
///     ..Default::default()
/// };
/// let versioned_page = create_page_with_initial_snapshot(app, page_meta, snapshot)?;
/// ```
#[command]
pub fn create_page_with_initial_snapshot(
    app: AppHandle,
    page_meta: PageMeta,
    snapshot: Snapshot,
) -> Result<VersionedPage, String> {
    let page_store_dir = page_store_dir(app.clone())?;

    let staging_page_path = page_store_dir
        .join(".staging")
        .join(page_meta.id.clone());
    {
        use std::fs::*;
        if staging_page_path.exists() {
            remove_dir_all(&staging_page_path)
                .map_err(|e| format!("Failed to delete the .staging/{{page_id}}: {}", e))?;
        }
        create_dir_all(&staging_page_path)
            .map_err(|e| format!("Failed to create the .staging/{{page_id}}: {}", e))?;
    }
    let page_path = page_store_dir.join(page_meta.id.clone());

    let page_json_path = staging_page_path.join("page.json");
    let page_json = serde_json::to_string_pretty(&page_meta)
        .map_err(|e| format!("Failed to serialize page to string: {}", e))?;
    let snapshot_path = staging_page_path
        .join("snapshots")
        .join(snapshot.id.clone());
    let snapshot_json_path = snapshot_path.join("metadata.json");
    let node_json = serde_json::to_string_pretty(&snapshot)
        .map_err(|e| format!("Failed to serialize snapshot to string: {}", e))?;
    let node_content_json_path = snapshot_path.join("content.json");
    let node_content_json =
        serde_json::to_string_pretty(&snapshot.content_json).map_err(|e| {
            format!(
                "Failed to serialize snapshot.content_json to string: {}",
                e
            )
        })?;
    {
        use std::fs;

        fs::create_dir_all(&snapshot_path).map_err(|e| format!("Failed to create node_dir: {}", e))?;

        fs::write(&page_json_path, &page_json).map_err(|e| {
            format!(
                "Failed to write to {:#?}/metadata.json: {}",
                page_json_path, e
            )
        })?;
        fs::write(&snapshot_json_path, &node_json).map_err(|e| {
            format!(
                "Failed to write to {:#?}/metadata.json: {}",
                snapshot_json_path, e
            )
        })?;
        fs::write(&node_content_json_path, &node_content_json).map_err(|e| {
            format!(
                "Failed to write to {:#?}/content.json: {}",
                snapshot_json_path, e
            )
        })?;

        if page_path.exists() {
            return Err(format!(
                "Page '{}' already exists; create_memory_item is not idempotent",
                page_meta.id
            ));
        }
        fs::rename(&staging_page_path, &page_path).map_err(|e| {
            format!(
                "Failed to rename from {:#?} to {:#?}: {}",
                &staging_page_path, &page_path, e
            )
        })?;
    }
    let page = load_page_details(app, page_meta.id).map_err(|e| format!("Failed to load page details: {}",e))?;
    Ok(page)
}

/// Adds a new snapshot to an existing page.
///
/// # Overview
///
/// `create_new_snapshot_of_page` appends a new `Snapshot` to an already existing
/// `Page`. The operation is **strict and non-idempotent**, ensuring that:
///
/// - The parent page exists on disk.
/// - The snapshot ID is unique within that page.
/// - Both are persisted using atomic staging and commit.
///
/// Snapshots represent versioned states of a page. Each snapshot contains
/// metadata and content. The page metadata tracks the `head_snapshot_id`,
/// which points to the active snapshot.
///
/// # Persistence Model
///
/// Snapshots are stored under the page's `snapshots/` directory:
///
/// ```text
/// page_store/{page_id}/
/// ├─ page.json
/// └─ snapshots/
///    ├─ {existing_snapshot_id}/
///    │  ├─ metadata.json
///    │  └─ content.json
///    └─ {new_snapshot_id}/
///       ├─ metadata.json
///       └─ content.json
/// ```
///
/// During creation, snapshot data is staged in:
///
/// ```text
/// page_store/{page_id}/snapshots/.staging/{snapshot_id}/
/// ```
///
/// After all files are written successfully, the staging directory is
/// atomically renamed to the final location.
///
/// # Atomic Updates
///
/// After the snapshot is committed, the page metadata (`page.json`) is
/// updated atomically using a temporary file and rename:
///
/// 1. Write updated metadata to `page.json.tmp`
/// 2. Rename `page.json.tmp` to `page.json`
///
/// This ensures that page metadata updates are never partially visible.
///
/// # Staging Semantics
///
/// - Staging is **local to this operation** and scoped to the snapshot being added.
/// - If the final snapshot directory already exists, the operation fails and
///   no overwrite occurs.
/// - The staging directory is not committed unless all writes succeed.
/// - Stale `.staging` directories are cleaned up before writing new snapshots.
///
/// This guarantees that callers never observe a partially created snapshot.
///
/// # Identity & Idempotency
///
/// - `snapshot.id` is treated as a **strong identity** within the page.
/// - This function is **not idempotent**.
/// - Attempting to add a snapshot with an existing `snapshot.id` results in an error.
///
/// Updating or replacing a snapshot must be handled by a separate, explicit API.
///
/// # Failure Guarantees
///
/// - If serialization fails, no filesystem changes are committed.
/// - If any file write fails, the final snapshot directory is not created.
/// - If the function returns `Err`, all existing snapshots remain unchanged.
/// - Partial data may remain only inside `.staging/{snapshot_id}`.
/// - If snapshot commit succeeds but page metadata update fails, the error
///   message indicates this ("Snapshots created, but failed to update...").
///
/// # Parameters
///
/// - `app`: Application handle used to resolve the page store directory.
/// - `page_meta`: The metadata of the parent page. The `head_snapshot_id`
///   should be updated to the new snapshot's ID if you want it to become active.
/// - `snapshot`: The snapshot to be created and persisted, including metadata
///   and `content_json`.
///
/// # Returns
///
/// - `Ok(VersionedPage)`: The updated page with all snapshots, including the new one.
/// - `Err(String)`: If the parent page does not exist, the snapshot ID collides,
///   serialization fails, or filesystem operations fail.
///
/// # Preconditions
///
/// - The page identified by `page_meta.id` must already exist on disk.
/// - The caller should ensure `snapshot.page_id == page_meta.id`.
/// - The snapshot ID must be unique within the page.
///
/// # Notes
///
/// - This function does not validate the existence or integrity of the parent
///   page beyond filesystem layout expectations.
/// - Cleanup of stale `.staging` directories is performed at the beginning
///   of each operation.
/// - The page metadata must be valid JSON; if not, the update fails with
///   an appropriate error.
///
/// # Panics
///
/// This function does not panic. All errors are returned as `Err(String)`.
///
/// # Examples
///
/// ```rust,ignore
/// let mut page_meta = existing_page.page_meta.clone();
/// page_meta.head_snapshot_id = "snapshot_2".to_string();
///
/// let new_snapshot = Snapshot {
///     id: "snapshot_2".to_string(),
///     page_id: "page_1".to_string(),
///     content_json: serde_json::json!({"updated": true}),
///     ..Default::default()
/// };
///
/// let updated_page = create_new_snapshot_of_page(app, page_meta, new_snapshot)?;
/// println!("Page now has {} snapshots", updated_page.snapshots.len());
/// ```
#[command]
pub fn create_new_snapshot_of_page(
    app: AppHandle,
    page_meta: PageMeta,
    snapshot: Snapshot,
) -> Result<VersionedPage, String> {
    use std::fs;

    let page_store_dir = page_store_dir(app.clone())?;
    let page_dir = page_store_dir.join(&page_meta.id);

    if !page_dir.exists() {
        return Err(format!(
            "Page '{}' does not exist",
            page_meta.id
        ));
    }

    let snapshots_dir = page_dir.join("snapshots");
    fs::create_dir_all(&snapshots_dir)
        .map_err(|e| format!("Failed to ensure snapshots dir {:#?}: {}", snapshots_dir, e))?;

    let snapshot_dir = snapshots_dir.join(&snapshot.id);
    if snapshot_dir.exists() {
        return Err(format!(
            "Snapshot '{}' already exists",
            snapshot.id
        ));
    }

    let staging_snapshot_dir = snapshots_dir.join(".staging").join(&snapshot.id);

    // Always start from a clean staging dir
    if staging_snapshot_dir.exists() {
        fs::remove_dir_all(&staging_snapshot_dir)
            .map_err(|e| format!("Failed to clean staging snapshot dir: {}", e))?;
    }

    // --- Stage snapshot ---
    let stage_result = (|| {
        fs::create_dir_all(&staging_snapshot_dir)
            .map_err(|e| format!("Failed to create staging snapshot dir: {}", e))?;

        fs::write(
            staging_snapshot_dir.join("metadata.json"),
            serde_json::to_string_pretty(&snapshot)
                .map_err(|e| format!("Serialize node metadata failed: {}", e))?,
        )
        .map_err(|e| format!("Write node metadata failed: {}", e))?;

        fs::write(
            staging_snapshot_dir.join("content.json"),
            serde_json::to_string_pretty(&snapshot.content_json)
                .map_err(|e| format!("Serialize node content.json failed: {}", e))?,
        )
        .map_err(|e| format!("Write node content.json failed: {}", e))?;

        Ok(())
    })();

    if let Err(e) = stage_result {
        let _ = fs::remove_dir_all(&staging_snapshot_dir);
        return Err(e);
    }

    // --- Commit node ---
    fs::rename(&staging_snapshot_dir, &snapshot_dir)
        .map_err(|e| format!("Failed to commit snapshot {}: {}", snapshot.id, e))?;

    // --- Atomically update page.json ---
    let page_json_path = page_dir.join("page.json");
    let page_json_tmp_path = page_dir.join("page.json.tmp");

    fs::write(
        &page_json_tmp_path,
        serde_json::to_string_pretty(&page_meta)
            .map_err(|e| format!("Serialize memory page failed: {}", e))?,
    )
    .map_err(|e| format!("Write temp page failed: {}", e))?;

    fs::rename(&page_json_tmp_path, &page_json_path).map_err(|e| {
        format!(
            "Snapshots '{}' created, but failed to update memory page: {}",
            snapshot.id, e
        )
    })?;
    let page = load_page_details(app, page_meta.id).map_err(|e| format!("Failed to load page details: {}",e))?;
    Ok(page)
}

/// Adds a tag to a page's metadata.
///
/// # Overview
///
/// `upsert_tag_on_page` associates a tag with a page by storing the tag ID
/// in the page's metadata. If the tag is already associated, the operation
/// is idempotent and performs no change.
///
/// Tags are stored as a list of IDs in `page.json`. This function:
/// - Loads the current page metadata
/// - Appends the tag ID if not already present
/// - Atomically updates `page.json`
///
/// # Atomicity
///
/// The metadata update uses a staged write + atomic rename pattern:
/// 1. Write updated metadata to `page.json.tmp`
/// 2. Rename `page.json.tmp` to `page.json` (atomic)
///
/// This ensures the metadata file is never partially written.
///
/// # Parameters
///
/// - `app`: Application handle for resolving the page store directory.
/// - `page_id`: The ID of the page to tag.
/// - `tag_id`: The ID of the tag to add.
///
/// # Returns
///
/// - `Ok(PageMeta)`: The updated page metadata with the tag added.
/// - `Err(String)`: If the page does not exist, metadata is corrupted,
///   or filesystem operations fail.
///
/// # Errors
///
/// Errors include:
/// - The page directory does not exist.
/// - `page.json` cannot be read or is malformed.
/// - The temporary file cannot be written.
/// - The atomic rename fails.
///
/// # Idempotency
///
/// If the tag is already present, the function returns `Ok` without changes.
/// This makes it safe to call multiple times with the same tag ID.
///
/// # Examples
///
/// ```rust,ignore
/// let updated_meta = upsert_tag_on_page(app, "page_1".to_string(), "tag_important".to_string())?;
/// println!("Page now has {} tags", updated_meta.tags.len());
/// ```
#[command]
pub fn upsert_tag_on_page(
    app: AppHandle,
    page_id: String,
    tag_id: String,
) -> Result<PageMeta, String> {
    use std::fs;

    let page_store_dir = page_store_dir(app)?;
    let page_dir = page_store_dir.join(&page_id);

    if !page_dir.is_dir() {
        return Err(format!("Page '{}' does not exist", page_id));
    }

    let page_json_path = page_dir.join("page.json");
    let page_json_tmp_path = page_dir.join("page.json.tmp");

    let raw = fs::read_to_string(&page_json_path)
        .map_err(|e| format!("Failed to read page metadata: {}", e))?;

    let mut page_meta: PageMeta = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse page metadata: {}", e))?;

    // Only store tag IDs on the page
    if !page_meta.tags.contains(&tag_id) {
        page_meta.tags.push(tag_id);
    }

    let serialized = serde_json::to_string_pretty(&page_meta)
        .map_err(|e| format!("Failed to serialize page metadata: {}", e))?;

    fs::write(&page_json_tmp_path, serialized)
        .map_err(|e| format!("Failed to write temp page metadata: {}", e))?;

    fs::rename(&page_json_tmp_path, &page_json_path)
        .map_err(|e| format!("Failed to atomically replace page metadata: {}", e))?;

    Ok(page_meta)
}

/// Removes a tag from a page's metadata.
///
/// # Overview
///
/// `delete_tag_from_page` disassociates a tag from a page by removing its ID
/// from the page's metadata. The operation is strict: if the tag is not present,
/// an error is returned.
///
/// Tags are removed from the list of tag IDs in `page.json`. This function:
/// - Loads the current page metadata
/// - Removes the tag ID if present
/// - Returns an error if the tag was not found
/// - Atomically updates `page.json`
///
/// # Atomicity
///
/// The metadata update uses a staged write + atomic rename pattern:
/// 1. Write updated metadata to `page.json.tmp`
/// 2. Rename `page.json.tmp` to `page.json` (atomic)
///
/// This ensures the metadata file is never partially written.
///
/// # Parameters
///
/// - `app`: Application handle for resolving the page store directory.
/// - `page_id`: The ID of the page from which to remove the tag.
/// - `tag_id`: The ID of the tag to remove.
///
/// # Returns
///
/// - `Ok(PageMeta)`: The updated page metadata with the tag removed.
/// - `Err(String)`: If the page does not exist, the tag is not found, metadata
///   is corrupted, or filesystem operations fail.
///
/// # Errors
///
/// Errors include:
/// - The page directory does not exist.
/// - The tag ID is not present on the page.
/// - `page.json` cannot be read or is malformed.
/// - The temporary file cannot be written.
/// - The atomic rename fails.
///
/// # Strictness
///
/// Unlike [`upsert_tag_on_page`], this function fails if the tag is not present.
/// Use this when you want to ensure the tag was actually deleted and detect
/// unexpected states.
///
/// # Examples
///
/// ```rust,ignore
/// let updated_meta = delete_tag_from_page(app, "page_1".to_string(), "tag_important".to_string())?;
/// println!("Page now has {} tags", updated_meta.tags.len());
/// ```
#[command]
pub fn delete_tag_from_page(
    app: AppHandle,
    page_id: String,
    tag_id: String,
) -> Result<PageMeta, String> {
    use std::fs;

    let page_store_dir = page_store_dir(app)?;
    let page_dir = page_store_dir.join(&page_id);

    if !page_dir.is_dir() {
        return Err(format!("Page '{}' does not exist", page_id));
    }

    let page_json_path = page_dir.join("page.json");
    let page_json_tmp_path = page_dir.join("page.json.tmp");

    let raw = fs::read_to_string(&page_json_path)
        .map_err(|e| format!("Failed to read page metadata: {}", e))?;

    let mut page_meta: PageMeta = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to deserialize page metadata: {}", e))?;

    let before = page_meta.tags.len();

    // Delete tag by ID
    page_meta.tags.retain(|t| t != &tag_id);

    if page_meta.tags.len() == before {
        return Err(format!(
            "Tag '{}' not found on page '{}'",
            tag_id, page_id
        ));
    }

    let serialized = serde_json::to_string_pretty(&page_meta)
        .map_err(|e| format!("Failed to serialize page metadata: {}", e))?;

    fs::write(&page_json_tmp_path, serialized)
        .map_err(|e| format!("Failed to write temp page metadata: {}", e))?;

    fs::rename(&page_json_tmp_path, &page_json_path)
        .map_err(|e| format!("Failed to atomically replace page metadata: {}", e))?;

    Ok(page_meta)
}

/// Deletes a page and all its associated snapshots.
///
/// # Overview
///
/// `delete_page` removes an entire page directory (including all snapshots,
/// metadata, and content) from the page store. The operation is performed
/// using a safe **move-then-delete** pattern:
///
/// 1. The page directory is moved to a `.delete/` staging area
/// 2. The staged directory is then removed
///
/// This two-stage approach provides some protection against concurrent
/// access and allows for potential recovery if needed during implementation.
///
/// # Deletion Pattern
///
/// ```text
/// Before:
/// page_store/
/// ├─ page_id/
/// │  ├─ page.json
/// │  └─ snapshots/
/// └─ ...
///
/// After:
/// page_store/
/// ├─ .delete/
/// │  └─ page_id/       <- deleted on next step
/// └─ ...
/// ```
///
/// # Parameters
///
/// - `app`: Application handle for resolving the page store directory.
/// - `page_id`: The ID of the page to delete.
///
/// # Returns
///
/// - `Ok(())`: If the page and all its contents are successfully deleted.
/// - `Err(String)`: If the page does not exist, cannot be moved, or cannot be deleted.
///
/// # Errors
///
/// Errors include:
/// - The page directory does not exist (returns specific "does not exist" message).
/// - The page directory cannot be renamed to the staging area.
/// - The `.delete/` directory cannot be created.
/// - The staged directory cannot be fully removed.
///
/// # Strictness
///
/// This function is strict: if the page does not exist, it returns an error
/// rather than succeeding silently. This helps detect unexpected states.
///
/// # Failure Guarantees
///
/// - If the page cannot be moved to `.delete/`, the original page directory
///   remains untouched.
/// - If the deletion from `.delete/` fails, the page data remains in the
///   staging area and can potentially be recovered.
/// - If the function returns `Err`, the original page at `page_store/{page_id}/`
///   is guaranteed to be unchanged.
///
/// # Performance Notes
///
/// The time complexity is O(S), where S is the total size of all snapshots
/// and metadata. For large pages with many snapshots, deletion may take time.
///
/// # Examples
///
/// ```rust,ignore
/// delete_page(app, "page_1".to_string())?;
/// println!("Page successfully deleted");
/// ```
#[command]
pub fn delete_page(app: AppHandle, page_id: String) -> Result<(), String> {
    use std::fs;

    let page_store_dir = page_store_dir(app)?;
    let page_dir = page_store_dir.join(&page_id);
    let delete_root = page_store_dir.join(".delete");
    let delete_target = delete_root.join(&page_id);

    fs::create_dir_all(&delete_root)
        .map_err(|e| format!("Failed to create .delete directory: {}", e))?;

    fs::rename(&page_dir, &delete_target).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            format!("Page {} does not exist", page_id)
        } else {
            format!(
                "Failed to move {:?} to {:?}: {}",
                page_dir, delete_target, e
            )
        }
    })?;

    fs::remove_dir_all(&delete_target)
        .map_err(|e| format!("Failed to delete page {}: {}", page_id, e))?;

    Ok(())
}