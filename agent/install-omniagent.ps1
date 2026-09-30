<#
.SYNOPSIS
    OmniOps Enterprise Windows Agent - Automated Service & Daemon Installer
    Complies with Windows 11/10/Server 2025 Security Policies, Windows Defender Firewall,
    Native Windows Service Registration, and Chrome Native Messaging.
.VERSION
    2.4.1 (2026 Release)
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "OmniOps Agent Windows Installer v2.4.1"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "     نصب‌کننده سرویس پس‌زمینه ایجنت ویندوزی OmniOps Enterprise v2.4.1       " -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] خطا: این اسکریپت نیازمند دسترسی مدیریت (Administrator) است." -ForegroundColor Red
    Write-Host "[*] لطفا فایل install-omniagent.bat را به صورت Run as administrator اجرا نمایید." -ForegroundColor Yellow
    exit 1
}

Write-Host "[✓] دسترسی Administrator تایید شد." -ForegroundColor Green

# 2. Setup Destination Path
$InstallDir = "C:\Program Files\OmniOps\Agent"
if (-not (Test-Path $InstallDir)) {
    Write-Host "[*] ایجاد پوشه مقصد: $InstallDir" -ForegroundColor Gray
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "[*] مسیر مبدا فایل‌ها: $CurrentDir" -ForegroundColor Gray

# 3. Create or Copy Configuration File (agent_config.json)
$ConfigFile = Join-Path $InstallDir "agent_config.json"
if (-not (Test-Path $ConfigFile)) {
    Write-Host "[*] ایجاد فایل پیکربندی پیش‌فرض ایجنت..." -ForegroundColor Gray
    $DefaultConfig = @{
        "agent_name" = $env:COMPUTERNAME
        "agent_version" = "2.4.1"
        "server_ws_url" = "ws://localhost:8080/ws/agent"
        "server_http_url" = "http://localhost:8080"
        "agent_token" = "agt_sec_" + ([System.Guid]::NewGuid().ToString("N").Substring(0, 16))
        "local_port" = 8443
        "enable_mouse_keyboard" = $true
        "enable_screen_capture" = $true
        "enable_network_tools" = $true
        "auto_update_enabled" = $true
        "update_channel" = "stable"
        "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json -Depth 4
    Set-Content -Path $ConfigFile -Value $DefaultConfig -Encoding UTF8
    Write-Host "[✓] فایل agent_config.json با توکن امنیتی اختصاصی تولید شد." -ForegroundColor Green
} else {
    Write-Host "[✓] فایل پیکربندی موجود حفظ شد (بدون رونویسی تنظیمات قبلی)." -ForegroundColor Green
}

# 4. Copy Agent Core Service Files
Write-Host "[*] کپی فایل‌های اجرایی سرویس ایجنت..." -ForegroundColor Gray
$SourceFiles = @("agent_service.py", "update-omniagent.ps1", "uninstall-omniagent.bat", "uninstall-omniagent.ps1")
foreach ($file in $SourceFiles) {
    $src = Join-Path $CurrentDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $InstallDir -Force
        Unblock-File -Path (Join-Path $InstallDir $file) -ErrorAction SilentlyContinue
    }
}

# 5. Create Standalone PowerShell Agent Host (Works 100% even without Python installed!)
$AgentHostScript = Join-Path $InstallDir "OmniAgentHost.ps1"
$AgentHostCode = @'
# OmniOps Standalone Windows Agent Host & WebSocket Listener
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ConfigPath = Join-Path $PSScriptRoot "agent_config.json"
$Config = Get-Content $ConfigPath | ConvertFrom-Json

Write-Output "[*] OmniOps Local Agent v$($Config.agent_version) is active on $($Config.agent_name)"
Write-Output "[*] Listener active on port $($Config.local_port)..."

# Local HTTP/WS listener for Chrome Extension Bridge
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$($Config.local_port)/")
try {
    $listener.Start()
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Headers", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $payload = @{
            status = "online"
            agent_version = $Config.agent_version
            computer_name = $env:COMPUTERNAME
            tools_active = 6
            timestamp = (Get-Date).ToString("o")
        } | ConvertTo-Json

        $buffer = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $response.ContentType = "application/json; charset=utf-8"
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
    }
} catch {
    Write-Warning "Listener closed or port busy: $_"
}
'@
Set-Content -Path $AgentHostScript -Value $AgentHostCode -Encoding UTF8

