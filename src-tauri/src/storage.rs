use std::path::PathBuf;

use crate::{
    schema::{MemoryItem, MemoryNode, MemoryPayload, Tag},
    utils::get_app_dir,
};
use tauri::{
    //  Manager,
    command,
    AppHandle,
};
// use tokio::fs;
// use tokio::fs as tokio_fs;

/// fn to create memory_spaces directory
#[command]
pub fn create_memory_spaces_dir(app: AppHandle) -> Result<PathBuf, String> {
    let app_dir = get_app_dir(app)?;
    let memory_spaces_dir = app_dir.join("memory_spaces");
    std::fs::create_dir_all(&memory_spaces_dir)
        .map_err(|err| format!("Can not create memory_spaces_dir: {}", err))?;
    Ok(memory_spaces_dir)
}



/// Load all the memories
#[command]
pub fn load_all_memories(app: AppHandle) -> Result<Vec<MemoryPayload>, String> {
    let memory_spaces_dir = create_memory_spaces_dir(app)?;

    let mut result = Vec::new();

    let memory_entries = std::fs::read_dir(&memory_spaces_dir)
        .map_err(|e| format!("Failed to read memory_spaces dir: {}", e))?;

    for entry in memory_entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let memory_dir = entry.path();

        if !memory_dir.is_dir() {
            continue;
        }

        /* ─────────────────── load MemoryItem ─────────────────── */

        let memory_metadata_path = memory_dir.join("metadata.json");
        if !memory_metadata_path.exists() {
            continue; // orphaned dir, ignore
        }

        let memory_metadata_str = std::fs::read_to_string(&memory_metadata_path)
            .map_err(|e| format!("Failed to read {:?}: {}", memory_metadata_path, e))?;

        let memory_item: MemoryItem = serde_json::from_str(&memory_metadata_str)
            .map_err(|e| format!("Invalid metadata.json in {:?}: {}", memory_metadata_path, e))?;

        /* ─────────────────── load nodes ─────────────────── */

        let nodes_dir = memory_dir.join("nodes");
        let mut nodes = Vec::new();
        let mut head_node: Option<MemoryNode> = None;

        if nodes_dir.exists() {
            let node_entries = std::fs::read_dir(&nodes_dir)
                .map_err(|e| format!("Failed to read nodes dir {:?}: {}", nodes_dir, e))?;

            for node_entry in node_entries {
                let node_entry = node_entry.map_err(|e| e.to_string())?;
                let node_dir = node_entry.path();

                if !node_dir.is_dir() {
                    continue;
                }

                let node_metadata_path = node_dir.join("metadata.json");
                if !node_metadata_path.exists() {
                    continue;
                }

                let node_metadata_str = std::fs::read_to_string(&node_metadata_path)
                    .map_err(|e| format!("Failed to read {:?}: {}", node_metadata_path, e))?;

                let node: MemoryNode = serde_json::from_str(&node_metadata_str)
                    .map_err(|e| format!("Invalid metadata.json in {:?}: {}", node_metadata_path, e))?;

                // integrity check
                if node.memory_id != memory_item.memory_id {
                    return Err(format!(
                        "Memory ID mismatch in node {:?}",
                        node_metadata_path
                    ));
                }

                if node.node_id == memory_item.head_node_id {
                    head_node = Some(node.clone());
                }

                nodes.push(node);
            }
        }

        let head_node = head_node.ok_or_else(|| {
            format!(
                "Active node '{}' not found for memory '{}'",
                memory_item.head_node_id, memory_item.memory_id
            )
        })?;

        result.push(MemoryPayload {
            memory_item,
            nodes,
            head_node,
        });
    }

    Ok(result)
}

