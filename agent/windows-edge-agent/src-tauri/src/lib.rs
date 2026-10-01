// src-tauri/src/lib.rs
pub mod commands;

use commands::auth::{load_omni_credentials, save_omni_credentials};
use commands::executor::execute_windows_payload;
use commands::session::{
    check_volatile_session_status, get_volatile_session, purge_volatile_session,
    store_volatile_session,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            save_omni_credentials,
            load_omni_credentials,
            execute_windows_payload,
            store_volatile_session,
            get_volatile_session,
            purge_volatile_session,
            check_volatile_session_status
        ])
        .run(tauri::generate_context!())
        .expect("Khataye ejraye OmniOps Windows Edge Agent");
}

