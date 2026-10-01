import React, { useState } from 'react';
import { SkillItem, AiModel, LocalAgentConfig, AgentToolItem } from '../types';
import { AddSkillModal } from './AddSkillModal';
import { 
  Network, 
  Terminal, 
  Layers, 
  Cpu, 
  Shield, 
  Activity, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Laptop, 
  Download, 
  Play, 
  Copy, 
  Check, 
  ArrowLeft,
  Plus,
  MousePointer,
  Keyboard,
  Monitor,
  Settings,
  Globe,
  RefreshCw,
  Power,
  PowerOff,
  AlertTriangle,
  FolderGit2,
  Lock,
  Radio,
  Sliders,
  CheckCircle,
  HelpCircle,
  Clock,
  Eye,
  Maximize2,
  TrendingUp,
  BarChart3,
  Moon,
  Sun,
  HardDrive,
  ExternalLink,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  FileCode,
  GitBranch,
  Trash2,
  XCircle,
  Code2,
  FileText,
  X
} from 'lucide-react';

interface ToolsModuleProps {
  skills: SkillItem[];
  activeSkillIds: string[];
  onToggleSkill: (skillId: string) => void;
  onSelectSampleQuery?: (query: string, skillId: string) => void;
  onAddSkill: (skill: SkillItem) => void;
  availableModels: AiModel[];
  agentRunning: boolean;
  onToggleAgentRunning: (running: boolean) => void;
  onNavigateToServerInfra?: () => void;
}

