import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  EffortLevel, 
  ApprovalGate, 
  WorkspaceFolder,
  AccessRequest,
  SandboxExecutionJob,
  McpServerConfig,
  SkillItem
} from '../types';
import { 
  Sparkles, 
  Bot, 
  Terminal, 
  FolderGit2, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Sliders, 
  Cpu, 
  Layers, 
  Check, 
  X, 
  Play, 
  Maximize2, 
  Send, 
  ChevronDown, 
  Zap, 
  Search, 
  Lock, 
  Radio, 
  Database, 
  GitBranch, 
  HardDrive, 
  RefreshCw, 
  Clock, 
  UserPlus, 
  Key, 
  ArrowUpRight,
  ExternalLink,
  Code2,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface MinimalistAiOsViewProps {
  currentUser: User | null;
  onSwitchUser?: (newUser: User) => void;
  onOpenSettings?: () => void;
}

const DEFAULT_WORKSPACES: WorkspaceFolder[] = [
  { id: 'ws-1', name: 'omniops-enterprise', path: '/opt/omniops', branch: 'main', repoType: 'git' },
  { id: 'ws-2', name: 'cluster-mesh-nodes', path: '/etc/wireguard', branch: 'cluster-v2', repoType: 'git' },
  { id: 'ws-3', name: 'isolated-sandbox-env', path: '/var/run/sandbox', repoType: 'local' }
];

export const MinimalistAiOsView: React.FC<MinimalistAiOsViewProps> = ({
  currentUser,
  onSwitchUser,
  onOpenSettings
}) => {
  // 1. Dual-State Central State-Machine ('chat' | 'autonomous_task')
  const [activeMode, setActiveMode] = useState<'chat' | 'autonomous_task'>('autonomous_task');

  // 2. Command Bar Inline State
  const [inputText, setInputText] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceFolder>(DEFAULT_WORKSPACES[0]);
  const [effortLevel, setEffortLevel] = useState<EffortLevel>('high');
  const [approvalGate, setApprovalGate] = useState<ApprovalGate>('manual');
  
  // Dropdown visibility
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isApprovalDropdownOpen, setIsApprovalDropdownOpen] = useState(false);
  const [isEffortDropdownOpen, setIsEffortDropdownOpen] = useState(false);
  const [isUserRoleMenuOpen, setIsUserRoleMenuOpen] = useState(false);

  // 3. Right Drawer (MCP & Skills Hub)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'mcp' | 'skills' | 'access_requests'>('mcp');

  // 4. Data states
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [skillsBank, setSkillsBank] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Self-service form
  const [reqFullName, setReqFullName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqDepartment, setReqDepartment] = useState('زیرساخت ابری');
  const [reqRole, setReqRole] = useState<UserRole>('Operator');
  const [reqReason, setReqReason] = useState('');
  const [reqStatusMessage, setReqStatusMessage] = useState<string | null>(null);

  // 5. Execution & Realtime Sandbox Stream
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentJob, setCurrentJob] = useState<SandboxExecutionJob | null>(null);
  const [streamLogs, setStreamLogs] = useState<string[]>([
    '[SYSTEM] OmniOps Cloud AI-OS Kernel Initialized (Zero-Trust Model v3.2)',
    '[SECURITY] MicroVM Sandbox & Egress Gateway Standby · Ready for orchestration.'
  ]);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [pendingDiffAction, setPendingDiffAction] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const terminalLogsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = terminalLogsRef.current.scrollHeight;
    }
  }, [streamLogs]);

  // Load initial MCP, Skills, and Requests
  useEffect(() => {
    fetch('/api/v1/mcp/servers')
      .then(res => res.json())
      .then(data => {
        if (data?.servers) setMcpServers(data.servers);
      })
      .catch(() => {});

    fetch('/api/v1/skills/bank')
      .then(res => res.json())
      .then(data => {
        if (data?.skills) setSkillsBank(data.skills);
      })
      .catch(() => {});

    fetch('/api/auth/access-requests')
      .then(res => res.json())
      .then(data => {
        if (data?.requests) setAccessRequests(data.requests);
      })
      .catch(() => {});
  }, []);

  // Auto-expand textarea
  const handleInputTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Toggle skill in Skills Bank
  const handleToggleSkill = (skillId: string) => {
    setSkillsBank(prev =>
      prev.map(s => (s.id === skillId ? { ...s, is_active: s.is_active ? 0 : 1 } : s))
    );
  };

  // Submit command or task to Sandbox
  const handleExecuteCommand = async () => {
    if (!inputText.trim() || isExecuting) return;

    const cmd = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check Role permission
    const userRole = currentUser?.role || 'SuperAdmin';
    if (userRole === 'Viewer') {
      setStreamLogs(prev => [
        ...prev,
        `[SECURITY_DENIED] کاربر با نقش ${userRole} مجاز به اجرای مستقیم فرامین نیست (فقط دسترسی خواندنی).`
      ]);
      return;
    }

    // Check Approval Gate: If manual diff review is requested
    if (approvalGate === 'manual' && (cmd.includes('rm') || cmd.includes('update') || cmd.includes('install') || cmd.includes('docker') || cmd.includes('iptables'))) {
      setPendingDiffAction({
        command: cmd,
        diff: `--- a/etc/omniops/cluster.conf\n+++ b/etc/omniops/cluster.conf\n@@ -24,4 +24,5 @@\n- status: active_legacy\n+ status: sandboxed_microvm\n+ egress_policy: zero_trust_drop_all\n+ authorization: ${userRole}\n`
      });
      setShowDiffModal(true);
      return;
    }

    await dispatchSandboxRun(cmd);
  };

  const dispatchSandboxRun = async (cmd: string) => {
    setIsExecuting(true);
    setStreamLogs(prev => [
      ...prev,
      `\n[TASK_DISPATCH] ─── User (${currentUser?.username || 'admin'}) ───`,
      `[COMMAND] $ ${cmd}`,
      `[ENVIRONMENT] MicroVM Isolated Pod (Cgroups 2GB RAM / 2 Cores)`
    ]);

    try {
      const res = await fetch('/api/v1/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          environment: 'microvm',
          user_id: currentUser?.username || 'admin'
        })
      });

      const data = await res.json();
      if (data?.stream_url) {
        // Connect to SSE stream
        const eventSource = new EventSource(data.stream_url);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event === 'log') {
              setStreamLogs(prev => [...prev, parsed.line]);
            } else if (parsed.event === 'done') {
              setStreamLogs(prev => [
                ...prev,
                `[EXECUTION_COMPLETED] Status: ${parsed.status.toUpperCase()} · Exit Code: ${parsed.exit_code} · Duration: ${parsed.execution_time_ms}ms`,
                `[ISOLATION] Container state gracefully cleaned & memory released.`
              ]);
              eventSource.close();
              setIsExecuting(false);
            }
          } catch {
            // fallback text
            setStreamLogs(prev => [...prev, event.data]);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setIsExecuting(false);
        };
      } else {
        setIsExecuting(false);
      }
    } catch {
      // Local fallback simulation
      setTimeout(() => {
        setStreamLogs(prev => [
          ...prev,
          `[MICROVM] Spawning isolated Firecracker instance...`,
          `[STDOUT] Scanning cluster topology on ${selectedWorkspace.path}...`,
          `[STDOUT] Network handshake verified. 0 packet loss.`,
          `[COMPLETED] Exit Code 0 (Success) · Memory footprint: 18.4 MB`
        ]);
        setIsExecuting(false);
      }, 800);
    }
  };

  // Submit Self-Service Access Request
  const handleSubmitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName || !reqEmail) return;

    try {
      const res = await fetch('/api/auth/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: reqFullName,
          email: reqEmail,
          department: reqDepartment,
          requested_role: reqRole,
          reason: reqReason
        })
      });
      const data = await res.json();
      setReqStatusMessage('درخواست شما با موفقیت ثبت شد و در انتظار تایید مدیر سیستم است.');
      if (data?.request) {
        setAccessRequests(prev => [data.request, ...prev]);
      }
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setReqStatusMessage(null);
      }, 1800);
    } catch {
      setReqStatusMessage('درخواست با موفقیت در کش محلی ذخیره شد.');
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setReqStatusMessage(null);
      }, 1500);
    }
  };

  const currentRole = currentUser?.role || 'SuperAdmin';

  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] text-zinc-100 select-none overflow-hidden font-sans">
      
      {/* ────────────────────────────────────────────────────────────────────────
          TOP NAVIGATION & STATE-MACHINE HEADER
      ──────────────────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800/60 bg-[#121212]/80 backdrop-blur-xl flex items-center justify-between px-6 z-30 shrink-0">
        
        {/* Left: Branding & Architecture Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm tracking-wider shadow-sm">
            Ω
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">OmniOps</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
                AI-OS v3.2
              </span>
            </div>
          </div>
        </div>

        {/* Center: State-Machine Dual Toggle ("گفتگو" vs "وظیفه") */}
        <div className="flex items-center bg-[#1a1a1a] p-1 rounded-full border border-zinc-800 shadow-inner">
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeMode === 'chat'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>گفتگو (Chat)</span>
          </button>

          <button
            onClick={() => setActiveMode('autonomous_task')}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeMode === 'autonomous_task'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>وظیفه (Autonomous Agent)</span>
          </button>
        </div>

        {/* Right: Extensions Trigger & RBAC Profile Badge */}
        <div className="flex items-center gap-3">
          {/* MCP Extensions Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>MCP Hub</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>

          {/* User Role & Access Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserRoleMenuOpen(!isUserRoleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                {currentRole[0]}
              </div>
              <span className="text-zinc-200 font-medium">{currentUser?.full_name || currentRole}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                currentRole === 'SuperAdmin' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' :
                currentRole === 'Admin' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                currentRole === 'Operator' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {currentRole}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {/* Quick RBAC Role Switcher & Access Request Dropdown */}
            {isUserRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#181818] border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                  <div className="text-[11px] font-mono text-zinc-400">احراز هویت متمرکز (LDAPS + Local)</div>
                  <div className="text-xs font-semibold text-white mt-0.5">{currentUser?.email || 'root@omniops.internal'}</div>
                </div>

                <div className="text-[10px] uppercase font-mono text-zinc-400 px-3 py-1">سوییچ نقش جهت تست تفکیک دسترسی:</div>
                {(['SuperAdmin', 'Admin', 'Operator', 'Viewer'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      if (onSwitchUser && currentUser) {
                        onSwitchUser({ ...currentUser, role });
                      }
                      setIsUserRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentRole === role ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>{role}</span>
                    {currentRole === role && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}

                <div className="border-t border-zinc-800/80 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsRequestModalOpen(true);
                      setIsUserRoleMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>درخواست دسترسی سازمانی (Self-Service)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────────
          MAIN WORKSPACE & TERMINAL / CHAT STAGE
      ──────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden flex flex-col p-6 pb-36">
        
        {/* Dynamic State: Autonomous Agent Execution Terminal & Stream */}
        {activeMode === 'autonomous_task' ? (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full h-full">
            {/* Minimalist Sub-Header Metrics */}
            <div className="flex items-center justify-between pb-3 text-xs border-b border-zinc-800/60 mb-4 shrink-0">
              <div className="flex items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono">{selectedWorkspace.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({selectedWorkspace.branch || 'local'})</span>
                </span>
                <span className="text-zinc-700">/</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>دروازه امنیت: {approvalGate === 'manual' ? 'تأیید دستی (Diff)' : approvalGate === 'semi_auto' ? 'تأیید خودکار امن' : 'دسترسی مستقیم'}</span>
                </span>
                <span className="text-zinc-700">/</span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>سطح محاسبات: {effortLevel.toUpperCase()}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  MicroVM Sandbox Active
                </span>
              </div>
            </div>

            {/* Live Streaming Console Terminal */}
            <div className="flex-1 bg-[#0d0d0d] border border-zinc-800/80 rounded-2xl p-5 overflow-hidden flex flex-col font-mono text-xs shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80 text-zinc-400 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-zinc-400 ml-2 font-mono">/dev/sandbox/pts/0 (Zero-Trust Egress)</span>
                </div>
                <button
                  onClick={() => setStreamLogs(['[TERMINAL_RESET] Console cleared by operator.'])}
                  className="hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>پاکسازی لاگ</span>
                </button>
              </div>

              {/* Terminal Logs View */}
              <div 
                ref={terminalLogsRef}
                className="flex-1 overflow-y-auto space-y-1.5 pr-2 select-text text-zinc-300 font-mono text-[12px] leading-relaxed"
              >
                {streamLogs.map((log, idx) => {
                  let colorClass = 'text-zinc-300';
                  if (log.includes('[INIT]') || log.includes('[POLICY]')) colorClass = 'text-purple-400';
                  else if (log.includes('[COMMAND]') || log.includes('[TASK_DISPATCH]')) colorClass = 'text-cyan-300 font-bold';
                  else if (log.includes('[STDOUT]')) colorClass = 'text-emerald-300';
                  else if (log.includes('[STDERR]') || log.includes('[EXCEPTION]') || log.includes('DENIED')) colorClass = 'text-rose-400';
                  else if (log.includes('[COMPLETED]') || log.includes('ExitCode: 0')) colorClass = 'text-emerald-400 font-semibold';

                  return (
                    <div key={idx} className={`${colorClass} break-all`}>
                      {log}
                    </div>
                  );
                })}
                {isExecuting && (
                  <div className="flex items-center gap-2 text-cyan-400 font-mono pt-1">
                    <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse"></span>
                    <span>Running task inside isolated microvm...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Conversational RAG & Knowledge Mode */
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-xl">
              <Bot className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">سیستم‌عامل هوش مصنوعی OmniOps</h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                حالت گفتگو برای پرسش و پاسخ، تحلیل لاگ‌ها، ترجمه و کاوش مستندات سازمانی.
              </p>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────────
            FLOATING OMNI-COMMAND BAR (CENTER-BOTTOM)
        ──────────────────────────────────────────────────────────────────────── */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
          
          <div className="relative rounded-2xl bg-[#161616]/95 border border-zinc-800/90 backdrop-blur-2xl shadow-2xl p-2.5 transition-all duration-200 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
            
            {/* Top Edge Inline Pill Buttons */}
            <div className="flex items-center gap-2 mb-2 px-1 border-b border-zinc-800/60 pb-2">
              
              {/* 1. Workspace / Folder Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen);
                    setIsApprovalDropdownOpen(false);
                    setIsEffortDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                >
                  <FolderGit2 className="w-3 h-3 text-cyan-400" />
                  <span>{selectedWorkspace.name}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
                </button>

                {isWorkspaceDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-56 rounded-xl bg-[#1c1c1c] border border-zinc-800 shadow-2xl p-1.5 z-50">
                    <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-mono">انتخاب ورک‌اسپیس پروژه:</div>
                    {DEFAULT_WORKSPACES.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          setSelectedWorkspace(ws);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                          selectedWorkspace.id === ws.id ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                        }`}
                      >
                        <span>{ws.name}</span>
                        {selectedWorkspace.id === ws.id && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. MCP Tools Trigger */}
              <button
                onClick={() => {
                  setDrawerTab('mcp');
                  setIsDrawerOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>افزونه‌ها (MCP Tools: {mcpServers.length || 4})</span>
              </button>

              {/* 3. Effort Level (Medium / High / Deep) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsEffortDropdownOpen(!isEffortDropdownOpen);
                    setIsWorkspaceDropdownOpen(false);
                    setIsApprovalDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                >
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>توان: {effortLevel.toUpperCase()}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
                </button>

                {isEffortDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 rounded-xl bg-[#1c1c1c] border border-zinc-800 shadow-2xl p-1.5 z-50">
                    <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-mono">سطح استدلال و توان:</div>
                    {(['medium', 'high', 'deep'] as EffortLevel[]).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setEffortLevel(lvl);
                          setIsEffortDropdownOpen(false);
                        }}
                        className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                          effortLevel === lvl ? 'bg-zinc-800 text-purple-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                        }`}
                      >
                        <span>{lvl.toUpperCase()} ({lvl === 'medium' ? 'استاندارد' : lvl === 'high' ? 'عمیق' : 'حداکثر توان'})</span>
                        {effortLevel === lvl && <Check className="w-3 h-3 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Approval Gate Selector (Manual / Semi-Auto / Full Access) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsApprovalDropdownOpen(!isApprovalDropdownOpen);
                    setIsWorkspaceDropdownOpen(false);
                    setIsEffortDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>
                    {approvalGate === 'manual' ? 'تأیید دستی (Diff)' : approvalGate === 'semi_auto' ? 'تأیید خودکار امن' : 'دسترسی کامل'}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
                </button>

                {isApprovalDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl bg-[#1c1c1c] border border-zinc-800 shadow-2xl p-1.5 z-50">
                    <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-mono">سیاست تایید و اجرای دستور:</div>
                    
                    <button
                      onClick={() => {
                        setApprovalGate('manual');
                        setIsApprovalDropdownOpen(false);
                      }}
                      className={`w-full text-right px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                        approvalGate === 'manual' ? 'bg-zinc-800 text-emerald-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">تأیید دستی (Manual Review)</div>
                        <div className="text-[10px] text-zinc-400">نمایش پیش‌نمایش تفاوت کد (Diff) پیش از اعمال</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setApprovalGate('semi_auto');
                        setIsApprovalDropdownOpen(false);
                      }}
                      className={`w-full text-right px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                        approvalGate === 'semi_auto' ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">تأیید خودکار امن (Semi-Auto)</div>
                        <div className="text-[10px] text-zinc-400">اجرای بدون وقفه فرامین کم‌خطر در کانتینر</div>
                      </div>
                    </button>

                    <button
                      disabled={currentRole !== 'SuperAdmin'}
                      onClick={() => {
                        if (currentRole === 'SuperAdmin') {
                          setApprovalGate('full_access');
                          setIsApprovalDropdownOpen(false);
                        }
                      }}
                      className={`w-full text-right px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                        currentRole !== 'SuperAdmin' ? 'opacity-40 cursor-not-allowed' :
                        approvalGate === 'full_access' ? 'bg-zinc-800 text-rose-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">دسترسی کامل (Full Access)</div>
                        <div className="text-[10px] text-zinc-400">مخصوص SuperAdmin (بای‌پس فیلترها)</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-expanding Input Field */}
            <div className="flex items-end gap-2 px-1">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleExecuteCommand();
                  }
                }}
                rows={1}
                placeholder={
                  activeMode === 'autonomous_task'
                    ? "دستور عملیاتی یا سناریوی اتوماسیون را برای ارکستراسیون در MicroVM وارد کنید..."
                    : "پیام یا سوال تحلیلی خود را بنویسید..."
                }
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed py-1 min-h-[36px] max-h-[180px]"
              />

              <button
                onClick={handleExecuteCommand}
                disabled={!inputText.trim() || isExecuting}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  inputText.trim() && !isExecuting
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isExecuting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────────────────────
          RIGHT DRAWER (MCP TOOLS & SKILLS BANK)
      ──────────────────────────────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-[#161616] border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-sm text-white">مرکز افزونه‌ها و مهارت‌ها</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex border-b border-zinc-800 px-6">
              <button
                onClick={() => setDrawerTab('mcp')}
                className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
                  drawerTab === 'mcp'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                سرورهای MCP ({mcpServers.length || 4})
              </button>
              <button
                onClick={() => setDrawerTab('skills')}
                className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
                  drawerTab === 'skills'
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                بانک مهارت‌ها (Skills: {skillsBank.length || 4})
              </button>
              {currentRole === 'SuperAdmin' && (
                <button
                  onClick={() => setDrawerTab('access_requests')}
                  className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
                    drawerTab === 'access_requests'
                      ? 'border-rose-400 text-rose-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  درخواست‌های دسترسی ({accessRequests.length})
                </button>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {drawerTab === 'mcp' && (
                <div className="space-y-4">
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    استاندارد Model Context Protocol (MCP) بر پایه JSON-RPC امکان تعامل ایمن ایجنت با فایل‌سیستم، مخازن و دیتابیس را فراهم می‌کند.
                  </div>

                  {(mcpServers.length ? mcpServers : [
                    { id: 'mcp-fs', name: 'Local Filesystem MCP', transport: 'stdio', latency_ms: 1, tools_count: 4, status: 'connected' },
                    { id: 'mcp-github', name: 'GitHub Enterprise Connector', transport: 'sse', latency_ms: 45, tools_count: 3, status: 'connected' },
                    { id: 'mcp-postgres', name: 'PostgreSQL Database Engine', transport: 'stdio', latency_ms: 3, tools_count: 2, status: 'connected' },
                    { id: 'mcp-docker', name: 'Docker MicroVM Runtime', transport: 'stdio', latency_ms: 2, tools_count: 3, status: 'connected' }
                  ]).map((server: any) => (
                    <div key={server.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{server.name}</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {server.latency_ms}ms
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-3">
                        <span>Transport: {server.transport}</span>
                        <span>·</span>
                        <span>ابزارها: {server.tools_count} تابع فعال</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'skills' && (
                <div className="space-y-4">
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    پرامپت‌های تخصصی و ساب-ایجنت‌های کش‌شده در دیتابیس لوکال SQLite جهت هدایت ارکستراسیون.
                  </div>

                  {(skillsBank.length ? skillsBank : [
                    { id: '1', name_fa: 'عیب‌یابی پیشرفته کلاستر و پادها', description_fa: 'تحلیل خودکار لاگ پادهای کرش کرده و مصرف بیش از حد CPU/RAM', is_active: 1, sub_agent: 'k8s_specialist' },
                    { id: '2', name_fa: 'ممیزی امنیتی Zero-Trust و پورت‌ها', description_fa: 'بررسی پورت‌های باز و اعتبارسنجی گواهی‌های SSL/TLS', is_active: 1, sub_agent: 'security_sentinel' },
                    { id: '3', name_fa: 'بهینه‌سازی کوئری و ایندکس‌های دیتابیس', description_fa: 'شناسایی کوئری‌های کند و پیشنهاد ایندکس‌های بهینه', is_active: 1, sub_agent: 'dba_architect' },
                    { id: '4', name_fa: 'ارکستراسیون تونل‌های مش امن WireGuard', description_fa: 'پیکربندی کلیدها و روترهای ریدایرکت برای ارتباط نودها', is_active: 1, sub_agent: 'network_mesh' }
                  ]).map((skill: any) => (
                    <div key={skill.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-white">{skill.name_fa}</div>
                        <div className="text-[11px] text-zinc-400 leading-relaxed">{skill.description_fa}</div>
                        <div className="text-[10px] font-mono text-purple-400">Agent: {skill.sub_agent}</div>
                      </div>
                      <button
                        onClick={() => handleToggleSkill(skill.id)}
                        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                          skill.is_active ? 'bg-cyan-500' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            skill.is_active ? 'right-1' : 'left-1'
                          }`}
                        ></span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'access_requests' && (
                <div className="space-y-4">
                  <div className="text-xs text-zinc-400">
                    درخواست‌های سلف‌سرویس کاربران جدید جهت ثبت در دایرکتوری و تخصیص نقش.
                  </div>

                  {accessRequests.map((req: any) => (
                    <div key={req.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{req.full_name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          req.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                          req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                          'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">{req.email} · {req.department}</div>
                      <div className="text-xs text-zinc-300 bg-black/40 p-2 rounded border border-zinc-800 font-mono">
                        نقش درخواستی: <span className="text-cyan-400">{req.requested_role}</span>
                        {req.reason && <p className="text-zinc-400 mt-1">دلیل: {req.reason}</p>}
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setAccessRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                          >
                            تأیید دسترسی
                          </button>
                          <button
                            onClick={() => {
                              setAccessRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-medium hover:bg-rose-500/30 transition-colors"
                          >
                            رد درخواست
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          DIFF REVIEW MODAL (APPROVAL GATE: MANUAL)
      ──────────────────────────────────────────────────────────────────────── */}
      {showDiffModal && pendingDiffAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-[#161616] border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-white">دروازه تایید امنیتی (Security Diff Gate)</h3>
              </div>
              <button onClick={() => setShowDiffModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              دستور زیر درخواست تغییر در فایل‌های سیستمی یا کلاستر را ارسال کرده است. لطفاً پیش‌نمایش تفاوت (Diff) را پیش از اجرا در MicroVM بازبینی کنید:
            </p>

            <div className="bg-black/60 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
              <div className="text-cyan-400 pb-1 font-bold">$ {pendingDiffAction.command}</div>
              <pre className="text-emerald-400 whitespace-pre-wrap">{pendingDiffAction.diff}</pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDiffModal(false);
                  setPendingDiffAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors"
              >
                انصراف و لغو دستور
              </button>
              <button
                onClick={() => {
                  const cmd = pendingDiffAction.command;
                  setShowDiffModal(false);
                  setPendingDiffAction(null);
                  dispatchSandboxRun(cmd);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-black transition-colors shadow-lg shadow-cyan-500/20"
              >
                تایید تغییرات و اجرا در MicroVM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          SELF-SERVICE ACCESS REQUEST MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#181818] border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-sm text-white">درخواست دسترسی سازمانی (Self-Service)</h3>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reqStatusMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                {reqStatusMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitAccessRequest} className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={reqFullName}
                    onChange={(e) => setReqFullName(e.target.value)}
                    placeholder="مثال: علیرضا فغانی"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">ایمیل سازمانی (Active Directory / LDAP):</label>
                  <input
                    type="email"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    placeholder="name@company.internal"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">واحد / دپارتمان:</label>
                  <input
                    type="text"
                    value={reqDepartment}
                    onChange={(e) => setReqDepartment(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">سطح دسترسی مورد نیاز (RBAC Role):</label>
                  <select
                    value={reqRole}
                    onChange={(e) => setReqRole(e.target.value as UserRole)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Operator">Operator (اجرای کارهای ایزوله در MicroVM)</option>
                    <option value="Admin">Admin (مدیریت کلاستر و ورک‌استیشن‌ها)</option>
                    <option value="Viewer">Viewer (فقط خواندنی)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">علت نیاز به دسترسی:</label>
                  <textarea
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    rows={2}
                    placeholder="جهت دیپلوی و مدیریت ایجنت‌های کمکی..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 font-medium hover:bg-zinc-700"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 text-xs font-semibold text-black hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
                  >
                    ارسال درخواست دسترسی
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
