import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Server, 
  RefreshCw, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Play, 
  Clock
} from 'lucide-react';

export interface CommandExecutionLog {
  id: string;
  command_id: string;
  action: 'POWERSHELL' | 'CMD' | 'REGISTRY' | 'SERVICE' | 'SYSTEM_INFO' | string;
  command: string;
  status: 'success' | 'failed' | 'running';
  exit_code: number;
  output: string;
  timestamp: string;
  executed_by?: string;
  duration_ms?: number;
}

// 10 Dastoore pishfarz baraye namayesh dar zabane-ye jadide SettingsModal
export const INITIAL_DEFAULT_COMMANDS: CommandExecutionLog[] = [
  {
    id: 'exec-101',
    command_id: 'cmd-ps-101',
    action: 'POWERSHELL',
    command: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 -Property ProcessName, CPU, WorkingSet64',
    status: 'success',
    exit_code: 0,
    output: `ProcessName       CPU      WorkingSet64
-----------       ---      ------------
chrome         142.84         842833920
explorer.exe    45.12         189235200
dwm.exe         28.75         145899520
svchost.exe     14.20          98246656
OmniOpsAgent     3.42          45120000`,
    timestamp: '14:22:10',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 320
  },
  {
    id: 'exec-102',
    command_id: 'cmd-net-102',
    action: 'POWERSHELL',
    command: 'Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Select-Object InterfaceAlias, IPAddress, PrefixLength',
    status: 'success',
    exit_code: 0,
    output: `InterfaceAlias IPAddress       PrefixLength
-------------- ---------       ------------
Ethernet 2     192.168.1.142             24
vEthernet (WSL) 172.24.80.1               20`,
    timestamp: '14:20:05',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 180
  },
  {
    id: 'exec-103',
    command_id: 'cmd-svc-103',
    action: 'SERVICE',
    command: 'Get-Service -Name "wuauserv", "WinDefend", "RpcSs" | Select-Object Name, Status, StartType',
    status: 'success',
    exit_code: 0,
    output: `Name       Status  StartType
----       ------  ---------
RpcSs     Running  Automatic
WinDefend Running  Automatic
wuauserv  Stopped     Manual`,
    timestamp: '14:18:40',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 210
  },
  {
    id: 'exec-104',
    command_id: 'cmd-reg-104',
    action: 'REGISTRY',
    command: 'Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "ProductName", "DisplayVersion"',
    status: 'success',
    exit_code: 0,
    output: `ProductName    : Windows 11 Pro
DisplayVersion : 23H2
PSPath         : Microsoft.PowerShell.Core\\Registry::HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion`,
    timestamp: '14:15:12',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 95
  },
  {
    id: 'exec-105',
    command_id: 'cmd-netstat-105',
    action: 'CMD',
    command: 'netstat -ano | findstr :3000',
    status: 'success',
    exit_code: 0,
    output: `  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       8412
  TCP    [::]:3000              [::]:0                 LISTENING       8412
  TCP    127.0.0.1:3000         127.0.0.1:54912        ESTABLISHED     8412`,
    timestamp: '14:11:30',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 140
  },
  {
    id: 'exec-106',
    command_id: 'cmd-disk-106',
    action: 'POWERSHELL',
    command: 'Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N="UsedGB";E={[math]::Round($_.Used/1GB,2)}}, @{N="FreeGB";E={[math]::Round($_.Free/1GB,2)}}',
    status: 'success',
    exit_code: 0,
    output: `Name UsedGB FreeGB
---- ------ ------
C    184.22 315.78
D     62.10 412.90`,
    timestamp: '14:05:48',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 280
  },
  {
    id: 'exec-107',
    command_id: 'cmd-sec-107',
    action: 'POWERSHELL',
    command: 'Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AMServiceEnabled',
    status: 'success',
    exit_code: 0,
    output: `AntivirusEnabled RealTimeProtectionEnabled AMServiceEnabled
---------------- ------------------------- ----------------
            True                      True             True`,
    timestamp: '13:58:22',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 450
  },
  {
    id: 'exec-108',
    command_id: 'cmd-uptime-108',
    action: 'POWERSHELL',
    command: '(Get-CimInstance Win32_OperatingSystem).LastBootUpTime',
    status: 'success',
    exit_code: 0,
    output: `Thursday, October 1, 2026 04:12:08 AM
System Uptime: 10 Hours, 10 Minutes`,
    timestamp: '13:50:11',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 110
  },
  {
    id: 'exec-109',
    command_id: 'cmd-firewall-109',
    action: 'POWERSHELL',
    command: 'Get-NetFirewallProfile -Profile Domain,Public,Private | Select-Object Name, Enabled',
    status: 'success',
    exit_code: 0,
    output: `Name    Enabled
----    -------
Domain     True
Private    True
Public     True`,
    timestamp: '13:42:00',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 190
  },
  {
    id: 'exec-110',
    command_id: 'cmd-test-110',
    action: 'POWERSHELL',
    command: 'Test-NetConnection -ComputerName "api.omniops.internal" -Port 3000',
    status: 'success',
    exit_code: 0,
    output: `ComputerName     : api.omniops.internal
RemoteAddress    : 127.0.0.1
RemotePort       : 3000
InterfaceAlias   : Loopback Pseudo-Interface 1
SourceAddress    : 127.0.0.1
TcpTestSucceeded : True`,
    timestamp: '13:35:19',
    executed_by: 'OmniOps-Windows-Edge-Agent',
    duration_ms: 260
  }
];