/// Load one memory item give the id
#[command]
pub fn load_memory_payload(
    app: AppHandle,
    memory_id: String,
) -> Result<MemoryPayload, String> {
    let app_dir = get_app_dir(app)?;

    let memory_dir = app_dir
        .join("memory_spaces")
        .join(&memory_id);

    if !memory_dir.exists() || !memory_dir.is_dir() {
        return Err(format!("Memory '{}' does not exist", memory_id));
    }

    /* ─────────────────── load MemoryItem ─────────────────── */

    let memory_metadata_path = memory_dir.join("metadata.json");
    if !memory_metadata_path.exists() {
        return Err(format!(
            "metadata.json missing for memory '{}'",
            memory_id
        ));
    }

    let memory_metadata_str = std::fs::read_to_string(&memory_metadata_path)
        .map_err(|e| format!("Failed to read {:?}: {}", memory_metadata_path, e))?;

    let memory_item: MemoryItem = serde_json::from_str(&memory_metadata_str)
        .map_err(|e| format!("Invalid metadata.json in {:?}: {}", memory_metadata_path, e))?;

    /* ─────────────────── load nodes ─────────────────── */

    let nodes_dir = memory_dir.join("nodes");
    if !nodes_dir.exists() {
        return Err(format!("Nodes directory missing for memory '{}'", memory_id));
    }

    let mut nodes = Vec::new();
    let mut head_node: Option<MemoryNode> = None;

    let node_entries = std::fs::read_dir(&nodes_dir)
        .map_err(|e| format!("Failed to read nodes dir {:?}: {}", nodes_dir, e))?;

    for entry in node_entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let node_dir = entry.path();

        if !node_dir.is_dir() {
            continue;
        }

        let node_metadata_path = node_dir.join("metadata.json");
        if !node_metadata_path.exists() {
            continue;
        }

        let node_metadata_str = std::fs::read_to_string(&node_metadata_path)
            .map_err(|e| format!("Failed to read {:?}: {}", node_metadata_path, e))?;

        let node: MemoryNode = serde_json::from_str(&node_metadata_str)
            .map_err(|e| format!("Invalid metadata.json in {:?}: {}", node_metadata_path, e))?;

        // HARD invariant — no silent corruption
        if node.memory_id != memory_id {
            return Err(format!(
                "Memory ID mismatch in node {:?}",
                node_metadata_path
            ));
        }

        if node.node_id == memory_item.head_node_id {
            head_node = Some(node.clone());
        }

        nodes.push(node);
    }

    let head_node = head_node.ok_or_else(|| {
        format!(
            "Active node '{}' not found for memory '{}'",
            memory_item.head_node_id, memory_id
        )
    })?;

    Ok(MemoryPayload {
        memory_item,
        nodes,
        head_node,
    })
}



