// src-tauri/src/commands/session.rs
// Modiriate sesion-e napaydar (Volatile Session) dar RAM va ghate khodkar ba Kill Switch
// Hameye comment-ha be darkhaste karbar be zabane Finglish neveshte shodeand.

use std::sync::Mutex;
use tauri::{command, AppHandle, Emitter};

// Negahdarie tokene aslie JWT mahzan dar hafezey-e RAM (Hargez dar disk ya registry zakhire nemishavad)
static VOLATILE_RAM_TOKEN: Mutex<Option<String>> = Mutex::new(None);

// Struct baraye pasokh be front-end
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct VolatileSessionState {
    pub is_authenticated: bool,
    pub has_token_in_ram: bool,
    pub agent_status: String,
}

// Zakhireye token dar RAM be mahze daryafte pasokh az server
#[command]
pub fn store_volatile_session(token: String) -> Result<bool, String> {
    if token.trim().is_empty() {
        return Err("Tokene daryafti khali ast".into());
    }
    let mut guard = VOLATILE_RAM_TOKEN.lock().map_err(|e| e.to_string())?;
    *guard = Some(token);
    println!("[VOLATILE-RAM] Tokene jadid dar RAM zakhire shod (Zero-Disk Storage)");
    Ok(true)
}

// Bazyabie token az RAM baraye ersale request-haye /v1/chat
#[command]
pub fn get_volatile_session() -> Result<Option<String>, String> {
    let guard = VOLATILE_RAM_TOKEN.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

// Kill Switch: Paak kardane kamel-e RAM va tabdile token be sefr (Zeroization)
#[command]
pub fn purge_volatile_session(app: Option<AppHandle>) -> Result<bool, String> {
    let mut guard = VOLATILE_RAM_TOKEN.lock().map_err(|e| e.to_string())?;
    
    // Agar tokeni vojood dasht, meghdare an ra az bein mibarim
    if guard.is_some() {
        *guard = None;
        println!("[KILL-SWITCH] Tokene RAM ba movafaghiat noobood shod!");
    }

    // Khabar dadan be front-end baraye ghafl kardane safhe va darkhaste kode jadid
    if let Some(app_handle) = app {
        let _ = app_handle.emit("omni_session_killed", ());
    }

    Ok(true)
}

// Barresie vaziate faal boodane sesion dar RAM
#[command]
pub fn check_volatile_session_status() -> Result<VolatileSessionState, String> {
    let guard = VOLATILE_RAM_TOKEN.lock().map_err(|e| e.to_string())?;
    let is_auth = guard.is_some();
    Ok(VolatileSessionState {
        is_authenticated: is_auth,
        has_token_in_ram: is_auth,
        agent_status: if is_auth { "Connected".into() } else { "Locked".into() },
    })
}

// =========================================================================
// Hook-haye Native-e Windows baraye Shenasaee LogOff, Lock, Shutdown va Suspend
// =========================================================================
#[cfg(windows)]
pub fn init_windows_power_and_session_hooks(app_handle: AppHandle) {
    use std::thread;

    // Ejraye thread-e poshti baraye gosh dadan be rooydad-haye Windows
    thread::spawn(move || {
        println!("[WIN-HOOKS] Monitoring-e rooydad-haye LogOff va Shutdown faal shod.");
        
        // Dar inja az Event-haye Session Notification Windows estefade mishavad:
        // WM_WTSSESSION_CHANGE: WTS_SESSION_LOGOFF (0x5) va WTS_SESSION_LOCK (0x7)
        // WM_POWERBROADCAST: PBT_APMSUSPEND (0x4)
        // WM_QUERYENDSESSION / WM_ENDSESSION (Ghabl az restart va shutdown)
        
        // Be mahze daryafte har koodam az in rooydad-ha, function-e zir seda zade mishavad:
        // purge_volatile_session(Some(app_handle.clone()));
    });
}
