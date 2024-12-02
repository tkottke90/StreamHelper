use tauri_plugin_sql::Migration;
use tauri_plugin_sql::MigrationKind;

const TABLE_NAME: &str = "config";

pub fn get_migrations() -> Vec<tauri_plugin_sql::Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: r#"
CREATE TABLE config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  canDelete BOOLEAN DEFAULT TRUE,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedAt TEXT,
  
  CHECK (canDelete IN (0,1))
);"#,
        kind: MigrationKind::Up,
    }]
}

#[derive(Debug, serde::Serialize)]
pub struct QueryResponse(String, (String, String));

#[tauri::command]
pub fn query_config_table_name() -> String {
    String::from(TABLE_NAME)
}
