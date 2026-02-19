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
            storage::page_store_dir,
            storage::create_page_with_initial_snapshot,
            storage::create_new_snapshot_of_page,
            storage::delete_page,
            storage::upsert_tag_on_page,
            storage::delete_tag_from_page,
            storage::get_memory_item_active_node_nodes,
            storage::load_all_pages,
            storage::load_page_details,
            storage::set_active_node_id_of_memory_item,
            storage::update_memory_item_metadata,
            tag::create_tags_dir,
            tag::save_tag,
            tag::load_all_tags,
            tag::delete_tag,
            settings::clear_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
