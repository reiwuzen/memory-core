// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod schema;
pub mod storage;
pub mod utils;
pub mod tag;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            storage::create_memory_spaces_dir,
            storage::create_memory_item,
            storage::save_memory_item,
            storage::save_memory_node,
            storage::load_all_memory_items,
            storage::load_active_memory_node_of_memory_item,
            storage::load_all_memory_nodes_of_memory_item,
            storage::set_active_node_id_of_memory_item,
            tag::create_tags_dir,
            tag::save_tag,
            tag::load_all_tags,
            tag::delete_tag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
