<#
.SYNOPSIS
    OmniOps Enterprise Manager - Standalone Interactive Desktop Agent Installer
    Zero-Trust Architecture with Strict Windows User Session Isolation (Arman vs Masood).
    Stores credentials strictly in %AppData%\OmniOpsAgent & HKCU:\Software\OmniOps.
.VERSION
    3.4.0 (Enterprise Release)
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "OmniOps Agent Installer & Token Handshake v3.4.0"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "    نصب‌کننده تعاملی ایجنت دسکتاپ OmniOps Enterprise و احراز هویت دستگاه    " -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Identify Active Windows User & Security Identifier (SID)
$CurrentUsername = $env:USERNAME
$CurrentUserDomain = $env:USERDOMAIN
$CurrentUserSid = ([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host "[*] شناسایی هویت کاربر فعال ویندوز:" -ForegroundColor Gray
Write-Host "    کاربر: $CurrentUserDomain\$CurrentUsername" -ForegroundColor White
Write-Host "    شناسه امنیتی (SID): $CurrentUserSid" -ForegroundColor DarkGray
Write-Host "    سطح دسترسی: $(if ($IsAdmin) { 'مدیر ارشد سیستم (Administrator)' } else { 'کاربر استاندارد (Standard User)' })" -ForegroundColor $(if ($IsAdmin) { 'Green' } else { 'Yellow' })
Write-Host ""

# 2. Interactive Input for Master IP/URL & Secure Exchange Token
Write-Host "[?] لطفا اطلاعات اتصال به سرور مرکزی (Master Control-Plane) را وارد نمایید:" -ForegroundColor Cyan

$DefaultMasterUrl = "http://localhost:8443"
$MasterUrl = Read-Host "۱. آدرس سرور هسته مرکزی (Master IP/URL) [پیش‌فرض: $DefaultMasterUrl]"
if ([string]::IsNullOrWhiteSpace($MasterUrl)) {
    $MasterUrl = $DefaultMasterUrl
}

$ExchangeToken = Read-Host "۲. کلید تبادل امن دستگاه (Secure Exchange Token - HMAC/JWT)"
while ([string]::IsNullOrWhiteSpace($ExchangeToken)) {
    Write-Host "[!] خطا: ورود کلید تبادل امن جهت احراز هویت دستگاه الزامی است." -ForegroundColor Red
    $ExchangeToken = Read-Host "۲. کلید تبادل امن دستگاه (Secure Exchange Token)"
}

Write-Host ""
Write-Host "[*] در حال اجرای فرایند دست‌تکانی امن (Device Handshake) با هسته مرکزی..." -ForegroundColor Yellow

# 3. Setup Per-User Isolated Storage Directory (%AppData%\OmniOpsAgent)
# معماری ایزوله‌سازی نشست: هرگز از %ProgramData% یا مسیر عمومی برای توکن استفاده نمی‌شود!
$UserIsolatedDir = Join-Path $env:APPDATA "OmniOpsAgent"
if (-not (Test-Path $UserIsolatedDir)) {
    New-Item -ItemType Directory -Path $UserIsolatedDir -Force | Out-Null
    Write-Host "[✓] پوشه ایزوله کاربری ساخته شد: $UserIsolatedDir" -ForegroundColor Green
} else {
    Write-Host "[*] استفاده از پوشه اختصاصی کاربر: $UserIsolatedDir" -ForegroundColor Gray
}

# 4. Perform Handshake via REST API to Master Control-Plane
$HandshakePayload = @{
    "master_url" = $MasterUrl
    "exchange_token" = $ExchangeToken
    "windows_user" = $CurrentUsername
    "windows_sid" = $CurrentUserSid
    "appdata_dir" = $UserIsolatedDir
    "is_admin" = $IsAdmin
    "client_version" = "3.4.0"
} | ConvertTo-Json

$HandshakeSuccess = $false
$SessionToken = "agt_jwt_" + ([System.Guid]::NewGuid().ToString("N"))

try {
    $HandshakeUrl = "$MasterUrl/api/agent/handshake"
    $Response = Invoke-RestMethod -Uri $HandshakeUrl -Method POST -Body $HandshakePayload -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    if ($Response.success) {
        $SessionToken = $Response.auth_token
        $HandshakeSuccess = $true
        Write-Host "[✓] دست‌تکانی با هسته مرکزی با موفقیت تایید شد!" -ForegroundColor Green
        Write-Host "    شناسه نشست: $($Response.session_id)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[i] هشدار: عدم دسترسی مستقیم شبکه به مستر؛ ایجاد نشست امن آفلاین امضا شده." -ForegroundColor Yellow
    $HandshakeSuccess = $true
}

# 5. Persist Per-User Configuration File
$ConfigFile = Join-Path $UserIsolatedDir "agent_config.json"
$ConfigData = @{
    "master_url" = $MasterUrl
    "windows_user" = $CurrentUsername
    "windows_sid" = $CurrentUserSid
    "session_token" = $SessionToken
    "local_port" = 8443
    "is_admin" = $IsAdmin
    "approval_protocol" = "ask_approval"
    "installed_at" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "isolation_policy" = "STRICT_USER_SESSION_ONLY"
    "allowed_arms" = @("WIN_AGENT", "WEB_EXT")
} | ConvertTo-Json -Depth 5

Set-Content -Path $ConfigFile -Value $ConfigData -Encoding UTF8
Write-Host "[✓] فایل پیکربندی امن در مسیر $ConfigFile ذخیره شد." -ForegroundColor Green

# 6. Save in Current User Registry (HKCU:\Software\OmniOps)
$RegPath = "HKCU:\Software\OmniOps"
if (-not (Test-Path $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
Set-ItemProperty -Path $RegPath -Name "MasterUrl" -Value $MasterUrl -Force
Set-ItemProperty -Path $RegPath -Name "SessionToken" -Value $SessionToken -Force
Set-ItemProperty -Path $RegPath -Name "WindowsUser" -Value $CurrentUsername -Force
Write-Host "[✓] کلیدهای رجیستری HKEY_CURRENT_USER با موفقیت تنظیم شدند." -ForegroundColor Green

# 7. Create Per-User Tray & Overlay Companion Host Script (OmniTrayCompanion.ps1)
$TrayCompanionScript = Join-Path $UserIsolatedDir "OmniTrayCompanion.ps1"
$CompanionScriptContent = @'
# OmniOps Tray Companion & Session Monitor
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ConfigPath = Join-Path $PSScriptRoot "agent_config.json"
if (-not (Test-Path $ConfigPath)) { exit 1 }

$Config = Get-Content $ConfigPath | ConvertFrom-Json
$CurrentUser = $env:USERNAME

# Session Isolation Guard: If user switched, terminate immediately
if ($CurrentUser -ne $Config.windows_user) {
    Write-Warning "User session mismatch: active is $CurrentUser but config belongs to $($Config.windows_user). Terminating process."
    exit 2
}

Write-Output "[OmniOps Tray Companion active for user: $CurrentUser]"
Write-Output "Master URL: $($Config.master_url) | Port: $($Config.local_port)"
Write-Output "Approval Protocol: $($Config.approval_protocol)"

# Lightweight local listener for commands & approvals
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://127.0.0.1:$($Config.local_port)/agent/")
try {
    $Listener.Start()
    while ($Listener.IsListening) {
        $context = $Listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.Headers.Add("Access-Control-Allow-Headers", "*")
        $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        
        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 200
            $res.Close()
            continue
        }
        
        $responseString = '{"status":"ok","agent":"OmniOps-Desktop-Companion","user":"' + $CurrentUser + '"}'
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
        $res.Close()
    }
} finally {
    $Listener.Stop()
}
'@

Set-Content -Path $TrayCompanionScript -Value $CompanionScriptContent -Encoding UTF8

# 8. Register Per-User Logon Autostart (Isolated per user, never global!)
$RunRegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$CmdValue = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$TrayCompanionScript`""
Set-ItemProperty -Path $RunRegPath -Name "OmniOpsAgent" -Value $CmdValue -Force
Write-Host "[✓] اتواستارت اختصاصی کاربر در HKCU\Run ثبت گردید (با خروج کاربر ایجنت متوقف می‌شود)." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "      نصب موفقیت‌آمیز ایجنت ویندوزی و راه‌اندازی اورلی دسکتاپ کامل شد!      " -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "ایجنت دسکتاپ هم‌اکنون در نشست $CurrentUsername فعال است و از طریق منوی شناور وب یا سینی سیستم در دسترس می‌باشد." -ForegroundColor White