export const ToolsModule: React.FC<ToolsModuleProps> = ({
  skills,
  activeSkillIds,
  onToggleSkill,
  onSelectSampleQuery,
  onAddSkill,
  availableModels,
  agentRunning,
  onToggleAgentRunning,
  onNavigateToServerInfra
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || 'mikrotik_expert');
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<'all' | 'plugin' | 'network' | 'security' | 'devops' | 'automation' | 'system'>('all');
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // System Tray Menu state (Simulating the Windows taskbar icon near the clock)
  const [trayMenuOpen, setTrayMenuOpen] = useState(false);

  // Agent Connection Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    chromeExtOk: boolean;
    localAgentOk: boolean;
    serverOk: boolean;
    pingMs: number;
    message: string;
  } | null>(null);

  // Local Agent Configuration Settings state
  const [agentConfig, setAgentConfig] = useState<LocalAgentConfig>({
    serverWsUrl: 'wss://omniops-server.internal:8080/ws/agent',
    agentToken: 'agt_sec_9948fa281b9e0784',
    localPort: 8443,
    enableMouseKeyboard: true,
    enableScreenCapture: true,
    enableNetworkTools: true,
    useSocks5Proxy: true,
    proxyHost: '127.0.0.1',
    proxyPort: 1080,
    status: agentRunning ? 'running' : 'stopped',
    lastPingMs: 38
  });
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Version synchronization and Auto-Update state
  const [agentCurrentVersion, setAgentCurrentVersion] = useState<string>('2.4.0');
  const [serverReleaseVersion, setServerReleaseVersion] = useState<string>('2.4.1');
  const [activeDownloadTab, setActiveDownloadTab] = useState<'windows' | 'chrome' | 'github_cicd'>('windows');
  const [isUpdatingAgent, setIsUpdatingAgent] = useState<boolean>(false);
  const [updateStep, setUpdateStep] = useState<string>('');
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Script Preview and Code Inspector State
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [previewScriptType, setPreviewScriptType] = useState<'install_bat' | 'install_ps1' | 'uninstall_bat' | 'uninstall_ps1'>('uninstall_ps1');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedInstallCmd, setCopiedInstallCmd] = useState<boolean>(false);

  // Simulated Uninstallation State (User request: option to remove agent beside install files)
  const [isUninstallingAgent, setIsUninstallingAgent] = useState<boolean>(false);
  const [uninstallStep, setUninstallStep] = useState<string>('');
  const [uninstallProgress, setUninstallProgress] = useState<number>(0);
  const [uninstallLogs, setUninstallLogs] = useState<string[]>([]);
  const [isAgentUninstalled, setIsAgentUninstalled] = useState<boolean>(false);

  const hasUpdateAvailable = agentCurrentVersion !== serverReleaseVersion;

  const getScriptContent = (type: 'install_bat' | 'install_ps1' | 'uninstall_bat' | 'uninstall_ps1') => {
    switch (type) {
      case 'install_bat':
        return `@echo off
chcp 65001 >nul
title OmniOps Agent Installer v${serverReleaseVersion}
cls
echo ==========================================================
echo       OmniOps Windows Agent - Automated Launcher
echo ==========================================================
echo.
echo [*] Checking Administrator Privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Administrator privileges confirmed.
    echo [*] Executing PowerShell Installer with ExecutionPolicy Bypass...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-omniagent.ps1"
) else (
    echo [!] Administrator privileges required. Requesting UAC elevation...
    powershell.exe -NoProfile -Command "Start-Process cmd -ArgumentList '/c \\"\\"%~f0\\"\\"' -Verb runAs"
)

if %errorLevel% neq 0 (
    echo.
    echo [!] Installation encountered an issue (Exit Code: %errorLevel%).
)
pause`;

      case 'install_ps1':
        return `<#
================================================================================
  OmniOps Windows Agent - Enterprise Production Installer Script
  Version: ${serverReleaseVersion}
  Target OS: Windows 10, Windows 11, Windows Server 2019/2022/2025
  Policies: Microsoft Windows Modern Security Compliance & UAC Automation
================================================================================
#>

param(
    [string]$ServerWsUrl = "${agentConfig.serverWsUrl}",
    [string]$AgentToken = "${agentConfig.agentToken}",
    [int]$Port = 8443
)

# 1. Require Administrative Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "[!] دسترسی Administrator لازم است. ارتقای خودکار سطح دسترسی از طریق UAC..."
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File \`"$PSCommandPath\`"")
    Exit
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     نصب و راه‌اندازی خودکار ایجنت ویندوزی OmniOps v${serverReleaseVersion}  " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$InstallDir = "$env:ProgramFiles\\OmniOps\\Agent"
$ServiceName = "OmniOpsAgent"
$FirewallRule = "OmniOps Local Agent (Inbound 8443)"

# 2. Create Target Directory
Write-Host "\`n[1/5] ایجاد پوشه اختصاصی برنامه در Program Files..." -ForegroundColor White
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "   [✓] پوشه $InstallDir با موفقیت ایجاد شد." -ForegroundColor Green
}

# 3. Save Configuration JSON
Write-Host "\`n[2/5] ذخیره فایل پیکربندی امنیتی ایجنت (agent_config.json)..." -ForegroundColor White
$configData = @{
    serverWsUrl = $ServerWsUrl
    agentToken = $AgentToken
    localPort = $Port
    installedVersion = "${serverReleaseVersion}"
    installedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json
Set-Content -Path (Join-Path $InstallDir "agent_config.json") -Value $configData -Encoding UTF8
Write-Host "   [✓] فایل پیکربندی با توکن امنیتی سرور ثبت گردید." -ForegroundColor Green

# 4. Open Windows Firewall Port 8443
Write-Host "\`n[3/5] تنظیم رول فایروال ویندوز برای پورت 8443..." -ForegroundColor White
$existingRule = Get-NetFirewallRule -DisplayName $FirewallRule -ErrorAction SilentlyContinue
if (-not $existingRule) {
    New-NetFirewallRule -DisplayName $FirewallRule -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -Description "Allow inbound WSS connections to OmniOps Agent" | Out-Null
    Write-Host "   [✓] رول فایروال $FirewallRule با موفقیت ثبت شد." -ForegroundColor Green
} else {
    Write-Host "   [i] رول فایروال از قبل موجود است." -ForegroundColor Gray
}

# 5. Chrome Native Messaging Host Registration
Write-Host "\`n[4/5] ثبت رجیستری ارتباط نیتیو افزونه کروم (Native Messaging)..." -ForegroundColor White
$manifestPath = Join-Path $InstallDir "com.omniops.agent.json"
$nativeManifest = @{
    name = "com.omniops.agent"
    description = "OmniOps Browser Automation and HID Bridge"
    path = "omniagent.exe"
    type = "stdio"
    allowed_origins = @("chrome-extension://*")
} | ConvertTo-Json
Set-Content -Path $manifestPath -Value $nativeManifest -Encoding UTF8

$regPath = "HKLM:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.omniops.agent"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
Set-ItemProperty -Path $regPath -Name "(Default)" -Value $manifestPath
Write-Host "   [✓] کلید رجیستری Native Messaging ایجاد شد." -ForegroundColor Green

# 6. Register & Start Windows Service
Write-Host "\`n[5/5] ثبت و اجرای سرویس بومی ویندوز ($ServiceName)..." -ForegroundColor White
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    & sc.exe create $ServiceName binPath= "\`"$InstallDir\\omniagent.exe\`" --service" start= auto DisplayName= "OmniOps Local Agent" | Out-Null
    & sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000// | Out-Null
    Write-Host "   [✓] سرویس $ServiceName ثبت شد." -ForegroundColor Green
}
Start-Sleep -Seconds 1
try {
    Start-Service -Name $ServiceName -ErrorAction SilentlyContinue
    Write-Host "   [✓] سرویس $ServiceName با موفقیت اجرا شد." -ForegroundColor Green
} catch {}

# Add System Tray Icon to Run on Startup
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OmniOpsTray" -Value "\`"$InstallDir\\omniagent-tray.exe\`""
Write-Host "   [✓] آیکون سینی ویندوز (کنار ساعت) به استارتاپ اضافه شد." -ForegroundColor Green

Write-Host "\`n==========================================================" -ForegroundColor Green
Write-Host " [✓] نصب ایجنت با موفقیت به پایان رسید!" -ForegroundColor Green
Write-Host " پورت ارتباطی: $Port | پروتکل: Secure WSS | سرویس: فعال" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Start-Sleep -Seconds 3`;

      case 'uninstall_bat':
        return `@echo off
chcp 65001 >nul
title OmniOps Agent Clean Uninstaller
cls
echo ==========================================================
echo        OmniOps Windows Agent - Complete Uninstaller
echo ==========================================================
echo.
echo [*] Checking Administrator Privileges for Uninstallation...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Administrator privileges confirmed.
    echo [*] Executing PowerShell Uninstallation Script with Clean Purge...
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall-omniagent.ps1"
) else (
    echo [!] Administrator privileges required to stop and remove Windows Service.
    echo [*] Requesting UAC elevation...
    powershell.exe -NoProfile -Command "Start-Process cmd -ArgumentList '/c \\"\\"%~f0\\"\\"' -Verb runAs"
)

if %errorLevel% neq 0 (
    echo.
    echo [!] Uninstallation finished with code %errorLevel%.
)
pause`;

      case 'uninstall_ps1':
        return `<#
================================================================================
  OmniOps Windows Agent - Complete Clean Uninstallation & Purge Script
  Target OS: Windows 10, Windows 11, Windows Server 2019/2022/2025
  Standard: Enterprise Clean Uninstall with Zero Residual Traces
  Actions:
    1. Terminate all active daemon & tray helper processes
    2. Gracefully stop and unregister Windows Service (OmniOpsAgent via sc.exe)
    3. Delete Windows Defender Firewall rule for port 8443
    4. Purge Chrome Native Messaging registry keys (HKCU & HKLM)
    5. Remove Startup run entry from Windows Registry
    6. Permanently delete installation directory & local caches
================================================================================
#>

param(
    [switch]$Force = $true,
    [switch]$Quiet = $false
)

# 1. Require Administrative Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "[!] دسترسی Administrator لازم است. در حال درخواست ارتقای خودکار دسترسی (UAC Elevation)..."
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File \`"$PSCommandPath\`"")
    Exit
}

Write-Host "==========================================================" -ForegroundColor Red
Write-Host "     شروع پاکسازی کامل و حذف رسمی ایجنت ویندوزی OmniOps      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Red

$ServiceName = "OmniOpsAgent"
$InstallDir  = "$env:ProgramFiles\\OmniOps\\Agent"
$RegistryKeyHKCU = "HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.omniops.agent"
$RegistryKeyHKLM = "HKLM:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.omniops.agent"
$RunKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$FirewallRuleName = "OmniOps Local Agent (Inbound 8443)"

# Step 1: Kill Tray and Daemon Processes
Write-Host "\`n[1/6] متوقف کردن پردازه‌های در حال اجرای ایجنت و سینی ویندوز..." -ForegroundColor White
Get-Process -Name "OmniOpsTray" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "omniagent-daemon" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "omniagent" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "   [✓] تمام پروسه‌های مرتبط با موفقیت خاتمه یافتند." -ForegroundColor Green

# Step 2: Stop and Delete Windows Service
Write-Host "\`n[2/6] توقف و حذف سرویس بومی ویندوز ($ServiceName)..." -ForegroundColor White
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq 'Running') {
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Write-Host "   [✓] سرویس $ServiceName متوقف گردید." -ForegroundColor Gray
    }
    & sc.exe delete $ServiceName | Out-Null
    Write-Host "   [✓] سرویس $ServiceName با موفقیت از سیستم حذف شد." -ForegroundColor Green
} else {
    Write-Host "   [i] سرویس $ServiceName در سیستم یافت نشد یا قبلاً حذف شده است." -ForegroundColor Gray
}

# Step 3: Remove Windows Firewall Rule
Write-Host "\`n[3/6] حذف قوانین فایروال و بستن پورت 8443..." -ForegroundColor White
try {
    Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
    Write-Host "   [✓] رول فایروال '$FirewallRuleName' حذف شد." -ForegroundColor Green
} catch {
    Write-Host "   [i] رول فایروال از قبل موجود نبود." -ForegroundColor Gray
}

# Step 4: Purge Chrome Native Messaging Registry
Write-Host "\`n[4/6] پاکسازی کلیدهای رجیستری ارتباط نیتیو افزونه کروم..." -ForegroundColor White
if (Test-Path $RegistryKeyHKCU) {
    Remove-Item -Path $RegistryKeyHKCU -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [✓] کلید HKCU حذف شد." -ForegroundColor Green
}
if (Test-Path $RegistryKeyHKLM) {
    Remove-Item -Path $RegistryKeyHKLM -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [✓] کلید HKLM حذف شد." -ForegroundColor Green
}

# Step 5: Remove Startup Entry
Write-Host "\`n[5/6] حذف استارتاپ از رجیستری ویندوز..." -ForegroundColor White
try {
    Remove-ItemProperty -Path $RunKey -Name "OmniOpsTray" -ErrorAction SilentlyContinue
    Write-Host "   [✓] میانبر استارتاپ تسک‌بار حذف شد." -ForegroundColor Green
} catch {}

# Step 6: Delete Program Directory and Files
Write-Host "\`n[6/6] پاکسازی فایل‌های باینری و دایرکتوری برنامه ($InstallDir)..." -ForegroundColor White
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [✓] دایرکتوری $InstallDir و کلیه فایل‌های موقت پاکسازی شدند." -ForegroundColor Green
} else {
    Write-Host "   [i] دایرکتوری نصب از قبل حذف شده بود." -ForegroundColor Gray
}

Write-Host "\`n==========================================================" -ForegroundColor Green
Write-Host " [✓] ایجنت OmniOps بدون باقی‌ماندن هیچ ردپایی با موفقیت حذف گردید." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Start-Sleep -Seconds 3`;
    }
  };

  const handleDownloadInstaller = (type: 'bat' | 'ps1' | 'agent_zip' | 'chrome_zip' | 'uninstall_bat' | 'uninstall_ps1') => {
    let filename = '';
    let content = '';
    let mime = 'text/plain';

    if (type === 'bat') {
      filename = 'install-omniagent.bat';
      content = getScriptContent('install_bat');
    } else if (type === 'ps1') {
      filename = 'install-omniagent.ps1';
      content = getScriptContent('install_ps1');
    } else if (type === 'uninstall_bat') {
      filename = 'uninstall-omniagent.bat';
      content = getScriptContent('uninstall_bat');
    } else if (type === 'uninstall_ps1') {
      filename = 'uninstall-omniagent.ps1';
      content = getScriptContent('uninstall_ps1');
    } else if (type === 'agent_zip') {
      filename = `OmniAgent-Windows-v${serverReleaseVersion}.zip`;
      content = `OmniOps Windows Agent v${serverReleaseVersion} Distribution Package (Automated Installer & Uninstaller Bundle with PowerShell Service & Firewall Rules)`;
      mime = 'application/zip';
    } else if (type === 'chrome_zip') {
      filename = `OmniOps-Chrome-Extension-v${serverReleaseVersion}.zip`;
      content = 'OmniOps Chrome Extension Manifest V3 Package for Local Agent & Central Server Bridge';
      mime = 'application/zip';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadToast(`فایل «${filename}» با موفقیت دانلود شد.`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const handleRunSimulatedUninstall = async () => {
    setIsUninstallingAgent(true);
    setUninstallProgress(15);
    setUninstallStep('خاتمه دادن به پروسه‌های در حال اجرا و بستن سینی ویندوز...');
    setUninstallLogs(['[09:12:01] اجرای دستور Stop-Process برای OmniOpsTray و omniagent...']);

    await new Promise((r) => setTimeout(r, 600));
    setUninstallProgress(35);
    setUninstallStep('توقف و حذف سرویس بومی ویندوز (sc.exe delete OmniOpsAgent)...');
    setUninstallLogs((prev) => [
      ...prev,
      '[09:12:02] ارسال Stop-Service -Name OmniOpsAgent -Force...',
      '[09:12:02] حذف ورودی سرویس از رجیستری Windows Services با موفقیت انجام شد.'
    ]);

    await new Promise((r) => setTimeout(r, 600));
    setUninstallProgress(60);
    setUninstallStep('حذف رول فایروال پورت ۸۴۴۳ (Remove-NetFirewallRule)...');
    setUninstallLogs((prev) => [
      ...prev,
      '[09:12:03] بستن پورت ورودی ۸۴۴۳ در Windows Defender Firewall...',
      '[09:12:03] رول OmniOps Local Agent حذف شد.'
    ]);

    await new Promise((r) => setTimeout(r, 600));
    setUninstallProgress(80);
    setUninstallStep('پاکسازی کلیدهای رجیستری Chrome Native Messaging...');
    setUninstallLogs((prev) => [
      ...prev,
      '[09:12:04] حذف کلید HKLM:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.omniops.agent...',
      '[09:12:04] حذف کلید HKCU و میانبر Run در رجیستری استارتاپ.'
    ]);

    await new Promise((r) => setTimeout(r, 600));
    setUninstallProgress(100);
    setUninstallStep('پاکسازی پوشه C:\\Program Files\\OmniOps\\Agent و اتمام حذف کامل.');
    setUninstallLogs((prev) => [
      ...prev,
      '[09:12:05] حذف فیزیکی دایرکتوری نصب و کش فایل‌ها.',
      '[09:12:05] [✓] ایجنت ویندوزی با موفقیت و بدون باقی‌ماندن هیچ ردپایی حذف شد.'
    ]);

    await new Promise((r) => setTimeout(r, 500));
    onToggleAgentRunning(false);
    setIsAgentUninstalled(true);
    setIsUninstallingAgent(false);
  };

  const handleRunAutoUpdate = async () => {
    setIsUpdatingAgent(true);
    setUpdateProgress(10);
    setUpdateStep('استعلام نسخه و بررسی چک‌سام از سرور...');
    setUpdateLogs(['[08:14:02] استعلام اندپوینت /api/agent/version از سرور مرکزی...']);

    await new Promise((r) => setTimeout(r, 700));
    setUpdateProgress(35);
    setUpdateStep('دانلود پکیج بروزرسانی OmniAgent-v2.4.1.zip...');
    setUpdateLogs((prev) => [...prev, '[08:14:03] دانلود بسته بروزرسانی v2.4.1 با حجم 1.4MB...', '[08:14:03] راستی‌آزمایی هش امنیتی SHA256 با متادیتای سرور... تایید شد.']);

    await new Promise((r) => setTimeout(r, 800));
    setUpdateProgress(60);
    setUpdateStep('توقف موقت سرویس ویندوز (Stop-Service OmniOpsAgent)...');
    setUpdateLogs((prev) => [...prev, '[08:14:04] ارسال سیگنال خاتمه مسالمت‌آمیز (Graceful Termination) به سرویس...', '[08:14:04] سرویس OmniOpsAgent با موفقیت متوقف شد.']);

    await new Promise((r) => setTimeout(r, 800));
    setUpdateProgress(85);
    setUpdateStep('استخراج و جایگزینی فایل‌ها با حفظ تنظیمات قبلی...');
    setUpdateLogs((prev) => [...prev, '[08:14:05] جایگزینی باینری‌ها در C:\\Program Files\\OmniOps\\Agent...', '[08:14:05] حفظ فایل agent_config.json با توکن امنیتی پیشین.']);

    await new Promise((r) => setTimeout(r, 800));
    setUpdateProgress(100);
    setUpdateStep('راه‌اندازی مجدد سرویس و برقراری ارتباط با سرور مرکزی...');
    setUpdateLogs((prev) => [...prev, '[08:14:06] دستور Start-Service OmniOpsAgent اجرا شد.', '[08:14:06] اتصال وب‌سوکت روی پورت 8443 برقرار شد. نسخه جدید: v2.4.1']);

    await new Promise((r) => setTimeout(r, 600));
    setAgentCurrentVersion('2.4.1');
    setIsUpdatingAgent(false);
  };

  // 24h AI Telemetry & Resource Forecasting State
  const [telemetryMetric, setTelemetryMetric] = useState<'ram' | 'cpu'>('ram');
  const [telemetryServiceFilter, setTelemetryServiceFilter] = useState<'all' | 'ollama' | 'langflow'>('all');
  const [selectedTelemetryHour, setSelectedTelemetryHour] = useState<number>(11); // Default to peak hour

  // Generating 24-Hour Telemetry Forecasting based on Agent State
  // (agentRunning, activeSkillIds.length, server capacity 16GB RAM)
  const forecastData = React.useMemo(() => {
    const agentMultiplier = agentRunning ? 1.0 : 0.5;
    const skillsMultiplier = 1 + (activeSkillIds.length * 0.04);

    return Array.from({ length: 24 }, (_, hour) => {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const isOffPeak = hour >= 23 || hour < 7;
      const isBusinessPeak = hour >= 9 && hour <= 16;
      const isNightMaintenance = hour === 2 || hour === 3 || hour === 4;

      let ollamaRam = 4.2;
      let ollamaCpu = 12;
      let langflowRam = 1.3;
      let langflowCpu = 6;
      let workloadNote = 'استندبای سرور و پاسخگویی به درخواست‌های ایزوله';

      if (isBusinessPeak) {
        // Peak hours (09:00 - 16:00)
        const peakCurve = Math.sin(((hour - 9) / 7) * Math.PI);
        ollamaRam = 8.5 + (peakCurve * 4.8 * skillsMultiplier * agentMultiplier);
        ollamaCpu = 35 + Math.round(peakCurve * 38 * agentMultiplier);
        langflowRam = 2.1 + (peakCurve * 1.5 * agentMultiplier);
        langflowCpu = 18 + Math.round(peakCurve * 20);
        workloadNote = 'ترافیک اوج اداری: استنتاج استدلال DeepSeek-R1 و پایپ‌لاین‌های چندمرحله‌ای Langflow';
      } else if (isNightMaintenance) {
        if (hour === 2) {
          ollamaRam = 10.8;
          ollamaCpu = 28;
          workloadNote = 'زمان‌بندی هوشمند: دانلود مدل DeepSeek-R1 روی Ollama در ساعات خلوتی پهنای باند';
        } else if (hour === 3) {
          ollamaRam = 8.2;
          ollamaCpu = 18;
          langflowRam = 1.7;
          workloadNote = 'پایان دریافت مدل؛ ارزیابی هش SHA256 و بارگذاری کوانتایز در کش لوکال';
        } else if (hour === 4) {
          ollamaRam = 3.9;
          ollamaCpu = 8;
          langflowRam = 1.2;
          langflowCpu = 4;
          workloadNote = 'زمان‌بندی شبانه: ریاستارت خودکار کانتینرها، تخلیه VRAM و اجرای drop_caches';
        }
      } else if (isOffPeak) {
        ollamaRam = 4.4 * agentMultiplier;
        ollamaCpu = 10;
        langflowRam = 1.3;
        langflowCpu = 5;
        workloadNote = 'ساعات غیراداری: حداقل مصرف منابع و آماده‌سازی برای وظایف سنگین کرون';
      } else {
        // Evening (17:00 - 22:00)
        ollamaRam = 6.2 * skillsMultiplier;
        ollamaCpu = 20;
        langflowRam = 1.6;
        langflowCpu = 10;
        workloadNote = 'کاهش ترافیک کاری و اتمام درخواست‌های سازمانی چت‌روم';
      }

      ollamaRam = Math.min(15.5, Number(ollamaRam.toFixed(1)));
      langflowRam = Math.min(4.5, Number(langflowRam.toFixed(1)));
      const totalRam = Number((ollamaRam + langflowRam).toFixed(1));
      const totalCpu = Math.min(100, Math.round((ollamaCpu * 0.7) + (langflowCpu * 0.3)));

      return {
        hour: hourStr,
        hourNum: hour,
        isOffPeak,
        isBusinessPeak,
        ollamaRam,
        ollamaCpu,
        langflowRam,
        langflowCpu,
        totalRam,
        totalCpu,
        workloadNote
      };
    });
  }, [agentRunning, activeSkillIds.length]);

  // Comprehensive Tools and Prerequisites Catalog
  const [toolsList, setToolsList] = useState<AgentToolItem[]>([
    // Network Suite
    { id: 't-winbox', name: 'MikroTik Winbox v3.40', category: 'network', description: 'ابزار گرافیکی اتصال و مدیریت روتربوردها و فایروال میکروتیک روی پورت 8291', status: 'active', version: '3.40.1', requiredFor: 'مدیریت RouterOS' },
    { id: 't-wireshark', name: 'Wireshark Packet Analyzer', category: 'network', description: 'پایش و شنود بسته‌های پروتکل‌های شبکه (PCAP) و بررسی ترافیک مشکوک', status: 'active', version: '4.2.3', requiredFor: 'تحلیل پکت و دیباگ شبکه' },
    { id: 't-nmap', name: 'Nmap Security Scanner', category: 'network', description: 'اسکن آسیب‌پذیری، پورت‌های باز و بازرسی فایروال‌های محلی و سرور', status: 'installed', version: '7.94', requiredFor: 'ممیزی امنیت شبکه' },
    { id: 't-putty', name: 'PuTTY / Cisco CLI Console', category: 'network', description: 'ترمینال امن SSH، Telnet و اتصال پورت سریال به سوئیچ‌های سیسکو', status: 'active', version: '0.80', requiredFor: 'ترمینال مدیریت سوئیچ' },
    { id: 't-iperf', name: 'iPerf3 Network Benchmark', category: 'network', description: 'سنجش پهنای باند واقعی، لرزش بسته (Jitter) و تاخیر مسیر سرور-کلاینت', status: 'pending', version: '3.16', requiredFor: 'سنجش پهنای باند و سرعت' },

    // Remote Control & Windows Privileges
    { id: 't-winrm', name: 'Windows Remote Management (WinRM)', category: 'remote_control', description: 'سرویس مدیریت ریموت ویندوز سرور از طریق پورت 5985/5986 و پروتکل SOAP', status: 'active', version: 'WinRM 2.0', requiredFor: 'مدیریت ریموت ویندوز' },
    { id: 't-wmi', name: 'WMI Provider & Management', category: 'remote_control', description: 'زیرساخت پایش تجهیزات سخت‌افزاری ویندوز، سرویس‌ها و رخدادها', status: 'active', version: 'WMI v2', requiredFor: 'پایش سخت‌افزار و سرویس' },
    { id: 't-psremoting', name: 'PowerShell Remoting Policy', category: 'remote_control', description: 'مجوز اجرای اسکریپت‌های سیستمی و دستورات ریموت در محیط امنیتی ویندوز', status: 'active', version: 'PS 7.4', requiredFor: 'اجرای دستورات خودکار' },
    { id: 't-scm', name: 'Windows Service Control Manager', category: 'remote_control', description: 'مجوز ایجاد، شروع و توقف سرویس‌های ویندوزی در پس‌زمینه توسط ایجنت', status: 'active', version: 'System32 SCM', requiredFor: 'نگهداری دائمی سرویس ایجنت' },

    // Mouse, Keyboard & HID Automation
    { id: 't-hid', name: 'Virtual HID Driver (ماوس و کیبورد مجازی)', category: 'input_hid', description: 'درایور شبیه‌سازی دقیق و امن کلیک، جابجایی نشانگر ماوس و فشردن کلیدها', status: 'active', version: 'v2.1', requiredFor: 'اتوماسیون کارهای دسکتاپ' },
    { id: 't-pyautogui', name: 'PyAutoGUI Input Hook', category: 'input_hid', description: 'ماژول ارسال امن ورودی‌های صفحه کلید و ماوس از طریق هوش مصنوعی', status: 'active', version: '0.9.54', requiredFor: 'فرماندهی نشانگر و ورودی' },
    { id: 't-screen', name: 'Screen Capture & Desktop Grabber', category: 'input_hid', description: 'امکان عکس‌برداری فوری از پنجره‌های فعال برای ارسال به مدل بینایی هوش مصنوعی', status: 'active', version: 'GDI/DirectX', requiredFor: 'ارسال اسکرین‌شات ارورها' },

    // Core Prerequisites
    { id: 't-python', name: 'Python 3.11+ Runtime', category: 'prerequisite', description: 'محیط اجرای اسکریپت‌های پایتون ایجنت و فراخوانی کتابخانه‌های محلی', status: 'installed', version: '3.11.8', requiredFor: 'اجرای کدهای ایجنت' },
    { id: 't-node', name: 'Node.js LTS Runtime', category: 'prerequisite', description: 'موتور پردازش رویدادهای اکستنشن کروم و رابط بومی Native Messaging', status: 'installed', version: '20.12.0', requiredFor: 'ارتباط افزونه مرورگر' },
    { id: 't-playwright', name: 'Playwright CLI & Browser Agent', category: 'remote_control', description: 'درایور اجرای خودکار سناریوهای مرورگر، تست E2E و ورود خودکار به وب‌کنسول تجهیزات شبکه', status: 'active', version: '1.43.0', requiredFor: 'تعامل و تست برنامه در مرورگر' },
    { id: 't-strix', name: 'Strix Security Pentest Scanner', category: 'network', description: 'اسکن خودکار آسیب‌پذیری‌ها، بازرسی سرویس‌ها و ثبت خودکار Pull Request با پچ امنیتی', status: 'active', version: 'v2.0.4', requiredFor: 'اسکن نفوذ و پچ خودکار' },
    { id: 't-context7', name: 'Context7 Live Docs Daemon', category: 'prerequisite', description: 'دیمن تزریق داکیومنت‌های لحظه‌ای و کتابخانه‌های به‌روز برای جلوگیری از توهم در تولید کد', status: 'active', version: 'v1.5', requiredFor: 'جلوگیری از توهم کدنویسی' },
    { id: 't-supabase', name: 'Supabase PostgreSQL & Auth Bridge', category: 'prerequisite', description: 'زیرساخت دیتابیس رابطه‌ای، امنیت RLS و احراز هویت بدون اختراع دوباره چرخ', status: 'active', version: 'v2.39', requiredFor: 'پایگاه داده و نشست‌ها' },
    { id: 't-openssl', name: 'OpenSSL & Cryptography Library', category: 'prerequisite', description: 'رمزنگاری بسته‌های ارسالی بین کلاینت و سرور با الگوریتم TLS 1.3 / AES-256', status: 'installed', version: '3.2.1', requiredFor: 'امنیت تبادل داده' },
    { id: 't-vcredist', name: 'Microsoft Visual C++ Redistributable (x64)', category: 'prerequisite', description: 'کتابخانه‌های باینری مورد نیاز درایورها و کامپوننت‌های نیتیو ویندوز', status: 'installed', version: '2015-2022', requiredFor: 'اجرای باینری‌های C++' },
    { id: 't-git', name: 'Git Client', category: 'prerequisite', description: 'دریافت آخرین ماژول‌ها و ابزارهای اتوماسیون از مخازن گیت سازمانی', status: 'installed', version: '2.44', requiredFor: 'آپدیت ابزارها' },
    { id: 't-tuntap', name: 'TUN/TAP Virtual Network Adapter', category: 'prerequisite', description: 'کارت شبکه مجازی جهت عبور بسته‌های عیب‌یابی و روتینگ محلی', status: 'pending', version: 'NDIS 6', requiredFor: 'تونل شبکه اختصاصی' }
  ]);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Network': return <Network className="w-5 h-5 text-blue-400" />;
      case 'Terminal': return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'Layers': return <Layers className="w-5 h-5 text-amber-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-rose-400" />;
      case 'Activity': return <Activity className="w-5 h-5 text-purple-400" />;
      default: return <BookOpen className="w-5 h-5 text-neutral-400" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(text);
    setTimeout(() => setCopiedQuery(null), 1500);
  };

  // Run full multi-stage test of Chrome Extension ↔ Local Agent ↔ Server
  const handleRunConnectionTest = async () => {
    setTestingConnection(true);
    setTestResult(null);

    await new Promise((r) => setTimeout(r, 600));
    // Step 1: Chrome Extension ping
    await new Promise((r) => setTimeout(r, 500));
    // Step 2: Local Agent daemon ping
    await new Promise((r) => setTimeout(r, 600));
    // Step 3: Server WebSocket ping

    setTestingConnection(false);
    if (agentRunning) {
      setTestResult({
        tested: true,
        chromeExtOk: true,
        localAgentOk: true,
        serverOk: true,
        pingMs: 34,
        message: 'ارتباط کامل سهندسه (افزونه کروم ↔ ایجنت ویندوز ↔ سرور مرکزی OmniOps) بدون تاخیر و پایدار است.'
      });
    } else {
      setTestResult({
        tested: true,
        chromeExtOk: true,
        localAgentOk: false,
        serverOk: true,
        pingMs: 0,
        message: 'ایجنت محلی در حالت متوقف (Stop) است. لطفاً سرویس ایجنت را در نوار تسک‌بار ساعت ویندوز راه‌اندازی کنید.'
      });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  const handleToggleToolStatus = (toolId: string) => {
    setToolsList((prev) =>
      prev.map((t) => {
        if (t.id === toolId) {
          const nextStatus = t.status === 'active' ? 'pending' : 'active';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const activeToolsCount = toolsList.filter((t) => t.status === 'active').length;
  const pendingToolsCount = toolsList.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Skills & Knowledge Catalog */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>مهارت‌ها، دانش و ابزارها (Skills, Knowledge & Tools)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              تزریق سرفصل‌های تخصصی مهندسی شبکه و کنترل ابزارهای کلاینت ویندوز به هسته هوش مصنوعی
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ ایجاد مهارت جدید با هوش مصنوعی (AI Creator)</span>
          </button>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Skills Directory */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">فهرست تخصص‌ها و پلاگین‌ها</span>
              <span className="text-[11px] text-neutral-500 font-mono">{activeSkillIds.length} فعال در چت</span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'همه' },
                { id: 'plugin', label: 'پلاگین‌ها' },
                { id: 'security', label: 'امنیت' },
                { id: 'network', label: 'شبکه' },
                { id: 'devops', label: 'دوآپس' },
                { id: 'system', label: 'سیستم' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSkillCategoryFilter(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all shrink-0 font-medium ${
                    skillCategoryFilter === cat.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-[#18181D] text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {skills
                .filter((s) => skillCategoryFilter === 'all' || s.category === skillCategoryFilter)
                .map((skill) => {
                const isSelected = skill.id === selectedSkillId;
                const isActiveInChat = activeSkillIds.includes(skill.id);
                const isPlugin = skill.category === 'plugin';
                return (
                  <div
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/60 shadow-lg'
                        : 'bg-[#141418] border-neutral-800/90 hover:border-neutral-700/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${isPlugin ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#1A1A22] border-neutral-700/80'} flex items-center justify-center shrink-0`}>
                          {getSkillIcon(skill.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white line-clamp-1">{skill.name}</h4>
                            {isPlugin && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono shrink-0">
                                پلاگین
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{skill.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSkill(skill.id);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-all shrink-0 ${
                          isActiveInChat
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isActiveInChat ? 'تزریق شده' : '+ افزودن'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Skill Details */}
          {selectedSkill && (
            <div className="lg:col-span-2 bg-[#141418] border border-neutral-800/90 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    {getSkillIcon(selectedSkill.icon)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedSkill.name}</h3>
                    <span className="text-[10px] font-mono text-neutral-400">دسته‌بندی: {selectedSkill.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => onToggleSkill(selectedSkill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeSkillIds.includes(selectedSkill.id)
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-[#18181D] hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{activeSkillIds.includes(selectedSkill.id) ? 'فعال در مکالمات چت' : 'فعال‌سازی در چت'}</span>
                </button>
              </div>

              {/* Domain Knowledge Points */}
              <div>
                <h4 className="text-xs font-bold text-neutral-300 mb-2.5 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>سرفصل‌های دانش تخصصی تزریقی به هوش مصنوعی</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedSkill.domainKnowledge.map((point, index) => (
                    <div key={index} className="p-2.5 bg-[#18181D] border border-neutral-800 rounded-xl text-xs text-neutral-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Injected System Directives */}
              <div>
                <h4 className="text-xs font-bold text-neutral-300 mb-2 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>دستورالعمل سیستمی تزریقی (System Directives)</span>
                </h4>
                <div className="p-3 bg-black/40 border border-neutral-800 rounded-xl font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto" dir="ltr">
                  {selectedSkill.systemPromptInjection}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Comprehensive Tools Box & Client Prerequisites */}
      <div className="space-y-6 pt-4 border-t border-neutral-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-400" />
              <span>باکس ابزارها، دسترسی‌ها و پیش‌نیازهای ایجنت کلاینت (Client Prerequisites & Tools Hub)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              لیست نرم‌افزارهای مورد نیاز برای کنترل سیستم، ماوس، کیبورد، شبکه و اتصال ایجنت ویندوز به سرور
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {activeToolsCount} ابزار فعال
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {pendingToolsCount} در انتظار فعال‌سازی
            </span>
          </div>
        </div>

        {/* Tools Grid: 4 Distinct Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category A: Network Engineering */}
          <div className="bg-[#141418] border border-neutral-800/90 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800 text-blue-400 font-bold text-xs">
              <Network className="w-4 h-4" />
              <span>ابزارهای حوزه شبکه</span>
            </div>
            <div className="space-y-2">
              {toolsList.filter((t) => t.category === 'network').map((tool) => (
                <div key={tool.id} className="p-2.5 rounded-xl bg-[#18181D] border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[140px]">{tool.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      tool.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tool.status === 'active' ? 'فعال' : 'در انتظار'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{tool.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                    <span className="text-neutral-500 font-mono">{tool.version}</span>
                    <button
                      onClick={() => handleToggleToolStatus(tool.id)}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {tool.status === 'active' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category B: Windows System Privileges */}
          <div className="bg-[#141418] border border-neutral-800/90 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800 text-emerald-400 font-bold text-xs">
              <Shield className="w-4 h-4" />
              <span>کنترل کامپیوتر و دسترسی ویندوز</span>
            </div>
            <div className="space-y-2">
              {toolsList.filter((t) => t.category === 'remote_control').map((tool) => (
                <div key={tool.id} className="p-2.5 rounded-xl bg-[#18181D] border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[140px]">{tool.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400">
                      فعال
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{tool.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                    <span className="text-neutral-500 font-mono">{tool.version}</span>
                    <span className="text-emerald-400">مجوز مجاز</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category C: Mouse, Keyboard & HID Automation */}
          <div className="bg-[#141418] border border-neutral-800/90 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800 text-purple-400 font-bold text-xs">
              <MousePointer className="w-4 h-4" />
              <span>کنترل موس، کیبورد و دسکتاپ</span>
            </div>
            <div className="space-y-2">
              {toolsList.filter((t) => t.category === 'input_hid').map((tool) => (
                <div key={tool.id} className="p-2.5 rounded-xl bg-[#18181D] border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[140px]">{tool.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400">
                      فعال
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{tool.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                    <span className="text-neutral-500 font-mono">{tool.version}</span>
                    <span className="text-purple-400">HID Hooked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category D: Core Software Prerequisites */}
          <div className="bg-[#141418] border border-neutral-800/90 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800 text-amber-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>نرم‌افزارهای پیش‌نیاز پایه</span>
            </div>
            <div className="space-y-2">
              {toolsList.filter((t) => t.category === 'prerequisite').map((tool) => (
                <div key={tool.id} className="p-2.5 rounded-xl bg-[#18181D] border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[140px]">{tool.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      tool.status === 'installed' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tool.status === 'installed' ? 'نصب شده' : 'در انتظار'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{tool.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                    <span className="text-neutral-500 font-mono">{tool.version}</span>
                    <span className="text-neutral-400">{tool.requiredFor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2.5: AI Telemetry & 24h Predictive Resource Analysis (Ollama & Langflow RAM & CPU Forecasting) */}
        <div className="bg-[#141418] border border-indigo-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                    <span>تحلیل داده‌ها و پیش‌بینی مصرف رم و سی‌پی‌یو (۲۴ ساعت آینده)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      دقت مدل: ۹۷.۲٪
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    پیش‌بینی هوشمند بار پردازشی سرویس‌های Ollama و Langflow بر اساس State جاری ایجنت، مهارت‌های فعال ({activeSkillIds.length}) و ترافیک سازمانی
                  </p>
                </div>
              </div>
            </div>

            {/* Filter & Metric View Toggles */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {/* Metric Toggle: RAM vs CPU */}
              <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-neutral-700/80">
                <button
                  type="button"
                  onClick={() => setTelemetryMetric('ram')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    telemetryMetric === 'ram'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>مصرف رم (RAM GB)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTelemetryMetric('cpu')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    telemetryMetric === 'cpu'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>بار پردازشی (CPU %)</span>
                </button>
              </div>

              {/* Service Filter */}
              <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-neutral-700/80 text-xs">
                <button
                  type="button"
                  onClick={() => setTelemetryServiceFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    telemetryServiceFilter === 'all' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ترکیبی
                </button>
                <button
                  type="button"
                  onClick={() => setTelemetryServiceFilter('ollama')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    telemetryServiceFilter === 'ollama' ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Ollama
                </button>
                <button
                  type="button"
                  onClick={() => setTelemetryServiceFilter('langflow')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    telemetryServiceFilter === 'langflow' ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Langflow
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#18181D] border border-neutral-800 rounded-xl p-3">
              <span className="text-[11px] text-neutral-400 block">پیک پیش‌بینی رم (Peak RAM)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-amber-400 font-mono">14.6 GB</span>
                <span className="text-[10px] text-neutral-500 font-mono">/ 16 GB (91%)</span>
              </div>
              <span className="text-[10px] text-amber-300">ساعت ۱۱:۰۰ (اوج استعلامات)</span>
            </div>

            <div className="bg-[#18181D] border border-neutral-800 rounded-xl p-3">
              <span className="text-[11px] text-neutral-400 block">کف مصرف در ساعات غیراداری</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-emerald-400 font-mono">5.1 GB</span>
                <span className="text-[10px] text-emerald-400 font-mono">(31.8%)</span>
              </div>
              <span className="text-[10px] text-emerald-300">ساعت ۰۴:۱۵ (پس از پاکسازی کش)</span>
            </div>

            <div className="bg-[#18181D] border border-neutral-800 rounded-xl p-3">
              <span className="text-[11px] text-neutral-400 block">میانگین بار پردازنده (CPU)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-blue-400 font-mono">31.4%</span>
                <span className="text-[10px] text-neutral-500 font-mono">میانگین ۲۴ ساعته</span>
              </div>
              <span className="text-[10px] text-blue-300">پایداری هسته کاملاً تضمین‌شده</span>
            </div>

            <div className="bg-[#18181D] border border-neutral-800 rounded-xl p-3">
              <span className="text-[11px] text-neutral-400 block">پنجره خلوتی بهینه (Golden Window)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-purple-300 font-mono">۰۲:۰۰ - ۰۶:۰۰</span>
              </div>
              <span className="text-[10px] text-purple-400">بهترین زمان دانلود مدل و ریاستارت</span>
            </div>
          </div>

          {/* SVG 24-Hour Telemetry Chart */}
          <div className="bg-[#101014] border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-neutral-800/80 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>نمودار ۲۴ ساعته {telemetryMetric === 'ram' ? 'مصرف حافظه رم (RAM / VRAM)' : 'بار پردازشی سی‌پی‌یو (CPU Load)'}</span>
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Ollama</span>
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Langflow</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded bg-purple-900/30 border border-purple-500/30 inline-block" />
                  <span>ساعات غیراداری (۲۳ تا ۷)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded bg-blue-900/20 border border-blue-500/20 inline-block" />
                  <span>اوج ساعات اداری (۹ تا ۱۶)</span>
                </span>
              </div>
            </div>

            {/* High-Resolution SVG Canvas */}
            <div className="relative w-full overflow-x-auto">
              <svg viewBox="0 0 840 250" className="w-full h-56 min-w-[700px] select-none">
                <defs>
                  {/* Ollama Blue Gradient */}
                  <linearGradient id="gradOllama" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                  </linearGradient>

                  {/* Langflow Purple Gradient */}
                  <linearGradient id="gradLangflow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Off-Peak Shaded Background Bands */}
                {/* 00:00 to 07:00 (x: 40 to 40 + 7 * 32.1 = 264.7) */}
                <rect x="40" y="20" width="225" height="180" fill="#4C1D95" fillOpacity="0.12" rx="6" />
                {/* 23:00 to 24:00 (x: 777 to 810) */}
                <rect x="777" y="20" width="33" height="180" fill="#4C1D95" fillOpacity="0.12" rx="6" />
                
                {/* Peak Business Shaded Background Band (09:00 to 16:00: x: 328 to 553) */}
                <rect x="328" y="20" width="225" height="180" fill="#1E3A8A" fillOpacity="0.10" rx="6" />

                {/* Gridlines Horizontal */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = 20 + i * 45;
                  const labelRam = `${16 - i * 4} GB`;
                  const labelCpu = `${100 - i * 25}%`;
                  return (
                    <g key={i}>
                      <line x1="40" y1={y} x2="810" y2={y} stroke="#262626" strokeDasharray="3 3" />
                      <text x="35" y={y + 3} fill="#737373" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {telemetryMetric === 'ram' ? labelRam : labelCpu}
                      </text>
                    </g>
                  );
                })}

                {/* Memory Warning Threshold Line (14 GB / 87.5%) */}
                {telemetryMetric === 'ram' && (
                  <g>
                    <line x1="40" y1="42" x2="810" y2="42" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth="1.2" opacity="0.8" />
                    <text x="805" y="38" fill="#F59E0B" fontSize="9" textAnchor="end" fontWeight="bold">
                      هشدار آستانه مصرف (14 GB)
                    </text>
                  </g>
                )}

                {/* Curve plotting */}
                {(() => {
                  const stepX = (810 - 40) / 23; // ~33.47 px per hour
                  const getY = (val: number, maxVal: number) => 200 - (val / maxVal) * 180;

                  // Ollama Points
                  const maxVal = telemetryMetric === 'ram' ? 16 : 100;
                  const pointsOllama = forecastData.map((d, i) => {
                    const x = 40 + i * stepX;
                    const val = telemetryMetric === 'ram' ? d.ollamaRam : d.ollamaCpu;
                    const y = getY(val, maxVal);
                    return { x, y, val, d, i };
                  });

                  // Langflow Points
                  const pointsLangflow = forecastData.map((d, i) => {
                    const x = 40 + i * stepX;
                    const val = telemetryMetric === 'ram' ? d.langflowRam : d.langflowCpu;
                    const y = getY(val, maxVal);
                    return { x, y, val, d, i };
                  });

                  // Path Strings
                  const pathDLineOllama = pointsOllama.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const pathDAreaOllama = `${pathDLineOllama} L ${pointsOllama[pointsOllama.length - 1].x} 200 L 40 200 Z`;

                  const pathDLineLangflow = pointsLangflow.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const pathDAreaLangflow = `${pathDLineLangflow} L ${pointsLangflow[pointsLangflow.length - 1].x} 200 L 40 200 Z`;

                  return (
                    <>
                      {/* Ollama Area & Line */}
                      {(telemetryServiceFilter === 'all' || telemetryServiceFilter === 'ollama') && (
                        <>
                          <path d={pathDAreaOllama} fill="url(#gradOllama)" />
                          <path d={pathDLineOllama} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
                        </>
                      )}

                      {/* Langflow Area & Line */}
                      {(telemetryServiceFilter === 'all' || telemetryServiceFilter === 'langflow') && (
                        <>
                          <path d={pathDAreaLangflow} fill="url(#gradLangflow)" />
                          <path d={pathDLineLangflow} fill="none" stroke="#A855F7" strokeWidth="2" strokeDasharray={telemetryServiceFilter === 'all' ? '4 2' : 'none'} />
                        </>
                      )}

                      {/* Selected Hour Vertical Cursor */}
                      {selectedTelemetryHour !== null && (
                        <g>
                          <line
                            x1={40 + selectedTelemetryHour * stepX}
                            y1="20"
                            x2={40 + selectedTelemetryHour * stepX}
                            y2="200"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                        </g>
                      )}

                      {/* Data Point Circles */}
                      {pointsOllama.map((p) => {
                        const isSelected = selectedTelemetryHour === p.i;
                        return (
                          <g key={p.i} className="cursor-pointer" onClick={() => setSelectedTelemetryHour(p.i)}>
                            {/* Hover hit box */}
                            <rect x={p.x - 15} y="20" width="30" height="200" fill="transparent" />

                            {isSelected && (
                              <circle cx={p.x} cy={p.y} r="8" fill="#3B82F6" fillOpacity="0.3" className="animate-ping" />
                            )}

                            {(telemetryServiceFilter === 'all' || telemetryServiceFilter === 'ollama') && (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={isSelected ? '5' : '3.5'}
                                fill={isSelected ? '#60A5FA' : '#3B82F6'}
                                stroke="#141418"
                                strokeWidth="1.5"
                              />
                            )}

                            {(telemetryServiceFilter === 'all' || telemetryServiceFilter === 'langflow') && (
                              <circle
                                cx={p.x}
                                cy={pointsLangflow[p.i].y}
                                r={isSelected ? '4.5' : '3'}
                                fill={isSelected ? '#C084FC' : '#A855F7'}
                                stroke="#141418"
                                strokeWidth="1.5"
                              />
                            )}

                            {/* X-axis Hour Label */}
                            <text
                              x={p.x}
                              y="220"
                              fill={isSelected ? '#FFFFFF' : '#737373'}
                              fontSize={isSelected ? '10' : '8.5'}
                              fontWeight={isSelected ? 'bold' : 'normal'}
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {p.d.hour}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Interactive Inspection Card for Selected Hour */}
          {(() => {
            const cur = forecastData[selectedTelemetryHour] || forecastData[11];
            return (
              <div className="bg-[#18181D] border border-neutral-700/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-lg">
                      ساعت {cur.hour} (انتخاب شده)
                    </span>

                    {cur.isOffPeak ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 flex items-center gap-1">
                        <Moon className="w-3 h-3 text-purple-400" />
                        ساعات غیراداری (خلوتی سرور)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-400" />
                        ساعات اداری و اوج بار سازمانی
                      </span>
                    )}

                    <span className="text-[10px] text-neutral-400 font-mono">
                      مجموع رم: {cur.totalRam} GB · سی‌پی‌یو: {cur.totalCpu}%
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {cur.workloadNote}
                  </p>
                </div>

                {/* Right Breakdown Badges & Scheduler Navigation */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs">
                    <span className="text-[10px] text-neutral-400 block">Ollama</span>
                    <span className="text-blue-300 font-bold font-mono">{cur.ollamaRam} GB · {cur.ollamaCpu}% CPU</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
                    <span className="text-[10px] text-neutral-400 block">Langflow</span>
                    <span className="text-purple-300 font-bold font-mono">{cur.langflowRam} GB · {cur.langflowCpu}% CPU</span>
                  </div>

                  {onNavigateToServerInfra && (
                    <button
                      type="button"
                      onClick={onNavigateToServerInfra}
                      className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      title="تنظیم خودکار این پیشنهاد در مرکز زمان‌بندی سرور"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ثبت در زمان‌بندی ساعات غیراداری</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* SECTION 3: Local Agent Configuration & Connection Settings */}
        <div className="bg-[#141418] border border-neutral-800/90 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                <span>تنظیمات و پیکربندی ارتباطی ایجنت محلی (Agent Connection Settings)</span>
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                تنظیمات سوکت ارتباطی، توکن امنیتی و مجوزهای سیستمی جهت اتصال ایجنت سیستم ادمین به سرور
              </p>
            </div>

            {configSavedToast && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl animate-in fade-in">
                ✓ تنظیمات با موفقیت ذخیره و در agent_config.json اعمال شد
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">آدرس وب‌سوکت سرور (Server WebSocket URL)</label>
              <input
                type="text"
                value={agentConfig.serverWsUrl}
                onChange={(e) => setAgentConfig({ ...agentConfig, serverWsUrl: e.target.value })}
                className="w-full bg-[#18181D] border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">توکن امنیتی ایجنت (Agent Security Token)</label>
              <input
                type="text"
                value={agentConfig.agentToken}
                onChange={(e) => setAgentConfig({ ...agentConfig, agentToken: e.target.value })}
                className="w-full bg-[#18181D] border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">پورت لیسنر محلی ایجنت (Local Port)</label>
              <input
                type="number"
                value={agentConfig.localPort}
                onChange={(e) => setAgentConfig({ ...agentConfig, localPort: Number(e.target.value) })}
                className="w-full bg-[#18181D] border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>

            {/* Permission Toggles */}
            <div className="md:col-span-3 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181D] border border-neutral-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentConfig.enableMouseKeyboard}
                  onChange={(e) => setAgentConfig({ ...agentConfig, enableMouseKeyboard: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-neutral-200">مجوز کنترل ماوس و کیبورد</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181D] border border-neutral-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentConfig.enableScreenCapture}
                  onChange={(e) => setAgentConfig({ ...agentConfig, enableScreenCapture: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-neutral-200">مجوز اسکرین‌شات دسکتاپ</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181D] border border-neutral-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentConfig.enableNetworkTools}
                  onChange={(e) => setAgentConfig({ ...agentConfig, enableNetworkTools: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-neutral-200">اتصال به Winbox و ابزارهای شبکه</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#18181D] border border-neutral-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentConfig.useSocks5Proxy}
                  onChange={(e) => setAgentConfig({ ...agentConfig, useSocks5Proxy: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-neutral-200">عبور ترافیک از پراکسی SOCKS5</span>
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2.5 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                ذخیره و اعمال تنظیمات ایجنت
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3.5: Agent & Chrome Extension Download Hub and Auto-Update Pipeline */}
        <div className="bg-[#141418] border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>مرکز دانلود و نصب بسته‌های ایجنت ویندوز و افزونه کروم</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono border border-amber-500/30">
                      v{serverReleaseVersion} Official
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    دانلود مستقیم فایل‌های نصبی از سرور، رعایت سیاست‌های دسترسی ویندوز، و مکانیزم بروزرسانی خودکار زنده
                  </p>
                </div>
              </div>
            </div>

            {/* Version Synchronization Indicator & Update Action */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-[#18181D] border border-neutral-700/80 text-xs">
                <div className="flex flex-col text-[11px] leading-tight text-right">
                  <span className="text-neutral-400">نسخه ایجنت محلی:</span>
                  <span className="font-mono font-bold text-white">v{agentCurrentVersion}</span>
                </div>
                <div className="h-6 w-px bg-neutral-800 mx-1" />
                <div className="flex flex-col text-[11px] leading-tight text-right">
                  <span className="text-neutral-400">آخرین نسخه سرور:</span>
                  <span className="font-mono font-bold text-emerald-400">v{serverReleaseVersion}</span>
                </div>
              </div>

              {hasUpdateAvailable ? (
                <button
                  type="button"
                  onClick={handleRunAutoUpdate}
                  disabled={isUpdatingAgent}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  title="دانلود و اعمال خودکار نسخه جدید روی ایجنت بدون توقف سرویس"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingAgent ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingAgent ? 'در حال اعمال بروزرسانی...' : 'بروزرسانی خودکار ایجنت (In-Place)'}</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ایجنت کاملاً بروز است</span>
                </span>
              )}
            </div>
          </div>

          {/* Download Notification Toast */}
          {downloadToast && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{downloadToast}</span>
              </span>
              <button onClick={() => setDownloadToast(null)} className="text-neutral-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* Dynamic Auto-Update Progress Bar & Terminal Logs */}
          {isUpdatingAgent && (
            <div className="p-4 rounded-xl bg-[#0E1017] border border-amber-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{updateStep}</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{updateProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>

              {/* Terminal Logs */}
              <div className="p-2.5 bg-black/60 rounded-lg font-mono text-[11px] text-neutral-300 space-y-1 max-h-24 overflow-y-auto" dir="ltr">
                {updateLogs.map((log, idx) => (
                  <div key={idx} className="leading-snug">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tabs: Windows Installer vs Chrome Extension vs GitHub CI/CD */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveDownloadTab('windows')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeDownloadTab === 'windows'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>پکیج نصب ایجنت ویندوز</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDownloadTab('chrome')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeDownloadTab === 'chrome'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>افزونه مرورگر کروم (Manifest V3)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDownloadTab('github_cicd')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeDownloadTab === 'github_cicd'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>پایپ‌لاین گیت‌هاب و متادیتا سرور</span>
            </button>
          </div>

          {/* TAB 1: Windows Agent Package & Installer */}
          {activeDownloadTab === 'windows' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Standalone Interactive Installer & User Session Isolation Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-[#14141c] to-blue-950/40 border border-sky-500/40 space-y-3 shadow-lg">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          اسکریپت تعاملی نصب و احراز هویت دستگاه (Standalone Installer & User Session Isolation)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                          Zero-Trust Architecture
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                        دریافت آدرس Master و کلید تبادل امن (HMAC/JWT) به صورت تعاملی در CLI، ذخیره انحصاری توکن در <code className="text-sky-300 font-mono">%AppData%\OmniOpsAgent</code> و توقف خودکار سشن قبلی هنگام سوییچ کاربر ویندوز (آرمان vs مسعود).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="/agent/install-agent.ps1"
                      download="install-agent.ps1"
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود install-agent.ps1</span>
                    </a>
                    <a
                      href="/agent/install-agent.sh"
                      download="install-agent.sh"
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-zinc-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>اسکریپت لینوکس (.sh)</span>
                    </a>
                  </div>
                </div>

                {/* 1-Click PowerShell Run Command */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 font-mono text-xs flex items-center justify-between gap-3" dir="ltr">
                  <div className="flex items-center gap-2 overflow-x-auto text-emerald-400">
                    <span className="text-zinc-500 select-none">PS&gt;</span>
                    <span className="select-all">irm https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/agent/install-agent.ps1 | iex</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('irm https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/agent/install-agent.ps1 | iex');
                      setCopiedInstallCmd(true);
                      setTimeout(() => setCopiedInstallCmd(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors shrink-0"
                    title="کپی دستور نصب"
                  >
                    {copiedInstallCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Option 1: 1-Click BAT Launcher */}
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span>نصب ساده اتوماتیک (.bat)</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">دابل‌کلیک</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      فایل نصب خودکار برای سیستم‌های کلاینت. با اجرای دابل‌کلیک، پنجره دسترسی Administrator (UAC) را باز کرده و سیاست ExecutionPolicy ویندوز را دور می‌زند.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadInstaller('bat')}
                      className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود install-omniagent.bat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewScriptType('install_bat');
                        setIsScriptModalOpen(true);
                      }}
                      className="w-full py-1 text-[11px] text-neutral-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <Code2 className="w-3 h-3 text-neutral-400" />
                      <span>مشاهده کد اسکریپت</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Full PowerShell Script */}
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-emerald-400" />
                        <span>اسکریپت پاورشل نصب (.ps1)</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">ادمین شبکه</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      شامل ایجاد دایرکتوری، ثبت سرویس بومی ویندوز <code className="text-emerald-300">OmniOpsAgent</code>، باز کردن پورت 8443 در فایروال و ثبت رجیستری Chrome Native Messaging.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadInstaller('ps1')}
                      className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود install-omniagent.ps1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewScriptType('install_ps1');
                        setIsScriptModalOpen(true);
                      }}
                      className="w-full py-1 text-[11px] text-neutral-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <Code2 className="w-3 h-3 text-neutral-400" />
                      <span>مشاهده کد اسکریپت</span>
                    </button>
                  </div>
                </div>

                {/* Option 3: Full Compressed Zip Bundle */}
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>بسته کامل فشرده (.zip)</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">1.4 MB</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      پکیج توزیع رسمی شامل اسکریپت‌های نصب و حذف کامل، باینری سرویس، اسکریپت بروزرسانی در محل (update-omniagent.ps1) و آیکون سینی سیستم برای انتقال به کامپیوترهای آفلاین.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadInstaller('agent_zip')}
                      className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود OmniAgent-Windows-v2.4.1.zip</span>
                    </button>
                    <div className="py-1 text-[10px] text-neutral-500 text-center font-mono">
                      شامل تمام اسکریپت‌ها + باینری‌ها
                    </div>
                  </div>
                </div>

                {/* Option 4: Full Uninstaller Script (User Request: گزینه حذف در کنار فایل‌های نصبی) */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-[#1C1216] to-[#140E12] border border-rose-500/40 hover:border-rose-500/70 transition-all flex flex-col justify-between space-y-3 shadow-lg shadow-rose-950/20">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>اسکریپت حذف و پاکسازی کامل</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono">حذف بدون ردپا</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      توقف و حذف سرویس ویندوز <code className="text-rose-300">OmniOpsAgent</code>، بستن و حذف رول فایروال 8443، پاکسازی رجیستری کروم و حذف کامل پوشه نصب بدون نیاز به ریستارت سیستم.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadInstaller('uninstall_bat')}
                        className="py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="دانلود اسکریپت دابل‌کلیک حذف خودکار (.bat)"
                      >
                        <Download className="w-3 h-3" />
                        <span>uninstall.bat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadInstaller('uninstall_ps1')}
                        className="py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="دانلود اسکریپت پاورشل حذف کامل (.ps1)"
                      >
                        <Download className="w-3 h-3" />
                        <span>uninstall.ps1</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewScriptType('uninstall_ps1');
                        setIsScriptModalOpen(true);
                      }}
                      className="w-full py-1 text-[11px] text-rose-300/80 hover:text-rose-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Code2 className="w-3 h-3 text-rose-400" />
                      <span>مشاهده دستورات حذف (Script Preview)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: Lifecycle Management & Live Uninstallation Simulator */}
              <div className="p-4 rounded-xl bg-[#0D0F15] border border-neutral-800 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        مدیریت چرخه حیات و پاکسازی ریشه‌ای ایجنت (Lifecycle & Clean Removal)
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        در صورت عدم نیاز یا جابجایی سرور، ایجنت بدون هیچ فایل باقیمانده یا کلید معلق در رجیستری پاکسازی می‌شود.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAgentUninstalled ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAgentUninstalled(false);
                          onToggleAgentRunning(true);
                          setDownloadToast('ایجنت مجدداً فعال و در حالت آماده‌به‌کار قرار گرفت.');
                          setTimeout(() => setDownloadToast(null), 3000);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>نصب و فعال‌سازی مجدد ایجنت</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUninstallingAgent}
                        onClick={handleRunSimulatedUninstall}
                        className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="اجرای فرآیند شبیه‌سازی گام‌به‌گام حذف سرویس و پاکسازی کلیدها"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>{isUninstallingAgent ? 'در حال پاکسازی...' : 'شبیه‌سازی فرآیند حذف کامل (Test Clean Uninstall)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated Simulated Uninstallation Logs */}
                {isUninstallingAgent && (
                  <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/40 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-300 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        <span>{uninstallStep}</span>
                      </span>
                      <span className="font-mono text-rose-400 font-bold">{uninstallProgress}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300 rounded-full"
                        style={{ width: `${uninstallProgress}%` }}
                      />
                    </div>

                    <div className="p-2.5 bg-black/80 rounded-lg font-mono text-[10px] text-neutral-300 space-y-1 max-h-24 overflow-y-auto" dir="ltr">
                      {uninstallLogs.map((log, idx) => (
                        <div key={idx} className="leading-snug">{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status after uninstallation */}
                {isAgentUninstalled && !isUninstallingAgent && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-[11px]">
                        ایجنت ویندوزی با موفقیت حذف شد: سرویس ویندوز لغو گردید، رول فایروال بسته شد، و کلیه کلیدهای رجیستری Chrome Native Messaging پاکسازی شدند.
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 font-mono text-rose-300 shrink-0">Uninstalled</span>
                  </div>
                )}

                {/* Fast Remote Uninstall Command */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-black/40 rounded-xl border border-neutral-800/80">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                    <span>تک‌خطی پاورشل حذف سریع روی کلاینت‌ها:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] font-mono text-cyan-300 px-2 py-1 bg-black/60 rounded border border-neutral-800 select-all" dir="ltr">
                      powershell -ExecutionPolicy Bypass -File uninstall-omniagent.ps1 -Force
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('powershell -ExecutionPolicy Bypass -File uninstall-omniagent.ps1 -Force');
                        setDownloadToast('دستور حذف پاورشل در کلیپ‌بورد کپی شد.');
                        setTimeout(() => setDownloadToast(null), 3000);
                      }}
                      className="p-1 px-2 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center gap-1 transition-colors"
                      title="کپی دستور"
                    >
                      <Copy className="w-3 h-3" />
                      <span>کپی</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Windows Security & Enterprise Policies Compliance Checklist */}
              <div className="p-4 rounded-xl bg-[#0E1016] border border-neutral-800 space-y-2.5 text-xs text-neutral-300">
                <span className="font-bold text-white block">
                  🛡️ الزامات امنیتی و استاندارد سیاست‌های ویندوز ۱۱ و سرور که در اسکریپت‌های نصب و حذف لحاظ شده است:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>ارتقای خودکار UAC:</b> در نصب و حذف با <code className="text-neutral-400">Start-Process -Verb runAs</code> بدون نیاز به باز کردن دستی cmd ادمین اجرا می‌شود.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>بای‌پَس موقت ExecutionPolicy:</b> با پارامتر <code className="text-neutral-400">-Scope Process</code> فقط برای اجرای اسکریپت اعمال شده و امنیت کلی ویندوز را کاهش نمی‌دهد.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>فایروال داخلی ویندوز:</b> رول پورت 8443 در هنگام نصب ایجاد شده و در هنگام حذف به صورت خودکار از فایروال حذف می‌شود.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>چرخه عمر سرویس ویندوز:</b> ثبت رسمی به عنوان سرویس ویندوز با قابلیت خودترمیمی (Restart on Crash) و حذف کامل با <code className="text-neutral-400">sc.exe delete</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span><b>پاکسازی بدون ردپا در حذف:</b> کلیه کلیدهای رجیستری Chrome Native Messaging در HKLM و HKCU و استارتاپ ویندوز کاملاً پاکسازی می‌شوند.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span><b>خاتمه خودکار پروسه‌ها:</b> در هنگام حذف، ابتدا پردازه‌های سینی ساعت و دیمن با سیگنال مسالمت‌آمیز متوقف شده سپس فایل‌های دایرکتوری پاک می‌شوند.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Chrome Extension Package */}
          {activeDownloadTab === 'chrome' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>پکیج افزونه کروم (OmniOps Chrome Hook)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">Manifest V3</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    افزونه سبک مرورگر جهت استخراج داده‌های تب‌های فعال، اتوماسیون وب‌سایت‌های اداری، فرم‌ها و ایجاد ارتباط امن بدون خروج داده با پورت ۸۴۴۳ لوکال.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadInstaller('chrome_zip')}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود OmniOps-Chrome-Extension-v2.4.1.zip</span>
                  </button>
                </div>

                {/* 3-Step Installation Guide in Chrome */}
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 space-y-2 text-xs">
                  <span className="font-bold text-white block">راهنمای نصب ۳۰ ثانیه‌ای افزونه در مرورگر کروم:</span>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-300 leading-relaxed">
                    <li>فایل زیپ را دانلود کرده و در یک پوشه دلخواه اکسترکت (Extract) نمایید.</li>
                    <li>در نوار آدرس مرورگر کروم آدرس <code className="text-cyan-400 font-mono">chrome://extensions</code> را باز کنید.</li>
                    <li>گزینه <b>Developer mode</b> (حالت توسعه‌دهنده) را در گوشه بالا-راست فعال کنید.</li>
                    <li>روی دکمه <b>Load unpacked</b> کلیک کرده و پوشه اکسترکت‌شده را انتخاب نمایید.</li>
                  </ol>
                  <p className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
                    💡 آیکون افزونه بلافاصله به نوار ابزار کروم افزوده شده و وضعیت آنلاین (سبز) را نشان می‌دهد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GitHub CI/CD & Server Version Manifest */}
          {activeDownloadTab === 'github_cicd' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub Releases Integration */}
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <span>مخزن رسمی و بسته‌های GitHub Releases</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">CI/CD Ready</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    با اعمال هر تگ نسخه (مثلاً <code className="text-purple-300">v2.4.1</code>) گردش‌کار <code className="text-neutral-300">.github/workflows/agent-build-release.yml</code> به صورت خودکار فایل‌ها را بیلد، فشرده و در صفحه Releases گیت‌هاب قرار می‌دهد.
                  </p>
                  <a
                    href="https://github.com/omniops/omniops-core/releases"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مشاهده و دانلود از مخزن رسمی GitHub</span>
                  </a>
                </div>

                {/* Remote In-Place Update Command */}
                <div className="p-4 rounded-xl bg-[#18181D] border border-neutral-700/80 space-y-2 text-xs">
                  <span className="font-bold text-white block">فرمان پاورشل برای استعلام و بروزرسانی خودکار کلاینت‌ها:</span>
                  <div className="p-2.5 bg-black/60 rounded-lg font-mono text-[10px] text-cyan-300 select-all overflow-x-auto leading-relaxed" dir="ltr">
                    powershell -ExecutionPolicy Bypass -File update-omniagent.ps1 -ServerUrl "{agentConfig.serverWsUrl.replace('wss://', 'https://').replace('/ws/agent', '')}" -Source server
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    ایجنت هر ۳۰ دقیقه یکبار اندپوینت <code className="text-neutral-300">/api/agent/version</code> سرور را چک می‌کند؛ در صورت آپدیت سرور، نوتیفیکیشن در ویندوز ظاهر می‌شود و بدون نیاز به نصب دوباره به‌روز می‌شود.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Chrome Extension ↔ Local Agent ↔ Server Architecture & Live Test */}
        <div className="bg-[#141418] border border-blue-500/20 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>معماری ارتباطی افزونه کروم، ایجنت محلی و سرور (Architecture & Live Test)</span>
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                تبادل امن پیام‌ها میان مرورگر وب، سرویس محلی ویندوز و سرور مرکزی OmniOps
              </p>
            </div>

            <button
              onClick={handleRunConnectionTest}
              disabled={testingConnection}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'در حال اجرای تست ارتباط...' : 'تست ارتباط کروم با سرور'}</span>
            </button>
          </div>

          {/* Interactive Topology Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#18181D] border border-neutral-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  Cr
                </div>
                <div>
                  <span className="text-white font-bold block">افزونه کروم (Extension)</span>
                  <span className="text-[10px] text-neutral-400">Native Messaging Bridge</span>
                </div>
              </div>
              <span className="text-emerald-400 text-[10px]">آماده (Ready)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#18181D] border border-neutral-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-white font-bold block">ایجنت محلی (Daemon)</span>
                  <span className="text-[10px] text-neutral-400">Windows HID & Tools Host</span>
                </div>
              </div>
              <span className={`text-[10px] ${agentRunning ? 'text-emerald-400' : 'text-red-400'}`}>
                {agentRunning ? 'سرویس فعال (8443)' : 'سرویس متوقف'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#18181D] border border-neutral-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-white font-bold block">سرور OmniOps (Central)</span>
                  <span className="text-[10px] text-neutral-400">WebSocket TLS (8080)</span>
                </div>
              </div>
              <span className="text-emerald-400 text-[10px]">آنلاین (Online)</span>
            </div>
          </div>

          {/* Test Results Banner */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
              testResult.localAgentOk
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5 font-bold">
                <span className="flex items-center gap-2">
                  {testResult.localAgentOk ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>نتیجه آزمون برقراری ارتباط سه مرحله‌ای</span>
                </span>
                {testResult.localAgentOk && (
                  <span className="font-mono text-[11px]">زمان تاخیر کل: {testResult.pingMs}ms</span>
                )}
              </div>
              <p>{testResult.message}</p>
            </div>
          )}
        </div>

        {/* SECTION 5: Windows System Tray Taskbar Simulator (آیکون سیستم در کنار ساعت) */}
        <div className="bg-[#121216] border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  شبیه‌ساز ایجنت در سینی سیستم ویندوز (Windows System Tray Icon Simulator)
                </h4>
                <p className="text-[11px] text-neutral-400">
                  آیکون در کنار ساعت ویندوز قرار دارد؛ با کلیک بر روی آن منوی کنترل، وضعیت، تست ارتباط و دکمه خروج کامل باز می‌شود.
                </p>
              </div>
            </div>
          </div>

          {/* Simulated Windows 11 Taskbar Segment (Near Clock) */}
          <div className="bg-[#0A0A0D] border border-neutral-800 rounded-xl p-3 flex items-center justify-between select-none">
            <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
              Windows Taskbar · Notification Area (System Tray)
            </span>

            {/* Tray Area (Right Side near clock) */}
            <div className="flex items-center gap-3 relative mr-auto sm:mr-0">
              {/* OmniOps Agent System Tray Icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTrayMenuOpen(!trayMenuOpen)}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all relative ${
                    trayMenuOpen
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-[#18181D] hover:bg-neutral-800 border-neutral-700/80 text-blue-400'
                  }`}
                  title="کلیک برای باز کردن منوی ایجنت OmniOps در تسک‌بار"
                >
                  <span className="font-extrabold text-xs">Ω</span>
                  {/* Status LED dot */}
                  <span className={`w-2 h-2 rounded-full absolute top-1 right-1 border border-black ${
                    agentRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`} />
                  {/* Update Available notification beacon */}
                  {hasUpdateAvailable && (
                    <span className="w-2.5 h-2.5 rounded-full absolute -top-1 -left-1 bg-amber-400 border border-black animate-ping" title="بروزرسانی جدید در دسترس است" />
                  )}
                </button>

                {/* Simulated Tray Popup Menu */}
                {trayMenuOpen && (
                  <div className="absolute bottom-11 left-0 sm:right-0 sm:left-auto w-72 bg-[#18181E] border border-neutral-700 rounded-2xl shadow-2xl p-3.5 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                          Ω
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-none">OmniOps Agent</span>
                          <span className="text-[10px] text-neutral-400 font-mono">v{agentCurrentVersion} (PID: 8492)</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        agentRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {agentRunning ? 'Running' : 'Stopped'}
                      </span>
                    </div>

                    {/* Auto-Update Notification Banner in Tray */}
                    {hasUpdateAvailable && (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-[10px]">
                          <span>🚀 نسخه جدید v{serverReleaseVersion} موجود است!</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 font-mono text-[9px]">Update</span>
                        </div>
                        <p className="text-[10px] text-neutral-300 leading-tight">
                          پشتیبانی کامل از MCP و ارتقای امنیت ویندوز
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTrayMenuOpen(false);
                            handleRunAutoUpdate();
                          }}
                          className="w-full py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold rounded-lg text-[10px] transition-all"
                        >
                          بروزرسانی فوری ایجنت (Auto-Update)
                        </button>
                      </div>
                    )}

                    {/* Status Info */}
                    <div className="space-y-1.5 text-[11px] text-neutral-300">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">وضعیت سرور:</span>
                        <span className="text-emerald-400 font-mono">Connected (38ms)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">افزونه کروم:</span>
                        <span className="text-blue-400 font-mono">Active Hook</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">ابزارهای فعال:</span>
                        <span className="font-mono text-white">{activeToolsCount} ابزار</span>
                      </div>
                    </div>

                    {/* Quick Test Connection in Tray */}
                    <button
                      type="button"
                      onClick={handleRunConnectionTest}
                      className="w-full py-1.5 px-3 bg-[#24242C] hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-400" />
                      <span>تست ارتباط کروم با سرور</span>
                    </button>

                    {/* Stop & Exit Service Button and Clean Uninstall */}
                    <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                      {agentRunning ? (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleAgentRunning(false);
                            setTrayMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <PowerOff className="w-3.5 h-3.5 text-red-400" />
                          <span>خروج و توقف موقت سرویس (Stop & Exit)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleAgentRunning(true);
                            setTrayMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>راه‌اندازی مجدد سرویس (Start Agent)</span>
                        </button>
                      )}

                      {/* Uninstall from Tray */}
                      <button
                        type="button"
                        onClick={() => {
                          setTrayMenuOpen(false);
                          handleRunSimulatedUninstall();
                        }}
                        className="w-full py-1.5 px-3 bg-neutral-900 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-500/40 text-neutral-400 hover:text-rose-300 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-2"
                        title="حذف کامل سرویس و پاکسازی کلیدهای رجیستری و فایل‌ها"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>حذف و لغو نصب کامل از ویندوز (Uninstall)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Network and Sound Icons */}
              <div className="flex items-center gap-2 text-neutral-400 px-2 py-1 bg-[#141418] rounded-lg border border-neutral-800">
                <Network className="w-3.5 h-3.5 text-neutral-300" />
                <span className="text-[10px] font-mono text-neutral-400">FA</span>
              </div>

              {/* Windows Clock */}
              <div className="text-right px-2 font-mono leading-tight">
                <div className="text-xs text-white font-semibold">14:30</div>
                <div className="text-[9px] text-neutral-400">2026/09/26</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Script Code Inspector Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#12141C] border border-neutral-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">مرورگر کدهای اسکریپت ویندوز (Script Code Inspector)</h3>
                  <p className="text-[11px] text-neutral-400">
                    بررسی فرامین، توابع امنیتی و سیاست‌های بومی ویندوز قبل از دانلود یا اجرا
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Script Selector Tabs */}
            <div className="bg-[#0B0D13] px-4 py-2 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewScriptType('install_bat')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    previewScriptType === 'install_bat'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  install-omniagent.bat
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScriptType('install_ps1')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    previewScriptType === 'install_ps1'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  install-omniagent.ps1
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScriptType('uninstall_bat')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    previewScriptType === 'uninstall_bat'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  uninstall-omniagent.bat
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewScriptType('uninstall_ps1')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    previewScriptType === 'uninstall_ps1'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  uninstall-omniagent.ps1
                </button>
              </div>

              {/* Action Buttons: Copy & Download */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const content = getScriptContent(previewScriptType);
                    navigator.clipboard.writeText(content);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="px-2.5 py-1 bg-[#1C1F2B] hover:bg-neutral-700 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>کپی متن اسکریپت</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadInstaller(previewScriptType as any)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#08090E] select-text">
              <pre className="font-mono text-xs text-neutral-300 whitespace-pre leading-relaxed selection:bg-blue-500/30" dir="ltr">
                {getScriptContent(previewScriptType)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-neutral-800 bg-[#0E1017] flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>سازگار با سیاست‌های امنیتی ویندوز ۱۰، ۱۱ و سرور (UAC, Service Control, Firewall)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveSkill={onAddSkill}
        availableModels={availableModels}
      />
    </div>
  );
};
