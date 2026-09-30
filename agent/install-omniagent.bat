@echo off
:: ============================================================================
:: OmniOps Enterprise Windows Agent - One-Click Installer & Service Setup
:: Automatically handles Windows UAC Elevation, ExecutionPolicy & Defender Rules
:: Version: 2.4.1 (2026 Enterprise Release)
:: ============================================================================

title OmniOps Windows Agent Installer v2.4.1

:: Check for Administrator Privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :RunInstaller
) else (
    echo [*] درخواست دسترسی مدیر سیستم (Administrator Elevation)...
    echo [*] لطفا در پنجره باز شده گزینه Yes / تایید را انتخاب کنید...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb runAs"
    exit /b
)

:RunInstaller
cls
echo ============================================================================
echo      نصب‌کننده خودکار ایجنت محلی ویندوز OmniOps Enterprise Agent v2.4.1
echo ============================================================================
echo.
echo [*] بررسی وضعیت امنیتی سیستم‌عامل ویندوز...
echo [*] اعمال موقت مجوز اجرای اسکریپت (Bypass ExecutionPolicy)...
echo.

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%install-omniagent.ps1

if not exist "%PS_SCRIPT%" (
    echo [!] خطا: فایل install-omniagent.ps1 در مسیر زیر یافت نشد:
    echo     %PS_SCRIPT%
    pause
    exit /b 1
)

:: Unblock file if downloaded from Internet / GitHub (Windows SmartScreen compliance)
powershell -NoProfile -Command "Unblock-File -Path '%PS_SCRIPT%' -ErrorAction SilentlyContinue"

:: Run PowerShell Installer with Process-scoped Bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

echo.
echo ============================================================================
echo عملیات نصب به پایان رسید. جهت خروج کلیدی را فشار دهید.
echo ============================================================================
pause >nul
