<#
.SYNOPSIS
    OmniOps Windows Agent - Complete Uninstaller Script
#>

Write-Host "[*] در حال حذف سرویس OmniOpsAgent..." -ForegroundColor Yellow
$ServiceName = "OmniOpsAgent"

Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
sc.exe delete $ServiceName | Out-Null

Write-Host "[*] حذف قوانین فایروال ویندوز..." -ForegroundColor Gray
Remove-NetFirewallRule -DisplayName "OmniOps Local Agent (Inbound 8443)" -ErrorAction SilentlyContinue

Write-Host "[*] حذف کلیدهای رجیستری Chrome Native Messaging..." -ForegroundColor Gray
Remove-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.omniops.agent" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[✓] سرویس و تنظیمات ایجنت با موفقیت حذف گردید." -ForegroundColor Green
