use std::path::PathBuf;

use crate::{
    schema::{MemoryItem, MemoryNode},
    utils::get_app_dir,
};
use tauri::{
    //  Manager,
    command,
    AppHandle,
};
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

/// fn to save a memory item
#[command]
pub fn save_memory_item(app: AppHandle, memory_item: MemoryItem) -> Result<(), String> {
    let app_dir = get_app_dir(app)?;
    let memory_spaces_dir = app_dir.join("memory_spaces");
    let memory_item_path = memory_spaces_dir.join(&memory_item.memory_id);

    std::fs::create_dir_all(&memory_item_path)
        .map_err(|e| format!("Cannot create memory item directory: {}", e))?;

    let json = serde_json::to_string_pretty(&memory_item)
        .map_err(|e| format!("Cannot serialize memory item: {}", e))?;

    let tmp_path = memory_item_path.join("metadata.json.tmp");
    let final_path = memory_item_path.join("metadata.json");

    std::fs::write(&tmp_path, json)
        .map_err(|e| format!("Cannot write temp metadata file: {}", e))?;

    std::fs::rename(&tmp_path, &final_path)
        .map_err(|e| format!("Cannot finalize metadata write: {}", e))?;

    Ok(())
}

/// fn to save a memory node
#[command]
pub fn save_memory_node(app: AppHandle, memory_node: MemoryNode) -> Result<(), String> {
    let app_dir = get_app_dir(app)?;
    let memory_spaces_dir = app_dir.join("memory_spaces");

    let memory_item_path = memory_spaces_dir.join(&memory_node.memory_id);
    let nodes_dir = memory_item_path.join(format!("nodes/{}", &memory_node.node_id));

    std::fs::create_dir_all(&nodes_dir).map_err(|e| format!("Cannot create nodes_dir: {}", e))?;

    let json = serde_json::to_string_pretty(&memory_node)
        .map_err(|e| format!("Cannot serialize memory node: {}", e))?;

    let content_json = serde_json::to_string_pretty(&memory_node.content_json)
        .map_err(|e| format!("Cannot serialize memory node content: {}", e))?;

    let tmp_content_md_path = nodes_dir.join("content.md.tmp");
    let final_content_md_path = nodes_dir.join("content.md");

    let tmp_content_json_path = nodes_dir.join("content.json.tmp");
    let final_content_json_path = nodes_dir.join("content.json");

    let tmp_path = nodes_dir.join("metadata.json.tmp");
    let final_path = nodes_dir.join("metadata.json");

    std::fs::write(&tmp_content_json_path, content_json)
        .map_err(|e| format!("Cannot write temp content json: {}", e))?;
    std::fs::rename(&tmp_content_json_path, &final_content_json_path)
        .map_err(|e| format!("Cannot finalize node content_json: {}", e))?;

    std::fs::write(&tmp_content_md_path, memory_node.content_string)
        .map_err(|e| format!("Cannot write temp content_md: {}", e))?;
    std::fs::rename(&tmp_content_md_path, &final_content_md_path)
        .map_err(|e| format!("Cannot finalize node content_md: {}", e))?;

    std::fs::write(&tmp_path, json).map_err(|e| format!("Cannot write temp node file: {}", e))?;
    std::fs::rename(&tmp_path, &final_path)
        .map_err(|e| format!("Cannot finalize node write: {}", e))?;
    Ok(())
}

/// fn to load all memory items
#[command]
pub fn load_all_memory_items(app: AppHandle) -> Result<Vec<MemoryItem>, String> {
    let app_dir = get_app_dir(app)?;
    let memory_spaces_dir = app_dir.join("memory_spaces");

    let mut all_memory_items = Vec::new();

    // 1. Ensure memory_spaces exists
    let entries = std::fs::read_dir(&memory_spaces_dir)
        .map_err(|e| format!("Failed to read memory_spaces dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // 2. Only care about directories
        if !path.is_dir() {
            continue;
        }

        // 3. metadata.json path
        let metadata_path = path.join("metadata.json");

        if !metadata_path.exists() {
            // skip silently OR log
            continue;
        }

        // 4. Read file
        let metadata_str = std::fs::read_to_string(&metadata_path)
            .map_err(|e| format!("Failed to read {:?}: {}", metadata_path, e))?;

        // 5. Deserialize
        let memory_item: MemoryItem = serde_json::from_str(&metadata_str)
            .map_err(|e| format!("Invalid metadata.json in {:?}: {}", metadata_path, e))?;

        all_memory_items.push(memory_item);
    }

    Ok(all_memory_items)
}

/// fn to load the active memory node of a given memory item
#[command]
pub fn load_active_memory_node_of_memory_item(
    app: AppHandle,
    memory_item: MemoryItem,
) -> Result<MemoryNode, String> {
    let app_dir = get_app_dir(app)?;

    let active_memory_node_dir = app_dir
        .join("memory_spaces")
        .join(&memory_item.memory_id)
        .join("nodes")
        .join(&memory_item.active_node_id);

    let metadata_path = active_memory_node_dir.join("metadata.json");
    if !metadata_path.exists() {
        return Err(format!(
            "Active memory node metadata does not exist: {:?}",
            metadata_path
        ));
    }

    let metadata_str = std::fs::read_to_string(&metadata_path)
        .map_err(|e| format!("Failed to read {:?}: {}", metadata_path, e))?;

    let active_memory_node: MemoryNode = serde_json::from_str(&metadata_str)
        .map_err(|e| format!("Invalid metadata.json in {:?}: {}", metadata_path, e))?;

    Ok(active_memory_node)
}

/// fn to load all memory nodes of a given memory item
#[command]
pub fn load_all_memory_nodes_of_memory_item(
    app: AppHandle,
    memory_id: String,
) -> Result<Vec<MemoryNode>, String> {
    let app_dir = get_app_dir(app)?;
    let mut memory_nodes = Vec::new();

    let nodes_dir = app_dir.join("memory_spaces").join(&memory_id).join("nodes");

    let entries = std::fs::read_dir(&nodes_dir)
        .map_err(|e| format!("Failed to read nodes dir {:?}: {}", nodes_dir, e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let node_dir = entry.path();

        // 1. Only node directories
        if !node_dir.is_dir() {
            continue;
        }

        let metadata_path = node_dir.join("metadata.json");

        // 2. metadata.json must exist
        if !metadata_path.exists() {
            continue; // or log warning
        }

        // 3. Read metadata
        let metadata_str = std::fs::read_to_string(&metadata_path)
            .map_err(|e| format!("Failed to read {:?}: {}", metadata_path, e))?;

        // 4. Deserialize
        let memory_node: MemoryNode = serde_json::from_str(&metadata_str)
            .map_err(|e| format!("Invalid metadata.json in {:?}: {}", metadata_path, e))?;

        // 5. Optional integrity check (HIGHLY recommended)
        if memory_node.memory_id != memory_id {
            return Err(format!("Memory ID mismatch in node {:?}", metadata_path));
        }

        memory_nodes.push(memory_node);
    }

    Ok(memory_nodes)
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
    metadata.active_node_id = node_id;

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
/// `create_memory_item` is a **strict, non-idempotent constructor** for a
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
/// │           ├─ metajson.json
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
pub fn create_memory_item(
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
    let node_json_path = node_path.join("metajson.json");
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
    let node_content_md_path = node_path.join("content.md");
    let node_content_md = memory_node.content_string.clone();
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
        fs::write(&node_content_md_path, &node_content_md)
            .map_err(|e| format!("Failed to write to {:#?}/content.md: {}", node_json_path, e))?;

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
