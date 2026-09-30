import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatSession, 
  ChatMessage, 
  AiModel, 
  SkillItem, 
  User, 
  ChatAttachment,
  GeneratedMediaItem,
  CustomQuickCommand,
  ToolExecutionAction,
  ProjectRuleItem,
  McpServerConfig,
  RuleViolation
} from '../types';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Paperclip, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Sparkles, 
  Plus, 
  MessageSquare, 
  Check, 
  Menu, 
  ChevronDown, 
  Download, 
  AlertCircle, 
  Copy, 
  Layers, 
  X,
  Play,
  Maximize2,
  Share2,
  Workflow,
  Terminal,
  ShieldAlert,
  Zap,
  RotateCcw,
  Lock,
  ShieldCheck,
  Trash2,
  HelpCircle,
  Sliders,
  Settings,
  Laptop,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  PinOff,
  Pencil,
  Edit3,
  Shuffle,
  Brain,
  Cpu,
  HardDrive,
  GitBranch,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Activity,
  MoreHorizontal,
  SlidersHorizontal,
  CornerDownLeft,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  RefreshCw,
  Search,
  Globe,
  Network,
  Server,
  Clock,
  Folder,
  FolderGit2,
  Radio,
  Eye,
  Compass,
  ExternalLink,
  CheckCircle,
  Database,
  UploadCloud,
  Coins,
  BarChart3,
  Cloud,
  GitPullRequest,
  Split,
  Columns
} from 'lucide-react';
import { ModelRankingSelectorModal } from './ModelRankingSelectorModal';
import { MultiAgentTopologyDashboard } from './MultiAgentTopologyDashboard';

interface ChatModuleProps {
  currentUser: User;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onTogglePinSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  availableModels: AiModel[];
  availableSkills: SkillItem[];
  activeSkillIds: string[];
  onToggleSkill: (skillId: string) => void;
  onSendMessage: (
    sessionId: string, 
    text: string, 
    modelId: string, 
    skills: string[], 
    attachments: ChatAttachment[],
    mediaRequest?: 'image' | 'video' | 'diagram' | 'document_rag',
    toolCommandInfo?: { toolId: string; toolName: string; command: string },
    omniRouteMeta?: {
      useOmniRoute: boolean;
      providerId: string;
      providerName: string;
      hopFlow: string;
      latencyMs?: number;
      failoverOccurred?: boolean;
      previousProvider?: string;
      routingReason?: string;
    },
    isCommandMode?: boolean
  ) => Promise<void>;
  prefilledPrompt?: { text: string; skillId: string } | null;
  onClearPrefilledPrompt?: () => void;
  isDocumentEngineActive?: boolean;
  onNavigateToServerInfra?: () => void;
  projectRules?: ProjectRuleItem[];
  mcpServers?: McpServerConfig[];
  onOpenMcpRulesModal?: (tab?: 'rules' | 'skills' | 'mcp_hub' | 'simulation') => void;
  onApproveProposal?: (sessionId: string, messageId: string, mode: 'full' | 'step') => void;
  onExecuteProposalStep?: (sessionId: string, messageId: string, stepNumber: number) => void;
  onRejectProposal?: (sessionId: string, messageId: string) => void;
}

