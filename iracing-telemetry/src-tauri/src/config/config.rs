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

#[tauri::command]
pub fn query_create_config(config_key: String, config_value: String) -> (String, (String, String)) {
    let query: String = format!("INSERT into {} (key, value) VALUES ($1, $2) RETURNING *", TABLE_NAME);

    (query, (config_key, config_value))
}

#[tauri::command]
pub fn query_load_configs() -> String {
    format!("SELECT * from {} WHERE deletedAt != NULL;", TABLE_NAME)
}

#[tauri::command]
pub fn query_get_by_id(id: i32) -> (String, i32) {
  let mut query: String = query_load_configs();
  query.push_str(" WHERE id = $1");

  (query, (id))
}

#[tauri::command]
pub fn query_get_by_key(key: String) -> (String, String) {
  let mut query: String = query_load_configs();
  query.push_str(" WHERE id = $1");

  (query, (key))
}