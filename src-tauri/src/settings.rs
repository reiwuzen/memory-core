use tauri::{AppHandle, command};
use crate::utils::get_app_dir;
use std::{fs, path::Path};
#[command]
pub fn clear_data(app: AppHandle) -> Result<(), String> {
    let app_data_dir = get_app_dir(&app)
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    let path = Path::new(&app_data_dir);

    // 1. If it doesn't exist, we're already clean. Idempotency matters.
    if !path.exists() {
        return Ok(());
    }

    // 2. Sanity check: never allow deleting root-like paths
    if path.as_os_str().is_empty() || path.parent().is_none() {
        return Err("Refusing to delete an unsafe directory path".into());
    }

    // 3. Remove contents, not the directory itself (safer)
    let entries = fs::read_dir(path)
        .map_err(|e| format!("Failed to read app data directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            fs::remove_dir_all(&entry_path)
                .map_err(|e| format!("Failed to remove directory {:?}: {}", entry_path, e))?;
        } else {
            fs::remove_file(&entry_path)
                .map_err(|e| format!("Failed to remove file {:?}: {}", entry_path, e))?;
        }
    }

    Ok(())
}
