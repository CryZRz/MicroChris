#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod boards;
mod build;
mod hex;
mod models;
mod process;
mod serial;
mod state;
mod workspace;
use state::Backend;
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Backend::default())
        .invoke_handler(tauri::generate_handler![
            workspace::open_project,
            workspace::create_project,
            workspace::read_file,
            workspace::write_file,
            workspace::rename_file,
            workspace::delete_file,
            serial::ports,
            build::build,
            serial::serial_open,
            serial::serial_close,
            serial::serial_send
        ])
        .run(tauri::generate_context!())
        .expect("No se pudo iniciar MicroChris");
}
