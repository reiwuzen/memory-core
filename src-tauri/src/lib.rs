// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod schema;
pub mod storage;
pub mod utils;
pub mod tag;
pub mod settings;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            storage::create_memory_spaces_dir,
            storage::create_memory_item_with_initial_node,
            storage::add_new_node_to_existing_memory_item,
            storage::delete_memory_item,
            storage::upsert_tag_on_memory_item,
            storage::delete_tag_from_memory_item,
            storage::get_memory_item_active_node_nodes,
            storage::load_all_memories,
            storage::load_memory_payload,
            storage::set_active_node_id_of_memory_item,
            tag::create_tags_dir,
            tag::save_tag,
            tag::load_all_tags,
            tag::delete_tag,
            settings::clear_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
