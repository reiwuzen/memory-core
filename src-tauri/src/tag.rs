use tauri::{AppHandle, command};
use std::path::PathBuf;
use crate::utils::get_app_dir;
use crate::schema::Tag;

/// fn to create data/tags/ directory if it doesn't exist
#[command]
pub fn create_tags_dir(app:AppHandle) -> Result<PathBuf,String>{
    let app_dir = get_app_dir(app)?;
    let tags_dir  = app_dir.join("tags");
    if !tags_dir.exists() {
        std::fs::create_dir_all(&tags_dir).map_err(|e|format!("Failed to create tags directory: {}",e))?;
    }
    Ok(tags_dir)
}

/// fn to save a tag to data/tags/{tag_id}/metadata.json
#[command]
pub fn save_tag(app:AppHandle, tag:Tag ) -> Result<(),String>{
    let tags_dir = create_tags_dir(app)?;
    let tag_dir = tags_dir.join(tag.id.clone());
    if !tag_dir.exists() {
        std::fs::create_dir_all(&tag_dir).map_err(|e|format!("Failed to create tag directory: {}",e))?;
    }
    let tag_path = tag_dir.join("metadata.json");
    let tag_json = serde_json::to_string_pretty(&tag).map_err(|e|format!("Failed to serialize tag: {}",e))?;
    std::fs::write(&tag_path, tag_json).map_err(|e|format!("Failed to write tag file: {}",e))?;
    Ok(())
}

/// fn to load all the tags from data/tags/ 
#[command]
pub fn load_all_tags(app:AppHandle) -> Result<Vec<Tag>,String>{
    let tags_dir = create_tags_dir(app)?;
    let mut tags = Vec::new();
    for entry in std::fs::read_dir(&tags_dir).map_err(|e|format!("Failed to read tags directory: {}",e))? {
        let entry = entry.map_err(|e|format!("Failed to read tag entry: {}",e))?;
        let tag_metadata_path = entry.path().join("metadata.json");
        if tag_metadata_path.exists() {
            let tag_json = std::fs::read_to_string(&tag_metadata_path).map_err(|e|format!("Failed to read tag file: {}",e))?;
            let tag: Tag = serde_json::from_str(&tag_json).map_err(|e|format!("Failed to deserialize tag: {}",e))?;
            tags.push(tag);
        }
    }
    Ok(tags)
}

/// fn to delete a tag by its id
#[command]
pub fn delete_tag(app:AppHandle, tag_id:String)-> Result<(),String>{
    let tags_dir = create_tags_dir(app)?;
    let tag_dir = tags_dir.join(tag_id);
    std::fs::remove_dir_all(&tag_dir).map_err(|e| format!("Failed to delete the {} <dir> : {}",tag_dir.display(), e))?;
    Ok(())
}