#[command]
pub fn set_active_node_id_of_memory_item(
    app: AppHandle,
    memory_id: String,
    node_id: String,
) -> Result<(), String> {
    let memory_spaces_dir = create_memory_spaces_dir(app)?;

    let memory_dir = memory_spaces_dir.join(&memory_id);
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

/// Creates a new memory item and its initial node on disk.
///
/// # Overview
///
/// `create_memory_item_with_initial_node` is a **strict, non-idempotent constructor** for a
/// `MemoryItem`. It persists the memory item and its first `MemoryNode`
/// atomically using a staging directory and a final commit step.
///
/// The `memory_id` is treated as a **strong identity**. If a memory item with
/// the same `memory_id` already exists, this function **fails** and does not
/// overwrite existing data.
///
/// # Persistence Model
///
/// The function writes all data into a staging directory:
///
/// ```text
/// memory_spaces/
/// ├─ .staging/
/// │  └─ {memory_id}/
/// │     ├─ metadata.json
/// │     └─ nodes/
/// │        └─ {node_id}/
/// │           ├─ metadata.json
/// │           ├─ content.json
/// │           └─ content.md
/// ```
///
/// Once all files are written successfully, the staging directory is atomically
/// renamed to:
///
/// ```text
/// memory_spaces/{memory_id}/
/// ```
///
/// This guarantees that callers will never observe a partially written memory
/// item at the final location.
///
/// # Staging Semantics
///
/// - If `.staging/{memory_id}` already exists, it is **fully deleted** before
///   creation. This allows safe retries after partial failures or crashes.
/// - Staging cleanup is **local to this operation** and does not rely on
///   application startup cleanup.
/// - The final commit step (`rename`) is the single point where the memory item
///   becomes visible.
///
/// # Identity & Idempotency
///
/// - `memory_id` is treated as a **unique, immutable identity**.
/// - This function is **not idempotent**.
/// - If `memory_spaces/{memory_id}` already exists, the function returns an
///   error and performs no overwrite.
///
/// Replacement or updates must be handled by a separate, explicit API
/// (e.g. `replace_memory_item`).
///
/// # Failure Guarantees
///
/// - If serialization fails, no filesystem changes are committed.
/// - If any file write fails, the final directory is not created.
/// - If the function returns `Err`, the final memory item path is guaranteed
///   to be unchanged.
/// - On failure before commit, partial data may remain **only** inside
///   `.staging/{memory_id}`.
///
/// # Parameters
///
/// - `app`: Application handle used to resolve the memory spaces directory.
/// - `memory_item`: Metadata describing the memory item (persisted as JSON).
/// - `memory_node`: Initial node for the memory item, including metadata and
///   content.
///
/// # Returns
///
/// - `Ok(())` if the memory item and node were successfully created and
///   committed.
/// - `Err(String)` if any filesystem, serialization, or invariant check fails.
///
/// # Notes
///
/// - This function assumes exclusive ownership of `memory_id`.
/// - Callers must not generate a new `memory_id` when retrying a failed create.
/// - Cleanup of stale `.staging` entries outside this function is considered
///   hygiene, not correctness.
///
/// # Panics
///
/// This function does not panic. All errors are returned as `Err(String)`.
#[command]
pub fn create_memory_item_with_initial_node(
    app: AppHandle,
    memory_item: MemoryItem,
    memory_node: MemoryNode,
) -> Result<(), String> {
    let memory_spaces_dir = create_memory_spaces_dir(app)?;

    let staging_memory_item_path = memory_spaces_dir
        .join(".staging")
        .join(memory_item.memory_id.clone());
    {
        use std::fs::*;
        if staging_memory_item_path.exists() {
            remove_dir_all(&staging_memory_item_path)
                .map_err(|e| format!("Failed to delete the .staging/{{memory_id}}: {}", e))?;
        }
        create_dir_all(&staging_memory_item_path)
            .map_err(|e| format!("Failed to create the .staging/{{memory_id}}: {}", e))?;
    }
    let memory_item_path = memory_spaces_dir.join(memory_item.memory_id.clone());

    let memory_item_json_path = staging_memory_item_path.join("metadata.json");
    let memory_item_json = serde_json::to_string_pretty(&memory_item)
        .map_err(|e| format!("Failed to serialize memory_item to string: {}", e))?;
    let node_path = staging_memory_item_path
        .join("nodes")
        .join(memory_node.node_id.clone());
    let node_json_path = node_path.join("metadata.json");
    let node_json = serde_json::to_string_pretty(&memory_node)
        .map_err(|e| format!("Failed to serialize memory_node to string: {}", e))?;
    let node_content_json_path = node_path.join("content.json");
    let node_content_json =
        serde_json::to_string_pretty(&memory_node.content_json).map_err(|e| {
            format!(
                "Failed to serialize memory_node.content_json to string: {}",
                e
            )
        })?;
    {
        use std::fs;

        fs::create_dir_all(&node_path).map_err(|e| format!("Failed to create node_dir: {}", e))?;

        fs::write(&memory_item_json_path, &memory_item_json).map_err(|e| {
            format!(
                "Failed to write to {:#?}/metadata.json: {}",
                memory_item_json_path, e
            )
        })?;
        fs::write(&node_json_path, &node_json).map_err(|e| {
            format!(
                "Failed to write to {:#?}/metadata.json: {}",
                node_json_path, e
            )
        })?;
        fs::write(&node_content_json_path, &node_content_json).map_err(|e| {
            format!(
                "Failed to write to {:#?}/content.json: {}",
                node_json_path, e
            )
        })?;
       

        if memory_item_path.exists() {
            return Err(format!(
                "Memory item '{}' already exists; create_memory_item is not idempotent",
                memory_item.memory_id
            ));
        }
        fs::rename(&staging_memory_item_path, &memory_item_path).map_err(|e| {
            format!(
                "Failed to rename from {:#?} to {:#?}: {}",
                &staging_memory_item_path, &memory_item_path, e
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
pub fn add_new_node_to_existing_memory_item(
    app: AppHandle,
    memory_item: MemoryItem,
    memory_node: MemoryNode,
) -> Result<(), String> {
    use std::fs;

    let memory_spaces_dir = create_memory_spaces_dir(app)?;
    let memory_dir = memory_spaces_dir.join(&memory_item.memory_id);

    if !memory_dir.exists() {
        return Err(format!(
            "Memory item '{}' does not exist",
            memory_item.memory_id
        ));
    }

    let nodes_dir = memory_dir.join("nodes");
    fs::create_dir_all(&nodes_dir)
        .map_err(|e| format!("Failed to ensure nodes dir {:#?}: {}", nodes_dir, e))?;

    let node_dir = nodes_dir.join(&memory_node.node_id);
    if node_dir.exists() {
        return Err(format!(
            "Memory node '{}' already exists",
            memory_node.node_id
        ));
    }

    let staging_node_dir = nodes_dir.join(".staging").join(&memory_node.node_id);

    // Always start from a clean staging dir
    if staging_node_dir.exists() {
        fs::remove_dir_all(&staging_node_dir)
            .map_err(|e| format!("Failed to clean staging node dir: {}", e))?;
    }

    // --- Stage node ---
    let stage_result = (|| {
        fs::create_dir_all(&staging_node_dir)
            .map_err(|e| format!("Failed to create staging node dir: {}", e))?;

        fs::write(
            staging_node_dir.join("metadata.json"),
            serde_json::to_string_pretty(&memory_node)
                .map_err(|e| format!("Serialize node metadata failed: {}", e))?,
        )
        .map_err(|e| format!("Write node metadata failed: {}", e))?;

        fs::write(
            staging_node_dir.join("content.json"),
            serde_json::to_string_pretty(&memory_node.content_json)
                .map_err(|e| format!("Serialize node content.json failed: {}", e))?,
        )
        .map_err(|e| format!("Write node content.json failed: {}", e))?;

        

        Ok(())
    })();

    if let Err(e) = stage_result {
        let _ = fs::remove_dir_all(&staging_node_dir);
        return Err(e);
    }

    // --- Commit node ---
    fs::rename(&staging_node_dir, &node_dir)
        .map_err(|e| format!("Failed to commit node {}: {}", memory_node.node_id, e))?;

    // --- Atomically update metadata ---
    let metadata_path = memory_dir.join("metadata.json");
    let tmp_metadata_path = memory_dir.join("metadata.json.tmp");

    fs::write(
        &tmp_metadata_path,
        serde_json::to_string_pretty(&memory_item)
            .map_err(|e| format!("Serialize memory metadata failed: {}", e))?,
    )
    .map_err(|e| format!("Write temp metadata failed: {}", e))?;

    fs::rename(&tmp_metadata_path, &metadata_path)
        .map_err(|e| {
            format!(
                "Node '{}' created, but failed to update memory metadata: {}",
                memory_node.node_id, e
            )
        })?;

    Ok(())
}


#[command]
pub fn upsert_tag_on_memory_item(
    app: AppHandle,
    memory_id: String,
    tag: Tag,
) -> Result<(), String> {
    use std::fs;

    let memory_spaces_dir = create_memory_spaces_dir(app)?;
    let memory_dir = memory_spaces_dir.join(&memory_id);

    if !memory_dir.is_dir() {
        return Err(format!("Memory item '{}' does not exist", memory_id));
    }

    let metadata_path = memory_dir.join("metadata.json");
    let tmp_metadata_path = memory_dir.join("metadata.json.tmp");

    let raw = fs::read_to_string(&metadata_path)
        .map_err(|e| format!("Failed to read memory item metadata: {}", e))?;

    let mut item: MemoryItem = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse memory item metadata: {}", e))?;

    match item.tags.iter_mut().find(|t| t.id == tag.id) {
        Some(existing) => {
            *existing = tag; // update
        }
        None => {
            item.tags.push(tag); // insert
        }
    }

    let serialized = serde_json::to_string_pretty(&item)
        .map_err(|e| format!("Failed to serialize memory item metadata: {}", e))?;

    fs::write(&tmp_metadata_path, serialized)
        .map_err(|e| format!("Failed to write temp memory item metadata: {}", e))?;

    fs::rename(&tmp_metadata_path, &metadata_path)
        .map_err(|e| format!("Failed to atomically replace memory item metadata: {}", e))?;

    Ok(())
}



#[command]
pub fn delete_tag_from_memory_item(
    app: AppHandle,
    memory_id: String,
    tag_id: String,
) -> Result<(), String> {
    use std::fs;

    let memory_spaces_dir = create_memory_spaces_dir(app)?;
    let memory_dir = memory_spaces_dir.join(&memory_id);

    if !memory_dir.exists() {
        return Err(format!("Memory item '{}' does not exist", memory_id));
    }

    let metadata_path = memory_dir.join("metadata.json");
    let tmp_metadata_path = memory_dir.join("metadata.json.tmp");

    let raw = fs::read_to_string(&metadata_path)
        .map_err(|e| format!("Failed to read memory item metadata: {}", e))?;

    let mut item: MemoryItem = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to deserialize memory item metadata: {}", e))?;

    let before = item.tags.len();

    // 🔥 deletion
    item.tags.retain(|t| t.id != tag_id);

    if item.tags.len() == before {
        return Err(format!(
            "Tag '{}' not found on memory item '{}'",
            tag_id, memory_id
        ));
    }

    let serialized = serde_json::to_string_pretty(&item)
        .map_err(|e| format!("Failed to serialize memory item metadata: {}", e))?;

    fs::write(&tmp_metadata_path, serialized)
        .map_err(|e| format!("Failed to write temp memory item metadata: {}", e))?;

    fs::rename(&tmp_metadata_path, &metadata_path)
        .map_err(|e| format!("Failed to atomically replace memory item metadata: {}", e))?;

    Ok(())
}




///
#[command]
pub fn delete_memory_item(app: AppHandle, memory_id: String) -> Result<(), String> {
    use std::fs;

    let memory_spaces_dir = create_memory_spaces_dir(app)?;
    let memory_item_dir = memory_spaces_dir.join(&memory_id);
    let delete_root = memory_spaces_dir.join(".delete");
    let delete_target = delete_root.join(&memory_id);

    fs::create_dir_all(&delete_root)
        .map_err(|e| format!("Failed to create .delete directory: {}", e))?;

    fs::rename(&memory_item_dir, &delete_target).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            format!("Memory item {} does not exist", memory_id)
        } else {
            format!(
                "Failed to move {:?} to {:?}: {}",
                memory_item_dir, delete_target, e
            )
        }
    })?;

    fs::remove_dir_all(&delete_target)
        .map_err(|e| format!("Failed to delete memory item {}: {}", memory_id, e))?;

    Ok(())
}



///
#[command]
pub fn get_memory_item_active_node_nodes(
    app: AppHandle,
    memory_id: String,
) -> Result<MemoryPayload, String> {
    use std::fs;

    let memory_spaces_dir = create_memory_spaces_dir(app)?;
    let memory_space_dir = memory_spaces_dir.join(&memory_id);

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

    for entry in fs::read_dir(&nodes_dir)
        .map_err(|e| format!("failed to read nodes dir: {e}"))?
    {
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

    let head_node = head_node
        .ok_or("head_node_id does not match any node directory")?;
    // println!("{:#?}",head_node);

    Ok(MemoryPayload { memory_item, head_node, nodes })
}

