// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use crate::migrations::config_migrations;

pub mod migrations;

const DB_NAME: &str = "sqlite:iracing-telem.db";

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_db_name() -> &'static str {
    DB_NAME
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().add_migrations(DB_NAME, config_migration).build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
