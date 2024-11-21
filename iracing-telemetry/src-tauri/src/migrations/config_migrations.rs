use tauri_plugin_sql::{Migration, MigrationKind};

pub mod config_migrations {
  pub const config_migration: tauri_plugin_sql::Migration = Migration {
      version: 1,
      description: "create_initial_tables",
      sql: "CREATE TABLE config (id INTEGER PRIMARY KEY, key TEXT, value: TEXT);",
      kind: MigrationKind::Up,
  };
}