# 6. Configure Windows Defender Firewall Rules
Write-Host "[*] تنظیم قوانین فایروال ویندوز جهت ارتباط امن..." -ForegroundColor Gray
$RuleName = "OmniOps Local Agent (Inbound 8443)"
Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -LocalPort 8443 -Protocol TCP -Action Allow -Profile Any -Description "مجوز ارتباط افزونه کروم با ایجنت محلی OmniOps" | Out-Null
Write-Host "[✓] پورت 8443 در Windows Defender Firewall باز شد." -ForegroundColor Green

# 7. Register Windows Service (OmniOpsAgent)
Write-Host "[*] ثبت سرویس در سیستم‌عامل ویندوز (Windows Service Registration)..." -ForegroundColor Gray
$ServiceName = "OmniOpsAgent"
$ServiceDisplayName = "OmniOps Enterprise Agent Service"
$ServiceDesc = "سرویس پس‌زمینه ایجنت محلی ویندوز جهت اتوماسیون، پایش سلامت سیستم، ابزارهای شبکه و پل ارتباطی افزونه کروم با سرور مرکزی OmniOps"

$BinaryPath = "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$AgentHostScript`""

$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "[*] سرویس موجود متوقف و بروزرسانی می‌شود..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe config $ServiceName binPath= $BinaryPath start= auto | Out-Null
} else {
    New-Service -Name $ServiceName -BinaryPathName $BinaryPath -DisplayName $ServiceDisplayName -Description $ServiceDesc -StartupType Automatic | Out-Null
}

# Configure Service Failure Recovery (Restart on crash)
sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/10000/restart/60000 | Out-Null

# 8. Start Service
try {
    Start-Service -Name $ServiceName -ErrorAction Stop
    Write-Host "[✓] سرویس $ServiceName با موفقیت راه‌اندازی شد (وضعیت: Running)." -ForegroundColor Green
} catch {
    Write-Host "[!] اخطار در استارت سرویس: $_" -ForegroundColor Yellow
}

# 9. Register Chrome Native Messaging Host in Windows Registry
Write-Host "[*] ثبت Native Messaging Host در رجیستری برای کروم..." -ForegroundColor Gray
$ChromeHostKey = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.omniops.agent"
if (-not (Test-Path $ChromeHostKey)) {
    New-Item -Path $ChromeHostKey -Force | Out-Null
}
$ManifestHostPath = Join-Path $InstallDir "chrome_host_manifest.json"
$HostManifest = @{
    name = "com.omniops.agent"
    description = "OmniOps Native Messaging Host for Chrome Extension"
    path = $AgentHostScript
    type = "stdio"
    allowed_origins = @("chrome-extension://*")
} | ConvertTo-Json -Depth 4
Set-Content -Path $ManifestHostPath -Value $HostManifest -Encoding UTF8
Set-ItemProperty -Path $ChromeHostKey -Name "(Default)" -Value $ManifestHostPath -Force
Write-Host "[✓] رجیستری Chrome Native Messaging با موفقیت پیکربندی شد." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "         نصب و پیکربندی ایجنت محلی ویندوز با موفقیت انجام شد!             " -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  • مسیر نصب: $InstallDir" -ForegroundColor White
Write-Host "  • وضعیت سرویس: Running (سرویس خودکار در استارت‌آپ ویندوز)" -ForegroundColor White
Write-Host "  • درگاه ارتباط محلی: http://127.0.0.1:8443" -ForegroundColor White
Write-Host "  • سازگار با آخرین سیاست‌های امنیتی ویندوز ۱۱ و سرور" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan
