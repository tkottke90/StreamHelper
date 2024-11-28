mod config;
mod db;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut db_migrations: Vec<tauri_plugin_sql::Migration> = vec![];
    db_migrations.append(&mut crate::config::config::get_migrations());



    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&crate::db::get_db_name(), db_migrations)
                .build()
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            crate::db::get_db_name,
            crate::config::config::query_config_table_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
