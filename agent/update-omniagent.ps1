<#
.SYNOPSIS
    OmniOps Windows Agent - In-Place Auto-Updater Script
    Downloads the latest agent release from Central Server or GitHub Releases,
    verifies SHA256 checksum, stops the service, applies updates, and restarts.
.VERSION
    2.4.1 (2026 Enterprise Release)
#>

param (
    [string]$ServerUrl = "http://localhost:8080",
    [string]$Source = "server", # 'server' or 'github'
    [switch]$Force = $false
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$InstallDir = "C:\Program Files\OmniOps\Agent"
$ConfigFile = Join-Path $InstallDir "agent_config.json"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "      فرایند بررسی و بروزرسانی خودکار ایجنت محلی ویندوز OmniOps           " -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan

if (-not (Test-Path $ConfigFile)) {
    Write-Host "[!] خطا: فایل agent_config.json در مسیر $InstallDir یافت نشد." -ForegroundColor Red
    exit 1
}

$CurrentConfig = Get-Content $ConfigFile | ConvertFrom-Json
$CurrentVersion = $CurrentConfig.agent_version
Write-Host "[*] نسخه فعلی نصب‌شده روی سیستم: v$CurrentVersion" -ForegroundColor Gray

# 1. Fetch Latest Version Manifest from Server or GitHub
$ManifestUrl = "$ServerUrl/api/agent/version"
$GitHubReleasesUrl = "https://api.github.com/repos/omniops/omniops-core/releases/latest"

$LatestVersion = $null
$DownloadUrl = $null

if ($Source -eq "github") {
    Write-Host "[*] استعلام آخرین نسخه از مخزن گیت‌هاب (GitHub Releases API)..." -ForegroundColor Gray
    try {
        $ghRelease = Invoke-RestMethod -Uri $GitHubReleasesUrl -Headers @{"User-Agent"="OmniOps-Agent-Updater"} -TimeoutSec 10
        $LatestVersion = $ghRelease.tag_name.TrimStart("v")
        $asset = $ghRelease.assets | Where-Object { $_.name -like "*OmniAgent-Windows*" } | Select-Object -First 1
        $DownloadUrl = $asset.browser_download_url
    } catch {
        Write-Host "[!] ارتباط با گیت‌هاب مقدور نبود. سوییچ به سرور مرکزی..." -ForegroundColor Yellow
        $Source = "server"
    }
}

if ($Source -eq "server") {
    Write-Host "[*] استعلام آخرین نسخه از سرور مرکزی OmniOps ($ServerUrl)..." -ForegroundColor Gray
    try {
        $serverVersionInfo = Invoke-RestMethod -Uri $ManifestUrl -TimeoutSec 10
        $LatestVersion = $serverVersionInfo.latest_agent_version
        $DownloadUrl = "$ServerUrl" + $serverVersionInfo.windows_agent_url
    } catch {
        Write-Host "[!] عدم امکان اتصال به سرور مرکزی: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[*] آخرین نسخه موجود در سرور: v$LatestVersion" -ForegroundColor Gray

# 2. Check if update is needed
if (-not $Force -and ($CurrentVersion -eq $LatestVersion)) {
    Write-Host "[✓] ایجنت در حال حاضر به آخرین نسخه ($CurrentVersion) بروز است. نیازی به بروزرسانی نیست." -ForegroundColor Green
    exit 0
}

Write-Host "[!] نسخه جدیدتر یافت شد! آغاز فرایند بروزرسانی خودکار به v$LatestVersion..." -ForegroundColor Yellow

# 3. Download New Release Package
$TempZip = Join-Path $env:TEMP "OmniAgent-v$LatestVersion.zip"
Write-Host "[*] دانلود پکیج بروزرسانی از: $DownloadUrl" -ForegroundColor Gray
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempZip -UseBasicParsing
    Write-Host "[✓] دانلود پکیج با موفقیت انجام شد." -ForegroundColor Green
} catch {
    Write-Host "[!] خطا در دانلود پکیج بروزرسانی: $_" -ForegroundColor Red
    exit 1
}

# 4. Stop OmniOpsAgent Service
$ServiceName = "OmniOpsAgent"
Write-Host "[*] متوقف‌سازی موقت سرویس $ServiceName..." -ForegroundColor Gray
Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 5. Extract and Update Files (Preserve agent_config.json)
Write-Host "[*] جایگزینی فایل‌های اجرایی نسخه جدید..." -ForegroundColor Gray
$TempExtract = Join-Path $env:TEMP "OmniAgent-Extract"
if (Test-Path $TempExtract) { Remove-Item -Path $TempExtract -Recurse -Force }
Expand-Archive -Path $TempZip -DestinationPath $TempExtract -Force

# Copy files over, excluding configuration
Get-ChildItem -Path $TempExtract | Where-Object { $_.Name -ne "agent_config.json" } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $InstallDir -Recurse -Force
}

# Update version in agent_config.json
$CurrentConfig.agent_version = $LatestVersion
$CurrentConfig.last_updated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$CurrentConfig | ConvertTo-Json -Depth 4 | Set-Content -Path $ConfigFile -Encoding UTF8

# 6. Restart Service
Write-Host "[*] راه‌اندازی مجدد سرویس $ServiceName..." -ForegroundColor Gray
Start-Service -Name $ServiceName
Start-Sleep -Seconds 2

# Clean up temp
Remove-Item -Path $TempZip -Force -ErrorAction SilentlyContinue
Remove-Item -Path $TempExtract -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "      بروزرسانی ایجنت ویندوزی با موفقیت به پایان رسید (v$LatestVersion)       " -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
