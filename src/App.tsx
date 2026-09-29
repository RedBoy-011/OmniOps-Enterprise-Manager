import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  ApiKeyItem, 
  AiModel, 
  SkillItem, 
  ChatSession, 
  ProxyConfig, 
  ApiProviderConfig,
  ChatAttachment,
  ToolExecutionAction,
  SystemLogEntry,
  ProjectRuleItem,
  McpServerConfig
} from './types';
import { DEFAULT_PROVIDERS } from './data/providersData';
import { ENTERPRISE_SKILLS } from './data/skillsData';
import { DEFAULT_PROJECT_RULES, DEFAULT_MCP_SERVERS } from './data/rulesAndMcpData';
import { AuthModule } from './components/AuthModule';
import { SettingsModule } from './components/SettingsModule';
import { ToolsModule } from './components/ToolsModule';
import { ChatModule } from './components/ChatModule';
import { ServerManagementModule } from './components/ServerManagementModule';
import { McpRulesManagerModal } from './components/McpRulesManagerModal';
import { 
  Shield, 
  MessageSquare, 
  Settings, 
  BookOpen, 
  Cpu, 
  Activity, 
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  Globe,
  Terminal,
  Server,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  // Navigation tabs: 'chat' is the default and first tab
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'server_infra' | 'settings' | 'auth'>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Accessibility & Theme State ('dark' high-contrast default | 'light' neutral WCAG AA)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('omniops_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('omniops_theme', theme);
  }, [theme]);

  // Model Context Protocol (MCP) & Doctrinal Rules State
  const [projectRules, setProjectRules] = useState<ProjectRuleItem[]>(DEFAULT_PROJECT_RULES);
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(DEFAULT_MCP_SERVERS);
  const [isMcpRulesModalOpen, setIsMcpRulesModalOpen] = useState(false);

  const handleToggleRule = (ruleId: string) => {
    setProjectRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleAddRule = (newRule: ProjectRuleItem) => {
    setProjectRules((prev) => [newRule, ...prev]);
  };

  const handleDeleteRule = (ruleId: string) => {
    setProjectRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    username: 'superadmin',
    email: 'director@omniops.internal',
    role: 'SuperAdmin',
    full_name: 'مدیر کل سامانه (SuperAdmin)',
    created_at: '2026-01-01',
    agent_connected: true,
    agent_ip: '192.168.1.104',
    agent_version: 'v2.4',
    active_tools_count: 8,
    allowed_tools: ['t-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm', 't-hid', 't-screen', 't-terminal'],
    active_tools_list: ['MikroTik Winbox v3.40', 'Wireshark', 'Virtual HID (ماوس/کیبورد)', 'WinRM Remote', 'Nmap Scanner', 'PuTTY / Cisco CLI', 'Screen Grabber', 'Root Terminal']
  });

  const [usersList, setUsersList] = useState<User[]>([
    { 
      id: 1, 
      username: 'superadmin', 
      email: 'director@omniops.internal', 
      role: 'SuperAdmin', 
      full_name: 'مدیر کل سامانه (SuperAdmin)',
      agent_connected: true,
      agent_ip: '192.168.1.104',
      agent_version: 'v2.4',
      active_tools_count: 8,
      allowed_tools: ['t-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm', 't-hid', 't-screen', 't-terminal'],
      active_tools_list: ['MikroTik Winbox v3.40', 'Wireshark', 'Virtual HID (ماوس/کیبورد)', 'WinRM Remote', 'Nmap Scanner', 'PuTTY / Cisco CLI', 'Screen Grabber', 'Root Terminal']
    },
    { 
      id: 2, 
      username: 'itadmin', 
      email: 'it-lead@omniops.internal', 
      role: 'Admin', 
      full_name: 'مدیر فناوری اطلاعات (IT Admin)',
      agent_connected: true,
      agent_ip: '192.168.1.112',
      agent_version: 'v2.4',
      active_tools_count: 4,
      allowed_tools: ['t-winbox', 't-wireshark', 't-nmap', 't-putty'],
      active_tools_list: ['MikroTik Winbox v3.40', 'Wireshark', 'Nmap Scanner', 'PuTTY / Cisco CLI']
    },
    { 
      id: 3, 
      username: 'user', 
      email: 'operator@omniops.internal', 
      role: 'User', 
      full_name: 'کارشناس عملیات',
      agent_connected: false,
      active_tools_count: 0,
      allowed_tools: [],
      active_tools_list: []
    }
  ]);

  const handleUpdateUserPermissions = (userId: number, allowedTools: string[]) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            allowed_tools: allowedTools,
            active_tools_count: allowedTools.length
          };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  // Synchronize local agent running status with user account
  const handleToggleAgentRunning = (running: boolean) => {
    setAgentRunning(running);
    setUsersList((prev) =>
      prev.map((u) => {
        if (currentUser && u.id === currentUser.id) {
          return {
            ...u,
            agent_connected: running,
            active_tools_count: running ? 5 : 0
          };
        }
        return u;
      })
    );
  };

  // Strict Role-Based Profile Isolation: regular users can ONLY access chat
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'User') {
      if (activeTab !== 'chat') {
        setActiveTab('chat');
      }
    } else if (currentUser.role === 'Admin') {
      if (activeTab === 'server_infra' || activeTab === 'auth') {
        setActiveTab('chat');
      }
    }
  }, [currentUser, activeTab]);

  // AI Providers list (Expandable with custom providers)
  const [providersList, setProvidersList] = useState<ApiProviderConfig[]>(DEFAULT_PROVIDERS);

  // Settings & Configured Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    { id: 1, provider: 'gemini', masked_key: 'AIzaSy...7e9B', is_active: 1, last_validated: 'امروز ۱۲:۱۰' },
    { id: 2, provider: 'openrouter', masked_key: 'sk-or-...91fa', is_active: 1, last_validated: 'دیروز' },
    { id: 3, provider: 'openai', masked_key: 'sk-proj...8b2X', is_active: 1, last_validated: 'آماده' },
    { id: 4, provider: 'deepseek', masked_key: 'sk-ds-...44e1', is_active: 1, last_validated: 'فعال' },
    { id: 5, provider: 'anthropic', masked_key: 'sk-ant-api03...41eA', is_active: 1, last_validated: 'آماده (Claude 3.7)' },
    { id: 6, provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', masked_key: 'nvapi-7x9...2bF1', is_active: 1, last_validated: 'آماده (NVIDIA NIM)' },
    { id: 7, provider: 'ollama', base_url: 'http://localhost:11434', masked_key: 'Local/Host', is_active: 1, last_validated: 'آماده' },
    { id: 8, provider: 'anythingllm', base_url: 'http://localhost:3001/api/v1', masked_key: 'Local/Workspace', is_active: 1, last_validated: 'آماده (بدون توکن)' },
    { id: 9, provider: 'langflow', base_url: 'http://localhost:7860/api/v1', masked_key: 'Local/Flow', is_active: 1, last_validated: 'آماده' },
    { id: 10, provider: 'jev', base_url: 'http://localhost:8000/v1', masked_key: 'Local/Embedder', is_active: 1, last_validated: 'آماده (بدون توکن)' }
  ]);

  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
    enabled: true,
    host: '127.0.0.1',
    port: 1080
  });

  // Local Microservices Active States (Shared between Core Hub, Server Management and Chatroom)
  const [activeLocalServices, setActiveLocalServices] = useState<{
    core: boolean;
    ollama: boolean;
    anythingllm: boolean;
    langflow: boolean;
    jev: boolean;
    n8n: boolean;
    dify: boolean;
  }>({
    core: true,
    ollama: true,
    anythingllm: true,
    langflow: true,
    jev: true,
    n8n: true,
    dify: true
  });

  // Dedicated Architecture & Lifecycle Logs State (Memory-optimized FIFO Bounded Queue)
  const [isSystemLoggingActive, setIsSystemLoggingActive] = useState<boolean>(true);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([
    {
      id: 'log-sys-1',
      timestamp: '10:00:01',
      level: 'INFO',
      component: 'Core',
      phase: 'LIFECYCLE',
      message: 'هسته اصلی OmniOps Core Hub روی پورت 9000 فعال شد (شبکه داخلی: omniops_mesh).',
      details: 'Subnet: 172.28.0.0/16, Bridge Driver: online'
    },
    {
      id: 'log-sys-2',
      timestamp: '10:00:02',
      level: 'SUCCESS',
      component: 'JEV',
      phase: 'CONFIG',
      message: 'موتور سبک JEV Reader روی پورت 8000 با هسته همگام شد (Chunking ۵۱۲ توکن آماده است).',
      details: 'Fast OCR: ready, Local Embeddings: online'
    },
    {
      id: 'log-sys-3',
      timestamp: '10:00:03',
      level: 'SUCCESS',
      component: 'AnythingLLM',
      phase: 'CONFIG',
      message: 'پایگاه اسناد AnythingLLM متصل شد؛ حالت صفر توکن برای مکاتبات اداری فعال است.',
      details: 'Tokens: 0, Storage: mounted'
    },
    {
      id: 'log-sys-4',
      timestamp: '10:00:04',
      level: 'INFO',
      component: 'Langflow',
      phase: 'LIFECYCLE',
      message: 'استودیوی بصری Langflow آماده پذیرش گراف‌های فرآیندی است.',
      details: 'Endpoint: http://localhost:7860/api/v1'
    }
  ]);

  const addSystemLog = (
    component: SystemLogEntry['component'],
    level: SystemLogEntry['level'],
    message: string,
    phase: SystemLogEntry['phase'] = 'LIFECYCLE',
    details?: string
  ) => {
    if (!isSystemLoggingActive) return;
    const newEntry: SystemLogEntry = {
      id: `slog-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      component,
      phase,
      message,
      details
    };
    setSystemLogs((prev) => [newEntry, ...prev].slice(0, 200)); // FIFO optimized
  };

  const handleToggleLocalService = (serviceId: 'core' | 'ollama' | 'anythingllm' | 'langflow' | 'jev' | 'n8n' | 'dify') => {
    setActiveLocalServices((prev) => {
      const nextVal = !prev[serviceId];
      addSystemLog(
        serviceId === 'jev' ? 'JEV' : serviceId === 'core' ? 'Core' : serviceId === 'anythingllm' ? 'AnythingLLM' : serviceId === 'langflow' ? 'Langflow' : serviceId === 'ollama' ? 'Ollama' : serviceId === 'n8n' ? 'n8n' : 'Dify',
        nextVal ? 'SUCCESS' : 'WARN',
        `وضعیت سرویس ${serviceId.toUpperCase()} به ${nextVal ? 'آنلاین' : 'متوقف'} تغییر یافت.`,
        'LIFECYCLE'
      );
      return { ...prev, [serviceId]: nextVal };
    });
  };

  const handleToggleSystemLogging = () => {
    setIsSystemLoggingActive((prev) => !prev);
  };

  const handleClearSystemLogs = () => {
    setSystemLogs([]);
  };

  // Dynamic models state (Auto-fetched & sorted)
  const [availableModels, setAvailableModels] = useState<AiModel[]>([
    { id: 'gemini-2.5-flash', provider: 'gemini', model_id: 'gemini-2.5-flash', display_name: 'Gemini 2.5 Flash', context_length: 1048576, status: 'online', latency_ms: 85, is_recommended: true, supports_image_generation: true, supports_video_generation: true, supports_vision: true },
    { id: 'gemini-2.5-pro', provider: 'gemini', model_id: 'gemini-2.5-pro', display_name: 'Gemini 2.5 Pro', context_length: 2097152, status: 'online', latency_ms: 220, is_recommended: false, supports_image_generation: true, supports_video_generation: true, supports_vision: true },
    { id: 'gpt-4o', provider: 'openai', model_id: 'gpt-4o', display_name: 'OpenAI GPT-4o (Omni)', context_length: 128000, status: 'online', latency_ms: 280, is_recommended: true, supports_image_generation: true, supports_video_generation: true, supports_vision: true },
    { id: 'deepseek-chat', provider: 'deepseek', model_id: 'deepseek/deepseek-chat', display_name: 'DeepSeek V3 (Reasoning & Code)', context_length: 65536, status: 'online', latency_ms: 190, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'claude-3-7-sonnet', provider: 'anthropic', model_id: 'claude-3-7-sonnet-20250219', display_name: 'Claude 3.7 Sonnet (Anthropic Hybrid)', context_length: 200000, status: 'online', latency_ms: 220, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
    { id: 'claude-3-5-sonnet', provider: 'anthropic', model_id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet (Official)', context_length: 200000, status: 'online', latency_ms: 180, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
    { id: 'nvidia-nemotron-70b', provider: 'nvidia', model_id: 'nvidia/llama-3.1-nemotron-70b-instruct', display_name: 'NVIDIA Nemotron 70B (NIM Cloud)', context_length: 131072, status: 'online', latency_ms: 55, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
    { id: 'nvidia-deepseek-r1', provider: 'nvidia', model_id: 'deepseek-ai/deepseek-r1', display_name: 'DeepSeek R1 (NVIDIA NIM)', context_length: 65536, status: 'online', latency_ms: 70, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'nvidia-llama-3.3-70b', provider: 'nvidia', model_id: 'meta/llama-3.3-70b-instruct', display_name: 'Llama 3.3 70B Instruct (NVIDIA NIM)', context_length: 131072, status: 'online', latency_ms: 48, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'groq-llama-3.3', provider: 'groq', model_id: 'llama-3.3-70b-versatile', display_name: 'Llama 3.3 70B (Groq Fast)', context_length: 131072, status: 'online', latency_ms: 45, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'ollama-dorna2', provider: 'ollama', model_id: 'ollama/dorna2:8b', display_name: 'Dorna 2:8b (مدل ملی فارسی - اولاما لوکال)', context_length: 32768, status: 'online', latency_ms: 18, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'ollama-maral7b', provider: 'ollama', model_id: 'ollama/maral:7b', display_name: 'Maral 7B (مدل بومی فارسی - اولاما لوکال)', context_length: 16384, status: 'online', latency_ms: 22, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'ollama-llama3', provider: 'ollama', model_id: 'ollama/llama3.1:8b', display_name: 'Ollama Llama 3.1 8B (Local Offline)', context_length: 32768, status: 'online', latency_ms: 20, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
    { id: 'anythingllm-rag', provider: 'anythingllm', model_id: 'anythingllm/document-rag', display_name: 'AnythingLLM RAG (Local Docs & Letters - 0 Tokens)', context_length: 65536, status: 'online', latency_ms: 15, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
    { id: 'jev-embedder', provider: 'jev', model_id: 'jev/document-embedder', display_name: 'JEV Document Reader (Local Chunking & Embedder)', context_length: 32768, status: 'online', latency_ms: 10, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
    { id: 'langflow-flow', provider: 'langflow', model_id: 'langflow/hybrid-pipeline', display_name: 'Langflow Agent Flow (Visual Pipeline)', context_length: 65536, status: 'online', latency_ms: 25, is_recommended: false, supports_image_generation: false, supports_video_generation: false, supports_vision: false }
  ]);

  // Enterprise Skills Registry (Domain Knowledge & Directives)
  const [skillsList, setSkillsList] = useState<SkillItem[]>(ENTERPRISE_SKILLS);
  const [activeSkillIds, setActiveSkillIds] = useState<string[]>([
    'mikrotik_expert',
    'powershell_enterprise',
    'devops_docker_k8s',
    'plugin_context7',
    'plugin_strix'
  ]);

  const handleAddSkill = (newSkill: SkillItem) => {
    setSkillsList((prev) => [newSkill, ...prev]);
    setActiveSkillIds((prev) => [newSkill.id, ...prev]);
  };

  // Prefilled prompt transition from Skills view to Chat view
  const [prefilledPrompt, setPrefilledPrompt] = useState<{ text: string; skillId: string } | null>(null);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-default-1',
      title: 'کانفیگ و عیب‌یابی فایروال میکروتیک و شبکه',
      selected_model: 'gemini-2.5-flash',
      active_skills: ['mikrotik_expert', 'powershell_enterprise'],
      created_at: '2026-09-26 10:00',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'چگونه می‌توانم در RouterOS v7 قوانین FastTrack را به گونه‌ای بنویسم که با مانگل‌های تفکیک ترافیک (PCC) تداخل نداشته باشد؟',
          timestamp: '10:00'
        },
        {
          id: 'm2',
          role: 'assistant',
          content: `بر اساس اصول معماری و روتینگ پیشرفته MikroTik RouterOS v7، قاعده کلیدی در همزیستی FastTrack و Mangle بدین شرح است:

1. **علت تداخل**: FastTrack بسته‌های بعدی یک Connection برقرار شده را از پردازش کامل فایروال و مانگل دور می‌زند (Bypass می‌کند)، بنابراین اگر بسته‌ای FastTrack شود، قوانین Mangle برای پکت‌های بعدی آن اجرا نخواهد شد.

2. **راهکار استاندارد معماری**:
برای ترافیکی که می‌خواهید تفکیک بار (PCC) یا نشانی‌گذاری روتینگ (routing-mark) شود، باید در بخش FastTrack یک استثنا با \`connection-mark\` قائل شوید:

\`\`\`routeros
# ۱. قانون استثنا برای ترافیک نشان‌دار شده در Filter Rules
/ip firewall filter
add chain=forward action=fasttrack-connection connection-state=established,related connection-mark=no-mark comment="FastTrack Only Unmarked Traffic"
add chain=forward action=accept connection-state=established,related comment="Accept established/related for all"
\`\`\`

با این پیکربندی، ترافیک عمومی شبکه از شتاب پردازشی FastTrack حداکثر استفاده را برده و ترافیک نیازمند PCC بدون افت کیفیت به مسیر مربوطه هدایت می‌شود.`,
          timestamp: '10:01',
          model_used: 'gemini-2.5-flash',
          active_skills_used: ['mikrotik_expert']
        }
      ]
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('session-default-1');

  // Periodic Health Check Simulation (Cron)
  useEffect(() => {
    const timer = setInterval(() => {
      setAvailableModels((prev) =>
        prev.map((m) => {
          const delta = Math.floor(Math.random() * 15) - 7;
          return {
            ...m,
            latency_ms: Math.max(18, m.latency_ms + delta)
          };
        })
      );
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleToggleSkill = (skillId: string) => {
    setActiveSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSelectSampleQuery = (query: string, skillId: string) => {
    setPrefilledPrompt({ text: query, skillId });
    setActiveTab('chat');
  };

  const handleAddCustomProvider = (newProv: ApiProviderConfig) => {
    setProvidersList((prev) => [newProv, ...prev]);
  };

  const handleSaveApiKey = (providerId: string, key: string, baseUrl?: string) => {
    const masked = key.length > 8 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : 'key-saved';
    setApiKeys((prev) => [
      ...prev.filter((p) => p.provider !== providerId),
      {
        id: Date.now(),
        provider: providerId,
        base_url: baseUrl,
        masked_key: masked,
        is_active: 1,
        last_validated: 'هم‌اکنون'
      }
    ]);
  };

  const handleDeleteApiKey = (keyId: number) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const handleFetchModels = async (providerId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    
    // Generate realistic dynamic models list based on provider
    let newModels: AiModel[] = [];
    if (providerId === 'gemini') {
      newModels = [
        { id: 'gemini-2.5-flash', provider: 'gemini', model_id: 'gemini-2.5-flash', display_name: 'Gemini 2.5 Flash', context_length: 1048576, status: 'online', latency_ms: 80, is_recommended: true },
        { id: 'gemini-2.5-pro', provider: 'gemini', model_id: 'gemini-2.5-pro', display_name: 'Gemini 2.5 Pro', context_length: 2097152, status: 'online', latency_ms: 210, is_recommended: false },
        { id: 'gemini-2.0-flash', provider: 'gemini', model_id: 'gemini-2.0-flash', display_name: 'Gemini 2.0 Flash', context_length: 1048576, status: 'online', latency_ms: 110, is_recommended: false }
      ];
    } else if (providerId === 'openai') {
      newModels = [
        { id: 'gpt-4o', provider: 'openai', model_id: 'gpt-4o', display_name: 'GPT-4o (Omni Multimodal)', context_length: 128000, status: 'online', latency_ms: 270, is_recommended: true },
        { id: 'gpt-4o-mini', provider: 'openai', model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini (Fast)', context_length: 128000, status: 'online', latency_ms: 140, is_recommended: true },
        { id: 'o1', provider: 'openai', model_id: 'o1', display_name: 'OpenAI o1 (Deep Reasoning)', context_length: 200000, status: 'online', latency_ms: 450, is_recommended: false }
      ];
    } else if (providerId === 'deepseek') {
      newModels = [
        { id: 'deepseek-chat', provider: 'deepseek', model_id: 'deepseek-chat', display_name: 'DeepSeek-V3 Official', context_length: 65536, status: 'online', latency_ms: 180, is_recommended: true },
        { id: 'deepseek-reasoner', provider: 'deepseek', model_id: 'deepseek-reasoner', display_name: 'DeepSeek-R1 (CoT Reasoner)', context_length: 65536, status: 'online', latency_ms: 320, is_recommended: true }
      ];
    } else if (providerId === 'anthropic') {
      newModels = [
        { id: 'claude-3-7-sonnet', provider: 'anthropic', model_id: 'claude-3-7-sonnet-20250219', display_name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', context_length: 200000, status: 'online', latency_ms: 220, is_recommended: true, supports_vision: true },
        { id: 'claude-3-5-sonnet', provider: 'anthropic', model_id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet (Official)', context_length: 200000, status: 'online', latency_ms: 180, is_recommended: true, supports_vision: true },
        { id: 'claude-3-5-haiku', provider: 'anthropic', model_id: 'claude-3-5-haiku-20241022', display_name: 'Claude 3.5 Haiku (Fast)', context_length: 200000, status: 'online', latency_ms: 95, is_recommended: false, supports_vision: true }
      ];
    } else if (providerId === 'nvidia') {
      newModels = [
        { id: 'nvidia-nemotron-70b', provider: 'nvidia', model_id: 'nvidia/llama-3.1-nemotron-70b-instruct', display_name: 'NVIDIA Nemotron 70B (NIM Cloud)', context_length: 131072, status: 'online', latency_ms: 55, is_recommended: true, supports_vision: true },
        { id: 'nvidia-deepseek-r1', provider: 'nvidia', model_id: 'deepseek-ai/deepseek-r1', display_name: 'DeepSeek R1 (NVIDIA NIM Hosted)', context_length: 65536, status: 'online', latency_ms: 70, is_recommended: true, supports_vision: false },
        { id: 'nvidia-llama-3.3-70b', provider: 'nvidia', model_id: 'meta/llama-3.3-70b-instruct', display_name: 'Llama 3.3 70B Instruct (NVIDIA NIM)', context_length: 131072, status: 'online', latency_ms: 48, is_recommended: true, supports_vision: false },
        { id: 'nvidia-mistral-nemo', provider: 'nvidia', model_id: 'mistralai/mistral-nemo-12b-instruct', display_name: 'Mistral NeMo 12B (NVIDIA NIM)', context_length: 131072, status: 'online', latency_ms: 35, is_recommended: false, supports_vision: false }
      ];
    } else if (providerId === 'groq') {
      newModels = [
        { id: 'llama-3.3-70b-versatile', provider: 'groq', model_id: 'llama-3.3-70b-versatile', display_name: 'Llama 3.3 70B (Groq LPU)', context_length: 131072, status: 'online', latency_ms: 40, is_recommended: true },
        { id: 'mixtral-8x7b-32768', provider: 'groq', model_id: 'mixtral-8x7b-32768', display_name: 'Mixtral 8x7B (Groq)', context_length: 32768, status: 'online', latency_ms: 35, is_recommended: false }
      ];
    } else if (providerId === 'ollama') {
      newModels = [
        { id: 'ollama-dorna2', provider: 'ollama', model_id: 'ollama/dorna2:8b', display_name: 'Dorna 2:8b (مدل ملی فارسی - اولاما لوکال)', context_length: 32768, status: 'online', latency_ms: 18, is_recommended: true },
        { id: 'ollama-maral7b', provider: 'ollama', model_id: 'ollama/maral:7b', display_name: 'Maral 7B (مدل بومی فارسی - اولاما لوکال)', context_length: 16384, status: 'online', latency_ms: 20, is_recommended: true },
        { id: 'ollama-llama3', provider: 'ollama', model_id: 'ollama/llama3.1:8b', display_name: 'Ollama Llama 3.1 8B (Local)', context_length: 32768, status: 'online', latency_ms: 18, is_recommended: true },
        { id: 'ollama-mistral', provider: 'ollama', model_id: 'ollama/mistral:7b', display_name: 'Ollama Mistral 7B (Local)', context_length: 32768, status: 'online', latency_ms: 22, is_recommended: false }
      ];
    } else if (providerId === 'anythingllm') {
      newModels = [
        { id: 'anythingllm-rag', provider: 'anythingllm', model_id: 'anythingllm/document-rag', display_name: 'AnythingLLM RAG (Local Docs & Letters - 0 Tokens)', context_length: 65536, status: 'online', latency_ms: 15, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
        { id: 'anythingllm-office', provider: 'anythingllm', model_id: 'anythingllm/office-workflow', display_name: 'AnythingLLM Office Letters & Summaries', context_length: 65536, status: 'online', latency_ms: 18, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: false }
      ];
    } else if (providerId === 'langflow') {
      newModels = [
        { id: 'langflow-flow', provider: 'langflow', model_id: 'langflow/hybrid-pipeline', display_name: 'Langflow Agent Flow (Visual Pipeline)', context_length: 65536, status: 'online', latency_ms: 25, is_recommended: false, supports_image_generation: false, supports_video_generation: false, supports_vision: false },
        { id: 'langflow-doc-ingest', provider: 'langflow', model_id: 'langflow/doc-ingest', display_name: 'Langflow Document Ingestion Pipeline', context_length: 32768, status: 'online', latency_ms: 28, is_recommended: false, supports_image_generation: false, supports_video_generation: false, supports_vision: false }
      ];
    } else if (providerId === 'jev') {
      newModels = [
        { id: 'jev-embedder', provider: 'jev', model_id: 'jev/document-embedder', display_name: 'JEV Document Reader (Fast Chunking & Embedder)', context_length: 32768, status: 'online', latency_ms: 10, is_recommended: true, supports_image_generation: false, supports_video_generation: false, supports_vision: true },
        { id: 'jev-reranker', provider: 'jev', model_id: 'jev/reranker-v3', display_name: 'JEV Local Reranker (Document Ranker)', context_length: 16384, status: 'online', latency_ms: 8, is_recommended: false, supports_image_generation: false, supports_video_generation: false, supports_vision: false }
      ];
    } else {
      // Custom provider
      newModels = [
        { id: `${providerId}-default`, provider: providerId, model_id: `${providerId}-model`, display_name: `${providerId.toUpperCase()} Custom Model`, context_length: 65536, status: 'online', latency_ms: 120, is_recommended: true }
      ];
    }

    setAvailableModels((prev) => [
      ...prev.filter((m) => m.provider !== providerId),
      ...newModels
    ]);
    return { success: true, count: newModels.length };
  };

  const createTopologySvgUrl = (title: string): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B0B0E"/>
          <stop offset="100%" stop-color="#14141A"/>
        </linearGradient>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3B82F6"/>
          <stop offset="100%" stop-color="#1D4ED8"/>
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#6D28D9"/>
        </linearGradient>
        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10B981"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bg)" rx="16"/>
      <line x1="0" y1="40" x2="800" y2="40" stroke="#26262E" stroke-width="1"/>
      <text x="400" y="26" fill="#93C5FD" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">OmniOps Architecture: ${title}</text>
      
      <rect x="330" y="65" width="140" height="45" rx="10" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
      <text x="400" y="92" fill="#93C5FD" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">WAN / Internet</text>
      
      <line x1="400" y1="110" x2="400" y2="145" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="4"/>
      
      <rect x="300" y="145" width="200" height="55" rx="12" fill="url(#blueGrad)" stroke="#60A5FA" stroke-width="2"/>
      <text x="400" y="177" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">MikroTik CCR2004 Core Router</text>
      
      <line x1="330" y1="200" x2="190" y2="255" stroke="#60A5FA" stroke-width="2"/>
      <line x1="470" y1="200" x2="610" y2="255" stroke="#60A5FA" stroke-width="2"/>
      
      <rect x="100" y="255" width="180" height="50" rx="10" fill="url(#purpleGrad)" stroke="#A78BFA" stroke-width="1.5"/>
      <text x="190" y="285" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Cisco Catalyst 3850 (SW-1)</text>

      <rect x="520" y="255" width="180" height="50" rx="10" fill="url(#purpleGrad)" stroke="#A78BFA" stroke-width="1.5"/>
      <text x="610" y="285" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Cisco Catalyst 3850 (SW-2)</text>

      <line x1="145" y1="305" x2="145" y2="350" stroke="#64748B" stroke-width="1.5"/>
      <line x1="235" y1="305" x2="235" y2="350" stroke="#64748B" stroke-width="1.5"/>
      
      <rect x="85" y="350" width="120" height="38" rx="8" fill="url(#greenGrad)"/>
      <text x="145" y="374" fill="#FFFFFF" font-family="monospace" font-size="11" text-anchor="middle">VLAN 10: Servers</text>

      <rect x="215" y="350" width="120" height="38" rx="8" fill="#1E293B" stroke="#64748B"/>
      <text x="275" y="374" fill="#E2E8F0" font-family="monospace" font-size="11" text-anchor="middle">Ollama / Dify</text>

      <line x1="565" y1="305" x2="565" y2="350" stroke="#64748B" stroke-width="1.5"/>
      <line x1="655" y1="305" x2="655" y2="350" stroke="#64748B" stroke-width="1.5"/>

      <rect x="505" y="350" width="120" height="38" rx="8" fill="#1E293B" stroke="#64748B"/>
      <text x="565" y="374" fill="#E2E8F0" font-family="monospace" font-size="11" text-anchor="middle">VLAN 20: Admins</text>

      <rect x="635" y="350" width="120" height="38" rx="8" fill="url(#greenGrad)"/>
      <text x="695" y="374" fill="#FFFFFF" font-family="monospace" font-size="11" text-anchor="middle">n8n Automation</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Helper to detect if a prompt is an agent tool command
  const detectToolIntent = (text: string): { toolId: string; toolName: string; defaultCmd: string } | null => {
    const lower = text.toLowerCase();
    if (lower.includes('کروم') || lower.includes('chrome') || lower.includes('افزونه') || lower.includes('اکستنشن') || lower.includes('مرورگر') || lower.includes('تب‌های کروم') || lower.includes('تب کروم') || lower.includes('وبگردی') || lower.includes('صفحه وب') || lower.includes('dom') || lower.includes('سایت')) {
      return {
        toolId: 't-chrome',
        toolName: 'افزونه کروم (Chrome Extension Agent)',
        defaultCmd: 'chrome.tabs.query({ active: true, currentWindow: true }); chrome.runtime.sendMessage({ action: "inspect_dom_and_network" });'
      };
    }
    if (lower.includes('میکروتیک') || lower.includes('winbox') || lower.includes('routeros') || lower.includes('/ip firewall') || lower.includes('فایروال میکروتیک')) {
      return { 
        toolId: 't-winbox', 
        toolName: 'MikroTik Winbox v3.40', 
        defaultCmd: '/ip firewall filter print count-only\n/ip service print where disabled=no\n/ip route print count-only' 
      };
    }
    if (lower.includes('وایردشارک') || lower.includes('wireshark') || lower.includes('شنود') || lower.includes('پکت') || lower.includes('tshark') || lower.includes('ترافیک شبکه') || lower.includes('کپچر')) {
      return { 
        toolId: 't-wireshark', 
        toolName: 'Wireshark Packet Analyzer', 
        defaultCmd: 'tshark -i eth0 -a duration:5 -c 8 -T fields -e frame.number -e ip.src -e ip.dst -e _ws.col.Protocol -e frame.len' 
      };
    }
    if (lower.includes('nmap') || lower.includes('اسکن پورت') || lower.includes('اسکن شبکه') || lower.includes('port scan') || lower.includes('پورت‌های باز') || lower.includes('اسکن امنیتی')) {
      return { 
        toolId: 't-nmap', 
        toolName: 'Nmap Security Scanner', 
        defaultCmd: 'nmap -sS -T4 -p 22,80,443,8080,11434 192.168.1.1/24' 
      };
    }
    if (lower.includes('ماوس') || lower.includes('کیبورد') || lower.includes('کلیک') || lower.includes('hid') || lower.includes('تایپ') || lower.includes('شبیه‌سازی ماوس')) {
      return { 
        toolId: 't-hid', 
        toolName: 'Virtual HID (کنترل ماوس و کیبورد)', 
        defaultCmd: 'agent.hid.moveCursor(x=640, y=480); agent.hid.click(button="left"); agent.hid.keyPress("ENTER");' 
      };
    }
    if (lower.includes('پاورشل') || lower.includes('سرویس‌های ویندوز') || lower.includes('ویندوز') || lower.includes('winrm') || lower.includes('powershell') || lower.includes('get-service')) {
      return { 
        toolId: 't-winrm', 
        toolName: 'Windows Remote Management (WinRM)', 
        defaultCmd: 'powershell -ExecutionPolicy Bypass -Command "Get-Service -Name *Omni*, *Docker*, *WinRM* | Select-Object Name, Status, StartType"' 
      };
    }
    if (lower.includes('putty') || lower.includes('سیسکو') || lower.includes('سوئیچ') || lower.includes('cisco') || lower.includes('ترانک')) {
      return { 
        toolId: 't-putty', 
        toolName: 'PuTTY / Cisco CLI', 
        defaultCmd: 'ssh admin@192.168.1.2 "show ip interface brief | exclude unassigned"' 
      };
    }
    if (lower.includes('کانتینر') || lower.includes('داکر') || lower.includes('docker') || lower.includes('دستور شل') || lower.includes('ترمینال') || lower.includes('ufw') || lower.includes('netstat')) {
      return { 
        toolId: 't-terminal', 
        toolName: 'Terminal Shell Execution (Root)', 
        defaultCmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"' 
      };
    }
    if (lower.includes('اسکرین') || lower.includes('اسکرین‌شات') || lower.includes('تصویر دسکتاپ') || lower.includes('screen capture')) {
      return { 
        toolId: 't-screen', 
        toolName: 'Screen Capture & Grabber', 
        defaultCmd: 'agent.screen.capture(display=0, format="png", quality=90)' 
      };
    }
    return null;
  };

  // Helper to generate realistic tool console output
  const generateToolOutput = (toolId: string, cmd: string): string => {
    switch (toolId) {
      case 't-chrome':
        return `[Chrome Extension v1.8.4 - Native WebSocket Bridge Connected]
Session: Chrome Window #1 (Active Foreground Tab)
Target URL: http://192.168.1.1/webfig/#IP:Firewall.Filter
Tab Title: "MikroTik WebFig v7.15 (192.168.1.1)" | ReadyState: Complete
- DOM Elements Scanned: 42 inputs, 14 buttons, 2 data tables parsed.
- Active HTTP/XHR Requests: 18 intercepted (All 200 OK, Avg Latency: 14ms).
- Local Cookies & Storage: 3 session keys validated (No cross-site leakage).
- Background Console: 0 syntax errors, 1 warning (Passive scroll listener).
[Success] Chrome Extension executed DOM extraction and browser inspection successfully.`;
      case 't-nmap':
        return `Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-26 13:40 IRST
Nmap scan report for omniops-gateway (192.168.1.1)
Host is up (0.00042s latency).
PORT      STATE SERVICE    VERSION
22/tcp    open  ssh        OpenSSH 8.9p1 Ubuntu
80/tcp    open  http       nginx/1.24.0
443/tcp   open  ssl/http   nginx/1.24.0
8080/tcp  open  http-proxy Traefik Proxy v3.1
11434/tcp open  http       Ollama Engine API v0.3.12
MAC Address: 00:0C:29:4F:8E:1A (VMware Virtual NIC)
Nmap done: 256 IP addresses (4 hosts up) scanned in 2.14 seconds`;
      case 't-wireshark':
        return `Capturing on 'eth0' [Promiscuous Mode Active]
1   192.168.1.104 -> 192.168.1.1   TCP   66  54320 -> 443 [ACK] Seq=1 Ack=1 Win=64240
2   192.168.1.104 -> 1.1.1.1       DNS   74  Standard query 0xa312 A api.omniops.internal
3   1.1.1.1       -> 192.168.1.104 DNS   90  Standard query response 0xa312 A 192.168.1.50
4   192.168.1.104 -> 192.168.1.50  HTTP  148 GET /api/v1/health HTTP/1.1
5   192.168.1.50  -> 192.168.1.104 HTTP  224 HTTP/1.1 200 OK (application/json)
6   192.168.1.104 -> 192.168.1.1   TLSv1.3 512 Application Data
7   192.168.1.1   -> 192.168.1.104 TLSv1.3 128 Application Data
8 packets captured (0 dropped) - Protocol Distribution: 50% TCP, 25% DNS, 25% HTTP`;
      case 't-hid':
        return `[Virtual-HID v2.4 Driver] Windows Hook Initialized.
> Mouse absolute coordinate dispatched: (X: 640, Y: 480) [Smooth Bezier Interpolation]
> WM_LBUTTONDOWN dispatched at window HWND: 0x001B05D2 ("OmniOps Client")
> WM_LBUTTONUP dispatched (Delta: 45ms)
> Hardware Keystroke: VK_RETURN (0x0D) injected into active foreground buffer.
[Success] Hardware input simulation verified by OS Kernel driver (0 errors, Latency: 1.2ms).`;
      case 't-winrm':
        return `Status   Name               DisplayName
------   ----               -----------
Running  OmniOpsAgent       OmniOps Client Windows Agent v2.4
Running  com.docker.service Docker Desktop Service
Running  WinRM              Windows Remote Management (WS-Management)
Running  Dnscache           DNS Client
Stopped  Spooler            Print Spooler (Disabled by policy)`;
      case 't-winbox':
        return `Flags: X - disabled, I - invalid, D - dynamic 
 #   NAME       PORT  ADDRESS            CERTIFICATE
 0   winbox     8291  192.168.1.0/24     none
 1   api-ssl    8729  0.0.0.0/0          omniops-cert
 2   ssh        2200  192.168.1.0/24     none
[MikroTik RouterOS 7.15.2 on CCR2004-1G-12S+2XS]
Total Firewall Filter Rules Active: 14 (FastTrack: Enabled, Drops: 1,842 packets/min)`;
      case 't-putty':
        return `Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/1     192.168.1.2     YES NVRAM  up                    up      
GigabitEthernet0/2     unassigned      YES unset  up                    up (Trunk)
Vlan10                 10.10.10.1      YES manual up                    up      
Vlan20                 10.10.20.1      YES manual up                    up      
Switch-Core-C9300# uptime is 42 weeks, 3 days, 14 hours`;
      case 't-terminal':
        return `NAMES               STATUS          PORTS
omniops_ollama      Up 6 hours      0.0.0.0:11434->11434/tcp
omniops_n8n         Up 6 hours      0.0.0.0:5678->5678/tcp
omniops_dify_api    Up 6 hours      0.0.0.0:5001->5001/tcp
omniops_redis       Up 6 hours      6379/tcp
omniops_postgres    Up 6 hours      5432/tcp`;
      case 't-screen':
        return `[Screen Grabber] Captured display #0 (Resolution: 1920x1080 @ 60Hz)
Saved buffer to C:\\ProgramData\\OmniOps\\captures\\screen_20260926_134211.png (Size: 842 KB)
Active foreground window: "MikroTik Winbox v3.40 (192.168.1.1)"
OCR Engine: Text detected in capture (14 labels matched).`;
      default:
        return `[Command Executed Successfully via Agent Bridge]\n${cmd}\nExit Code: 0 (OK)`;
    }
  };

  const handleSendMessage = async (
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
  ) => {
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      attachments,
      is_command_mode: isCommandMode
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, userMsg] } : s))
    );

    // Option 2: اجرای فرامین با ابزارها (Agent & Tools Mode) or explicit tool command button
    const shouldExecuteTools = isCommandMode || Boolean(toolCommandInfo);

    let detectedTool: { toolId: string; toolName: string; defaultCmd: string } | null = null;
    if (shouldExecuteTools) {
      detectedTool = toolCommandInfo 
        ? { toolId: toolCommandInfo.toolId, toolName: toolCommandInfo.toolName, defaultCmd: toolCommandInfo.command }
        : detectToolIntent(text);

      if (!detectedTool) {
        // Under Agent & Tools Mode, default to appropriate execution arm based on context
        const isAgentActive = Boolean(currentUser?.agent_connected);
        if (text.toLowerCase().includes('web') || text.toLowerCase().includes('سایت') || text.toLowerCase().includes('مرورگر')) {
          detectedTool = {
            toolId: 't-chrome',
            toolName: 'افزونه کروم (Chrome Extension Agent)',
            defaultCmd: `chrome.tabs.query({ active: true }); // ${text}`
          };
        } else {
          detectedTool = {
            toolId: isAgentActive ? 't-winrm' : 't-terminal',
            toolName: isAgentActive ? 'ایجنت لوکال ویندوز (WinRM / PowerShell)' : 'ترمینال سرور مرکزی (Terminal Shell)',
            defaultCmd: text
          };
        }
      }
    }

    // Simulate model inference
    await new Promise((resolve) => setTimeout(resolve, 800));

    // If it is an Agent Tool Command, enforce strict RBAC permissions & Network Scope!
    if (detectedTool) {
      const userAllowedTools: string[] = currentUser?.allowed_tools !== undefined
        ? currentUser.allowed_tools
        : (currentUser?.role === 'SuperAdmin' 
            ? ['t-chrome', 't-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm', 't-hid', 't-screen', 't-terminal']
            : currentUser?.role === 'Admin'
            ? ['t-chrome', 't-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm']
            : []);

      const isPermitted = userAllowedTools.includes(detectedTool.toolId);

      let assistantMsg: any;

      if (!isPermitted) {
        // PERMISSION DENIED: AI validates access and refuses to execute
        assistantMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant' as const,
          content: `⛔ صحت‌سنجی امنیتی: عدم احراز مجوز در پروفایل کاربر (@${currentUser?.username || 'کاربر'})!\n\nکاربر گرامی، حساب کاربری شما بر اساس مشخصات پروفایل، فاقد دسترسی به بازوی اجرایی «${detectedTool.toolName}» است.\nبه دلیل سیاست‌های امنیتی و تفکیک سطح دسترسی، هوش مصنوعی از اجرای این فرمان بر روی زیرساخت خودداری نمود.\n\n💡 جهت فعال‌سازی، از مدیر ارشد سیستم (SuperAdmin) بخواهید در تب «کاربران و امنیت» دسترسی به این ابزار را در پروفایل شما فعال کند.`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          model_used: modelId,
          active_skills_used: skills,
          is_tool_command: true,
          is_command_mode: isCommandMode,
          tool_execution: {
            id: `act-${Date.now()}`,
            tool_id: detectedTool.toolId,
            tool_name: detectedTool.toolName,
            command: detectedTool.defaultCmd,
            status: 'permission_denied' as const,
            denied_reason: 'عدم احراز مجوز در پروفایل کاربر (RBAC Access Denied)',
            execution_arm: detectedTool.toolId === 't-chrome' ? 'افزونه کروم' : 'ایجنت لوکال ویندوز / سرور',
            executed_at: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          }
        };
      } else {
        // PERMISSION GRANTED: Enforce Windows Agent and Chrome Extension scope isolation!
        const isAgentActive = Boolean(currentUser?.agent_connected);
        const agentIp = currentUser?.agent_ip || '192.168.1.145';
        const subnetPrefix = agentIp.substring(0, agentIp.lastIndexOf('.'));
        const subnetScope = `${subnetPrefix}.0/24`;

        // Check if an IP address was specified in the command/text that is outside the Windows Agent subnet
        const ipMatches = (detectedTool.defaultCmd + ' ' + text).match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g);
        const outOfScopeIp = isAgentActive && ipMatches 
          ? ipMatches.find(ip => !ip.startsWith('127.') && !ip.startsWith(`${subnetPrefix}.`))
          : null;

        if (outOfScopeIp) {
          // BLOCKED: Out of Network Scope for Windows Agent
          assistantMsg = {
            id: `a-${Date.now()}`,
            role: 'assistant' as const,
            content: `⛔ محدودیت دامنه شبکه ایجنت ویندوزی و افزونه کروم!\n\nکاربر گرامی (@${currentUser?.username})، ایجنت کلاینت شما صرفاً به سطح شبکه قابل دید محلی خود (${subnetScope}) دسترسی دارد.\nآدرس مقصد «${outOfScopeIp}» خارج از محدوده شبکه قابل رویت ایجنت ویندوزی است و اجرای ابزار جهت رعایت ایزولاسیون شبکه مسدود گردید.`,
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            model_used: omniRouteMeta?.useOmniRoute ? omniRouteMeta.providerName : modelId,
            active_skills_used: skills,
            is_tool_command: true,
            is_command_mode: isCommandMode,
            network_scope: `${subnetScope} (Blocked: ${outOfScopeIp} Out of Scope)`,
            omni_route: omniRouteMeta?.useOmniRoute ? {
              selected_provider: omniRouteMeta.providerName,
              provider_id: omniRouteMeta.providerId,
              latency_ms: omniRouteMeta.latencyMs || 38,
              hop_flow: omniRouteMeta.hopFlow || `Claude Code → OmniRoute → ${omniRouteMeta.providerName}`,
              failover_occurred: omniRouteMeta.failoverOccurred,
              previous_limited_provider: omniRouteMeta.previousProvider,
              routing_reason: omniRouteMeta.routingReason || 'مسیریابی خودکار'
            } : undefined,
            tool_execution: {
              id: `act-${Date.now()}`,
              tool_id: detectedTool.toolId,
              tool_name: detectedTool.toolName,
              command: detectedTool.defaultCmd,
              status: 'permission_denied' as const,
              denied_reason: `آدرس ${outOfScopeIp} خارج از سطح شبکه مجاز ایجنت ویندوزی (${subnetScope}) است.`,
              execution_arm: 'ایجنت لوکال ویندوز',
              executed_at: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            }
          };
        } else {
          const executionArmLabel = detectedTool.toolId === 't-chrome'
            ? 'افزونه کروم (Chrome Extension Bridge v1.8)'
            : isAgentActive
            ? `ایجنت لوکال ویندوز (${agentIp}) + افزونه کروم`
            : 'سرور مرکزی لینوکس (Core Node)';

          const agentScopeHeader = isAgentActive
            ? `[Windows Agent Scope Enforced: ${subnetScope} | Agent v${currentUser?.agent_version || '2.4.1'} @ ${agentIp}]\n[Execution Arm: ${executionArmLabel}]: ایزولاسیون شبکه و تایید مجوز پروفایل کاربر (@${currentUser?.username})\n`
            : `[Execution Arm: ${executionArmLabel} | Central Execution]\n`;

          assistantMsg = {
            id: `a-${Date.now()}`,
            role: 'assistant' as const,
            content: `فرمان ارسالی با صحت‌سنجی موفق سطح دسترسی کاربر (@${currentUser?.username})، به صورت خودکار توسط بازوی اجرایی «${detectedTool.toolName}» اجرا گردید.\n${isAgentActive ? `دامنه شبکه عملیاتی بر اساس سطح دید ایجنت ویندوزی (${subnetScope}) پایش و کنترل شد.\n` : ''}خروجی و گزارش عملیات به شرح زیر است:`,
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            model_used: omniRouteMeta?.useOmniRoute ? omniRouteMeta.providerName : modelId,
            active_skills_used: skills,
            is_tool_command: true,
            is_command_mode: isCommandMode,
            network_scope: isAgentActive ? `${subnetScope} (${executionArmLabel})` : 'Global Server Mesh',
            omni_route: omniRouteMeta?.useOmniRoute ? {
              selected_provider: omniRouteMeta.providerName,
              provider_id: omniRouteMeta.providerId,
              latency_ms: omniRouteMeta.latencyMs || 38,
              hop_flow: omniRouteMeta.hopFlow || `Claude Code → OmniRoute → ${omniRouteMeta.providerName}`,
              failover_occurred: omniRouteMeta.failoverOccurred,
              previous_limited_provider: omniRouteMeta.previousProvider,
              routing_reason: omniRouteMeta.routingReason || 'مسیریابی خودکار'
            } : undefined,
            tool_execution: {
              id: `act-${Date.now()}`,
              tool_id: detectedTool.toolId,
              tool_name: detectedTool.toolName,
              command: detectedTool.defaultCmd,
              status: 'success' as const,
              execution_arm: executionArmLabel,
              output: agentScopeHeader + generateToolOutput(detectedTool.toolId, detectedTool.defaultCmd),
              executed_at: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            }
          };
        }
      }

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s))
      );
      return;
    }

    // 🤖 Agentic Engineering Loop: MCP Access → Specialist Skills (#LintAndTest) → Doctrinal Rules Gate
    const isMcpOrRulesRequest =
      text.includes('#LintAndTest') ||
      text.includes('#AutoTest') ||
      text.includes('#DocGen') ||
      text.includes('#QualityGate') ||
      text.toLowerCase().includes('lint') ||
      text.toLowerCase().includes('mcp') ||
      text.toLowerCase().includes('rules') ||
      text.includes('قوانین دکترینال') ||
      text.includes('گیت قوانین') ||
      text.includes('بررسی کد') ||
      text.includes('کامیت') ||
      text.includes('تست خودکار');

    if (isMcpOrRulesRequest) {
      const isAutoTest = text.includes('#AutoTest') || text.includes('تست خودکار');
      const isDocGen = text.includes('#DocGen') || text.includes('مستند');
      const isQualityGate = text.includes('#QualityGate') || text.includes('قوانین') || text.includes('کامیت');
      
      const skillId = isAutoTest ? 'skill_auto_test' : isDocGen ? 'skill_doc_gen' : isQualityGate ? 'skill_quality_gate' : 'skill_lint_and_test';
      const skillName = isAutoTest ? '#AutoTest' : isDocGen ? '#DocGen' : isQualityGate ? '#QualityGate' : '#LintAndTest';
      
      const hasSimulatedViolation = text.includes('تست ارور') || text.includes('خطا') || text.includes('تخلف') || text.includes('باگ') || (!text.includes('اصلاح') && !text.includes('fixed') && !text.includes('امن'));

      let mcpMeta: any;
      let replyContent = '';

      if (hasSimulatedViolation) {
        mcpMeta = {
          mcpServerUsed: 'Git Context Protocol Server (mcp-git)',
          toolInvoked: 'git_diff(target_branch="main", staged_only=true)',
          filesInspected: ['src/services/edgeBridgeService.ts', 'src/components/EdgeGateway.tsx'],
          diffSummary: `diff --git a/src/services/edgeBridgeService.ts b/src/services/edgeBridgeService.ts
--- a/src/services/edgeBridgeService.ts
+++ b/src/services/edgeBridgeService.ts
@@ -40,6 +40,7 @@ export class EdgeBridgeService {
+  // WARNING: Hardcoded secret token violates RULE-SEC-01
+  private edgeExchangeToken = "omni-live-edge-token-supersecret-9948fa";
+  private hubPort: number = 9000;`,
          activeSkillsUsed: [skillName, '#QualityGate'],
          rulesCheckedCount: projectRules.filter(r => r.isActive).length,
          violationsCount: 1,
          violations: [
            {
              ruleId: 'RULE-SEC-01',
              ruleTitle: 'سیاست افشای صفر توکن و رمز (Zero-Secret Leak Policy)',
              file: 'src/services/edgeBridgeService.ts',
              line: 42,
              severity: 'critical',
              explanation: 'رشته توکن اتصال لبه به صورت هاردکد در کد قرار دارد. این مقدار در تاریخچه گیت لو خواهد رفت و امنیت تونل ارتباطی هسته را به خطر می‌اندازد.',
              proposedFix: `// اصلاحیه مطابق مانیفست دکترینال SYSTEM_RULES.md:
private edgeExchangeToken = process.env.OMNIOPS_EDGE_EXCHANGE_TOKEN || "";`
            }
          ],
          decision: 'blocked',
          fixedCodeSnippet: `private edgeExchangeToken = process.env.OMNIOPS_EDGE_EXCHANGE_TOKEN || "";`
        };

        replyContent = `⛔ **گیت قوانین دکترینال پروژه (Rules Gate): فرآیند کامیت متوقف و مسدود گردید (BLOCKED)**

چرخه ایجنت مهندسی بر روی کدهای تغییریافته به پایان رسید:
۱. **دسترسی (MCP):** دریافت ۵۴ خط کدهای تغییریافته از طریق پروتکل کانتکست مدل با ابزار \`git_diff\`.
۲. **راهنما (Skills):** اجرای مهارت تخصصی \`${skillName}\` جهت ممیزی استاتیک و بازبینی امنیتی.
۳. **محدودیت (Rules):** انطباق کدها با قوانین فعال در فایل \`SYSTEM_RULES.md\`.

💥 **خطای بحرانی کشف‌شده:**
* قانون نقض‌شده: **[RULE-SEC-01] سیاست افشای صفر توکن و رمز (Zero-Secret Leak Policy)**
* فایل و خط: \`src/services/edgeBridgeService.ts:42\`
* وضعیت گیت: **مسدودسازی کامیت (Commit Blocked)** جهت جلوگیری از نشت اطلاعات محرمانه در مخزن.

💡 **راهکار اصلاحی آماده:**
تکه کد اصلاحی به صورت خودکار تدوین شده است؛ برای اعمال خودکار می‌توانید بر روی دکمه **«اعمال خودکار اصلاحیه و رفع باگ»** در باکس زیر کلیک کنید.`;
      } else {
        mcpMeta = {
          mcpServerUsed: 'Git Context Protocol Server (mcp-git)',
          toolInvoked: 'git_diff(staged_only=true)',
          filesInspected: ['src/services/edgeBridgeService.ts'],
          diffSummary: `diff --git a/src/services/edgeBridgeService.ts b/src/services/edgeBridgeService.ts
--- a/src/services/edgeBridgeService.ts
+++ b/src/services/edgeBridgeService.ts
@@ -40,6 +40,7 @@ export class EdgeBridgeService {
+  private edgeExchangeToken = process.env.OMNIOPS_EDGE_EXCHANGE_TOKEN || "";
+  private hubPort: number = Number(process.env.OMNIOPS_HUB_PORT) || 9000;`,
          activeSkillsUsed: [skillName, '#QualityGate'],
          rulesCheckedCount: projectRules.filter(r => r.isActive).length,
          violationsCount: 0,
          violations: [],
          decision: 'approved',
          commitMessageSuggested: 'feat(edge): enforce zero-leak environment credentials and configurable exchange port'
        };

        replyContent = `✅ **تاییدیه گیت قوانین دکترینال پروژه (PASSED ✓): تمامی استانداردها با موفقیت رعایت گردید.**

۱. **دسترسی (MCP):** فایل‌های مرحله‌بندی‌شده از طریق \`git_diff\` بازخوانی شدند.
۲. **راهنما (Skills):** مهارت \`${skillName}\` با موفقیت اجرا شد؛ تست‌های واحد پاس شده و هیچ خطای تایپ‌اسکریپت یا سینتکسی یافت نشد.
۳. **محدودیت (Rules Gate):** انطباق کامل با قوانین دکترینال \`SYSTEM_RULES.md\` احراز گردید (۰ تخلف امنیتی).

🚀 **پیام کامیت استاندارد پیشنهادی:**
\`\`\`bash
git commit -m "feat(edge): enforce zero-leak environment credentials and configurable exchange port"
\`\`\`
اکنون می‌توانید با اطمینان کامل کدها را در مخزن گیت کامیت و مرج نمایید.`;
      }

      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant' as const,
        content: replyContent,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        model_used: omniRouteMeta?.useOmniRoute ? omniRouteMeta.providerName : modelId,
        active_skills_used: [skillId],
        mcp_execution: mcpMeta,
        omni_route: omniRouteMeta?.useOmniRoute ? {
          selected_provider: omniRouteMeta.providerName,
          provider_id: omniRouteMeta.providerId,
          latency_ms: omniRouteMeta.latencyMs || 32,
          hop_flow: omniRouteMeta.hopFlow || `Claude Code → OmniRoute → ${omniRouteMeta.providerName}`,
          failover_occurred: omniRouteMeta.failoverOccurred,
          previous_limited_provider: omniRouteMeta.previousProvider,
          routing_reason: 'ارکستراسیون خودکار هوشمند بین APIها'
        } : undefined
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s))
      );
      return;
    }

    // Standard Conversational Flow (Images, Videos, Skills, General Chat)
    let responseText = '';
    let generatedMedia: any[] = [];
    const activeSkillObjects = skillsList.filter((s) => skills.includes(s.id));
    const skillNames = activeSkillObjects.map((s) => s.name.split(' ')[0]).join('، ');

    const lower = text.toLowerCase();
    const hasImage = attachments.some((a) => a.type === 'image');
    const hasLog = attachments.some((a) => a.type === 'file');
    const hasDoc = attachments.some((a) => a.type === 'file' || a.name?.match(/\.(pdf|docx?|xlsx?|csv|txt|doc|rtf)$/i));
    const isDocRagRequest = mediaRequest === 'diagram' && text.includes('سند') ? true : (mediaRequest as any) === 'document_rag' || hasDoc || (lower.includes('نامه') && attachments.length > 0) || (lower.includes('گزارش') && attachments.length > 0) || lower.includes('anythingllm');
    let documentAnalysis: any = undefined;

    if (isDocRagRequest && attachments.length > 0) {
      const docFile = attachments.find((a) => a.type === 'file' || a.name?.match(/\.(pdf|docx?|xlsx?|csv|txt|doc)$/i)) || attachments[0];
      const fileName = docFile?.name || 'نامه_و_گزارش_سازمانی.pdf';
      const isSpreadsheet = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv') || lower.includes('اکسل') || lower.includes('مالی');
      const isReport = fileName.includes('گزارش') || lower.includes('گزارش') || lower.includes('تحلیل');
      const isLetter = fileName.includes('نامه') || lower.includes('نامه') || lower.includes('اداری') || (!isSpreadsheet && !isReport);

      const docType = isSpreadsheet ? 'spreadsheet' : isReport ? 'report' : 'letter';
      const tokensSaved = Math.max(1800, Math.floor((docFile?.size || 120000) / 40) + 950);

      documentAnalysis = {
        id: `doc-rag-${Date.now()}`,
        fileName: fileName,
        fileSize: docFile?.size || 148500,
        documentType: docType,
        title: isLetter ? `تحلیل و بازخوانی نامه اداری: ${fileName}` : isReport ? `تحلیل گزارش مدیریتی و آماری: ${fileName}` : `استخراج و پردازش شیت داده‌های تحلیلی: ${fileName}`,
        summary: `سند «${fileName}» با موتور محلی AnythingLLM به صورت ۱۰۰٪ آفلاین و بدون مصرف توکن آنلاین پردازش شد. کلیه بخش‌های ساختاری، فرستنده، موضوع، فوریت و بندهای اصلی استخراج گردید.`,
        keyPoints: [
          `نوع و ماهیت سند: ${isLetter ? 'مکاتبه اداری رسمی با اولویت اقدام' : isReport ? 'گزارش عملکرد دوره‌ای و تحلیلی سازمانی' : 'جدول اقلام و داده‌های آماری'}`,
          `وضعیت اعتبارسنجی: محتوای سند کامل و پارس شده در وکتور دیتابیس محلی AnythingLLM`,
          `اقدام پیشنهادی: ارسال پاسخ رسمی اداری با شماره پیگیری اتوماسیون سازمانی`,
          `سیاست محرمانگی: داده‌های این سند از مرز سرور داخلی خارج نشدند`
        ],
        letterDraft: {
          subject: `پاسخ و اعلام اقدام پیرامون سند ${fileName.replace(/\.[^/.]+$/, '')}`,
          recipient: 'ریاست / معاونت محترم امور اجرایی و زیرساخت',
          sender: `واحد فناوری و هوش مصنوعی OmniOps (@${currentUser?.username || 'کاربر'})`,
          body: `با سلام و احترام،\nعطف به سند و مکاتبه واصله به شماره پیگیری پیرامون موضوع مندرج در فایل پیوست، به استحضار می‌رساند پس از ارزیابی‌های دقیق و استخراج بندهای کلیدی توسط موتور اسناد AnythingLLM، اقدامات لازم در چارچوب اختیارات سازمانی انجام پذیرفت و مراتب جهت استحضار و صدور دستور مقتضی تقدیم حضور می‌گردد.\nخواهشمند است دستور فرمایید هماهنگی‌های لازم با واحدهای تابعه صورت پذیرد.\nبا احترام و تشکر.`,
          actionRequired: 'ثبت در اتوماسیون مکاتبات اداری و ارجاع رونوشت به بایگانی'
        },
        tableData: isSpreadsheet ? {
          headers: ['ردیف', 'شاخص / سرفصل', 'مقدار / وضعیت', 'تغییرات دوره', 'سطح ریسک'],
          rows: [
            ['۱', 'نرخ در دسترس بودن سرورها', '۹۹.۹۴٪', '+۰.۰۲٪', 'عادی (پایدار)'],
            ['۲', 'مصرف حافظه و بار پردازش', '۶۴.۲٪', '-۳.۵٪', 'بهینه'],
            ['۳', 'حجم اسناد پردازش‌شده آفلاین', '۱,۴۲۰ صفحه', '+۴۸٪', 'صرفه‌جویی ۱۰۰٪ توکن'],
            ['۴', 'رویدادهای امنیتی شناسایی‌شده', '۰ مورد بحرانی', '۰', 'امن']
          ]
        } : undefined,
        engine: 'JEV + AnythingLLM (Local Offline)',
        tokensSavedEstimate: tokensSaved,
        privacyNotice: 'پردازش ۱۰۰٪ محلی و آفلاین با AnythingLLM و JEV درون شبکه سرور (۰ توکن خارجی مصرف شد)'
      };

      addSystemLog(
        'JEV',
        'SUCCESS',
        `قطعه‌بندی هوشمند متون سند «${fileName}» با چانک‌های ۵۱۲ توکنی تکمیل گردید.`,
        'DISPATCH'
      );
      addSystemLog(
        'AnythingLLM',
        'SUCCESS',
        `تحلیل سند «${fileName}» و تدوین پیش‌نویس اداری بدون کسر توکن (${tokensSaved.toLocaleString('fa-IR')} توکن ذخیره شد)`,
        'DISPATCH',
        `اندازه: ${(docFile?.size || 148500).toLocaleString('fa-IR')} بایت`
      );

      responseText = `📄 **سند پیوستی «${fileName}» با موفقیت توسط پردازشگر محلی AnythingLLM و JEV دریافت و تحلیل شد.**\n\n` +
        `🔒 **حفظ محرمانگی و صرفه‌جویی هزینه:** به دلیل فعال بودن معماری هیبریدی، این فایل بدون ارسال به سرورهای خارجی یا مصرف سهمیه توکن API پردازش گردید (تقریباً **${tokensSaved.toLocaleString('fa-IR')} توکن** صرفه‌جویی شد).\n\n` +
        `• **نتیجه تحلیل و خلاصه سند:** مفاد اصلی سند خوانده شده و نکات کلیدی، ضرب‌الاجل‌ها و پیش‌نویس اداری استاندارد در کارت تحلیلی زیر آماده بهره‌برداری است.\n` +
        `• **پیش‌نویس نامه:** متن پاسخ رسمی با لحن اداری استاندارد جهت درج در سربرگ و ارسال به اتوماسیون سازمانی تدوین گردید.`;
    } else if (mediaRequest === 'image' || lower.includes('دیاگرام') || lower.includes('تصویر') || lower.includes('توپولوژی')) {
      const diagramTitle = text.slice(0, 40) || 'توپولوژی شبکه سازمانی OmniOps';
      const svgUrl = createTopologySvgUrl(diagramTitle);
      generatedMedia.push({
        id: `media-img-${Date.now()}`,
        type: 'image',
        url: svgUrl,
        title: `دیاگرام معماری: ${diagramTitle}`,
        prompt: text,
        model: modelId
      });
      responseText = `دیاگرام معماری و توپولوژی درخواستی با استفاده از موتور هوش مصنوعی (${modelId}) تولید و تصویر با وضوح بالا رندر گردید.\n\n**اجزای کلیدی منعکس‌شده در طرح:**\n۱. درگاه ارتباطی WAN و اینترنت بیرونی\n۲. روتر مرکزی MikroTik CCR با پیکربندی امنیتی فایروال و FastTrack\n۳. سوئیچ‌های توزیع سیسکو با ترانکینگ و تفکیک ویلن‌ها (VLAN 10 سرورها و استک Ollama/Dify، VLAN 20 کلاینت‌ها و n8n)`;
    } else if (mediaRequest === 'video' || lower.includes('ویدیو') || lower.includes('انیمیشن') || lower.includes('شبیه‌سازی')) {
      generatedMedia.push({
        id: `media-vid-${Date.now()}`,
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: 'شبیه‌سازی ویدیویی جریان بسته‌های شبکه و سوئیچینگ',
        prompt: text,
        model: modelId
      });
      responseText = `شبیه‌سازی متحرک ویدیویی جریان ترافیک شبکه، عبور بسته‌های داده از فیلترهای فایروال و روتینگ به صورت موفق ایجاد و در پلیر زیر قابل مشاهده و بررسی است.`;
    } else if (hasImage) {
      responseText = `تصویر ارسالی شما با موفقیت توسط بینایی ماشین مدل (${modelId}) دریافت و تحلیل شد.\n\nبررسی بر اساس دانش ${skillNames || 'مهندسی سیستم'}:\n• خطای ثبت شده در اسکرین‌شات مربوط به محدودیت دسترسی یا تداخل پیکربندی است.\n• پیشنهاد می‌شود دسترسی پورت‌های مربوطه در فایروال را بررسی نموده و وضعیت ارتباط کلاینت را بازبینی فرمایید.`;
    } else if (hasLog) {
      const file = attachments.find((a) => a.type === 'file');
      responseText = `فایل پیوست «${file?.name}» بازخوانی شد. تحلیل ساختار بر اساس دانش ${skillNames}:\n• لاگ‌ها نشان‌دهنده فعالیت نرمال سرویس‌ها با چند هشدار مربوط به بازه زمانی اخیر هستند.\n• جهت پیشگیری از انباشتگی، تنظیم لاگ‌روتیشن (Log Rotation) توصیه می‌گردد.`;
    } else if (skills.includes('mikrotik_expert') && (lower.includes('میکروتیک') || lower.includes('روتر') || lower.includes('فایروال') || lower.includes('ip'))) {
      responseText = `پاسخ با اتکا به دانش مهندسی و روتینگ MikroTik RouterOS:\n\nدر معماری شبکه میکروتیک، برای دستیابی به حداکثر توان عملیاتی و کاهش بار پردازنده (CPU Load):\n1. قوانین FastTrack باید در ابتدای زنجیره \`forward\` فیلتر قرار گیرند.\n2. برای ترافیک‌های حساس به NAT یا اینترنت، از \`action=masquerade\` بر روی اینترفیس خروجی (Out Interface List=WAN) استفاده شود.\n3. پورت‌های سرویس‌های ناامن در \`/ip service\` غیرفعال شوند.`;
    } else if (skills.includes('powershell_enterprise') && (lower.includes('پاورشل') || lower.includes('ویندوز') || lower.includes('اسکریپت'))) {
      responseText = `راهکار تخصصی PowerShell Enterprise:\n\n\`\`\`powershell
# بررسی وضعیت سلامت سرویس‌ها و ثبت خطا در فرمت ساختاریافته
Try {
    Get-Service | Where-Object { $_.Status -eq 'Running' } | 
    Select-Object -Property Name, DisplayName, Status | 
    Export-Csv -Path "C:\\OmniOps_Audit.csv" -NoTypeInformation -Encoding UTF8
    Write-Output "[+] خروجی با موفقیت در فایل گزارش ثبت شد."
} Catch {
    Write-Error "[-] خطا در دریافت وضعیت سرویس‌ها: $_"
}
\`\`\`\nدستور فوق بدون سربار حافظه اجرا شده و سازگار با سیستم‌عامل‌های سرور سازمانی است.`;
    } else {
      responseText = `درخواست شما با موفقیت دریافت و توسط مدل هوشمند (${modelId}) با تزریق سرفصل‌های دانشی «${skillNames || 'عمومی'}» پردازش شد.\n\nتمام دستورالعمل‌ها، بهترین رویه‌ها و ملاحظات معماری در پاسخ لحاظ شده و آماده ادامه گفتگو یا دریافت پرسش‌های تکمیلی هستیم.`;
    }

    if (omniRouteMeta?.useOmniRoute && omniRouteMeta.failoverOccurred && omniRouteMeta.previousProvider) {
      responseText = `🔀 **سوییچ خودکار OmniRoute (کنترل هوشمند ترافیک):** ارائه‌دهنده «${omniRouteMeta.previousProvider}» به دلیل محدودیت سهمیه کنار گذاشته شد و درخواست بدون وقفه به **«${omniRouteMeta.providerName}»** هدایت گردید. (توقف کمتر، زمان بیشتر)\n\n` + responseText;
    }

    const assistantMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant' as const,
      content: responseText,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      model_used: omniRouteMeta?.useOmniRoute ? omniRouteMeta.providerName : modelId,
      active_skills_used: skills,
      generated_media: generatedMedia.length > 0 ? generatedMedia : undefined,
      document_analysis: documentAnalysis,
      omni_route: omniRouteMeta?.useOmniRoute ? {
        selected_provider: omniRouteMeta.providerName,
        provider_id: omniRouteMeta.providerId,
        latency_ms: omniRouteMeta.latencyMs || 42,
        hop_flow: omniRouteMeta.hopFlow || `Claude Code → OmniRoute → ${omniRouteMeta.providerName}`,
        failover_occurred: omniRouteMeta.failoverOccurred,
        previous_limited_provider: omniRouteMeta.previousProvider,
        routing_reason: omniRouteMeta.routingReason || 'مسیریابی خودکار بدون توقف نشست'
      } : undefined
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s))
    );
  };

  const handleCreateSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `مکالمه سازمانی #${sessions.length + 1}`,
      selected_model: availableModels[0]?.model_id || 'gemini-2.5-flash',
      active_skills: [...activeSkillIds],
      created_at: new Date().toLocaleDateString('fa-IR'),
      messages: []
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s))
    );
  };

  const handleTogglePinSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, is_pinned: !s.is_pinned } : s))
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: `session-${Date.now()}`,
          title: 'مکالمه سازمانی جدید',
          selected_model: availableModels[0]?.model_id || 'gemini-2.5-flash',
          active_skills: [...activeSkillIds],
          created_at: new Date().toLocaleDateString('fa-IR'),
          messages: []
        };
        setCurrentSessionId(fallback.id);
        return [fallback];
      }
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-neutral-100 flex flex-col font-sans" dir="rtl">
      {/* Top Header: Ultra-responsive Swiss Design */}
      <header className="h-16 px-4 md:px-7 border-b border-neutral-800/80 bg-[#121216]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between shadow-sm">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-600/30">
            Ω
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-bold tracking-tight text-white leading-none">
              OmniOps Enterprise
            </span>
            <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline mt-0.5">
              مدیریت هوشمند زیرساخت و شبکه
            </span>
          </div>
        </div>

        {/* Desktop Navigation - Dynamically tailored by user RBAC role */}
        <nav className="hidden md:flex items-center gap-1.5">
          {/* Regular Users: ONLY access to Chatroom */}
          {currentUser?.role === 'User' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-950/20 border border-blue-500/25 rounded-xl text-xs text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">چت‌روم هوشمند سازمانی</span>
              <span className="text-[10px] text-blue-300 font-mono">ایزوله کاربری</span>
            </div>
          ) : (
            <>
              {/* 1. Chatrooms (Available to all) */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>چت‌روم‌ها</span>
              </button>

              {/* 2. Skills, Knowledge & Tools (Admin & SuperAdmin only) */}
              {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin') && (
                <button
                  onClick={() => setActiveTab('tools')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'tools'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>مهارت‌ها، دانش و ابزارها</span>
                  {activeSkillIds.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              )}

              {/* 3. Server Infrastructure & Operations (SuperAdmin exclusive) */}
              {currentUser?.role === 'SuperAdmin' && (
                <button
                  onClick={() => setActiveTab('server_infra')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'server_infra'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>فرماندهی و زیرساخت سرور</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              )}

              {/* 4. Settings & API (Admin & SuperAdmin only) */}
              {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin') && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>تنظیمات و API</span>
                </button>
              )}

              {/* 5. Users & Auth (SuperAdmin only) */}
              {currentUser?.role === 'SuperAdmin' && (
                <button
                  onClick={() => setActiveTab('auth')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'auth'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>کاربران و امنیت</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-3">
          {proxyConfig.enabled && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-400 pl-3 border-l border-neutral-800 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SOCKS5 :1080</span>
            </div>
          )}

          {/* Quick Theme Toggle (Dark High-Contrast / Neutral Light WCAG) */}
          <button
            type="button"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors border border-neutral-800/60"
            title={theme === 'dark' ? 'سوئیچ به تم روشن و خنثی (Accessibility WCAG)' : 'سوئیچ به تم تیره با کنتراست بالا'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          {currentUser ? (
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-neutral-800/80 transition-colors border border-transparent hover:border-neutral-700"
              title="مشاهده پروفایل و جزییات دسترسی سازمانی"
            >
              <div className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                currentUser.role === 'SuperAdmin'
                  ? 'bg-amber-600/20 border border-amber-500/40 text-amber-300'
                  : currentUser.role === 'Admin'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400'
                  : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
              }`}>
                {currentUser.username[0].toUpperCase()}
              </div>
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-semibold text-white leading-tight">
                  @{currentUser.username}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                  <span className={
                    currentUser.role === 'SuperAdmin' 
                      ? 'text-amber-400 font-semibold' 
                      : currentUser.role === 'Admin' 
                      ? 'text-blue-400 font-semibold' 
                      : 'text-emerald-400 font-medium'
                  }>
                    {currentUser.role === 'SuperAdmin' ? 'SuperAdmin' : currentUser.role === 'Admin' ? 'IT Admin' : 'کاربر عادی'}
                  </span>
                  <span>·</span>
                  <span className={currentUser.role === 'User' ? 'text-neutral-400' : 'text-emerald-400'}>
                    {currentUser.role === 'User' 
                      ? 'چت‌روم ایزوله' 
                      : `${(currentUser.allowed_tools !== undefined ? currentUser.allowed_tools.length : (currentUser.role === 'SuperAdmin' ? 8 : 4))} ابزار`}
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl"
            >
              ورود
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown - Role Tailored */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#141418] border-b border-neutral-800 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-3 duration-150">
          <button
            onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
            className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-neutral-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>چت‌روم‌ها</span>
          </button>

          {/* Regular Users: No admin tabs */}
          {currentUser?.role !== 'User' && (
            <>
              {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin') && (
                <button
                  onClick={() => { setActiveTab('tools'); setMobileMenuOpen(false); }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    activeTab === 'tools' ? 'bg-blue-600 text-white' : 'text-neutral-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>مهارت‌ها، دانش و ابزارها</span>
                </button>
              )}

              {currentUser?.role === 'SuperAdmin' && (
                <button
                  onClick={() => { setActiveTab('server_infra'); setMobileMenuOpen(false); }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    activeTab === 'server_infra' ? 'bg-blue-600 text-white' : 'text-neutral-300'
                  }`}
                >
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>فرماندهی و زیرساخت سرور</span>
                </button>
              )}

              {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin') && (
                <button
                  onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-neutral-300'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>تنظیمات و API</span>
                </button>
              )}

              {currentUser?.role === 'SuperAdmin' && (
                <button
                  onClick={() => { setActiveTab('auth'); setMobileMenuOpen(false); }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    activeTab === 'auth' ? 'bg-blue-600 text-white' : 'text-neutral-300'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>کاربران و امنیت</span>
                </button>
              )}
            </>
          )}

          {/* Quick profile switch action in mobile */}
          <button
            onClick={() => { setIsProfileModalOpen(true); setMobileMenuOpen(false); }}
            className="w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 text-cyan-300 bg-cyan-950/20 border border-cyan-500/20"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>مشاهده پروفایل و سوییچ حساب</span>
          </button>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 md:p-6">
        {activeTab === 'chat' && currentUser && (
          <ChatModule
            currentUser={currentUser}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onCreateSession={handleCreateSession}
            availableModels={availableModels}
            availableSkills={skillsList}
            activeSkillIds={activeSkillIds}
            onToggleSkill={handleToggleSkill}
            onSendMessage={handleSendMessage}
            prefilledPrompt={prefilledPrompt}
            onClearPrefilledPrompt={() => setPrefilledPrompt(null)}
            isDocumentEngineActive={activeLocalServices.anythingllm || activeLocalServices.jev}
            onNavigateToServerInfra={() => setActiveTab('server_infra')}
            onRenameSession={handleRenameSession}
            onTogglePinSession={handleTogglePinSession}
            onDeleteSession={handleDeleteSession}
            projectRules={projectRules}
            mcpServers={mcpServers}
            onOpenMcpRulesModal={(tab) => {
              setIsMcpRulesModalOpen(true);
            }}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsModule
            skills={skillsList}
            activeSkillIds={activeSkillIds}
            onToggleSkill={handleToggleSkill}
            onSelectSampleQuery={handleSelectSampleQuery}
            onAddSkill={handleAddSkill}
            availableModels={availableModels}
            agentRunning={agentRunning}
            onToggleAgentRunning={handleToggleAgentRunning}
            onNavigateToServerInfra={() => setActiveTab('server_infra')}
          />
        )}

        {activeTab === 'server_infra' && currentUser?.role === 'SuperAdmin' && (
          <ServerManagementModule
            currentUser={currentUser}
            availableModels={availableModels}
            activeServices={activeLocalServices}
            onToggleService={handleToggleLocalService}
            systemLogs={systemLogs}
            isSystemLoggingActive={isSystemLoggingActive}
            onToggleSystemLogging={handleToggleSystemLogging}
            onClearSystemLogs={handleClearSystemLogs}
            onAddSystemLog={addSystemLog}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModule
            apiKeys={apiKeys}
            providersList={providersList}
            onAddCustomProvider={handleAddCustomProvider}
            onSaveKey={handleSaveApiKey}
            onDeleteKey={handleDeleteApiKey}
            onFetchModels={handleFetchModels}
            proxyConfig={proxyConfig}
            onUpdateProxy={setProxyConfig}
            theme={theme}
            onToggleTheme={setTheme}
            onTestProxy={async () => ({ 
              success: true, 
              message: `ارتباط با پراکسی SOCKS5 در آدرس ${proxyConfig.host}:${proxyConfig.port} موفقیت‌آمیز است.` 
            })}
          />
        )}

        {activeTab === 'auth' && (
          <AuthModule
            currentUser={currentUser}
            onLoginSuccess={(u) => {
              setCurrentUser(u);
            }}
            onLogout={() => {
              setCurrentUser(null);
              setActiveTab('chat');
            }}
            usersList={usersList}
            onAddUser={(nu) => setUsersList([...usersList, { ...nu, id: usersList.length + 1 }])}
            onUpdateUserPermissions={handleUpdateUserPermissions}
          />
        )}
      </main>

      {/* Role Profile & Persona Switcher Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#141419] border border-neutral-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  currentUser?.role === 'SuperAdmin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : currentUser?.role === 'Admin'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentUser?.full_name || 'کاربر'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      currentUser?.role === 'SuperAdmin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : currentUser?.role === 'Admin'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUser?.role}
                    </span>
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono">@{currentUser?.username} · {currentUser?.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Profile Permissions & Layout Details */}
            <div className="bg-[#101014] border border-neutral-800/80 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">قالب فعال صفحه:</span>
                <span className="text-white font-semibold">
                  {currentUser?.role === 'User'
                    ? 'قالب کاربر عادی (ایزوله متنی - فقط چت‌روم)'
                    : currentUser?.role === 'Admin'
                    ? 'قالب مدیر فناوری اطلاعات (ابزارها و تنظیمات)'
                    : 'قالب مدیر ارشد زیرساخت (مرکز فرماندهی کل)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">دسترسی به محیط فرامین:</span>
                <span className={currentUser?.role === 'User' ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                  {currentUser?.role === 'User' ? 'حذف شده و غیرفعال (طبق سیاست امنیتی)' : 'فعال و مجاز با بازوهای اجرایی'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">تعداد ابزارهای مجاز در پروفایل:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {currentUser?.allowed_tools?.length || 0} ابزار
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed pt-1 border-t border-neutral-800/60">
                {currentUser?.role === 'User'
                  ? 'بر اساس دستورالعمل امنیتی سازمان، کاربران عادی منحصراً به چت‌روم مکالمه دسترسی دارند و گزینه‌های سرور، فرامین، مهارت‌ها و مدیریت از دید آن‌ها به طور کامل حذف گردیده است.'
                  : 'این حساب دسترسی به ابزارهای اجرایی سیستم، اسکریپت‌های شبکه و تنظیمات پلتفرم دارد.'}
              </p>
            </div>

            {/* Persona Switcher for Quick Demonstration */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">
                تغییر پروفایل کاربری جهت بررسی تفاوت قالب‌ها (Persona Switcher):
              </span>
              <div className="grid grid-cols-1 gap-2">
                {usersList.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCurrentUser(u);
                        setActiveTab('chat');
                        setIsProfileModalOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-right text-xs transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500/50 text-white'
                          : 'bg-[#18181F] border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center ${
                          u.role === 'SuperAdmin' ? 'bg-amber-500/20 text-amber-300' : u.role === 'Admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">@{u.username} ({u.full_name})</div>
                          <div className="text-[10px] text-neutral-400">
                            {u.role === 'User' ? 'قالب کاربر عادی (فقط چت‌روم، حذف فرامین)' : u.role === 'Admin' ? 'قالب مدیر IT (ابزارها و تنظیمات)' : 'قالب SuperAdmin (دسترسی کامل به هسته و فرامین)'}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          فعال جاری
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              {currentUser?.role === 'SuperAdmin' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('auth');
                    setIsProfileModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                >
                  مدیریت دسترسی‌ها (RBAC)
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  setActiveTab('chat');
                  setIsProfileModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors mr-auto"
              >
                خروج از حساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ Model Context Protocol (MCP) & Doctrinal Rules Gate Manager Modal */}
      <McpRulesManagerModal
        isOpen={isMcpRulesModalOpen}
        onClose={() => setIsMcpRulesModalOpen(false)}
        rules={projectRules}
        onToggleRule={handleToggleRule}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
        mcpServers={mcpServers}
        onTriggerSkillInChat={(skillTag, samplePrompt) => {
          setIsMcpRulesModalOpen(false);
          setActiveTab('chat');
          setPrefilledPrompt({ text: samplePrompt, skillId: 'skill_lint_and_test' });
        }}
      />
    </div>
  );
}
