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
    // Configures Migrations for SQLite db
    let mut db_migrations: Vec<tauri_plugin_sql::Migration> = vec![];
    db_migrations.append(&mut crate::config::config::get_migrations());

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
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
            crate::config::config::query_config_table_name,
            crate::telemetry::read_telemetry_dir,
            crate::telemetry::get_telemetry,
            crate::telemetry::get_data_at_index,
            crate::telemetry::load_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
