use crate::{utils::get_app_dir, schema::{MemoryNode, MemoryItem}};
use tauri::{AppHandle, Manager, command};
// use tokio::fs as tokio_fs;


/// fn to create memory_spaces directory
#[command]
pub fn create_memory_spaces_dir(app:AppHandle) -> Result<(), String>{
    let app_dir = get_app_dir(app)?;
    let memory_spaces_dir = app_dir.join("memory_spaces");
    std::fs::create_dir_all(&memory_spaces_dir).map_err(|err| format!("Can not create memory_spaces_dir: {}", err))?;
    Ok(())
}

/// fn to save a memory item
#[command]
pub fn save_memory_item(app:AppHandle, memory_item: MemoryItem) -> Result<(), String>{
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
pub fn save_memory_node(app:AppHandle, memory_node:MemoryNode)-> Result<(),String>{

    let app_dir = get_app_dir(app)?;
    let memory_spaces_dir = app_dir.join("memory_spaces");

    let memory_item_path = memory_spaces_dir.join(&memory_node.memory_id);
    let nodes_dir = memory_item_path.join(format!("nodes/{}", &memory_node.node_id));

    std::fs::create_dir_all(&nodes_dir).map_err(|e| format!("Cannot create nodes_dir: {}",e))?;

    let json = serde_json::to_string_pretty(&memory_node).map_err(|e| format!("Cannot serialize memory node: {}", e))?;
    
    let tmp_path = nodes_dir.join("metadata.json.tmp");
    let final_path = nodes_dir.join("metadata.json");
    std::fs::write(&tmp_path, json).map_err(|e| format!("Cannot write temp node file: {}", e))?;
    std::fs::rename(&tmp_path, &final_path).map_err(|e| format!("Cannot finalize node write: {}", e))?;
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
pub fn load_active_memory_node_of_memory_item(app: AppHandle, memory_item: MemoryItem) -> Result<MemoryNode,String>{
    let app_dir = get_app_dir(app)?;

    let active_memory_node_dir = app_dir.join("memory_spaces").join(&memory_item.memory_id).join("nodes").join(&memory_item.active_node_id); 

let metadata_path = active_memory_node_dir.join("metadata.json");
    if !metadata_path.exists() {
        return Err(format!("Active memory node metadata does not exist: {:?}", metadata_path));
    }

    let metadata_str = std::fs::read_to_string(&metadata_path).map_err(|e| format!("Failed to read {:?}: {}", metadata_path, e))?;

    let active_memory_node: MemoryNode = serde_json::from_str(&metadata_str).map_err(|e| format!("Invalid metadata.json in {:?}: {}", metadata_path, e))?;


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

    let nodes_dir = app_dir
        .join("memory_spaces")
        .join(&memory_id)
        .join("nodes");

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
            return Err(format!(
                "Memory ID mismatch in node {:?}",
                metadata_path
            ));
        }

        memory_nodes.push(memory_node);
    }

    Ok(memory_nodes)
}