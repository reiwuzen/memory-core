use std::path::PathBuf;

use tauri::{AppHandle, Manager, command};

#[command]
pub fn get_app_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| format!("Failed to get app data dir: {}", e)).unwrap();
    Ok(app_dir)
}


