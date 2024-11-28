#[tauri::command]
pub fn get_db_name() -> String {
    "sqlite:iracing.db".into()
}