// src-tauri/src/commands/executor.rs
// Ejraye faramine Windows (PowerShell / CMD) bedune baz shodane panjereye siyah-range console

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Deserialize, Debug)]
pub struct ExecutionResult {
    pub success: bool,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[command]
pub fn execute_windows_payload(action: String, command: String) -> Result<ExecutionResult, String> {
    let mut cmd = match action.to_uppercase().as_str() {
        "CMD" => {
            let mut c = Command::new("cmd.exe");
            c.args(["/C", &command]);
            c
        }
        _ => {
            let mut p = Command::new("powershell.exe");
            p.args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                &command,
            ]);
            p
        }
    };

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let exit_code = output.status.code().unwrap_or(-1);

            Ok(ExecutionResult {
                success: output.status.success(),
                exit_code,
                stdout,
                stderr,
            })
        }
        Err(e) => Err(format!("Khataye ejraye command dar OS: {}", e)),
    }
}
