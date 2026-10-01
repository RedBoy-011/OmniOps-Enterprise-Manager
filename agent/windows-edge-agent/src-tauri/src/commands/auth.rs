// src-tauri/src/commands/auth.rs
// Modiriate amn-e kelid-haye ertebati dar Windows Credential Manager

use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri::command;

const SERVICE_NAME: &str = "OmniOps_Windows_Edge_Agent";
const KEY_MASTER_URL: &str = "master_server_url";
const KEY_EXCHANGE_TOKEN: &str = "exchange_token";

#[derive(Serialize, Deserialize, Debug)]
pub struct OmniCredentials {
    pub master_url: String,
    pub exchange_token: String,
}

#[command]
pub fn save_omni_credentials(master_url: String, exchange_token: String) -> Result<bool, String> {
    let entry_url = Entry::new(SERVICE_NAME, KEY_MASTER_URL).map_err(|e| e.to_string())?;
    entry_url.set_password(&master_url).map_err(|e| e.to_string())?;

    let entry_token = Entry::new(SERVICE_NAME, KEY_EXCHANGE_TOKEN).map_err(|e| e.to_string())?;
    entry_token.set_password(&exchange_token).map_err(|e| e.to_string())?;

    Ok(true)
}

#[command]
pub fn load_omni_credentials() -> Result<OmniCredentials, String> {
    let entry_url = Entry::new(SERVICE_NAME, KEY_MASTER_URL).map_err(|e| e.to_string())?;
    let master_url = entry_url.get_password().unwrap_or_else(|_| "http://localhost:3000".to_string());

    let entry_token = Entry::new(SERVICE_NAME, KEY_EXCHANGE_TOKEN).map_err(|e| e.to_string())?;
    let exchange_token = entry_token.get_password().unwrap_or_default();

    Ok(OmniCredentials {
        master_url,
        exchange_token,
    })
}
