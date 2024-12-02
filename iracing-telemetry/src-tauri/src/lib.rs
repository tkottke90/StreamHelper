mod config;
mod db;
mod telemetry;
mod utils;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut db_migrations: Vec<tauri_plugin_sql::Migration> = vec![];
    db_migrations.append(&mut crate::config::config::get_migrations());

    let _ = telemetry::read_telemetry(String::from("/Users/thomaskottke/Nextcloud/Documents/Obsidian/Obsidian Notes/Notes/Projects/Project - Streaming Controller/Assets/lamborghinievogt3_fuji gp 2024-11-16 17-24-11.ibt"));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&crate::db::get_db_name(), db_migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            crate::db::get_db_name,
            crate::config::config::query_config_table_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
