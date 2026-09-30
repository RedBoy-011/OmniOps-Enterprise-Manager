@echo off
:: OmniOps Windows Agent - Uninstaller Launcher
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :RunUninstaller
) else (
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb runAs"
    exit /b
)

:RunUninstaller
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall-omniagent.ps1"
pause