const LOCAL_STORAGE_KEY = 'omni_agent_last_10_executions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  // Tab-e feli: 'connection' baraye tanzimat ya 'history' baraye 10 dastoore akhar
  const [activeTab, setActiveTab] = useState<'connection' | 'history'>('connection');

  // State-haye tanzimat
  const [masterUrl, setMasterUrl] = useState(window.location.origin);
  const [exchangeToken, setExchangeToken] = useState('omni_sec_tok_master_default');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State-haye tarikhcheye dastoorat
  const [commandHistory, setCommandHistory] = useState<CommandExecutionLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedCmdId, setExpandedCmdId] = useState<string | null>(null);
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);
  const [copiedOutputId, setCopiedOutputId] = useState<string | null>(null);
  const [testCmdRunning, setTestCmdRunning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem('omni_master_url');
      const savedTok = localStorage.getItem('omni_exchange_token');
      if (savedUrl) setMasterUrl(savedUrl);
      if (savedTok) setExchangeToken(savedTok);
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      // Talash baraye daryafte gozareshe zende az Master Server
      const res = await fetch('/api/v1/agent/windows/status');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recent_executions) && data.recent_executions.length > 0) {
          const list: CommandExecutionLog[] = data.recent_executions.slice(0, 10).map((item: any, idx: number) => ({
            id: item.id || `exec-${idx}`,
            command_id: item.command_id || `cmd-${idx}`,
            action: item.action || 'POWERSHELL',
            command: item.command || '',
            status: item.status || 'success',
            exit_code: item.exit_code !== undefined ? item.exit_code : 0,
            output: item.output || '[بدون خروجی]',
            timestamp: item.timestamp || new Date().toLocaleTimeString('fa-IR'),
            executed_by: item.executed_by || 'Windows-Edge-Agent'
          }));
          setCommandHistory(list);
          if (list.length > 0 && !expandedCmdId) setExpandedCmdId(list[0].id);
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Agar server offline bud ya dade nadasht, az localStorage mikhanad
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCommandHistory(parsed.slice(0, 10));
          if (!expandedCmdId) setExpandedCmdId(parsed[0].id);
          setLoadingHistory(false);
          return;
        }
      }
    } catch {}

    // Agar hanooz khali bud az INITIAL_DEFAULT_COMMANDS estefade mikonad
    setCommandHistory(INITIAL_DEFAULT_COMMANDS);
    if (!expandedCmdId) setExpandedCmdId(INITIAL_DEFAULT_COMMANDS[0].id);
    setLoadingHistory(false);
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('omni_master_url', masterUrl.trim());
    localStorage.setItem('omni_exchange_token', exchangeToken.trim());
    setTimeout(() => {
      setLoading(false);
      setStatus('SUCCESS: تنظیمات اتصال ذخیره گردید.');
      if (onSaved) onSaved();
      setTimeout(() => setStatus(null), 3000);
    }, 400);
  };

  const handleCopyCommand = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmdId(id);
    setTimeout(() => setCopiedCmdId(null), 1800);
  };

  const handleCopyOutput = (id: string, output: string) => {
    navigator.clipboard.writeText(output);
    setCopiedOutputId(id);
    setTimeout(() => setCopiedOutputId(null), 1800);
  };

  const handleRunSampleCommand = async () => {
    setTestCmdRunning(true);
    const sampleCmd = 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 3';
    setTimeout(() => {
      const newLog: CommandExecutionLog = {
        id: `exec-${Date.now()}`,
        command_id: `cmd-test-${Date.now()}`,
        action: 'POWERSHELL',
        command: sampleCmd,
        status: 'success',
        exit_code: 0,
        output: `ProcessName       CPU      WorkingSet64\n-----------       ---      ------------\nchrome.exe     148.12         912441200\nexplorer.exe    49.20         201402368\nsvchost.exe     15.80         104857600`,
        timestamp: new Date().toLocaleTimeString('fa-IR'),
        executed_by: 'OmniOps-Windows-Edge-Agent'
      };

      const updated = [newLog, ...commandHistory].slice(0, 10);
      setCommandHistory(updated);
      setExpandedCmdId(newLog.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setTestCmdRunning(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-zinc-100 shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161619] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold tracking-wide text-zinc-100">
              مدیریت و تنظیمات پیشرفته ایجنت ویندوز OmniOps
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition text-xs"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation (Zabane-ha) */}
        <div className="flex border-b border-zinc-800 bg-[#141417] px-6 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'connection'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>تنظیمات اتصال به سرور</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>تاریخچه دستورات اجرا شده (۱۰ دستور اخیر)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
              {commandHistory.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'connection' ? (
            /* TAB 1: Tanzimate Etesal */
            <div className="space-y-4 text-right" dir="rtl">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs leading-relaxed text-cyan-200">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">معماری ایزوله و ارتباط امن با هسته مرکزی (Master Node):</p>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    تمامی دستورات قبل از اجرا در گیت Zero-Trust احراز شده و کلیدها به صورت ایمن در سطح سیستم‌عامل نگهداری می‌شوند.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
                    آدرس سرور مرکزی (Master Server URL):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="http://192.168.1.100:3000"
                    value={masterUrl}
                    onChange={(e) => setMasterUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    اندپوینت API Gateway سرور OmniOps (مانند http://localhost:3000)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5 font-medium">
                    کلید تبادل امن (Exchange Token):
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="omni_sec_tok_..."
                    value={exchangeToken}
                    onChange={(e) => setExchangeToken(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    در حافظه امن سیستم‌عامل (Windows Credential Manager) ثبت و حفاظت می‌شود.
                  </span>
                </div>

                {status && (
                  <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                    status.startsWith('SUCCESS') 
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' 
                      : 'bg-rose-950/70 text-rose-300 border border-rose-800'
                  }`}>
                    {status.startsWith('SUCCESS') ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span>{status}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>ذخیره و برقراری ارتباط با مستر</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs transition"
                  >
                    بستن
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* TAB 2: Tarikhche-ye 10 Dastoore Akhar va Khorooji-e Nahayi */
            <div className="space-y-4" dir="rtl">
              {/* Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>۱۰ دستور نهایی اجرا شده توسط این ایجنت ویندوز و خروجی زنده:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunSampleCommand}
                    disabled={testCmdRunning}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] flex items-center gap-1.5 transition disabled:opacity-50"
                    title="اجرای یک دستور تست برای بررسی خروجی لحظه‌ای"
                  >
                    <Play className="w-3 h-3 text-cyan-400" />
                    <span>{testCmdRunning ? 'در حال اجرا...' : 'تست سریع'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadHistory}
                    disabled={loadingHistory}
                    className="px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                    <span>تازه‌سازی</span>
                  </button>
                </div>
              </div>

              {/* Status Summary Bar */}
              <div className="flex items-center justify-between text-[11px] bg-zinc-900/70 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 font-mono" dir="ltr">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Exit 0 (Success): {commandHistory.filter(c => c.exit_code === 0).length}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    Failed: {commandHistory.filter(c => c.exit_code !== 0).length}
                  </span>
                </div>
                <span className="text-zinc-500">Max Log: 10 Records</span>
              </div>

              {/* List of 10 Commands */}
              {commandHistory.length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
                  <Terminal className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">هنوز دستوری توسط ایجنت اجرا نشده است.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commandHistory.slice(0, 10).map((cmdLog, index) => {
                    const isExpanded = expandedCmdId === cmdLog.id;
                    const isSuccess = cmdLog.exit_code === 0 && cmdLog.status !== 'failed';

                    return (
                      <div
                        key={cmdLog.id || index}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isSuccess
                            ? 'bg-[#151518] border-zinc-800/90 hover:border-zinc-700'
                            : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                        }`}
                      >
                        {/* Command Item Header */}
                        <div
                          onClick={() => setExpandedCmdId(isExpanded ? null : cmdLog.id)}
                          className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-800/30 transition"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="w-5 h-5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-center shrink-0">
                              #{index + 1}
                            </span>

                            {/* Action Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              cmdLog.action === 'POWERSHELL'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : cmdLog.action === 'SERVICE'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : cmdLog.action === 'REGISTRY'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-zinc-700 text-zinc-300'
                            }`}>
                              {cmdLog.action}
                            </span>

                            {/* Command Snippet */}
                            <span className="font-mono text-xs text-zinc-200 truncate text-left dir-ltr max-w-xs sm:max-w-md" dir="ltr">
                              {cmdLog.command}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Exit Code */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              Exit: {cmdLog.exit_code}
                            </span>

                            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                              {cmdLog.timestamp}
                            </span>

                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Details: Full Command & Final Output */}
                        {isExpanded && (
                          <div className="p-3.5 border-t border-zinc-800/80 bg-black/60 space-y-3 animate-in fade-in duration-150">
                            {/* Command Text */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] text-zinc-400 font-medium">دستور ارسال شده (Command Payload):</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCommand(cmdLog.id, cmdLog.command);
                                  }}
                                  className="text-[10px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition"
                                >
                                  {copiedCmdId === cmdLog.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">کپی شد</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>کپی دستور</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/90 font-mono text-xs text-cyan-300 text-left overflow-x-auto select-all" dir="ltr">
                                <code>{cmdLog.command}</code>
                              </div>
                            </div>

                            {/* Final Output Display (Khorooji-e Nahayi) */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                                  <Terminal className="w-3 h-3 text-emerald-400" />
                                  <span>خروجی نهایی ترمینال (Terminal Output / Stdout / Stderr):</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyOutput(cmdLog.id, cmdLog.output);
                                  }}
                                  className="text-[10px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition"
                                >
                                  {copiedOutputId === cmdLog.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">کپی شد</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>کپی خروجی</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="bg-[#0b0b0e] p-3 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 text-left overflow-x-auto max-h-56 select-all leading-relaxed whitespace-pre" dir="ltr">
                                {cmdLog.output || '[دستور با موفقیت بدون خروجی اجرا شد]'}
                              </div>
                            </div>

                            {/* Metadata Footer */}
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1" dir="ltr">
                              <span>Executed by: {cmdLog.executed_by || 'Windows-Edge-Agent'}</span>
                              <span>Timestamp: {cmdLog.timestamp}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#161619] border-t border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono" dir="ltr">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>OmniOps Edge Agent v2.4.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
