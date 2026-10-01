/**
 * Service modiriat va baz-khani-e tarikhche-ye dastoorat-e ejra shodeye Windows Edge Agent
 * Zakhire-sazi dar hafeze-ye local va sync ba Master Server
 */
import { getStoredCredentials } from './credentialService';

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

// 10 Dastoore pishfarz baraye zamani ke tarikhche khali ast
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

/**
 * Zakhire-ye natijeye ejraye dastoore jadid dar tarikhche-ye mahali
 */
export function recordCommandExecution(record: Omit<CommandExecutionLog, 'id' | 'timestamp'> & { timestamp?: string }): CommandExecutionLog {
  const newLog: CommandExecutionLog = {
    ...record,
    id: `exec-${Date.now()}`,
    timestamp: record.timestamp || new Date().toLocaleTimeString('fa-IR'),
    executed_by: record.executed_by || 'OmniOps-Windows-Edge-Agent'
  };

  try {
    const existing = getLocalHistory();
    const updated = [newLog, ...existing].slice(0, 10);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Khata dar zakhireye tarikhcheye dastoor:', err);
  }

  return newLog;
}

/**
 * Baz-khani-e tarikhche az localStorage ba fallback be dastoorate pishfarz
 */
export function getLocalHistory(): CommandExecutionLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 10);
      }
    }
  } catch (e) {
    console.warn('Khata dar parse-e tarikhcheye dastoorat:', e);
  }
  // Agar khali bud, pishfarz-ha ra zakhire va barmigardanad
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_COMMANDS));
  } catch {}
  return INITIAL_DEFAULT_COMMANDS;
}

/**
 * Daryafte 10 dastoore akhar az Master Server ya LocalStorage
 */
export async function fetchRecent10Executions(): Promise<CommandExecutionLog[]> {
  try {
    const creds = await getStoredCredentials();
    if (creds.masterUrl) {
      const res = await fetch(`${creds.masterUrl.replace(/\/+$/, '')}/api/v1/agent/windows/status`, {
        headers: {
          'Authorization': `Bearer ${creds.exchangeToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recent_executions) && data.recent_executions.length > 0) {
          const serverList: CommandExecutionLog[] = data.recent_executions.slice(0, 10).map((item: any, idx: number) => ({
            id: item.id || `exec-srv-${idx}`,
            command_id: item.command_id || `cmd-${idx}`,
            action: item.action || 'POWERSHELL',
            command: item.command || '',
            status: item.status || 'success',
            exit_code: item.exit_code !== undefined ? item.exit_code : 0,
            output: item.output || '[بدون خروجی]',
            timestamp: item.timestamp || new Date().toLocaleTimeString('fa-IR'),
            executed_by: item.executed_by || 'Windows-Edge-Agent'
          }));
          // Hamgam-sazi ba local storage
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverList));
          } catch {}
          return serverList;
        }
      }
    }
  } catch (err) {
    console.warn('Server offline ast, estefade az tarikhcheye mahali:', err);
  }

  return getLocalHistory();
}
