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

/// fn to create page_store directory
///
/// `returns` page_store PathBuf
#[command]
pub fn page_store_dir(app: AppHandle) -> Result<PathBuf, String> {
    let app_dir = get_app_dir(app)?;
    let page_store_dir = app_dir.join("page_store");
    std::fs::create_dir_all(&page_store_dir)
        .map_err(|err| format!("Can not create page_store_dir: {}", err))?;
    Ok(page_store_dir)
}

/// Load all the pages
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

/// Load one memory item give the id
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

#[command]
pub fn set_active_node_id_of_memory_item(
    app: AppHandle,
    memory_id: String,
    node_id: String,
) -> Result<(), String> {
    let page_store_dir = page_store_dir(app)?;

    let memory_dir = page_store_dir.join(&memory_id);
    if !memory_dir.exists() {
        return Err(format!("Memory '{}' does not exist", memory_id));
    }

    // 1. Validate node existence
    let node_dir = memory_dir.join("nodes").join(&node_id);
    if !node_dir.exists() {
        return Err(format!(
            "Node '{}' does not exist in memory '{}'",
            node_id, memory_id
        ));
    }

    // 2. Load metadata.json
    let metadata_path = memory_dir.join("metadata.json");
    if !metadata_path.exists() {
        return Err(format!(
            "metadata.json not found for memory '{}'",
            memory_id
        ));
    }

    let metadata_raw = std::fs::read_to_string(&metadata_path)
        .map_err(|e| format!("Failed to read metadata.json: {}", e))?;

    let mut metadata: MemoryItem =
        serde_json::from_str(&metadata_raw).map_err(|e| format!("Invalid metadata.json: {}", e))?;

    // 3. Mutate
    metadata.head_node_id = node_id;

    // 4. Persist (pretty + deterministic)
    let updated = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

    std::fs::write(&metadata_path, updated)
        .map_err(|e| format!("Failed to write metadata.json: {}", e))?;

    Ok(())
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
/// - `Ok(())` if the page and its initial snapshot are successfully committed.
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
#[command]
pub fn create_page_with_initial_snapshot(
    app: AppHandle,
    page_meta: PageMeta,
    snapshot: Snapshot,
) -> Result<(), String> {
    let page_store_dir = page_store_dir(app)?;

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

    Ok(())
}

/// Adds a new node to an existing memory item.
///
/// # Overview
///
/// `add_new_node_to_existing_memory_item` is a **strict, non-idempotent**
/// operation that appends a new `MemoryNode` to an already existing
/// `MemoryItem`.
///
/// The function assumes that the memory item identified by
/// `memory_item.memory_id` already exists on disk and that node identities
/// (`node_id`) are unique within that memory item.
///
/// Node creation is performed using a **staged write + atomic commit**
/// pattern to ensure that partially written nodes are never visible.
///
/// # Persistence Model
///
/// Nodes are stored under the memory item's `nodes/` directory:
///
/// ```text
/// memory_spaces/{memory_id}/
/// └─ nodes/
///    ├─ {existing_node_id}/
///    └─ {node_id}/
///       ├─ metadata.json
///       ├─ content.json
///       └─ content.md
/// ```
///
/// During creation, node data is first written to:
///
/// ```text
/// memory_spaces/{memory_id}/nodes/.staging/{node_id}/
/// ```
///
/// After all files are written successfully, the staging directory is
/// atomically renamed to its final location.
///
/// # Staging Semantics
///
/// - Staging is **local to this operation** and scoped to the node being added.
/// - If the final node directory already exists, the operation fails and
///   no overwrite occurs.
/// - The staging directory is not committed unless all writes succeed.
///
/// This guarantees that callers will never observe a partially created node.
///
/// # Identity & Idempotency
///
/// - `memory_node.node_id` is treated as a **strong identity**.
/// - This function is **not idempotent**.
/// - Attempting to add a node with an existing `node_id` results in an error.
///
/// Updating or replacing a node must be handled by a separate, explicit API.
///
/// # Failure Guarantees
///
/// - If serialization fails, no filesystem changes are committed.
/// - If any file write fails, the final node directory is not created.
/// - If the function returns `Err`, existing nodes remain unchanged.
/// - Partial data may remain only inside `.staging/{node_id}`.
///
/// # Parameters
///
/// - `app`: Application handle used to resolve the memory spaces directory.
/// - `memory_item`: The parent memory item to which the node will be added.
/// - `memory_node`: The node to be created and persisted.
///
/// # Returns
///
/// - `Ok(())` if the node was successfully written and committed.
/// - `Err(String)` if any invariant check, serialization, or filesystem
///   operation fails.
///
/// # Preconditions
///
/// - The memory item identified by `memory_item.memory_id` must already exist.
/// - The caller must guarantee that `node_id` is unique within the memory item.
///
/// # Notes
///
/// - This function does not validate the existence or integrity of the parent
///   memory item beyond filesystem layout expectations.
/// - Cleanup of stale `.staging` directories is considered hygiene and may be
///   handled elsewhere.
///
/// # Panics
///
/// This function does not panic. All errors are returned as `Err(String)`.
#[command]
pub fn create_new_snapshot_of_page(
    app: AppHandle,
    page_meta: PageMeta,
    snapshot: Snapshot,
) -> Result<(), String> {
    use std::fs;

    let page_store_dir = page_store_dir(app)?;
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

    Ok(())
}

#[command]
pub fn upsert_tag_on_page(
    app: AppHandle,
    page_id: String,
    tag: Tag,
) -> Result<(), String> {
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

    match page_meta.tags.iter_mut().find(|t| t.id == tag.id) {
        Some(existing) => {
            *existing = tag; // update
        }
        None => {
            page_meta.tags.push(tag); // insert
        }
    }

    let serialized = serde_json::to_string_pretty(&page_meta)
        .map_err(|e| format!("Failed to serialize page metadata: {}", e))?;

    fs::write(&page_json_tmp_path, serialized)
        .map_err(|e| format!("Failed to write temp page metadata: {}", e))?;

    fs::rename(&page_json_tmp_path, &page_json_path)
        .map_err(|e| format!("Failed to atomically replace page metadata: {}", e))?;

    Ok(())
}

#[command]
pub fn delete_tag_from_page(
    app: AppHandle,
    page_id: String,
    tag_id: String,
) -> Result<(), String> {
    use std::fs;

    let page_store_dir = page_store_dir(app)?;
    let page_dir = page_store_dir.join(&page_id);

    if !page_dir.exists() {
        return Err(format!("Memory item '{}' does not exist", page_id));
    }

    let page_json_path = page_dir.join("page.json");
    let page_json_tmp_path = page_dir.join("page.json.tmp");

    let raw = fs::read_to_string(&page_json_path)
        .map_err(|e| format!("Failed to read page metadata: {}", e))?;

    let mut item: MemoryItem = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to deserialize page metadata: {}", e))?;

    let before = item.tags.len();

    // 🔥 deletion
    item.tags.retain(|t| t.id != tag_id);

    if item.tags.len() == before {
        return Err(format!(
            "Tag '{}' not found on page '{}'",
            tag_id, page_id
        ));
    }

    let serialized = serde_json::to_string_pretty(&item)
        .map_err(|e| format!("Failed to serialize page metadata: {}", e))?;

    fs::write(&page_json_tmp_path, serialized)
        .map_err(|e| format!("Failed to write temp page metadata: {}", e))?;

    fs::rename(&page_json_tmp_path, &page_json_path)
        .map_err(|e| format!("Failed to atomically replace page metadata: {}", e))?;

    Ok(())
}

///
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

///
#[command]
pub fn get_memory_item_active_node_nodes(
    app: AppHandle,
    memory_id: String,
) -> Result<MemoryPayload, String> {
    use std::fs;

    let page_store_dir = page_store_dir(app)?;
    let memory_space_dir = page_store_dir.join(&memory_id);

    // 1. Read MemoryItem metadata
    let metadata_path = memory_space_dir.join("metadata.json");
    if !metadata_path.exists() {
        return Err("memory item metadata.json not found".into());
    }

    let metadata_str = fs::read_to_string(&metadata_path)
        .map_err(|e| format!("failed to read metadata.json: {e}"))?;

    let memory_item: MemoryItem = serde_json::from_str(&metadata_str)
        .map_err(|e| format!("failed to parse MemoryItem: {e}"))?;

    // 2. Read all nodes
    let nodes_dir = memory_space_dir.join("nodes");
    if !nodes_dir.exists() {
        return Err("nodes directory not found".into());
    }

    let mut nodes: Vec<MemoryNode> = Vec::new();
    let mut head_node: Option<MemoryNode> = None;

    for entry in fs::read_dir(&nodes_dir).map_err(|e| format!("failed to read nodes dir: {e}"))? {
        let entry = entry.map_err(|e| format!("invalid dir entry: {e}"))?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let node_id = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("invalid node directory name")?
            .to_string();

        let node_metadata_path = path.join("metadata.json");
        if !node_metadata_path.exists() {
            continue; // or Err, depending on how strict you want to be
        }

        let node_str = fs::read_to_string(&node_metadata_path)
            .map_err(|e| format!("failed to read node metadata: {e}"))?;

        let node: MemoryNode = serde_json::from_str(&node_str)
            .map_err(|e| format!("failed to parse MemoryNode: {e}"))?;

        if node_id == memory_item.head_node_id {
            head_node = Some(node.clone());
        }

        nodes.push(node);
    }

    let head_node = head_node.ok_or("head_node_id does not match any node directory")?;
    // println!("{:#?}",head_node);

    Ok(MemoryPayload {
        memory_item,
        head_node,
        nodes,
    })
}

#[command]
pub fn update_memory_item_metadata(app: AppHandle, memory_item: MemoryItem) -> Result<(), String> {
    use std::fs;
    let page_store_dir = page_store_dir(app)?;
    let memory_space_dir = page_store_dir.join(&memory_item.memory_id);
    if !memory_space_dir.exists() && !memory_space_dir.is_dir() {
        return Err(format!(
            "Memory item {} does not exists",
            &memory_item.memory_id
        ));
    }
    let json = serde_json::to_string_pretty(&memory_item).map_err(|e| {
        format!(
            "Failed to serialize the memory item {}: {}",
            &memory_item.memory_id, e
        )
    })?;
    let json_path = memory_space_dir.join("metadata.json");

    let tmp_json_path = memory_space_dir.join("metadata.json.tmp");

    {
        fs::write(&tmp_json_path, &json)
            .map_err(|e| format!("Failed to write to metadata.json.tmp :{}", e))?;
        fs::rename(&tmp_json_path, &json_path).map_err(|e| {
            format!(
                "Failed to atomically rename from {:?} to {:?} : {}",
                &tmp_json_path, &json_path, e
            )
        })?;
    }
    Ok(())
}