export const ChatModule: React.FC<ChatModuleProps> = ({
  currentUser,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onTogglePinSession,
  onDeleteSession,
  availableModels,
  availableSkills,
  activeSkillIds,
  onToggleSkill,
  onSendMessage,
  prefilledPrompt,
  onClearPrefilledPrompt,
  isDocumentEngineActive = true,
  onNavigateToServerInfra,
  projectRules,
  mcpServers,
  onOpenMcpRulesModal,
  onApproveProposal,
  onExecuteProposalStep,
  onRejectProposal
}) => {
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const [inputText, setInputText] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    currentSession?.selected_model || availableModels[0]?.model_id || 'gemini-2.5-flash'
  );
  const [isSending, setIsSending] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Collapsible desktop chat sidebar (Gemini-style)
  const [failoverBanner, setFailoverBanner] = useState<string | null>(null);

  // Session rename and inline editing state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');

  // Clean 2-Option Model Selection State: 'omniroute' (Default Smart) | 'manual' (Single Clean Dropdown)
  const [modelSelectionMode, setModelSelectionMode] = useState<'omniroute' | 'manual'>('omniroute');
  const [showOmniRouteModal, setShowOmniRouteModal] = useState<boolean>(false);
  const [isFindingBestProvider, setIsFindingBestProvider] = useState<boolean>(false);

  // Calculate user tools permissions (Tools RBAC)
  const userAllowedTools = React.useMemo(() => {
    if (currentUser?.allowed_tools !== undefined) {
      return currentUser.allowed_tools;
    }
    if (currentUser?.role === 'SuperAdmin') {
      return ['t-chrome', 't-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm', 't-hid', 't-screen', 't-terminal'];
    }
    if (currentUser?.role === 'Admin') {
      return ['t-chrome', 't-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm'];
    }
    return [];
  }, [currentUser]);

  const hasCommandAccess = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin' || userAllowedTools.length > 0;

  // Dedicated View Modes:
  // Option 1: 'chat' (محیط چت استاندارد و خلوت هوش مصنوعی)
  // Option 2: 'command_execution' (کنسول اختصاصی اجرای فرامین و ابزارها)
  const [activeChatView, setActiveChatView] = useState<'chat' | 'command_execution'>('chat');
  const [isCommandSidePanelOpen, setIsCommandSidePanelOpen] = useState<boolean>(false);
  const [consoleSubTab, setConsoleSubTab] = useState<'tools_terminal' | 'agent_orchestrator'>('tools_terminal');
  const [selectedToolId, setSelectedToolId] = useState<string>('t-winrm');
  const [commandInputText, setCommandInputText] = useState<string>('');
  const [commandCategoryFilter, setCommandCategoryFilter] = useState<'all' | 'windows' | 'network' | 'linux' | 'browser' | 'security'>('all');
  const [isExecutingCommand, setIsExecutingCommand] = useState<boolean>(false);
  const [activeCommandOutput, setActiveCommandOutput] = useState<string | null>(null);
  const [activeCommandStatus, setActiveCommandStatus] = useState<'idle' | 'success' | 'denied'>('idle');
  const [copiedConsoleOutput, setCopiedConsoleOutput] = useState<boolean>(false);
  const [commandExecutionHistory, setCommandExecutionHistory] = useState<Array<{
    id: string;
    toolId: string;
    toolName: string;
    command: string;
    status: 'success' | 'denied';
    output: string;
    timestamp: string;
    executionArm: string;
    structuredTag?: string;
  }>>([]);

  // Level 3 Autonomous Agent Controls (ایجنت اجرایی و عملیاتی سطح ۳)
  // 1. Complexity & Resource: 'fast' (عملکرد سریع و بهینه) | 'deep' (تحلیل عمیق و معماری پیچیده)
  const [agentComplexityMode, setAgentComplexityMode] = useState<'fast' | 'deep'>('fast');
  // 2. Approval Protocol: 'approval' (تأیید گام‌به‌گام) | 'autopilot' (اجرای خودکار / Auto-Pilot)
  const [agentApprovalMode, setAgentApprovalMode] = useState<'approval' | 'autopilot'>('approval');
  // 3. Dynamic Skills Assessment & Self-Reflection state
  const [isSelfReflecting, setIsSelfReflecting] = useState<boolean>(false);
  const [copiedWorkspacePath, setCopiedWorkspacePath] = useState<boolean>(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);

  // 4. Jev Smart Gateway (گیت‌وی هوشمند تریاژ پرامپت و بهینه‌سازی تا ۹۰٪ هزینه‌ها)
  const [gatewayRoutingStrategy, setGatewayRoutingStrategy] = useState<'auto' | 'force_fast' | 'force_deep'>('auto');
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(false);
  const [gatewayStats, setGatewayStats] = useState({
    totalQueries: 148,
    simpleJevQueries: 129,
    complexDeepQueries: 19,
    costSavingsPercent: 91.4,
    tokensSaved: 642000
  });

  // 5. Multi-Core Workspace Topology (معماری فضاهای کاری چندگانه: هسته محلی یا ابری)
  const [workspaceCoreTarget, setWorkspaceCoreTarget] = useState<'local' | 'cloud'>('local');

  // ساختار نام و پوشه بر اساس هر چت، تاریخ ایجاد چت، کد چت، عنوان چت و Core انتخابی
  const currentChatNumber = React.useMemo(() => {
    const idx = sessions.findIndex(s => s.id === currentSessionId);
    return idx >= 0 ? idx + 1 : 1;
  }, [sessions, currentSessionId]);

  const isolatedWorkspacePath = React.useMemo(() => {
    const rawDate = currentSession?.created_at ? new Date(currentSession.created_at) : new Date();
    const dateFormatted = !isNaN(rawDate.getTime())
      ? rawDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    
    const sessId = (currentSession?.id || `chat-${currentChatNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const rawTitle = currentSession?.title || `چت ${currentChatNumber}`;
    const cleanTitle = rawTitle.replace(/[\/\\:*?"<>|]/g, '_').trim().slice(0, 24);
    const userPart = currentUser?.username || 'user';

    if (workspaceCoreTarget === 'cloud') {
      return `GDRIVE://OmniOps/Workspaces/${dateFormatted}_CHAT${currentChatNumber}_${sessId}_[${cleanTitle}]/CloudCore/[${userPart}]/`;
    }
    return `C:\\OmniOps\\Workspaces\\${dateFormatted}_CHAT${currentChatNumber}_${sessId}_[${cleanTitle}]\\LocalCore\\[${userPart}]\\`;
  }, [currentSession, currentChatNumber, currentUser, workspaceCoreTarget]);

  // 6. Multi-Agent Topology Nodes (شبکه گره‌های چندعاملی و مدل‌های تخصصی زیرمجموعه)
  const [showTopologyModal, setShowTopologyModal] = useState<boolean>(false);
  const [showModelRankingModal, setShowModelRankingModal] = useState<boolean>(false);
  const [isCommandDrawerOpen, setIsCommandDrawerOpen] = useState<boolean>(false);
  const [agentTopologyNodes, setAgentTopologyNodes] = useState([
    {
      id: 'node-core',
      name: 'هسته مرکزی ارکستراسیون (Central Node)',
      category: 'orchestrator',
      status: 'active',
      latencyMs: 14,
      modelAssigned: 'Level 3 Orchestrator',
      capabilities: ['توزیع تسک‌ها', 'تریاژ پیچیدگی', 'مدیریت پروتکل تأییدیه', 'همگام‌سازی Cores']
    },
    {
      id: 'node-ember',
      name: 'گره تخصصی داخلی Ember-1 (Vision & Tools)',
      category: 'internal_model',
      status: 'active',
      latencyMs: 19,
      modelAssigned: 'Ember-1 Agentic Micro-Engine',
      capabilities: ['Tool-Calling فوق سریع', 'کدنویسی سبک', 'بینایی ماشین (Vision)', 'تولید YAML و Workflow']
    },
    {
      id: 'node-eng',
      name: 'گره مهندسی نرم‌افزار و معماری (Engineering Node)',
      category: 'engineering',
      status: 'active',
      latencyMs: 38,
      modelAssigned: 'Claude 3.7 Sonnet / Gemini Pro',
      capabilities: ['تحلیل معماری چندمرحله‌ای', 'شکستن مسائل به Sub-tasks', 'ریفرکتور عمیق کد']
    },
    {
      id: 'node-net',
      name: 'گره نظارت بر شبکه و فایروال (Network Node)',
      category: 'network',
      status: 'active',
      latencyMs: 25,
      modelAssigned: 'DeepSeek / RouterOS API Engine',
      capabilities: ['ممیزی پورت‌ها', 'جداول روت میکروتیک', 'فایروال استیت‌فول']
    },
    {
      id: 'node-github',
      name: 'گره مدیریت سورس‌کد و گیت‌هاب (GitHub & CI/CD Node)',
      category: 'github_cicd',
      status: 'active',
      latencyMs: 45,
      modelAssigned: 'GitHub Automation Protocol',
      capabilities: ['ایجاد Repository', 'اتوماسیون git init/add/commit/push', 'پایپ‌لاین CI/CD اکشنز']
    },
    {
      id: 'node-cloud',
      name: 'گره فضای ابری (Google Drive Cloud Core)',
      category: 'cloud_core',
      status: 'active',
      latencyMs: 32,
      modelAssigned: 'Google Drive OAuth Engine',
      capabilities: ['همگام‌سازی پوشه‌های ابری', 'پشتیبان‌گیری امن', 'احراز هویت رمزنگاری‌شده OAuth 2.0']
    },
    {
      id: 'node-win',
      name: 'بازوی ویندوزی سیستم‌عامل (Windows Agent)',
      category: 'windows_agent',
      status: 'active',
      latencyMs: 12,
      modelAssigned: 'OmniOps Installed Agent :8443',
      capabilities: ['اجرای اسکریپت در ساندباکس', 'پاورشل و CMD', 'پایش منابع سیستم']
    },
    {
      id: 'node-web',
      name: 'بازوی افزونه مرورگر (Web Extension Arm)',
      category: 'web_ext',
      status: 'active',
      latencyMs: 22,
      modelAssigned: 'Chrome Extension Bridge v2.4.1',
      capabilities: ['اسکرپ مستندات وب', 'خودآموزی (Self-Reflection)', 'تراورس ساختار صفحات']
    }
  ]);

  // الگوهای حافظه سرور برای بازتولید خودکار در صورت نبود فایل در پوشه چت (Server Architecture Memory Templates)
  const SERVER_MEMORY_TEMPLATES: Record<string, {
    name: string;
    relativePath: string;
    size: string;
    type: string;
    description: string;
    content: string;
  }> = {
    'firewall_rules.ps1': {
      name: 'firewall_rules.ps1',
      relativePath: 'scripts/firewall_rules.ps1',
      size: '3.1 KB',
      type: 'PowerShell Script',
      description: 'قوانین دیواره آتش استیت‌فول و بلاک اتصالات مشکوک به پورت‌های ریموت',
      content: `# [OMNIOPS SERVER ARCHITECTURE MEMORY - SYNCED TEMPLATE]
# File: firewall_rules.ps1
# Target: Windows Defender & MikroTik Gateway State Table
param(
  [string]$Action = "AuditAndBlock",
  [int[]]$ProtectedPorts = @(22, 8443, 8291, 3389)
)

Write-Host "[SERVER_MEMORY:FIREWALL] بارگذاری الگوهای استیت‌فول از حافظه سرور..." -ForegroundColor Yellow
foreach ($port in $ProtectedPorts) {
    Write-Host "Verifying rule for TCP port: $port -> RateLimit: 25 req/sec"
}
Write-Host "Firewall baseline successfully synced from Server Knowledge Base." -ForegroundColor Green
`
    },
    'network_audit.ps1': {
      name: 'network_audit.ps1',
      relativePath: 'scripts/network_audit.ps1',
      size: '2.4 KB',
      type: 'PowerShell Script',
      description: 'اسکریپت ممیزی ساب‌نت، کشف سوکت‌های باز و ارزیابی لتنسی',
      content: `# [OMNIOPS SERVER ARCHITECTURE MEMORY - SYNCED TEMPLATE]
# File: network_audit.ps1
param(
  [string]$TargetSubnet = "192.168.1.0/24",
  [int]$AuditPort = 8443
)

Write-Host "=== OmniOps Level 3 Agent: Isolated Network Audit ===" -ForegroundColor Cyan
Write-Host "Target Subnet: $TargetSubnet"
$listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq $AuditPort}
if ($listening) {
    Write-Host "Service listening on port $AuditPort. Healthy." -ForegroundColor Green
} else {
    Write-Host "Service on port $AuditPort idle or waiting." -ForegroundColor Yellow
}
`
    },
    'mikrotik_routes.rsc': {
      name: 'mikrotik_routes.rsc',
      relativePath: 'configs/mikrotik_routes.rsc',
      size: '1.8 KB',
      type: 'RouterOS Script',
      description: 'پیکربندی جداول مسیریابی، چک‌گیت‌وی پینگ و مانیتورینگ اینترفیس‌ها',
      content: `# [OMNIOPS SERVER ARCHITECTURE MEMORY - SYNCED TEMPLATE]
# File: mikrotik_routes.rsc
/ip route
add distance=1 gateway=192.168.1.1 check-gateway=ping comment="Primary ISP Default Route"
add distance=2 gateway=10.0.0.1 comment="Backup VPN Route"
/ip firewall filter
add chain=input protocol=tcp dst-port=8291 action=accept comment="Winbox Managed Access"
`
    },
    'server_env_spec.yaml': {
      name: 'server_env_spec.yaml',
      relativePath: 'specs/server_env_spec.yaml',
      size: '1.2 KB',
      type: 'YAML Specification',
      description: 'مشخصات محیط سرور، تنظیمات کلاستر، مانیتورینگ سلامت و کش ریدیس',
      content: `# [OMNIOPS SERVER ARCHITECTURE MEMORY - SYNCED TEMPLATE]
version: "3.8"
environment: production
cluster:
  node_name: "win11-ops-core"
  heartbeat_interval: 1000ms
  isolation_level: "sandbox-strict"
  monitoring:
    prometheus_port: 9090
    health_probe_enabled: true
`
    }
  };

  // Virtual files created inside the isolated workspace sandbox
  const [virtualWorkspaceFiles, setVirtualWorkspaceFiles] = useState<Array<{
    name: string;
    relativePath: string;
    size: string;
    type: string;
    modified: string;
    content: string;
  }>>([
    {
      name: 'network_audit.ps1',
      relativePath: 'scripts/network_audit.ps1',
      size: '2.4 KB',
      type: 'PowerShell Script',
      modified: 'امروز ۱۲:۱۰',
      content: `# [WIN_AGENT:POWERSHELL:scripts/network_audit.ps1]
# ایزوله‌شده در مسیر اختصاصی:
# C:\\OmniOps\\Workspaces\\USR_...
param(
  [string]$TargetSubnet = "192.168.1.0/24",
  [int]$AuditPort = 8443
)

Write-Host "=== OmniOps Level 3 Agent: Isolated Network Audit ===" -ForegroundColor Cyan
Write-Host "Target Subnet: $TargetSubnet"
$listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq $AuditPort}
if ($listening) {
  Write-Host "[OK] Port $AuditPort is active and sandboxed." -ForegroundColor Green
} else {
  Write-Host "[WARN] Port $AuditPort is not currently listening." -ForegroundColor Yellow
}
`
    },
    {
      name: 'scraped_docs.json',
      relativePath: 'artifacts/scraped_docs.json',
      size: '5.1 KB',
      type: 'JSON Document',
      modified: 'امروز ۱۲:۱۲',
      content: `{
  "agent_arm": "WEB_EXT",
  "action": "SCRAPE_DOCS",
  "source_url": "https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter",
  "extracted_parameters": {
    "protocol": "tcp",
    "fasttrack_enabled": true,
    "firewall_rules_count": 14,
    "established_related_state": "accept"
  },
  "self_reflection_status": "Knowledge acquired and cached in workspace"
}`
    },
    {
      name: 'agent_telemetry.log',
      relativePath: 'logs/agent_telemetry.log',
      size: '1.8 KB',
      type: 'Log File',
      modified: 'امروز ۱۲:۱۴',
      content: `[INIT] Level 3 Autonomous Agent Initialized.
[WORKSPACE] Isolated directory mounted.
[WIN_AGENT] Handshake verified on 127.0.0.1:8443 (Heartbeat: 12ms)
[WEB_EXT] Chrome Extension bridge v2.4.1 connected.
[SECURITY] RBAC enforced.`
    }
  ]);

  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    name: string;
    relativePath: string;
    content: string;
    size: string;
  } | null>(null);

  // Level 3 Task Plan & Execution State
  interface Level3TagItem {
    id: string;
    arm: 'WIN_AGENT' | 'WEB_EXT' | 'INTERNAL_NODE';
    action: string;
    cmd: string;
    tagString: string;
    status: 'pending' | 'executing' | 'completed' | 'denied';
    output?: string;
    explanation: string;
  }

  interface Level3Plan {
    id: string;
    prompt: string;
    projectStatus: string;
    currentPhase: string;
    nextAction: string;
    complexityMode: 'fast' | 'deep';
    approvalMode: 'approval' | 'autopilot';
    tags: Level3TagItem[];
    activeTagIndex: number;
    telemetryLogs: string[];
    isSelfReflecting?: boolean;
    selfReflectedDoc?: {
      toolName: string;
      docUrl: string;
      summary: string;
    };
  }

  // User's Local Windows Agent Connection State (detects whether active user has agent installed on their PC)
  const [isAgentLocallyConnected, setIsAgentLocallyConnected] = useState<boolean>(
    currentUser?.agent_connected !== undefined ? currentUser.agent_connected : true
  );

  useEffect(() => {
    if (currentUser?.agent_connected !== undefined) {
      setIsAgentLocallyConnected(currentUser.agent_connected);
    }
  }, [currentUser?.agent_connected]);

  const userPairingToken = React.useMemo(() => {
    const u = (currentUser?.username || 'user').toUpperCase();
    const id = currentUser?.id ? String(currentUser.id) : '01';
    return `OMNI-AGT-${u}-${id}94-SECURE`;
  }, [currentUser]);

  // Conversational Agent Chatbot Messages (Level 3 Agent Conversation Stream)
  interface AgentChatMessage {
    id: string;
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: string;
    plan?: Level3Plan;
    statusBadge?: string;
    gatewayInfo?: {
      triageModel: string;
      complexity: 'simple' | 'complex';
      complexityScore: number;
      selectedEngine: string;
      costSavingsPercent: number;
      latencyMs: number;
    };
    fileCheck?: {
      targetFileName: string;
      exists: boolean;
      workspacePath: string;
      topic: string;
      serverMemoryTemplateAvailable: boolean;
    };
  }

  const [agentChatMessages, setAgentChatMessages] = useState<AgentChatMessage[]>([
    {
      id: 'agent-msg-1',
      role: 'agent',
      content: `سلام @${currentUser?.username || 'کاربر'}! من «ایجنت اجرایی و عملیاتی سطح ۳» (Level 3 Autonomous Agent) شما هستم.\n\nمکالمه ما در بستر وب انجام می‌شود، اما فرامین سیستمی، کدهای تولیدی و تغییرات فایل‌ها منحصراً توسط **ایجنت ویندوزی نصب‌شده روی کامپیوتر شما** رهگیری و در پوشه ایزوله سیستم اجرا می‌گردند.\n\nچه فرمانی را می‌خواهید برای سیستم‌عامل، فایل‌ها و زیرساخت شما تحلیل و اجرا کنم؟`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      statusBadge: 'ایجنت آنلاین و آماده'
    }
  ]);

  const [agentChatInput, setAgentChatInput] = useState<string>('');
  const [isAgentChatGenerating, setIsAgentChatGenerating] = useState<boolean>(false);
  const [copiedPairingToken, setCopiedPairingToken] = useState<boolean>(false);
  const [copiedInstallCmd, setCopiedInstallCmd] = useState<boolean>(false);

  const [level3TaskPrompt, setLevel3TaskPrompt] = useState<string>('');
  const [activeLevel3Plan, setActiveLevel3Plan] = useState<Level3Plan | null>(null);
  const [isLevel3Processing, setIsLevel3Processing] = useState<boolean>(false);
  const [isEditingTagCmd, setIsEditingTagCmd] = useState<boolean>(false);
  const [editedTagCmdText, setEditedTagCmdText] = useState<string>('');

  // Structured Execution Tag Formatter ([WIN_AGENT:ACTION:cmd] / [WEB_EXT:ACTION:cmd])
  const getStructuredExecutionTag = (toolId: string, cmd: string) => {
    if (toolId === 't-chrome') {
      return `[WEB_EXT:SCRAPE:${cmd}]`;
    } else if (toolId === 't-winrm') {
      return `[WIN_AGENT:POWERSHELL:${cmd}]`;
    } else if (toolId === 't-terminal') {
      return `[WIN_AGENT:BASH:${cmd}]`;
    } else if (toolId === 't-putty') {
      return `[WIN_AGENT:SSH:${cmd}]`;
    } else if (toolId === 't-winbox') {
      return `[WIN_AGENT:ROUTER_API:${cmd}]`;
    }
    return `[WIN_AGENT:SYS_EXEC:${cmd}]`;
  };

  useEffect(() => {
    if (!hasCommandAccess && activeChatView === 'command_execution') {
      setActiveChatView('chat');
    }
  }, [hasCommandAccess, activeChatView]);

  // OmniRoute Provider Pool State & Interface
  interface OmniRouteProvider {
    id: string;
    name: string;
    modelId: string;
    status: 'available' | 'rate_limited' | 'offline';
    latencyMs: number;
    priority: number;
    desc: string;
  }

  const [omniRoutePool, setOmniRoutePool] = useState<OmniRouteProvider[]>([
    { id: 'claude-code', name: 'Claude Code / Anthropic (Claude 3.7)', modelId: 'claude-3.7-sonnet', status: 'available', latencyMs: 38, priority: 1, desc: 'استدلال عمیق و مهندسی سیستم' },
    { id: 'gemini', name: 'Google Gemini (Gemini 2.5 Flash / Pro)', modelId: 'gemini-2.5-flash', status: 'available', latencyMs: 34, priority: 2, desc: 'کانتکست میلیونی، چندرسانه‌ای و RAG' },
    { id: 'ember-1', name: 'Ember-1 (Agentic Vision & Tool-Calling Local Core)', modelId: 'ember-1-vision', status: 'available', latencyMs: 19, priority: 3, desc: 'مدل تخصصی داخلی برای Tool-Calling، کدنویسی سبک و بینایی ماشین' },
    { id: 'openai', name: 'OpenAI (GPT-4o)', modelId: 'gpt-4o', status: 'available', latencyMs: 42, priority: 4, desc: 'هوش چندمنظوره سریع' },
    { id: 'deepseek', name: 'DeepSeek Reasoning (V3 / R1)', modelId: 'deepseek-chat', status: 'available', latencyMs: 55, priority: 5, desc: 'اسکریپت‌نویسی لینوکس و شبکه' },
    { id: 'groq', name: 'Groq LPU (Ultra-Fast 25ms)', modelId: 'groq-llama-3.3', status: 'available', latencyMs: 25, priority: 6, desc: 'سرعت استثنایی و کمترین تاخیر' },
    { id: 'ollama', name: 'Ollama Local Edge (Dorna 2 & Llama 3)', modelId: 'dorna-2-8b', status: 'available', latencyMs: 18, priority: 7, desc: 'استنتاج آفلاین محلی و مدل‌های بومی' },
    { id: 'openrouter', name: 'OpenRouter Unified Gateway', modelId: 'openrouter-auto', status: 'available', latencyMs: 60, priority: 8, desc: 'درگاه یکپارچه با هزاران مدل' }
  ]);

  // Dynamic Model Ranking Criteria (رتبه‌بندی پویای مدل‌های فعال بر اساس APIها و نوع درخواست)
  const [modelRankingCriteria, setModelRankingCriteria] = useState<'smart' | 'architecture' | 'coding' | 'speed' | 'latency'>('smart');

  const rankedModels = React.useMemo(() => {
    return [...omniRoutePool]
      .filter(p => p.status !== 'offline')
      .sort((a, b) => {
        if (modelRankingCriteria === 'latency') return a.latencyMs - b.latencyMs;
        if (modelRankingCriteria === 'architecture') {
          const archScores: Record<string, number> = { 'claude-code': 1, 'gemini': 2, 'openai': 3, 'deepseek': 4, 'ember-1': 5, 'groq': 6, 'ollama': 7, 'openrouter': 8 };
          return (archScores[a.id] || 99) - (archScores[b.id] || 99);
        }
        if (modelRankingCriteria === 'coding') {
          const codeScores: Record<string, number> = { 'ember-1': 1, 'claude-code': 2, 'deepseek': 3, 'gemini': 4, 'openai': 5, 'groq': 6, 'ollama': 7, 'openrouter': 8 };
          return (codeScores[a.id] || 99) - (codeScores[b.id] || 99);
        }
        if (modelRankingCriteria === 'speed') return a.latencyMs - b.latencyMs;
        const aStatusWeight = a.status === 'available' ? 0 : 100;
        const bStatusWeight = b.status === 'available' ? 0 : 100;
        return (aStatusWeight + a.priority) - (bStatusWeight + b.priority);
      });
  }, [omniRoutePool, modelRankingCriteria]);

  // Model Continuity Toast & Admin Core Memory Modal state
  const [continuityToast, setContinuityToast] = useState<string | null>(null);
  const [showCoreMemoryModal, setShowCoreMemoryModal] = useState<boolean>(false);

  // Read Core Memory rules from localStorage
  const activeCoreMemories = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('omniops_admin_core_memory');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [
      { id: '1', title: 'فال‌بک پایدار به Ollama Local', key: 'ai_failover_cascade', content: 'پایداری ۱۰۰٪ با سوییچ در کمتر از ۵۰ms به اولاما در صورت قطعی اینترنت' },
      { id: '2', title: 'توپولوژی VLAN و میکروتیک', key: 'mikrotik_core_routing', content: 'ایزولاسیون VLAN 10 سرورها و باز بودن پورت‌های 9000 و 11434' },
      { id: '3', title: 'صفر توکن AnythingLLM', key: 'anythingllm_zero_token', content: 'تحلیل ۱۰۰٪ آفلاین نامه‌های اداری و اسناد بدون خروج داده' }
    ];
  }, [showCoreMemoryModal]);

  // Sorted sessions: pinned items first
  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [sessions]);

  // File and Image Attachments State
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; title: string; type: 'image' | 'video' } | null>(null);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingSessionTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingSessionTitle.trim() && onRenameSession) {
      onRenameSession(sessionId, editingSessionTitle.trim());
    }
    setEditingSessionId(null);
  };

  // Gemini-style Plus (+) Popover menu state
  const [showGeminiPlusMenu, setShowGeminiPlusMenu] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [serviceInactiveToast, setServiceInactiveToast] = useState<string | null>(null);

  // Auto-dismiss banners
  useEffect(() => {
    if (failoverBanner) {
      const timer = setTimeout(() => setFailoverBanner(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [failoverBanner]);

  useEffect(() => {
    if (continuityToast) {
      const timer = setTimeout(() => setContinuityToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [continuityToast]);

  // Multimedia Generation & Local RAG Mode (Image / Video / Document AnythingLLM)
  const [activeMediaIntent, setActiveMediaIntent] = useState<'image' | 'video' | 'document_rag' | null>(null);
  const [copiedLetterId, setCopiedLetterId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedChatToast, setCopiedChatToast] = useState<boolean>(false);

  // Modern conversational UX: Message feedback (thumbs up/down) and text-to-speech simulation
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msgId);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
        utterance.lang = 'fa-IR';
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setSpeakingMessageId(null), 3000);
      }
    }
  };

  // Copied output indicator for terminal smart cards
  const [copiedOutputId, setCopiedOutputId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeModelObj = availableModels.find((m) => m.model_id === selectedModelId);
  const supportsImage = activeModelObj?.supports_image_generation ?? true;
  const supportsVideo = activeModelObj?.supports_video_generation ?? true;
  const supportsMultimedia = supportsImage || supportsVideo;

  // Handle prefilled prompt from skills module
  useEffect(() => {
    if (prefilledPrompt) {
      setInputText(prefilledPrompt.text);
      if (!activeSkillIds.includes(prefilledPrompt.skillId)) {
        onToggleSkill(prefilledPrompt.skillId);
      }
      onClearPrefilledPrompt?.();
      textareaRef.current?.focus();
    }
  }, [prefilledPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, attachments]);

  // Click outside listener for Gemini-style Plus Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowGeminiPlusMenu(false);
      }
    };
    if (showGeminiPlusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGeminiPlusMenu]);

  // Toast auto-clear
  useEffect(() => {
    if (serviceInactiveToast) {
      const timer = setTimeout(() => setServiceInactiveToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [serviceInactiveToast]);

  useEffect(() => {
    if (currentSession?.selected_model) {
      setSelectedModelId(currentSession.selected_model);
    }
  }, [currentSessionId]);

  // Process file upload / clipboard paste
  const handleProcessFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isDoc = file.name.match(/\.(pdf|docx?|xlsx?|csv|txt|doc|rtf)$/i) || !isImage;
    const documentCategory = ext === 'pdf' ? 'pdf' : (ext === 'xlsx' || ext === 'xls' || ext === 'csv') ? 'excel' : (ext === 'docx' || ext === 'doc') ? 'word' : isImage ? 'scanned' : 'text';

    const reader = new FileReader();

    if (isImage) {
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name || `image_${new Date().getTime()}.png`,
          type: 'image',
          mimeType: file.type,
          size: file.size,
          previewUrl,
          documentCategory: 'scanned'
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: 'file',
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          content: textContent,
          documentCategory: documentCategory as any
        };
        setAttachments((prev) => [...prev, newAttachment]);
        // Auto-switch to Local AnythingLLM RAG Mode to save tokens and guarantee privacy
        setActiveMediaIntent('document_rag');
        if (!inputText) {
          setInputText('تحلیل جامع سند پیوستی، استخراج نکات کلیدی و نگارش پیش‌نویس پاسخ رسمی با AnythingLLM');
        }
      };
      reader.readAsText(file);
    }
  };

  // Clipboard Paste Handler (Ctrl+V with image or file)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          handleProcessFile(file);
          if (file.type.startsWith('image/')) {
            e.preventDefault();
          }
        }
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if left currentTarget
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => handleProcessFile(file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => handleProcessFile(file));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isSending) return;

    const textToSend = inputText;
    const attachmentsToSend = [...attachments];
    const hasDoc = attachmentsToSend.some((a) => a.type === 'file' || a.name?.match(/\.(pdf|docx?|xlsx?|csv|txt|doc|rtf)$/i));
    const effectiveMediaIntent = (activeMediaIntent === 'document_rag' || hasDoc) ? 'document_rag' : activeMediaIntent;

    setInputText('');
    setAttachments([]);
    setActiveMediaIntent(null);
    setIsSending(true);
    setFailoverBanner(null);

    let activeModelToUse = selectedModelId;
    let omniRouteMeta: any = undefined;

    if (modelSelectionMode === 'omniroute') {
      setIsFindingBestProvider(true);
      // OmniRoute simulates finding best available provider with zero latency overhead
      await new Promise((r) => setTimeout(r, 450));

      const readyProviders = omniRoutePool.filter((p) => p.status === 'available');
      const chosen = readyProviders[0] || omniRoutePool[0];

      activeModelToUse = chosen.modelId;
      omniRouteMeta = {
        useOmniRoute: true,
        providerId: chosen.id,
        providerName: chosen.name,
        hopFlow: `Claude Code → OmniRoute → ${chosen.name}`,
        latencyMs: chosen.latencyMs,
        failoverOccurred: false,
        routingReason: 'کنترل‌کننده ترافیک هوشمند: بررسی دسترس‌پذیری و هدایت به سریع‌ترین گزینه'
      };
      setIsFindingBestProvider(false);
    }

    const isToolExecution = false;

    try {
      await onSendMessage(
        currentSession.id, 
        textToSend, 
        activeModelToUse, 
        activeSkillIds, 
        attachmentsToSend,
        effectiveMediaIntent || undefined,
        undefined,
        omniRouteMeta,
        isToolExecution
      );
    } catch (err: any) {
      // In case of rate limit or error, OmniRoute performs automatic failover!
      if (modelSelectionMode === 'omniroute') {
        const currentId = omniRouteMeta?.providerId || 'claude-code';
        // Mark current as rate_limited and switch to next
        setOmniRoutePool((prev) => prev.map((p) => p.id === currentId ? { ...p, status: 'rate_limited' as const } : p));
        const nextProvider = omniRoutePool.find((p) => p.id !== currentId && p.status !== 'rate_limited') || omniRoutePool[omniRoutePool.length - 1];

        const failoverNotice = `سوییچ خودکار OmniRoute: ارائه‌دهنده «${omniRouteMeta?.providerName || 'قبلی'}» محدود گردید (کنار گذاشته شد) ➔ درخواست بدون توقف نشست به «${nextProvider.name}» منتقل گردید. (توقف کمتر، زمان بیشتر)`;
        setFailoverBanner(failoverNotice);

        const failoverMeta = {
          useOmniRoute: true,
          providerId: nextProvider.id,
          providerName: nextProvider.name,
          hopFlow: `Claude Code → OmniRoute → ${nextProvider.name}`,
          latencyMs: nextProvider.latencyMs,
          failoverOccurred: true,
          previousProvider: omniRouteMeta?.providerName || 'ارائه‌دهنده قبلی',
          routingReason: 'انتقال مسیر به گزینه در دسترس بعدی جهت تداوم فعالیت'
        };

        await onSendMessage(
          currentSession.id, 
          textToSend, 
          nextProvider.modelId, 
          activeSkillIds, 
          attachmentsToSend,
          effectiveMediaIntent || undefined,
          undefined,
          failoverMeta,
          isToolExecution
        );
      } else {
        const isTokenIssue = err.message?.includes('token') || err.message?.includes('429') || err.message?.includes('quota');
        if (isTokenIssue) {
          const fallback = availableModels.find((m) => m.model_id !== selectedModelId && m.status === 'online');
          if (fallback) {
            setFailoverBanner(
              `سهمیه مدل قبلی پایان یافت. سیستم به مدل پایدار «${fallback.display_name}» سوییچ کرد.`
            );
            setSelectedModelId(fallback.model_id);
            await onSendMessage(
              currentSession.id, 
              textToSend, 
              fallback.model_id, 
              activeSkillIds, 
              attachmentsToSend,
              effectiveMediaIntent || undefined,
              undefined,
              undefined,
              isToolExecution
            );
          }
        }
      }
    } finally {
      setIsSending(false);
      setIsFindingBestProvider(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutputId(id);
    setTimeout(() => setCopiedOutputId(null), 2000);
  };

  const handleSendToolCommand = async (toolId: string, toolName: string, command: string) => {
    // Strict RBAC Enforcement: user must have tool permission
    if (!hasCommandAccess || !userAllowedTools.includes(toolId)) {
      setContinuityToast(`⛔ دسترسی غیرمجاز: حساب کاربری شما مجوز فراخوانی ابزار «${toolName}» را ندارد.`);
      setTimeout(() => setContinuityToast(null), 4000);
      return;
    }

    setIsSending(true);
    setFailoverBanner(null);
    try {
      await onSendMessage(
        currentSession.id,
        `دستور "${command}" را با ابزار ${toolName} اجرا کن`,
        selectedModelId,
        activeSkillIds,
        [],
        undefined,
        { toolId, toolName, command },
        modelSelectionMode === 'omniroute' ? {
          useOmniRoute: true,
          providerId: 'claude-code',
          providerName: 'Claude Code / Anthropic',
          hopFlow: 'Claude Code → OmniRoute → Tool Bridge'
        } : undefined,
        true
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const SYSTEM_COMMAND_TOOLS = [
    {
      id: 't-winrm',
      name: 'مدیریت ویندوز (WinRM / PowerShell)',
      category: 'windows' as const,
      categoryLabel: 'ویندوز و کلاینت',
      executionArm: currentUser?.agent_connected ? 'Windows Agent v2.4 (Port 8443)' : 'Local Host WinRM',
      icon: Laptop,
      description: 'پایش و مدیریت سرویس‌های فعال ویندوز، استعلام مصرف RAM و اجرای فرامین پاورشل.',
      defaultCmd: 'powershell -ExecutionPolicy Bypass -Command "Get-Service | Where-Object {$_.Status -eq \'Running\'} | Select-Object -First 8 Name, Status"',
      presets: [
        { label: 'سرویس‌های در حال اجرا', cmd: 'powershell -Command "Get-Service | Where-Object {$_.Status -eq \'Running\'} | Select-Object -First 10 Name, Status"' },
        { label: '۵ پروسه پرمصرف RAM', cmd: 'powershell -Command "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 ProcessName, @{Name=\'RAM (MB)\';Expression={[math]::Round($_.WorkingSet/1MB,1)}}"' },
        { label: 'بررسی پورت 8443 ایجنت', cmd: 'powershell -Command "Get-NetTCPConnection -LocalPort 8443 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State"' }
      ]
    },
    {
      id: 't-putty',
      name: 'سوئیچ سیسکو (Cisco Switch CLI / SSH)',
      category: 'network' as const,
      categoryLabel: 'شبکه و زیرساخت',
      executionArm: 'Network Bridge via SSH / PuTTY',
      icon: Network,
      description: 'استعلام اینترفیس‌ها، وضعیت پورت‌های ترانک، VLANها و آپ‌تایم سوئیچ مرکزی.',
      defaultCmd: 'ssh admin@192.168.1.2 "show ip interface brief | exclude unassigned; show vlan brief"',
      presets: [
        { label: 'وضعیت پورت‌ها و اینترفیس‌ها', cmd: 'ssh admin@192.168.1.2 "show ip interface brief | exclude unassigned"' },
        { label: 'استعلام جدول VLANها', cmd: 'ssh admin@192.168.1.2 "show vlan brief"' },
        { label: 'آپ‌تایم و سلامت سخت‌افزار', cmd: 'ssh admin@192.168.1.2 "show version | include uptime"' }
      ]
    },
    {
      id: 't-terminal',
      name: 'ترمینال روت سرور (Linux Shell & Docker)',
      category: 'linux' as const,
      categoryLabel: 'سرور لینوکس',
      executionArm: 'Linux Core Node / Master Control-Plane',
      icon: Terminal,
      description: 'اجرای مستقیم فرامین در شل لینوکس، مدیریت داکر، وب‌سرور Nginx و پایش فایروال UFW.',
      defaultCmd: 'systemctl status nginx --no-pager | head -n 8; docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
      presets: [
        { label: 'کانتینرهای فعال داکر', cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"' },
        { label: 'پایش وب‌سرور Nginx', cmd: 'systemctl status nginx --no-pager | head -n 8' },
        { label: 'قوانین فعال فایروال UFW', cmd: 'ufw status numbered' }
      ]
    },
    {
      id: 't-winbox',
      name: 'روتر میکروتیک (MikroTik RouterOS / Winbox)',
      category: 'network' as const,
      categoryLabel: 'شبکه و زیرساخت',
      executionArm: 'MikroTik API SSL (Port 8729)',
      icon: Zap,
      description: 'بررسی روت‌های فعال، ترافیک گیت‌وی و شمارنده فیلتر رول‌های فایروال میکروتیک.',
      defaultCmd: '/ip route print where active\n/interface print brief\n/ip firewall filter print count-only',
      presets: [
        { label: 'جدول روت‌های فعال', cmd: '/ip route print where active' },
        { label: 'اینترفیس‌ها و ترافیک', cmd: '/interface print brief' },
        { label: 'آمار دراپ‌های فایروال', cmd: '/ip firewall filter print count-only' }
      ]
    },
    {
      id: 't-nmap',
      name: 'اسکنر امنیتی پورت (Nmap Port Scanner)',
      category: 'security' as const,
      categoryLabel: 'امنیت و پکت',
      executionArm: 'Security Auditing Subsystem',
      icon: Search,
      description: 'کشف هاست‌های فعال، اسکن پورت‌های باز شبکه محلی و اعتبارسنجی سرویس‌های در حال شنود.',
      defaultCmd: 'nmap -sS -T4 -p 22,80,443,8080,8291,11434 192.168.1.0/24',
      presets: [
        { label: 'اسکن پورت‌های استاندارد رنج', cmd: 'nmap -sS -T4 -p 22,80,443,8080,8291,11434 192.168.1.0/24' },
        { label: 'اسکن مستقیم هاست گیت‌وی', cmd: 'nmap -Pn 192.168.1.1' },
        { label: 'کشف سرویس‌های وب آنلاین', cmd: 'nmap -p 80,443,8080 --open 192.168.1.0/24' }
      ]
    },
    {
      id: 't-wireshark',
      name: 'شنود و آنالیز پکت (Wireshark / TShark)',
      category: 'security' as const,
      categoryLabel: 'امنیت و پکت',
      executionArm: 'Packet Capture Adapter (eth0)',
      icon: Activity,
      description: 'کپچر زنده و تحلیل بسته‌های ورودی/خروجی شبکه با تفکیک پروتکل‌های TCP, DNS, HTTP.',
      defaultCmd: 'tshark -i eth0 -a duration:5 -c 8 -T fields -e frame.number -e ip.src -e ip.dst -e _ws.col.Protocol',
      presets: [
        { label: 'کپچر سریع ۸ پکت روی eth0', cmd: 'tshark -i eth0 -a duration:5 -c 8' },
        { label: 'فیلتر پکت‌های پروتکل DNS', cmd: 'tshark -i eth0 -f "udp port 53" -c 10' },
        { label: 'پایش پکت‌های پورت ۴۴۳ HTTPS', cmd: 'tshark -i eth0 -f "tcp port 443" -c 10' }
      ]
    },
    {
      id: 't-chrome',
      name: 'افزونه کروم (Chrome Extension Agent)',
      category: 'browser' as const,
      categoryLabel: 'مرورگر وب',
      executionArm: 'Chrome Native WebSocket Bridge v1.8',
      icon: Globe,
      description: 'اسکن DOM تب فعال، وب‌گردی اتوماتیک، کنترل کوکی‌ها و لاگ رکوئست‌های XHR/Fetch.',
      defaultCmd: 'chrome.tabs.query({ active: true, currentWindow: true }); chrome.runtime.sendMessage({ action: "inspect_dom_and_network" });',
      presets: [
        { label: 'استعلام تب فعال و شبکه', cmd: 'chrome.tabs.query({ active: true, currentWindow: true }); chrome.runtime.sendMessage({ action: "inspect_dom_and_network" });' },
        { label: 'اسکن عناصر ورودی صفحه', cmd: 'chrome.tabs.executeScript({ code: "document.querySelectorAll(\'input, button\').length" });' }
      ]
    },
    {
      id: 't-hid',
      name: 'کنترل ماوس و کیبورد (Virtual HID Driver)',
      category: 'windows' as const,
      categoryLabel: 'ویندوز و کلاینت',
      executionArm: 'Windows OS Kernel Hook Driver',
      icon: Laptop,
      description: 'شبیه‌سازی سخت‌افزاری حرکات ماوس، کلیک‌ها و تزریق کلیدهای کیبورد.',
      defaultCmd: 'agent.hid.moveCursor(x=640, y=480); agent.hid.click(button="left"); agent.hid.keyPress("ENTER");',
      presets: [
        { label: 'شبیه‌سازی کلیک ماوس در مرکز', cmd: 'agent.hid.moveCursor(x=640, y=480); agent.hid.click(button="left");' },
        { label: 'تزریق کلید Enter سخت‌افزاری', cmd: 'agent.hid.keyPress("ENTER");' }
      ]
    },
    {
      id: 't-screen',
      name: 'کپچر و اسکرین‌شات (Screen Grabber)',
      category: 'windows' as const,
      categoryLabel: 'ویندوز و کلاینت',
      executionArm: 'Windows Display Buffer Streamer',
      icon: Laptop,
      description: 'ثبت و اسکن تصویر دسکتاپ کلاینت یا سرور با وضوح تصویر کامل.',
      defaultCmd: 'agent.screen.capture(display=0, format="png", quality=90)',
      presets: [
        { label: 'اسکرین‌شات نمایشگر اول', cmd: 'agent.screen.capture(display=0, format="png", quality=90)' },
        { label: 'تصویر کم‌حجم وب', cmd: 'agent.screen.capture(display=0, format="jpeg", quality=60)' }
      ]
    }
  ];

  const generateToolConsoleOutput = (toolId: string, cmd: string): string => {
    const now = new Date().toLocaleTimeString('fa-IR');
    switch (toolId) {
      case 't-winrm':
        return `[${now}] [Windows Remote Management (WinRM) - WS-Man / PowerShell Session]
Connecting to local agent at https://127.0.0.1:8443/ws ...
Connected (TLS 1.3, Mutual Auth verified, Latency: 1.8ms)
> Command: ${cmd}

Status   Name               DisplayName
------   ----               -----------
Running  OmniOpsAgent       OmniOps Client Windows Agent v2.4 (Port 8443)
Running  com.docker.service Docker Desktop Service
Running  WinRM              Windows Remote Management (WS-Management)
Running  Dnscache           DNS Client
Running  LanmanWorkstation  Workstation Service
Stopped  Spooler            Print Spooler (Disabled by enterprise security policy)

Top Processes by Working Set (RAM):
ProcessName      PID    RAM (MB)
-----------      ---    --------
OmniOpsAgent     4120   142.4 MB
chrome           8924   420.8 MB
docker           2310   310.2 MB
powershell       7144   68.5 MB
svchost          1104   54.1 MB

[ExitCode: 0 (SUCCESS)] Windows Agent verified scope: 192.168.1.0/24. 0 errors detected.`;

      case 't-putty':
        return `[${now}] [Cisco Switch CLI Bridge - SSH v2 Session]
Connecting to Switch-Core-C9300 (192.168.1.2:22) ...
Authenticated as user admin (RSA-SHA2-512 Host Key Verified)
> Command: ${cmd}

Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/1     192.168.1.2     YES NVRAM  up                    up      
GigabitEthernet0/2     unassigned      YES unset  up                    up (Trunk)
GigabitEthernet0/3     unassigned      YES unset  down                  down    
GigabitEthernet0/4     unassigned      YES unset  up                    up (Access)
Vlan1                  192.168.1.254   YES NVRAM  up                    up      
Vlan10 (Management)    10.10.10.1      YES manual up                    up      
Vlan20 (Admins)        10.10.20.1      YES manual up                    up      

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi0/3, Gi0/5, Gi0/6
10   Management                       active    Gi0/1, Gi0/4
20   Enterprise-Admins                active    Gi0/2

Switch-Core-C9300# uptime is 42 weeks, 3 days, 14 hours, 28 minutes
[ExitCode: 0 (SUCCESS)] Interface table parsed successfully.`;

      case 't-terminal':
        return `[${now}] [Linux Master Node Root Shell - SSH / Container Engine]
Target: omniops-master (127.0.0.1:22)
> Command: ${cmd}

CONTAINER ID   IMAGE                 COMMAND                  CREATED        STATUS        PORTS
e98a123f041b   ollama/ollama:latest  "/bin/ollama serve"      6 hours ago    Up 6 hours    0.0.0.0:11434->11434/tcp
f1298c4d110a   n8nio/n8n:latest      "tini -- /docker-ent…"   6 hours ago    Up 6 hours    0.0.0.0:5678->5678/tcp
a77c320e8891   redis:7-alpine        "docker-entrypoint.s…"   12 hours ago   Up 12 hours   6379/tcp
d4081c7e9902   postgres:16-alpine    "docker-entrypoint.s…"   12 hours ago   Up 12 hours   5432/tcp

● nginx.service - A high performance web server and a reverse proxy server
   Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
   Active: active (running) since Tue 2026-09-29 02:30:11 IRST; 6h ago
   Main PID: 1204 (nginx)
   Tasks: 5 (limit: 9482)
   Memory: 42.1M
   CGroup: /system.slice/nginx.service
           ├─1204 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
           └─1205 nginx: worker process

[ExitCode: 0 (SUCCESS)] Docker & Nginx services healthy. Thread pool normal.`;

      case 't-winbox':
        return `[${now}] [MikroTik RouterOS 7.15.2 - RouterOS API SSL Connection]
Host: omniops-router (192.168.1.1:8729) | TLS v1.3 Certificate: omniops-cert
> Command: ${cmd}

 #      DST-ADDRESS        PREF-SRC        GATEWAY            DISTANCE
 0  AS  0.0.0.0/0                          192.168.1.1               1
 1  DAC 192.168.1.0/24     192.168.1.1     bridge-lan                 0
 2  DAC 10.10.10.0/24      10.10.10.1      vlan10-mgmt                0
 3  DAC 10.10.20.0/24      10.10.20.1      vlan20-admin               0

Flags: X - disabled, I - invalid, D - dynamic, R - running
 #   NAME                  TYPE         ACTUAL-MTU  MAC-ADDRESS
 0 R ether1-gateway        ether        1500        00:0C:29:4F:8E:1A
 1 R ether2-switch-trunk   ether        1500        00:0C:29:4F:8E:24
 2 R bridge-lan            bridge       1500        00:0C:29:4F:8E:1A

Firewall Filter: 14 active rules | FastTrack: Enabled | Drops: 1,842 pkts/min
[ExitCode: 0 (SUCCESS)] RouterOS query returned 4 routes, 3 interfaces.`;

      case 't-nmap':
        return `[${now}] [Nmap Security Port Scanner v7.94]
> Command: ${cmd}

Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-29 12:35 IRST
Nmap scan report for omniops-gateway (192.168.1.1)
Host is up (0.00042s latency).
PORT      STATE SERVICE    VERSION
22/tcp    open  ssh        OpenSSH 8.9p1 Ubuntu
80/tcp    open  http       nginx/1.24.0
443/tcp   open  ssl/http   nginx/1.24.0
8080/tcp  open  http-proxy Traefik Proxy v3.1
8291/tcp  open  winbox     MikroTik Winbox v3.40
11434/tcp open  http       Ollama Local Inference Engine API v0.3.12
MAC Address: 00:0C:29:4F:8E:1A (VMware Virtual NIC)

Nmap scan report for omniops-agent-win11 (192.168.1.145)
Host is up (0.00028s latency).
PORT      STATE SERVICE    VERSION
8443/tcp  open  ssl/https  OmniOps Windows Agent WebSocket v2.4
5985/tcp  open  wsman      Microsoft HTTPAPI (WinRM 3.0)

Nmap done: 256 IP addresses (4 hosts up) scanned in 2.14 seconds
[ExitCode: 0 (SUCCESS)] Port audit completed.`;

      case 't-wireshark':
        return `[${now}] [Wireshark / TShark Network Packet Analyzer]
Capturing on interface 'eth0' [Promiscuous Mode Active]
> Command: ${cmd}

No.  Time       Source          Destination     Proto  Length  Info
1    0.000000   192.168.1.145   192.168.1.1     TCP    66      54320 → 443 [ACK] Seq=1 Ack=1 Win=64240
2    0.000142   192.168.1.145   1.1.1.1         DNS    74      Standard query 0xa312 A api.omniops.internal
3    0.001850   1.1.1.1         192.168.1.145   DNS    90      Standard query response 0xa312 A 192.168.1.50
4    0.002100   192.168.1.145   192.168.1.50    HTTP   148     GET /api/v1/health HTTP/1.1
5    0.003400   192.168.1.50    192.168.1.145   HTTP   224     HTTP/1.1 200 OK (application/json)
6    0.004200   192.168.1.145   192.168.1.1     TLS1.3 512     Application Data
7    0.004800   192.168.1.1     192.168.1.145   TLS1.3 128     Application Data
8    0.005120   192.168.1.145   192.168.1.2     TCP    60      51200 → 22 [SYN] Seq=0 Win=65535

8 packets captured (0 dropped). Protocol breakdown: TCP 50%, DNS 25%, HTTP 25%
[ExitCode: 0 (SUCCESS)] Packet capture completed.`;

      case 't-chrome':
        return `[${now}] [Chrome Extension Agent v1.8.4 - Native WebSocket Bridge]
Session: Chrome Window #1 (Active Foreground Tab)
Target URL: http://192.168.1.1/webfig/#IP:Firewall.Filter
Tab Title: "MikroTik WebFig v7.15 (192.168.1.1)" | ReadyState: Complete
> Command: ${cmd}

- DOM Elements Scanned: 42 inputs, 14 buttons, 2 data tables parsed.
- Active HTTP/XHR Requests: 18 intercepted (All 200 OK, Avg Latency: 14ms).
- Local Cookies & Storage: 3 session keys validated (No cross-site leakage).
- Background Console: 0 syntax errors, 1 warning (Passive scroll listener).
[ExitCode: 0 (SUCCESS)] Chrome Extension executed DOM inspection successfully.`;

      case 't-hid':
        return `[${now}] [Virtual-HID v2.4 Driver - Windows Kernel Hook]
> Command: ${cmd}

> Mouse absolute coordinate dispatched: (X: 640, Y: 480) [Smooth Bezier Interpolation]
> WM_LBUTTONDOWN dispatched at HWND: 0x001B05D2 ("OmniOps Client")
> WM_LBUTTONUP dispatched (Delta: 45ms)
> Hardware Keystroke: VK_RETURN (0x0D) injected into active foreground buffer.
[ExitCode: 0 (SUCCESS)] Hardware input simulation verified by OS Kernel driver (0 errors, Latency: 1.2ms).`;

      case 't-screen':
        return `[${now}] [Screen Capture & Grabber - Display Buffer v2.4]
> Command: ${cmd}

[Screen Grabber] Captured display #0 (Resolution: 1920x1080 @ 60Hz)
Saved buffer to C:\\ProgramData\\OmniOps\\captures\\screen_20260929_123511.png (Size: 842 KB)
Active foreground window: "MikroTik Winbox v3.40 (192.168.1.1)"
OCR Engine: Text detected in capture (14 labels matched).
[ExitCode: 0 (SUCCESS)] Screen captured.`;

      default:
        return `[${now}] [Command Executed Successfully via Agent Bridge]\n${cmd}\nExit Code: 0 (OK)`;
    }
  };

  const handleExecuteCommand = async (toolId: string, cmdToRun?: string) => {
    const tool = SYSTEM_COMMAND_TOOLS.find(t => t.id === toolId) || SYSTEM_COMMAND_TOOLS[0];
    const finalCmd = cmdToRun || (commandInputText.trim() ? commandInputText.trim() : tool.defaultCmd);

    // Strict RBAC Enforcement: user must have tool permission
    if (!hasCommandAccess || !userAllowedTools.includes(tool.id)) {
      setActiveCommandStatus('denied');
      const deniedMsg = `⛔ دسترسی غیرمجاز (RBAC Access Denied):\nحساب کاربری شما (@${currentUser?.username} با نقش ${currentUser?.role}) مجوز فراخوانی ابزار «${tool.name}» را ندارد.\n\nبه دلیل سیاست‌های امنیتی و تفکیک سطح دسترسی، هوش مصنوعی از اجرای این فرمان بر روی زیرساخت خودداری نمود.\nجهت فعال‌سازی این ابزار، از طریق مدیر ارشد سیستم در تب «کاربران و امنیت» دسترسی به این ابزار را در پروفایل خود فعال کنید.`;
      setActiveCommandOutput(deniedMsg);
      setContinuityToast(`⛔ دسترسی غیرمجاز: حساب کاربری شما فاقد مجوز ابزار «${tool.name}» است.`);
      setTimeout(() => setContinuityToast(null), 4000);
      return;
    }

    setIsExecutingCommand(true);
    setActiveCommandStatus('idle');
    try {
      await onSendMessage(
        currentSession.id,
        `اجرای دستور "${finalCmd}" با ابزار ${tool.name}`,
        selectedModelId,
        activeSkillIds,
        [],
        undefined,
        { toolId: tool.id, toolName: tool.name, command: finalCmd },
        modelSelectionMode === 'omniroute' ? {
          useOmniRoute: true,
          providerId: 'claude-code',
          providerName: 'Claude Code / Anthropic',
          hopFlow: 'Claude Code → OmniRoute → Tool Bridge'
        } : undefined,
        true
      );

      const output = generateToolConsoleOutput(tool.id, finalCmd);
      setActiveCommandStatus('success');
      setActiveCommandOutput(output);

      setCommandExecutionHistory(prev => [
        {
          id: `cmd-${Date.now()}`,
          toolId: tool.id,
          toolName: tool.name,
          command: finalCmd,
          status: 'success',
          output,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          executionArm: tool.executionArm
        },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      setActiveCommandStatus('denied');
      setActiveCommandOutput(`[Execution Error] ${err.message || 'خطا در ارتباط با بازوی اجرایی'}`);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const handleSendToolOutputToChat = async (toolName: string, output: string) => {
    if (!output) return;
    setInputText(`گزارش خروجی اجرای ابزار «${toolName}»:\n${output.slice(0, 350)}...`);
    setActiveChatView('chat');
    setIsCommandSidePanelOpen(false);
    textareaRef.current?.focus();
    setContinuityToast('خروجی ابزار در کادر پیام چت جای‌گذاری شد.');
    setTimeout(() => setContinuityToast(null), 3000);
  };

  const handleStartLevel3Task = async (customPrompt?: string) => {
    const prompt = (customPrompt || level3TaskPrompt).trim();
    if (!prompt) return;

    setIsLevel3Processing(true);
    const planId = `plan-${Date.now()}`;
    const requiresSelfReflection = prompt.includes('مستندات') || prompt.includes('اکستنشن') || prompt.includes('اسکرپ') || prompt.includes('خودآموزی') || prompt.includes('وب');

    let tags: Level3TagItem[] = [];
    let initialStatus = '';
    let initialPhase = '';
    let nextStep = '';

    if (agentComplexityMode === 'fast') {
      // ⚡ عملکرد سریع و بهینه (Fast & Optimized): پاسخ‌های کوتاه، کمترین مراحل، مستقیماً صدور کد یا تگ اجرایی
      if (prompt.includes('پورت') || prompt.includes('امنیت') || prompt.includes('اسکن')) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'CMD',
            cmd: `nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oN "${isolatedWorkspacePath}output\\port_audit.txt"`,
            tagString: `[WIN_AGENT:CMD:nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oN "${isolatedWorkspacePath}output\\port_audit.txt"]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'اجرای مستقیم اسکن امنیتی پورت‌ها در زیرشبکه و ذخیره فایل منحصراً در پوشه ایزوله.'
          }
        ];
        initialStatus = 'آماده اجرای سریع فرمان ممیزی امنیتی پورت‌ها';
        initialPhase = 'گام نهایی ۱ از ۱: صدور تگ اجرایی به ایجنت ویندوز';
        nextStep = 'اجرای دستور در ترمینال ویندوز و بازگردانی کد خروجی';
      } else if (prompt.includes('میکروتیک') || prompt.includes('روت') || prompt.includes('ترافیک')) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'ROUTER_API',
            cmd: `/ip route print where active; /ip firewall filter print count-only`,
            tagString: `[WIN_AGENT:ROUTER_API:/ip route print where active; /ip firewall filter print count-only]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'استعلام آنی جدول روت‌های فعال و شمارنده دراپ فایروال میکروتیک.'
          }
        ];
        initialStatus = 'آماده صدور فرمان به روتر میکروتیک';
        initialPhase = 'گام ۱ از ۱: استعلام مستقیم API روتر';
        nextStep = 'ارسال بسته API به پورت ۸۷۲۹ میکروتیک';
      } else {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `powershell -ExecutionPolicy Bypass -File "${isolatedWorkspacePath}scripts\\network_audit.ps1"`,
            tagString: `[WIN_AGENT:POWERSHELL:powershell -ExecutionPolicy Bypass -File "${isolatedWorkspacePath}scripts\\network_audit.ps1"]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'اجرای اسکریپت پاورشل استاندارد ایزوله‌شده در پوشه کاری.'
          }
        ];
        initialStatus = 'آماده اجرای مستقیم اسکریپت پاورشل';
        initialPhase = 'گام ۱ از ۱: صدور تگ اجرایی به بازوی ویندوزی';
        nextStep = 'اجرا در پروسه ایزوله ویندوز و ثبت لاگ تله‌متری';
      }
    } else {
      // 🧠 تحلیل عمیق و معماری پیچیده (Deep Analysis & Architecture): شکست به زیرتسک‌ها، تدوین نقشه راه، صدور مرحله به مرحله
      if (requiresSelfReflection) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WEB_EXT',
            action: 'SCRAPE_DOCS',
            cmd: 'https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter -s "table.filter-rules"',
            tagString: '[WEB_EXT:SCRAPE_DOCS:https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter -s "table.filter-rules"]',
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'فاز خودآموزی (Self-Reflection): اسکن ساختار جدول قوانین فایروال از مستندات رسمی وب با افزونه مرورگر.'
          },
          {
            id: 'tag-2',
            arm: 'WIN_AGENT',
            action: 'FS_WRITE',
            cmd: `path="${isolatedWorkspacePath}scripts\\deploy_filter.ps1", content="# Generated from scraped docs"`,
            tagString: `[WIN_AGENT:FS_WRITE:path="${isolatedWorkspacePath}scripts\\deploy_filter.ps1"]`,
            status: 'pending',
            explanation: 'تولید اسکریپت بر اساس دانش جدید اسکن‌شده و ذخیره در مسیر ایزوله.'
          },
          {
            id: 'tag-3',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `powershell -File "${isolatedWorkspacePath}scripts\\deploy_filter.ps1"`,
            tagString: `[WIN_AGENT:POWERSHELL:powershell -File "${isolatedWorkspacePath}scripts\\deploy_filter.ps1"]`,
            status: 'pending',
            explanation: 'اجرای نهایی اسکریپت با ایجنت ویندوزی و پایش بازخورد.'
          }
        ];
        initialStatus = 'آغاز زنجیره خودآموزی و اجرای چندمرحله‌ای (Deep Analysis)';
        initialPhase = 'گام ۱ از ۳: اسکن مستندات وب با افزونه مرورگر (Self-Reflection)';
        nextStep = 'استخراج قوانین و سنتکس معتبر از صفحه وب مستندات';
      } else {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'CMD',
            cmd: `nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oX "${isolatedWorkspacePath}artifacts\\scan.xml"`,
            tagString: `[WIN_AGENT:CMD:nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oX "${isolatedWorkspacePath}artifacts\\scan.xml"]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'مرحله ۱: کشف سرویس‌های فعال و پورت‌های باز در ساب‌نت سازمانی.'
          },
          {
            id: 'tag-2',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `Get-NetTCPConnection -State Listen | Export-Csv -Path "${isolatedWorkspacePath}output\\local_sockets.csv" -NoTypeInformation`,
            tagString: `[WIN_AGENT:POWERSHELL:Get-NetTCPConnection -State Listen | Export-Csv -Path "${isolatedWorkspacePath}output\\local_sockets.csv" -NoTypeInformation]`,
            status: 'pending',
            explanation: 'مرحله ۲: تطبیق وضعیت شنود پورت‌های لوکال با نتایج اسکن شبکه در پوشه ایزوله.'
          },
          {
            id: 'tag-3',
            arm: 'WIN_AGENT',
            action: 'ROUTER_API',
            cmd: '/ip firewall filter print where chain="input"',
            tagString: '[WIN_AGENT:ROUTER_API:/ip firewall filter print where chain="input"]',
            status: 'pending',
            explanation: 'مرحله ۳: ممیزی قوانین فیلترینگ ورودی گیت‌وی جهت اطمینان از ایزولاسیون کامل پورت‌های حساس.'
          }
        ];
        initialStatus = 'تدوین نقشه راه ممیزی امنیتی چندمرحله‌ای (Roadmap Active)';
        initialPhase = 'گام ۱ از ۳: اسکن امنیتی پورت‌ها با ایجنت سیستم‌عامل';
        nextStep = 'اجرای دستور کشف پورت و ذخیره گزارش در دایرکتوری ایزوله';
      }
    }

    const newPlan: Level3Plan = {
      id: planId,
      prompt,
      projectStatus: initialStatus,
      currentPhase: initialPhase,
      nextAction: nextStep,
      complexityMode: agentComplexityMode,
      approvalMode: agentApprovalMode,
      tags,
      activeTagIndex: 0,
      telemetryLogs: [
        `[${new Date().toLocaleTimeString('fa-IR')}] [CORE_ORCHESTRATOR] پرامپت دریافت شد: «${prompt}»`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [WORKSPACE] دایرکتوری ایزوله: ${isolatedWorkspacePath}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [CONFIG] عمق پردازش: ${agentComplexityMode === 'fast' ? 'عملکرد سریع و بهینه (Fast & Optimized)' : 'تحلیل عمیق و نقشه راه چندمرحله‌ای (Deep Analysis)'}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [CONFIG] پروتکل تأییدیه: ${agentApprovalMode === 'approval' ? 'تأیید گام‌به‌گام (Ask for Approval)' : 'اجرای خودکار (Auto-Pilot)'}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [RBAC] کاربر @${currentUser?.username}: ${userAllowedTools.length} ابزار مجاز`
      ],
      isSelfReflecting: requiresSelfReflection,
      selfReflectedDoc: requiresSelfReflection ? {
        toolName: 'MikroTik Firewall Spec',
        docUrl: 'https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter',
        summary: 'قوانین فیلترینگ ترافیک، حفاظت از پورت‌های وب‌فیگ و فست‌ترک'
      } : undefined
    };

    setActiveLevel3Plan(newPlan);
    setIsLevel3Processing(false);

    if (agentApprovalMode === 'autopilot') {
      executeNextLevel3Step(newPlan, 0);
    }
  };

  const executeNextLevel3Step = async (plan: Level3Plan, stepIndex: number) => {
    if (stepIndex >= plan.tags.length) {
      setActiveLevel3Plan(prev => {
        if (!prev) return null;
        return {
          ...prev,
          projectStatus: 'زنجیره فرامین با موفقیت به پایان رسید ✓',
          currentPhase: 'تکمیل تمامی مراحل و استقرار خروجی‌ها در پوشه ایزوله',
          nextAction: 'آماده دریافت تسک اجرایی بعدی',
          telemetryLogs: [
            ...prev.telemetryLogs,
            `[${new Date().toLocaleTimeString('fa-IR')}] [SUCCESS] تمام گام‌های زنجیره با موفقیت اجرا شدند. خروجی در مسیر ایزوله ذخیره گردید.`
          ]
        };
      });
      return;
    }

    const currentTag = plan.tags[stepIndex];
    setActiveLevel3Plan(prev => {
      if (!prev) return null;
      const updatedTags = [...prev.tags];
      updatedTags[stepIndex] = { ...updatedTags[stepIndex], status: 'executing' };
      return {
        ...prev,
        tags: updatedTags,
        activeTagIndex: stepIndex,
        telemetryLogs: [
          ...prev.telemetryLogs,
          `[${new Date().toLocaleTimeString('fa-IR')}] [${currentTag.arm}] ارسال تگ ساختاریافته: ${currentTag.tagString}`
        ]
      };
    });

    await new Promise(r => setTimeout(r, 850));

    let simulatedOutput = '';
    if (currentTag.arm === 'INTERNAL_NODE' || currentTag.action === 'EMBER') {
      simulatedOutput = `[INTERNAL_NODE:EMBER:200 OK] گره تخصصی Ember-1 وظیفه کدنویسی سبک و تولید ورک‌فلو را در ۱۹ms انجام داد. اعتبارسنجی ساختار: تایید شد.`;
    } else if (currentTag.arm === 'WEB_EXT') {
      simulatedOutput = `[WEB_EXT:200 OK] Scraped content from ${currentTag.cmd.split(' ')[0]}. Extracted structured schema (DOM Elements parsed: 28, Syntax verified).`;
    } else if (currentTag.action === 'GIT') {
      simulatedOutput = `[WIN_AGENT:GIT:SUCCESS] مخزن گیت در ${workspaceCoreTarget === 'cloud' ? 'Cloud Core (Google Drive)' : 'Local Core'} همگام‌سازی شد. شاخه main مستقر و تمام تغییرات با موفقیت به ریموت پوش شدند. (PAT رمزنگاری‌شده تزریق گردید)`;
    } else if (currentTag.action === 'DRIVE_SYNC') {
      simulatedOutput = `[CLOUD_CORE:DRIVE_SYNC] فایل‌های کاری در Google Drive Cloud Core بارگذاری و هش امنیتی SHA-256 ثبت گردید. (OAuth 2.0 Auth verified)`;
    } else if (currentTag.action === 'CMD' || currentTag.action === 'POWERSHELL') {
      simulatedOutput = `[WIN_AGENT:EXIT 0] Process launched in isolated sandbox: ${isolatedWorkspacePath}\nOutput buffer: Active sockets and services scanned. Latency: 1.4ms. Status: Normal.`;
    } else if (currentTag.action === 'ROUTER_API') {
      simulatedOutput = `[WIN_AGENT:ROUTER_API] MikroTik RouterOS query returned 0 errors. Rules count: 14. FastTrack: Enabled.`;
    } else {
      simulatedOutput = `[WIN_AGENT:FS_WRITE] File successfully written inside isolated sandbox: ${isolatedWorkspacePath}\nIntegrity check: SHA256 verified.`;
    }

    const artifactName = currentTag.arm === 'INTERNAL_NODE'
      ? 'deploy.yml'
      : currentTag.arm === 'WEB_EXT' 
      ? 'scraped_spec.json' 
      : currentTag.action === 'FS_WRITE'
      ? 'deploy_filter.ps1'
      : currentTag.action === 'GIT'
      ? 'git_push_status.log'
      : `exec_step_${stepIndex + 1}.log`;

    setVirtualWorkspaceFiles(prev => [
      {
        name: artifactName,
        relativePath: currentTag.arm === 'INTERNAL_NODE' ? `.github/workflows/${artifactName}` : currentTag.arm === 'WEB_EXT' ? `artifacts/${artifactName}` : `output/${artifactName}`,
        size: '3.6 KB',
        type: currentTag.arm === 'INTERNAL_NODE' ? 'GitHub Workflow YAML' : currentTag.arm === 'WEB_EXT' ? 'JSON Document' : 'Log / Script',
        modified: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        content: `# Output from ${currentTag.tagString}\n# Isolated Workspace: ${isolatedWorkspacePath}\n# Target Core: ${workspaceCoreTarget === 'cloud' ? 'Cloud Core (Google Drive)' : 'Local Core (Windows)'}\n# Executed at: ${new Date().toISOString()}\n\n${simulatedOutput}`
      },
      ...prev.filter(f => f.name !== artifactName)
    ]);

    const nextIndex = stepIndex + 1;
    const hasNext = nextIndex < plan.tags.length;

    setActiveLevel3Plan(prev => {
      if (!prev) return null;
      const updatedTags = [...prev.tags];
      updatedTags[stepIndex] = {
        ...updatedTags[stepIndex],
        status: 'completed',
        output: simulatedOutput
      };
      if (hasNext && prev.approvalMode === 'approval') {
        updatedTags[nextIndex] = {
          ...updatedTags[nextIndex],
          status: 'pending'
        };
      }
      return {
        ...prev,
        tags: updatedTags,
        activeTagIndex: nextIndex,
        currentPhase: hasNext ? `گام ${nextIndex + 1} از ${updatedTags.length}: ${updatedTags[nextIndex].explanation}` : 'تمامی گام‌ها با موفقیت اجرا شدند',
        nextAction: hasNext ? `صدور تگ ${updatedTags[nextIndex].arm}` : 'ثبت گزارش نهایی در مسیر ایزوله',
        telemetryLogs: [
          ...prev.telemetryLogs,
          `[${new Date().toLocaleTimeString('fa-IR')}] [${currentTag.arm}] خروجی دریافت شد: ${simulatedOutput.slice(0, 75)}...`
        ]
      };
    });

    if (!hasNext) {
      const activeEmber = plan.tags.some(t => t.arm === 'INTERNAL_NODE' || t.action === 'EMBER');
      const activeGit = plan.tags.some(t => t.action === 'GIT' || t.tagString.includes('git'));
      const activeWeb = plan.tags.some(t => t.arm === 'WEB_EXT');

      const structuredReport = `📊 **گزارش ساختاریافته وضعیت سیستم (ارکستراسیون سطح ۳):**\n\n` +
        `• **گره‌های اجرایی تخصصی:** ${activeEmber ? 'گره تخصصی داخلی Ember-1 توابع و کدها را نوشت. ' : ''}${activeGit ? 'مخزن گیت‌هاب ایجاد و کدها با موفقیت پوش گردیدند. ' : ''}${activeWeb ? 'افزونه وب مستندات را استخراج کرد. ' : ''}بازوی ویندوزی فرامین را در ساندباکس ایزوله سیستم به اتمام رساند.\n` +
        `• **معماری فضاهای کاری (Workspace Topology):** فایل‌ها و خروجی‌ها در مسیر ${workspaceCoreTarget === 'cloud' ? 'Cloud Core (Google Drive)' : 'Local Core (ویندوز)'} (${isolatedWorkspacePath}) ذخیره شدند.\n` +
        `• **امنیت و یکپارچه‌سازی احراز هویت:** توکن‌های دسترسی (GitHub PAT / Google Drive OAuth) به صورت رمزنگاری‌شده در متغیرهای محیطی تزریق شدند بدون افشا یا پرسش از کاربر.\n` +
        `• **گراف ارکستراسیون در داشبورد:** وضعیت گره‌ها در گراف Multi-Agent Topology به‌روزرسانی شد.`;

      const reportMsg: AgentChatMessage = {
        id: `agent-report-${Date.now()}`,
        role: 'agent',
        content: structuredReport,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        statusBadge: 'زنجیره تکمیل شد ✓'
      };
      setAgentChatMessages(prev => [...prev, reportMsg]);
    }

    if (plan.approvalMode === 'autopilot' && hasNext) {
      await new Promise(r => setTimeout(r, 600));
      executeNextLevel3Step(plan, nextIndex);
    }
  };

  const handleSimulateSelfReflection = () => {
    setIsSelfReflecting(true);
    setContinuityToast('موتور خودآموزی: در حال اسکن مستندات وب با افزونه مرورگر...');
    setTimeout(() => {
      setIsSelfReflecting(false);
      setContinuityToast('خودآموزی موفق: دانش جدید تحلیل و اسکریپت در پوشه ایزوله آماده شد.');
      setTimeout(() => setContinuityToast(null), 3000);
      handleStartLevel3Task('اسکن مستندات وب با اکستنشن و اجرای خودکار اسکریپت در پوشه ایزوله');
    }, 1500);
  };

  const runJevGatewayTriage = (promptText: string, strategy: 'auto' | 'force_fast' | 'force_deep') => {
    const lower = promptText.toLowerCase();
    
    const isMultiStepOrArchitecture = 
      lower.includes('معماری') ||
      lower.includes('خودآموزی') ||
      lower.includes('مستندات') ||
      lower.includes('اسکرپ') ||
      lower.includes('تحلیل عمیق') ||
      lower.includes('بازتولید') ||
      lower.includes('کلاستر') ||
      lower.includes('failover') ||
      lower.includes('دیواره') ||
      lower.includes('فایروال') ||
      promptText.length > 70;

    let complexity: 'simple' | 'complex' = isMultiStepOrArchitecture ? 'complex' : 'simple';
    let complexityScore = isMultiStepOrArchitecture ? 8 : 3;

    if (strategy === 'force_fast') {
      complexity = 'simple';
      complexityScore = 2;
    } else if (strategy === 'force_deep') {
      complexity = 'complex';
      complexityScore = 9;
    }

    let selectedEngine = '';
    let costSavingsPercent = 0;
    let latencyMs = 0;

    if (complexity === 'simple') {
      selectedEngine = 'Jev Fast Engine (Gemini 2.5 Flash / Groq LPU)';
      costSavingsPercent = 92;
      latencyMs = 28;
    } else {
      selectedEngine = 'Claude 3.7 Sonnet / Gemini Pro (Deep Reasoning Engine)';
      costSavingsPercent = 0;
      latencyMs = 175;
    }

    // Update cumulative stats
    setGatewayStats(prev => {
      const isSimple = complexity === 'simple';
      const newTotal = prev.totalQueries + 1;
      const newSimple = isSimple ? prev.simpleJevQueries + 1 : prev.simpleJevQueries;
      const newComplex = !isSimple ? prev.complexDeepQueries + 1 : prev.complexDeepQueries;
      return {
        totalQueries: newTotal,
        simpleJevQueries: newSimple,
        complexDeepQueries: newComplex,
        tokensSaved: prev.tokensSaved + (isSimple ? 3400 : 400),
        costSavingsPercent: Number(((newSimple / newTotal) * 92).toFixed(1))
      };
    });

    return {
      triageModel: 'Jev Gatekeeper (Tier-0 Micro-Router)',
      complexity,
      complexityScore,
      selectedEngine,
      costSavingsPercent,
      latencyMs
    };
  };

  const handleCreateFileFromServerMemory = (targetFileName: string) => {
    const template = SERVER_MEMORY_TEMPLATES[targetFileName] || {
      name: targetFileName,
      relativePath: `scripts/${targetFileName}`,
      size: '2.5 KB',
      type: 'Generated Script',
      description: 'بازتولید شده از حافظه ساختار سرور OmniOps',
      content: `# [OMNIOPS SERVER ARCHITECTURE MEMORY - SYNCED TEMPLATE]\n# File: ${targetFileName}\n# Synchronized into chat workspace: ${isolatedWorkspacePath}\nWrite-Host "Server Memory Template loaded." -ForegroundColor Green\n`
    };

    setVirtualWorkspaceFiles(prev => [
      {
        name: template.name,
        relativePath: template.relativePath,
        size: template.size,
        type: template.type,
        modified: 'هم‌اکنون (بازتولید سرور)',
        content: template.content
      },
      ...prev.filter(f => f.name !== targetFileName)
    ]);

    setAgentChatMessages(prev => prev.map(msg => {
      if (msg.fileCheck && msg.fileCheck.targetFileName === targetFileName) {
        return {
          ...msg,
          fileCheck: {
            ...msg.fileCheck,
            exists: true
          }
        };
      }
      return msg;
    }));

    setContinuityToast(`فایل «${targetFileName}» با موفقیت از حافظه سرور در پوشه این چت بازتولید شد.`);
    setTimeout(() => setContinuityToast(null), 3000);
  };

  const handleSendAgentMessage = async (customPrompt?: string) => {
    const text = (customPrompt || agentChatInput).trim();
    if (!text || isAgentChatGenerating) return;

    setAgentChatInput('');
    const userMsgId = `umsg-${Date.now()}`;
    const userMsg: AgentChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setAgentChatMessages(prev => [...prev, userMsg]);
    setIsAgentChatGenerating(true);

    // 🛑 Check if user's local Windows Agent is connected:
    if (!isAgentLocallyConnected) {
      await new Promise(r => setTimeout(r, 650));
      const notConnectedMsg: AgentChatMessage = {
        id: `agent-err-${Date.now()}`,
        role: 'agent',
        content: `⚠️ **اخطار عدم اتصال ایجنت ویندوزی (Windows Agent Disconnected):**\n\nدرخواست شما برای «${text}» پردازش گردید، اما اجرای مستقیم فرامین و اسکریپت‌ها بر روی سیستم‌عامل شما به دلیل **عدم اتصال یا نصب نبودن ایجنت ویندوزی** امکان‌پذیر نیست.\n\nمن یک مدل هوش مصنوعی در بستر وب هستم و طبق معماری توزیع‌شده سطح ۳، بازوی اجرایی من در کامپیوتر شما، **ایجنت کلاینت ویندوز (OmniOps Windows Agent)** است. بدون اتصال ایجنت به پروفایل @${currentUser?.username || 'کاربر'}، به فایل‌ها، ترمینال و پروسه‌های ویندوز شما دسترسی ندارم.\n\n📌 **اقدام لازم جهت برقراری ارتباط:**\n۱. نرم‌افزار ایجنت ویندوز را از پنل راهنمای بالا دانلود یا با اسکریپت تک‌خطی اجرا نمایید.\n۲. توکن جفت‌سازی \`${userPairingToken}\` را وارد کرده یا روی دکمه «اتصال سریع به ایجنت لوکال» کلیک فرمایید.\n۳. بلافاصله پس از اتصال، فرامین شما در پوشه کاری ایزوله سیستم اجرا خواهند شد.`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        statusBadge: '⛔ نیازمند اتصال ایجنت ویندوز'
      };
      setAgentChatMessages(prev => [...prev, notConnectedMsg]);
      setIsAgentChatGenerating(false);
      return;
    }

    // 🟢 Agent IS connected:
    // ۱. تریاژ گیت‌وی هوشمند Jev (هزینه نزدیک صفر جهت تشخیص سختی و هدایت به مدل مناسب)
    const gatewayDecision = runJevGatewayTriage(text, gatewayRoutingStrategy);

    // ۲. بررسی پیش‌نیاز فایل‌های پوشه چت متناسب با موضوع مکالمه
    let targetFileName = 'network_audit.ps1';
    let targetTopic = 'ممیزی شبکه و امنیت پورت‌ها';
    if (text.includes('فایروال') || text.includes('firewall') || text.includes('دیواره') || text.includes('بلاک')) {
      targetFileName = 'firewall_rules.ps1';
      targetTopic = 'قوانین دیواره آتش (Firewall)';
    } else if (text.includes('میکروتیک') || text.includes('روت') || text.includes('route') || text.includes('اینترفیس')) {
      targetFileName = 'mikrotik_routes.rsc';
      targetTopic = 'مسیریابی شبکه میکروتیک';
    } else if (text.includes('کانفیگ') || text.includes('مشخصات') || text.includes('yaml') || text.includes('محیط')) {
      targetFileName = 'server_env_spec.yaml';
      targetTopic = 'مشخصات محیط و کلاستر سرور';
    }

    let fileExists = virtualWorkspaceFiles.some(f => f.name === targetFileName);

    // اگر در حالت اجرای خودکار (Auto-pilot) باشد و فایل نبود، خودکار از حافظه سرور بازتولید می‌شود
    if (!fileExists && agentApprovalMode === 'autopilot') {
      handleCreateFileFromServerMemory(targetFileName);
      fileExists = true;
    }

    await new Promise(r => setTimeout(r, 750));
    const requiresSelfReflection = text.includes('مستندات') || text.includes('اکستنشن') || text.includes('اسکرپ') || text.includes('خودآموزی') || text.includes('وب');
    const planId = `plan-${Date.now()}`;

    let tags: Level3TagItem[] = [];
    let initialStatus = '';
    let initialPhase = '';
    let nextStep = '';
    let aiExplanation = '';

    const lowerText = text.toLowerCase();
    const isGitHubTask = lowerText.includes('گیت') || lowerText.includes('github') || lowerText.includes('git') || lowerText.includes('مخزن') || lowerText.includes('ریپو') || lowerText.includes('پوش') || lowerText.includes('push') || lowerText.includes('commit') || lowerText.includes('ci/cd') || lowerText.includes('deploy') || lowerText.includes('workflow') || lowerText.includes('آپلود') || lowerText.includes('انتشار');
    const isEmberTask = lowerText.includes('ember') || lowerText.includes('امبر') || lowerText.includes('ابزار') || lowerText.includes('کد سبک') || lowerText.includes('vision') || lowerText.includes('بینایی') || lowerText.includes('تولید تابع');

    if (isGitHubTask) {
      tags = [
        {
          id: 'tag-1',
          arm: 'WIN_AGENT',
          action: 'GIT',
          cmd: `gh repo create omniops-repo-${currentChatNumber} --private --description "Automated repo created by OmniOps L3 Orchestrator" --confirm`,
          tagString: `[WIN_AGENT:GIT:gh repo create omniops-repo-${currentChatNumber} --private]`,
          status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
          explanation: 'مرحله ۱: صدور فرمان ساخت مخزن خصوصی جدید از طریق GitHub API (توکن PAT به صورت متغیر محیطی GITHUB_TOKEN تزریق شد).'
        },
        {
          id: 'tag-2',
          arm: 'WIN_AGENT',
          action: 'CMD',
          cmd: `git init && git branch -M main`,
          tagString: `[WIN_AGENT:CMD:git init && git branch -M main]`,
          status: 'pending',
          explanation: `مرحله ۲: مقداردهی اولیه git init در پوشه ایزوله ${workspaceCoreTarget === 'cloud' ? 'Cloud Core (Google Drive)' : 'Local Core (ویندوز)'}.`
        },
        {
          id: 'tag-3',
          arm: 'INTERNAL_NODE',
          action: 'EMBER',
          cmd: `generate_workflow:path=".github/workflows/deploy.yml"`,
          tagString: `[INTERNAL_NODE:EMBER:generate_workflow:path=".github/workflows/deploy.yml"]`,
          status: 'pending',
          explanation: 'مرحله ۳: ارجاع به گره تخصصی داخلی Ember-1 برای تولید پایپ‌لاین دپلوی خودکار (CI/CD).'
        },
        {
          id: 'tag-4',
          arm: 'WIN_AGENT',
          action: 'CMD',
          cmd: `git add . && git commit -m "feat(core): Initial commit by L3 Multi-Agent Orchestrator" && git remote add origin https://github.com/omniops/omniops-repo-${currentChatNumber}.git && git push -u origin main`,
          tagString: `[WIN_AGENT:CMD:git add . && git commit -m "feat(core): Initial commit" && git push -u origin main]`,
          status: 'pending',
          explanation: 'مرحله ۴: اجرای فرامین git add، commit با پیام استاندارد و push کردن کدها به مخزن گیت‌هاب با احراز هویت رمزنگاری‌شده.'
        }
      ];
      initialStatus = 'زنجیره ارکستراسیون ۴ مرحله‌ای گیت‌هاب و اتوماسیون CI/CD';
      initialPhase = 'گام ۱ از ۴: صدور فرمان ساخت مخزن خصوصی گیت‌هاب';
      nextStep = 'مقداردهی git init در پوشه ایزوله';
      aiExplanation = `درخواست شما برای کنترل نسخه و گیت‌هاب توسط گره مرکزی پردازش شد. زنجیره خودکار ۴ مرحله‌ای شامل ساخت مخزن، مقداردهی git init در پوشه ایزوله (${workspaceCoreTarget === 'cloud' ? 'Cloud Core' : 'Local Core'})، تولید خودکار پایپ‌لاین دیپلوی CI/CD توسط گره Ember-1 و پوش نهایی تدوین گردید (توکن PAT بدون افشا در خروجی به بازوی ویندوزی تزریق شد):`;
    } else if (isEmberTask) {
      tags = [
        {
          id: 'tag-1',
          arm: 'INTERNAL_NODE',
          action: 'EMBER',
          cmd: `generate_lightweight_tool:request="${text}"`,
          tagString: `[INTERNAL_NODE:EMBER:generate_lightweight_tool:request="${text}"]`,
          status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
          explanation: 'مرحله ۱: ارجاع مستقیم ساب‌تسک به گره تخصصی داخلی Ember-1 جهت Tool Calling سریع و کدنویسی سبک.'
        },
        {
          id: 'tag-2',
          arm: 'WIN_AGENT',
          action: 'POWERSHELL',
          cmd: `powershell -ExecutionPolicy Bypass -File "${isolatedWorkspacePath}scripts\\ember_generated_action.ps1"`,
          tagString: `[WIN_AGENT:POWERSHELL:powershell -ExecutionPolicy Bypass -File "${isolatedWorkspacePath}scripts\\ember_generated_action.ps1"]`,
          status: 'pending',
          explanation: `مرحله ۲: اجرای اسکریپت تولیدی Ember-1 توسط بازوی ویندوزی در مسیر ایزوله.`
        }
      ];
      initialStatus = 'ارجاع تسک به گره داخلی Ember-1 و بازوی ویندوزی';
      initialPhase = 'گام ۱ از ۲: استنتاج سریع و تولید کد با گره تخصصی Ember-1';
      nextStep = 'اجرای کد تولید شده در پوشه ایزوله';
      aiExplanation = 'ساب‌تسک به دلیل نیاز به Tool Calling و کد سبک، مستقیماً به مدل تخصصی داخلی Ember-1 ارجاع داده شد:';
    } else if (agentComplexityMode === 'fast') {
      if (text.includes('پورت') || text.includes('امنیت') || text.includes('اسکن')) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'CMD',
            cmd: `nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oN "${isolatedWorkspacePath}output\\port_audit.txt"`,
            tagString: `[WIN_AGENT:CMD:nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oN "${isolatedWorkspacePath}output\\port_audit.txt"]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'دستور اسکن پورت‌ها در ساب‌نت و ذخیره امن خروجی در مسیر ایزوله.'
          }
        ];
        initialStatus = 'آماده صدور مستقیم به ایجنت ویندوزی متصل';
        initialPhase = 'گام ۱ از ۱: صدور فرمان خط فرمان';
        nextStep = 'دریافت خروجی پورت‌ها از کلاینت ویندوز';
        aiExplanation = 'درخواست شما برای ممیزی پورت‌ها بررسی شد. دستور مستقیم اسکن شبکه آماده ارسال به بازوی ویندوزی شما است:';
      } else if (text.includes('میکروتیک') || text.includes('روت') || text.includes('ترافیک')) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'ROUTER_API',
            cmd: `/ip route print where active; /ip firewall filter print count-only`,
            tagString: `[WIN_AGENT:ROUTER_API:/ip route print where active; /ip firewall filter print count-only]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'استعلام جدول روت‌های فعال و شمارنده دراپ فایروال میکروتیک.'
          }
        ];
        initialStatus = 'آماده صدور فرمان روتینگ به ایجنت ویندوز';
        initialPhase = 'گام ۱ از ۱: استعلام API';
        nextStep = 'ارسال بسته API به گیت‌وی';
        aiExplanation = 'استعلام جدول روت‌ها و ترافیک گیت‌وی آماده صدور به ایجنت ویندوز است:';
      } else if (text.includes('ram') || text.includes('رم') || text.includes('پروسه') || text.includes('سرویس')) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `powershell -Command "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 ProcessName, @{Name='RAM (MB)';Expression={[math]::Round($_.WorkingSet/1MB,1)}}"`,
            tagString: `[WIN_AGENT:POWERSHELL:Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'استعلام پروسه‌های ویندوز از طریق سرویس پاورشل ایجنت محلی.'
          }
        ];
        initialStatus = 'استعلام منابع سیستم‌عامل ویندوز';
        initialPhase = 'گام ۱ از ۱: ارسال به پاورشل ویندوز';
        nextStep = 'ثبت خروجی در پوشه ایزوله';
        aiExplanation = 'اسکریپت پاورشل پایش پروسه‌های سیستم‌عامل آماده صدور به ایجنت ویندوز شما است:';
      } else {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `powershell -ExecutionPolicy Bypass -File "${isolatedWorkspacePath}scripts\\${targetFileName}"`,
            tagString: `[WIN_AGENT:POWERSHELL:powershell -ExecutionPolicy Bypass -File "${isolatedWorkspacePath}scripts\\${targetFileName}"]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: `اجرای اسکریپت ${targetFileName} در پوشه ایزوله ویندوز کاربر.`
          }
        ];
        initialStatus = 'آماده اجرای اسکریپت در پوشه ایزوله';
        initialPhase = 'گام ۱ از ۱: ارسال تگ به بازوی ویندوزی';
        nextStep = 'اجرا در پروسه ایزوله و دریافت لاگ';
        aiExplanation = `دستور شما تحلیل شد و اسکریپت ${targetFileName} در پوشه ایزوله سیستم ویندوز شما آماده صدور است:`;
      }
    } else {
      // Deep mode
      if (requiresSelfReflection) {
        tags = [
          {
            id: 'tag-1',
            arm: 'WEB_EXT',
            action: 'SCRAPE_DOCS',
            cmd: 'https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter -s "table.filter-rules"',
            tagString: '[WEB_EXT:SCRAPE_DOCS:https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter -s "table.filter-rules"]',
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'فاز ۱: اسکن ساختار مستندات از طریق افزونه مرورگر (Self-Reflection).'
          },
          {
            id: 'tag-2',
            arm: 'WIN_AGENT',
            action: 'FS_WRITE',
            cmd: `path="${isolatedWorkspacePath}scripts\\deploy_filter.ps1", content="# Auto-generated from Web Scrape"`,
            tagString: `[WIN_AGENT:FS_WRITE:path="${isolatedWorkspacePath}scripts\\deploy_filter.ps1"]`,
            status: 'pending',
            explanation: 'فاز ۲: تولید اسکریپت بر اساس دانش تازه در پوشه کاری ایزوله.'
          },
          {
            id: 'tag-3',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `powershell -File "${isolatedWorkspacePath}scripts\\deploy_filter.ps1"`,
            tagString: `[WIN_AGENT:POWERSHELL:powershell -File "${isolatedWorkspacePath}scripts\\deploy_filter.ps1"]`,
            status: 'pending',
            explanation: 'فاز ۳: اجرای اسکریپت توسط ایجنت ویندوز و ثبت خروجی.'
          }
        ];
        initialStatus = 'تدوین نقشه راه خودآموزی و اجرای گام‌به‌گام';
        initialPhase = 'گام ۱ از ۳: اسکن مستندات وب با افزونه مرورگر';
        nextStep = 'استخراج سنتکس و تولید اسکریپت در دایرکتوری ایزوله';
        aiExplanation = 'با توجه به نیازمندی به دانش جدید، وارد فاز خودآموزی شدم. نقشه راه ۳ مرحله‌ای شامل اسکن وب، ایجاد فایل در پوشه ایزوله و اجرای نهایی توسط ایجنت ویندوزی آماده شد:';
      } else {
        tags = [
          {
            id: 'tag-1',
            arm: 'WIN_AGENT',
            action: 'CMD',
            cmd: `nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oX "${isolatedWorkspacePath}artifacts\\scan.xml"`,
            tagString: `[WIN_AGENT:CMD:nmap -sS -T4 -p 22,80,443,8080,8443,8291 192.168.1.0/24 -oX "${isolatedWorkspacePath}artifacts\\scan.xml"]`,
            status: agentApprovalMode === 'autopilot' ? 'executing' : 'pending',
            explanation: 'مرحله ۱: کشف سرویس‌های فعال و پورت‌های باز در ساب‌نت.'
          },
          {
            id: 'tag-2',
            arm: 'WIN_AGENT',
            action: 'POWERSHELL',
            cmd: `Get-NetTCPConnection -State Listen | Export-Csv -Path "${isolatedWorkspacePath}output\\local_sockets.csv" -NoTypeInformation`,
            tagString: `[WIN_AGENT:POWERSHELL:Get-NetTCPConnection -State Listen | Export-Csv -Path "${isolatedWorkspacePath}output\\local_sockets.csv" -NoTypeInformation]`,
            status: 'pending',
            explanation: 'مرحله ۲: تطبیق وضعیت شنود پورت‌های محلی با نتایج اسکن شبکه در پوشه ایزوله.'
          },
          {
            id: 'tag-3',
            arm: 'WIN_AGENT',
            action: 'ROUTER_API',
            cmd: '/ip firewall filter print where chain="input"',
            tagString: '[WIN_AGENT:ROUTER_API:/ip firewall filter print where chain="input"]',
            status: 'pending',
            explanation: 'مرحله ۳: ممیزی قوانین فیلترینگ ورودی گیت‌وی جهت ایزولاسیون پورت‌های حساس.'
          }
        ];
        initialStatus = 'تدوین نقشه راه ۳ مرحله‌ای ممیزی';
        initialPhase = 'گام ۱ از ۳: اسکن شبکه با ایجنت سیستم‌عامل';
        nextStep = 'صدور دستور اسکن و ذخیره گزارش در پوشه ایزوله';
        aiExplanation = 'مسئله را به نقشه راه ۳ مرحله‌ای شکستم: ۱) اسکن پورت‌ها، ۲) بررسی سوکت‌های محلی و ۳) ممیزی فیلترهای گیت‌وی در پوشه ایزوله:';
      }
    }

    const newPlan: Level3Plan = {
      id: planId,
      prompt: text,
      projectStatus: initialStatus,
      currentPhase: initialPhase,
      nextAction: nextStep,
      complexityMode: agentComplexityMode,
      approvalMode: agentApprovalMode,
      tags,
      activeTagIndex: 0,
      telemetryLogs: [
        `[${new Date().toLocaleTimeString('fa-IR')}] [GATEWAY_TRIAGE] تریاژ Jev: ${gatewayDecision.complexity === 'simple' ? 'ساده' : 'پیچیده'} ➔ ${gatewayDecision.selectedEngine}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [CORE_ORCHESTRATOR] دریافت دستور: «${text}»`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [FILE_CHECK] وضعیت فایل «${targetFileName}»: ${fileExists ? 'موجود' : 'نیازمند ایجاد/جایگذاری'}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [WORKSPACE] دایرکتوری اختصاصی چت: ${isolatedWorkspacePath}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [CONFIG] عمق پردازش: ${agentComplexityMode === 'fast' ? 'سریع و بهینه' : 'تحلیل عمیق و چندمرحله‌ای'}`,
        `[${new Date().toLocaleTimeString('fa-IR')}] [CONFIG] پروتکل تأییدیه: ${agentApprovalMode === 'approval' ? 'تأیید گام‌به‌گام (Ask for Approval)' : 'اجرای خودکار (Auto-Pilot)'}`
      ],
      isSelfReflecting: requiresSelfReflection,
      selfReflectedDoc: requiresSelfReflection ? {
        toolName: 'MikroTik Firewall Spec',
        docUrl: 'https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter',
        summary: 'قوانین فیلترینگ ترافیک، حفاظت از پورت‌های وب‌فیگ و فست‌ترک'
      } : undefined
    };

    setActiveLevel3Plan(newPlan);

    const agentMsg: AgentChatMessage = {
      id: `agent-resp-${Date.now()}`,
      role: 'agent',
      content: `${aiExplanation}\n\nبرنامه اجرایی تدوین گردید و تگ‌های رهگیری برای بازوی ویندوزی کلاینت آماده ارسال است:`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      plan: newPlan,
      statusBadge: agentApprovalMode === 'approval' ? 'منتظر تأیید کاربر' : 'در حال اجرای خودکار',
      gatewayInfo: gatewayDecision,
      fileCheck: {
        targetFileName,
        exists: fileExists,
        workspacePath: isolatedWorkspacePath,
        topic: targetTopic,
        serverMemoryTemplateAvailable: true
      }
    };

    setAgentChatMessages(prev => [...prev, agentMsg]);
    setIsAgentChatGenerating(false);

    if (agentApprovalMode === 'autopilot') {
      executeNextLevel3Step(newPlan, 0);
    }
  };

  const renderCommandExecutionConsole = (isSidePanel: boolean) => {
    return (
      <div className="space-y-4 text-xs select-text flex flex-col h-full min-h-0" dir="rtl">
        {/* ۱. هدر اصلی و وضعیت اتصال ایجنت با پروفایل کاربر (طراحی سوئیسی دارک) */}
        <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Brain className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-zinc-100 text-sm">کنسول و مرکز اجرای فرامین (سطح ۳)</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Level 3 Autonomous Agent
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    Bridge Architecture
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  اجرای واقعی دستورات در سیستم‌عامل ویندوز کلاینت، تجهیزات شبکه، سرور و وب با تفکیک دقیق دسترسی‌ها
                </p>
              </div>
            </div>

            {/* نشان‌های کاربری و سوییچ تست وضعیت اتصال ایجنت */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-zinc-800/90 border border-zinc-700/80 text-zinc-300">
                کاربر: <strong className="text-white">@{currentUser?.username}</strong> ({currentUser?.role})
              </span>

              {/* کلید تغییر وضعیت اتصال ایجنت */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isAgentLocallyConnected;
                  setIsAgentLocallyConnected(nextState);
                  setContinuityToast(nextState ? 'ایجنت ویندوزی با موفقیت متصل شد.' : 'ایجنت ویندوزی قطع گردید (تست عدم اتصال).');
                  setTimeout(() => setContinuityToast(null), 3000);
                }}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${
                  isAgentLocallyConnected
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30'
                }`}
                title="کلیک برای تغییر وضعیت اتصال ایجنت ویندوزی جهت تست رفتار سیستم در هر دو حالت"
              >
                <span className={`w-2 h-2 rounded-full ${isAgentLocallyConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span>{isAgentLocallyConnected ? 'ایجنت ویندوز: متصل (تغییر به قطع)' : 'ایجنت ویندوز: قطع (تغییر به متصل)'}</span>
              </button>
            </div>
          </div>

          {/* چراغ‌های وضعیت اتصال بازوهای اجرایی */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-zinc-800/80">
            {/* ۱. ایجنت ویندوز */}
            <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
              isAgentLocallyConnected ? 'bg-[#18181b] border-zinc-800' : 'bg-red-950/20 border-red-500/40'
            }`}>
              <div className="mt-0.5 relative shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${isAgentLocallyConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
              <div className="space-y-0.5 leading-snug">
                <div className="flex items-center gap-1.5 font-bold text-zinc-100 text-[11px]">
                  <Laptop className={`w-3.5 h-3.5 ${isAgentLocallyConnected ? 'text-sky-400' : 'text-red-400'}`} />
                  <span>ایجنت ویندوزی کلاینت (Windows Agent)</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {isAgentLocallyConnected ? 'Port 8443 (WSS) · آماده دریافت فرامین' : 'وضعیت: متصل نیست / آفلاین'}
                </div>
                <div className={`text-[9px] font-mono ${isAgentLocallyConnected ? 'text-sky-300' : 'text-red-300 font-bold'}`}>
                  {isAgentLocallyConnected ? 'فرمت صدور: [WIN_AGENT:ACTION:cmd]' : '⛔ فرامین سیستمی مسدود است'}
                </div>
              </div>
            </div>

            {/* ۲. افزونه وب */}
            <div className="p-2.5 rounded-xl bg-[#18181b] border border-zinc-800 flex items-start gap-2.5">
              <div className="mt-0.5 relative shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </div>
              <div className="space-y-0.5 leading-snug">
                <div className="flex items-center gap-1.5 font-bold text-zinc-100 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>افزونه وب مرورگر (Web Extension)</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  Chrome Native Bridge v1.8 · فعال
                </div>
                <div className="text-[9px] text-emerald-300 font-mono">
                  فرمت صدور: [WEB_EXT:ACTION:cmd]
                </div>
              </div>
            </div>

            {/* ۳. مغز متفکر ایجنت سطح ۳ */}
            <div className="p-2.5 rounded-xl bg-[#18181b] border border-zinc-800 flex items-start gap-2.5">
              <div className="mt-0.5 relative shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
              </div>
              <div className="space-y-0.5 leading-snug">
                <div className="flex items-center gap-1.5 font-bold text-zinc-100 text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>مغز هوشمند ارکستراسیون (Orchestrator)</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  Level 3 Brain · تحلیل و تفکیک RBAC
                </div>
                <div className="text-[9px] text-amber-300 font-mono">
                  تطبیق با پروفایل کاربری @{currentUser?.username}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* اخطار عدم اتصال ایجنت ویندوزی با راهنمای اتصال سریع */}
        {!isAgentLocallyConnected && (
          <div className="bg-red-950/20 border border-red-500/40 rounded-2xl p-4 shadow-xl space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h5 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-2">
                    <span>ایجنت ویندوزی شناسایی نشد (آفلاین)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                      DISCONNECTED
                    </span>
                  </h5>
                  <p className="text-[11px] text-red-200/90 mt-0.5">
                    فرامین سیستمی توسط ایجنت ویندوزی کلاینت اجرا می‌شوند. جهت تست فوری یا اتصال، کلید زیر را بزنید:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAgentLocallyConnected(true);
                  setContinuityToast('ایجنت ویندوزی با موفقیت متصل شد.');
                  setTimeout(() => setContinuityToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>شبیه‌سازی اتصال فوری (Connect)</span>
              </button>
            </div>

            {/* راهنمای جفت‌سازی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>۱. دستور راه‌اندازی در پاورشل ویندوز:</span>
                </span>
                <div className="bg-black/60 p-2 rounded-lg border border-zinc-800 font-mono text-[10px] text-sky-300 flex items-center justify-between" dir="ltr">
                  <span className="truncate">irm https://omniops.internal/install.ps1 | iex</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('irm https://omniops.internal/install.ps1 | iex');
                      setCopiedInstallCmd(true);
                      setTimeout(() => setCopiedInstallCmd(false), 2000);
                    }}
                    className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0"
                    title="کپی دستور نصب"
                  >
                    {copiedInstallCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>۲. توکن جفت‌سازی اختصاصی (Pairing Token):</span>
                </span>
                <div className="bg-black/60 p-2 rounded-lg border border-zinc-800 font-mono text-[10px] text-amber-300 flex items-center justify-between" dir="ltr">
                  <span className="truncate font-bold">{userPairingToken}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(userPairingToken);
                      setCopiedPairingToken(true);
                      setTimeout(() => setCopiedPairingToken(false), 2000);
                    }}
                    className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0"
                    title="کپی توکن"
                  >
                    {copiedPairingToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* سوییچ‌های رفتاری، گیت‌وی هوشمند Jev و پوشه ایزوله */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
          {/* عمق پردازش */}
          <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-3 space-y-2 shadow-xs">
            <span className="font-bold text-zinc-200 text-[11px] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>عمق پردازش (Complexity)</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setAgentComplexityMode('fast')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                  agentComplexityMode === 'fast'
                    ? 'bg-amber-500 text-black shadow-xs font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⚡ سریع و بهینه
              </button>
              <button
                type="button"
                onClick={() => setAgentComplexityMode('deep')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                  agentComplexityMode === 'deep'
                    ? 'bg-sky-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🧠 تحلیل عمیق
              </button>
            </div>
          </div>

          {/* پروتکل تاییدیه */}
          <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-3 space-y-2 shadow-xs">
            <span className="font-bold text-zinc-200 text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>پروتکل تأییدیه (Approval)</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setAgentApprovalMode('approval')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                  agentApprovalMode === 'approval'
                    ? 'bg-emerald-500 text-black shadow-xs font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🛡️ تأیید گام‌به‌گام
              </button>
              <button
                type="button"
                onClick={() => setAgentApprovalMode('autopilot')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                  agentApprovalMode === 'autopilot'
                    ? 'bg-purple-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🚀 اجرای خودکار
              </button>
            </div>
          </div>

          {/* گیت‌وی Jev */}
          <div className="bg-[#202024] border border-cyan-500/30 rounded-2xl p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 text-[11px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>گیت‌وی تریاژ Jev</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {gatewayStats.costSavingsPercent}٪ صرفه‌جویی
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGatewayModal(true)}
              className="w-full py-1.5 px-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-zinc-700/80 text-cyan-300 hover:text-cyan-200 text-[10px] font-mono flex items-center justify-between transition-colors shadow-inner"
            >
              <span className="truncate">تریاژ هزینه: ساده ➔ Jev / سخت ➔ مدل گران</span>
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </button>
          </div>

          {/* فضای کاری و Core */}
          <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 text-[11px] flex items-center gap-1.5 truncate">
                <FolderGit2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">فضای کاری (چت {currentChatNumber})</span>
              </span>
              <button
                type="button"
                onClick={() => setIsExplorerOpen(true)}
                className="text-[9px] text-emerald-300 font-bold hover:underline shrink-0"
              >
                {virtualWorkspaceFiles.length} فایل
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setWorkspaceCoreTarget('local');
                  setContinuityToast('هسته فیزیکی محلی (Local Core) انتخاب شد.');
                  setTimeout(() => setContinuityToast(null), 2500);
                }}
                className={`py-1 px-1.5 rounded text-[9px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  workspaceCoreTarget === 'local'
                    ? 'bg-sky-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Laptop className="w-3 h-3" />
                <span>Local Core</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceCoreTarget('cloud');
                  setContinuityToast('هسته ابری Google Drive با OAuth انتخاب شد.');
                  setTimeout(() => setContinuityToast(null), 2500);
                }}
                className={`py-1 px-1.5 rounded text-[9px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  workspaceCoreTarget === 'cloud'
                    ? 'bg-cyan-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UploadCloud className="w-3 h-3" />
                <span>Cloud Core</span>
              </button>
            </div>

            <div className="bg-[#18181b] p-1.5 px-2 rounded-lg border border-zinc-800 flex items-center justify-between text-[9px] font-mono" dir="ltr">
              <span className="truncate text-cyan-300 max-w-[140px]">{isolatedWorkspacePath}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(isolatedWorkspacePath);
                  setCopiedWorkspacePath(true);
                  setTimeout(() => setCopiedWorkspacePath(false), 2000);
                }}
                className="text-zinc-400 hover:text-white transition-colors"
                title="کپی مسیر"
              >
                {copiedWorkspacePath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* نوار ارکستراسیون پیشرفته و کنترل توپولوژی */}
        <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTopologyModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Workflow className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>شبکه زنده ایجنت‌ها (Multi-Agent Topology)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowModelRankingModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>جدول رتبه‌بندی پویای مدل‌های فعال</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">امنیت: توکن‌های PAT و بازوهای اجرایی با رمزنگاری در بک‌اند تفکیک شده‌اند</span>
          </div>
        </div>

        {/* 🔀 نوار انتخاب زیرمجموعه کنسول (زیرمنوی دوگانه: جعبه‌ابزار مستقیم vs ایجنت خودکار) */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setConsoleSubTab('tools_terminal')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              consoleSubTab === 'tools_terminal'
                ? 'bg-zinc-800 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>جعبه‌ابزار و کنسول مستقیم فرامین ({SYSTEM_COMMAND_TOOLS.length} ابزار عملیاتی)</span>
          </button>
          <button
            type="button"
            onClick={() => setConsoleSubTab('agent_orchestrator')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              consoleSubTab === 'agent_orchestrator'
                ? 'bg-zinc-800 text-sky-300 border border-sky-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Brain className="w-4 h-4 text-sky-400" />
            <span>ایجنت خودکار سطح ۳ و تریاژ هوشمند (Level 3 Orchestrator)</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Autopilot
            </span>
          </button>
        </div>

        {/* محتوای تب انتخابی: یا ترمینال مستقیم و ابزارها، یا چت‌بات خودکار ایجنت */}
        {consoleSubTab === 'tools_terminal' ? (
          /* ========================================================
             بخش ۱: جعبه‌ابزار عملیاتی سیستم و ترمینال مستقیم فرامین
             ======================================================== */
          <div className="flex-1 overflow-y-auto space-y-4 min-h-[450px]">
            {/* فیلتر دسته‌بندی ابزارها */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
              {[
                { id: 'all', label: 'همه ابزارها' },
                { id: 'windows', label: '💻 ویندوز و کلاینت' },
                { id: 'network', label: '🌐 شبکه و سوئیچ' },
                { id: 'linux', label: '🐧 سرور لینوکس' },
                { id: 'security', label: '🛡️ امنیت و پکت' },
                { id: 'browser', label: '🌍 افزونه وب' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCommandCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${
                    commandCategoryFilter === cat.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs font-bold'
                      : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* گرید کارت‌های ابزارها */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SYSTEM_COMMAND_TOOLS.filter(t => commandCategoryFilter === 'all' || t.category === commandCategoryFilter).map(tool => {
                const IconComponent = tool.icon;
                const isSelected = selectedToolId === tool.id;
                const isAllowed = userAllowedTools.includes(tool.id) || currentUser?.role === 'SuperAdmin';

                return (
                  <div
                    key={tool.id}
                    onClick={() => {
                      setSelectedToolId(tool.id);
                      setCommandInputText(tool.defaultCmd);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500/60 ring-1 ring-amber-500/40 shadow-md'
                        : 'bg-[#18181b] hover:bg-zinc-800/60 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border ${isSelected ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-zinc-800 text-zinc-300 border-zinc-700/60'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-zinc-100 text-xs">{tool.name}</h5>
                          <span className="text-[10px] text-zinc-400 font-mono">{tool.categoryLabel}</span>
                        </div>
                      </div>

                      {/* وضعیت مجوز دسترسی */}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isAllowed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}>
                        {isAllowed ? '✓ مجاز' : '🔒 نیازمند مجوز'}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 mt-1">
                      {tool.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span className="truncate max-w-[160px] text-zinc-400">{tool.executionArm}</span>
                      <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">انتخاب ابزار ➔</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ایستگاه عملیاتی و ترمینال ابزار انتخابی */}
            {(() => {
              const activeTool = SYSTEM_COMMAND_TOOLS.find(t => t.id === selectedToolId) || SYSTEM_COMMAND_TOOLS[0];
              const ActiveIcon = activeTool.icon;
              const isAllowed = userAllowedTools.includes(activeTool.id) || currentUser?.role === 'SuperAdmin';

              return (
                <div className="bg-[#18181b] border border-zinc-700/80 rounded-2xl p-4 space-y-4 shadow-xl">
                  {/* هدر ایستگاه */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <ActiveIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-sm">{activeTool.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {activeTool.executionArm}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {activeTool.description}
                        </p>
                      </div>
                    </div>

                    {/* دکمه انتقال خروجی به چت */}
                    {activeCommandOutput && (
                      <button
                        type="button"
                        onClick={() => handleSendToolOutputToChat(activeTool.name, activeCommandOutput)}
                        className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span>انتقال گزارش خروجی به محیط چت</span>
                      </button>
                    )}
                  </div>

                  {/* پیش‌فرض‌های سریع (Presets) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-400 font-semibold block">پیش‌تنظیم‌های سریع (Quick Presets):</span>
                    <div className="flex flex-wrap gap-2">
                      {activeTool.presets.map((preset, pidx) => (
                        <button
                          key={pidx}
                          type="button"
                          onClick={() => {
                            setCommandInputText(preset.cmd);
                            handleExecuteCommand(activeTool.id, preset.cmd);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300 hover:text-amber-200 text-[11px] transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-amber-400" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ویرایشگر فرمان ترمینال */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                        <span>خط فرمان اجرایی:</span>
                      </span>
                      {!isAllowed && (
                        <span className="text-red-400 text-[11px] font-bold">
                          ⛔ هشدار: اجرای این ابزار در پروفایل شما مجاز نیست
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <textarea
                        rows={3}
                        value={commandInputText || activeTool.defaultCmd}
                        onChange={(e) => setCommandInputText(e.target.value)}
                        placeholder="دستور را وارد فرمایید..."
                        className="w-full bg-[#101013] border border-zinc-700/80 focus:border-amber-500 rounded-xl p-3 text-xs font-mono text-amber-200 placeholder-zinc-600 focus:outline-none leading-relaxed select-text"
                        dir="ltr"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteCommand(activeTool.id, commandInputText)}
                          disabled={isExecutingCommand}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {isExecutingCommand ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          <span>{isExecutingCommand ? 'در حال اجرا...' : 'اجرای فرمان در زیرساخت'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCommandInputText('')}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                        >
                          پاک‌سازی
                        </button>
                      </div>

                      <span className="text-[10px] text-zinc-500 font-mono">
                        Arm: {activeTool.executionArm}
                      </span>
                    </div>
                  </div>

                  {/* پنجره خروجی ترمینال (Live Terminal Output) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-300">خروجی زنده ترمینال:</span>
                        {activeCommandStatus === 'success' && (
                          <span className="text-[10px] px-2 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ExitCode: 0 (SUCCESS)
                          </span>
                        )}
                        {activeCommandStatus === 'denied' && (
                          <span className="text-[10px] px-2 py-0.2 rounded font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                            RBAC DENIED
                          </span>
                        )}
                      </div>

                      {activeCommandOutput && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(activeCommandOutput);
                              setCopiedConsoleOutput(true);
                              setTimeout(() => setCopiedConsoleOutput(false), 2000);
                            }}
                            className="p-1 text-zinc-400 hover:text-white transition-colors"
                            title="کپی خروجی"
                          >
                            {copiedConsoleOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveCommandOutput(null)}
                            className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                            title="پاک کردن خروجی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <pre className="p-3.5 rounded-xl bg-[#090a0d] border border-zinc-800 text-[11px] font-mono text-emerald-400 max-h-56 overflow-y-auto whitespace-pre-wrap select-all shadow-inner" dir="ltr">
                      {activeCommandOutput || `[OmniOps Shell Ready]\n> منتظر صدور فرمان... برای اجرای فوری، روی یکی از پیش‌تنظیم‌های بالا کلیک کنید یا کلید «اجرای فرمان در زیرساخت» را بفشارید.`}
                    </pre>
                  </div>

                  {/* سابقه آخرین فرامین اجرا شده در این نشست */}
                  {commandExecutionHistory.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-semibold block">گزارش آخرین فرامین اجرا شده:</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {commandExecutionHistory.map(item => (
                          <div key={item.id} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                            <div className="flex items-center gap-2 truncate max-w-[70%]">
                              <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              <span className="text-zinc-300 font-bold truncate">{item.toolName}</span>
                              <span className="text-zinc-500 truncate" dir="ltr">{item.command}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-zinc-500">{item.timestamp}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedToolId(item.toolId);
                                  setCommandInputText(item.command);
                                  handleExecuteCommand(item.toolId, item.command);
                                }}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[9px] transition-colors"
                              >
                                اجرای مجدد
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          /* ========================================================
             بخش ۲: جریان مکالمه چت‌بات هوشمند ایجنت (Level 3 Orchestrator)
             ======================================================== */
          <>
            <div className="flex-1 bg-[#18181b] border border-zinc-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-inner min-h-[360px]">
              {agentChatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-in fade-in duration-200 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-1 shadow-md">
                        <Brain className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`space-y-2.5 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* نشانگر تصمیم‌گیری گیت‌وی هوشمند Jev */}
                      {!isUser && msg.gatewayInfo && (
                        <div className="bg-[#202024] border border-cyan-500/30 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono shadow-xs">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
                              <Zap className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span>گیت‌وی هوشمند Jev (Tier-0 Triage):</span>
                                <span className={msg.gatewayInfo.complexity === 'simple' ? 'text-emerald-400' : 'text-blue-400'}>
                                  {msg.gatewayInfo.complexity === 'simple' ? 'سوال ساده و روتین' : 'سوال پیچیده و معماری'}
                                </span>
                                <span className="text-zinc-500 text-[9px]">({msg.gatewayInfo.complexityScore}/10)</span>
                              </div>
                              <span className="text-zinc-400 text-[10px]">
                                هدایت خودکار به: <strong className="text-cyan-300">{msg.gatewayInfo.selectedEngine}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              {msg.gatewayInfo.costSavingsPercent > 0 ? `💰 ${msg.gatewayInfo.costSavingsPercent}٪ صرفه‌جویی هزینه` : '🚀 حداکثر توان استدلال'}
                            </span>
                            <span className="text-zinc-500 text-[9px]">{msg.gatewayInfo.latencyMs}ms</span>
                          </div>
                        </div>
                      )}

                      {/* نشانگر بررسی پیش‌نیاز فایل‌های پوشه چت */}
                      {!isUser && msg.fileCheck && (
                        <div className={`p-3 rounded-xl border space-y-2 text-xs transition-all ${
                          msg.fileCheck.exists
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5 text-white">
                              <FolderGit2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span>بررسی پیش‌نیاز فایل‌های پوشه چت: <code className="font-mono text-cyan-300">{msg.fileCheck.targetFileName}</code></span>
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              msg.fileCheck.exists
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            }`}>
                              {msg.fileCheck.exists ? '✓ فایل در پوشه چت تایید شد' : '⚠️ فایل در پوشه چت یافت نشد'}
                            </span>
                          </div>

                          {!msg.fileCheck.exists && (
                            <div className="space-y-2 text-[11px] leading-relaxed">
                              <p className="text-zinc-300">
                                فایل مورد نیاز برای موضوع «{msg.fileCheck.topic}» در پوشه کاری این چت یافت نشد:
                              </p>
                              <div className="bg-black/60 p-1.5 rounded-lg border border-zinc-800 font-mono text-[10px] text-cyan-300 select-all" dir="ltr">
                                {msg.fileCheck.workspacePath}scripts\{msg.fileCheck.targetFileName}
                              </div>
                              <p className="text-zinc-300">
                                • <strong>اگر فایل را در سیستم خود دارید:</strong> می‌توانید آن را در مسیر فوق جایگذاری فرمایید.<br />
                                • <strong>اگر ندارید:</strong> کلید زیر را بزنید تا هوش مصنوعی با استناد به <strong>حافظه سرور</strong> فایل را بلافاصله بازتولید کند.
                              </p>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleCreateFileFromServerMemory(msg.fileCheck!.targetFileName)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <span>📥 بازتولید خودکار فایل از حافظه سرور</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* بالون پیام */}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-zinc-700 text-white rounded-br-sm shadow-xs border border-zinc-600'
                          : 'bg-[#202024] border border-zinc-800 text-zinc-200 rounded-bl-sm shadow-xs'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        <div className={`flex items-center gap-2 mt-2 pt-1 border-t text-[9px] font-mono ${
                          isUser ? 'border-zinc-600 text-zinc-300 justify-end' : 'border-zinc-800 text-zinc-400 justify-between'
                        }`}>
                          {!isUser && msg.statusBadge && (
                            <span className="font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {msg.statusBadge}
                            </span>
                          )}
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                      {/* در صورت وجود برنامه عملیاتی (Level3Plan) درون پاسخ ایجنت */}
                      {msg.plan && (
                        <div className="bg-[#202024] border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-xl w-full">
                          {/* ستون‌های وضعیت ساختاریافته */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                            <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800">
                              <span className="text-zinc-400 font-semibold block">📊 وضعیت پروژه:</span>
                              <span className="font-bold text-amber-300">{msg.plan.projectStatus}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800">
                              <span className="text-zinc-400 font-semibold block">🔄 فاز جاری:</span>
                              <span className="font-bold text-cyan-300">{msg.plan.currentPhase}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800">
                              <span className="text-zinc-400 font-semibold block">🎯 گام بعدی:</span>
                              <span className="font-bold text-emerald-300">{msg.plan.nextAction}</span>
                            </div>
                          </div>

                          {/* تگ‌های ساختاریافته اجرایی */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-white block">
                              ⚙️ تگ‌های رهگیری بازوهای اجرایی:
                            </span>

                            {msg.plan.tags.map((tag, tidx) => {
                              const isTagActive = msg.plan?.activeTagIndex === tidx;
                              const isDone = tag.status === 'completed';
                              const isPending = tag.status === 'pending';
                              const isRunning = tag.status === 'executing';

                              return (
                                <div
                                  key={tag.id}
                                  className={`p-2.5 rounded-xl border space-y-1.5 ${
                                    isTagActive
                                      ? 'bg-zinc-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                                      : isDone
                                      ? 'bg-[#18181b] border-emerald-500/30'
                                      : 'bg-[#18181b] border-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                                      tag.arm === 'WIN_AGENT'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {tag.arm === 'WIN_AGENT' ? 'ایجنت ویندوز [WIN_AGENT]' : 'افزونه وب [WEB_EXT]'}
                                    </span>

                                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                                      isDone
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : isRunning
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {isDone ? '✓ اجرا شد (ExitCode: 0)' : isRunning ? 'در حال ارسال به ایجنت...' : 'در انتظار تأیید'}
                                    </span>
                                  </div>

                                  <div className="bg-black/60 p-2 rounded-lg border border-zinc-800 font-mono text-[11px] text-amber-200 select-all" dir="ltr">
                                    {tag.tagString}
                                  </div>

                                  <p className="text-[10px] text-zinc-400">
                                    {tag.explanation}
                                  </p>

                                  {tag.output && (
                                    <div className="bg-black/80 p-2 rounded-lg border border-zinc-900 font-mono text-[10px] text-emerald-400 whitespace-pre-wrap select-all" dir="ltr">
                                      {tag.output}
                                    </div>
                                  )}

                                  {/* دکمه‌های پروتکل تأییدیه گام‌به‌گام */}
                                  {isPending && isTagActive && msg.plan?.approvalMode === 'approval' && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                                      <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        <span>تأییدیه کاربر مورد نیاز است</span>
                                      </span>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => executeNextLevel3Step(msg.plan!, tidx)}
                                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>تأیید و اجرای گام در ویندوز</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* تله‌متری خطی */}
                          {msg.plan.telemetryLogs.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[9px] text-zinc-400 font-semibold block">📋 گزارش تله‌متری بازوی ویندوزی:</span>
                              <div className="max-h-24 overflow-y-auto p-2 bg-black/60 rounded-lg border border-zinc-900 font-mono text-[9px] text-zinc-400 space-y-0.5 select-all" dir="ltr">
                                {msg.plan.telemetryLogs.map((log, lidx) => (
                                  <div key={lidx}>{log}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-700 border border-zinc-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-xs font-bold text-xs">
                        {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                );
              })}

              {isAgentChatGenerating && (
                <div className="flex gap-3 justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Brain className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-[#202024] border border-zinc-800 rounded-2xl p-3 text-xs text-amber-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>مغز متفکر ایجنت سطح ۳ در حال تحلیل، استعلام وضعیت ایجنت و تدوین فرامین است...</span>
                  </div>
                </div>
              )}
            </div>

            {/* چیپ‌های سریع و کادر ورودی پیام مکالمه چت‌بات */}
            <div className="space-y-2 bg-[#202024] border border-zinc-800 rounded-2xl p-3 shadow-lg shrink-0">
              {/* سناریوهای سریع */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-[10px] text-zinc-400 font-semibold shrink-0">پیشنهادات سریع:</span>
                {[
                  { label: '🔍 ممیزی امنیتی پورت‌ها و شبکه', prompt: 'پورت‌های باز و سرویس‌های در حال شنود شبکه محلی را ممیزی کن و خروجی را در پوشه ایزوله قرار بده.' },
                  { label: '💻 استعلام ۵ پروسه پرمصرف ویندوز', prompt: 'پروسه‌های پرمصرف حافظه رم و پردازنده سیستم‌عامل ویندوز را استعلام بگیر.' },
                  { label: '🌐 اسکن مستندات با افزونه وب (Self-Reflection)', prompt: 'مستندات فایروال میکروتیک را با افزونه وب اسکن کن و اسکریپت کانفیگ متناسب را بساز.' },
                  { label: '⚡ استعلام وضعیت روت‌های میکروتیک', prompt: 'جدول روت‌های فعال و وضعیت اینترفیس‌های گیت‌وی را استعلام بگیر.' }
                ].map((chip, cidx) => (
                  <button
                    key={cidx}
                    type="button"
                    onClick={() => handleSendAgentMessage(chip.prompt)}
                    disabled={isAgentChatGenerating}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-amber-200 text-[11px] whitespace-nowrap transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* کادر ورودی پیام مکالمه با ایجنت */}
              <div className="flex gap-2">
                <textarea
                  rows={1}
                  value={agentChatInput}
                  onChange={(e) => setAgentChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAgentMessage();
                    }
                  }}
                  placeholder={
                    isAgentLocallyConnected
                      ? "فرمان یا درخواست خود را به زبان طبیعی بنویسید (مانند: وضعیت پورت‌های باز را اسکن کن)..."
                      : "ایجنت ویندوزی متصل نیست. پیام خود را بنویسید یا ابتدا ایجنت را متصل فرمایید..."
                  }
                  className="flex-1 bg-[#101013] border border-zinc-700/80 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                />

                <button
                  type="button"
                  onClick={() => handleSendAgentMessage()}
                  disabled={isAgentChatGenerating || !agentChatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isAgentChatGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 rotate-180" />
                      <span>ارسال به ایجنت</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* مدال مرورگر فایل‌های پوشه ایزوله */}
        {isExplorerOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#12131C] border border-neutral-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 bg-[#181924] border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">مرورگر پوشه ایزوله (Workspace Explorer)</h4>
                    <span className="text-[10px] text-neutral-400 font-mono" dir="ltr">{isolatedWorkspacePath}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsExplorerOpen(false);
                    setSelectedFileForPreview(null);
                  }}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>فایل‌های تولیدشده توسط ایجنت در این نشست ({virtualWorkspaceFiles.length} فایل):</span>
                  <span className="text-emerald-400 text-[10px] font-mono">ایزولاسیون کامل سیستم‌عامل فعال است</span>
                </div>

                <div className="space-y-1.5">
                  {virtualWorkspaceFiles.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedFileForPreview(file)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        selectedFileForPreview?.name === file.name
                          ? 'bg-blue-600/20 border-blue-500/60 shadow-sm'
                          : 'bg-[#181824] hover:bg-[#202030] border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCode className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-bold text-white text-xs font-mono" dir="ltr">{file.name}</div>
                          <span className="text-[10px] text-neutral-500">{file.type} • {file.size}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400">{file.modified}</span>
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* پیش‌نمایش فایل انتخابی */}
                {selectedFileForPreview && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] text-neutral-300 font-mono">
                      <span>پیش‌نمایش: {selectedFileForPreview.relativePath}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedFileForPreview.content);
                          setContinuityToast('محتوای فایل کپی شد');
                          setTimeout(() => setContinuityToast(null), 2000);
                        }}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>کپی محتوا</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-[#090a0f] border border-neutral-800 text-[11px] font-mono text-emerald-300 max-h-52 overflow-y-auto whitespace-pre-wrap select-all" dir="ltr">
                      {selectedFileForPreview.content}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#161722] border-t border-neutral-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsExplorerOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مدال کنترل و آمار گیت‌وی هوشمند Jev (Smart AI Gateway & Cost Optimization) */}
        {showGatewayModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-[#12131C] border border-cyan-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-in fade-in zoom-in-95 duration-200">
              {/* هدر مدال */}
              <div className="flex items-center justify-between p-4 bg-[#181926] border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">گیت‌وی هوشمند Jev (Smart AI Gateway)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {gatewayStats.costSavingsPercent}٪ صرفه‌جویی مالی
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      تریاژ اولیه پرامپت با هزینه نزدیک به صفر ➔ هدایت هوشمند به مدل ارزان یا گران
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGatewayModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* بدنه و آمار گیت‌وی */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* کارت‌های آماری */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-[#0c0d14] border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block mb-1">کل درخواست‌ها</span>
                    <strong className="text-base text-white font-mono">{gatewayStats.totalQueries}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c0d14] border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block mb-1">مسیر ارزان Jev</span>
                    <strong className="text-base text-emerald-300 font-mono">{gatewayStats.simpleJevQueries} ({Math.round((gatewayStats.simpleJevQueries/gatewayStats.totalQueries)*100)}%)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c0d14] border border-blue-500/30">
                    <span className="text-[10px] text-blue-400 block mb-1">مسیر استدلال Claude</span>
                    <strong className="text-base text-blue-300 font-mono">{gatewayStats.complexDeepQueries} ({Math.round((gatewayStats.complexDeepQueries/gatewayStats.totalQueries)*100)}%)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-[#0c0d14] border border-emerald-500/50">
                    <span className="text-[10px] text-emerald-300 block mb-1">کاهش هزینه کل</span>
                    <strong className="text-base text-emerald-400 font-mono font-black">{gatewayStats.costSavingsPercent}٪</strong>
                  </div>
                </div>

                {/* نمودار جریان مسیریابی و تصمیم‌گیری */}
                <div className="p-4 rounded-xl bg-[#0e0f17] border border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Workflow className="w-4 h-4 text-cyan-400" />
                    <span>معماری تصمیم‌گیری ترکیبی (Hybrid Tiered AI Gateway):</span>
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono" dir="ltr">
                    <div className="p-3 rounded-xl bg-[#141520] border border-neutral-700/80 space-y-1 text-center">
                      <span className="text-amber-400 font-bold block text-xs">Step 1: Jev Triage (Tier-0)</span>
                      <span className="text-neutral-400 text-[10px]">Latency: ~28ms | Cost: ~$0.00004</span>
                      <p className="text-neutral-300 text-[10px] pt-1" dir="rtl">
                        ارزیابی فوری سختی پرامپت با هزینه تقریباً صفر
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-1 text-center">
                      <span className="text-emerald-400 font-bold block text-xs">If Simple ➔ Jev Fast Engine</span>
                      <span className="text-neutral-400 text-[10px]">Gemini 2.5 Flash / Groq LPU</span>
                      <p className="text-emerald-300 text-[10px] pt-1" dir="rtl">
                        پاسخ سریع به ۸۵٪ سوالات روتین با ۹۲٪ صرفه‌جویی مالی
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/40 space-y-1 text-center">
                      <span className="text-blue-400 font-bold block text-xs">If Hard ➔ Claude 3.7 Sonnet</span>
                      <span className="text-neutral-400 text-[10px]">Deep Reasoning & System Architecture</span>
                      <p className="text-blue-300 text-[10px] pt-1" dir="rtl">
                        حل مسائل پیچیده، فایروال و خودآموزی با حداکثر دقت
                      </p>
                    </div>
                  </div>
                </div>

                {/* استراتژی مسیریابی گیت‌وی */}
                <div className="p-4 rounded-xl bg-[#0e0f17] border border-neutral-800 space-y-2.5">
                  <span className="text-xs font-bold text-white block">
                    تنظیم استراتژی مسیریابی گیت‌وی (Routing Policy):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGatewayRoutingStrategy('auto');
                        setContinuityToast('استراتژی گیت‌وی: خودکار هوشمند (تریاژ Jev فعال شد)');
                        setTimeout(() => setContinuityToast(null), 2500);
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-right transition-all ${
                        gatewayRoutingStrategy === 'auto'
                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold shadow-md'
                          : 'bg-[#141520] border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>🤖 خودکار هوشمند (پیش‌فرض)</span>
                        {gatewayRoutingStrategy === 'auto' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-normal block leading-tight">
                        تصمیم‌گیری پویا: ساده ➔ Jev / سخت ➔ Claude (صرفه‌جویی ۹۰٪)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGatewayRoutingStrategy('force_fast');
                        setContinuityToast('استراتژی گیت‌وی: همیشه مدل ارزان Jev');
                        setTimeout(() => setContinuityToast(null), 2500);
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-right transition-all ${
                        gatewayRoutingStrategy === 'force_fast'
                          ? 'bg-amber-600/20 border-amber-500 text-white font-bold shadow-md'
                          : 'bg-[#141520] border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>⚡ همیشه کم‌هزینه Jev</span>
                        {gatewayRoutingStrategy === 'force_fast' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-normal block leading-tight">
                        همه درخواست‌ها به مدل فوق سریع و کم‌هزینه ارسال می‌شوند.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGatewayRoutingStrategy('force_deep');
                        setContinuityToast('استراتژی گیت‌وی: همیشه مدل سنگین Claude 3.7');
                        setTimeout(() => setContinuityToast(null), 2500);
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-right transition-all ${
                        gatewayRoutingStrategy === 'force_deep'
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-md'
                          : 'bg-[#141520] border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>🧠 همیشه استدلال عمیق</span>
                        {gatewayRoutingStrategy === 'force_deep' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-normal block leading-tight">
                        حداکثر توان پردازشی بدون در نظر گرفتن هزینه توکن.
                      </span>
                    </button>
                  </div>
                </div>

                {/* تست زنده رفتار گیت‌وی با دو نمونه پرامپت */}
                <div className="p-4 rounded-xl bg-[#090b14] border border-cyan-500/30 space-y-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تست زنده تصمیم‌گیری Jev Gateway:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGatewayModal(false);
                        handleSendAgentMessage('وضعیت پورت ۸۴۴۳ و مصرف حافظه رم سیستم را بررسی کن');
                      }}
                      className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#1a1e30] border border-emerald-500/30 text-emerald-300 text-right text-xs transition-colors flex items-center justify-between"
                    >
                      <div>
                        <strong className="block text-white text-[11px]">نمونه ۱ (سوال ساده / روتین)</strong>
                        <span className="text-[10px] text-neutral-400">بررسی پورت و رم ➔ هدایت به Jev Fast (۹۲٪ صرفه‌جویی)</span>
                      </div>
                      <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowGatewayModal(false);
                        handleSendAgentMessage('معماری دیواره آتش و تحلیل روت‌های میکروتیک را با خودآموزی وب تدوین کن');
                      }}
                      className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#1a1e30] border border-blue-500/30 text-blue-300 text-right text-xs transition-colors flex items-center justify-between"
                    >
                      <div>
                        <strong className="block text-white text-[11px]">نمونه ۲ (سوال سخت / معماری)</strong>
                        <span className="text-[10px] text-neutral-400">تدوین فایروال و خودآموزی ➔ هدایت به Claude 3.7 Sonnet</span>
                      </div>
                      <Brain className="w-4 h-4 text-blue-400 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

              {/* فوتر مدال */}
              <div className="p-3 bg-[#161722] border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-mono">
                  Jev Micro-Router v3.2 · Zero Token Waste Engine
                </span>
                <button
                  type="button"
                  onClick={() => setShowGatewayModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex-1 flex h-[calc(100vh-56px)] w-full relative select-none overflow-hidden bg-[#18181b] text-zinc-100"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Explicit Drag & Drop Visual Overlay with AnythingLLM offline banner */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-emerald-950/80 backdrop-blur-md border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150 p-6 text-center">
          <div className="p-4 rounded-2xl bg-emerald-600/30 border border-emerald-400 text-white mb-3 shadow-2xl animate-bounce">
            <FileText className="w-10 h-10 text-emerald-300" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide">
            فایل نامه، سند PDF، اکسل یا گزارش را اینجا رها کنید (AnythingLLM Drag & Drop)
          </h3>
          <p className="text-xs text-emerald-200 mt-1 max-w-lg">
            تحلیل ۱۰۰٪ آفلاین توسط AnythingLLM محلی با امنیت سازمانی و بدون هزینه توکن
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.log,.json,.ps1,.sh,.rsc,.conf,.yaml,.yml"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Mobile Drawer Backdrop */}
      {showMobileSidebar && (
        <div 
          onClick={() => setShowMobileSidebar(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar: Chat Sessions (Minimalist Swiss / ChatGPT Style) */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 bg-[#18181b] border-l border-zinc-800 transition-all duration-300 ease-in-out
        lg:static lg:z-10
        ${showMobileSidebar ? 'translate-x-0 w-72 p-3.5 flex flex-col justify-between shadow-2xl' : 'translate-x-full lg:translate-x-0'}
        ${isSidebarOpen 
          ? 'lg:w-72 lg:opacity-100 lg:p-3.5 lg:flex lg:flex-col lg:justify-between' 
          : 'lg:w-0 lg:opacity-0 lg:p-0 lg:border-l-0 lg:overflow-hidden lg:pointer-events-none'
        }
      `}>
        <div className={`space-y-3 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
          {/* New Chat Button & Collapse Bar */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-800/80">
            <button
              onClick={onCreateSession}
              className="flex-1 py-2 px-3 rounded-xl border border-zinc-700/60 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-100 text-xs font-medium flex items-center justify-between transition-all group shadow-xs"
              title="ایجاد گفتگوی جدید"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400 group-hover:rotate-90 transition-transform" />
                <span>مکالمه جدید</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">({sessions.length})</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="hidden lg:flex p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="بستن سایدبار مکالمات"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Sessions List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5">
            {sortedSessions.map((session) => {
              const active = session.id === currentSessionId;
              const isEditing = editingSessionId === session.id;

              if (isEditing) {
                return (
                  <form
                    key={session.id}
                    onSubmit={(e) => handleSaveRename(session.id, e)}
                    className="p-2 rounded-xl bg-[#18181D] border border-blue-500/60 flex items-center gap-1.5 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingSessionTitle}
                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none px-1"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white"
                      title="ذخیره نام"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSessionId(null)}
                      className="p-1 rounded-md text-neutral-400 hover:text-white"
                      title="انصراف"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    setShowMobileSidebar(false);
                  }}
                  onDoubleClick={(e) => {
                    if (onRenameSession) handleStartRename(session, e);
                  }}
                  className={`group w-full text-right p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'hover:bg-[#18181D] text-neutral-300 hover:text-white border border-transparent hover:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    {session.is_pinned && (
                      <Pin className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-200' : 'text-amber-400'}`} />
                    )}
                    <span className="truncate" title="دابل‌کلیک یا کلیک روی مداد جهت تغییر نام">{session.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Actions for Pin, Rename, Delete */}
                    <div className="flex items-center gap-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {onRenameSession && (
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(session, e)}
                          className={`p-1 rounded transition-colors ${
                            active ? 'text-blue-100 hover:text-white hover:bg-black/25' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                          title="ویرایش عنوان چت"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onTogglePinSession && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinSession(session.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            session.is_pinned 
                              ? 'text-amber-300' 
                              : active 
                              ? 'text-blue-200 hover:text-amber-300 hover:bg-black/25' 
                              : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
                          }`}
                          title={session.is_pinned ? 'حذف پین' : 'پین کردن به بالا'}
                        >
                          {session.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                      )}

                      {onDeleteSession && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            active ? 'text-blue-200 hover:text-red-200 hover:bg-red-700/50' : 'text-neutral-400 hover:text-red-400 hover:bg-neutral-800'
                          }`}
                          title="حذف چت"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-blue-700/60 text-blue-100' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {session.messages.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Card in Sidebar */}
        <div className={`pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate font-mono">@{currentUser.username}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            {currentUser.role}
          </span>
        </div>
      </aside>

      {/* Main Chat Canvas */}
      <div 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 min-w-0 bg-[#18181b] flex flex-col justify-between overflow-hidden relative transition-all duration-300 ease-in-out"
      >
        {/* Drag and Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-sky-950/90 backdrop-blur-sm border-2 border-dashed border-sky-400 flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-150 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-sky-600/30 border border-sky-400 flex items-center justify-center text-sky-200 shadow-xl">
              <Download className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">فایل‌ها و تصاویر را اینجا رها کنید (Drop to Attach)</h4>
              <p className="text-xs text-sky-200/80 mt-1 max-w-sm">
                پشتیبانی خودکار از تصاویر، لاگ‌ها، اسکریپت‌های سیستمی و کانفیگ‌ها
              </p>
            </div>
          </div>
        )}
        {/* Top Control Bar: Minimalist Swiss Typography & Progressive Disclosure (OpenAI & Vercel Style) */}
        <div className="h-12 px-4 border-b border-zinc-800/80 bg-[#18181b]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setShowMobileSidebar(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={isSidebarOpen ? 'بستن پنل سابقه گفتگو' : 'باز کردن پنل سابقه گفتگو'}
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4 text-sky-400" />}
            </button>

            {/* Active Session Title */}
            {currentSession && (
              <div className="flex items-center gap-1.5 text-xs">
                {currentSession.is_pinned && (
                  <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                {editingSessionId === currentSession.id ? (
                  <form onSubmit={(e) => handleSaveRename(currentSession.id, e)} className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={editingSessionTitle}
                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                      className="bg-black/60 border border-sky-500 rounded px-2 py-0.5 text-xs text-white max-w-[140px]"
                    />
                    <button type="submit" className="text-emerald-400"><Check className="w-3 h-3" /></button>
                    <button type="button" onClick={() => setEditingSessionId(null)} className="text-zinc-400"><X className="w-3 h-3" /></button>
                  </form>
                ) : (
                  <span className="font-semibold text-zinc-200 truncate max-w-[150px] md:max-w-[220px]">
                    {currentSession.title}
                  </span>
                )}
              </div>
            )}

            {/* Zero-Pill Minimal Metadata Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500">
              <span>·</span>
              <span className="text-zinc-300 font-medium">
                {availableModels.find(m => m.model_id === selectedModelId || m.id === selectedModelId)?.display_name.split('(')[0] || selectedModelId}
              </span>
              <span>·</span>
              <span className="font-mono text-emerald-400 text-[11px]">18ms</span>
              <span>·</span>
              <span className="text-zinc-400 text-[11px]">
                {workspaceCoreTarget === 'cloud' ? 'Cloud Core' : 'Local Core'}
              </span>
              <span>·</span>
              {isAgentLocallyConnected ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Win Agent</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  <span>Agent Offline</span>
                </span>
              )}
            </div>
          </div>

          {/* 🔀 THE BRIDGE: پل ناوبری حالت‌ها (محیط چت ⇄ اجرای فرامین سطح ۳) */}
          <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-700/80 text-xs shadow-xs">
            {/* حالت چت روان */}
            <button
              type="button"
              onClick={() => {
                setActiveChatView('chat');
                setIsCommandSidePanelOpen(false);
                setContinuityToast('حالت مکالمه: چت‌روم هوشمند');
                setTimeout(() => setContinuityToast(null), 2000);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeChatView === 'chat' && !isCommandSidePanelOpen
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
              title="محیط چت و گفتگوی هوشمند استاندارد"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>چت‌روم</span>
            </button>

            {/* حالت اجرای فرمان (سطح ۳ در بک‌اند) */}
            <button
              type="button"
              onClick={() => {
                setActiveChatView('command_execution');
                setIsCommandSidePanelOpen(false);
                setContinuityToast('حالت بک‌اند: اجرای فرامین (سطح ۳) فعال شد.');
                setTimeout(() => setContinuityToast(null), 2500);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeChatView === 'command_execution'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-zinc-800/40'
              }`}
              title="فعال‌سازی هوش مصنوعی سطح ۳ جهت اجرای فرامین و ساختاردهی تگ‌های سیستمی"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>اجرای فرمان (سطح ۳)</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isAgentLocallyConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>
          </div>

          {/* Left Actions: Command Center Trigger, New Chat & More Options */}
          <div className="flex items-center gap-2">
            {/* The Command Center Button (مرکز فرمان و تنظیمات پردازش) */}
            <button
              type="button"
              onClick={() => setIsCommandDrawerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/70 transition-all text-xs font-medium flex items-center gap-2 shadow-xs"
              title="مرکز فرمان: تنظیمات پردازش، سوییچ مدل‌ها، بازوهای اجرایی و مانیتورینگ شبکه"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span>تنظیمات پردازش</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Quick New Chat Button */}
            <button
              type="button"
              onClick={onCreateSession}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="مکالمه جدید"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* More Menu (Copy / Download) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="امکانات بیشتر"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreMenu && (
                <div className="absolute left-0 mt-2 w-52 bg-[#18181D] border border-neutral-700 rounded-xl shadow-2xl p-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      const chatLog = currentSession?.messages.map(m => `[${m.timestamp}] ${m.role === 'user' ? 'کاربر' : 'دستیار'}:\n${m.content}\n`).join('\n---\n') || '';
                      navigator.clipboard.writeText(chatLog);
                      setCopiedChatToast(true);
                      setTimeout(() => setCopiedChatToast(false), 2500);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-right p-2 rounded-lg hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
                  >
                    <span>کپی تمام مکالمات</span>
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const chatLog = currentSession?.messages.map(m => `[${m.timestamp}] ${m.role === 'user' ? 'کاربر' : 'دستیار'}:\n${m.content}\n`).join('\n---\n') || '';
                      const blob = new Blob([chatLog], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `omniops_chat_${currentSession?.id}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-right p-2 rounded-lg hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
                  >
                    <span>دانلود سابقه گفتگو (.md)</span>
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slide-Over Command Center Drawer (Zero-Popup Architecture) */}
        {isCommandDrawerOpen && (
          <div 
            onClick={() => setIsCommandDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-y-0 left-0 w-80 sm:w-96 md:w-[440px] bg-[#18181b]/98 backdrop-blur-2xl border-r border-zinc-800 z-50 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-250 text-right"
              dir="rtl"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">مرکز فرمان و تنظیمات پردازش</h3>
                      <p className="text-[11px] text-zinc-400 font-mono">Multi-Agent Control & Architecture</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCommandDrawerOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="py-4 space-y-6">
                  {/* 1. Model Selection & Routing Mode */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                        مدل فعال هوش مصنوعی
                      </label>
                      <div className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setModelSelectionMode('omniroute')}
                          className={`px-2 py-1 rounded font-medium transition-all ${
                            modelSelectionMode === 'omniroute'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          OmniRoute
                        </button>
                        <button
                          type="button"
                          onClick={() => setModelSelectionMode('manual')}
                          className={`px-2 py-1 rounded font-medium transition-all ${
                            modelSelectionMode === 'manual'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          دستی
                        </button>
                      </div>
                    </div>

                    {/* Model Cards List */}
                    <div className="space-y-1.5">
                      {[
                        { id: 'ollama/dorna2:8b', name: 'Dorna 2 (8B National Model)', desc: 'موتور Ollama محلی · سرعت بالا · بدون اینترنت', latency: '18ms' },
                        { id: 'deepseek/deepseek-chat', name: 'DeepSeek-R1 (Distill 14B)', desc: 'استدلال عمیق مهندسی · مستقر روی Worker 01', latency: '42ms' },
                        { id: 'internal/ember-1', name: 'Ember-1 (Specialist Agentic)', desc: 'مدل تخصصی بازوی اجرایی · Tool Calling سبک', latency: '12ms' },
                        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'کلاود با تاخیر کم و پایداری بالا', latency: '38ms' },
                        { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'معماری جامع و کدهای حجیم', latency: '65ms' }
                      ].map(m => {
                        const isSelected = selectedModelId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedModelId(m.id);
                              setModelSelectionMode('manual');
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-sky-500/10 border-sky-500/60 text-white shadow-xs'
                                : 'bg-[#27272a]/60 hover:bg-[#27272a] border-zinc-700/50 text-zinc-300'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</div>
                            </div>
                            <div className="text-left font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{m.latency}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Execution Arms Switches */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                      بازوهای اجرایی (Execution Arms)
                    </label>
                    
                    {/* Windows Agent Toggle */}
                    <div className="p-3 rounded-2xl bg-[#27272a]/70 border border-zinc-700/60 flex items-center justify-between backdrop-blur-md">
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-sky-400" />
                          <span>بازوی ویندوز (Windows Agent)</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {isAgentLocallyConnected ? 'متصل به WIN11-LOCAL · پورت 8443' : 'قطع / آماده اتصال'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAgentLocallyConnected(!isAgentLocallyConnected)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          isAgentLocallyConnected ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          isAgentLocallyConnected ? 'left-1' : 'left-4'
                        }`} />
                      </button>
                    </div>

                    {/* Complexity Mode: Fast vs Deep */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAgentComplexityMode('fast')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                          agentComplexityMode === 'fast'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        ⚡ عملکرد سریع (Fast)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgentComplexityMode('deep')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                          agentComplexityMode === 'deep'
                            ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        🧠 استدلال عمیق (Deep)
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Settings for Level 3 Command Execution Mode */}
                  {activeChatView === 'command_execution' && (
                    <div className="space-y-3 pt-3 border-t border-zinc-800 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>تنظیمات پیشرفته اجرای فرمان (سطح ۳)</span>
                        </label>
                      </div>

                      {/* Approval Protocol: Step-by-step vs Autopilot */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-zinc-300 font-medium block">پروتکل تأییدیه (Approval Protocol):</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAgentApprovalMode('approval')}
                            className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                              agentApprovalMode === 'approval'
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🛡️ تأیید گام‌به‌گام
                          </button>
                          <button
                            type="button"
                            onClick={() => setAgentApprovalMode('autopilot')}
                            className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                              agentApprovalMode === 'autopilot'
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🚀 اجرای خودکار
                          </button>
                        </div>
                      </div>

                      {/* Topology & Model Rankings quick buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCommandDrawerOpen(false);
                            setShowTopologyModal(true);
                          }}
                          className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Workflow className="w-3.5 h-3.5 text-purple-400" />
                          <span>توپولوژی ایجنت‌ها</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCommandDrawerOpen(false);
                            setShowModelRankingModal(true);
                          }}
                          className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>رتبه‌بندی مدل‌ها</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Workspace Core Topology */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                      فضای کاری (Workspace Core Topology)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkspaceCoreTarget('local')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                          workspaceCoreTarget === 'local'
                            ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Local Core</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkspaceCoreTarget('cloud')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                          workspaceCoreTarget === 'cloud'
                            ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Cloud (GDrive)</span>
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800 text-[10px] font-mono text-zinc-400 truncate dir-ltr text-left">
                      {isolatedWorkspacePath}
                    </div>
                  </div>

                  {/* 4. Live Cluster Nodes (Glassmorphism Cards) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                        وضعیت زنده گره‌های کلاستر
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTopologyModal(true)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                      >
                        <span>گراف توپولوژی</span>
                        <span>←</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-[#27272a]/70 backdrop-blur-md border border-zinc-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <div>
                            <div className="text-xs font-semibold text-white">Master Control-Plane</div>
                            <div className="text-[10px] text-zinc-400 font-mono">10.88.0.1 · WireGuard Mesh</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">ONLINE</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#27272a]/70 backdrop-blur-md border border-zinc-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <div>
                            <div className="text-xs font-semibold text-white">Worker GPU Node 01</div>
                            <div className="text-[10px] text-zinc-400 font-mono">10.88.0.3 · RTX 4090 · 64GB</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">ONLINE</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#27272a]/70 backdrop-blur-md border border-zinc-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <div>
                            <div className="text-xs font-semibold text-white">Edge UI Mirror (Caddy)</div>
                            <div className="text-[10px] text-zinc-400 font-mono">10.88.0.2 · TLS 1.3 Auto-ACME</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">&lt;150MB</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Active Skills */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                      مهارت‌های فعال ({activeSkillIds.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSkills.slice(0, 6).map(skill => {
                        const isActive = activeSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => onToggleSkill(skill.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                              isActive
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>SuperAdmin Access</span>
                <button
                  type="button"
                  onClick={() => setIsCommandDrawerOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium"
                >
                  تایید و بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Stream: Always Chat Room UI, with backend operating in Chat or Level 3 Command Execution mode */}
        <>
          {activeChatView === 'command_execution' && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-300 font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>حالت فعال بک‌اند: اجرای فرامین (سطح ۳) - تولید خودکار تگ‌های سیستمی و بازوهای ویندوزی</span>
              </span>
              <span className="text-[10px] text-amber-400">OmniOps Core v3.2</span>
            </div>
          )}

          {/* Split Main Canvas: Chat Message Stream + Optional Command Execution Side-Panel */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl w-full mx-auto">
                {currentSession?.messages?.length === 0 && (
                  /* ✨ Pure Conversational AI Welcome & Starter Prompts */
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400 space-y-6 max-w-2xl mx-auto my-auto">
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-sky-400 mx-auto shadow-lg">
                        <Bot className="w-7 h-7" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        OmniOps Enterprise Chat
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                        محیط متمرکز، بدون حاشیه و آماده برای گفتگوی روان، نگارش اسناد رسمی، خلاصه‌سازی اسناد، استخراج اطلاعات و اجرای فرامین سیستمی.
                      </p>
                    </div>

                    {/* 4 Professional Conversational Starter Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setInputText('یک پیش‌نویس نامه رسمی و اداری جهت ارائه گزارش دوره‌ای اقدامات بهبود زیرساخت به همراه جدول دستاوردها تنظیم کن.');
                          textareaRef.current?.focus();
                        }}
                        className="p-3.5 rounded-2xl bg-[#27272a]/70 hover:bg-[#27272a] border border-zinc-700/60 hover:border-zinc-500 transition-all text-zinc-200 group text-xs space-y-1 shadow-xs text-right"
                      >
                        <div className="flex items-center gap-2 font-semibold text-white group-hover:text-sky-300">
                          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>نگارش پیش‌نویس نامه رسمی و اداری</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          تنظیم متن رسمی مکاتبات سازمانی با رعایت فرمت و استانداردهای اداری
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMediaIntent('document_rag');
                          if (attachments.length === 0) {
                            fileInputRef.current?.click();
                          } else {
                            setInputText('خلاصه جامع تحلیلی، استخراج بندهای کلیدی و احکام صادرشده در این سند را تدوین کن.');
                          }
                          textareaRef.current?.focus();
                        }}
                        className="p-3.5 rounded-2xl bg-[#27272a]/70 hover:bg-[#27272a] border border-zinc-700/60 hover:border-zinc-500 transition-all text-zinc-200 group text-xs space-y-1 shadow-xs text-right"
                      >
                        <div className="flex items-center gap-2 font-semibold text-white group-hover:text-emerald-300">
                          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>تحلیل و خلاصه‌سازی هوشمند اسناد</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          مطالعه آفلاین فایل‌های PDF و Word، استخراج نکات اصلی و تصمیمات کلیدی
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputText('دیاگرام جامع معماری شبکه با روتر مرکزی، فایروال ایزوله، سوئیچ‌های لایه ۳ و کلاینت‌ها را به عنوان دیاگرام فنی ترسیم کن.');
                          setActiveMediaIntent('image');
                          textareaRef.current?.focus();
                        }}
                        className="p-3.5 rounded-2xl bg-[#27272a]/70 hover:bg-[#27272a] border border-zinc-700/60 hover:border-zinc-500 transition-all text-zinc-200 group text-xs space-y-1 shadow-xs text-right"
                      >
                        <div className="flex items-center gap-2 font-semibold text-white group-hover:text-purple-300">
                          <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>تولید دیاگرام و نقشه‌های مفهومی</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          رندر بصری فلوچارت‌های فنی، توپولوژی شبکه و معماری سیستم‌ها
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputText('جدول مقایسه‌ای مزایا، معایب، هزینه‌ها و الزامات فنی مهاجرت به سرویس‌های ابری هیبرید را تدوین کن.');
                          textareaRef.current?.focus();
                        }}
                        className="p-3.5 rounded-2xl bg-[#27272a]/70 hover:bg-[#27272a] border border-zinc-700/60 hover:border-zinc-500 transition-all text-zinc-200 group text-xs space-y-1 shadow-xs text-right"
                      >
                        <div className="flex items-center gap-2 font-semibold text-white group-hover:text-amber-300">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>استخراج جدول و مقایسه داده‌ها</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          تهیه ماتریس تصمیم‌گیری، تحلیل شاخص‌های فنی و دسته‌بندی آماری
                        </p>
                      </button>
                    </div>
                  </div>
                )}

          {currentSession?.messages?.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                  isUser
                    ? 'bg-zinc-700 text-zinc-100 font-bold'
                    : 'bg-zinc-800 border border-zinc-700/60 text-sky-400 mt-0.5'
                }`}>
                  {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`${
                  isUser
                    ? 'max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-xs px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs bg-[#27272a] text-zinc-100 border border-zinc-700/60'
                    : 'flex-1 max-w-full sm:max-w-[88%] text-xs sm:text-sm leading-relaxed text-zinc-200 space-y-3 select-text'
                }`}>
                  {/* Subtle tool intent pill on User Message */}
                  {isUser && msg.is_command_mode && (
                    <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-white/20 text-[10px] font-mono text-amber-200">
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>دستور اجرایی (ترکیب با ابزارها)</span>
                    </div>
                  )}
                  {/* Attachments inside message bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="relative group">
                          {att.type === 'image' && att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              onClick={() => setLightboxMedia({ url: att.previewUrl!, title: att.name, type: 'image' })}
                              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/10 text-[11px] font-mono">
                              <FileText className="w-4 h-4 text-blue-300" />
                              <span className="truncate max-w-[120px]">{att.name}</span>
                              <span className="text-[10px] opacity-75">{formatFileSize(att.size)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Generated Multimedia Cards (Image / Video / Topology Diagram) */}
                  {msg.generated_media && msg.generated_media.length > 0 && (
                    <div className="space-y-3">
                      {msg.generated_media.map((media) => (
                        <div 
                          key={media.id} 
                          className="bg-[#101014] border border-blue-500/30 rounded-xl overflow-hidden shadow-xl"
                        >
                          <div className="px-3.5 py-2 bg-[#16161C] border-b border-neutral-800 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              {media.type === 'video' ? <Video className="w-3.5 h-3.5 text-purple-400" /> : <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
                              <span>{media.title}</span>
                            </span>
                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                              {media.model}
                            </span>
                          </div>

                          <div className="relative group">
                            {media.type === 'video' ? (
                              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                <video
                                  src={media.url}
                                  controls
                                  autoPlay
                                  loop
                                  muted
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-purple-300 text-[10px] font-mono flex items-center gap-1">
                                  <Workflow className="w-3 h-3" />
                                  <span>شبیه‌سازی تعاملی متحرک</span>
                                </div>
                              </div>
                            ) : (
                              <div className="relative cursor-pointer" onClick={() => setLightboxMedia({ url: media.url, title: media.title, type: 'image' })}>
                                <img
                                  src={media.url}
                                  alt={media.title}
                                  className="w-full max-h-72 object-cover rounded-b-xl hover:opacity-95 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-semibold flex items-center gap-1.5">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>مشاهده با وضوح بالا</span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 bg-[#121216] flex items-center justify-between text-[11px] text-neutral-400">
                            <span className="truncate max-w-xs">{media.prompt}</span>
                            <a
                              href={media.url}
                              download={`omniops_${media.type}_${media.id}.png`}
                              className="p-1 hover:text-white transition-colors"
                              title="دانلود مدیا"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active skills injected tag */}
                  {msg.active_skills_used && msg.active_skills_used.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {msg.active_skills_used.map((skId) => {
                        const sk = availableSkills.find((s) => s.id === skId);
                        return (
                          <span
                            key={skId}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>دانش: {sk?.name.split(' ')[0] || skId}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Distinct Tool & Command Execution Smart Card (High-Tech Terminal / RBAC Security Rejection) */}
                  {msg.tool_execution && (
                    <div className={`rounded-xl border overflow-hidden text-xs my-2 font-mono ${
                      msg.tool_execution.status === 'permission_denied'
                        ? 'bg-[#1C0D10] border-red-500/60 shadow-lg shadow-red-950/40 text-red-200'
                        : 'bg-[#0B0D14] border-blue-500/40 shadow-xl text-neutral-200'
                    }`}>
                      {/* Card Header */}
                      <div className={`px-3.5 py-2.5 border-b flex items-center justify-between text-xs ${
                        msg.tool_execution.status === 'permission_denied'
                          ? 'bg-red-950/60 border-red-500/40'
                          : 'bg-[#121622] border-neutral-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          {msg.tool_execution.status === 'permission_denied' ? (
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                          ) : (
                            <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span className="font-bold text-white tracking-wide">
                            {msg.tool_execution.status === 'permission_denied'
                              ? `محدودیت امنیتی RBAC: ${msg.tool_execution.tool_name}`
                              : `ابزار عملیاتی سیستم: ${msg.tool_execution.tool_name}`}
                          </span>
                        </div>

                        {/* Status Badge & Execution Arm */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {msg.tool_execution.execution_arm && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              {msg.tool_execution.execution_arm}
                            </span>
                          )}
                          {msg.tool_execution.status === 'permission_denied' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-red-400" />
                              <span>دسترسی غیرمجاز در پروفایل</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>مجوز پروفایل تایید شد (Exit: 0)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Permission Denied Content */}
                      {msg.tool_execution.status === 'permission_denied' ? (
                        <div className="p-4 space-y-3 font-sans">
                          <div className="flex items-start gap-2.5 text-red-300">
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h5 className="font-bold text-sm text-red-200">
                                ⛔ عدم احراز مجوز در پروفایل کاربر (@{currentUser.username})
                              </h5>
                              <p className="text-xs text-red-300/90 leading-relaxed">
                                بر اساس صحت‌سنجی مشخصات پروفایل کاربری، شما مجوز دسترسی به بازوی اجرایی «{msg.tool_execution.tool_name}» را ندارید. هوش مصنوعی به منظور حفظ امنیت زیرساخت، اجرای خودکار این فرمان را متوقف نمود.
                              </p>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-black/50 border border-red-500/30 font-mono text-[11px] text-red-400/90 flex items-center justify-between" dir="ltr">
                            <span className="line-through truncate"># [BLOCKED] {msg.tool_execution.command}</span>
                            <span className="text-[10px] text-red-400 shrink-0 mr-2 font-sans font-semibold">رد شده توسط سطح دسترسی</span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-red-950/25 border border-red-500/20 text-[11px] text-neutral-300 leading-relaxed">
                            💡 <span className="font-semibold text-white">راهنمای فعال‌سازی:</span> جهت دریافت مجوز، از مدیر ارشد سیستم (SuperAdmin) بخواهید در تب «کاربران و امنیت» دسترسی ابزار «{msg.tool_execution.tool_name}» را برای حساب شما فعال کند.
                          </div>
                        </div>
                      ) : (
                        /* Success Command Execution Content */
                        <div className="space-y-0">
                          {/* Command Line Bar */}
                          <div className="p-2.5 bg-black/60 border-b border-neutral-800 text-[11px] flex items-center justify-between gap-2 overflow-x-auto" dir="ltr">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-emerald-400 font-bold shrink-0">agent@client:~#</span>
                              <span className="text-white font-semibold truncate">{msg.tool_execution.command}</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(msg.tool_execution!.command, msg.tool_execution!.id)}
                              className="p-1 text-neutral-400 hover:text-white shrink-0 transition-colors"
                              title="کپی دستور"
                            >
                              {copiedOutputId === msg.tool_execution.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Live Terminal Output Window */}
                          {msg.tool_execution.output && (
                            <div className="p-3 bg-[#08090E] text-[11px] text-neutral-300 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed border-b border-neutral-800/80 select-text" dir="ltr">
                              {msg.tool_execution.output}
                            </div>
                          )}

                          {/* Execution Metadata Footer */}
                          <div className="p-2 bg-[#0F121B] flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Agent: {currentUser.agent_ip || '192.168.1.104'} (v2.4)</span>
                              <span>·</span>
                              <span>زمان اجرا: {msg.tool_execution.executed_at || msg.timestamp}</span>
                            </div>
                            <button
                              onClick={() => handleSendToolCommand(msg.tool_execution!.tool_id, msg.tool_execution!.tool_name, msg.tool_execution!.command)}
                              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-sans transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>اجرای مجدد</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local Document Analysis & Administrative Letter Smart Card (AnythingLLM RAG Engine - 0 Online Tokens) */}
                  {msg.document_analysis && (
                    <div className="rounded-xl border border-emerald-500/35 bg-[#0B0F15] overflow-hidden my-3 shadow-xl text-neutral-200">
                      {/* Card Header */}
                      <div className="px-3.5 py-2.5 bg-[#101720] border-b border-emerald-500/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white tracking-wide">
                            {msg.document_analysis.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>AnythingLLM Local (۰ توکن)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            ⚡ {msg.document_analysis.tokensSavedEstimate.toLocaleString('fa-IR')} توکن ذخیره شد
                          </span>
                        </div>
                      </div>

                      {/* Document Meta Row */}
                      <div className="px-4 py-2 bg-[#0E131A] border-b border-neutral-800 text-[11px] flex flex-wrap items-center justify-between gap-2 text-neutral-400">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">فایل پردازش‌شده:</span>
                          <span className="font-mono text-white font-semibold">{msg.document_analysis.fileName}</span>
                          <span>({formatFileSize(msg.document_analysis.fileSize)})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>پردازش آفلاین محلی (۱۰۰٪ محرمانه درون‌سازمانی)</span>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="p-4 space-y-3.5 text-xs">
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl leading-relaxed text-emerald-100">
                          <span className="font-bold text-emerald-400 block mb-1">خلاصه مدیریتی و اجرایی:</span>
                          {msg.document_analysis.summary}
                        </div>

                        {/* Key Points */}
                        {msg.document_analysis.keyPoints && msg.document_analysis.keyPoints.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-neutral-300 text-[11px]">نکات کلیدی و بندهای استخراج‌شده:</span>
                            <div className="space-y-1">
                              {msg.document_analysis.keyPoints.map((pt, pIdx) => (
                                <div key={pIdx} className="flex items-start gap-2 text-neutral-300 text-[11px]">
                                  <span className="text-emerald-400 font-bold select-none">•</span>
                                  <span>{pt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Official Administrative Letter Draft (پیش‌نویس پاسخ رسمی و اداری) */}
                        {msg.document_analysis.letterDraft && (
                          <div className="rounded-xl border border-blue-500/30 bg-[#0E1422] p-4 space-y-2.5 font-sans">
                            <div className="flex items-center justify-between pb-2 border-b border-blue-500/20 text-xs">
                              <span className="font-bold text-blue-300 flex items-center gap-1.5">
                                <span>📝 پیش‌نویس پاسخ رسمی و اداری (Official Letter Draft)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const letterText = `موضوع: ${msg.document_analysis!.letterDraft!.subject}\nگیرنده: ${msg.document_analysis!.letterDraft!.recipient}\nفرستنده: ${msg.document_analysis!.letterDraft!.sender}\n\n${msg.document_analysis!.letterDraft!.body}\n\nاقدام لازم: ${msg.document_analysis!.letterDraft!.actionRequired}`;
                                  navigator.clipboard.writeText(letterText);
                                  setCopiedLetterId(msg.document_analysis!.id);
                                  setTimeout(() => setCopiedLetterId(null), 2000);
                                }}
                                className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-[10px] flex items-center gap-1 transition-colors"
                              >
                                {copiedLetterId === msg.document_analysis.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedLetterId === msg.document_analysis.id ? 'کپی شد!' : 'کپی متن نامه اداری'}</span>
                              </button>
                            </div>

                            <div className="text-[11px] space-y-1.5 text-neutral-300">
                              <div className="flex gap-2">
                                <span className="text-neutral-500 shrink-0 font-medium">موضوع:</span>
                                <span className="font-bold text-white">{msg.document_analysis.letterDraft.subject}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-neutral-500 shrink-0 font-medium">گیرنده:</span>
                                <span className="text-neutral-200">{msg.document_analysis.letterDraft.recipient}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-neutral-500 shrink-0 font-medium">فرستنده:</span>
                                <span className="text-neutral-200">{msg.document_analysis.letterDraft.sender}</span>
                              </div>
                              <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap mt-2">
                                {msg.document_analysis.letterDraft.body}
                              </div>
                              <div className="flex items-center gap-2 pt-1 text-[10px] text-amber-300/90">
                                <span>📌 اقدام لازم:</span>
                                <span>{msg.document_analysis.letterDraft.actionRequired}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tabular Analysis (If document was spreadsheet/financial) */}
                        {msg.document_analysis.tableData && (
                          <div className="rounded-xl border border-neutral-800 bg-[#0E1117] overflow-x-auto">
                            <table className="w-full text-right text-[11px]">
                              <thead>
                                <tr className="bg-[#141822] border-b border-neutral-800 text-neutral-400">
                                  {msg.document_analysis.tableData.headers.map((h, hIdx) => (
                                    <th key={hIdx} className="px-3 py-2 font-semibold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-800/60">
                                {msg.document_analysis.tableData.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-neutral-800/30">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-3 py-2 text-neutral-300 font-mono text-[10px]">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 py-2 bg-[#0C1016] border-t border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                        <span>موتور اجرای محلی: AnythingLLM + Langflow Offline Workflow</span>
                        <span className="font-mono text-emerald-400">Tokens Consumed: 0 (Free Offline)</span>
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed select-text">{msg.content}</div>

                  {/* Actions & Metadata Row */}
                  <div className={`pt-2 mt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] ${
                    isUser ? 'border-white/20 text-blue-100' : 'border-neutral-800/80 text-neutral-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.model_used && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{msg.model_used}</span>
                        </>
                      )}
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
                      {/* Copy message text */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          setCopiedMessageId(msg.id);
                          setTimeout(() => setCopiedMessageId(null), 2000);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isUser ? 'hover:bg-white/20 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title="کپی متن پیام"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Text-to-Speech */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(msg.id, msg.content)}
                          className={`p-1 rounded transition-colors ${
                            speakingMessageId === msg.id
                              ? 'bg-blue-600/30 text-blue-300'
                              : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title={speakingMessageId === msg.id ? 'توقف خواندن صوتی' : 'پخش صوتی پیام'}
                        >
                          <Volume2 className={`w-3 h-3 ${speakingMessageId === msg.id ? 'animate-pulse text-blue-400' : ''}`} />
                        </button>
                      )}

                      {/* Thumbs up / down feedback */}
                      {!isUser && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMessageFeedback((prev) => ({
                                ...prev,
                                [msg.id]: prev[msg.id] === 'up' ? (undefined as any) : 'up'
                              }));
                            }}
                            className={`p-1 rounded transition-colors ${
                              messageFeedback[msg.id] === 'up'
                                ? 'text-emerald-400 bg-emerald-500/15'
                                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title="پاسخ مناسب بود"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMessageFeedback((prev) => ({
                                ...prev,
                                [msg.id]: prev[msg.id] === 'down' ? (undefined as any) : 'down'
                              }));
                            }}
                            className={`p-1 rounded transition-colors ${
                              messageFeedback[msg.id] === 'down'
                                ? 'text-red-400 bg-red-500/15'
                                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title="نیاز به بازنگری دارد"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Message Footnotes & OmniRoute / Network Badges */}
                  {!isUser && msg.omni_route && (
                    <div className="pt-2 mt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-[11px] font-mono text-amber-300/90">
                      <div className="flex items-center gap-1.5 truncate">
                        <Shuffle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{msg.omni_route.hop_flow}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                        {msg.omni_route.failover_occurred && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            سوییچ خودکار
                          </span>
                        )}
                        <span className="text-neutral-400 font-sans">{msg.omni_route.latency_ms}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-[#18181D] border border-neutral-700 flex items-center justify-center text-blue-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-[#18181D] border border-neutral-800 rounded-2xl rounded-bl-sm text-xs text-neutral-300 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>
                  {isFindingBestProvider 
                    ? 'Finding best provider... Claude Code → OmniRoute → Provider (کنترل‌کننده ترافیک هوشمند)' 
                    : activeMediaIntent === 'image' 
                    ? 'در حال رندر و ترسیم دیاگرام تصویری توسط هوش مصنوعی...' 
                    : activeMediaIntent === 'video' 
                    ? 'در حال تولید انیمیشن شبیه‌سازی شبکه...' 
                    : activeMediaIntent === 'document_rag'
                    ? 'در حال خواندن و تحلیل سند توسط AnythingLLM محلی بدون کسر توکن ابری...'
                    : 'در حال تحلیل با پایگاه دانش تخصصی و تدوین پاسخ...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dedicated Command Execution Side Panel (پل دوگانه در حالت اسپیلیت) */}
        {isCommandSidePanelOpen && (
          <div className="w-80 sm:w-[420px] lg:w-[480px] border-r border-zinc-800 bg-[#18181b] overflow-y-auto p-3.5 shrink-0 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200" dir="rtl">
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">پل دوگانه: کنسول اجرای فرامین</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">LIVE BRIDGE</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCommandSidePanelOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="بستن پنل جانبی"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderCommandExecutionConsole(true)}
            </div>
          </div>
        )}
      </div>

        {/* Pending Attachments Strip (Before Sending) */}
        {attachments.length > 0 && (
          <div className="px-4 py-2.5 bg-[#101013] border-t border-neutral-800/80 space-y-2">
            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="text-[11px] text-neutral-400 font-medium">ضمیمه‌ها ({attachments.length}):</span>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 pl-2.5 bg-[#18181D] border border-neutral-700/80 rounded-xl text-xs text-neutral-200"
                >
                  {att.type === 'image' && att.previewUrl ? (
                    <img src={att.previewUrl} alt={att.name} className="w-6 h-6 object-cover rounded-lg" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="truncate max-w-[140px] text-[11px] font-mono">{att.name}</span>
                  <span className="text-[10px] text-neutral-500">({formatFileSize(att.size)})</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Document Actions (AnythingLLM RAG Shortcuts) */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/60 overflow-x-auto text-[11px]">
              <span className="text-neutral-400 text-[10px] shrink-0 font-medium">دستورات سریع سند AnythingLLM:</span>
              <button
                type="button"
                onClick={() => {
                  setActiveMediaIntent('document_rag');
                  setInputText('تحلیل کامل این سند و نگارش پیش‌نویس پاسخ رسمی، اداری و استاندارد با ذکر موضوع و گیرنده');
                }}
                className="px-2.5 py-0.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 shrink-0 flex items-center gap-1 transition-all"
              >
                <span>📝 نگارش پاسخ اداری</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMediaIntent('document_rag');
                  setInputText('استخراج خلاصه تحلیلی، نکات کلیدی و بندهای الزامی سند');
                }}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1 transition-all"
              >
                <span>📊 خلاصه مدیریتی</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMediaIntent('document_rag');
                  setInputText('استخراج داده‌های عددی، اقلام مالی و ترسیم جدول تحلیلی از محتوای سند');
                }}
                className="px-2.5 py-0.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 shrink-0 flex items-center gap-1 transition-all"
              >
                <span>📈 استخراج ارقام و جدول</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Media Intent Badge (If user activated image/video/doc mode) */}
        {activeMediaIntent && (
          <div className="px-4 py-1.5 bg-blue-900/20 border-t border-blue-500/20 flex items-center justify-between text-xs text-blue-300">
            <span className="flex items-center gap-1.5 font-medium">
              {activeMediaIntent === 'image' ? (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>حالت درخواست تولید دیاگرام تصویری فعال است</span>
                </>
              ) : activeMediaIntent === 'video' ? (
                <>
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>حالت درخواست شبیه‌سازی ویدیویی متحرک فعال است</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>حالت تحلیل اسناد و نامه‌نگاری محلی (AnythingLLM بدون مصرف توکن آنلاین) فعال است</span>
                </>
              )}
            </span>
            <button
              onClick={() => setActiveMediaIntent(null)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              ✕ لغو
            </button>
          </div>
        )}

        {/* Service Inactive Warning Toast */}
        {serviceInactiveToast && (
          <div className="px-4 py-2 bg-amber-950/40 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-300 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{serviceInactiveToast}</span>
              {onNavigateToServerInfra && (
                <button
                  type="button"
                  onClick={onNavigateToServerInfra}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-semibold transition-all mr-1"
                >
                  رفتن به زیرساخت سرور برای استقرار تک‌کلیک
                </button>
              )}
            </div>
            <button
              onClick={() => setServiceInactiveToast(null)}
              className="text-neutral-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sticky Input Area (ChatGPT Inset Architecture) */}
        <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#18181b] via-[#18181b]/95 to-transparent pt-4 pb-4 px-3 sm:px-6">
          <div className="max-w-3xl mx-auto w-full">
            <form 
              onSubmit={handleSend}
              className="bg-[#27272a]/95 backdrop-blur-xl border border-zinc-700/70 focus-within:border-zinc-500 rounded-3xl p-3 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-sky-500/20"
            >
              {/* Attachments preview list inside the input card */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pb-2 mb-2 border-b border-zinc-700/60">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-800 text-[11px] text-zinc-200 border border-zinc-700">
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-zinc-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-expanding Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="پیام یا درخواست خود را بنویسید... (عکس یا اسناد را با Ctrl+V یا Drag & Drop پیست کنید)"
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 resize-none px-2 py-1 max-h-44 min-h-[38px] leading-relaxed"
              />

              {/* Inset Action Bar (Minimal Controls within the input box) */}
              <div className="flex items-center justify-between pt-2 px-1">
                {/* Right inset controls */}
                <div className="flex items-center gap-1.5">
                  {/* "ارسال فایل" button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
                    title="ارسال فایل یا سند (PDF, Word, Code, Image)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* "فعال‌سازی ایجنت ویندوز" Inset Toggle Badge */}
                  <button
                    type="button"
                    onClick={() => setIsAgentLocallyConnected(!isAgentLocallyConnected)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isAgentLocallyConnected
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                        : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 hover:text-zinc-200 hover:border-zinc-600'
                    }`}
                    title={isAgentLocallyConnected ? 'ایجنت ویندوز متصل است (کلیک برای قطع)' : 'فعال‌سازی و اتصال به ایجنت ویندوز'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAgentLocallyConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    <Laptop className="w-3 h-3" />
                    <span>ایجنت ویندوز: {isAgentLocallyConnected ? 'متصل' : 'غیرفعال'}</span>
                  </button>

                  {/* Plus menu for smart intents */}
                  <div className="relative" ref={plusMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowGeminiPlusMenu(!showGeminiPlusMenu)}
                      className={`p-1.5 rounded-full transition-colors ${showGeminiPlusMenu || activeMediaIntent ? 'bg-sky-500/20 text-sky-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'}`}
                      title="امکانات هوشمند و چندرسانه‌ای"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {/* Floating Popover Menu */}
                    {showGeminiPlusMenu && (
                      <div 
                        className="absolute bottom-full right-0 mb-3 w-80 md:w-96 bg-[#18181b]/98 border border-zinc-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
                        dir="rtl"
                      >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-xs font-bold text-white">امکانات هوشمند و چندرسانه‌ای</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            OmniOps Engine
                          </span>
                        </div>

                        <div className="space-y-1">
                          {/* 1. Document RAG */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!isDocumentEngineActive) {
                                setServiceInactiveToast('سرویس پردازش اسناد (AnythingLLM / JEV) متوقف است.');
                                setShowGeminiPlusMenu(false);
                                return;
                              }
                              setActiveMediaIntent('document_rag');
                              setShowGeminiPlusMenu(false);
                              if (attachments.length === 0) {
                                fileInputRef.current?.click();
                              } else if (!inputText) {
                                setInputText('تحلیل جامع سند، استخراج مفاد کلیدی و تدوین پیش‌نویس پاسخ رسمی و اداری با AnythingLLM و JEV');
                              }
                            }}
                            className="w-full text-right p-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-start gap-2.5 text-zinc-200"
                          >
                            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-white">تحلیل سند و نامه‌نگاری اداری (AnythingLLM + JEV)</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                  بدون کسر توکن
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                                استخراج آفلاین مفاد PDF و Word با هوش مصنوعی محلی
                              </p>
                            </div>
                          </button>

                          {/* 2. Image Generation */}
                          <button
                            type="button"
                            disabled={!supportsImage}
                            onClick={() => {
                              setActiveMediaIntent('image');
                              setShowGeminiPlusMenu(false);
                              if (!inputText) setInputText('دیاگرام معماری و توپولوژی شبکه را به صورت تصویر شماتیک با جزئیات فنی ترسیم کن');
                            }}
                            className={`w-full text-right p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                              supportsImage ? 'hover:bg-zinc-800 text-zinc-200' : 'opacity-40 cursor-not-allowed text-zinc-500'
                            }`}
                          >
                            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-white block">تولید دیاگرام و تصویر هوش مصنوعی</span>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                                رندر گرافیکی معماری سرور، نقشه شبکه و دیاگرام‌های فنی
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Left inset: Send button */}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && attachments.length === 0) || isSending}
                    className="p-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-30 disabled:hover:bg-zinc-100 transition-all shadow-md flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                    title="ارسال پیام (Enter)"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </form>
            <div className="text-center text-[10px] text-zinc-500 mt-2">
              OmniOps Enterprise · سیستم ارکستراسیون چند-عاملی سازمانی با امنیت Zero-Trust
            </div>
          </div>
        </div>
      </>
    </div>

      {/* Lightbox Modal for Full Image / Video Inspection */}
      {lightboxMedia && (
        <div 
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {lightboxMedia.type === 'video' ? (
              <video 
                src={lightboxMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[85vh] rounded-xl border border-neutral-700 shadow-2xl" 
              />
            ) : (
              <img 
                src={lightboxMedia.url} 
                alt={lightboxMedia.title} 
                className="max-w-full max-h-[85vh] object-contain rounded-xl border border-neutral-700 shadow-2xl" 
              />
            )}
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-3 left-3 p-2 bg-neutral-900/80 text-white rounded-full hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Core Admin Memory & Failover Inspector */}
      {showCoreMemoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>حافظه ماندگار هسته ادمین و وضعیت پایداری اولاما</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Zero-Downtime
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">قواعد حیاتی معماری که سیستم و چت‌بات مرکزی هیچ‌گاه فراموش نمی‌کنند</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoreMemoryModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ollama Local Resilience Banner */}
            <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1.5 text-xs text-blue-200">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تاب‌آوری ۱۰۰٪ پایدار با هسته لوکال Ollama (Llama 3.1:8b):</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                ارکستراتور مرکزی ادمین مستقیماً به کانتینر لوکال اولاما متصل است. در صورت اختلال در APIهای خارجی یا اتمام سهمیه توکن، مکالمات فوراً و بدون وقفه به صورت آفلاین ادامه می‌یابند.
              </p>
            </div>

            {/* List of Persistent Memory Rules */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-neutral-300 block">قوانین و فرایندهای ثبت‌شده در حافظه دائم:</span>
              {activeCoreMemories.map((mem: any) => (
                <div key={mem.id || mem.key} className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{mem.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      #{mem.key}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">{mem.content}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCoreMemoryModal(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OmniRoute Smart Traffic Controller & Failover Inspector */}
      {showOmniRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-amber-500/40 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Shuffle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>کنترل‌کننده هوشمند ترافیک OmniRoute</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      Zero-Downtime Traffic Routing
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    لایه مسیریابی رایگان متصل‌کننده کلاینت به مجموعه بزرگی از ارائه‌دهندگان بدون وابستگی به یک Provider
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOmniRouteModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architecture Flow Banner */}
            <div className="p-4 rounded-xl bg-[#0f1118] border border-neutral-800 space-y-3">
              <span className="text-[11px] font-bold text-neutral-300 block">جریان مسیریابی هوشمند ترافیک (Traffic Flow Pipeline):</span>
              <div className="flex items-center justify-between gap-2 p-3 bg-black/60 rounded-xl border border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-300" dir="ltr">
                <div className="px-3 py-1.5 rounded-lg bg-blue-600/25 border border-blue-500/40 text-blue-200 font-bold shrink-0">
                  Claude Code
                </div>
                <span className="text-amber-400 font-bold">➔</span>
                <div className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-cyan-500/25 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 shrink-0">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>OmniRoute Layer</span>
                </div>
                <span className="text-emerald-400 font-bold">➔</span>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 font-bold shrink-0">
                  Best Available Provider
                </div>
              </div>
            </div>

            {/* Core OmniRoute Principles (Four Feature Pillars) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#111116] rounded-xl border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>مسیریابی بین همه APIها</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  به جای وابستگی به یک Provider، درخواست‌ها بین چندین سرویس ابری و محلی اولاما جابه‌جا می‌شوند.
                </p>
              </div>

              <div className="p-3 bg-[#111116] rounded-xl border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Workflow className="w-4 h-4 text-amber-400" />
                  <span>یافتن بهترین ارائه‌دهنده</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  بررسی وضعیت آنلاین بودن و تاخیر پاسخ‌دهی (Latency) و هدایت خودکار به سریع‌ترین گزینه.
                </p>
              </div>

              <div className="p-3 bg-[#111116] rounded-xl border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <AlertCircle className="w-4 h-4 text-emerald-400" />
                  <span>فرایند سوییچ خودکار در محدودیت</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  در صورت رسیدن Provider به محدودیت (Rate Limit)، بدون توقف نشست درخواست به گزینه بعدی منتقل می‌شود.
                </p>
              </div>

              <div className="p-3 bg-[#111116] rounded-xl border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>توقف کمتر، زمان بیشتر</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  جلسات کاری و اجرای دستورات با پایداری کامل و بدون قطعی جریان فعالیت ادامه می‌یابند.
                </p>
              </div>
            </div>

            {/* Provider Pool Status Table & Interactive Simulation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">استخر ارائه‌دهندگان تحت مدیریت OmniRoute:</span>
                <button
                  type="button"
                  onClick={() => {
                    setOmniRoutePool((prev) => prev.map((p) => ({ ...p, status: 'available' })));
                    setFailoverBanner(null);
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  🔄 بازنشانی تمام ارائه‌دهندگان به وضعیت آماده
                </button>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-[#0d0d12] overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#14141c] border-b border-neutral-800 text-neutral-400 text-[11px]">
                      <th className="px-3.5 py-2 font-semibold">ارائه‌دهنده و مدل هوش مصنوعی</th>
                      <th className="px-3 py-2 font-semibold">تاخیر (Latency)</th>
                      <th className="px-3 py-2 font-semibold">اولویت</th>
                      <th className="px-3 py-2 font-semibold">وضعیت دسترس‌پذیری</th>
                      <th className="px-3 py-2 font-semibold">عملیات شبیه‌سازی سوییچ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {omniRoutePool.map((p) => {
                      const isReady = p.status === 'available';
                      return (
                        <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="px-3.5 py-2.5 font-sans">
                            <span className="font-bold text-white block text-xs">{p.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{p.desc}</span>
                          </td>
                          <td className="px-3 py-2.5 text-cyan-300 text-[11px]">{p.latencyMs} ms</td>
                          <td className="px-3 py-2.5 text-neutral-400 text-[11px]">#{p.priority}</td>
                          <td className="px-3 py-2.5">
                            {isReady ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>آماده (Available)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>محدود شده (Rate-Limited)</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-sans">
                            <button
                              type="button"
                              onClick={() => {
                                setOmniRoutePool((prev) =>
                                  prev.map((item) =>
                                    item.id === p.id
                                      ? { ...item, status: isReady ? 'rate_limited' : 'available' }
                                      : item
                                  )
                                );
                                if (isReady) {
                                  const other = omniRoutePool.find((item) => item.id !== p.id && item.status === 'available');
                                  setFailoverBanner(
                                    `سوییچ خودکار OmniRoute: ارائه‌دهنده «${p.name}» محدود گردید (کنار گذاشته شد) ➔ درخواست بدون توقف نشست به «${other?.name || 'ارائه‌دهنده بعدی'}» منتقل گردید. (توقف کمتر، زمان بیشتر)`
                                  );
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                                isReady
                                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isReady ? 'شبیه‌سازی محدودیت توکن' : 'آزادسازی سهمیه'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-mono">
                OmniRoute Version 2.8.4 · Zero Downtime Routing Engine
              </span>
              <button
                type="button"
                onClick={() => setShowOmniRouteModal(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Model Ranking Dynamic Selector Modal */}
      {showModelRankingModal && (
        <ModelRankingSelectorModal
          isOpen={showModelRankingModal}
          onClose={() => setShowModelRankingModal(false)}
          availableModels={availableModels}
          selectedModelId={selectedModelId}
          onSelectModel={(newModelId) => {
            setSelectedModelId(newModelId);
            const mod = availableModels.find(m => m.model_id === newModelId || m.id === newModelId);
            setContinuityToast(`مدل «${mod?.display_name || newModelId}» با موفقیت فعال شد.`);
            setTimeout(() => setContinuityToast(null), 3000);
          }}
        />
      )}

      {/* MODAL: Multi-Agent Topology Live Network Modal */}
      {showTopologyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
          <div className="bg-[#12131C] border border-amber-500/40 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">توپولوژی زنده ارکستراسیون چندعاملی سطح ۳ (Multi-Agent Topology)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTopologyModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MultiAgentTopologyDashboard />
          </div>
        </div>
      )}
    </div>
  );
};
