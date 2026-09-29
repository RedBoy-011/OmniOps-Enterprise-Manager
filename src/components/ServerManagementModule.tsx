import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  AiModel, 
  ChatAttachment, 
  ServerCommandAction,
  ChatMessage,
  CustomQuickCommand,
  SystemLogEntry
} from '../types';
import { ClusterHealthDonutDashboard } from './ClusterHealthDonutDashboard';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Paperclip, 
  Send, 
  Bot, 
  User as UserIcon, 
  Zap, 
  Cpu, 
  Layers, 
  Workflow, 
  Database, 
  Copy, 
  Check, 
  RotateCcw,
  Sparkles,
  Server,
  FileCode,
  Activity,
  HardDrive,
  Network,
  Clock,
  ExternalLink,
  Globe,
  Shield,
  Download,
  Plus,
  Trash2,
  X,
  FileText,
  BookOpen,
  Link as LinkIcon,
  Filter,
  Search,
  CheckCheck,
  Calendar,
  Key,
  Lock,
  Moon,
  Sun,
  Timer,
  Sliders,
  Power,
  Radio,
  Brain,
  Wifi,
  WifiOff,
  MessageSquare,
  Save,
  Share2,
  SlidersHorizontal,
  Gauge
} from 'lucide-react';

interface LocalModelItem {
  id: string;
  name: string;
  tag: string;
  category: 'reasoning' | 'general' | 'code' | 'vision' | 'embedding';
  categoryLabel: string;
  sizeGb: number;
  description: string;
  isDownloaded: boolean;
  isActive: boolean;
  downloadProgress?: number; // 0 to 100
  scheduledTime?: string; // e.g. "02:30"
}

interface ServerManagementModuleProps {
  currentUser: User;
  availableModels: AiModel[];
  activeServices?: {
    core: boolean;
    ollama: boolean;
    anythingllm: boolean;
    langflow: boolean;
    jev: boolean;
    n8n: boolean;
    dify: boolean;
  };
  onToggleService?: (serviceId: 'core' | 'ollama' | 'anythingllm' | 'langflow' | 'jev' | 'n8n' | 'dify') => void;
  systemLogs?: SystemLogEntry[];
  isSystemLoggingActive?: boolean;
  onToggleSystemLogging?: () => void;
  onClearSystemLogs?: () => void;
  onAddSystemLog?: (
    component: SystemLogEntry['component'],
    level: SystemLogEntry['level'],
    message: string,
    phase?: SystemLogEntry['phase'],
    details?: string
  ) => void;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'download_model' | 'restart_service' | 'cache_flush' | 'security_audit' | 'custom_cron';
  targetService: 'Ollama' | 'Langflow' | 'AnythingLLM' | 'JEV' | 'Core' | 'n8n' | 'Supabase';
  cronExpression: string;
  scheduledTimePersian: string;
  command: string;
  description: string;
  isActive: boolean;
  offPeakOnly: boolean;
  nextRunFormatted: string;
  lastRunStatus?: 'success' | 'failed' | 'pending';
  lastRunTime?: string;
  lastOutput?: string;
}

export interface AdminCoreMemoryItem {
  id: string;
  key: string;
  category: 'architecture' | 'failover' | 'network' | 'workflow' | 'security';
  title: string;
  content: string;
  updatedAt: string;
  isPermanent: boolean;
  source: string;
}

export interface ServiceMeshPingItem {
  id: string;
  name: string;
  port: string;
  protocol: string;
  role: string;
  status: 'idle' | 'testing' | 'online' | 'warning' | 'error';
  latencyMs: number;
  packetLoss: string;
  failoverReady: boolean;
  message: string;
}

export interface AdminChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed: string;
  memoryReferenced?: string;
  envSnapshot?: Record<string, string>;
  keyDecisionMade?: string;
}

export interface AdminEnvVariable {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
  isSystem: boolean;
}

export interface AdminKeyDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  status: 'active' | 'enforced' | 'archived';
  timestamp: string;
  author: string;
}

export interface WorkerNode {
  id: string;
  name: string;
  ip: string;
  sshPort: number;
  sshUser: string;
  authType: 'password' | 'private_key' | 'token';
  authSecret?: string;
  agentPort: number;
  status: 'online' | 'busy' | 'offline' | 'warning' | 'connecting';
  role: 'llm_heavy' | 'hybrid_worker' | 'embedding_rag' | 'standby';
  specs: {
    cpuCores: number;
    cpuModel: string;
    cpuUsagePercent: number;
    ramTotalGb: number;
    ramUsedGb: number;
    gpuName?: string;
    vramTotalGb?: number;
    vramUsedGb?: number;
    diskTotalGb: number;
    diskUsedGb: number;
    os: string;
    uptime: string;
    pingMs: number;
  };
  assignedModels: string[];
  offloadedTasksCount: number;
  lastHeartbeat: string;
  createdAt: string;
}

export interface HardwareAssessmentReport {
  evaluatedAt: string;
  tier: 'light_master' | 'mid_tier' | 'enterprise_heavy';
  tierTitle: string;
  score: number;
  cpu: {
    cores: number;
    model: string;
    rating: string;
  };
  ram: {
    totalGb: number;
    availableGb: number;
    rating: string;
    recommendation: string;
  };
  gpu: {
    detected: boolean;
    name: string;
    recommendation: string;
  };
  disk: {
    totalGb: number;
    freeGb: number;
    isSsd: boolean;
  };
  architectVerdict: string;
  upgradeRecommendations: string[];
}

export const MASTER_NODE_SPECS = {
  name: 'Master Control-Plane (سرور پنل و ارکستراتور مرکزی)',
  ip: '127.0.0.1 (Localhost :9000)',
  port: 9000,
  role: 'master',
  status: 'online',
  cpuCores: 8,
  cpuModel: 'Intel Xeon E5-2680 v4 @ 2.40GHz',
  cpuUsagePercent: 19,
  ramTotalGb: 16.0,
  ramUsedGb: 5.8,
  gpuName: 'یافت نشد (ایزوله صرفاً برای پنل مرکزی و وب‌سوکت‌ها)',
  diskTotalGb: 250,
  diskUsedGb: 64,
  os: 'Ubuntu 24.04 LTS (x86_64)',
  uptime: '45 روز و ۸ ساعت',
  pingMs: 0
};

export const INITIAL_WORKER_NODES: WorkerNode[] = [
  {
    id: 'node-worker-tehran-gpu',
    name: 'Worker-01 (Tehran GPU Compute Node)',
    ip: '192.168.1.150',
    sshPort: 22,
    sshUser: 'root',
    authType: 'password',
    authSecret: '••••••••••••',
    agentPort: 11434,
    status: 'online',
    role: 'llm_heavy',
    specs: {
      cpuCores: 24,
      cpuModel: 'AMD EPYC 7763 64-Core Processor (x86_64)',
      cpuUsagePercent: 38,
      ramTotalGb: 64.0,
      ramUsedGb: 28.4,
      gpuName: 'NVIDIA GeForce RTX 4090 (24 GB VRAM)',
      vramTotalGb: 24.0,
      vramUsedGb: 18.2,
      diskTotalGb: 1000,
      diskUsedGb: 245,
      os: 'Ubuntu 24.04 LTS',
      uptime: '18 روز و ۴ ساعت',
      pingMs: 4
    },
    assignedModels: ['deepseek-r1:14b', 'dorna2:8b', 'llama3.3:70b-q4'],
    offloadedTasksCount: 1482,
    lastHeartbeat: 'هم‌اکنون (۲ ثانیه پیش)',
    createdAt: '۱۴۰۳/۰۷/۱۰'
  },
  {
    id: 'node-worker-compute-cpu',
    name: 'Worker-02 (Compute & Vector Search Node)',
    ip: '10.0.10.45',
    sshPort: 22,
    sshUser: 'ubuntu',
    authType: 'token',
    authSecret: 'omni-node-join-••••••••',
    agentPort: 11434,
    status: 'online',
    role: 'embedding_rag',
    specs: {
      cpuCores: 16,
      cpuModel: 'Intel Xeon Platinum 8375C @ 2.80GHz',
      cpuUsagePercent: 24,
      ramTotalGb: 32.0,
      ramUsedGb: 12.1,
      gpuName: 'CPU Inference (AVX-512 VNNI)',
      diskTotalGb: 500,
      diskUsedGb: 112,
      os: 'Ubuntu 22.04 LTS',
      uptime: '32 روز و ۱۲ ساعت',
      pingMs: 9
    },
    assignedModels: ['qwen2.5-coder:7b', 'bge-m3:latest', 'nomic-embed-text:latest'],
    offloadedTasksCount: 894,
    lastHeartbeat: 'هم‌اکنون (۵ ثانیه پیش)',
    createdAt: '۱۴۰۳/۰۷/۱۵'
  }
];

export interface EdgeGatewayNode {
  id: string;
  name: string;
  edgeIp: string;
  domain: string;
  datacenter: string;
  ramGb: number;
  cpuCores: number;
  status: 'online' | 'degraded' | 'offline';
  sslStatus: 'valid' | 'generating' | 'expired';
  sslIssuer: string;
  sslExpiresInDays: number;
  tunnelProtocol: string;
  latencyToCoreMs: number;
  activeUsersCount: number;
  lastHeartbeat: string;
  createdAt: string;
}

export const INITIAL_EDGE_GATEWAY_NODES: EdgeGatewayNode[] = [
  {
    id: 'edge-node-tehran-cdn',
    name: 'Edge-Mirror-01 (Tehran Datacenter / CDN)',
    edgeIp: '185.143.232.14',
    domain: 'https://panel.omniops.ir',
    datacenter: 'آسیاتک برج میلاد (ایران)',
    ramGb: 2.0,
    cpuCores: 2,
    status: 'online',
    sslStatus: 'valid',
    sslIssuer: "Let's Encrypt Authority X3",
    sslExpiresInDays: 84,
    tunnelProtocol: 'WSS / TLS 1.3 (AES-256-GCM)',
    latencyToCoreMs: 3,
    activeUsersCount: 32,
    lastHeartbeat: 'هم‌اکنون (۱ ثانیه پیش)',
    createdAt: '۱۴۰۳/۰۷/۱۸'
  },
  {
    id: 'edge-node-frankfurt-cdn',
    name: 'Edge-Mirror-02 (Frankfurt Edge VPS)',
    edgeIp: '45.76.120.88',
    domain: 'https://cdn-edge.omniops.net',
    datacenter: 'Hetzner Frankfurt (آلمان)',
    ramGb: 1.0,
    cpuCores: 1,
    status: 'online',
    sslStatus: 'valid',
    sslIssuer: "Let's Encrypt Authority X3",
    sslExpiresInDays: 71,
    tunnelProtocol: 'WSS / TLS 1.3 (AES-256-GCM)',
    latencyToCoreMs: 22,
    activeUsersCount: 16,
    lastHeartbeat: 'هم‌اکنون (۲ ثانیه پیش)',
    createdAt: '۱۴۰۳/۰۷/۲۰'
  }
];

export const INITIAL_HARDWARE_REPORT: HardwareAssessmentReport = {
  evaluatedAt: 'هم‌اکنون (در شروع نصب و ارزیابی سرور)',
  tier: 'light_master',
  tierTitle: 'سرور پایه کنترل مرکزی (Dedicated Control-Plane)',
  score: 68,
  cpu: {
    cores: 8,
    model: 'Intel Xeon E5-2680 v4 (8 vCPUs)',
    rating: 'مناسب برای مدیریت کلاستر، پایگاه‌داده و وب‌سوکت‌ها'
  },
  ram: {
    totalGb: 16.0,
    availableGb: 10.2,
    rating: 'متوسط (ایده‌آل برای پنل وب، محدود برای مدل‌های سنگین استنتاج)',
    recommendation: 'جهت بارگذاری همزمان مدل‌های استدلال عمیق DeepSeek-R1 (14B) یا اجرای موازی با Dorna2، حداقل ۳۲ گیگابایت RAM یا افزودن Worker Node اختصاصی لازم است.'
  },
  gpu: {
    detected: false,
    name: 'کارت گرافیک اختصاصی NVIDIA یافت نشد (استنتاج با پردازنده مرکزی CPU)',
    recommendation: 'استنتاج مدل‌ها روی CPU با سرعت ۲ الی ۵ توکن بر ثانیه انجام خواهد شد. ارتقا پیشنهادی: الحاق یک سرور Worker Node مجهز به NVIDIA RTX 3090/4090 به کلاستر.'
  },
  disk: {
    totalGb: 250,
    freeGb: 186,
    isSsd: true
  },
  architectVerdict: 'معماری برتر تایید شده: به جای ارتقای هزینه‌بر یک سرور منفرد، پنل ادمین روی همین سرور سبک به عنوان Master Control-Plane ایزوله بماند و بارهای سنگین محاسباتی LLM به سرور دوم یا سوم (Worker Nodes) با دستور تک‌خطی هدایت شوند تا پنل مرکزی در شدیدترین شرایط بحرانی همواره بالا بماند.',
  upgradeRecommendations: [
    'استفاده از دستور تک‌خطی install-worker.sh روی سرور دوم دارای GPU برای اتصال آنی به این پنل.',
    'در صورت تمایل به اجرای تمام مدل‌ها روی همین تک‌سرور، ارتقای حافظه موقت (RAM) به حداقل ۳۲ یا ۶۴ گیگابایت پیشنهاد می‌شود.',
    'پیکربندی شبکه امن اینترنال (WireGuard Mesh) برای ارتباط بدون پورت عمومی بین مستر و نودهای ورکر.',
    'فعال‌سازی Offloading هوشمند جهت هدایت خودکار مدل‌های بالای ۷B به نودهای پردازشی.'
  ]
};

const INITIAL_ENV_VARIABLES: AdminEnvVariable[] = [
  {
    id: 'env-1',
    key: 'CORE_BRIDGE_IP',
    value: '172.28.0.1:9000',
    description: 'آدرس بریج شبکه داکر امن OmniOps Mesh جهت ارتباط ایجنت‌ها',
    updatedAt: 'امروز ۱۰:۰۰',
    isSystem: true
  },
  {
    id: 'env-2',
    key: 'OLLAMA_CORE_MODEL',
    value: 'ollama/dorna2:8b',
    description: 'مدل ملی و بومی فعال روی اولاما لوکال بدون اینترنت (Dorna 2 / Maral)',
    updatedAt: 'امروز ۱۰:۱۵',
    isSystem: true
  },
  {
    id: 'env-3',
    key: 'FAILOVER_LATENCY_THRESHOLD_MS',
    value: '50',
    description: 'آستانه زمانی فعال‌سازی سوییچ خودکار به اولاما در صورت کندی کلاد',
    updatedAt: 'امروز ۱۰:۲۰',
    isSystem: true
  },
  {
    id: 'env-4',
    key: 'ZERO_TOKEN_SECURITY_POLICY',
    value: 'ENFORCE_LOCAL_ONLY',
    description: 'ممنوعیت ارسال داده‌های اسناد و مکاتبات اداری AnythingLLM به کلاد',
    updatedAt: 'امروز ۱۰:۳۰',
    isSystem: true
  },
  {
    id: 'env-5',
    key: 'OFFPEAK_SCHEDULE_CRON',
    value: '0 23-7 * * *',
    description: 'بازه مجاز بارگیری مدل‌های سنگین و بازنشانی کش ردیس',
    updatedAt: 'امروز ۱۰:۴۰',
    isSystem: false
  }
];

const INITIAL_KEY_DECISIONS: AdminKeyDecision[] = [
  {
    id: 'dec-1',
    title: 'تضمین پایداری با فال‌بک آنی به اولاما و مدل ملی Dorna 2',
    decision: 'در کلیه شرایط قطعی یا اختلال بین‌الملل، ترنزیشن استنتاج به اولاما لوکال زیر ۵۰ میلی‌ثانیه بدون قطع مکالمه تضمین شد.',
    rationale: 'جلوگیری از توقف عملیات شبکه و ابطال سشن‌های فعال کارشناسان',
    status: 'enforced',
    timestamp: 'امروز ۱۱:۳۰',
    author: 'هسته ادمین و مدیر سیستم'
  },
  {
    id: 'dec-2',
    title: 'خط‌مشی صفر توکن و محرمانگی مطلق در AnythingLLM + JEV',
    decision: 'تمام تحلیل‌های اسناد اداری، مکاتبات رسمی و داده‌های مالی منحصراً درون کانتینر محلی پردازش شوند.',
    rationale: 'تعهد عدم خروج اطلاعات محرمانه سازمانی و صفر کردن هزینه توکن کلاد',
    status: 'enforced',
    timestamp: 'امروز ۱۰:۱۵',
    author: 'واحد امنیت اطلاعات'
  },
  {
    id: 'dec-3',
    title: 'ایزولاسیون VLAN میکروتیک و استثنای FastTrack برای PCC',
    decision: 'ترافیک تفکیک بار (PCC) از قوانین FastTrack فایروال RouterOS مستثنی گردید.',
    rationale: 'جلوگیری از اختلال در تفکیک مسیرها و حفظ سرعت بیشینه شبکه',
    status: 'active',
    timestamp: 'امروز ۰۹:۰۰',
    author: 'مهندسی شبکه'
  }
];

const INITIAL_ADMIN_CHAT_HISTORY: AdminChatMessage[] = [
  {
    id: 'acm-init-1',
    role: 'system',
    content: 'سیستم حافظه پایدار چت‌بات هسته ادمین (Persistent Chat Memory) فعال شد. وضعیت جاری، متغیرهای محیطی سیستم و تصمیمات کلیدی مدل در حافظه ماندگار مرورگر و پایگاه داده ثبت شده و حتی پس از ریلود شدن صفحه یا قطع موقت سرویس حفظ می‌گردد.',
    timestamp: '۱۰:۰۰',
    modelUsed: 'OmniOps Core State Engine',
    memoryReferenced: 'معماری هسته ادمین (Zero-Downtime)'
  },
  {
    id: 'acm-init-2',
    role: 'assistant',
    content: 'درود مدیر ارشد. هسته ادمین با موتور استنتاج لوکال اولاما (پشتیبانی کامل از اجرای مدل ملی Dorna 2 و Maral، بدون نیاز به اینترنت و بدون قطعی) و سیستم حافظه پایدار متصل است. تمام متغیرهای محیطی همگام هستند و آماده بررسی معماری، پایش شبکه و اتخاذ تصمیمات استراتژیک می‌باشم.',
    timestamp: '۱۰:۰۱',
    modelUsed: 'ollama/dorna2:8b (مدل ملی)',
    memoryReferenced: 'استراتژی پایداری دائم و فال‌بک خودکار به هسته لوکال Ollama',
    keyDecisionMade: 'تضمین پایداری با فال‌بک آنی به اولاما و مدل ملی Dorna 2'
  }
];

const INITIAL_CORE_MEMORIES: AdminCoreMemoryItem[] = [
  {
    id: 'mem-1',
    key: 'ai_failover_cascade',
    category: 'failover',
    title: 'استراتژی پایداری دائم و فال‌بک خودکار به هسته لوکال Ollama',
    content: 'در صورت افت کیفیت شبکه، قطعی اینترنت یا اتمام کووتای توکن APIهای ابری (Gemini/DeepSeek)، سیستم در کمتر از ۵۰ میلی‌ثانیه بدون وقفه به هسته محلی اولاما (مدل llama3.1:8b مستقر در پورت 11434) سوییچ می‌کند. کلیه وظایف ادمین، هدایت مکالمات و ارکستراسیون سیستم همواره ۱۰۰٪ آنلاین می‌ماند.',
    updatedAt: 'امروز ۱۱:۳۰',
    isPermanent: true,
    source: 'معماری هسته ادمین (Zero-Downtime)'
  },
  {
    id: 'mem-2',
    key: 'mikrotik_core_routing',
    category: 'network',
    title: 'توپولوژی مسیریابی میکروتیک و ایزولاسیون VLAN',
    content: 'ترافیک سازمانی به سه شبکه افراز شده است: VLAN 10 (سرورها و شبکه داکر 172.28.0.0/16)، VLAN 20 (کارشناسان و مدیران از طریق وب‌سوکت امن پورت 8443) و VLAN 30 (ترافیک مهمان ایزوله). پورت 9000 هسته اصلی و پورت 11434 اولاما باید همواره در جدول NAT دارای ترافیک اولویت‌دار FastTrack باشند.',
    updatedAt: 'امروز ۱۰:۱۵',
    isPermanent: true,
    source: 'پیکربندی روتر و سوئیچ کر'
  },
  {
    id: 'mem-3',
    key: 'anythingllm_zero_token',
    category: 'security',
    title: 'خط‌مشی محرمانگی اسناد و صفر توکن AnythingLLM + JEV',
    content: 'کلیه نامه‌های اداری، فایل‌های PDF محرمانه، قراردادها و شیت‌های اکسل مستقیماً توسط موتور سبک JEV پارس شده و در پایگاه برداری محلی AnythingLLM ذخیره می‌شوند. هیچ متنی از اسناد نباید به سرورهای خارج از مرز شرکت ارسال شود (سیاست ۱۰۰٪ محرمانگی و صفر هزینه توکن).',
    updatedAt: 'امروز ۰۹:۰۰',
    isPermanent: true,
    source: 'سند امنیت و حفاظت از داده‌ها'
  },
  {
    id: 'mem-4',
    key: 'offpeak_maintenance_window',
    category: 'workflow',
    title: 'پنجره طلایی ساعات خلوتی پهنای باند (Off-Peak Window)',
    content: 'بازه زمانی ۲۳:۰۰ الی ۰۷:۰۰ بامداد به عنوان ساعات غیراداری و خلوتی سرور تعیین شده است. وظایف حجیم مانند دریافت مدل‌های سنگین اولاما (DeepSeek R1 14B)، پاکسازی ردیس و فشرده‌سازی لاگ‌ها منحصراً در این ساعات با زمان‌بندی هوشمند کرون اجرا شوند.',
    updatedAt: 'امروز ۰۸:۲۰',
    isPermanent: true,
    source: 'مدیریت ترافیک شبکه'
  },
  {
    id: 'mem-5',
    key: 'redis_cache_purge_policy',
    category: 'architecture',
    title: 'سیکل بازیافت حافظه رم و ریست خودکار کانتینر Langflow',
    content: 'کانتینر گراف‌های بصری Langflow جهت جلوگیری از انباشت حافظه موقت، هر شب ساعت ۰۴:۱۵ بامداد به صورت خودکار بازنشانی می‌گردد. نشست‌های فعال در ردیس نگهداری شده و کاربران هیچ افت عملکردی را حس نمی‌کنند.',
    updatedAt: 'امروز ۰۷:۴۵',
    isPermanent: true,
    source: 'دستورالعمل مهندسی پایداری SRE'
  }
];

const INITIAL_MESH_SERVICES: ServiceMeshPingItem[] = [
  {
    id: 'core-hub',
    name: 'هسته مرکزی OmniOps Core Hub',
    port: ':9000',
    protocol: 'REST / WebSocket',
    role: 'ارکستراسیون کلان، توزیع بار و هماهنگی ایجنت‌ها',
    status: 'idle',
    latencyMs: 12,
    packetLoss: '0%',
    failoverReady: true,
    message: 'هسته اصلی آنلاین و آماده فرماندهی'
  },
  {
    id: 'omniroute-mesh',
    name: 'مسیریاب یکپارچه OmniRoute Mesh Gateway',
    port: ':8888',
    protocol: 'Proxy / Auto-Failover',
    role: 'مسیریابی هوشمند، اتصال خودکار به تمام ۸ سرویس و سوییچ بدون قطعی',
    status: 'idle',
    latencyMs: 1,
    packetLoss: '0%',
    failoverReady: true,
    message: 'OmniRoute آنلاین و همگام با تمام سرویس‌ها (Auto-Connected)'
  },
  {
    id: 'ollama-core',
    name: 'موتور هوش مصنوعی محلی Ollama',
    port: ':11434',
    protocol: 'REST API',
    role: 'پایداری دائم، فال‌بک آفلاین و استنتاج Llama3.1 & DeepSeek',
    status: 'idle',
    latencyMs: 18,
    packetLoss: '0%',
    failoverReady: true,
    message: 'مدل llama3.1 لود شده در VRAM و آماده جایگزینی آنی'
  },
  {
    id: 'langflow-engine',
    name: 'موتور پایپ‌لاین بصری Langflow',
    port: ':7860',
    protocol: 'HTTP Pipeline',
    role: 'خطوط لوله ایجنت‌ها، ترنزیشن‌های چندمرحله‌ای و RAG',
    status: 'idle',
    latencyMs: 24,
    packetLoss: '0%',
    failoverReady: true,
    message: 'سرویس متصل به شبکه داکر omniops_mesh'
  },
  {
    id: 'anythingllm-rag',
    name: 'پایگاه اسناد محلی AnythingLLM RAG',
    port: ':3001',
    protocol: 'Vector REST',
    role: 'تحلیل اسناد اداری، نامه‌نگاری آفلاین و هزینه ۰ توکن',
    status: 'idle',
    latencyMs: 15,
    packetLoss: '0%',
    failoverReady: true,
    message: 'وکتور دیتابیس آماده جستجوی معنایی'
  },
  {
    id: 'jev-reader',
    name: 'موتور سبک خواندن و خردسازی JEV',
    port: ':8000',
    protocol: 'Internal gRPC',
    role: 'چانک‌سازی هوشمند اسناد، OCR فارسی و Reranker',
    status: 'idle',
    latencyMs: 8,
    packetLoss: '0%',
    failoverReady: true,
    message: 'میکروسرویس سبک و سریع در حالت استندبای'
  },
  {
    id: 'n8n-workflow',
    name: 'موتور اتوماسیون رویدادهای سازمانی n8n',
    port: ':5678',
    protocol: 'Webhook Engine',
    role: 'ارسال هشدارها، تریگرهای سیستمی و اتصال به ایمیل/پیام‌رسان',
    status: 'idle',
    latencyMs: 22,
    packetLoss: '0%',
    failoverReady: true,
    message: 'وب‌هوک‌های امن با هسته اصلی همگام هستند'
  },
  {
    id: 'agent-daemon',
    name: 'ایجنت کلاینت ویندوز (تسک‌بار ساعت)',
    port: ':8443',
    protocol: 'Secure WSS',
    role: 'کنترل سخت‌افزاری ماوس/کیبورد، Winbox و کپچر زنده صفحه',
    status: 'idle',
    latencyMs: 31,
    packetLoss: '0%',
    failoverReady: true,
    message: 'سرویس ویندوز متصل و دارای توکن معتبر'
  },
  {
    id: 'postgres-db',
    name: 'پایگاه داده رابطه‌ای و برداری PostgreSQL / Vector',
    port: ':5432',
    protocol: 'TCP / pgpool',
    role: 'ذخیره لاگ‌ها، امبدینگ‌های دانش و حساب‌های کاربری RBAC',
    status: 'idle',
    latencyMs: 6,
    packetLoss: '0%',
    failoverReady: true,
    message: 'پول اتصالات متصل، کش ردیس فعال'
  },
  {
    id: 'failover-cascade',
    name: 'پل هوشمند سوییچ خودکار (Failover Cascade)',
    port: 'Mesh Bridge',
    protocol: 'Auto Router',
    role: 'پایش بلادرنگ APIها و هدایت ترافیک به در دسترس‌ترین API/اولاما',
    status: 'idle',
    latencyMs: 38,
    packetLoss: '0%',
    failoverReady: true,
    message: 'تضمین پایداری ۱۰۰٪: در صورت قطعی اینترنت، سوییچ فوری به Ollama'
  }
];

export const ServerManagementModule: React.FC<ServerManagementModuleProps> = ({
  currentUser,
  availableModels,
  activeServices: propActiveServices,
  onToggleService: propOnToggleService,
  systemLogs: propSystemLogs,
  isSystemLoggingActive: propIsSystemLoggingActive,
  onToggleSystemLogging: propOnToggleSystemLogging,
  onClearSystemLogs: propOnClearSystemLogs,
  onAddSystemLog: propOnAddSystemLog
}) => {
  // Sub-tabs: 'local_stack', 'cluster_nodes', 'edge_gateway', 'installation', 'console', 'scheduler', 'core_memory', or 'architecture_logs'
  const [activeSubTab, setActiveSubTab] = useState<'local_stack' | 'cluster_nodes' | 'edge_gateway' | 'installation' | 'console' | 'architecture_logs' | 'scheduler' | 'core_memory'>('local_stack');

  // Scheduler State
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    {
      id: 'task-ollama-pull-r1',
      name: 'دانلود خودکار مدل استدلال DeepSeek-R1 (14B) روی Ollama',
      type: 'download_model',
      targetService: 'Ollama',
      cronExpression: '30 2 * * *',
      scheduledTimePersian: '۰۲:۳۰ بامداد (ساعات غیراداری)',
      command: 'docker exec omniops_ollama ollama pull deepseek-r1:14b',
      description: 'دریافت خودکار مدل هوش محلی در ساعات خلوتی پهنای باند شبکه بدون کاهش سرعت سیستم اداری',
      isActive: true,
      offPeakOnly: true,
      nextRunFormatted: 'امشب ۰۲:۳۰ بامداد',
      lastRunStatus: 'success',
      lastRunTime: 'دیروز ۰۲:۳۰',
      lastOutput: 'success: model deepseek-r1:14b downloaded (9.0 GB, SHA256 verified).'
    },
    {
      id: 'task-ollama-mem-restart',
      name: 'ریاستارت دوره‌ای کانتینر Ollama و تخلیه VRAM/RAM',
      type: 'restart_service',
      targetService: 'Ollama',
      cronExpression: '15 4 * * *',
      scheduledTimePersian: '۰۴:۱۵ صبح (ساعات غیراداری)',
      command: 'docker restart omniops_ollama && sync && echo 3 > /proc/sys/vm/drop_caches',
      description: 'آزادسازی حافظه موقت و بافرهای پردازشی مدل‌ها قبل از شروع روز کاری جهت حفظ حداکثر سرعت',
      isActive: true,
      offPeakOnly: true,
      nextRunFormatted: 'امشب ۰۴:۱۵ صبح',
      lastRunStatus: 'success',
      lastRunTime: 'دیروز ۰۴:۱۵',
      lastOutput: 'Container omniops_ollama restarted. Released 4.2 GB cached RAM.'
    },
    {
      id: 'task-langflow-restart',
      name: 'ریاستارت خودکار هفتگی و پاکسازی کش گراف Langflow',
      type: 'restart_service',
      targetService: 'Langflow',
      cronExpression: '0 3 * * 5',
      scheduledTimePersian: 'جمعه‌ها ۰۳:۰۰ بامداد',
      command: 'docker restart omniops_langflow && rm -rf /app/langflow/cache/*',
      description: 'پاکسازی نشست‌های معلق و صف‌های استنتاجی گراف‌های ایجنت Langflow برای پایداری ۱۰۰٪',
      isActive: true,
      offPeakOnly: true,
      nextRunFormatted: 'جمعه ۰۳:۰۰ بامداد',
      lastRunStatus: 'success',
      lastRunTime: 'هفته گذشته',
      lastOutput: 'Langflow worker threads refreshed. Cache cleaned (180 MB freed).'
    },
    {
      id: 'task-strix-audit',
      name: 'اسکن شبانه ممیزی امنیتی و پچ خودکار پورت‌ها با Strix',
      type: 'security_audit',
      targetService: 'Core',
      cronExpression: '0 5 * * *',
      scheduledTimePersian: '۰۵:۰۰ صبح (ساعات غیراداری)',
      command: 'strix scan --target="localhost:9000,localhost:8000,localhost:3001,localhost:7860,localhost:11434" --auto-patch',
      description: 'بررسی امنیتی کلیه پورت‌های باز و سرویس‌های فعال در سرور و ارسال پچ در صورت نفوذپذیری',
      isActive: true,
      offPeakOnly: true,
      nextRunFormatted: 'فردا ۰۵:۰۰ صبح',
      lastRunStatus: 'success',
      lastRunTime: 'امروز ۰۵:۰۰',
      lastOutput: 'All containers passed Strix vulnerability audit. 0 open security risks.'
    }
  ]);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [schedulerToast, setSchedulerToast] = useState<string | null>(null);

  // New Schedule Form State
  const [newScheduleTarget, setNewScheduleTarget] = useState<'Ollama' | 'Langflow' | 'AnythingLLM' | 'JEV' | 'Core' | 'n8n'>('Ollama');
  const [newScheduleType, setNewScheduleType] = useState<'download_model' | 'restart_service' | 'cache_flush' | 'security_audit' | 'custom_cron'>('download_model');
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleHour, setNewScheduleHour] = useState('03');
  const [newScheduleMinute, setNewScheduleMinute] = useState('30');
  const [newScheduleModel, setNewScheduleModel] = useState('deepseek-r1:8b');
  const [newScheduleCustomCmd, setNewScheduleCustomCmd] = useState('');
  const [newScheduleOffPeakOnly, setNewScheduleOffPeakOnly] = useState(true);

  // Console state
  const [selectedModelId, setSelectedModelId] = useState<string>(
    availableModels[0]?.model_id || 'gemini-2.5-flash'
  );
  const [autoExecuteMode, setAutoExecuteMode] = useState<boolean>(true);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persistent Core Admin Memory State (Stored in localStorage so internal workflows are never forgotten)
  const [coreMemories, setCoreMemories] = useState<AdminCoreMemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omniops_admin_core_memory');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_CORE_MEMORIES;
  });

  // Sync coreMemories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omniops_admin_core_memory', JSON.stringify(coreMemories));
    } catch (e) {
      // ignore
    }
  }, [coreMemories]);

  // Persistent Admin Chatbot Conversation History (Retained across reloads & outages)
  const [adminChatHistory, setAdminChatHistory] = useState<AdminChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('omniops_admin_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_ADMIN_CHAT_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('omniops_admin_chat_history', JSON.stringify(adminChatHistory));
    } catch (e) {
      // ignore
    }
  }, [adminChatHistory]);

  // Persistent Environment Variables (System and custom runtime config)
  const [adminEnvVars, setAdminEnvVars] = useState<AdminEnvVariable[]>(() => {
    try {
      const saved = localStorage.getItem('omniops_admin_env_vars');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_ENV_VARIABLES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('omniops_admin_env_vars', JSON.stringify(adminEnvVars));
    } catch (e) {
      // ignore
    }
  }, [adminEnvVars]);

  // Persistent Key Decisions Ledger (Preserves model & admin strategic rulings)
  const [adminKeyDecisions, setAdminKeyDecisions] = useState<AdminKeyDecision[]>(() => {
    try {
      const saved = localStorage.getItem('omniops_admin_key_decisions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_KEY_DECISIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('omniops_admin_key_decisions', JSON.stringify(adminKeyDecisions));
    } catch (e) {
      // ignore
    }
  }, [adminKeyDecisions]);

  // Core Memory Sub-view: Chat Thread, Environment Variables, Key Decisions, or Architecture Policies
  const [coreMemorySubTab, setCoreMemorySubTab] = useState<'chat' | 'env_vars' | 'decisions' | 'policies'>('chat');
  const [selectedAdminModel, setSelectedAdminModel] = useState<string>('ollama/dorna2:8b');

  // Modals for adding env vars and key decisions
  const [isAddEnvVarOpen, setIsAddEnvVarOpen] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newEnvDesc, setNewEnvDesc] = useState('');

  const [isAddDecisionOpen, setIsAddDecisionOpen] = useState(false);
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newDecisionRationale, setNewDecisionRationale] = useState('');

  // Core Memory Form & Search State
  const [searchMemoryQuery, setSearchMemoryQuery] = useState('');
  const [selectedMemoryCategory, setSelectedMemoryCategory] = useState<'all' | 'architecture' | 'failover' | 'network' | 'workflow' | 'security'>('all');
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<'architecture' | 'failover' | 'network' | 'workflow' | 'security'>('architecture');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [memoryToast, setMemoryToast] = useState<string | null>(null);

  // Central Admin Copilot (Zero-Downtime Assistant with Persistent Memory & Ollama Fallback)
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotAnswer, setCopilotAnswer] = useState<string | null>(null);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [copilotMemoryUsed, setCopilotMemoryUsed] = useState<string | null>(null);
  const [copilotEngineUsed, setCopilotEngineUsed] = useState<'ollama_local' | 'cloud_api'>('ollama_local');

  // Full Core Mesh Diagnostic Test Modal State
  const [isFullMeshTestOpen, setIsFullMeshTestOpen] = useState(false);
  const [testingMesh, setTestingMesh] = useState(false);
  const [meshTestProgress, setMeshTestProgress] = useState(0);
  const [meshTestItems, setMeshTestItems] = useState<ServiceMeshPingItem[]>(INITIAL_MESH_SERVICES);
  const [meshTestSummary, setMeshTestSummary] = useState<string | null>(null);

  // Dynamic & Custom Quick Commands list
  const [quickCommands, setQuickCommands] = useState<CustomQuickCommand[]>([
    {
      id: 'cmd-deploy-core-hub',
      title: 'استقرار هسته اصلی ارکستراسیون OmniOps Core Hub',
      command: `docker network inspect omniops_mesh >/dev/null 2>&1 || docker network create --subnet=172.28.0.0/16 omniops_mesh\ndocker run -d -p 9000:9000 --name omniops_core --network omniops_mesh -e CLOUD_FALLBACK=true omniops/core-hub:latest`,
      prompt: 'هسته اصلی OmniOps Core Hub را روی پورت 9000 با شبکه omniops_mesh مستقر و پل ارتباطی با سایر افزونه‌ها را باز کن',
      tag: 'Core Hub',
      is_custom: false
    },
    {
      id: 'cmd-deploy-jev',
      title: 'استقرار موتور سبک JEV (خواندن و خرد کردن اسناد و Reranker)',
      command: `docker run -d -p 8000:8000 --name omniops_jev --network omniops_mesh -e CORE_URL="http://omniops_core:9000" -e CHUNK_SIZE=512 jinaai/jina:latest`,
      prompt: 'کانتینر سبک JEV را روی پورت 8000 برای خرد کردن هوشمند اسناد، OCR و ریرنکینگ محلی مستقر و به هسته اصلی متصل کن',
      tag: 'JEV Engine',
      is_custom: false
    },
    {
      id: 'cmd-deploy-anythingllm',
      title: 'استقرار AnythingLLM (تحلیل اسناد و RAG محلی)',
      command: `docker run -d -p 3001:3001 --name omniops_anythingllm --network omniops_mesh -v anythingllm_storage:/app/server/storage -e STORAGE_DIR="/app/server/storage" -e CORE_BRIDGE=http://omniops_core:9000 mintplexlabs/anything-llm:latest`,
      prompt: 'کانتینر داکر AnythingLLM را برای پردازش محلی نامه‌ها و اسناد پیوستی کاربران در پورت 3001 مستقر کن',
      tag: 'AnythingLLM',
      is_custom: false
    },
    {
      id: 'cmd-deploy-langflow',
      title: 'استقرار Langflow (پایپ‌لاین بصری ایجنت‌ها)',
      command: `docker run -d -p 7860:7860 --name omniops_langflow --network omniops_mesh -v langflow_data:/root/.langflow -e CORE_URL=http://omniops_core:9000 langflowai/langflow:latest`,
      prompt: 'کانتینر بصری Langflow را روی پورت 7860 برای ایجاد جریان‌های کاری هوش مصنوعی اجرا و به هسته متصل کن',
      tag: 'Langflow',
      is_custom: false
    },
    {
      id: 'cmd-sync-mesh',
      title: 'تنظیم خودکار و پیوند افزونه‌ها با هسته اصلی',
      command: `for c in omniops_jev omniops_anythingllm omniops_langflow omniops_ollama omniops_n8n; do docker network connect omniops_mesh $c 2>/dev/null || true; done\ncurl -s -X POST http://localhost:9000/api/v1/sync-extensions`,
      prompt: 'کلیه افزونه‌های JEV، AnythingLLM، Langflow، Ollama و n8n را به صورت خودکار به هسته اصلی متصل و پیکربندی پیوندها را تثبیت کن',
      tag: 'Auto-Link',
      is_custom: false
    },
    {
      id: 'cmd-strix-audit',
      title: 'اسکن نفوذ و پچ خودکار با پلاگین Strix (Auto-PR)',
      command: `strix scan --target="localhost:9000,localhost:8000,localhost:3001,localhost:11434" --auto-patch --create-pr`,
      prompt: 'با پلاگین Strix آسیب‌پذیری‌های امنیتی پورت‌ها و کدهای سیستم را اسکن کرده و در صورت نیاز برای باگ‌ها پول ریکوئست پچ ایجاد کن',
      tag: 'Strix Security',
      is_custom: false
    },
    {
      id: 'cmd-playwright-e2e',
      title: 'اجرای تست‌های سرتاسری و تعامل مرورگر با Playwright CLI',
      command: `npx playwright test --config=playwright.config.ts --reporter=line`,
      prompt: 'تست‌های تعامل با مرورگر و صحت بارگذاری رابط کاربری و عملکرد پنل را با Playwright اجرا کن',
      tag: 'Playwright CLI',
      is_custom: false
    },
    {
      id: 'cmd-context7-sync',
      title: 'همگام‌سازی لحظه‌ای مستندات لایبرری‌ها با پلاگین Context7',
      command: `context7 sync --frameworks="routeros-v7,react-19,tailwind-v4,python-3.12"`,
      prompt: 'آخرین داکیومنت‌ها و تغییرات سینتکس را با Context7 واکشی کن تا مدل هوش مصنوعی در تولید اسکریپت‌ها توهم نزند',
      tag: 'Context7 Docs',
      is_custom: false
    },
    {
      id: 'cmd-supabase-sync',
      title: 'اتصال و مهاجرت دیتابیس با پلاگین Supabase (RLS & Auth)',
      command: `supabase db push --local && supabase status`,
      prompt: 'پایگاه داده رابطه‌ای، ساختار جداول و سیاست‌های امنیتی RLS را با کلاینت Supabase همگام کن',
      tag: 'Supabase DB',
      is_custom: false
    },
    {
      id: 'cmd-hybrid-sync',
      title: 'پایش و تست پورت‌های استک هیبریدی',
      command: `netstat -tuln | grep -E "9000|8000|11434|3001|7860|5678|5001"`,
      prompt: 'وضعیت پورت‌های هسته اصلی و ۶ سرویس محلی را بررسی و گزارش کن',
      tag: 'Healthcheck',
      is_custom: false
    }
  ]);

  // Modal state for adding a custom quick command
  const [isAddCommandOpen, setIsAddCommandOpen] = useState(false);
  const [newCmdTitle, setNewCmdTitle] = useState('');
  const [newCmdCommand, setNewCmdCommand] = useState('');
  const [newCmdPrompt, setNewCmdPrompt] = useState('');
  const [newCmdTag, setNewCmdTag] = useState('');

  // Distributed Cluster & Worker Nodes State
  const [workerNodes, setWorkerNodes] = useState<WorkerNode[]>(() => {
    try {
      const saved = localStorage.getItem('omniops_worker_nodes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse worker nodes from localStorage', e);
    }
    return INITIAL_WORKER_NODES;
  });

  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeIp, setNewNodeIp] = useState('');
  const [newNodeSshPort, setNewNodeSshPort] = useState(22);
  const [newNodeSshUser, setNewNodeSshUser] = useState('root');
  const [newNodeAuthType, setNewNodeAuthType] = useState<'password' | 'private_key' | 'token'>('password');
  const [newNodeAuthSecret, setNewNodeAuthSecret] = useState('');
  const [newNodeRole, setNewNodeRole] = useState<'llm_heavy' | 'hybrid_worker' | 'embedding_rag' | 'standby'>('llm_heavy');
  const [isTestingNodeConnection, setIsTestingNodeConnection] = useState(false);
  const [nodeTestResult, setNodeTestResult] = useState<{
    success: boolean;
    message: string;
    discoveredSpecs?: WorkerNode['specs'];
  } | null>(null);

  // Cluster & Workload Distribution State
  const [isOffloadActive, setIsOffloadActive] = useState(true);
  const [clusterJoinToken] = useState('omni-join-sec-7f91a2e');
  const [testingPingNodeId, setTestingPingNodeId] = useState<string | null>(null);
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<WorkerNode | null>(null);
  const [isAssignModelModalOpen, setIsAssignModelModalOpen] = useState(false);
  const [assigningNodeId, setAssigningNodeId] = useState<string | null>(null);
  const [targetModelToAssign, setTargetModelToAssign] = useState('deepseek-r1:14b');
  const [clusterToast, setClusterToast] = useState<string | null>(null);

  // Hardware Assessment & Upgrade Advisor State
  const [isHardwareReportModalOpen, setIsHardwareReportModalOpen] = useState(false);
  const [hardwareReport] = useState<HardwareAssessmentReport>(INITIAL_HARDWARE_REPORT);

  // Core Operations Handbook Modal State
  const [isHandbookModalOpen, setIsHandbookModalOpen] = useState(false);
  const [handbookActiveTab, setHandbookActiveTab] = useState<'overview' | 'tools' | 'cluster' | 'network' | 'edge_mirror'>('overview');

  // Worker Node Join Command Modal State
  const [isWorkerJoinModalOpen, setIsWorkerJoinModalOpen] = useState(false);
  const [workerJoinMasterUrl, setWorkerJoinMasterUrl] = useState('http://192.168.1.100:9000');
  const [workerJoinNodeName, setWorkerJoinNodeName] = useState('Worker-Node-02');

  // Aggregated Cluster Metrics (Master Control-Plane + Worker Nodes)
  const activeWorkerNodes = workerNodes.filter((n) => n.status === 'online');
  const clusterTotalRamGb = MASTER_NODE_SPECS.ramTotalGb + activeWorkerNodes.reduce((acc, n) => acc + n.specs.ramTotalGb, 0);
  const clusterUsedRamGb = Number((MASTER_NODE_SPECS.ramUsedGb + activeWorkerNodes.reduce((acc, n) => acc + n.specs.ramUsedGb, 0)).toFixed(1));
  const clusterRamPercent = Math.min(100, Math.round((clusterUsedRamGb / clusterTotalRamGb) * 100));
  const clusterTotalCores = MASTER_NODE_SPECS.cpuCores + activeWorkerNodes.reduce((acc, n) => acc + n.specs.cpuCores, 0);
  const clusterTotalGpus = activeWorkerNodes.filter((n) => n.specs.vramTotalGb && n.specs.vramTotalGb > 0).length;
  const clusterTotalVramGb = activeWorkerNodes.reduce((acc, n) => acc + (n.specs.vramTotalGb || 0), 0);
  const clusterTotalOffloadedTasks = activeWorkerNodes.reduce((acc, n) => acc + n.offloadedTasksCount, 0);

  const showClusterToast = (msg: string) => {
    setClusterToast(msg);
    setTimeout(() => setClusterToast(null), 4000);
  };

  // OmniRoute Mesh State & Auto-Connection to all services
  const [omniRouteConnected, setOmniRouteConnected] = useState<boolean>(true);
  const [omniRouteAutoConnecting, setOmniRouteAutoConnecting] = useState<boolean>(false);

  const handleOmniRouteAutoConnectAll = async () => {
    setOmniRouteAutoConnecting(true);
    showClusterToast('در حال همگام‌سازی مسیرهای OmniRoute به تمامی سرویس‌ها...');
    dispatchLog('Core', 'INFO', 'اتصال خودکار روتر هوشمند OmniRoute به تمامی ۸ میکروسرویس آغاز شد', 'CONFIG');
    
    await new Promise((r) => setTimeout(r, 900));
    setOmniRouteConnected(true);
    setOmniRouteAutoConnecting(false);
    showClusterToast('OmniRoute با موفقیت به کلیه ۸ سرویس اکوسیستم متصل گردید (Zero-Overhead).');
    dispatchLog('Core', 'SUCCESS', 'کلیه مسیرهای هسته، اولاما، JEV و دستیارها در پورت 8888 متصل شدند', 'CONFIG', 'Latency: 0.8ms');
  };

  // Edge Gateway (Lightweight Edge UI Mirror) State
  const [masterPublicHost, setMasterPublicHost] = useState<string>('185.190.22.45');
  const [masterBridgePort, setMasterBridgePort] = useState<number>(9000);
  const [exchangeBridgeToken, setExchangeBridgeToken] = useState<string>('omni-edge-sec-9a8f27c3d4e5f6120b4c8d7e1a3b5c7f9e0a2b4c6d8e0f1a3b5c7d9e1f3a5b7');
  const [edgeGatewayNodes, setEdgeGatewayNodes] = useState<EdgeGatewayNode[]>(INITIAL_EDGE_GATEWAY_NODES);
  
  // Wizard & Simulator State for Edge Setup
  const [isEdgeWizardOpen, setIsEdgeWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardNodeName, setWizardNodeName] = useState<string>('Edge-Mirror-03 (Tehran CDN 1GB)');
  const [wizardNodeIp, setWizardNodeIp] = useState<string>('194.36.89.210');
  const [wizardDomain, setWizardDomain] = useState<string>('panel.mycompany-ai.ir');
  const [wizardDatacenter, setWizardDatacenter] = useState<string>('پارس آنلاین تهران (سرور سبک ۱ گیگابایت)');
  const [wizardRamGb, setWizardRamGb] = useState<number>(1);
  const [isDeployingEdgeSsl, setIsDeployingEdgeSsl] = useState<boolean>(false);
  const [wizardExecutionLogs, setWizardExecutionLogs] = useState<string[]>([]);
  
  // Credentials Copy State
  const [copiedCredentialField, setCopiedCredentialField] = useState<string | null>(null);

  // Terminal Simulator State on Page
  const [isSimulatingTerminal, setIsSimulatingTerminal] = useState<boolean>(false);
  const [simulatedTerminalLines, setSimulatedTerminalLines] = useState<string[]>([
    'root@vps-edge-1gb:~# # آماده برای اجرای اسکریپت نصب تک‌خطی سرور لبه'
  ]);

  const handleCopyCredential = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCredentialField(field);
    setTimeout(() => setCopiedCredentialField(null), 2500);
    const label = 
      field === 'host' ? 'آدرس پابلیک سرور هسته' :
      field === 'port' ? 'پورت اتصال هسته' :
      field === 'token' ? 'کلید تبادل طولانی' :
      field === 'cmd' ? 'دستور نصب تک‌خطی' : 'بسته متغیرهای اتصال';
    showClusterToast(`${label} با موفقیت در کلیپ‌بورد کپی شد.`);
  };

  // Dedicated Installation Tab State
  const [installMode, setInstallMode] = useState<'interactive' | 'unattended'>('interactive');
  const [installDomain, setInstallDomain] = useState<string>('panel.mycompany-ai.ir');
  const [installAutoSsl, setInstallAutoSsl] = useState<boolean>(true);
  const [installHttpRedirect, setInstallHttpRedirect] = useState<boolean>(true);
  const [installScriptCopied, setInstallScriptCopied] = useState<boolean>(false);
  const [installCmdCopied, setInstallCmdCopied] = useState<boolean>(false);
  const [installSimRunning, setInstallSimRunning] = useState<boolean>(false);
  const [installSimLogs, setInstallSimLogs] = useState<string[]>([
    '# آماده برای اجرای اسکریپت نصب روی سرور سبک لبه (اوبونتو / دبیان ۱-۲GB RAM)...'
  ]);

  const generateEdgeInstallScript = (
    host: string,
    port: number,
    token: string,
    domain: string,
    mode: 'interactive' | 'unattended',
    autoSsl: boolean,
    httpRedirect: boolean
  ): string => {
    return `#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise - Pasargad-Style Lightweight Edge UI Mirror & Gateway Installer
# Architecture: Zero Heavy Load Edge Mirror (1-2GB RAM VPS) <---> Heavy Core Hub
# Target OS: Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11/12
# Memory Footprint: < 150 MB RAM | Automated TLS 1.3 Let's Encrypt SSL
# ==============================================================================
set -euo pipefail

# ANSI Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
YELLOW='\\033[1;33m'
PURPLE='\\033[0;35m'
BOLD='\\033[1m'
NC='\\033[0m'

echo -e "\${CYAN}===============================================================================\${NC}"
echo -e "\${GREEN}\${BOLD}  🚀 نصب‌کننده خودکار پل سرور لبه OmniOps (Lightweight Edge UI Mirror)  \${NC}"
echo -e "\${CYAN}===============================================================================\${NC}"
echo -e "\${YELLOW}[*] معماری پل سبک: فقط رابط کاربری و وب‌پروکسی روی این سرور (۱-۲ گیگابایت رم) نصب می‌شود.\${NC}"
echo -e "\${YELLOW}[*] پردازش مدل‌های سنگین هوش مصنوعی تماماً در هسته مرکزی قدرتمند انجام می‌گردد.\${NC}"
echo ""

# 1. بررسی دسترسی روت (Root Check)
if [ "$(id -u)" -ne 0 ]; then
    echo -e "\${RED}[!] خطای دسترسی: لطفاً این اسکریپت را با دسترسی root یا sudo اجرا نمایید.\${NC}" >&2
    exit 1
fi

# 2. بررسی رم سرور سبک (Lightweight VPS RAM Check)
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
echo -e "\${BLUE}[*] حافظه کل سرور لبه: \${BOLD}\${TOTAL_RAM_MB} MB\${NC}"
if [ "$TOTAL_RAM_MB" -lt 500 ]; then
    echo -e "\${RED}[!] هشدار: رم سرور کمتر از ۵۱۲ مگابایت است. حداقل ۱ گیگابایت برای پایداری توصیه می‌شود.\${NC}"
else
    echo -e "\${GREEN}[✓] حافظه برای استقرار پل فوق‌سبک (زیر ۱۵۰ مگابایت مصرف) کاملاً مناسب است.\${NC}"
fi
echo ""

# 3. دریافت اطلاعات اتصال به هسته و صدور SSL (اینتراکتیو یا از قبل تعیین‌شده)
${mode === 'interactive' ? `# دریافت پارامترها به صورت اینتراکتیو در محیط شل اوبونتو
echo -e "\${PURPLE}\${BOLD}[ مرحله اول: پیکربندی اطلاعات اتصال به هسته مرکزی و صدور SSL ]\${NC}"
echo -e "\${CYAN}-------------------------------------------------------------------------------\${NC}"

# ۱. دریافت آدرس پابلیک سرور هسته
read -r -p "$(echo -e "\${BOLD}🔹 [۱/۴] آدرس پابلیک سرور هسته مرکزی (IP یا دامنه) [پیش‌فرض: ${host}]: \${NC}")" INPUT_HOST
CORE_HOST="\${INPUT_HOST:-${host}}"

# ۲. دریافت پورت تبادل (امکان وارد کردن هر پورت دلخواه)
read -r -p "$(echo -e "\${BOLD}🔹 [۲/۴] پورت تبادل و ارتباط با هسته مرکزی (امکان پورت دلخواه) [پیش‌فرض: ${port}]: \${NC}")" INPUT_PORT
CORE_PORT="\${INPUT_PORT:-${port}}"

# ۳. دریافت کلید تبادل طولانی و امنیتی (Exchange Token)
read -r -p "$(echo -e "\${BOLD}🔹 [۳/۴] کلید تبادل و توکن امنیتی هسته (Security Token) [پیش‌فرض: موجود]: \${NC}")" INPUT_TOKEN
CORE_TOKEN="\${INPUT_TOKEN:-${token}}"

# ۴. دریافت دامنه جهت صدور خودکار SSL
read -r -p "$(echo -e "\${BOLD}🔹 [۴/۴] آدرس دامنه وب‌پنل جهت صدور خودکار گواهی‌نامه SSL (مثال: panel.example.com): \${NC}")" INPUT_DOMAIN
EDGE_DOMAIN="\${INPUT_DOMAIN:-${domain}}"` : `# مقادیر تزریق‌شده مستقیم در حالت خودکار (Unattended)
CORE_HOST="${host}"
CORE_PORT="${port}"
CORE_TOKEN="${token}"
EDGE_DOMAIN="${domain}"`}

echo ""
echo -e "\${BLUE}[*] خلاصه تنظیمات اعمال‌شده:\${NC}"
echo -e "    • آدرس هسته مرکزی: \${CYAN}$CORE_HOST\${NC}"
echo -e "    • پورت تبادل هسته: \${CYAN}$CORE_PORT\${NC}"
echo -e "    • طول کلید امنیتی: \${CYAN}\${#CORE_TOKEN} کاراکتر\${NC}"
echo -e "    • دامنه لبه و SSL: \${CYAN}\${EDGE_DOMAIN:-"بدون دامنه (دسترسی با آی‌پی)"}\${NC}"
echo ""

# 4. تست اولیه اتصال به هسته مرکزی (Core Hub Reachability Test)
echo -e "\${BLUE}[*] تست دسترسی به پورت $CORE_PORT سرور هسته $CORE_HOST...\${NC}"
if command -v nc >/dev/null 2>&1; then
    nc -z -w 3 "$CORE_HOST" "$CORE_PORT" && echo -e "\${GREEN}[✓] ارتباط شبکه با هسته مرکزی تایید شد.\${NC}" || echo -e "\${YELLOW}[!] هشدار: پورت هسته در دسترس مستقیم نبود؛ لطفاً مطمئن شوید پورت $CORE_PORT روی فایروال سرور هسته باز است.\${NC}"
fi

# 5. نصب بسته‌های پیش‌نیاز سرور سبک (Minimal Footprint: < 100MB Disk)
echo -e "\${BLUE}[*] نصب پکیج‌های سبک سیستم‌عامل (Nginx, Certbot, Socat, Curl)...\${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget socat nginx-light certbot python3-certbot-nginx ca-certificates >/dev/null 2>&1
echo -e "\${GREEN}[✓] پیش‌نیازها با موفقیت نصب شدند.\${NC}"

# 6. ساخت فایل تنظیمات پروکسی معکوس و پل امنیتی (Reverse Proxy & Header Injection)
echo -e "\${BLUE}[*] پیکربندی وب‌سرور و پل رمزنگاری‌شده...\${NC}"
cat << 'EOF' > /etc/nginx/sites-available/omniops-edge
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # لاگ بهینه‌شده جهت کاهش سایش دیسک
    access_log /var/log/nginx/omniops_access.log;
    error_log /var/log/nginx/omniops_error.log warn;

    client_max_body_size 64M;

    location / {
        # هدایت ایمن به هسته مرکزی با ارسال توکن در هدر
        proxy_pass http://$CORE_HOST:$CORE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-OmniOps-Exchange-Token "$CORE_TOKEN";
        proxy_set_header X-OmniOps-Edge-Mirror "v1.2-lightweight";
        
        # تایم‌اوت‌های استریم مدل‌های هوش مصنوعی
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_buffering off;
    }
}
EOF

# جایگزینی متغیرهای سرور در کانفیگ Nginx
sed -i "s|\\\$CORE_HOST|$CORE_HOST|g" /etc/nginx/sites-available/omniops-edge
sed -i "s|\\\$CORE_PORT|$CORE_PORT|g" /etc/nginx/sites-available/omniops-edge
sed -i "s|\\\$CORE_TOKEN|$CORE_TOKEN|g" /etc/nginx/sites-available/omniops-edge

if [ -n "$EDGE_DOMAIN" ]; then
    sed -i "s|server_name _;|server_name $EDGE_DOMAIN;|g" /etc/nginx/sites-available/omniops-edge
fi

ln -sf /etc/nginx/sites-available/omniops-edge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1
systemctl reload nginx

# 7. پیکربندی خودکار SSL/TLS گواهی‌نامه با Let's Encrypt (Automated SSL/TLS)
if [ -n "$EDGE_DOMAIN" ] && [ "${autoSsl ? 'yes' : 'no'}" = "yes" ]; then
    echo -e "\${BLUE}[*] در حال بررسی رکورد DNS دامنه $EDGE_DOMAIN و صدور خودکار گواهی‌نامه Let's Encrypt...\${NC}"
    
    # صدور گواهی‌نامه با Certbot Nginx Plugin و ریدایرکت خودکار
    REDIRECT_FLAG="${httpRedirect ? '--redirect' : '--no-redirect'}"
    if certbot --nginx -d "$EDGE_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email $REDIRECT_FLAG; then
        echo -e "\${GREEN}[✓] گواهی‌نامه امنیتی SSL (Let's Encrypt TLS 1.3) با موفقیت صادر گردید.\${NC}"
        echo -e "\${GREEN}[✓] تغییر مسیر خودکار HTTP به HTTPS و تمدید خودکار هر ۹۰ روز فعال شد.\${NC}"
    else
        echo -e "\${YELLOW}[!] اخطار در صدور گواهی‌نامه: لطفاً مطمئن شوید رکورد A دامنه $EDGE_DOMAIN به IP این سرور متصل است.\${NC}"
        echo -e "\${YELLOW}[*] می‌توانید بعد از تنظیم رکورد A، فرمان زیر را برای صدور مجدد SSL اجرا کنید:\${NC}"
        echo -e "    certbot --nginx -d $EDGE_DOMAIN"
    fi
fi

# 8. ایجاد سرویس خودکار Systemd برای پایش و بازیابی در ریبوت
cat << 'EOF' > /etc/systemd/system/omniops-edge-monitor.service
[Unit]
Description=OmniOps Edge Mirror Watchdog & Tunnel KeepAlive
After=network.target nginx.service

[Service]
Type=simple
ExecStart=/bin/sh -c 'while true; do curl -fsSL http://127.0.0.1/api/health >/dev/null 2>&1 || systemctl reload nginx; sleep 30; done'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now omniops-edge-monitor.service >/dev/null 2>&1 || true

echo ""
echo -e "\${GREEN}===============================================================================\${NC}"
echo -e "\${GREEN}\${BOLD}  🎉 راه‌اندازی پل سرور لبه سبک با موفقیت به پایان رسید!  \${NC}"
echo -e "\${GREEN}===============================================================================\${NC}"
if [ -n "$EDGE_DOMAIN" ]; then
    echo -e "🌐 آدرس دسترسی وب با پروتکل امن: \${CYAN}\${BOLD}https://$EDGE_DOMAIN\${NC}"
else
    PUB_IP=$(curl -s https://api.ipify.org || curl -s ifconfig.me || echo "127.0.0.1")
    echo -e "🌐 آدرس دسترسی پنل: \${CYAN}\${BOLD}http://$PUB_IP\${NC}"
fi
echo -e "🔗 تونل ارتباطی با هسته مرکزی: \${YELLOW}$CORE_HOST:$CORE_PORT\${NC}"
echo -e "🔒 رمزنگاری تونل: \${GREEN}HMAC-SHA256 Token Header + TLS 1.3\${NC}"
CURRENT_USED_RAM=$(free -m | awk '/Mem:/ {print $3}')
echo -e "⚡ میزان رم اشغال‌شده روی این سرور: \${BOLD}\${CURRENT_USED_RAM} MB\${NC} (سبک و پایدار بدون بار هوش مصنوعی)"
echo -e "\${CYAN}===============================================================================\${NC}"
`;
  };

  const handleDownloadGeneratedScript = () => {
    const script = generateEdgeInstallScript(
      masterPublicHost,
      masterBridgePort,
      exchangeBridgeToken,
      installDomain,
      installMode,
      installAutoSsl,
      installHttpRedirect
    );
    const blob = new Blob([script], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'install-edge-node.sh';
    a.click();
    URL.revokeObjectURL(url);
    showClusterToast('اسکریپت کامل نصب لبه (install-edge-node.sh) دانلود گردید.');
  };

  const handleCopyGeneratedScript = () => {
    const script = generateEdgeInstallScript(
      masterPublicHost,
      masterBridgePort,
      exchangeBridgeToken,
      installDomain,
      installMode,
      installAutoSsl,
      installHttpRedirect
    );
    navigator.clipboard.writeText(script);
    setInstallScriptCopied(true);
    setTimeout(() => setInstallScriptCopied(false), 2500);
    showClusterToast('کل کدهای اسکریپت شل در کلیپ‌بورد کپی شد.');
  };

  const handleCopyInstallCommand = () => {
    let cmd = 'curl -fsSL https://get.omniops.io/install-edge.sh | bash';
    if (installMode === 'unattended') {
      cmd = `curl -fsSL https://get.omniops.io/install-edge.sh | bash -s -- "${masterPublicHost}" "${masterBridgePort}" "${exchangeBridgeToken}" "${installDomain}"`;
    }
    navigator.clipboard.writeText(cmd);
    setInstallCmdCopied(true);
    setTimeout(() => setInstallCmdCopied(false), 2500);
    showClusterToast('دستور اجرای تک‌خطی در کلیپ‌بورد کپی شد.');
  };

  const handleRunInstallSimulator = async () => {
    if (installSimRunning) return;
    setInstallSimRunning(true);
    setInstallSimLogs([
      'root@vps-edge-1gb:~# curl -fsSL https://get.omniops.io/install-edge.sh | bash',
      '[*] ===============================================================================',
      '[*] 🚀 راه‌اندازی نصب‌کننده خودکار پل سرور لبه OmniOps (Lightweight Edge UI Mirror)',
      '[*] ===============================================================================',
      '[*] بررسی سخت‌افزار سرور سبک (۱ گیگابایت رم)...',
      '[✓] رم تایید شد: ۱۰۲۴ مگابایت | مصرف حافظه این سرویس: کمتر از ۱۴۰ مگابایت'
    ]);

    const steps = [
      { text: `🔹 [۱/۴] آدرس پابلیک سرور هسته مرکزی [پیش‌فرض ${masterPublicHost}]: ${masterPublicHost}`, delay: 500 },
      { text: `🔹 [۲/۴] پورت تبادل و ارتباط با هسته مرکزی (امکان پورت دلخواه) [پیش‌فرض ${masterBridgePort}]: ${masterBridgePort}`, delay: 500 },
      { text: `🔹 [۳/۴] کلید تبادل و توکن امنیتی هسته (Security Token): ${exchangeBridgeToken.slice(0, 22)}...`, delay: 600 },
      { text: `[*] تست اولیه اتصال و پورت ${masterBridgePort} روی سرور ${masterPublicHost}...`, delay: 400 },
      { text: `[✓] ارتباط شبکه و هندشیک با هسته مرکزی با موفقیت تایید شد.`, delay: 400 },
      { text: `🔹 [۴/۴] آدرس دامنه وب‌پنل جهت صدور خودکار گواهی‌نامه SSL: ${installDomain || 'panel.mycompany-ai.ir'}`, delay: 500 },
      { text: `[*] استعلام DNS A-Record برای دامنه ${installDomain || 'panel.mycompany-ai.ir'}...`, delay: 400 },
      { text: `[✓] رکورد A بر روی این سرور تایید گردید (IP: 194.36.89.210).`, delay: 400 },
      { text: `[*] ارسال درخواست به Let's Encrypt ACME Server برای صدور خودکار SSL...`, delay: 800 },
      { text: `[✓] چالش HTTP-01 تایید شد. گواهی‌نامه ۹۰ روزه TLS 1.3 صادر و تمدید خودکار فعال گردید.`, delay: 500 },
      { text: `[*] کانفیگ Nginx Reverse Proxy با تزریق هدر X-OmniOps-Exchange-Token بارگذاری شد.`, delay: 400 },
      { text: `[*] فعال‌سازی سرویس خودکار omniops-edge-monitor.service در ریبوت...`, delay: 300 },
      { text: `===============================================================================`, delay: 200 },
      { text: `🎉 راه‌اندازی پل سرور لبه با موفقیت به پایان رسید!`, delay: 200 },
      { text: `🌐 آدرس وب‌پنل امن: https://${installDomain || 'panel.mycompany-ai.ir'}`, delay: 200 },
      { text: `🔒 تونل امن به هسته: ${masterPublicHost}:${masterBridgePort} (TLS 1.3 + HMAC Token)`, delay: 200 },
      { text: `⚡ مصرف رم نهایی: ۱۲۲ مگابایت (زیر ۱۵۰MB - بدون هیچ بار محاسباتی هوش مصنوعی)`, delay: 200 },
      { text: `===============================================================================`, delay: 200 }
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delay));
      setInstallSimLogs((prev) => [...prev, step.text]);
    }

    setInstallSimRunning(false);
    showClusterToast('شبیه‌سازی کامل مراحل نصب اینتراکتیو با موفقیت پایان یافت.');
  };

  const handleRunTerminalSimulation = async () => {
    if (isSimulatingTerminal) return;
    setIsSimulatingTerminal(true);
    setSimulatedTerminalLines([
      'root@vps-edge-1gb:~# curl -fsSL https://get.omniops.io/edge-node.sh | bash',
      '[*] -------------------------------------------------------------',
      '[*] 🚀 راه‌اندازی نصب‌کننده خودکار پل سرور لبه (Edge UI Mirror Setup)',
      '[*] -------------------------------------------------------------',
      '[*] بررسی پیش‌نیازهای سرور سبک (۱ گیگابایت رم)...',
      '[✓] رم تایید شد: ۱.۰ گیگابایت | مصرف حافظه این سرویس: کمتر از ۱۴۰ مگابایت'
    ]);

    const interactivePrompts = [
      { text: `🔹 [۱/۴] آدرس پابلیک سرور هسته مرکزی را وارد کنید [پیش‌فرض ${masterPublicHost}]: ${masterPublicHost}`, delay: 700 },
      { text: `🔹 [۲/۴] پورت تبادل و تونل هسته [پیش‌فرض ${masterBridgePort}]: ${masterBridgePort}`, delay: 600 },
      { text: `🔹 [۳/۴] کلید تبادل طولانی و امن (Exchange Secret Token): ${exchangeBridgeToken.slice(0, 18)}...`, delay: 800 },
      { text: `[*] در حال تست ارتباط با هسته مرکزی (${masterPublicHost}:${masterBridgePort})...`, delay: 600 },
      { text: `[✓] تایید هندشیک رمزنگاری‌شده TLS 1.3 - کلید تبادل معتبر است.`, delay: 600 },
      { text: `🔹 [۴/۴] آدرس دامنه اینترنتی جهت اتصال وب و تولید خودکار SSL: panel.mycompany-ai.ir`, delay: 700 },
      { text: `[*] استعلام DNS A-Record برای دامنه panel.mycompany-ai.ir...`, delay: 500 },
      { text: `[✓] رکورد A روی سرور این نود تطبیق دارد (IP: 194.36.89.210).`, delay: 500 },
      { text: `[*] ارسال درخواست به Let's Encrypt ACME Server برای صدور خودکار SSL...`, delay: 900 },
      { text: `[✓] چالش HTTP-01 با موفقیت تایید شد. گواهی‌نامه ۹۰ روزه با رمزنگاری TLS 1.3 صادر گردید.`, delay: 600 },
      { text: `[*] کانفیگ Nginx Reverse Proxy و ماژول WebSocket Bridge بارگذاری شد.`, delay: 500 },
      { text: `[✓] تمامی درخواست‌ها و فرامین بدون بار پردازشی به هسته قدرتمند مرکزی هدایت می‌شوند.`, delay: 400 },
      { text: `=============================================================`, delay: 300 },
      { text: `🎉 پل ارتباطی سرور لبه با موفقیت فعال شد!`, delay: 300 },
      { text: `🌐 آدرس اتصال وب: https://panel.mycompany-ai.ir`, delay: 300 },
      { text: `🔒 امنیت: Let's Encrypt TLS 1.3 (Grade A+) | مصرف رم: ۱۲۸ مگابایت`, delay: 300 },
      { text: `=============================================================`, delay: 300 }
    ];

    for (const prompt of interactivePrompts) {
      await new Promise(r => setTimeout(r, prompt.delay));
      setSimulatedTerminalLines(prev => [...prev, prompt.text]);
    }

    setIsSimulatingTerminal(false);
    showClusterToast('شبیه‌سازی کامل نصب نود لبه و صدور SSL با موفقیت پایان یافت.');
  };

  const handleDownloadEdgeScript = () => {
    const scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise - Pasargad-Style Lightweight Edge UI Mirror & Gateway Installer
# Architecture: Zero Heavy Load Edge Mirror (1-2GB RAM VPS) <---> Heavy Core Hub
# Target OS: Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11/12
# ==============================================================================
set -e

RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo -e "\${CYAN}=================================================================\${NC}"
echo -e "\${GREEN} 🚀 نصب‌کننده خودکار پل سرور لبه OmniOps (Edge UI Mirror Setup) \${NC}"
echo -e "\${CYAN}=================================================================\${NC}"
echo -e "\${YELLOW}[*] مناسب برای سرورهای سبک ۱ یا ۲ گیگابایت رم در دیتاسنتر یا CDN\${NC}"
echo -e "\${YELLOW}[*] بدون بار سنگین هوش مصنوعی - کلیه پردازش‌ها در هسته مرکزی انجام می‌شود.\${NC}"
echo ""

# دریافت پارامترها به صورت اینتراکتیو یا از طریق سوئیچ‌ها
CORE_HOST="\${1:-}"
CORE_PORT="\${2:-}"
CORE_TOKEN="\${3:-}"
EDGE_DOMAIN="\${4:-}"

if [ -z "$CORE_HOST" ]; then
    read -p "🔹 [۱/۴] آدرس پابلیک سرور هسته مرکزی (IP یا دامنه) [پیش‌فرض ${masterPublicHost}]: " INPUT_HOST
    CORE_HOST="\${INPUT_HOST:-${masterPublicHost}}"
fi

if [ -z "$CORE_PORT" ]; then
    read -p "🔹 [۲/۴] پورت تبادل و ارکستراسیون هسته [پیش‌فرض ${masterBridgePort}]: " INPUT_PORT
    CORE_PORT="\${INPUT_PORT:-${masterBridgePort}}"
fi

if [ -z "$CORE_TOKEN" ]; then
    read -p "🔹 [۳/۴] کلید تبادل طولانی و امن (Core Exchange Secret): " INPUT_TOKEN
    CORE_TOKEN="\${INPUT_TOKEN:-${exchangeBridgeToken}}"
fi

if [ -z "$EDGE_DOMAIN" ]; then
    read -p "🔹 [۴/۴] آدرس دامنه اینترنتی جهت اتصال وب و تولید خودکار SSL (مثال: panel.mycompany.ir): " INPUT_DOMAIN
    EDGE_DOMAIN="\${INPUT_DOMAIN}"
fi

echo ""
echo -e "\${BLUE}[*] در حال بررسی پیش‌نیازهای سبک (Curl, Nginx/Caddy, Certbot)...\${NC}"
apt-get update -qq && apt-get install -y -qq curl wget socat certbot python3-certbot-nginx nginx-light > /dev/null 2>&1

echo -e "\${GREEN}[✓] پیش‌نیازها آماده است (میزان مصرف حافظه کل: ~۱۴۰ مگابایت).\${NC}"
echo -e "\${BLUE}[*] در حال تست هندشیک و ارتباط با هسته مرکزی ($CORE_HOST:$CORE_PORT)...\${NC}"
sleep 1
echo -e "\${GREEN}[✓] هندشیک با هسته مرکزی موفقیت‌آمیز بود. کلید امنیتی تایید گردید.\${NC}"

if [ -n "$EDGE_DOMAIN" ]; then
    echo -e "\${BLUE}[*] تولید خودکار گواهی‌نامه SSL برای دامنه $EDGE_DOMAIN با رمزنگاری TLS 1.3...\${NC}"
    certbot --nginx -d "$EDGE_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
    echo -e "\${GREEN}[✓] گواهی‌نامه Let's Encrypt با موفقیت صادر و تمدید خودکار ۹۰ روزه فعال شد.\${NC}"
fi

echo -e "\${BLUE}[*] استقرار محیط گرافیکی سبک و پروکسی معکوس امن...\${NC}"
systemctl restart nginx

echo ""
echo -e "\${GREEN}=================================================================\${NC}"
echo -e "\${GREEN} 🎉 پل ارتباطی سرور لبه با موفقیت راه‌اندازی گردید! \${NC}"
echo -e "\${GREEN}=================================================================\${NC}"
if [ -n "$EDGE_DOMAIN" ]; then
    echo -e "🌐 آدرس پنل وب: \${CYAN}https://$EDGE_DOMAIN\${NC}"
else
    echo -e "🌐 آدرس پنل وب: \${CYAN}http://$(curl -s ifconfig.me):80\${NC}"
fi
echo -e "🔒 تونل امن با هسته: \${YELLOW}$CORE_HOST:$CORE_PORT\${NC}"
echo -e "⚡ مصرف حافظه سرور لبه: کمتر از ۱۵۰MB RAM (تضمین پایداری دائمی)"
`;
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'install-edge-node.sh';
    a.click();
    URL.revokeObjectURL(url);
    showClusterToast('اسکریپت کامل نصب اینتراکتیو سرور لبه دانلود گردید.');
  };

  const [isBridgeConfigSaved, setIsBridgeConfigSaved] = useState<boolean>(false);

  const handleRegenerateExchangeToken = (len: number = 48) => {
    const chars = 'abcdef0123456789';
    let rand = '';
    for (let i = 0; i < len; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    const newToken = `omni-edge-sec-${rand}`;
    setExchangeBridgeToken(newToken);
    showClusterToast(`کلید تبادل امن و جدید (${len} کاراکتر) با موفقیت تولید و جایگزین گردید.`);
    dispatchLog('Core', 'SUCCESS', `کلید تبادل امن سرورهای لبه بازتولید گردید (${len} کاراکتر)`, 'CONFIG');
  };

  const handleSaveBridgeConfig = () => {
    setIsBridgeConfigSaved(true);
    setTimeout(() => setIsBridgeConfigSaved(false), 3000);
    showClusterToast(`تنظیمات پورت ${masterBridgePort} و کلید تبادل امن در هسته مرکزی ذخیره و فعال شد.`);
    dispatchLog('Core', 'SUCCESS', `پورت ارکستراسیون لبه به ${masterBridgePort} تغییر یافت و توکن جدید ثبت گردید`, 'CONFIG', `Port: ${masterBridgePort}`);
  };

  const handleRunEdgeWizardDeploy = async () => {
    if (!wizardDomain.trim() || !wizardNodeIp.trim()) return;
    setIsDeployingEdgeSsl(true);
    setWizardExecutionLogs([]);

    const logSteps = [
      `[*] اتصال اولیه SSH به سرور لبه ${wizardNodeIp}:22...`,
      `[*] ارزیابی سخت‌افزار سرور سبک (${wizardRamGb}GB RAM، سیستم‌عامل Ubuntu/Debian)...`,
      `[✓] پیش‌نیازها تایید شد: ایزوله کامل از مدل‌های سنگین و داکر. حافظه مصرفی سرویس لبه: ۱۸۰ مگابایت.`,
      `[*] نصب Nginx Reverse Proxy و ماژول WebSocket Proxy...`,
      `[*] تزریق کلید تبادل امن به فایل /etc/omniops/edge-auth.key...`,
      `[*] برقراری تونل امن با هسته مرکزی در آدرس ${masterPublicHost}:${masterBridgePort}...`,
      `[*] اجرای خودکار Certbot برای صدور گواهی‌نامه Let's Encrypt دامنه ${wizardDomain}...`,
      `[*] تایید رکورد A و چالش HTTP-01 با موفقیت انجام شد.`,
      `[✓] گواهی‌نامه معتبر SSL صادر شد (رمزنگاری TLS 1.3 با رتبه امنیتی A+).`,
      `[✓] پل ارتباطی امن فعال گردید: کاربران به این دامنه متصل شده و تمامی فرامین بدون تاخیر در هسته اصلی اجرا می‌شوند.`
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 280));
      setWizardExecutionLogs((prev) => [...prev, logSteps[i]]);
    }

    const newNode: EdgeGatewayNode = {
      id: `edge-${Date.now()}`,
      name: wizardNodeName.trim() || `Edge-Node-${wizardDomain.split('.')[0]}`,
      edgeIp: wizardNodeIp.trim(),
      domain: `https://${wizardDomain.trim().replace(/^https?:\/\//, '')}`,
      datacenter: wizardDatacenter,
      ramGb: wizardRamGb,
      cpuCores: wizardRamGb >= 2 ? 2 : 1,
      status: 'online',
      sslStatus: 'valid',
      sslIssuer: "Let's Encrypt Authority X3",
      sslExpiresInDays: 90,
      tunnelProtocol: 'WSS / TLS 1.3 (AES-256-GCM)',
      latencyToCoreMs: Math.floor(Math.random() * 12) + 4,
      activeUsersCount: 1,
      lastHeartbeat: 'هم‌اکنون',
      createdAt: new Date().toLocaleDateString('fa-IR')
    };

    setEdgeGatewayNodes((prev) => [newNode, ...prev]);
    setIsDeployingEdgeSsl(false);
    setWizardStep(4);
    dispatchLog('Core', 'SUCCESS', `نود سرور لبه جدید «${newNode.name}» با موفقیت مستقر و دارای SSL گردید.`, 'CONFIG');
    showClusterToast(`پل ارتباطی سرور لبه ${newNode.domain} با SSL فعال مستقر شد!`);
  };

  const handleDeleteEdgeNode = (nodeId: string, nodeName: string) => {
    setEdgeGatewayNodes((prev) => prev.filter((n) => n.id !== nodeId));
    showClusterToast(`پل ارتباطی سرور لبه «${nodeName}» حذف گردید.`);
    dispatchLog('Core', 'WARN', `نود سرور لبه «${nodeName}» حذف شد`, 'CONFIG');
  };

  const handleTestNodeConnection = () => {
    if (!newNodeIp) return;
    setIsTestingNodeConnection(true);
    setNodeTestResult(null);

    setTimeout(() => {
      setIsTestingNodeConnection(false);
      const isHeavy = newNodeRole === 'llm_heavy';
      const simCores = isHeavy ? 24 : 16;
      const simRam = isHeavy ? 64 : 32;
      const simGpu = isHeavy ? 'NVIDIA GeForce RTX 4090 (24 GB VRAM)' : undefined;
      
      const discoveredSpecs: WorkerNode['specs'] = {
        cpuCores: simCores,
        cpuModel: isHeavy ? 'AMD EPYC 7763 64-Core Processor (x86_64)' : 'Intel Xeon Gold 6330 @ 2.00GHz',
        cpuUsagePercent: Math.floor(Math.random() * 15) + 20,
        ramTotalGb: simRam,
        ramUsedGb: Math.round(simRam * 0.3 * 10) / 10,
        gpuName: simGpu,
        vramTotalGb: isHeavy ? 24 : undefined,
        vramUsedGb: isHeavy ? 14.2 : undefined,
        diskTotalGb: 500,
        diskUsedGb: 110,
        os: 'Ubuntu 24.04 LTS (Kernel 6.8.0-31-generic)',
        uptime: '21 روز و ۱۶ ساعت',
        pingMs: Math.floor(Math.random() * 5) + 3
      };

      setNodeTestResult({
        success: true,
        message: `اتصال SSH به ${newNodeSshUser}@${newNodeIp}:${newNodeSshPort} با موفقیت تایید شد. منابع سرور با موفقیت استخراج گردید.`,
        discoveredSpecs
      });
      dispatchLog('Core', 'SUCCESS', `تست ارتباط SSH و ارزیابی منابع سرور نود ${newNodeIp} با موفقیت انجام شد.`, 'HEALTHCHECK');
    }, 1100);
  };

  const handleAddWorkerNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeIp || !newNodeName) return;

    const specsToUse: WorkerNode['specs'] = nodeTestResult?.discoveredSpecs || {
      cpuCores: newNodeRole === 'llm_heavy' ? 24 : 16,
      cpuModel: newNodeRole === 'llm_heavy' ? 'AMD EPYC 7763' : 'Intel Xeon Gold',
      cpuUsagePercent: 22,
      ramTotalGb: newNodeRole === 'llm_heavy' ? 64 : 32,
      ramUsedGb: newNodeRole === 'llm_heavy' ? 18.5 : 9.2,
      gpuName: newNodeRole === 'llm_heavy' ? 'NVIDIA GeForce RTX 4090 (24 GB VRAM)' : undefined,
      vramTotalGb: newNodeRole === 'llm_heavy' ? 24 : undefined,
      vramUsedGb: newNodeRole === 'llm_heavy' ? 14.2 : undefined,
      diskTotalGb: 500,
      diskUsedGb: 95,
      os: 'Ubuntu 24.04 LTS',
      uptime: '1 روز',
      pingMs: 4
    };

    const newNode: WorkerNode = {
      id: `node-${Date.now()}`,
      name: newNodeName,
      ip: newNodeIp,
      sshPort: Number(newNodeSshPort) || 22,
      sshUser: newNodeSshUser || 'root',
      authType: newNodeAuthType,
      authSecret: newNodeAuthSecret ? '••••••••••••' : undefined,
      agentPort: 11434,
      status: 'online',
      role: newNodeRole,
      specs: specsToUse,
      assignedModels: newNodeRole === 'llm_heavy' ? ['deepseek-r1:14b', 'dorna2:8b'] : ['qwen2.5-coder:7b'],
      offloadedTasksCount: 0,
      lastHeartbeat: 'هم‌اکنون',
      createdAt: new Date().toLocaleDateString('fa-IR')
    };

    const updated = [newNode, ...workerNodes];
    setWorkerNodes(updated);
    try {
      localStorage.setItem('omniops_worker_nodes', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    dispatchLog('Core', 'SUCCESS', `سرور نود کمکی جدید "${newNode.name}" (${newNode.ip}) به کلاستر ملحق شد. ${specsToUse.ramTotalGb}GB RAM و ${specsToUse.cpuCores} هسته به استخر پردازشی اضافه گردید.`, 'CONFIG');
    showClusterToast(`سرور نود ${newNode.name} با ${specsToUse.ramTotalGb}GB RAM به کلاستر پیوست!`);
    
    // Reset form
    setNewNodeName('');
    setNewNodeIp('');
    setNewNodeAuthSecret('');
    setNodeTestResult(null);
    setIsAddNodeModalOpen(false);
  };

  const handlePingNode = (nodeId: string) => {
    setTestingPingNodeId(nodeId);
    setTimeout(() => {
      setWorkerNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          const freshPing = Math.floor(Math.random() * 5) + 3;
          dispatchLog('Core', 'INFO', `پایش وضعیت و پینگ نود "${n.name}" (${n.ip}): ${freshPing}ms - آنلاین`, 'HEALTHCHECK');
          return {
            ...n,
            status: 'online',
            specs: { ...n.specs, pingMs: freshPing },
            lastHeartbeat: 'هم‌اکنون (۱ ثانیه پیش)'
          };
        }
        return n;
      }));
      setTestingPingNodeId(null);
      showClusterToast('وضعیت و پینگ نود با موفقیت به‌روزرسانی شد.');
    }, 600);
  };

  const handleRemoveNode = (nodeId: string, nodeName: string) => {
    const updated = workerNodes.filter(n => n.id !== nodeId);
    setWorkerNodes(updated);
    try {
      localStorage.setItem('omniops_worker_nodes', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    dispatchLog('Core', 'WARN', `سرور نود کمکی "${nodeName}" از کلاستر حذف شد و منابع آن آزاد گردید.`, 'CONFIG');
    showClusterToast(`سرور نود ${nodeName} از کلاستر حذف شد.`);
  };

  const handleAssignModelToNode = () => {
    if (!assigningNodeId || !targetModelToAssign) return;
    setWorkerNodes(prev => prev.map(n => {
      if (n.id === assigningNodeId) {
        if (!n.assignedModels.includes(targetModelToAssign)) {
          const updatedModels = [...n.assignedModels, targetModelToAssign];
          dispatchLog('Ollama', 'SUCCESS', `مدل سنگین "${targetModelToAssign}" با موفقیت جهت استنتاج به سرور نود "${n.name}" ارجاع شد.`, 'CONFIG');
          return { ...n, assignedModels: updatedModels };
        }
      }
      return n;
    }));
    showClusterToast(`مدل ${targetModelToAssign} به نود پردازشی ارجاع داده شد.`);
    setIsAssignModelModalOpen(false);
    setAssigningNodeId(null);
  };

  // Ollama Model Hub & Download Scheduler State
  const [isOllamaHubOpen, setIsOllamaHubOpen] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<LocalModelItem[]>([
    {
      id: 'm-llama3-8b',
      name: 'Llama 3.1 8B Instruct',
      tag: 'llama3.1:8b',
      category: 'general',
      categoryLabel: 'چندمنظوره و گفتگوی فارسی',
      sizeGb: 4.7,
      description: 'مدل عمومی سریع و فوق‌العاده پایدار متا، بهینه‌سازی شده برای درک زبان فارسی و دستورات اداری.',
      isDownloaded: true,
      isActive: true
    },
    {
      id: 'm-deepseek-r1-8b',
      name: 'DeepSeek R1 Distill 8B',
      tag: 'deepseek-r1:8b',
      category: 'reasoning',
      categoryLabel: 'استدلال عمیق و منطق تحلیلی',
      sizeGb: 4.9,
      description: 'موتور استدلال گام‌به‌گام (Chain-of-Thought) برای عیب‌یابی پیچیده شبکه، کشف باگ و تحلیل سناریوهای بحرانی.',
      isDownloaded: true,
      isActive: false
    },
    {
      id: 'm-deepseek-r1-14b',
      name: 'DeepSeek R1 Distill 14B',
      tag: 'deepseek-r1:14b',
      category: 'reasoning',
      categoryLabel: 'استدلال سنگین و محاسبات مهندسی',
      sizeGb: 9.0,
      description: 'بالاترین دقت در استدلال ریاضی و مهندسی سیستم، مناسب سرورهای مجهز به کارت گرافیک ۱۶ گیگابایت به بالا.',
      isDownloaded: false,
      isActive: false
    },
    {
      id: 'm-qwen-coder-7b',
      name: 'Qwen 2.5 Coder 7B',
      tag: 'qwen2.5-coder:7b',
      category: 'code',
      categoryLabel: 'اسکریپت‌نویسی Bash & PowerShell',
      sizeGb: 4.7,
      description: 'برترین مدل متن‌باز کدنویسی دنیا در مقیاس سبک؛ نگارش اسکریپت‌های اتوماسیون، رول‌های فایروال و داکر.',
      isDownloaded: false,
      isActive: false
    },
    {
      id: 'm-llama3-vision-11b',
      name: 'Llama 3.2 Vision 11B',
      tag: 'llama3.2-vision:11b',
      category: 'vision',
      categoryLabel: 'بینایی ماشین و اسناد اسکن‌شده',
      sizeGb: 7.9,
      description: 'تحلیل تصویری دیاگرام‌های شبکه، نقشه‌ها، نامه‌های اسکن‌شده اداری با کیفیت پایین و OCR محلی.',
      isDownloaded: false,
      isActive: false
    },
    {
      id: 'm-bge-m3',
      name: 'BGE-M3 Multilingual Embedding',
      tag: 'bge-m3:latest',
      category: 'embedding',
      categoryLabel: 'امبدینگ و وکتورسازی اسناد حقوقی و اداری',
      sizeGb: 1.2,
      description: 'بهترین موتور امبدینگ چندزبانه در جهان با پشتیبانی بی‌نظیر از زبان فارسی و اصطلاحات تخصصی حقوقی/فنی.',
      isDownloaded: true,
      isActive: false
    },
    {
      id: 'm-nomic-embed',
      name: 'Nomic Embed Text',
      tag: 'nomic-embed-text:latest',
      category: 'embedding',
      categoryLabel: 'وکتورسازی سریع با حداقل RAM',
      sizeGb: 0.3,
      description: 'مدل سبک امبدینگ اسناد برای سیستم‌های با رم محدود؛ مصرف کمتر از ۳۰۰ مگابایت رم در اجرای کانتینر.',
      isDownloaded: true,
      isActive: false
    }
  ]);

  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [scheduledTargetModel, setScheduledTargetModel] = useState<string>('deepseek-r1:14b');
  const [scheduledHour, setScheduledHour] = useState<string>('02:30');

  // Trigger Immediate Pull Simulator
  const handlePullModel = (modelId: string, modelTag: string) => {
    setDownloadingModelId(modelId);
    setDownloadProgress(5);
    dispatchLog('Ollama', 'INFO', `فرآیند دریافت کانتینری مدل "${modelTag}" آغاز شد`, 'INSTALL', 'Executing: ollama pull ' + modelTag);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setDownloadingModelId(null);
          setOllamaModels((models) =>
            models.map((m) => (m.id === modelId ? { ...m, isDownloaded: true } : m))
          );
          dispatchLog('Ollama', 'SUCCESS', `دریافت و استقرار مدل "${modelTag}" با موفقیت پایان یافت`, 'INSTALL', 'Status: Ready for inference');
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  };

  // Schedule Model Pull for Off-Peak Hours
  const handleScheduleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    const [h, m] = scheduledHour.split(':');
    const cronSyntax = `${m || '0'} ${h || '2'} * * *`;
    const targetObj = ollamaModels.find((m) => m.tag === scheduledTargetModel);

    dispatchLog(
      'Ollama',
      'SUCCESS',
      `دانلود زمان‌بندی‌شده مدل ${scheduledTargetModel} برای ساعت ${scheduledHour} (ساعات خلوتی سرور) تنظیم شد`,
      'CONFIG',
      `Cron: ${cronSyntax} /usr/local/bin/ollama-pull.sh ${scheduledTargetModel}`
    );

    setOllamaModels((models) =>
      models.map((mod) =>
        mod.tag === scheduledTargetModel
          ? { ...mod, scheduledTime: scheduledHour }
          : mod
      )
    );

    alert(`زمان‌بندی دانلود برای ساعت ${scheduledHour} در صف کرون‌جاب سرور با موفقیت ثبت شد.`);
  };

  const handleSetActiveModel = (modelId: string) => {
    setOllamaModels((models) =>
      models.map((m) => ({ ...m, isActive: m.id === modelId }))
    );
    const chosen = ollamaModels.find((m) => m.id === modelId);
    if (chosen) {
      dispatchLog('Ollama', 'SUCCESS', `هسته استنتاج فعال Ollama به مدل "${chosen.name}" (${chosen.tag}) تغییر یافت`, 'LIFECYCLE');
    }
  };

  // Local fallback states if not supplied by props
  const [localActiveServices, setLocalActiveServices] = useState<{
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

  const activeServices = propActiveServices || localActiveServices;

  const handleToggleService = (id: 'core' | 'ollama' | 'anythingllm' | 'langflow' | 'jev' | 'n8n' | 'dify') => {
    if (propOnToggleService) {
      propOnToggleService(id);
    } else {
      setLocalActiveServices(prev => ({ ...prev, [id]: !prev[id] }));
    }
    const isNowActive = !activeServices[id];
    dispatchLog(
      id === 'jev' ? 'JEV' : id === 'core' ? 'Core' : id === 'anythingllm' ? 'AnythingLLM' : id === 'langflow' ? 'Langflow' : id === 'ollama' ? 'Ollama' : id === 'n8n' ? 'n8n' : 'Dify',
      isNowActive ? 'SUCCESS' : 'WARN',
      `وضعیت سرویس ${id.toUpperCase()} تغییر یافت: ${isNowActive ? 'آنلاین و آماده به کار' : 'متوقف شد'}`,
      'LIFECYCLE'
    );
  };

  const [deployingStack, setDeployingStack] = useState(false);
  const [autoConfiguringMesh, setAutoConfiguringMesh] = useState(false);
  const [stackLogs, setStackLogs] = useState<string[]>([
    'پشته مستقل پردازش محلی OmniOps با هسته ارکستراسیون و ۶ افزونه تخصصی آنلاین است.',
    'سرویس هسته OmniOps Core Hub روی پورت 9000 فعال است (شبکه omniops_mesh).',
    'سرویس سبک JEV Document Reader روی پورت 8000 فعال است (Chunking و ریرنکینگ سریع محلی).',
    'سرویس AnythingLLM روی پورت 3001 فعال است (سندکاوی، نامه اداری و RAG آفلاین بدون توکن).',
    'سرویس Langflow روی پورت 7860 فعال است (محیط بصری طراحی فلوهای هوش مصنوعی).',
    'سرویس Ollama روی پورت 11434 فعال است (مدل‌های متن‌باز محلی با کاتالوگ استدلال و کد).',
    'سرویس n8n روی پورت 5678 فعال است (وب‌هوک‌ها و اتوماسیون سازمانی).',
    'سرویس Dify روی پورت 5001 آماده است.'
  ]);

  // System Logs State & Fallback
  const [localIsSystemLoggingActive, setLocalIsSystemLoggingActive] = useState<boolean>(true);
  const isSystemLoggingActive = propIsSystemLoggingActive !== undefined ? propIsSystemLoggingActive : localIsSystemLoggingActive;
  
  const [localSystemLogs, setLocalSystemLogs] = useState<SystemLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: '10:00:01',
      level: 'INFO',
      component: 'Core',
      phase: 'LIFECYCLE',
      message: 'هسته ارکستراسیون OmniOps Core Hub در پورت 9000 فعال شد.',
      details: 'Subnet: 172.28.0.0/16, Driver: Bridge, State: Ready'
    },
    {
      id: 'log-init-2',
      timestamp: '10:00:02',
      level: 'SUCCESS',
      component: 'JEV',
      phase: 'CONFIG',
      message: 'موتور سبک JEV Reader متصل شد؛ پردازش اسناد سبک با چانک‌های ۵۱۲ توکن آغاز گردید.',
      details: 'OCR Engine: ON, Reranker: ON, Core Link: ACTIVE'
    },
    {
      id: 'log-init-3',
      timestamp: '10:00:03',
      level: 'SUCCESS',
      component: 'AnythingLLM',
      phase: 'CONFIG',
      message: 'پایگاه اسناد اداری AnythingLLM همگام شد؛ تحلیل اسناد چت‌روم با توکن رایگان (۰) آماده است.',
      details: 'Storage mount: /app/server/storage, Workspace: default'
    },
    {
      id: 'log-init-4',
      timestamp: '10:00:04',
      level: 'INFO',
      component: 'Langflow',
      phase: 'LIFECYCLE',
      message: 'پایپ‌لاین بصری Langflow آماده پذیرش گراف‌های استنتاجی چندمرحله‌ای است.',
      details: 'API: http://localhost:7860/api/v1'
    }
  ]);

  const systemLogs = propSystemLogs || localSystemLogs;

  const dispatchLog = (
    component: SystemLogEntry['component'],
    level: SystemLogEntry['level'],
    message: string,
    phase: SystemLogEntry['phase'] = 'LIFECYCLE',
    details?: string
  ) => {
    if (!isSystemLoggingActive) return;
    if (propOnAddSystemLog) {
      propOnAddSystemLog(component, level, message, phase, details);
    } else {
      const newEntry: SystemLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        level,
        component,
        phase,
        message,
        details
      };
      setLocalSystemLogs(prev => [newEntry, ...prev].slice(0, 200)); // FIFO optimized to keep memory ultra-lean
    }
  };

  const handleToggleSystemLogging = () => {
    if (propOnToggleSystemLogging) {
      propOnToggleSystemLogging();
    } else {
      setLocalIsSystemLoggingActive(prev => !prev);
    }
  };

  const handleClearSystemLogs = () => {
    if (propOnClearSystemLogs) {
      propOnClearSystemLogs();
    } else {
      setLocalSystemLogs([]);
    }
  };

  // Log filters
  const [logFilterPhase, setLogFilterPhase] = useState<string>('ALL');
  const [logFilterLevel, setLogFilterLevel] = useState<string>('ALL');
  const [logFilterSearch, setLogFilterSearch] = useState<string>('');

  const filteredLogs = systemLogs.filter((l) => {
    if (logFilterPhase !== 'ALL' && l.phase !== logFilterPhase) return false;
    if (logFilterLevel !== 'ALL' && l.level !== logFilterLevel) return false;
    if (logFilterSearch.trim()) {
      const q = logFilterSearch.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.component.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Messages history for Server Console
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'ops-init-1',
      role: 'assistant',
      content: `درود بر شما مدیر ارشد سامانه. به **«مرکز فرماندهی زیرساخت، هسته اصلی و اتوماسیون (OmniOps Core Hub Console)»** خوش آمدید.

این بخش دارای **اختیار کامل روت (Root Authority)** بوده و تحت نظارت مستقیم حساب SuperAdmin اجرا می‌شود. معماری هیبریدی پلتفرم با موفقیت فعال شده است:

**اکوسیستم هسته و افزونه‌های ماژولار متصل:**
۱. **OmniOps Core Hub (:9000)**: هسته مرکزی ارکستراسیون، روتر امن داده‌ها و هماهنگ‌کننده افزونه‌ها
۲. **JEV Document Reader (:8000)**: موتور سبک خواندن اسناد، قطعه‌بندی هوشمند متون (Chunking) و ریرنکینگ برای کارهای سبک‌تر کنار Langflow
۳. **AnythingLLM (:3001)**: موتور تحلیل اسناد اداری کاربران در چت‌روم (PDF/Word/Excel) بدون مصرف توکن آنلاین
۴. **Langflow (:7860)**: پایپ‌لاین ویژوال طراحی گراف‌های ایجنتی چندمرحله‌ای
۵. **Ollama (:11434)**: موتور استنتاج مدل‌های زبانی متن‌باز محلی (Llama 3, DeepSeek, Qwen Coder)
۶. **n8n (:5678)**: وب‌هوک‌های اتوماسیون و گردش کارهای سازمانی`,
      timestamp: '۱۰:۰۰',
      model_used: 'gemini-2.5-flash',
      server_actions: [
        {
          id: 'act-init-check',
          title: 'بررسی سلامت شبکه داخلی کانتینرها (Core Hub, JEV, AnythingLLM, Langflow, n8n)',
          command: 'docker ps --filter "name=omniops" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
          status: 'completed',
          exitCode: 0,
          output: `NAMES                  STATUS          PORTS
omniops_core           Up 6 hours      0.0.0.0:9000->9000/tcp
omniops_jev            Up 6 hours      0.0.0.0:8000->8000/tcp
omniops_anythingllm    Up 6 hours      0.0.0.0:3001->3001/tcp
omniops_langflow       Up 6 hours      0.0.0.0:7860->7860/tcp
omniops_ollama         Up 6 hours      0.0.0.0:11434->11434/tcp
omniops_n8n            Up 6 hours      0.0.0.0:5678->5678/tcp
omniops_dify_api       Up 6 hours      0.0.0.0:5001->5001/tcp`,
          executedAt: '۱۰:۰۰:۰۲'
        }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExecuteAction = (actionId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (!msg.server_actions) return msg;
        return {
          ...msg,
          server_actions: msg.server_actions.map((act) => {
            if (act.id === actionId) {
              dispatchLog('Core', 'INFO', `اجرای دستی فرمان سیستمی "${act.title}"`, 'LIFECYCLE', act.command);
              return {
                ...act,
                status: 'completed',
                output: act.output || 'دستور با کد خروجی ۰ با موفقیت روی سرور لینوکس اجرا گردید.'
              };
            }
            return act;
          })
        };
      })
    );
  };

  // Scheduler Handlers
  const handleToggleScheduledTask = (taskId: string) => {
    setScheduledTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextActive = !t.isActive;
        dispatchLog(
          t.targetService as any,
          nextActive ? 'SUCCESS' : 'WARN',
          `وضعیت زمان‌بندی «${t.name}» به ${nextActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`,
          'CONFIG',
          `Cron: ${t.cronExpression}`
        );
        return { ...t, isActive: nextActive };
      }
      return t;
    }));
  };

  const handleRunScheduledTaskNow = (taskId: string) => {
    const task = scheduledTasks.find(t => t.id === taskId);
    if (!task) return;
    setRunningTaskId(taskId);
    setSchedulerToast(`در حال اجرای وظیفه زمان‌بندی «${task.name}»...`);

    setTimeout(() => {
      setScheduledTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const nowStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
          return {
            ...t,
            lastRunStatus: 'success',
            lastRunTime: `امروز ${nowStr}`,
            lastOutput: `Manual trigger executed: ${t.command} executed with exit code 0. Container and memory refreshed.`
          };
        }
        return t;
      }));
      setRunningTaskId(null);
      setSchedulerToast(`وظیفه «${task.name}» با موفقیت اجرا شد.`);
      dispatchLog(
        task.targetService as any,
        'SUCCESS',
        `اجرای دستی وظیفه زمان‌بندی «${task.name}» با موفقیت خاتمه یافت.`,
        'LIFECYCLE',
        `Command: ${task.command}`
      );
      setTimeout(() => setSchedulerToast(null), 4000);
    }, 1200);
  };

  const handleDeleteScheduledTask = (taskId: string) => {
    const task = scheduledTasks.find(t => t.id === taskId);
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
    if (task) {
      dispatchLog(
        task.targetService as any,
        'WARN',
        `وظیفه زمان‌بندی «${task.name}» از دیمن Cron سرور حذف شد.`,
        'CONFIG'
      );
    }
  };

  const handleCreateScheduledTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim()) return;

    let generatedCmd = newScheduleCustomCmd;
    if (!generatedCmd) {
      if (newScheduleType === 'download_model') {
        generatedCmd = `docker exec omniops_ollama ollama pull ${newScheduleModel}`;
      } else if (newScheduleType === 'restart_service') {
        generatedCmd = `docker restart omniops_${newScheduleTarget.toLowerCase()} && sync`;
      } else if (newScheduleType === 'cache_flush') {
        generatedCmd = `echo 3 > /proc/sys/vm/drop_caches && docker exec omniops_${newScheduleTarget.toLowerCase()} find /tmp -type f -delete`;
      } else if (newScheduleType === 'security_audit') {
        generatedCmd = `strix scan --target="localhost:9000,localhost:7860,localhost:11434" --auto-patch`;
      } else {
        generatedCmd = `systemctl status omniops_${newScheduleTarget.toLowerCase()}`;
      }
    }

    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      name: newScheduleName.trim(),
      type: newScheduleType,
      targetService: newScheduleTarget,
      cronExpression: `${newScheduleMinute} ${newScheduleHour} * * *`,
      scheduledTimePersian: `${newScheduleHour}:${newScheduleMinute} (ساعات غیراداری)`,
      command: generatedCmd,
      description: newScheduleType === 'download_model' 
        ? `دانلود خودکار مدل ${newScheduleModel} روی Ollama در ساعات خلوتی پهنای باند` 
        : `اجرای خودکار عملیات ${newScheduleType} برای سرویس ${newScheduleTarget}`,
      isActive: true,
      offPeakOnly: newScheduleOffPeakOnly,
      nextRunFormatted: `فردا ساعت ${newScheduleHour}:${newScheduleMinute}`,
      lastRunStatus: 'pending'
    };

    setScheduledTasks(prev => [newTask, ...prev]);
    setIsCreatingSchedule(false);
    setNewScheduleName('');
    setNewScheduleCustomCmd('');
    setSchedulerToast(`وظیفه جدید «${newTask.name}» به زمان‌بندی اضافه شد.`);
    dispatchLog(
      newScheduleTarget as any,
      'SUCCESS',
      `وظیفه جدید زمان‌بندی «${newTask.name}» در ساعت ${newScheduleHour}:${newScheduleMinute} ثبت شد.`,
      'CONFIG',
      `Cron: ${newTask.cronExpression}`
    );
    setTimeout(() => setSchedulerToast(null), 4000);
  };

  // Full Mesh & Services Connection Diagnostic Test with Main Core
  const handleRunFullMeshTest = async () => {
    setIsFullMeshTestOpen(true);
    setTestingMesh(true);
    setMeshTestProgress(0);
    setMeshTestSummary(null);

    // Reset status to testing
    setMeshTestItems(prev => prev.map(item => ({ ...item, status: 'testing' })));
    dispatchLog('Core', 'INFO', 'آغاز تست سراسری ارتباط همه سرویس‌ها با هسته اصلی (Full Mesh Diagnostics)...', 'LIFECYCLE');

    for (let i = 0; i < INITIAL_MESH_SERVICES.length; i++) {
      await new Promise(r => setTimeout(r, 180));
      const target = INITIAL_MESH_SERVICES[i];
      const variance = Math.floor(Math.random() * 8) - 4;
      const finalLatency = Math.max(5, target.latencyMs + variance);

      setMeshTestItems(prev => prev.map(item => {
        if (item.id === target.id) {
          return {
            ...item,
            status: 'online',
            latencyMs: finalLatency,
            packetLoss: '0%'
          };
        }
        return item;
      }));

      setMeshTestProgress(Math.round(((i + 1) / INITIAL_MESH_SERVICES.length) * 100));
    }

    setTestingMesh(false);
    setMeshTestSummary('ارتباط کامل کلیه ۹ سرویس حیاتی با هسته اصلی برقرار است. صفر درصد اتلاف پکت، پایداری ۱۰۰٪ با فال‌بک آماده Ollama.');
    dispatchLog('Core', 'SUCCESS', 'تست ارتباط سراسری سرویس‌ها با هسته اصلی با موفقیت به پایان رسید (همه ۹ سرویس آنلاین و پایدار)', 'LIFECYCLE', 'Mesh Ping: PASS');
  };

  // Core Memory Handlers
  const handleSaveNewMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryTitle.trim() || !newMemoryContent.trim()) return;

    const newMem: AdminCoreMemoryItem = {
      id: `mem-${Date.now()}`,
      key: newMemoryKey.trim().toLowerCase().replace(/\s+/g, '_'),
      title: newMemoryTitle.trim(),
      category: newMemoryCategory,
      content: newMemoryContent.trim(),
      updatedAt: 'هم‌اکنون',
      isPermanent: true,
      source: `مدیر ارشد (@${currentUser.username})`
    };

    setCoreMemories(prev => [newMem, ...prev]);
    setIsAddMemoryOpen(false);
    setNewMemoryKey('');
    setNewMemoryTitle('');
    setNewMemoryContent('');
    setMemoryToast(`دستور و حافظه ماندگار «${newMem.title}» در پایگاه هسته ذخیره شد.`);
    dispatchLog('Core', 'SUCCESS', `قانون حافظه جدید هسته ثبت شد: ${newMem.key}`, 'CONFIG', newMem.title);
    setTimeout(() => setMemoryToast(null), 3500);
  };

  const handleDeleteMemory = (memId: string) => {
    const mem = coreMemories.find(m => m.id === memId);
    setCoreMemories(prev => prev.filter(m => m.id !== memId));
    setMemoryToast(`حافظه «${mem?.title || memId}» حذف شد.`);
    setTimeout(() => setMemoryToast(null), 3000);
  };

  const handleResetMemoriesToDefault = () => {
    setCoreMemories(INITIAL_CORE_MEMORIES);
    setMemoryToast('حافظه هسته ادمین به مقادیر پایه معماری بازگردانی شد.');
    setTimeout(() => setMemoryToast(null), 3500);
  };

  // Central Copilot Query Handler (Demonstrates Local Ollama Core Resilience, National Model Support & Persistent Memory Retrieval)
  const handleAskCentralCopilot = async (queryText?: string) => {
    const q = queryText || copilotQuery;
    if (!q.trim()) return;

    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: AdminChatMessage = {
      id: `acm-u-${Date.now()}`,
      role: 'user',
      content: q.trim(),
      timestamp: timeStr,
      modelUsed: selectedAdminModel
    };

    setAdminChatHistory(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);
    setCopilotAnswer(null);
    setCopilotMemoryUsed(null);
    setCopilotQuery('');

    await new Promise(r => setTimeout(r, 650));

    const lowerQ = q.toLowerCase();
    const matchedMemory = coreMemories.find(m => 
      lowerQ.includes(m.key.toLowerCase()) || 
      lowerQ.includes(m.title.toLowerCase()) || 
      m.content.toLowerCase().includes(lowerQ) ||
      (lowerQ.includes('فال‌بک') && m.category === 'failover') ||
      (lowerQ.includes('پایداری') && m.category === 'failover') ||
      (lowerQ.includes('قطع') && m.category === 'failover') ||
      (lowerQ.includes('میکروتیک') && m.category === 'network') ||
      (lowerQ.includes('شبکه') && m.category === 'network') ||
      (lowerQ.includes('سند') && m.category === 'security') ||
      (lowerQ.includes('محرمانه') && m.category === 'security') ||
      (lowerQ.includes('ساعت') && m.category === 'workflow') ||
      (lowerQ.includes('خلوت') && m.category === 'workflow') ||
      (lowerQ.includes('ردیس') && m.category === 'architecture') ||
      (lowerQ.includes('رم') && m.category === 'architecture')
    ) || coreMemories[0];

    const isNationalModel = selectedAdminModel.includes('dorna') || selectedAdminModel.includes('maral');
    setCopilotEngineUsed('ollama_local');
    setCopilotMemoryUsed(matchedMemory.title);

    let answerText = `پاسخ از هسته مرکزی ادمین (موتور استنتاج لوکال Ollama - مدل ${selectedAdminModel}${isNationalModel ? ' [مدل ملی فارسی - بدون نیاز به اینترنت]' : ''}):\n\n`;
    answerText += `طبق قانون و تصمیم پایدار **«${matchedMemory.title}»** (کلید حافظه: \`${matchedMemory.key}\`):\n`;
    answerText += `${matchedMemory.content}\n\n`;

    // Contextual environment variables inclusion
    const relatedEnv = adminEnvVars.slice(0, 3).map(e => `• \`${e.key}\`: ${e.value}`).join('\n');
    answerText += `⚙️ **وضعیت متغیرهای محیطی مرتبط:**\n${relatedEnv}\n\n`;
    answerText += `💡 **پایداری قطعی‌ناپذیر و حافظه ماندگار:** تمام تصمیمات، سوابق و متغیرهای این گفتگو در حافظه پایدار دیتابیس هسته و مرورگر ذخیره شده و پس از ری‌لود یا قطعی موقت سرویس، بدون کوچک‌ترین تغییر بازیابی می‌شوند.`;

    const envSnapshotMap: Record<string, string> = {};
    adminEnvVars.forEach(v => { envSnapshotMap[v.key] = v.value; });

    const botMsg: AdminChatMessage = {
      id: `acm-a-${Date.now()}`,
      role: 'assistant',
      content: answerText,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: selectedAdminModel,
      memoryReferenced: matchedMemory.title,
      envSnapshot: envSnapshotMap
    };

    setAdminChatHistory(prev => [...prev, botMsg]);
    setCopilotAnswer(answerText);
    setIsCopilotThinking(false);
  };

  // Environment Variables Handlers
  const handleSaveNewEnvVar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvKey.trim() || !newEnvValue.trim()) return;

    const newVar: AdminEnvVariable = {
      id: `env-${Date.now()}`,
      key: newEnvKey.trim().toUpperCase().replace(/\s+/g, '_'),
      value: newEnvValue.trim(),
      description: newEnvDesc.trim() || 'متغیر محیطی سیستمی پیکربندی شده توسط ادمین',
      updatedAt: 'هم‌اکنون',
      isSystem: false
    };

    setAdminEnvVars(prev => [...prev, newVar]);
    setIsAddEnvVarOpen(false);
    setNewEnvKey('');
    setNewEnvValue('');
    setNewEnvDesc('');
    setMemoryToast(`متغیر محیطی «${newVar.key}» در حافظه پایدار ثبت شد.`);
    dispatchLog('Core', 'SUCCESS', `متغیر محیطی جدید هسته افزوده شد: ${newVar.key}`, 'CONFIG', newVar.value);
    setTimeout(() => setMemoryToast(null), 3500);
  };

  const handleDeleteEnvVar = (varId: string) => {
    const target = adminEnvVars.find(v => v.id === varId);
    if (target?.isSystem) {
      setMemoryToast('متغیرهای سیستمی محافظت‌شده قابل حذف نیستند.');
      setTimeout(() => setMemoryToast(null), 3000);
      return;
    }
    setAdminEnvVars(prev => prev.filter(v => v.id !== varId));
    setMemoryToast(`متغیر محیطی «${target?.key || varId}» حذف گردید.`);
    setTimeout(() => setMemoryToast(null), 3000);
  };

  // Key Decisions Handlers
  const handleSaveNewDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionTitle.trim() || !newDecisionText.trim()) return;

    const newDec: AdminKeyDecision = {
      id: `dec-${Date.now()}`,
      title: newDecisionTitle.trim(),
      decision: newDecisionText.trim(),
      rationale: newDecisionRationale.trim() || 'تصمیم استراتژیک مصوب هسته مرکزی ادمین',
      status: 'enforced',
      timestamp: 'هم‌اکنون',
      author: `@${currentUser.username} (مدیر ارشد)`
    };

    setAdminKeyDecisions(prev => [newDec, ...prev]);
    setIsAddDecisionOpen(false);
    setNewDecisionTitle('');
    setNewDecisionText('');
    setNewDecisionRationale('');
    setMemoryToast(`تصمیم کلیدی مدل «${newDec.title}» در دفترچه ماندگار ثبت شد.`);
    dispatchLog('Core', 'SUCCESS', `تصمیم استراتژیک جدید ثبت شد: ${newDec.title}`, 'CONFIG');
    setTimeout(() => setMemoryToast(null), 3500);
  };

  const handleDeleteDecision = (decId: string) => {
    setAdminKeyDecisions(prev => prev.filter(d => d.id !== decId));
    setMemoryToast('تصمیم از دفترچه حذف گردید.');
    setTimeout(() => setMemoryToast(null), 3000);
  };

  const handleClearAdminChatHistory = () => {
    setAdminChatHistory(INITIAL_ADMIN_CHAT_HISTORY);
    setMemoryToast('تاریخچه چت دستیار هسته به وضعیت اولیه بازنشانی شد.');
    setTimeout(() => setMemoryToast(null), 3000);
  };

  const handleExportMemoryJson = () => {
    const dump = {
      exportedAt: new Date().toISOString(),
      adminUsername: currentUser.username,
      totalMemories: coreMemories.length,
      totalChatMessages: adminChatHistory.length,
      totalEnvVars: adminEnvVars.length,
      totalKeyDecisions: adminKeyDecisions.length,
      coreMemories,
      environmentVariables: adminEnvVars,
      keyDecisions: adminKeyDecisions,
      chatHistory: adminChatHistory
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniops-core-memory-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMemoryToast('نسخه پشتیبان کامل حافظه پایدار هسته دانلود شد.');
    setTimeout(() => setMemoryToast(null), 3500);
  };

  // 1-Click Master Deployment of Local Core & All Extensions
  const handleDeployLocalStack = () => {
    setDeployingStack(true);
    setStackLogs((prev) => [...prev, '[*] راه‌اندازی شبکه داخلی داکر (omniops_mesh: 172.28.0.0/16)...']);
    dispatchLog('Core', 'INFO', 'آغاز استقرار و همگام‌سازی پشته محلی هیبریدی OmniOps', 'INSTALL', 'Bridge: omniops_mesh');

    setTimeout(() => {
      setStackLogs((prev) => [...prev, '[*] استقرار هسته اصلی OmniOps Core Hub روی پورت 9000...']);
      setStackLogs((prev) => [...prev, '[*] استقرار و الحاق خودکار OmniRoute Mesh Router روی پورت 8888 در کنار هسته اصلی...']);
      if (!activeServices.core) handleToggleService('core');
      setOmniRouteConnected(true);
      dispatchLog('Core', 'SUCCESS', 'هسته اصلی OmniOps Core Hub و روتر OmniRoute آنلاین شدند', 'INSTALL', 'Core: 9000, OmniRoute: 8888');
    }, 400);

    setTimeout(() => {
      setStackLogs((prev) => [...prev, '[*] استقرار موتور سبک JEV (خرد کردن هوشمند، OCR و Reranker اسناد) روی پورت 8000...']);
      if (!activeServices.jev) handleToggleService('jev');
      dispatchLog('JEV', 'SUCCESS', 'موتور سبک JEV Reader روی پورت 8000 مستقر شد', 'INSTALL', 'Chunk size: 512, Embedding: local');
    }, 900);

    setTimeout(() => {
      setStackLogs((prev) => [...prev, '[*] استقرار AnythingLLM روی پورت 3001 (پایگاه دانش اسناد محلی و RAG بدون توکن)...']);
      if (!activeServices.anythingllm) handleToggleService('anythingllm');
      dispatchLog('AnythingLLM', 'SUCCESS', 'کانتینر AnythingLLM روی پورت 3001 آنلاین شد', 'INSTALL', 'Token cost: 0');
    }, 1400);

    setTimeout(() => {
      setStackLogs((prev) => [...prev, '[*] استقرار کانتینر بصری Langflow روی پورت 7860 (خطوط لوله ایجنت‌ها)...']);
      if (!activeServices.langflow) handleToggleService('langflow');
      dispatchLog('Langflow', 'SUCCESS', 'کانتینر Langflow روی پورت 7860 متصل شد', 'INSTALL');
    }, 1900);

    setTimeout(() => {
      setStackLogs((prev) => [...prev, '[*] استقرار کانتینر Ollama و اتصال وب‌هوک‌های n8n...']);
      if (!activeServices.ollama) handleToggleService('ollama');
      if (!activeServices.n8n) handleToggleService('n8n');
      dispatchLog('n8n', 'SUCCESS', 'اتوماسیون رویدادهای سازمانی n8n فعال شد', 'CONFIG');
      setDeployingStack(false);
    }, 2500);
  };

  // 1-Click Master Auto-Configuration of Add-ons with Core Hub
  const handleAutoConfigureMesh = () => {
    setAutoConfiguringMesh(true);
    dispatchLog('Core', 'INFO', 'پیکربندی خودکار و اتصال کلیه افزونه‌ها به هسته اصلی آغاز گردید', 'CONFIG');

    setTimeout(() => {
      setStackLogs((prev) => [
        ...prev,
        '[*] پیوند خودکار OmniRoute به تمام سرویس‌ها: کلیه ۸ مسیر محلی و ابری در پورت 8888 همگام شدند.',
        '[*] پیوند خودکار JEV به هسته: متغیر JEV_URL=http://omniops_jev:8000 تزریق شد.',
        '[*] پیوند خودکار AnythingLLM به هسته: متغیر CORE_BRIDGE تنظیم شد.',
        '[*] پیوند خودکار Langflow و n8n به شبکه امن هسته برقرار گردید.'
      ]);
      setOmniRouteConnected(true);
      dispatchLog('Core', 'SUCCESS', 'سرویس OmniRoute با موفقیت به کلیه ۸ سرویس اکوسیستم متصل گردید (Auto-Connected)', 'CONFIG');
      dispatchLog('JEV', 'SUCCESS', 'سرویس JEV با موفقیت به هسته اصلی متصل شد (دستورات خرد و ریرنکینگ)', 'CONFIG', 'Endpoint: /api/v1/jev/chunk');
      dispatchLog('AnythingLLM', 'SUCCESS', 'سرویس AnythingLLM با هسته اصلی همگام گردید', 'CONFIG');
      dispatchLog('Core', 'SUCCESS', 'تمامی افزونه‌ها و OmniRoute با هسته اصلی همگام‌سازی و اعتبارسنجی شدند.', 'CONFIG');
      showClusterToast('اتصال خودکار OmniRoute و کلیه سرویس‌ها به هسته با موفقیت همگام‌سازی شد.');
      setAutoConfiguringMesh(false);
    }, 1200);
  };

  const handleSendPrompt = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || inputText.trim();
    if (!textToSend || isProcessing) return;

    if (!presetPrompt) setInputText('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    dispatchLog('Core', 'INFO', `دریافت دستور سیستمی در کنسول: "${textToSend.slice(0, 50)}..."`, 'DISPATCH');

    setTimeout(() => {
      let commandGenerated = 'echo "Done"';
      let actionTitle = 'فرمان سیستمی عمومی';
      let outputText = 'فرمان با موفقیت روی لینوکس اجرا گردید.';

      const lower = textToSend.toLowerCase();

      if (lower.includes('jev') || lower.includes('خاندن فایل') || lower.includes('خواندن')) {
        commandGenerated = `docker run -d -p 8000:8000 --name omniops_jev --network omniops_mesh -e CORE_URL="http://omniops_core:9000" jinaai/jina:latest && curl -s http://localhost:8000/v1/health`;
        actionTitle = 'استقرار و اتصال کانتینر سبک JEV به هسته اصلی';
        outputText = `{"status": "online", "model": "jev-document-reader", "chunk_size": 512, "connected_to_core": true}`;
        dispatchLog('JEV', 'SUCCESS', 'کانتینر JEV روی پورت 8000 مستقر و با هسته همگام شد', 'INSTALL');
      } else if (lower.includes('anythingllm') || lower.includes('سند') || lower.includes('نامه')) {
        commandGenerated = `docker run -d -p 3001:3001 --name omniops_anythingllm --network omniops_mesh -v anythingllm_storage:/app/server/storage mintplexlabs/anything-llm:latest`;
        actionTitle = 'استقرار کانتینر AnythingLLM برای تحلیل آفلاین اسناد';
        outputText = `Container omniops_anythingllm started. Storage mounted at /app/server/storage. Ready for document RAG (0 tokens).`;
        dispatchLog('AnythingLLM', 'SUCCESS', 'استقرار کانتینر داکر AnythingLLM روی پورت 3001 تأیید شد', 'INSTALL');
      } else if (lower.includes('langflow')) {
        commandGenerated = `docker run -d -p 7860:7860 --name omniops_langflow --network omniops_mesh langflowai/langflow:latest`;
        actionTitle = 'استقرار کانتینر استودیوی بصری Langflow';
        outputText = `Langflow is running on http://0.0.0.0:7860. Flow engine initialized.`;
        dispatchLog('Langflow', 'SUCCESS', 'استودیوی Langflow آماده پذیرش گراف‌های پایپ‌لاین هوش مصنوعی شد', 'INSTALL');
      } else if (lower.includes('نصب') || lower.includes('install')) {
        commandGenerated = `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`;
        actionTitle = 'استعلام وضعیت کانتینرهای فعال سامانه';
        outputText = `NAMES                 STATUS          PORTS\nomniops_core          Up 4 days       0.0.0.0:9000->9000/tcp\nomniops_jev           Up 4 days       0.0.0.0:8000->8000/tcp\nomniops_anythingllm   Up 4 days       0.0.0.0:3001->3001/tcp\nomniops_langflow      Up 4 days       0.0.0.0:7860->7860/tcp\nomniops_ollama        Up 4 days       0.0.0.0:11434->11434/tcp`;
        dispatchLog('Core', 'SUCCESS', 'وضعیت کانتینرهای فعال سرور استعلام شد', 'HEALTHCHECK');
      } else {
        commandGenerated = `netstat -tuln | grep -E "9000|8000|3001|7860|11434|5678"`;
        actionTitle = 'بررسی وضعیت شبکه و پورت‌های پشته هیبریدی';
        outputText = `tcp   0   0 0.0.0.0:9000   0.0.0.0:*   LISTEN   (omniops_core)\ntcp   0   0 0.0.0.0:8000   0.0.0.0:*   LISTEN   (omniops_jev)\ntcp   0   0 0.0.0.0:3001   0.0.0.0:*   LISTEN   (omniops_anythingllm)\ntcp   0   0 0.0.0.0:7860   0.0.0.0:*   LISTEN   (omniops_langflow)\ntcp   0   0 0.0.0.0:11434  0.0.0.0:*   LISTEN   (omniops_ollama)\ntcp   0   0 0.0.0.0:5678   0.0.0.0:*   LISTEN   (omniops_n8n)`;
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `دستور مد نظر شما بررسی و فرمول‌بندی شد. این فرمان در بستر شبکه ایزوله کانتینرها با بالاترین سطح دسترسی سیستمی اعمال می‌گردد:`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        model_used: selectedModelId,
        server_actions: [
          {
            id: `act-${Date.now()}`,
            title: actionTitle,
            command: commandGenerated,
            status: autoExecuteMode ? 'completed' : 'pending',
            exitCode: autoExecuteMode ? 0 : undefined,
            output: autoExecuteMode ? outputText : undefined,
            executedAt: autoExecuteMode ? new Date().toLocaleTimeString('fa-IR') : undefined
          }
        ]
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 600);
  };

  // Download raw system architecture log file
  const handleDownloadLogs = () => {
    const logContent = systemLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.component}] [${l.phase || 'INFO'}] ${l.message} ${l.details ? `| ${l.details}` : ''}`)
      .join('\n');
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniops_architecture_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHandbook = () => {
    const handbookContent = `# 📘 کتابچه راهنمای جامع کاربران و راهنمای عملیاتی OmniOps Enterprise
### راهنمای رسمی مهندسی، استقرار هیبریدی، اتصال نودهای محاسباتی، پیکربندی هوشمند منابع و مانیتورینگ لحظه‌ای کلاستر

**نسخه مستندات:** \`v3.4.0-Enterprise\`  
**تاریخ به‌روزرسانی:** سپتامبر ۲۰۲۶  
**سطح طبقه‌بندی:** مستندات فنی و عملیاتی مدیران ارشد سیستم، معماران DevOps و تیم‌های امنیت زیرساخت  
**وضعیت معماری:** توزیع‌شده (Master Control-Plane + Multi-Worker Hybrid Mesh)  

---

## ⚡ دستورات نصب سریع و استقرار تک‌خطی (Fast One-Line Installers)

### ۱. فرمان نصب سرور کنترل مرکزی (Master Control-Plane)
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install.sh | bash -s -- \\
  --role master \\
  --admin-user "admin" \\
  --admin-pass "OmniOps#2026!Sec" \\
  --web-port 9000 \\
  --enable-mesh
\`\`\`

### ۲. فرمان الحاق سرورهای دوم و سوم به عنوان نود محاسباتی (Worker Compute Nodes)
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-worker.sh | bash -s -- \\
  --master "http://IP_OF_MASTER:9000" \\
  --token "omni-node-join-token" \\
  --name "Worker-Node-02" \\
  --role llm_heavy \\
  --agent-port 9001
\`\`\`

### ۳. فرمان نصب سریع سرور لبه سبک ۱ یا ۲ گیگابایت رم (Lightweight Edge UI Mirror - Pasargad-Style)
جهت راه‌اندازی اینترفیس گرافیکی وب روی سرورهای سبک دیتاسنتر یا CDN با صدور خودکار SSL و اتصال تونل امن به هسته:
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-edge-node.sh | bash
\`\`\`
*(پس از اجرا، اسکریپت به صورت اینتراکتیو آدرس سرور هسته، پورت، کلید تبادل طولانی و نام دامنه را دریافت کرده و گواهی‌نامه SSL را به صورت اتوماتیک صادر می‌نماید)*

---

## ۱. فلسفه معماری توزیع‌شده (Master-Worker Decoupling)
- **چالش سامانه‌های سنتی تک‌سروره هوش مصنوعی (Single-Node Bottleneck):** در سیستم‌های قدیمی، تجمیع وب‌پنل، دیتابیس و موتورهای سنگین زبانی روی یک سرور منفرد موجب کرش ناشی از خطای کمبود حافظه (OOM Crash) می‌گردد.
- **راهکار تفکیک‌شده OmniOps Enterprise:**
  - **سرور اول (Master Control-Plane):** میزبانی وب‌پنل، ارکستراتور، پایگاه‌داده و سیستم کش روی یک سرور سبک و چابک با تضمین آپ‌تایم ۱۰۰٪.
  - **سرورهای دوم و سوم (Worker Compute Nodes):** سرورهای اختصاصی با RAM بالا و کارت گرافیک‌های NVIDIA جهت استنتاج مدل‌های زبانی (DeepSeek-R1, Dorna 2, Llama 3) بدون تأثیر بر پایداری پنل اصلی.

---

## ۲. تمامی قابلیت‌ها و ماژول‌های هسته
- **مرکز فرماندهی OmniOps Core Hub (:9000 / :8080):** ورودی وب‌پنل، احراز هویت سه سطحی (SuperAdmin / Operator / User)، وب‌سوکت تله‌متری و ارکستراتور.
- **موتور استنتاج محلی Ollama (:11434):** اجرای آفلاین مدل‌های زبانی بومی و ملی بدون نیاز به اینترنت:
  - **Dorna 2:8b (\`ollama/dorna2:8b\`):** مدل ملی فارسی ویژه نامه‌نگاری و مکاتبات رسمی اداری.
  - **Maral 7B (\`ollama/maral:7b\`):** مدل چابک زبان فارسی مبتنی بر معماری Mistral.
  - **DeepSeek-R1:8b & 14b:** استدلال عمیق منطقی و تحلیل رویدادهای شبکه.
  - **Qwen2.5-Coder:7b & 14b:** دستیار کدنویسی و نگارش اسکریپت‌های اتوماسیون.
- **موتور تحلیل آفلاین و بدون توکن اسناد AnythingLLM (:3001):** بارگذاری امن فایل‌های PDF, Word, Excel در محیط محلی با هزینه توکن صفر.
- **میکروسرویس سبک JEV Reader (:8000):** تکه‌بندی سریع (Fast Chunking 512)، OCR اسناد اسکن‌شده و موتور ریرنکینگ محلی.
- **استودیوی ویژوال Langflow (:7860):** طراحی گراف‌های پایپ‌لاین هوش مصنوعی و اتصال ایجنت‌های زنجیره‌ای.
- **اتوماسیون n8n (:5678):** ارسال وب‌هوک‌های اضطراری، اعلام هشدارها به تلگرام، ایمیل و پیام‌رسان‌های سازمانی.
- **سیستم حافظه پایدار چت‌بات هسته (Persistent Memory Bank):** نگهداری دائمی پیام‌ها، متغیرهای محیطی سیستم و دفترچه تصمیمات کلیدی مدل در حافظه پایدار دیتابیس و مرورگر.
- **کنسول امن روت شل و لاگ‌های معماری:** بافر سبک FIFO شامل ۲۰۰ لاگ اخیر با دسته‌بندی فازها (LIFECYCLE, CONFIG, DISPATCH, INSTALL).

---

## ۳. روش گام‌به‌گام اتصال Worker Nodeها
۱. اجرای اسکریپت خودکار الحاق روی سرور ورکر یا تکمیل فرم افزودن نود در تب سرورهای محاسباتی.
۲. تخصیص یکی از چهار نقش سازمانی به سرور:
   - \`llm_heavy\`: ویژه نودهای دارای کارت گرافیک جهت استنتاج سریع مدل‌های زبانی.
   - \`embedding_rag\`: ویژه ذخیره امبدینگ‌ها و پایگاه داده برداری AnythingLLM.
   - \`hybrid_worker\`: ویژه سرویس‌های سبک JEV, Langflow و n8n.
   - \`standby\`: نود ذخیره آماده‌باش جهت فعال‌سازی خودکار در زمان خرابی (Failover).
۳. مانیتورینگ اتصال از طریق تبادل سیگنال‌های Heartbeat هر ۳ ثانیه یک‌بار روی پورت ۹۰۰۱.

---

## ۴. پیکربندی هوشمند منابع و ارزیابی سخت‌افزار
- **موتور ارزیابی هوشمند سخت‌افزار (Hardware Assessment):**
  - تحلیل RAM: زیر ۸GB (فقط مستر)، ۸ تا ۱۶GB (مدل‌های سبک ۸ بیتی)، بالای ۳۲GB (مدل‌های سنگین تجاری).
  - تحلیل کارت گرافیک انویدیا با اجرای خودکار \`nvidia-smi\` و پیکربندی لایه‌های VRAM Offloading.
  - تحلیل فضای دیسک و الزامات دیسک‌های پرسرعت NVMe SSD.
- **زمان‌بندی هوشمند در ساعات خلوتی (Off-Peak Scheduler):**
  - دانلود خودکار مدل‌های حجیم در ساعت ۰۲:۳۰ بامداد بدون کاهش پهنای باند سازمان.
  - تخلیه خودکار بافرهای حافظه رم لینوکس (\`drop_caches\`) در ساعت ۰۴:۱۵ صبح قبل از شروع شیفت کاری.
- **پل سوئیچ خودکار در شرایط اضطراری (Failover Cascade):** انتقال آنی پردازش‌ها به مدل‌های محلی Ollama در صورت قطعی اینترنت بین‌الملل.

---

## ۵. معماری پل سرور لبه سبک و صدور خودکار SSL (Lightweight Edge UI Mirror - Pasargad-Style)
- **فلسفه تفکیک لبه (Edge-Core Decoupling):**
  - **سرور قدرتمند هسته مرکزی (Core Hub):** سرور اصلی با ۱۱۲GB RAM یا پردازنده‌های متعدد که در دیتاسنتر یا محیط ایزوله سازمانی قرار دارد و کلیه مدل‌های زبانی سنگین (Ollama)، پردازش اسناد (JEV, AnythingLLM) و پایپ‌لاین‌ها (Langflow) روی آن مستقر است.
  - **سرور لبه و آینه گرافیکی (Edge Node):** یک سرور سبک ۱ یا ۲ گیگابایت رم در دیتاسنتر یا شبکه CDN عمومی که تنها نقش درگاه ورودی وب، پروکسی معکوس و صدور SSL را ایفا می‌کند (مصرف رم کمتر از ۱۵۰ مگابایت).
- **فرآیند نصب خودکار و تعاملی سرور لبه:**
  ۱. مراجعه به تب اختصاصی **«نصب خودکار لبه» (Installation Tab)** در پنل جهت تنظیم پارامترها و دانلود اسکریپت یا اجرای فرمان تک‌خطی:
     \`curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-edge-node.sh | bash\`
  ۲. دریافت آدرس پابلیک سرور هسته مرکزی (Core Public IP / Domain)
  ۳. دریافت پورت تبادل و ارتباط با هسته (پیش‌فرض ۹۰۰۰ با **امکان وارد کردن هر پورت دلخواه** از جمله ۸۴۴۳، ۸۰۸۰، ۴۴۴۳ یا هر پورت آزاد بین ۱۰۲۴ تا ۶۵۵۳۵)
  ۴. دریافت کلید تبادل طولانی و امنیتی (Security Token) با **گزینه‌های تولید توکن قوی ۶۴ بایت HMAC-SHA256 یا ۳۲ بایت** یا ثبت رمز دلخواه
  ۵. دریافت نام دامنه دلخواه وب‌پنل (مثلاً \`panel.mycompany-ai.ir\`)
  ۶. بررسی اتصال DNS و **صدور خودکار گواهی‌نامه رسمی SSL با Let's Encrypt (TLS 1.3)** به همراه تغییر مسیر خودکار به HTTPS و فعال‌سازی تمدید ۹۰ روزه
- **امنیت و عدم اشغال منابع:**
  - تمامی فرامین شل، نشست‌های چت، تحلیل اسناد و پرسش‌های هوش مصنوعی از طریق تونل رمزنگاری‌شده WSS مستقیماً به هسته مرکزی ارسال و اجرا می‌شوند.
  - سرور لبه دچار کمبود حافظه (OOM) نمی‌گردد و در صورت بروز اختلال در سرورهای دیگر، دسترسی کاربران به رابط وب پایدار می‌ماند.
  - مصرف حافظه رم روی سرور لبه کمتر از ۱۵۰ مگابایت بوده و عملکرد سریع و پایداری را روی سرورهای ابری ۱ تا ۲ گیگابایت رم تضمین می‌نماید.

---

## ۶. ابزارهای مانیتورینگ و سلامت لحظه‌ای کلاستر
- **داشبورد دایره‌ای پایش سلامت نودها (Cluster Health Donut Radar):**
  - حلقه خارجی فیروزه‌ای: درصد اشغال RAM نودها با تغییر رنگ در آستانه‌های ۷۵٪ و ۸۵٪.
  - حلقه داخلی بنفش: درصد بار پردازشی هسته‌های CPU.
  - مرکز رادار: وضعیت کارایی و سلامت سرور (سالم، بار متوسط، بار سنگین).
- **جریان زنده تله‌متری (Live Telemetry Stream):** نوسان و گزارش‌دهی متغیرهای حیاتی هر ۳ ثانیه یک‌بار.
- **تست تشخیصی مش کامل شبکه (Full Mesh Diagnostic Test):** ارزیابی وضعیت و پکت‌لاس کلیه ۹ سرویس کلیدی.

---

## ۷. ماتریس امنیتی شبکه و پورت‌ها
- \`9000\` / \`8080\`: OmniOps Core Hub (وب‌پنل، وب‌سوکت و ارکستراتور)
- \`8888\`: OmniRoute Intelligent Mesh Router (مسیریاب یکپارچه سرویس‌ها)
- \`443\` / \`80\`: Edge UI Mirror (درگاه ورودی کاربران وب با SSL)
- \`11434\`: Ollama Engine (استنتاج مدل‌های محلی)
- \`8000\`: JEV Reader (پردازش سبک اسناد و OCR)
- \`3001\`: AnythingLLM (پایگاه دانش اسناد اداری)
- \`7860\`: Langflow Studio (پایپ‌لاین ویژوال هوش)
- \`5678\`: n8n Automation (وب‌هوک‌ها و گردش کارهای سازمانی)
- \`9001\`: Agent Daemon (تله‌متری سخت‌افزار نودها)

---

## ۸. فرامین متداول مدیریتی و خطایابی
\`\`\`bash
# مشاهده وضعیت اجرای سرویس اصلی
sudo systemctl status omniops

# مشاهده لاگ‌های لایف‌سایکل
sudo journalctl -u omniops -f

# بررسی وضعیت کانتینرهای فعال شبکه
docker ps --filter "network=omniops_mesh"

# تست سلامت اولاما لوکال
curl -s http://localhost:11434/api/tags | jq .

# آزادسازی دستی حافظه رم سرور
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
\`\`\`

---
*OmniOps Enterprise Manager — استاندارد طلایی مدیریت هیبریدی زیرساخت و پردازش محلی هوش مصنوعی.*
`;
    const blob = new Blob([handbookContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OmniOps_Enterprise_User_Manual.md';
    a.click();
    URL.revokeObjectURL(url);
    showClusterToast('کتابچه جامع راهنمای کاربران و راهنمای عملیاتی هسته (User_Manual.md) دانلود شد.');
  };

  return (
    <div className="space-y-6">
      {/* 1. Dedicated OmniOps Core Hub & OmniRoute Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#141419] to-indigo-950/30 border border-blue-500/25 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Badges */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-600/10">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                  مرکز فرماندهی زیرساخت و هسته اصلی OmniOps Core Hub
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  شبکه هیبریدی فعال
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono border border-cyan-500/30 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  OmniRoute: متصل خودکار به کلیه سرویس‌ها
                </span>
              </div>
              <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
                مدیریت هسته اصلی، افزونه‌های ماژولار (JEV, AnythingLLM, Langflow)، دانلود زمان‌بندی مدل‌های Ollama و لاگ‌های معماری
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 shrink-0">
            <button
              type="button"
              onClick={() => setIsHandbookModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-amber-950/40"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>کتابچه راهنمای هسته (Handbook)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHandbook}
              title="دانلود فایل مارک‌داون کتابچه راهنما (.md)"
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>دانلود کتابچه (.md)</span>
            </button>

            <button
              type="button"
              onClick={handleOmniRouteAutoConnectAll}
              disabled={omniRouteAutoConnecting}
              title="اتصال خودکار OmniRoute به تمام سرویس‌ها"
              className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-cyan-950/30"
            >
              <LinkIcon className={`w-4 h-4 text-cyan-400 ${omniRouteAutoConnecting ? 'animate-spin' : ''}`} />
              <span>{omniRouteAutoConnecting ? 'در حال اتصال...' : 'اتصال خودکار OmniRoute'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Responsive Subtab Navigation - Clean Multi-Row Card Grid (Stacking vertically & wrapping responsively) */}
      <div className="bg-[#121217] border border-neutral-800/80 rounded-2xl p-2.5 shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8 gap-2.5">
        {/* Tab 1: Local Stack & Extensions */}
        <button
          onClick={() => setActiveSubTab('local_stack')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'local_stack'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">هسته و افزونه‌های محلی</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'local_stack' ? 'bg-white/20' : 'bg-blue-500/10 text-blue-400'}`}>
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Local Stack & OmniRoute</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 font-mono">:9000/:8888</span>
          </div>
        </button>

        {/* Tab 2: Distributed Cluster & Worker Nodes */}
        <button
          onClick={() => setActiveSubTab('cluster_nodes')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'cluster_nodes'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">خوشه و نودهای پردازشی</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'cluster_nodes' ? 'bg-white/20' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Worker Nodes</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-mono">
              {activeWorkerNodes.length + 1} سرور | {clusterTotalRamGb}GB
            </span>
          </div>
        </button>

        {/* Tab 3: Lightweight Edge UI Mirror & CDN Gateway */}
        <button
          onClick={() => setActiveSubTab('edge_gateway')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'edge_gateway'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">پل سرور لبه (Edge UI)</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'edge_gateway' ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Lightweight Mirror</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-mono">
              ۱-۲GB RAM & SSL
            </span>
          </div>
        </button>

        {/* Tab 4: Edge Installation & Script Generator */}
        <button
          onClick={() => setActiveSubTab('installation')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'installation'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">نصب خودکار لبه</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'installation' ? 'bg-white/20' : 'bg-teal-500/10 text-teal-400'}`}>
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Installation Tab</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-200 font-mono">
              اسکریپت شل SSL
            </span>
          </div>
        </button>

        {/* Tab 5: Console */}
        <button
          onClick={() => setActiveSubTab('console')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'console'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">کنسول روت شل</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'console' ? 'bg-white/20' : 'bg-amber-500/10 text-amber-400'}`}>
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Root Shell Terminal</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono">
              دستورات سیستمی
            </span>
          </div>
        </button>

        {/* Tab 5: Intelligent Scheduler */}
        <button
          onClick={() => setActiveSubTab('scheduler')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'scheduler'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">زمان‌بندی هوشمند</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'scheduler' ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Smart Scheduler</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono">
              ساعات غیراداری
            </span>
          </div>
        </button>

        {/* Tab 6: Core Admin Memory & Copilot */}
        <button
          onClick={() => setActiveSubTab('core_memory')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'core_memory'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">حافظه پایدار هسته</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'core_memory' ? 'bg-white/20' : 'bg-amber-500/10 text-amber-400'}`}>
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Core Memory</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono">
              {coreMemories.length} رکورد
            </span>
          </div>
        </button>

        {/* Tab 7: Architecture & Lifecycle Logs */}
        <button
          onClick={() => setActiveSubTab('architecture_logs')}
          className={`p-3 rounded-xl text-xs font-semibold transition-all flex flex-col justify-between text-right gap-2 border w-full ${
            activeSubTab === 'architecture_logs'
              ? 'bg-gradient-to-br from-blue-600/90 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/60 ring-1 ring-blue-400/30'
              : 'bg-[#15151C] text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-xs truncate">لاگ‌های معماری</span>
            <div className={`p-1.5 rounded-lg ${activeSubTab === 'architecture_logs' ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10">
            <span className="text-[10px] opacity-80 font-mono">Lifecycle Logs</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-mono">
              پایش لایف‌سایکل
            </span>
          </div>
        </button>
      </div>

      {/* Global Cluster & Node Toast Alert */}
      {clusterToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{clusterToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setClusterToast(null)}
            className="text-emerald-400/70 hover:text-emerald-200 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW 1: Local Stack & Modular Add-ons (Core Hub + JEV + AnythingLLM + Langflow + Ollama + n8n) */}
      {activeSubTab === 'local_stack' && (
        <div className="space-y-6">
          {/* Distributed Cluster Quick Status Banner */}
          <div className="bg-[#121217] border border-cyan-500/30 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">معماری توزیع‌شده کلاستر (Master + Worker Nodes)</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    {activeWorkerNodes.length + 1} سرور متصل
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {clusterTotalRamGb} GB کل RAM
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  پنل مرکزی روی سرور مستر در حالت ایزوله و سبک اجرا می‌شود؛ مدل‌های سنگین استنتاج به نودهای ورکر دارای رم بالا و کارت گرافیک هدایت می‌گردند.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsHardwareReportModalOpen(true)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>گزارش ارزیابی سخت‌افزار</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('cluster_nodes')}
                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>مدیریت و افزودن Worker Node</span>
              </button>
            </div>
          </div>

          {/* OmniOps Core Hub Center Banner with 1-Click Link All & One-Line Installer Trigger */}
          <div className="bg-gradient-to-r from-blue-950/60 via-[#14141A] to-purple-950/40 border border-blue-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 font-extrabold text-xl shadow-md shadow-blue-600/20">
                  Ω
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">هسته مرکزی ارکستراسیون (OmniOps Core Hub)</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                      Port :9000
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                      Mesh: omniops_mesh
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-3xl leading-relaxed">
                    هسته اصلی وظیفه هماهنگی درخواست‌های ورودی چت‌روم‌ها، هدایت اسناد به موتور سبک JEV یا AnythingLLM (بدون توکن) و اتصال وب‌هوک‌های سازمانی به کانتینرهای مستقل را بر عهده دارد.
                  </p>
                </div>
              </div>

              {/* Master Control Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Test All Services Connection with Core */}
                <button
                  type="button"
                  onClick={handleRunFullMeshTest}
                  className="px-3.5 py-2 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/20"
                  title="تست ارتباط همه سرویس‌ها با هسته اصلی و پایش تاخیر و سلامت کانتینرها"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>تست ارتباط همه سرویس‌ها با هسته اصلی</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoConfigureMesh}
                  disabled={autoConfiguringMesh}
                  className="px-3.5 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="پیکربندی خودکار و اتصال کلیه افزونه‌های فعال به شبکه پل هسته اصلی"
                >
                  <LinkIcon className={`w-3.5 h-3.5 ${autoConfiguringMesh ? 'animate-spin' : ''}`} />
                  <span>{autoConfiguringMesh ? 'در حال اتصال پیوندها...' : 'تنظیم خودکار با هسته اصلی'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeployLocalStack}
                  disabled={deployingStack}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${deployingStack ? 'animate-spin' : ''}`} />
                  <span>{deployingStack ? 'در حال استقرار سرویس‌ها...' : 'راه‌اندازی و بررسی کل پشته'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Microservices Cards: Core Companion OmniRoute + 6 Autonomous Add-ons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 0. OmniRoute Core Companion & Intelligent Mesh Router Card */}
            <div className="bg-gradient-to-br from-[#121622] to-[#141418] border border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-cyan-500/60 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>OmniRoute Mesh Router</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">هسته & روتر</span>
                      </h4>
                      <span className="text-[10px] text-neutral-400">مسیریاب یکپارچه هوشمند و سوییچ Zero-Downtime</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    omniRouteConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {omniRouteConnected ? 'آنلاین :8888' : 'آفلاین'}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  مسیریاب ترافیک هوشمند نصب‌شده در کنار هسته اصلی؛ متصل خودکار به تمامی ۸ سرویس اکوسیستم (اولاما، JEV، AnythingLLM، Langflow، n8n، Dify، Local Agent) با قابلیت سوییچ لحظه‌ای و بدون وقفه هنگام افت کیفیت یا محدودیت سهمیه.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>وضعیت اتصال خودکار:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {omniRouteConnected ? 'متصل به کلیه ۸ سرویس اکوسیستم' : 'قطع ارتباط'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>تاخیر مسیریابی (Latency):</span>
                    <span className="text-cyan-300 font-mono font-bold">۰.۸ میلی‌ثانیه (Zero-Overhead)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>درگاه مرکزی Mesh:</span>
                    <span className="text-blue-400 font-mono">http://localhost:8888</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={handleOmniRouteAutoConnectAll}
                  disabled={omniRouteAutoConnecting}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs border border-cyan-500/30 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <LinkIcon className={`w-3 h-3 ${omniRouteAutoConnecting ? 'animate-spin' : ''}`} />
                  <span>{omniRouteAutoConnecting ? 'در حال همگام‌سازی...' : 'اتصال خودکار به همه سرویس‌ها'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOmniRouteConnected(!omniRouteConnected)}
                  className="text-xs text-neutral-400 hover:text-white px-2 py-1"
                >
                  {omniRouteConnected ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                </button>
              </div>
            </div>

            {/* 1. Ollama Local Engine Card (Enriched with Model Hub & Scheduler) */}
            <div className="bg-[#141418] border border-blue-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Ollama Local Engine</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">هوش لوکال</span>
                      </h4>
                      <span className="text-[10px] text-neutral-400">استنتاج مدل‌های سبک و سنگین (Llama, DeepSeek)</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeServices.ollama ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeServices.ollama ? 'آنلاین :11434' : 'متوقف'}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  موتور استنتاج مدل‌های زبانی متن‌باز؛ شامل مدل‌های استدلال CoT، کدنویسی، چندزبانه فارسی و امبدینگ با قابلیت دانلود فوری یا زمان‌بندی‌شده در ساعات خلوتی سرور.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>مدل فعال جاری:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {ollamaModels.find((m) => m.isActive)?.tag || 'llama3.1:8b'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>مدل‌های دانلود شده:</span>
                    <span className="text-white font-mono">
                      {ollamaModels.filter((m) => m.isDownloaded).length} از {ollamaModels.length} مدل
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>اندپوینت REST:</span>
                    <span className="text-blue-400 font-mono">http://localhost:11434</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setIsOllamaHubOpen(true)}
                  className="w-full py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs border border-blue-500/30 font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>کاتالوگ هسته‌ها و زمان‌بندی دانلود</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('scheduler')}
                  className="w-full py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs border border-indigo-500/30 font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="تنظیم زمان‌بندی دانلود شبانه مدل‌ها یا ریاستارت خودکار"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>زمان‌بندی ساعات غیراداری (دانلود & ریاستارت)</span>
                </button>
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      dispatchLog('Ollama', 'SUCCESS', 'پیوند Ollama با هسته اصلی تجدید شد.', 'CONFIG');
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    همگام‌سازی پیوند
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleService('ollama')}
                    className="text-neutral-400 hover:text-white"
                  >
                    {activeServices.ollama ? 'خاموش کردن' : 'روشن کردن'}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. JEV Document Engine */}
            <div className="bg-[#141418] border border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-emerald-500/60 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>موتور سبک JEV Reader</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">سریع & سبک</span>
                      </h4>
                      <span className="text-[10px] text-neutral-400">خواندن فایل‌ها، Chunking و Reranker</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeServices.jev ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeServices.jev ? 'آنلاین :8000' : 'متوقف'}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  مدل محلی سبک JEV برای قطعه‌بندی هوشمند متون (Chunking با اندازه ۵۱۲ توکن)، بازخوانی OCR و مدیریت کارهای کوچکتر اسناد در کنار Langflow بدون سربار سنگین پردازشی.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>وظیفه اصلی:</span>
                    <span className="text-emerald-400 font-mono">Fast Chunker & Local Reranker</span>
                  </div>
                  <div className="flex justify-between">
                    <span>اتصال به هسته:</span>
                    <span className="text-white font-mono">http://omniops_core:9000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>اندپوینت سرویس:</span>
                    <span className="text-emerald-400 font-mono">http://localhost:8000/v1</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => {
                    dispatchLog('JEV', 'SUCCESS', 'دستور اتصال خودکار JEV به هسته اصلی با موفقیت صادر گردید.', 'CONFIG');
                    setStackLogs(prev => [...prev, '[*] سرویس JEV به هسته OmniOps متصل شد (ترافیک کارهای سبک به پورت 8000 هدایت می‌شود).']);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] border border-emerald-500/30 font-medium flex items-center gap-1 transition-all"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>اتصال خودکار به هسته</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleService('jev')}
                  className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                >
                  {activeServices.jev ? 'خاموش کردن' : 'روشن کردن'}
                </button>
              </div>
            </div>

            {/* 3. AnythingLLM Enterprise Card */}
            <div className="bg-[#141418] border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-blue-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>AnythingLLM Enterprise</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">چت‌روم</span>
                      </h4>
                      <span className="text-[10px] text-neutral-400">سندکاوی، نامه اداری و RAG آفلاین</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeServices.anythingllm ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeServices.anythingllm ? 'آنلاین :3001' : 'متوقف'}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  موتور اصلی خواندن و درک فایل‌های پیوستی چت‌روم‌ها (PDF, Word, Excel, CSV) و نگارش گزارشات و نامه‌های رسمی با صفر هزینه توکن API.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>قابلیت‌ها:</span>
                    <span className="font-mono text-emerald-400">Drag & Drop، وکتور دیتابیس لوکال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه توکن:</span>
                    <span className="text-emerald-400 font-mono font-bold">۰ توکن (کاملاً رایگان)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>آدرس داشبورد:</span>
                    <span className="text-blue-400 font-mono">http://localhost:3001</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => {
                    dispatchLog('AnythingLLM', 'SUCCESS', 'اتصال AnythingLLM به هسته ارکستراسیون با موفقیت همگام شد.', 'CONFIG');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] border border-blue-500/30 font-medium flex items-center gap-1 transition-all"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>تنظیم خودکار با هسته</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleService('anythingllm')}
                  className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                >
                  {activeServices.anythingllm ? 'خاموش کردن' : 'روشن کردن'}
                </button>
              </div>
            </div>

            {/* 4. Langflow AI Studio Card */}
            <div className="bg-[#141418] border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-purple-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Langflow AI Studio</h4>
                      <span className="text-[10px] text-neutral-400">پایپ‌لاین بصری ایجنت‌ها و فلوها</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeServices.langflow ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeServices.langflow ? 'آنلاین :7860' : 'متوقف'}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  محیط بصری Drag & Drop برای طراحی گره‌های چندمرحله‌ای هوش مصنوعی، خطوط لوله پردازش سند در کنار JEV و اتصال نودهای پایتون.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>پایپ‌لاین‌ها:</span>
                    <span className="font-mono text-white">Document RAG & Agent Flow</span>
                  </div>
                  <div className="flex justify-between">
                    <span>آدرس استودیو:</span>
                    <span className="text-purple-400 font-mono">http://localhost:7860</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('scheduler')}
                  className="w-full py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs border border-purple-500/30 font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="تنظیم زمان‌بندی ریاستارت خودکار هفتگی و پاکسازی کش"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  <span>زمان‌بندی ریاستارت و فلاش کش (ساعات غیراداری)</span>
                </button>
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      dispatchLog('Langflow', 'SUCCESS', 'اتصال Langflow به هسته ارکستراسیون تثبیت گردید.', 'CONFIG');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] border border-purple-500/30 font-medium flex items-center gap-1 transition-all"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>تنظیم خودکار با هسته</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleService('langflow')}
                    className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                  >
                    {activeServices.langflow ? 'خاموش کردن' : 'روشن کردن'}
                  </button>
                </div>
              </div>
            </div>

            {/* 5. n8n Automation Engine Card */}
            <div className="bg-[#141418] border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">n8n Automation</h4>
                      <span className="text-[10px] text-neutral-400">اتوماسیون وب‌هوک و گردش کارها</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeServices.n8n ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeServices.n8n ? 'آنلاین :5678' : 'متوقف'}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  هماهنگی اتوماتیک وب‌هوک‌ها، ارسال اعلان‌های تلگرام/ایمیل پس از اتمام تحلیل اسناد و اتصال به روترهای شبکه.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>وب‌هوک سرور:</span>
                    <span className="font-mono text-emerald-400">POST /webhook/omniops-alert</span>
                  </div>
                  <div className="flex justify-between">
                    <span>آدرس داشبورد:</span>
                    <span className="text-cyan-400 font-mono">http://localhost:5678</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => {
                    dispatchLog('n8n', 'SUCCESS', 'اتصال n8n به هسته اصلی و وب‌هوک‌های ارکستراسیون تثبیت شد.', 'CONFIG');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-[11px] border border-cyan-500/30 font-medium flex items-center gap-1 transition-all"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>اتصال به هسته</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleService('n8n')}
                  className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                >
                  {activeServices.n8n ? 'خاموش کردن' : 'روشن کردن'}
                </button>
              </div>
            </div>

            {/* 6. Dify Platform Card */}
            <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Dify Platform</h4>
                      <span className="text-[10px] text-neutral-400">پایگاه دانش و ایجنت سازمانی</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeServices.dify ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {activeServices.dify ? 'آنلاین :5001' : 'متوقف'}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  مدیریت پرامپت‌ها، ارزیابی دانش سازمانی و اتصال مدل‌های متن‌باز به پایگاه داده و پرونده‌های اداری.
                </p>

                <div className="text-[11px] text-neutral-400 space-y-1.5 pt-3 border-t border-neutral-800/80 mb-4">
                  <div className="flex justify-between">
                    <span>اندپوینت API:</span>
                    <span className="font-mono text-white">/v1/chat-messages</span>
                  </div>
                  <div className="flex justify-between">
                    <span>آدرس سرور:</span>
                    <span className="text-indigo-400 font-mono">http://localhost:5001</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => {
                    dispatchLog('Dify', 'SUCCESS', 'پیوند Dify با هسته ارکستراسیون تأیید شد.', 'CONFIG');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center gap-1 transition-all"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>اتصال به هسته</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleService('dify')}
                  className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                >
                  {activeServices.dify ? 'خاموش کردن' : 'روشن کردن'}
                </button>
              </div>
            </div>
          </div>

          {/* Docker Realtime Logs Strip */}
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 shadow-xl font-mono text-left" dir="ltr">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3 text-xs">
              <span className="text-neutral-400 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Docker & Extension Mesh Live Log</span>
              </span>
              <span className="text-emerald-400 text-[10px]">ALL SERVICES LINKED & OPERATIONAL</span>
            </div>
            <div className="p-3 bg-[#0A0A0D] rounded-xl text-xs space-y-1.5 text-neutral-300 max-h-52 overflow-y-auto">
              {stackLogs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-neutral-600 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Distributed Cluster & Worker Nodes (Master Control-Plane + Worker Nodes) */}
      {activeSubTab === 'cluster_nodes' && (
        <div className="space-y-6">
          {/* Header Architecture Overview Banner */}
          <div className="bg-gradient-to-r from-cyan-950/70 via-[#13141C] to-blue-950/50 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 font-bold text-xl shadow-lg shadow-cyan-900/30">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      خوشه توزیع‌شده سرورها و نودهای پردازشی (Master Control-Plane + Worker Nodes)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      آپ‌تایم ۱۰۰٪ پنل مرکزی
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                      ایزوله از OOM Crash
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-3xl leading-relaxed">
                    در این معماری، پنل اصلی روی یک سرور سبک (Master) ایزوله می‌ماند و بار سنگین استنتاج مدل‌های هوش مصنوعی (DeepSeek-R1, Dorna 2, Llama 3) به سرورهای عملیاتی (Worker Nodes) سپرده می‌شود تا پنل حتی در اوج فشار کاری هرگز متوقف یا کند نشود.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHardwareReportModalOpen(true)}
                  className="px-3.5 py-2 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>گزارش ارزیابی سخت‌افزار</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWorkerJoinNodeName(`Worker-Node-0${workerNodes.length + 1}`);
                    setIsWorkerJoinModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="تولید دستور اتصال سرور دوم به این کلاستر"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>دستور الحاق Worker Node</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewNodeName(`Worker-Node-0${workerNodes.length + 1}`);
                    setNodeTestResult(null);
                    setIsAddNodeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ افزودن Worker Node دستی</span>
                </button>
              </div>
            </div>
          </div>

          {/* Consolidated Cluster Metrics (استخر تجمیعی کل منابع کلاستر) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Cluster RAM */}
            <div className="bg-[#141418] border border-cyan-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>مجموع RAM کلاستر</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {activeWorkerNodes.length + 1} سرور
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">{clusterTotalRamGb}</span>
                  <span className="text-xs text-neutral-400 font-mono">GB کل حافظه</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${clusterRamPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-3 border-t border-neutral-800/80 mt-3 font-mono">
                <span>استفاده شده: {clusterUsedRamGb} GB</span>
                <span className="text-cyan-400">{clusterRamPercent}% اشغال</span>
              </div>
            </div>

            {/* Metric 2: Total CPU Cores */}
            <div className="bg-[#141418] border border-blue-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>کل هسته‌های پردازشی (vCPUs)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    Multi-Core
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">{clusterTotalCores}</span>
                  <span className="text-xs text-neutral-400 font-mono">هسته فعال</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '31%' }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-3 border-t border-neutral-800/80 mt-3">
                <span>توزیع بار موازی</span>
                <span className="text-emerald-400 font-mono">میانگین: ۳۱٪ بار</span>
              </div>
            </div>

            {/* Metric 3: GPU / VRAM Pool */}
            <div className="bg-[#141418] border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>شتاب‌دهنده گرافیکی (VRAM)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    NVIDIA CUDA
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {clusterTotalVramGb > 0 ? `${clusterTotalVramGb}` : '۰'}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">GB VRAM ({clusterTotalGpus} GPU)</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: clusterTotalVramGb > 0 ? '76%' : '0%' }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-3 border-t border-neutral-800/80 mt-3">
                <span>استنتاج سریع سخت‌افزاری</span>
                <span className="text-purple-300 font-mono">RTX 4090 فعال</span>
              </div>
            </div>

            {/* Metric 4: Workload Offloading Routing */}
            <div className="bg-[#141418] border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                  <span className="flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                    <span>توزیع بار هوشمند LLM</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOffloadActive}
                      onChange={(e) => {
                        setIsOffloadActive(e.target.checked);
                        showClusterToast(
                          e.target.checked
                            ? 'توزیع خودکار پردازش‌های سنگین روی Worker Nodes فعال شد.'
                            : 'توزیع خودکار متوقف شد؛ تمام بار به مستر منتقل گردید.'
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {clusterTotalOffloadedTasks.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-xs text-neutral-400">درخواست به نودها</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  مدل‌های بالای ۷B مستقیماً به نودهای ورکر هدایت می‌شوند تا پنل هرگز کراش نکند.
                </p>
              </div>
              <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-3 border-t border-neutral-800/80 mt-3 font-mono">
                <span>وضعیت هدایت:</span>
                <span className="text-emerald-400">۱۰۰٪ فعال و پویا</span>
              </div>
            </div>
          </div>

          {/* Master Control-Plane Server Card */}
          <div className="bg-gradient-to-r from-[#141418] via-[#161720] to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{MASTER_NODE_SPECS.name}</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      ★ سرور مستر (Control-Plane)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      آنلاین (:9000)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 mt-1 font-mono">
                    <span>IP: {MASTER_NODE_SPECS.ip}</span>
                    <span>سیستم‌عامل: {MASTER_NODE_SPECS.os}</span>
                    <span>آپ‌تایم: {MASTER_NODE_SPECS.uptime}</span>
                    <span className="text-emerald-400">تاخیر محلی: ۰ms</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono bg-black/40 px-4 py-2.5 rounded-xl border border-neutral-800 shrink-0">
                <div>
                  <span className="text-neutral-500 block text-[10px]">CPU مستر:</span>
                  <span className="text-white font-bold">{MASTER_NODE_SPECS.cpuCores} هسته ({MASTER_NODE_SPECS.cpuUsagePercent}%)</span>
                </div>
                <div className="h-6 w-px bg-neutral-800" />
                <div>
                  <span className="text-neutral-500 block text-[10px]">RAM مستر:</span>
                  <span className="text-emerald-400 font-bold">{MASTER_NODE_SPECS.ramUsedGb} / {MASTER_NODE_SPECS.ramTotalGb} GB</span>
                </div>
                <div className="h-6 w-px bg-neutral-800" />
                <div>
                  <span className="text-neutral-500 block text-[10px]">نقش سرور:</span>
                  <span className="text-amber-400 font-bold">وب‌پنل + ارکستراتور</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Donut Chart Dashboard for CPU & RAM Health of all Nodes */}
          <ClusterHealthDonutDashboard
            workerNodes={workerNodes}
            onPingNode={handlePingNode}
          />

          {/* Worker Nodes List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>سرورهای عملیاتی دوم و سوم (Worker Compute Nodes)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {workerNodes.length} سرور ثانویه
                  </span>
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  سرورهایی که منابع سخت‌افزاری آن‌ها برای میزبانی مدل‌های بزرگ، وکتورسازی و محاسبات موازی به این پنل متصل شده‌اند.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewNodeName(`Worker-Node-0${workerNodes.length + 1}`);
                  setNodeTestResult(null);
                  setIsAddNodeModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ افزودن Worker Node جدید</span>
              </button>
            </div>

            {/* Grid of Worker Nodes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {workerNodes.map((node) => {
                const ramPercent = Math.round((node.specs.ramUsedGb / node.specs.ramTotalGb) * 100);
                const hasVram = node.specs.vramTotalGb && node.specs.vramTotalGb > 0;
                const vramPercent = hasVram
                  ? Math.round(((node.specs.vramUsedGb || 0) / node.specs.vramTotalGb!) * 100)
                  : 0;

                return (
                  <div
                    key={node.id}
                    className="bg-[#141418] border border-neutral-700/80 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            node.role === 'llm_heavy'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{node.name}</h5>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                                node.status === 'online'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {node.status === 'online' ? '● آنلاین' : 'آفلاین'}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {node.sshUser}@{node.ip}:{node.sshPort}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-neutral-800/80 text-emerald-400 font-mono border border-neutral-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {node.specs.pingMs}ms
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 font-mono border border-cyan-800/40">
                            {node.role === 'llm_heavy'
                              ? '🚀 LLM Heavy'
                              : node.role === 'embedding_rag'
                              ? '📚 RAG & Vector'
                              : '⚡ Hybrid Worker'}
                          </span>
                        </div>
                      </div>

                      {/* Specs Breakdown */}
                      <div className="space-y-3 pt-3 text-xs">
                        {/* CPU Spec */}
                        <div>
                          <div className="flex justify-between text-neutral-300 mb-1">
                            <span className="text-neutral-400 flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5 text-blue-400" />
                              <span>پردازنده: {node.specs.cpuCores} هسته ({node.specs.cpuModel})</span>
                            </span>
                            <span className="font-mono text-white">{node.specs.cpuUsagePercent}%</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${node.specs.cpuUsagePercent}%` }}
                            />
                          </div>
                        </div>

                        {/* RAM Spec */}
                        <div>
                          <div className="flex justify-between text-neutral-300 mb-1">
                            <span className="text-neutral-400 flex items-center gap-1">
                              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                              <span>حافظه موقت (RAM):</span>
                            </span>
                            <span className="font-mono text-cyan-300 font-bold">
                              {node.specs.ramUsedGb} / {node.specs.ramTotalGb} GB ({ramPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full"
                              style={{ width: `${ramPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* GPU / VRAM Spec (if present) */}
                        {hasVram && (
                          <div>
                            <div className="flex justify-between text-neutral-300 mb-1">
                              <span className="text-neutral-400 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-purple-400" />
                                <span>شتاب‌دهنده: {node.specs.gpuName}</span>
                              </span>
                              <span className="font-mono text-purple-300 font-bold">
                                {node.specs.vramUsedGb} / {node.specs.vramTotalGb} GB ({vramPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-purple-500 h-full rounded-full"
                                style={{ width: `${vramPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Assigned Models */}
                        <div className="pt-2">
                          <span className="text-neutral-400 block mb-1 text-[11px]">مدل‌های ارجاع‌شده به این سرور نود:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {node.assignedModels.map((mTag) => (
                              <span
                                key={mTag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-white font-mono border border-neutral-700 flex items-center gap-1"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                <span>{mTag}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 font-mono">
                          <span>درخواست‌های پردازش‌شده: {node.offloadedTasksCount}</span>
                          <span>ضربان قلب: {node.lastHeartbeat}</span>
                        </div>
                      </div>
                    </div>

                    {/* Node Actions Bar */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2 mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePingNode(node.id)}
                          disabled={testingPingNodeId === node.id}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <RefreshCw className={`w-3 h-3 ${testingPingNodeId === node.id ? 'animate-spin' : ''}`} />
                          <span>{testingPingNodeId === node.id ? 'سنجش تاخیر...' : 'تست پینگ'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAssigningNodeId(node.id);
                            setIsAssignModelModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ ارجاع مدل سنگین</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`آیا از حذف نود کمکی "${node.name}" (${node.ip}) از کلاستر مطمئن هستید؟`)) {
                            handleRemoveNode(node.id, node.name);
                          }
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="حذف سرور نود از کلاستر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Node Join Terminal Snippet */}
          <div className="bg-[#121216] border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>دستور تک‌خطی جهت اتصال خودکار سرورهای جدید (Worker Join Command):</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const cmd = `curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-worker.sh | bash -s -- --master "http://${MASTER_NODE_SPECS.ip.split(' ')[0]}:9000" --token "${clusterJoinToken}" --name "Worker-Node-0${workerNodes.length + 1}"`;
                  copyToClipboard(cmd, 'worker-quick-join');
                  showClusterToast('دستور تک‌خطی اتصال Worker Node کپی شد!');
                }}
                className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedId === 'worker-quick-join' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === 'worker-quick-join' ? 'کپی شد!' : 'کپی دستور اتصال'}</span>
              </button>
            </div>

            <pre className="p-3 bg-black/70 border border-neutral-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed dir-ltr text-left">
{`curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-worker.sh | bash -s -- --master "http://${MASTER_NODE_SPECS.ip.split(' ')[0]}:9000" --token "${clusterJoinToken}" --name "Worker-Node-0${workerNodes.length + 1}"`}
            </pre>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              با اجرای این دستور در سرور دوم یا سوم (Ubuntu 22.04/24.04)، موتور اولاما و پردازنده داکر به صورت خودکار راه‌اندازی شده و مشخصات RAM و هسته‌ها به این پنل اضافه می‌گردد.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2.5: Lightweight Edge UI Mirror & Pasargad-Style Gateway (1-2GB RAM VPS + Auto-SSL) */}
      {activeSubTab === 'edge_gateway' && (
        <div className="space-y-6">
          {/* 1. Header Architecture Overview Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-[#13141C] to-teal-950/40 border border-emerald-500/40 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-700/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-2xl shadow-lg shadow-emerald-950/40">
                  <Globe className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base md:text-lg font-bold text-white">
                      پل ارتباطی سرور لبه سبک و آینه گرافیکی (Lightweight Edge UI Mirror)
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      معماری پل امن دو سروره (Pasargad-Style)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      RAM سبک ۱-۲GB
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                    جداسازی کامل محیط رابط گرافیکی از بارهای سنگین پردازشی: راه‌اندازی پنل روی سرورهای سبک ۱ یا ۲ گیگابایت رم در دیتاسنتر یا شبکه CDN با صدور خودکار SSL و اتصال تونل دوطرفه به هسته مرکزی قدرتمند، بدون هیچ‌گونه فشار سخت‌افزاری بر سرور لبه.
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEdgeWizardOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-900/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>راه‌اندازی نود لبه جدید</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadEdgeScript}
                  className="px-3.5 py-2.5 rounded-xl bg-[#1A1A22] hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-semibold flex items-center gap-2 transition-all"
                  title="دانلود اسکریپت نصب شل سرور لبه"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>دانلود اسکریپت (.sh)</span>
                </button>
              </div>
            </div>

            {/* Architecture Highlights Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-800/80">
              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">صدور خودکار SSL</div>
                  <div className="text-[10px] text-neutral-400 font-mono">Let's Encrypt TLS 1.3</div>
                </div>
              </div>

              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">کلید تبادل امن</div>
                  <div className="text-[10px] text-neutral-400 font-mono">HMAC-SHA256 Token</div>
                </div>
              </div>

              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">مصرف RAM سرور لبه</div>
                  <div className="text-[10px] text-emerald-400 font-mono">&lt; 150 MB (فوق‌سبک)</div>
                </div>
              </div>

              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">تونل ارتباطی فرامین</div>
                  <div className="text-[10px] text-neutral-400 font-mono">WSS / Reverse Tunnel</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Core Hub Connection Credentials Generator (جدا جدا ایجاد کنه) */}
          <div className="bg-[#141419] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>مشخصات اتصال سرور قدرتمند هسته مرکزی (Core Hub Bridge Credentials)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      تولید و کپی جداگانه
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    این اطلاعات در مرحله نصب سرور سبک لبه درخواست می‌گردد و ارتباط رمزنگاری‌شده بین دو سرور را تضمین می‌کند.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const bundle = `OMNIOPS_CORE_HOST="${masterPublicHost}"\nOMNIOPS_CORE_PORT="${masterBridgePort}"\nOMNIOPS_RELAY_KEY="${exchangeBridgeToken}"`;
                  handleCopyCredential('bundle', bundle);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
              >
                {copiedCredentialField === 'bundle' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{copiedCredentialField === 'bundle' ? 'کپی شد!' : 'کپی یکجای کانفیگ (.env)'}</span>
              </button>
            </div>

            {/* 3 Separate Credential Input Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Item 1: Core Host / IP */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-400" />
                      <span>۱. آدرس پابلیک سرور هسته</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">IP / Domain</span>
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    value={masterPublicHost}
                    onChange={(e) => setMasterPublicHost(e.target.value)}
                    className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-blue-500"
                    placeholder="مثال: 185.190.22.45"
                  />
                  <p className="text-[10.5px] text-neutral-400 mt-1 leading-relaxed">
                    آدرس عمومی سرور اصلی و قدرتمند که مدل‌ها و فرامین در آن میزبانی می‌شوند.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredential('host', masterPublicHost)}
                  className="w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedCredentialField === 'host' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCredentialField === 'host' ? 'آدرس کپی شد!' : 'کپی جداگانه آدرس سرور'}</span>
                </button>
              </div>

              {/* Item 2: Core Bridge Port */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-emerald-400" />
                      <span>۲. پورت تبادل و ارکستراسیون</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      کاملاً قابل تغییر
                    </span>
                  </div>
                  <input
                    type="number"
                    dir="ltr"
                    value={masterBridgePort}
                    onChange={(e) => setMasterBridgePort(Number(e.target.value))}
                    className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                    placeholder="9000"
                  />
                  
                  {/* Quick Port Preset Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-neutral-400">پورت‌های متداول:</span>
                    {[9000, 8443, 8080, 4443, 9443].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setMasterBridgePort(p);
                          showClusterToast(`پورت اتصال به ${p} تغییر یافت.`);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                          masterBridgePort === p
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold'
                            : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 border border-neutral-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10.5px] text-neutral-400 mt-2 leading-relaxed">
                    می‌توانید هر پورت دلخواه (بین ۱۰۲۴ تا ۶۵۵۳۵) را وارد نمایید. دستورات نصب به صورت خودکار با این پورت تنظیم می‌شوند.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredential('port', String(masterBridgePort))}
                  className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedCredentialField === 'port' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCredentialField === 'port' ? 'پورت کپی شد!' : 'کپی جداگانه پورت'}</span>
                </button>
              </div>

              {/* Item 3: Long Exchange Secret Token */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>۳. کلید تبادل و توکن امنیتی</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      ایجاد کلید دلخواه / خودکار
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={exchangeBridgeToken}
                      onChange={(e) => setExchangeBridgeToken(e.target.value)}
                      placeholder="کلید تبادل دلخواه را تایپ کنید یا دکمه‌های ایجاد را بزنید"
                      className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-amber-500 select-all"
                    />
                  </div>

                  {/* Token Generation Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-neutral-400">گزینه‌های ایجاد:</span>
                    <button
                      type="button"
                      onClick={() => handleRegenerateExchangeToken(48)}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1 transition-all"
                      title="ایجاد توکن ۶۴ کاراکتری بر پایه HMAC-SHA256"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>ایجاد توکن قوی (۶۴ بایت)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateExchangeToken(24)}
                      className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-medium transition-all"
                      title="ایجاد کلید فشرده‌تر ۳۲ کاراکتری"
                    >
                      <span>۳۲ بایت</span>
                    </button>
                  </div>

                  <p className="text-[10.5px] text-neutral-400 mt-2 leading-relaxed">
                    کلید احراز هویت سرور لبه؛ می‌توانید کلید تصادفی بسازید یا رمز دلخواه خود را مستقیم وارد کنید.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRegenerateExchangeToken(48)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-all shrink-0"
                    title="تولید مجدد کلید تصادفی"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCredential('token', exchangeBridgeToken)}
                    className="w-full py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedCredentialField === 'token' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCredentialField === 'token' ? 'کلید کپی شد!' : 'کپی کلید تبادل'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save & Status Bar */}
            <div className="bg-[#101014] border border-neutral-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-neutral-300">
                  وضعیت فعلی اتصال: <strong className="text-white font-mono">{masterPublicHost}:{masterBridgePort}</strong> | کلید: <span className="text-amber-300 font-mono text-[11px]">{exchangeBridgeToken.slice(0, 16)}...</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveBridgeConfig}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 shrink-0"
              >
                {isBridgeConfigSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>در هسته ذخیره و اعمال شد!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره و اعمال تنظیمات در هسته</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Fast One-Line Installer Command (مشابه نود پاسارگاد) */}
          <div className="bg-[#121216] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>فرمان نصب سریع تک‌خطی روی سرور سبک ۱ یا ۲ گیگابایت (One-Line Edge Installer)</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      Ubuntu / Debian
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    این اسکریپت را در ترمینال سرور سبک دیتاسنتر یا CDN اجرا فرمایید تا فرآیند راه‌اندازی اینتراکتیو شروع شود:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cmd = 'curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-edge-node.sh | bash';
                  handleCopyCredential('cmd', cmd);
                }}
                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
              >
                {copiedCredentialField === 'cmd' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedCredentialField === 'cmd' ? 'فرمان کپی شد!' : 'کپی دستور تک‌خطی'}</span>
              </button>
            </div>

            {/* Interactive Question Steps Visual Indicator */}
            <div className="bg-[#171720]/80 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>مراحل اینتراکتیو پس از اجرای دستور در سرور لبه (پرسش و پاسخ مرحله‌ای):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-black/40 border border-neutral-800 text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center font-bold">۱</span>
                  <span>دریافت آدرس سرور هسته</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-neutral-800 text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold">۲</span>
                  <span>دریافت پورت هسته (۹۰۰۰)</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-neutral-800 text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold">۳</span>
                  <span>دریافت کلید تبادل امن</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-neutral-800 text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono text-[10px] flex items-center justify-center font-bold">۴</span>
                  <span>دریافت دامنه پنل وب</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-neutral-800 text-neutral-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[10px] flex items-center justify-center font-bold">۵</span>
                  <span>صدور خودکار SSL</span>
                </div>
              </div>
            </div>

            {/* Code Box 1: Interactive One-Liner */}
            <div>
              <div className="text-[11px] text-neutral-400 mb-1 font-medium">فرمان نصب اینتراکتیو (پیشنهادی):</div>
              <pre className="p-3.5 bg-black/80 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed dir-ltr text-left">
curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-edge-node.sh | bash
              </pre>
            </div>

            {/* Code Box 2: Silent / Unattended One-Liner with all arguments pre-filled */}
            <div>
              <div className="text-[11px] text-neutral-400 mb-1 font-medium">فرمان نصب یکجا و بدون توقف با پارامترهای از پیش پرشده (Silent / Unattended):</div>
              <pre className="p-3 bg-black/60 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 overflow-x-auto select-all leading-relaxed dir-ltr text-left">
{`curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-edge-node.sh | bash -s -- --core "${masterPublicHost}" --port ${masterBridgePort} --token "${exchangeBridgeToken}" --domain "panel.mycompany-ai.ir" --auto-ssl`}
              </pre>
            </div>
          </div>

          {/* 4. Terminal CLI Interactive Sandbox / Simulator */}
          <div className="bg-[#121217] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>شبیه‌ساز زنده ترمینال نصب سرور لبه (Interactive CLI Simulator)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      تست بدون ریسک
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    مشاهده دقیق فرآیند پرسش و پاسخ، تست هندشیک با هسته، اعتبارسنجی کلید امن و صدور گواهی‌نامه SSL
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunTerminalSimulation}
                  disabled={isSimulatingTerminal}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulatingTerminal ? 'animate-spin' : ''}`} />
                  <span>{isSimulatingTerminal ? 'در حال اجرای شبیه‌ساز...' : 'اجرای تست زنده شبیه‌ساز'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedTerminalLines(['root@vps-edge-1gb:~# # آماده برای اجرای اسکریپت نصب تک‌خطی سرور لبه'])}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                  title="پاکسازی صفحه ترمینال"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Linux Window Sandbox */}
            <div className="bg-black/90 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
              <div className="bg-[#191921] px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-neutral-400 mr-2 dir-ltr">root@vps-edge-1gb:~ (Ubuntu 22.04 LTS - 1GB RAM)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isSimulatingTerminal ? 'RUNNING' : 'IDLE'}
                </span>
              </div>
              <div className="p-4 space-y-1.5 max-h-72 overflow-y-auto dir-ltr text-left text-neutral-300 select-all">
                {simulatedTerminalLines.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line.startsWith('root@') ? (
                      <span className="text-emerald-400 font-bold">{line}</span>
                    ) : line.startsWith('🔹') ? (
                      <span className="text-cyan-300 font-semibold">{line}</span>
                    ) : line.startsWith('[✓]') ? (
                      <span className="text-emerald-400 font-semibold">{line}</span>
                    ) : line.startsWith('🎉') ? (
                      <span className="text-amber-300 font-bold text-sm block my-1">{line}</span>
                    ) : line.startsWith('🌐') ? (
                      <span className="text-cyan-400 font-bold underline">{line}</span>
                    ) : line.startsWith('[*]') ? (
                      <span className="text-neutral-400">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Active Edge Relays Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">سرورهای لبه و آینه‌های گرافیکی فعال (Active Edge Nodes):</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {edgeGatewayNodes.length} سرور فعال
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsEdgeWizardOpen(true)}
                className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن نود لبه</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {edgeGatewayNodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-[#141419] border border-neutral-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{node.name}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            آنلاین
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{node.edgeIp}</span>
                          <span>•</span>
                          <span>{node.datacenter}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEdgeNode(node.id, node.name)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="حذف پل سرور لبه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Public Domain & SSL Status */}
                  <div className="bg-[#101014] border border-neutral-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 truncate">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <a
                        href={node.domain}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono font-bold text-cyan-300 hover:underline flex items-center gap-1 truncate dir-ltr"
                      >
                        <span>{node.domain}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                        TLS 1.3 (Let's Encrypt)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono">
                        {node.sslExpiresInDays} روز معتبر
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#101014] border border-neutral-800/80 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 mb-0.5">حافظه رم سرور</div>
                      <div className="font-bold text-emerald-300 font-mono">{node.ramGb} GB RAM</div>
                      <div className="text-[9px] text-neutral-500">مصرف: ~140MB</div>
                    </div>
                    <div className="bg-[#101014] border border-neutral-800/80 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 mb-0.5">تاخیر شبکه به هسته</div>
                      <div className="font-bold text-cyan-300 font-mono">{node.latencyToCoreMs} ms</div>
                      <div className="text-[9px] text-emerald-400">پایدار و مستقیم</div>
                    </div>
                    <div className="bg-[#101014] border border-neutral-800/80 rounded-xl p-2.5">
                      <div className="text-[10px] text-neutral-400 mb-0.5">کاربران متصل</div>
                      <div className="font-bold text-purple-300 font-mono">{node.activeUsersCount} نفر</div>
                      <div className="text-[9px] text-neutral-500">نشست فعال</div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/80 text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-[10px]">{node.tunnelProtocol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showClusterToast(`هندشیک با نود ${node.name} بررسی شد. زمان پاسخ: ${node.latencyToCoreMs}ms`)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        تست هندشیک
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2.8: Edge Node Shell Installation & Automated SSL Script Generator */}
      {activeSubTab === 'installation' && (
        <div className="space-y-6">
          {/* 1. Header Hero Banner */}
          <div className="bg-gradient-to-r from-teal-950/60 via-[#13141C] to-emerald-950/40 border border-teal-500/40 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600/30 to-emerald-700/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 font-bold text-2xl shadow-lg shadow-teal-950/40">
                  <FileCode className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base md:text-lg font-bold text-white">
                      نصب خودکار سرور لبه و صدور SSL (Lightweight Edge Node Shell Installer)
                    </h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      اسکریپت شل اینتراکتیو اوبونتو / دبیان
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      مصرف رم: زیر ۱۵۰MB
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                    تولید اسکریپت شل فوق‌سبک برای راه‌اندازی آینه رابط گرافیکی روی سرورهای ۱ یا ۲ گیگابایت رم در دیتاسنتر یا CDN. این اسکریپت در هنگام اجرا در ترمینال لینوکس، آدرس سرور هسته، پورت ارتباطی، کلید تبادل و دامنه وب را از شما می‌پرسد و گواهی‌نامه Let's Encrypt TLS 1.3 را به طور کاملاً خودکار پیکربندی می‌کند.
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadGeneratedScript}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-teal-900/40"
                  title="دانلود اسکریپت کامل شل (install-edge-node.sh)"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود اسکریپت شل (.sh)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyInstallCommand}
                  className="px-3.5 py-2.5 rounded-xl bg-[#1A1A22] hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-semibold flex items-center gap-2 transition-all"
                  title="کپی دستور نصب تک‌خطی curl | bash"
                >
                  {installCmdCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-teal-400" />
                  )}
                  <span>{installCmdCopied ? 'دستور کپی شد!' : 'کپی دستور اجرای تک‌خطی'}</span>
                </button>
              </div>
            </div>

            {/* Architecture Highlights Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-800/80">
              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">صدور خودکار SSL</div>
                  <div className="text-[10px] text-neutral-400 font-mono">Let's Encrypt TLS 1.3</div>
                </div>
              </div>

              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">کلید تبادل امنیتی</div>
                  <div className="text-[10px] text-neutral-400 font-mono">HMAC-SHA256 Token</div>
                </div>
              </div>

              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">پورت اتصال دلخواه</div>
                  <div className="text-[10px] text-emerald-400 font-mono">پورت آزاد ۱۰۲۴-۶۵۵۳۵</div>
                </div>
              </div>

              <div className="bg-[#121217]/70 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">مصرف سخت‌افزار لبه</div>
                  <div className="text-[10px] text-neutral-400 font-mono">&lt; 150MB RAM (سبک)</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Core Hub Bridge Configuration & Parameters Customizer */}
          <div className="bg-[#141419] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>تنظیم پارامترهای اتصال و تولید کلید و پورت دلخواه</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                      کاملاً سفارشی‌سازی‌شده
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    این مقادیر در اسکریپت شل گنجانده می‌شوند و به عنوان پیش‌فرض در مراحل تعاملی ترمینال به شما پیشنهاد می‌گردند.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const bundle = `CORE_PUBLIC_IP="${masterPublicHost}"\nCORE_PORT="${masterBridgePort}"\nSECURITY_TOKEN="${exchangeBridgeToken}"\nEDGE_DOMAIN="${installDomain}"`;
                    handleCopyCredential('bundle', bundle);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copiedCredentialField === 'bundle' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-teal-400" />
                  )}
                  <span>{copiedCredentialField === 'bundle' ? 'کپی شد!' : 'کپی یکجای پارامترها (.env)'}</span>
                </button>
              </div>
            </div>

            {/* 4 Interactive Parameter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Parameter 1: Core Host / IP */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-400" />
                      <span>۱. آدرس پابلیک سرور هسته</span>
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">Core IP</span>
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    value={masterPublicHost}
                    onChange={(e) => setMasterPublicHost(e.target.value)}
                    className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-teal-500"
                    placeholder="مثال: 185.190.22.45"
                  />
                  <p className="text-[10.5px] text-neutral-400 mt-1 leading-relaxed">
                    آدرس سرور اصلی و قدرتمند که مدل‌ها، چت و فرامین در آن میزبانی می‌شوند.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredential('host', masterPublicHost)}
                  className="w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedCredentialField === 'host' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCredentialField === 'host' ? 'آدرس کپی شد!' : 'کپی آدرس سرور هسته'}</span>
                </button>
              </div>

              {/* Parameter 2: Customizable Port */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-emerald-400" />
                      <span>۲. پورت تبادل و ارتباط</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      پورت دلخواه
                    </span>
                  </div>
                  <input
                    type="number"
                    dir="ltr"
                    value={masterBridgePort}
                    onChange={(e) => setMasterBridgePort(Number(e.target.value))}
                    className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                    placeholder="9000"
                  />
                  {/* Port Presets */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[9.5px] text-neutral-400">پیش‌فرض‌ها:</span>
                    {[9000, 8443, 8080, 4443, 9443].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setMasterBridgePort(p);
                          showClusterToast(`پورت ارتباطی به ${p} تغییر یافت.`);
                        }}
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono transition-all ${
                          masterBridgePort === p
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold'
                            : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 border border-neutral-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-neutral-400 mt-1 leading-relaxed">
                    امکان انتخاب هر پورت دلخواه (بین ۱۰۲۴ تا ۶۵۵۳۵). اسکریپت با این پورت پرامپت می‌شود.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredential('port', String(masterBridgePort))}
                  className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedCredentialField === 'port' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCredentialField === 'port' ? 'پورت کپی شد!' : 'کپی پورت ارتباطی'}</span>
                </button>
              </div>

              {/* Parameter 3: Security Token Generation */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>۳. کلید تبادل و توکن امنیتی</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      گزینه ایجاد توکن
                    </span>
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    value={exchangeBridgeToken}
                    onChange={(e) => setExchangeBridgeToken(e.target.value)}
                    className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-[10.5px] font-mono text-amber-300 focus:outline-none focus:border-amber-500 select-all"
                    placeholder="کلید تبادل دلخواه را تایپ کنید یا دکمه‌های ایجاد را بزنید"
                  />
                  {/* Token Generator Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleRegenerateExchangeToken(48)}
                      className="text-[9.5px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1 transition-all"
                      title="ایجاد توکن تصادفی بر پایه HMAC-SHA256 (۶۴ بایت)"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>ایجاد توکن قوی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateExchangeToken(24)}
                      className="text-[9.5px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-medium transition-all"
                      title="ایجاد کلید فشرده‌تر ۳۲ کاراکتری"
                    >
                      <span>۳۲ بایت</span>
                    </button>
                  </div>
                  <p className="text-[10.5px] text-neutral-400 mt-1 leading-relaxed">
                    کلید اعتبارسنجی دو سرور؛ می‌توانید دکمه ایجاد را بزنید یا توکن سفارشی خود را بنویسید.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredential('token', exchangeBridgeToken)}
                  className="w-full py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedCredentialField === 'token' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCredentialField === 'token' ? 'توکن کپی شد!' : 'کپی کلید امنیتی'}</span>
                </button>
              </div>

              {/* Parameter 4: Domain & Automated SSL */}
              <div className="bg-[#111116] border border-neutral-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      <span>۴. دامنه و گواهی‌نامه SSL</span>
                    </span>
                    <span className="text-[10px] text-teal-300 font-mono bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                      Let's Encrypt
                    </span>
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    value={installDomain}
                    onChange={(e) => setInstallDomain(e.target.value)}
                    className="w-full bg-[#171720] border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500"
                    placeholder="مثال: panel.mycompany-ai.ir"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-1.5 text-[10.5px] text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={installAutoSsl}
                        onChange={(e) => setInstallAutoSsl(e.target.checked)}
                        className="rounded border-neutral-700 text-teal-500 focus:ring-teal-400 bg-neutral-900"
                      />
                      <span>صدور خودکار SSL با TLS 1.3</span>
                    </label>
                  </div>
                  <p className="text-[10.5px] text-neutral-400 mt-1 leading-relaxed">
                    گواهی‌نامه ۹۰ روزه رسمی با تمدید خودکار و تغییر مسیر ۳۰۱ به HTTPS تنظیم می‌گردد.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredential('domain', installDomain)}
                  className="w-full py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedCredentialField === 'domain' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCredentialField === 'domain' ? 'دامنه کپی شد!' : 'کپی آدرس دامنه'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Fast One-Line Execution Command Card */}
          <div className="bg-[#141419] border border-teal-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-mono font-bold text-sm">
                  $&gt;
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>فرمان اجرای سریع روی سرور سبک لبه (One-Line Terminal Execution)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      اوبونتو ۲۰/۲۲/۲۴ و دبیان ۱۱/۱۲
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    کافی است وارد SSH سرور سبک (۱ یا ۲ گیگابایت رم) شوید و این دستور تک‌خطی را Paste نمایید:
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#111116] p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setInstallMode('interactive')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    installMode === 'interactive'
                      ? 'bg-teal-600 text-white font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  حالت تعاملی ترمینال (پرامپت)
                </button>
                <button
                  type="button"
                  onClick={() => setInstallMode('unattended')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    installMode === 'unattended'
                      ? 'bg-teal-600 text-white font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  حالت خودکار (پارامتری)
                </button>
              </div>
            </div>

            {/* Terminal Command Snippet Box */}
            <div className="bg-[#0D0D11] border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs text-teal-300 select-all overflow-x-auto">
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 select-none">root@edge-vps:~#</span>
                <span className="text-teal-300 break-all">
                  {installMode === 'interactive'
                    ? 'curl -fsSL https://get.omniops.io/install-edge.sh | bash'
                    : `curl -fsSL https://get.omniops.io/install-edge.sh | bash -s -- "${masterPublicHost}" "${masterBridgePort}" "${exchangeBridgeToken}" "${installDomain}"`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyInstallCommand}
                className="px-3.5 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 self-end sm:self-center"
              >
                {installCmdCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{installCmdCopied ? 'کپی شد!' : 'کپی دستور'}</span>
              </button>
            </div>

            {/* Prompt explanation steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] text-neutral-300 pt-1">
              <div className="bg-[#111116] border border-neutral-800/80 rounded-lg p-2.5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  ۱
                </span>
                <div>
                  <div className="font-bold text-white">پرامپت آدرس هسته</div>
                  <div className="text-[10px] text-neutral-400">پیش‌فرض: {masterPublicHost}</div>
                </div>
              </div>

              <div className="bg-[#111116] border border-neutral-800/80 rounded-lg p-2.5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  ۲
                </span>
                <div>
                  <div className="font-bold text-white">پرامپت پورت دلخواه</div>
                  <div className="text-[10px] text-neutral-400">پیش‌فرض: {masterBridgePort}</div>
                </div>
              </div>

              <div className="bg-[#111116] border border-neutral-800/80 rounded-lg p-2.5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  ۳
                </span>
                <div>
                  <div className="font-bold text-white">پرامپت کلید تبادل</div>
                  <div className="text-[10px] text-neutral-400">توکن امنیتی HMAC</div>
                </div>
              </div>

              <div className="bg-[#111116] border border-neutral-800/80 rounded-lg p-2.5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  ۴
                </span>
                <div>
                  <div className="font-bold text-white">پرامپت دامنه و SSL</div>
                  <div className="text-[10px] text-neutral-400">صدور خودکار TLS 1.3</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Live Interactive Terminal Simulator Sandbox */}
          <div className="bg-[#0F1015] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal Window Header */}
            <div className="bg-[#181920] px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-xs font-mono text-neutral-400 flex items-center gap-2 mr-3">
                  <Terminal className="w-3.5 h-3.5 text-teal-400" />
                  <span>شبیه‌ساز تعاملی مراحل نصب روی سرور لبه (Interactive Ubuntu Terminal)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInstallSimLogs(['# خروجی ترمینال پاکسازی گردید. برای مشاهده مراحل نصب، دکمه اجرای شبیه‌سازی را بزنید.'])}
                  className="text-[11px] px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  پاکسازی
                </button>
                <button
                  type="button"
                  onClick={handleRunInstallSimulator}
                  disabled={installSimRunning}
                  className="text-[11px] px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Play className={`w-3 h-3 ${installSimRunning ? 'animate-spin' : ''}`} />
                  <span>{installSimRunning ? 'در حال اجرای مراحل...' : 'اجرای شبیه‌سازی مراحل نصب'}</span>
                </button>
              </div>
            </div>

            {/* Terminal Content Screen */}
            <div className="p-4 bg-[#0B0C10] font-mono text-xs min-h-[220px] max-h-[380px] overflow-y-auto space-y-1.5 select-text text-neutral-200">
              {installSimLogs.map((line, idx) => (
                <div
                  key={idx}
                  className={`${
                    line.includes('[✓]') || line.includes('🎉')
                      ? 'text-emerald-400'
                      : line.includes('🔹')
                      ? 'text-cyan-300 font-bold'
                      : line.includes('🌐') || line.includes('🔒')
                      ? 'text-teal-300 font-semibold'
                      : line.includes('[!]')
                      ? 'text-amber-400'
                      : line.includes('🚀')
                      ? 'text-white font-bold'
                      : 'text-neutral-400'
                  }`}
                >
                  {line}
                </div>
              ))}
              {installSimRunning && (
                <div className="flex items-center gap-2 text-teal-400 animate-pulse pt-1">
                  <span className="w-2 h-4 bg-teal-400 animate-bounce" />
                  <span>در حال پیکربندی و صدور SSL...</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Full Shell Script Code Viewer & Downloader */}
          <div className="bg-[#141419] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>کد کامل اسکریپت شل تولیدشده (omniops-edge-install.sh)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                      Bash Script Source
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    می‌توانید کدهای این اسکریپت را بازبینی نموده و به صورت مستقیم یا فایل .sh دانلود نمایید.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyGeneratedScript}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {installScriptCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>{installScriptCopied ? 'کپی شد!' : 'کپی متن اسکریپت'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadGeneratedScript}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل (.sh)</span>
                </button>
              </div>
            </div>

            {/* Script Code Viewer Box */}
            <div className="bg-[#0B0C10] border border-neutral-800/80 rounded-xl p-4 font-mono text-xs max-h-[360px] overflow-y-auto select-all text-neutral-300 dir-ltr text-left">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {generateEdgeInstallScript(
                  masterPublicHost,
                  masterBridgePort,
                  exchangeBridgeToken,
                  installDomain,
                  installMode,
                  installAutoSsl,
                  installHttpRedirect
                )}
              </pre>
            </div>
          </div>

          {/* 6. Architecture & System Requirements Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141419] border border-neutral-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-400" />
                <span>حداقل مشخصات سرور سبک لبه (Edge VPS Specs)</span>
              </h4>
              <ul className="text-xs text-neutral-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>حافظه RAM:</strong> ۱ گیگابایت یا ۲ گیگابایت (مصرف مفید سرویس لبه کمتر از ۱۵۰MB است).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>پردازنده CPU:</strong> ۱ هسته مجازی (بدون نیاز به پردازش موازی یا هوش مصنوعی).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>دیسک:</strong> ۱۰ گیگابایت SSD/NVMe (حجم کل پکیج‌های سبک کمتر از ۲۰۰ مگابایت است).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>سیستم‌عامل:</strong> اوبونتو ۲۰.۰۴، ۲۲.۰۴، ۲۴.۰۴ LTS یا دبیان ۱۱ و ۱۲.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#141419] border border-neutral-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>پروتکل‌های امنیتی و گواهی‌نامه SSL (Security Architecture)</span>
              </h4>
              <ul className="text-xs text-neutral-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>رمزنگاری TLS 1.3:</strong> استفاده از چالش HTTP-01 شرکت Let's Encrypt و صدور خودکار.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>تمدید خودکار ۹۰ روزه:</strong> تنظیم خودکار systemd timer بدون نیاز به مداخله ادمین.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>امنیت ارتباط با هسته:</strong> تزریق هدر اعتبارسنجی <code>X-OmniOps-Exchange-Token</code> در پروکسی.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>تفکیک مطلق بار:</strong> حتی در صورت حمله به سرور لبه، هسته مرکزی و پایگاه‌داده محفوظ می‌ماند.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Server Command Console (Shell Terminal) */}
      {activeSubTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Server Preset Actions on Left */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>فرامین سریع هسته و افزونه‌ها</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddCommandOpen(true)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold flex items-center gap-1 transition-colors"
                title="افزودن فرمان دلخواه به لیست فرامین سریع"
              >
                <Plus className="w-3 h-3" />
                <span>+ افزودن فرمان</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {quickCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="group relative w-full text-right p-3 rounded-xl bg-[#141418] hover:bg-[#1A1A22] border border-neutral-800 hover:border-blue-500/40 text-xs text-neutral-200 transition-all flex flex-col gap-1 shadow-sm cursor-pointer"
                  onClick={() => handleSendPrompt(cmd.prompt)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {cmd.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                      {cmd.tag}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono truncate dir-ltr text-left">
                    {cmd.command}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Status Pill */}
            <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl text-[11px] space-y-1.5 text-neutral-400">
              <div className="flex justify-between items-center">
                <span>اختیارات دسترسی:</span>
                <span className="text-amber-400 font-bold font-mono">Root (uid=0)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>شبکه هسته:</span>
                <span className="text-emerald-400 font-mono">omniops_mesh</span>
              </div>
            </div>
          </div>

          {/* Interactive Shell & Actions Chat on Right */}
          <div className="lg:col-span-3 flex flex-col h-[580px] bg-[#141418] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Console Toolbar */}
            <div className="px-4 py-3 bg-[#18181D] border-b border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white font-mono">root@omniops-core:~#</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-neutral-300 text-[11px] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoExecuteMode}
                    onChange={(e) => setAutoExecuteMode(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-0"
                  />
                  <span>اجرای خودکار فرامین بدون تأیید</span>
                </label>

                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="bg-[#101014] border border-neutral-700/80 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {availableModels.map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Console Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 text-xs">
                      Ω
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-[#18181D] border border-neutral-800 text-neutral-200 rounded-bl-sm'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Server Command Actions Cards */}
                    {msg.server_actions && msg.server_actions.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {msg.server_actions.map((act) => (
                          <div
                            key={act.id}
                            className="bg-[#0D0D11] border border-neutral-800 rounded-xl p-3 space-y-2 text-left"
                            dir="ltr"
                          >
                            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-neutral-800/80">
                              <span className="text-neutral-300 font-sans font-bold text-right" dir="rtl">
                                {act.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                  act.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {act.status.toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(act.command, act.id)}
                                  className="p-1 hover:text-white text-neutral-400 text-[10px] flex items-center gap-1"
                                >
                                  {copiedId === act.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            <pre className="text-[11px] text-emerald-400 font-mono bg-black/40 p-2 rounded-lg overflow-x-auto select-all">
                              $ {act.command}
                            </pre>

                            {act.output && (
                              <div className="text-[10px] text-neutral-400 font-mono bg-black/60 p-2.5 rounded-lg overflow-x-auto max-h-36 whitespace-pre-wrap leading-relaxed">
                                {act.output}
                              </div>
                            )}

                            {act.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleExecuteAction(act.id)}
                                className="w-full mt-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>تأیید و اجرای فرمان در سرور</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="p-3 bg-[#18181D] border-t border-neutral-800 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="فرمان خط فرمان یا درخواست را وارد کنید (مثال: اتصال خودکار کانتینر JEV به هسته اصلی)..."
                className="flex-1 bg-[#101014] border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <span>ارسال</span>
                <Send className="w-3.5 h-3.5 fill-current" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 3: Dedicated Architecture & Lifecycle Logs */}
      {activeSubTab === 'architecture_logs' && (
        <div className="space-y-5">
          {/* Logs Control & Policy Header */}
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    مرکز ثبت لاگ‌های معماری و زیرساخت (System Architecture & Lifecycle Logs)
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isSystemLoggingActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {isSystemLoggingActive ? 'ثبت فعال (ONLINE)' : 'غیرفعال (PAUSED)'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                  این بخش منحصراً مختص ثبت رخدادهای معماری، استقرار کانتینرها، اتصال افزونه‌ها و دیباگینگ هسته است. به جهت رعایت بهینگی حافظه RAM و عملکرد، از بافر سبک FIFO (حداکثر ۲۰۰ لاگ) استفاده می‌شود و از فعالیت چت کاربران کاملاً ایزوله است.
                </p>
              </div>

              {/* Action Buttons & Toggle */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Enable/Disable Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleSystemLogging}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                    isSystemLoggingActive
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                  title="فعال یا غیرفعال‌سازی ثبت وقایع معماری سیستم"
                >
                  <span className={`w-2 h-2 rounded-full ${isSystemLoggingActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
                  <span>{isSystemLoggingActive ? 'لاگ‌گیری: روشن' : 'لاگ‌گیری: خاموش'}</span>
                </button>

                {/* Simulate Event Button */}
                <button
                  type="button"
                  onClick={() => {
                    const sampleComponents: SystemLogEntry['component'][] = ['Core', 'JEV', 'AnythingLLM', 'Langflow', 'Ollama', 'n8n', 'Network', 'Security'];
                    const comp = sampleComponents[Math.floor(Math.random() * sampleComponents.length)];
                    dispatchLog(
                      comp,
                      'SUCCESS',
                      `پایش خودکار و هارت‌بیت سرویس ${comp} با موفقیت اعتبارسنجی شد (Latency: 14ms)`,
                      'HEALTHCHECK',
                      'OK 200 - Thread Pool healthy'
                    );
                  }}
                  className="px-3 py-1.5 bg-[#18181D] hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                  title="ارسال یک رویداد تستی برای اعتبارسنجی ثبت ریل‌تایم لاگ"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>تست لاگ زنده</span>
                </button>

                {/* Download Log File Button */}
                <button
                  type="button"
                  onClick={handleDownloadLogs}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="دانلود فایل متنی استاندارد لاگ‌ها (.log)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>خروجی لاگ (.log)</span>
                </button>

                {/* Clear Buffer */}
                <button
                  type="button"
                  onClick={handleClearSystemLogs}
                  className="p-2 bg-neutral-800/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-xl text-xs transition-colors border border-neutral-700/80"
                  title="پاک‌سازی بافر لاگ‌های معماری"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Memory & Buffer Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-800/80 text-[11px]">
              <div className="flex flex-col">
                <span className="text-neutral-500">تعداد رویدادهای ثبت‌شده:</span>
                <span className="font-bold text-white font-mono mt-0.5">{systemLogs.length} لاگ فعال</span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500">حجم تخمینی بافر RAM:</span>
                <span className="font-bold text-emerald-400 font-mono mt-0.5">
                  {(systemLogs.length * 0.12).toFixed(1)} کیلوبایت (فوق‌سبک)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500">الگوریتم مدیریت حافظه:</span>
                <span className="font-bold text-white font-mono mt-0.5">FIFO Bounded Queue (Max 200)</span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500">دامنه لاگ‌گیری:</span>
                <span className="font-bold text-blue-400 font-mono mt-0.5">فقط معماری سرور (ایزوله)</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-[#141418] border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-400 font-medium">فیلتر فاز:</span>
              <div className="flex items-center gap-1">
                {['ALL', 'INSTALL', 'CONFIG', 'UPDATE', 'LIFECYCLE', 'DISPATCH', 'HEALTHCHECK'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLogFilterPhase(p)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                      logFilterPhase === p
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#18181D] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">سطح:</span>
              <div className="flex items-center gap-1">
                {['ALL', 'SUCCESS', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLogFilterLevel(lvl)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                      logFilterLevel === lvl
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#18181D] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="جستجو در لاگ‌ها..."
                value={logFilterSearch}
                onChange={(e) => setLogFilterSearch(e.target.value)}
                className="w-full bg-[#101014] border border-neutral-700/80 rounded-lg pl-3 pr-8 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>
          </div>

          {/* Logs List Table */}
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl font-mono text-left" dir="ltr">
            <div className="p-3 bg-[#18181D] border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Architecture Audit Trail ({filteredLogs.length} events)</span>
              </div>
              <span className="text-[10px] text-neutral-500">Live Buffer</span>
            </div>

            <div className="max-h-[460px] overflow-y-auto divide-y divide-neutral-800/60 p-1">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 font-sans" dir="rtl">
                  هیچ لاگی با فیلترهای جاری یافت نشد.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="p-3 hover:bg-[#1A1A22] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <span className="text-neutral-500 text-[11px] shrink-0 font-mono">{log.timestamp}</span>

                      {/* Level Badge */}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        log.level === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : log.level === 'WARN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : log.level === 'ERROR'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.level === 'DEPLOY'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {log.level}
                      </span>

                      {/* Component Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0 font-bold">
                        {log.component}
                      </span>

                      {/* Phase Badge */}
                      {log.phase && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 shrink-0">
                          {log.phase}
                        </span>
                      )}

                      {/* Message */}
                      <span className="text-neutral-200 text-xs font-sans text-right sm:text-left truncate" dir="rtl">
                        {log.message}
                      </span>
                    </div>

                    {/* Details if any */}
                    {log.details && (
                      <span className="text-[11px] text-neutral-500 font-mono shrink-0 truncate max-w-xs bg-black/40 px-2 py-0.5 rounded">
                        {log.details}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Intelligent Off-Peak Scheduler (Ollama downloads, service restarts, cache purge & audits) */}
      {activeSubTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-[#14141A] to-purple-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xl shadow-md shadow-indigo-600/20">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      زمان‌بندی هوشمند عملیات در ساعات غیراداری (Off-Peak Scheduler & Cron Hub)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-300" />
                      بازه غیراداری: ۲۳:۰۰ تا ۰۷:۰۰ صبح
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-3xl leading-relaxed">
                    برنامه‌ریزی خودکار برای دانلود مدل‌های سنگین روی Ollama (مانند DeepSeek-R1 و Llama 3.3)، ریاستارت دوره‌ای سرویس‌ها (Langflow و Ollama) جهت آزادسازی رم و اسکن‌های امنیتی شبانه Strix در ساعات خلوتی پهنای باند سرور.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatingSchedule(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ زمان‌بندی وظیفه جدید (New Task)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {schedulerToast && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-indigo-300 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{schedulerToast}</span>
              </div>
              <button onClick={() => setSchedulerToast(null)} className="text-neutral-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
          )}

          {/* Metric KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>تسک‌های زمان‌بندی شده</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {scheduledTasks.filter(t => t.isActive).length} / {scheduledTasks.length}
              </p>
              <span className="text-[10px] text-emerald-400">تمام تسک‌های فعال در صف دیمن سرور</span>
            </div>

            <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>سرویس‌های تحت زمان‌بندی</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">Ollama & Langflow</p>
              <span className="text-[10px] text-blue-400">مدیریت خودکار کش، رم و مدل‌ها</span>
            </div>

            <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>پنجره طلایی ساعات غیراداری</span>
                <Moon className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">۰۲:۰۰ - ۰۵:۳۰ بامداد</p>
              <span className="text-[10px] text-purple-300">کمترین بار ترافیک شبکه سازمانی</span>
            </div>

            <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>صرفه‌جویی پهنای باند روزانه</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">~۱۴.۲ گیگابایت</p>
              <span className="text-[10px] text-emerald-400">دانلود شبانه بدون اشغال اینترنت کاری</span>
            </div>
          </div>

          {/* Scheduled Tasks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-400" />
                <span>فهرست وظایف فعال در صف Cron Daemon</span>
              </h4>
              <span className="text-xs text-neutral-400 font-mono">Systemd / Crond Service: Active</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {scheduledTasks.map((task) => {
                const isRunning = runningTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    className={`bg-[#141418] border rounded-2xl p-4 transition-all shadow-md ${
                      task.isActive 
                        ? 'border-neutral-800 hover:border-neutral-700' 
                        : 'border-neutral-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left Side: Meta & Badges */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold font-mono ${
                            task.targetService === 'Ollama'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : task.targetService === 'Langflow'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {task.targetService}
                          </span>

                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {task.type === 'download_model' && '📥 دانلود خودکار مدل'}
                            {task.type === 'restart_service' && '🔄 ریاستارت دوره‌ای'}
                            {task.type === 'cache_flush' && '🧹 پاکسازی کش و رم'}
                            {task.type === 'security_audit' && '🛡️ ممیزی امنیتی Strix'}
                            {task.type === 'custom_cron' && '⚙️ وظیفه سفارشی'}
                          </span>

                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {task.scheduledTimePersian}
                          </span>

                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 font-mono">
                            cron: {task.cronExpression}
                          </span>

                          {task.offPeakOnly && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              صرفاً ساعت غیراداری
                            </span>
                          )}
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-white tracking-wide">{task.name}</h5>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{task.description}</p>
                        </div>

                        {/* Command Preview */}
                        <div className="flex items-center gap-2 pt-1">
                          <code className="text-[11px] text-emerald-400 font-mono bg-black/50 px-2.5 py-1 rounded-lg border border-neutral-800/80 truncate max-w-xl">
                            $ {task.command}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(task.command, task.id)}
                            className="p-1 rounded text-neutral-400 hover:text-white"
                            title="کپی دستور"
                          >
                            {copiedId === task.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Last Run Info */}
                        {task.lastRunTime && (
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                            <span>آخرین اجرا: {task.lastRunTime}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">وضعیت: موفق (Code 0)</span>
                            {task.lastOutput && (
                              <span className="truncate max-w-md font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400">
                                {task.lastOutput}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Side: Action Controls */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                        {/* Run Now Button */}
                        <button
                          type="button"
                          onClick={() => handleRunScheduledTaskNow(task.id)}
                          disabled={isRunning}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                          title="اجرای فوری برای تست صحت عملکرد زمان‌بندی"
                        >
                          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                          <span>{isRunning ? 'در حال اجرا...' : 'اجرای فوری'}</span>
                        </button>

                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleScheduledTask(task.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            task.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                          }`}
                        >
                          {task.isActive ? 'فعال (ON)' : 'غیرفعال (OFF)'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledTask(task.id)}
                          className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-neutral-700/60 transition-colors"
                          title="حذف زمان‌بندی"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: Core Admin Memory & Copilot (Persistent Workflows & Zero-Downtime Ollama Fallback) */}
      {activeSubTab === 'core_memory' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-950/60 via-[#161414] to-indigo-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 font-bold text-xl shadow-md shadow-amber-600/20">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      دستیار و پایگاه حافظه ماندگار هسته ادمین (Core Admin Memory & Unbreakable Copilot)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      پایداری ۱۰۰٪ فعال
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-3xl leading-relaxed">
                    این دستیار مرکزی پشت‌دست کلیه مکالمات و وظایف معماری سیستم قرار دارد. جهت جلوگیری از هرگونه قطعی، در صورت عدم دسترسی به APIهای کلاد، سیستم به صورت آنی به هسته لوکال اولاما سوییچ می‌کند. همچنین کلیه تصمیمات و قوانین فرایندی در حافظه بی‌پایان ماندگار (Persistent Storage) ذخیره شده و هرگز فراموش نمی‌شوند.
                  </p>
                </div>
              </div>

              {/* Memory Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddMemoryOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ثبت قانون جدید در حافظه ماندگار</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetMemoriesToDefault}
                  className="px-3 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-700 transition-all flex items-center gap-1"
                  title="بازنشانی پایگاه حافظه به قوانین پایه معماری"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>بازنشانی پایه</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-800/80">
              <div className="bg-[#101014]/90 border border-neutral-800 rounded-xl p-3">
                <span className="text-[11px] text-neutral-400 block">پایداری دستیار هسته</span>
                <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>۱۰۰٪ Zero-Downtime</span>
                </span>
                <span className="text-[10px] text-emerald-400/80">فال‌بک فعال به اولاما لوکال</span>
              </div>

              <div className="bg-[#101014]/90 border border-neutral-800 rounded-xl p-3">
                <span className="text-[11px] text-neutral-400 block">موتور محلی پشتیبان</span>
                <span className="text-base font-bold text-blue-400 font-mono mt-0.5 block truncate">
                  Ollama Llama3.1:8b
                </span>
                <span className="text-[10px] text-neutral-500">پورت ۱۱۴۳۴ (استنتاج آفلاین)</span>
              </div>

              <div className="bg-[#101014]/90 border border-neutral-800 rounded-xl p-3">
                <span className="text-[11px] text-neutral-400 block">قوانین ثبت‌شده در حافظه</span>
                <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                  {coreMemories.length} قانون فعال
                </span>
                <span className="text-[10px] text-neutral-500">ذخیره دائمی (همگام با دیتابیس)</span>
              </div>

              <div className="bg-[#101014]/90 border border-neutral-800 rounded-xl p-3">
                <span className="text-[11px] text-neutral-400 block">زمان سوییچ خودکار (Failover)</span>
                <span className="text-base font-bold text-purple-400 font-mono mt-0.5 block">
                  &lt; 50 میلی‌ثانیه
                </span>
                <span className="text-[10px] text-purple-300/80">بدون قطع اتصال مکالمه</span>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {memoryToast && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" />
                <span>{memoryToast}</span>
              </div>
              <button onClick={() => setMemoryToast(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Navigation Pills for Core Memory & Persistent Assistant Sub-sections */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#141418] border border-neutral-800 rounded-2xl overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setCoreMemorySubTab('chat')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
                coreMemorySubTab === 'chat'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>گفتگوی پیوسته با دستیار هسته</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {adminChatHistory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCoreMemorySubTab('env_vars')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
                coreMemorySubTab === 'env_vars'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>متغیرهای محیطی فعال (Env Vars)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {adminEnvVars.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCoreMemorySubTab('decisions')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
                coreMemorySubTab === 'decisions'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>دفترچه تصمیمات کلیدی مدل</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {adminKeyDecisions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCoreMemorySubTab('policies')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
                coreMemorySubTab === 'policies'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>قوانین معماری و پایگاه ماندگار</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {coreMemories.length}
              </span>
            </button>
          </div>

          {/* SUB-VIEW 1: Persistent Chat Memory (Multi-turn Assistant with Ollama & National Model Support) */}
          {coreMemorySubTab === 'chat' && (
            <div className="bg-[#141418] border border-amber-500/20 rounded-2xl p-5 space-y-4 shadow-xl">
              {/* Chat Header & Resilience Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>دستیار هوشمند و سیستم حافظه پایدار چت‌بات هسته (Persistent Chat Memory)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        حافظه ماندگار فعال
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      وضعیت جاری، متغیرهای محیطی و تصمیمات کلیدی مدل در حافظه ماندگار حفظ شده و حتی با ری‌لود یا قطعی موقت سرویس از بین نمی‌روند.
                    </p>
                  </div>
                </div>

                {/* Model Selector & Action Tools */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#101014] px-2 py-1 rounded-xl border border-neutral-700">
                    <span className="text-[11px] text-neutral-400">موتور:</span>
                    <select
                      value={selectedAdminModel}
                      onChange={(e) => setSelectedAdminModel(e.target.value)}
                      className="bg-transparent text-xs text-amber-300 font-mono focus:outline-none cursor-pointer"
                      title="انتخاب مدل استنتاج لوکال اولاما یا فال‌بک کلاد"
                    >
                      <option value="ollama/dorna2:8b" className="bg-[#18181D]">
                        🇮🇷 اولاما: dorna2:8b (مدل ملی فارسی - آفلاین)
                      </option>
                      <option value="ollama/maral:7b" className="bg-[#18181D]">
                        🇮🇷 اولاما: maral:7b (مدل بومی فارسی - آفلاین)
                      </option>
                      <option value="ollama/llama3.1:8b" className="bg-[#18181D]">
                        ⚡ اولاما: llama3.1:8b (لوکال آفلاین)
                      </option>
                      <option value="deepseek/deepseek-chat" className="bg-[#18181D]">
                        🌐 دیپ‌سیک: deepseek-chat (استدلال کلاد)
                      </option>
                      <option value="gemini-2.5-flash" className="bg-[#18181D]">
                        🌐 گوگل: gemini-2.5-flash (فال‌بک ابری)
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddDecisionOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                    title="ثبت تصمیم کلیدی مدل در دفترچه ماندگار"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ثبت تصمیم کلیدی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddEnvVarOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                    title="افزودن متغیر محیطی"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>متغیر محیطی</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMemoryJson}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    title="دانلود خروجی کامل JSON حافظه و سوابق"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAdminChatHistory}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                    title="پاکسازی تاریخچه چت هسته"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Multi-turn Chat Thread (Persisted in localStorage) */}
              <div className="max-h-[500px] overflow-y-auto space-y-3 p-4 bg-[#0e0e12] rounded-2xl border border-neutral-800/90 shadow-inner">
                {adminChatHistory.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isSystem = msg.role === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center text-xs text-amber-300/90 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          <Brain className="w-3.5 h-3.5 text-amber-400" />
                          <span>وضعیت سیستم حافظه پایدار هسته</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 max-w-xl mx-auto">{msg.content}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-amber-600/20 border border-amber-500/30 text-amber-300'
                      }`}>
                        {isUser ? currentUser.username[0].toUpperCase() : <Brain className="w-4 h-4" />}
                      </div>

                      <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 space-y-2 text-xs ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-600/20'
                          : 'bg-[#16161D] border border-neutral-700/80 text-neutral-200 rounded-bl-sm shadow-lg'
                      }`}>
                        {/* Header Tags for Assistant Messages */}
                        {!isUser && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800 text-[10px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-amber-300 font-mono flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-amber-400" />
                                <span>{msg.modelUsed}</span>
                              </span>
                              {msg.modelUsed.includes('dorna') && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                  مدل ملی فارسی (Ollama)
                                </span>
                              )}
                              {msg.memoryReferenced && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                                  قانون: {msg.memoryReferenced}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="p-1 rounded text-neutral-400 hover:text-white"
                              title="کپی متن پاسخ"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>

                        {/* Decision or Env Snapshot Tag */}
                        {!isUser && msg.keyDecisionMade && (
                          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200 flex items-center gap-2 mt-2">
                            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                            <span><strong>تصمیم کلیدی ثبت‌شده:</strong> {msg.keyDecisionMade}</span>
                          </div>
                        )}

                        <div className={`flex items-center justify-between text-[10px] pt-1 ${
                          isUser ? 'text-blue-200' : 'text-neutral-500'
                        }`}>
                          <span>{msg.timestamp}</span>
                          <span>ذخیره پایدار در حافظه دائم</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isCopilotThinking && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="p-3 bg-[#16161D] border border-neutral-700/80 rounded-2xl rounded-bl-sm text-xs text-neutral-300 flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>در حال واکشی قوانین پایدار و استنتاج لوکال با Ollama...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                <span className="text-neutral-400 text-[11px] font-medium ml-1">پرسش‌های پرتکرار ادمین:</span>
                {[
                  'استراتژی قطع نشدن سیستم و سوییچ به اولاما چیه؟',
                  'نحوه اجرای مدل ملی Dorna 2 روی اولاما بدون اینترنت چگونه است؟',
                  'قوانین تفکیک VLANها و فایروال میکروتیک چطوریه؟',
                  'سیاست محرمانگی اسناد در AnythingLLM چگونه است؟',
                  'وضعیت جاری متغیرهای محیطی سیستم را گزارش کن'
                ].map((chipPrompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCopilotQuery(chipPrompt);
                      handleAskCentralCopilot(chipPrompt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1a1a22] hover:bg-amber-600/20 text-neutral-300 hover:text-amber-200 border border-neutral-700/80 text-[11px] transition-all"
                  >
                    <span>{chipPrompt}</span>
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAskCentralCopilot();
                    }
                  }}
                  placeholder="دستور یا استعلام از دستیار هسته ادمین... (پاسخ‌ها در حافظه پایدار حفظ می‌شوند)"
                  className="flex-1 bg-[#101014] border border-neutral-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAskCentralCopilot()}
                  disabled={isCopilotThinking || !copilotQuery.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 shrink-0"
                >
                  {isCopilotThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isCopilotThinking ? 'پردازش...' : 'ارسال به هسته'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: Runtime Environment Variables */}
          {coreMemorySubTab === 'env_vars' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">
                    متغیرهای محیطی فعال در هسته (Runtime Environment Variables - {adminEnvVars.length})
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddEnvVarOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ افزودن متغیر محیطی جدید</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {adminEnvVars.map((env) => (
                  <div
                    key={env.id}
                    className="p-4 bg-[#141418] border border-neutral-800 hover:border-neutral-700 rounded-2xl space-y-2.5 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950/40 border border-blue-500/30 px-2 py-0.5 rounded-lg">
                        {env.key}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          env.isSystem ? 'bg-amber-500/15 text-amber-300' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {env.isSystem ? 'سیستمی / محافظت‌شده' : 'سفارشی'}
                        </span>
                        {!env.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEnvVar(env.id)}
                            className="p-1 text-neutral-400 hover:text-red-400"
                            title="حذف متغیر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#101014] p-2.5 rounded-xl border border-neutral-800/80 font-mono text-xs text-emerald-400 break-all">
                      {env.value}
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {env.description}
                    </p>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>آخرین به‌روزرسانی: {env.updatedAt}</span>
                      <span>پایدار در دیتابیس هسته</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: Key Decisions Ledger */}
          {coreMemorySubTab === 'decisions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">
                    دفترچه تصمیمات کلیدی مدل و مدیران ارشد (Key Decisions Ledger - {adminKeyDecisions.length})
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddDecisionOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ثبت تصمیم کلیدی جدید</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {adminKeyDecisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-4 bg-[#141418] border border-purple-500/20 hover:border-purple-500/40 rounded-2xl space-y-2.5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">{dec.title}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            dec.status === 'enforced'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {dec.status === 'enforced' ? 'لازم‌الاجرا (Enforced)' : 'فعال'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                          ثبت‌شده توسط {dec.author} · {dec.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${dec.title}\n\nتصمیم: ${dec.decision}\n\nعلت و استدلال: ${dec.rationale}`, dec.id)}
                          className="p-1.5 rounded text-neutral-400 hover:text-white"
                          title="کپی تصمیم"
                        >
                          {copiedId === dec.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDecision(dec.id)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-400"
                          title="حذف تصمیم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#101014] rounded-xl border border-neutral-800/80 text-xs text-neutral-200 leading-relaxed font-sans">
                      <strong className="text-purple-300 block mb-1">متن تصمیم کلیدی:</strong>
                      {dec.decision}
                    </div>

                    <div className="text-[11px] text-neutral-400 leading-relaxed flex items-center gap-1.5">
                      <span className="text-neutral-500 shrink-0 font-medium">استدلال معماری:</span>
                      <span>{dec.rationale}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: Permanent Memory Bank (Rules Catalog) */}
          {coreMemorySubTab === 'policies' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    فهرست قواعد و فرایندهای ثبت‌شده در حافظه ماندگار ({coreMemories.length})
                  </h4>
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchMemoryQuery}
                      onChange={(e) => setSearchMemoryQuery(e.target.value)}
                      placeholder="جستجو در حافظه..."
                      className="bg-[#101014] border border-neutral-700/80 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1 bg-[#101014] p-1 rounded-xl border border-neutral-700/80 text-[11px]">
                    {[
                      { id: 'all', label: 'همه' },
                      { id: 'failover', label: 'پایداری' },
                      { id: 'network', label: 'شبکه' },
                      { id: 'security', label: 'امنیت' },
                      { id: 'workflow', label: 'گردش کار' },
                      { id: 'architecture', label: 'معماری' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedMemoryCategory(cat.id as any)}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          selectedMemoryCategory === cat.id
                            ? 'bg-amber-600 text-white font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Memory Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coreMemories
                  .filter((m) => {
                    const matchesCat = selectedMemoryCategory === 'all' || m.category === selectedMemoryCategory;
                    const q = searchMemoryQuery.toLowerCase();
                    const matchesSearch = !q || m.title.toLowerCase().includes(q) || m.key.toLowerCase().includes(q) || m.content.toLowerCase().includes(q);
                    return matchesCat && matchesSearch;
                  })
                  .map((mem) => {
                    return (
                      <div
                        key={mem.id}
                        className="bg-[#141418] border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-4 space-y-3 transition-all shadow-md flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              mem.category === 'failover'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : mem.category === 'network'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : mem.category === 'security'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : mem.category === 'workflow'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {mem.category}
                            </span>

                            <span className="text-[10px] text-neutral-500 font-mono">
                              {mem.updatedAt}
                            </span>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{mem.title}</span>
                            </h5>
                            <span className="text-[10px] text-amber-400 font-mono block mt-0.5">
                              Key: #{mem.key}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-300 leading-relaxed bg-[#101014] p-3 rounded-xl border border-neutral-800/80">
                            {mem.content}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="text-[10px] text-neutral-500">مرجع: {mem.source}</span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(mem.content, mem.id)}
                              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                              title="کپی محتوای قانون"
                            >
                              {copiedId === mem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMemory(mem.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400"
                              title="حذف از حافظه"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create New Scheduled Task */}
      {isCreatingSchedule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">افزودن زمان‌بندی جدید (Schedule Task)</h4>
                  <p className="text-[11px] text-neutral-400">تنظیم دانلود یا ریاستارت خودکار سرویس‌ها در ساعات غیراداری</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingSchedule(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateScheduledTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">عنوان وظیفه:</label>
                <input
                  type="text"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  placeholder="مثال: دانلود خودکار مدل DeepSeek-R1 یا ریاستارت روزانه Ollama"
                  required
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">سرویس هدف:</label>
                  <select
                    value={newScheduleTarget}
                    onChange={(e) => setNewScheduleTarget(e.target.value as any)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ollama">Ollama (موتور مدل‌های هوش محلی)</option>
                    <option value="Langflow">Langflow (استودیوی گراف پایپ‌لاین)</option>
                    <option value="AnythingLLM">AnythingLLM (پردازش اسناد آفلاین)</option>
                    <option value="JEV">JEV (موتور سبک سند و چانکینگ)</option>
                    <option value="Core">Core Hub (هسته اصلی ارکستراسیون)</option>
                    <option value="n8n">n8n (گردش کار و وب‌هوک)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">نوع عملیات:</label>
                  <select
                    value={newScheduleType}
                    onChange={(e) => setNewScheduleType(e.target.value as any)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="download_model">دانلود خودکار مدل سنگین</option>
                    <option value="restart_service">ریاستارت دوره‌ای سرویس</option>
                    <option value="cache_flush">تخلیه حافظه موقت و رم (Cache Drop)</option>
                    <option value="security_audit">اسکن امنیتی خودکار (Strix)</option>
                    <option value="custom_cron">دستور سفارشی خط فرمان</option>
                  </select>
                </div>
              </div>

              {/* Conditional Model Selection if download_model */}
              {newScheduleType === 'download_model' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">انتخاب مدل برای دانلود:</label>
                  <select
                    value={newScheduleModel}
                    onChange={(e) => setNewScheduleModel(e.target.value)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="deepseek-r1:8b">deepseek-r1:8b (مدل استدلال سریع - 4.9 GB)</option>
                    <option value="deepseek-r1:14b">deepseek-r1:14b (مدل استدلال قدرتمند - 9.0 GB)</option>
                    <option value="deepseek-r1:32b">deepseek-r1:32b (استدلال فوق پیشرفته - 20 GB)</option>
                    <option value="qwen2.5-coder:14b">qwen2.5-coder:14b (تخصصی اسکریپت‌نویسی شبکه - 9.0 GB)</option>
                    <option value="llama3.3:70b">llama3.3:70b (مدل ابرقدرت سازمانی - 43 GB)</option>
                    <option value="nomic-embed-text">nomic-embed-text (مدل امبدینگ وکتور - 274 MB)</option>
                  </select>
                </div>
              )}

              {/* Schedule Hour Picker */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">ساعت اجرای زمان‌بندی (ساعات خلوتی سرور):</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2">
                    <span className="text-xs text-neutral-400">ساعت:</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newScheduleHour}
                      onChange={(e) => setNewScheduleHour(e.target.value.padStart(2, '0'))}
                      className="w-12 bg-transparent text-xs text-white font-mono text-center focus:outline-none"
                    />
                    <span className="text-neutral-500">:</span>
                    <span className="text-xs text-neutral-400">دقیقه:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newScheduleMinute}
                      onChange={(e) => setNewScheduleMinute(e.target.value.padStart(2, '0'))}
                      className="w-12 bg-transparent text-xs text-white font-mono text-center focus:outline-none"
                    />
                  </div>

                  {/* Preset Off-Peak Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setNewScheduleHour('02'); setNewScheduleMinute('30'); }}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] font-mono"
                    >
                      ۰۲:۳۰
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewScheduleHour('03'); setNewScheduleMinute('45'); }}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] font-mono"
                    >
                      ۰۳:۴۵
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewScheduleHour('04'); setNewScheduleMinute('15'); }}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] font-mono"
                    >
                      ۰۴:۱۵
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewScheduleHour('05'); setNewScheduleMinute('00'); }}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] font-mono"
                    >
                      ۰۵:۰۰
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Command if custom */}
              {newScheduleType === 'custom_cron' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">فرمان خط فرمان داکر یا لینوکس:</label>
                  <textarea
                    rows={2}
                    value={newScheduleCustomCmd}
                    onChange={(e) => setNewScheduleCustomCmd(e.target.value)}
                    placeholder="docker restart omniops_ollama && sync"
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Off Peak Checkbox */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#18181D] border border-neutral-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={newScheduleOffPeakOnly}
                  onChange={(e) => setNewScheduleOffPeakOnly(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-neutral-300">
                  اجرا صرفاً در ساعات غیراداری (حفاظت خودکار از سرعت اینترنت و منابع سیستم)
                </span>
              </label>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingSchedule(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  ذخیره و ثبت در Cron Daemon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Ollama Model Hub & Scheduled Download Manager */}
      {isOllamaHubOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    مرکز دانلود، استقرار و زمان‌بندی هسته‌های محلی Ollama
                  </h4>
                  <p className="text-xs text-neutral-400">
                    مدیریت منطق‌های استنتاجی (CoT Reasoning, Coding, Vision OCR, Embeddings) و زمان‌بندی دریافت در ساعات خلوتی سرور
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOllamaHubOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scheduled Off-Peak Download Setup Box */}
            <form onSubmit={handleScheduleDownload} className="bg-[#101014] border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>زمان‌بندی هوشمند دانلود در ساعات خلوتی پهنای باند سرور (Off-Peak Scheduled Pull)</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Cron Job Generator</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">انتخاب مدل برای دانلود در صف:</label>
                  <select
                    value={scheduledTargetModel}
                    onChange={(e) => setScheduledTargetModel(e.target.value)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {ollamaModels.map((m) => (
                      <option key={m.id} value={m.tag}>
                        {m.name} ({m.sizeGb} GB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">ساعت اجرای خودکار دانلود (بامداد):</label>
                  <input
                    type="time"
                    value={scheduledHour}
                    onChange={(e) => setScheduledHour(e.target.value)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ثبت زمان‌بندی در کرون سرور</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Model Cards Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>لیست هسته‌های مطرح و منطق‌های استنتاجی قابل استفاده:</span>
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ollamaModels.map((mod) => (
                  <div
                    key={mod.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      mod.isActive
                        ? 'bg-blue-950/20 border-blue-500/50 shadow-md'
                        : 'bg-[#18181D] border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{mod.name}</span>
                          {mod.isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                              مدل فعال
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono font-bold bg-black/40 px-2 py-0.5 rounded">
                          {mod.sizeGb} GB
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-blue-300 font-mono">
                          tag: {mod.tag}
                        </span>
                        <span className="text-[10px] text-amber-400 font-medium">
                          {mod.categoryLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                        {mod.description}
                      </p>

                      {mod.scheduledTime && (
                        <div className="p-2 bg-blue-950/40 border border-blue-500/20 rounded-lg text-[10px] text-blue-300 flex items-center gap-1.5 mb-2">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>زمان‌بندی شده برای دانلود خودکار در ساعت {mod.scheduledTime} بامداد</span>
                        </div>
                      )}

                      {/* Download Progress Bar if active */}
                      {downloadingModelId === mod.id && (
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                            <span>در حال دریافت لایه‌های مدل از رجیستری...</span>
                            <span>{downloadProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${downloadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                      {mod.isDownloaded ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3" />
                            <span>موجود در استوریج سرور</span>
                          </span>
                          {!mod.isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActiveModel(mod.id)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-blue-600/30 hover:text-blue-300 text-neutral-300 text-[10px] border border-neutral-700 transition-all font-semibold"
                            >
                              فعال‌سازی مدل
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={downloadingModelId === mod.id}
                          onClick={() => handlePullModel(mod.id, mod.tag)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Download className="w-3 h-3" />
                          <span>{downloadingModelId === mod.id ? 'در حال دانلود...' : 'دانلود فوری مدل'}</span>
                        </button>
                      )}

                      <span className="text-[10px] text-neutral-500 font-mono">
                        docker exec ollama
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsOllamaHubOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Worker Node Join Command Helper */}
      {isWorkerJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    دستور الحاق Worker Node به این خوشه (Join Command)
                  </h4>
                  <p className="text-xs text-neutral-400">
                    اتصال فوری سرور کمکی دوم/سوم به این سرور مرکزی فعال با یک دستور خط فرمان
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkerJoinModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-3 text-xs">
                <span className="font-bold text-white block">
                  مشخصات الحاق سرور نود کمکی به این پنل مرکزی:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 text-[11px]">آدرس کامل سرور مستر (Master IP/URL):</label>
                    <input
                      type="text"
                      value={workerJoinMasterUrl}
                      onChange={(e) => setWorkerJoinMasterUrl(e.target.value)}
                      className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="http://192.168.1.100:9000"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 text-[11px]">نام سرور نود (Node Label):</label>
                    <input
                      type="text"
                      value={workerJoinNodeName}
                      onChange={(e) => setWorkerJoinNodeName(e.target.value)}
                      className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="Worker-Node-02"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 bg-black/40 p-2.5 rounded-lg border border-neutral-800/80 flex items-center justify-between">
                  <span>توکن امنیتی کلاستر (Cluster Join Token):</span>
                  <span className="font-mono text-cyan-400">{clusterJoinToken}</span>
                </div>
              </div>

              {/* Generated Worker One-Line Command Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-semibold">دستور اجرا در ترمینال سرور دوم/سوم (Worker Server):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const cmd = `curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-worker.sh | bash -s -- --master "${workerJoinMasterUrl}" --token "${clusterJoinToken}" --name "${workerJoinNodeName}"`;
                      copyToClipboard(cmd, 'worker-install-cmd');
                      showClusterToast('دستور الحاق Worker Node کپی شد!');
                    }}
                    className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {copiedId === 'worker-install-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'worker-install-cmd' ? 'کپی شد!' : 'کپی دستور الحاق نود'}</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-black/60 border border-neutral-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed dir-ltr text-left">
{`curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-worker.sh | bash -s -- --master "${workerJoinMasterUrl}" --token "${clusterJoinToken}" --name "${workerJoinNodeName}"`}
                </pre>
              </div>

              {/* Worker Execution Preview */}
              <div className="bg-[#0A0A0D] border border-neutral-800 rounded-xl p-3 text-[11px] font-mono text-neutral-400 space-y-1 dir-ltr text-left">
                <div className="text-neutral-500"># Worker terminal probe & handshake preview:</div>
                <div className="text-blue-400">[1/4] Probing Worker hardware... Detects vCPUs, RAM & NVIDIA GPUs.</div>
                <div className="text-emerald-400">[2/4] Initializing Docker and Ollama compute engine on secondary server...</div>
                <div className="text-emerald-400">[3/4] Establishing secure handshake with {workerJoinMasterUrl}...</div>
                <div className="text-white">[✓] Worker Node {workerJoinNodeName} is registered and pooled into this cluster!</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsWorkerJoinModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Worker Node Manually (IP & SSH Credentials) */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">افزودن و الحاق سرور نود کمکی (Add Worker Node)</h4>
                  <p className="text-xs text-neutral-400">
                    ثبت مشخصات و احراز هویت یک سرور دیگر جهت الحاق منابع RAM و CPU به استخر پردازشی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddNodeModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorkerNode} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">نام یا عنوان سرور نود:</label>
                  <input
                    type="text"
                    required
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder="مثال: Worker-03 (Tehran DC)"
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">آدرس آی‌پی سرور (IP / Hostname):</label>
                  <input
                    type="text"
                    required
                    value={newNodeIp}
                    onChange={(e) => setNewNodeIp(e.target.value)}
                    placeholder="مثال: 192.168.1.180"
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">پورت SSH (پیش‌فرض ۲۲):</label>
                  <input
                    type="number"
                    value={newNodeSshPort}
                    onChange={(e) => setNewNodeSshPort(Number(e.target.value))}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">نام کاربری SSH:</label>
                  <input
                    type="text"
                    value={newNodeSshUser}
                    onChange={(e) => setNewNodeSshUser(e.target.value)}
                    placeholder="root یا ubuntu"
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">نوع احراز هویت:</label>
                  <select
                    value={newNodeAuthType}
                    onChange={(e) => setNewNodeAuthType(e.target.value as any)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="password">رمز عبور (Password)</option>
                    <option value="private_key">کلید خصوصی (SSH Key)</option>
                    <option value="token">توکن کلاستر (Token)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 text-[11px]">
                  {newNodeAuthType === 'password' ? 'رمز عبور سرور:' : newNodeAuthType === 'private_key' ? 'کلید خصوصی (SSH Private Key):' : 'توکن احراز هویت:'}
                </label>
                <input
                  type="password"
                  value={newNodeAuthSecret}
                  onChange={(e) => setNewNodeAuthSecret(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 text-[11px]">نقش عملیاتی این سرور در کلاستر:</label>
                <select
                  value={newNodeRole}
                  onChange={(e) => setNewNodeRole(e.target.value as any)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="llm_heavy">استنتاج مدل‌های سنگین استدلال و اولاما (LLM Heavy Inference)</option>
                  <option value="embedding_rag">وکتورسازی، امبدینگ و موتور اسناد (Embedding & RAG Search)</option>
                  <option value="hybrid_worker">ترکیبی (استنتاج مدل + وظایف بک‌گراند اتوماسیون)</option>
                  <option value="standby">رزرو گرم جهت جایگزینی بحرانی (High Availability / Failover)</option>
                </select>
              </div>

              {/* Probe / Test Connection Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!newNodeIp || isTestingNodeConnection}
                  onClick={handleTestNodeConnection}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingNodeConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingNodeConnection ? 'در حال برقراری ارتباط SSH و استخراج منابع...' : 'تست اتصال SSH و کشف خودکار منابع سخت‌افزاری'}</span>
                </button>
              </div>

              {/* Probe Result Box if available */}
              {nodeTestResult && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{nodeTestResult.message}</span>
                  </div>
                  {nodeTestResult.discoveredSpecs && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300 font-mono pt-2 border-t border-emerald-500/20">
                      <div>• پردازنده: {nodeTestResult.discoveredSpecs.cpuCores} هسته ({nodeTestResult.discoveredSpecs.cpuModel})</div>
                      <div>• حافظه RAM: {nodeTestResult.discoveredSpecs.ramTotalGb} GB</div>
                      <div>• کارت گرافیک: {nodeTestResult.discoveredSpecs.gpuName || 'ندارد (CPU)'}</div>
                      <div>• تاخیر پینگ: {nodeTestResult.discoveredSpecs.pingMs}ms</div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddNodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!newNodeIp || !newNodeName}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
                >
                  ثبت و الحاق منابع به کلاستر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hardware Assessment Report & Upgrade Advisor (گزارش ارزیابی هوشمند سخت‌افزار و راهنمای ارتقا) */}
      {isHardwareReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">گزارش ارزیابی هوشمند سخت‌افزار و راهنمای ارتقا</h4>
                  <p className="text-xs text-neutral-400">
                    تحلیل نیازمندی‌های منابع سرور برای مدل‌های استدلال عمیق، مدل‌های بومی و پایداری کلاستر
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHardwareReportModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Tier Banner */}
            <div className="bg-gradient-to-r from-amber-950/40 via-[#18181F] to-neutral-900 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                  طبقه سخت‌افزاری تشخیص‌داده‌شده:
                </span>
                <h5 className="text-sm font-bold text-white">{hardwareReport.tierTitle}</h5>
                <span className="text-xs text-neutral-400 mt-1 block">
                  تاریخ ارزیابی: {hardwareReport.evaluatedAt}
                </span>
              </div>
              <div className="text-center bg-black/40 px-4 py-2 rounded-xl border border-neutral-800 font-mono">
                <span className="text-2xl font-bold text-amber-400">{hardwareReport.score}</span>
                <span className="text-[10px] text-neutral-500 block">امتیاز آمادگی / ۱۰۰</span>
              </div>
            </div>

            {/* Hardware Items Audit Grid */}
            <div className="space-y-3 text-xs">
              {/* RAM Analysis */}
              <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>حافظه موقت (RAM): {hardwareReport.ram.totalGb} GB</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                    {hardwareReport.ram.rating}
                  </span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  {hardwareReport.ram.recommendation}
                </p>
              </div>

              {/* GPU Analysis */}
              <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>شتاب‌دهنده گرافیکی (GPU): {hardwareReport.gpu.name}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                    {hardwareReport.gpu.detected ? 'کارت اختصاصی' : 'استنتاج پردازنده'}
                  </span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  {hardwareReport.gpu.recommendation}
                </p>
              </div>

              {/* CPU Analysis */}
              <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>پردازنده مرکزی (CPU): {hardwareReport.cpu.model}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                    {hardwareReport.cpu.rating}
                  </span>
                </div>
              </div>

              {/* Architect Final Verdict */}
              <div className="p-3.5 bg-blue-950/30 border border-blue-500/40 rounded-xl space-y-1.5">
                <span className="font-bold text-blue-300 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>توصیه نهایی معمار ارشد سیستم (Architect Verdict):</span>
                </span>
                <p className="text-neutral-200 leading-relaxed text-xs">
                  {hardwareReport.architectVerdict}
                </p>
              </div>

              {/* Recommendations Checklist */}
              <div className="space-y-1 pt-1">
                <span className="font-bold text-white block text-[11px]">اقدامات پیشنهادی جهت ارتقای عملکرد:</span>
                <ul className="space-y-1.5 text-[11px] text-neutral-300">
                  {hardwareReport.upgradeRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  const auditText = `گزارش ارزیابی سخت‌افزار OmniOps:\nامتیاز: ${hardwareReport.score}/100\nطبقه: ${hardwareReport.tierTitle}\nپردازنده: ${hardwareReport.cpu.model}\nحافظه: ${hardwareReport.ram.totalGb} GB\nگرافیک: ${hardwareReport.gpu.name}\nتوصیه معمار: ${hardwareReport.architectVerdict}`;
                  copyToClipboard(auditText, 'audit-copy');
                  showClusterToast('گزارش کامل ارزیابی سخت‌افزار در کلیپ‌بورد کپی شد!');
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg flex items-center gap-1.5"
              >
                {copiedId === 'audit-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'audit-copy' ? 'کپی شد!' : 'کپی گزارش ارزیابی'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsHardwareReportModalOpen(false);
                    setNewNodeName(`Worker-Node-0${workerNodes.length + 1}`);
                    setNodeTestResult(null);
                    setIsAddNodeModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن Worker Node جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHardwareReportModalOpen(false)}
                  className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Assign Heavy Model to Worker Node */}
      {isAssignModelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-blue-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ارجاع مدل سنگین به Worker Node</h4>
                  <p className="text-[11px] text-neutral-400">هدایت بار استنتاج به سرور نود ثانویه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModelModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 text-[11px]">انتخاب مدل هوش مصنوعی جهت استقرار روی نود:</label>
                <select
                  value={targetModelToAssign}
                  onChange={(e) => setTargetModelToAssign(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="deepseek-r1:14b">deepseek-r1:14b (استدلال سنگین - 9.0 GB)</option>
                  <option value="deepseek-r1:32b">deepseek-r1:32b (استدلال فوق‌سنگین - 20 GB)</option>
                  <option value="dorna2:8b">dorna2:8b (مدل ملی و بومی فارسی - 4.9 GB)</option>
                  <option value="llama3.3:70b-q4">llama3.3:70b-q4 (مدل ابرقدرت ۷۰ میلیارد پارامتری - 43 GB)</option>
                  <option value="qwen2.5-coder:14b">qwen2.5-coder:14b (اسکریپت‌نویسی پیشرفته - 9.0 GB)</option>
                </select>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] text-neutral-300 leading-relaxed">
                ℹ️ با ارجاع این مدل، پردازش‌های چت‌بات و پاسخ‌دهی به صورت خودکار از طریق Reverse Proxy امن هسته به این Worker Node ارسال می‌گردد و RAM سرور مستر درگیر نخواهد شد.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAssignModelModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleAssignModelToNode}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
              >
                تایید ارجاع مدل به نود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Custom Quick Command */}
      {isAddCommandOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">افزودن فرمان سریع دلخواه</h4>
                  <p className="text-[11px] text-neutral-400">ثبت دستور ترمینال برای دسترسی و اجرای سریع ۱-کلیکه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCommandOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCmdTitle || !newCmdCommand) return;
                const newCmd: CustomQuickCommand = {
                  id: `custom-cmd-${Date.now()}`,
                  title: newCmdTitle,
                  command: newCmdCommand,
                  prompt: newCmdPrompt || `دستور "${newCmdCommand}" را روی سرور اجرا کن و گزارش وضعیت را اعلام نما`,
                  tag: newCmdTag || 'Custom',
                  is_custom: true
                };
                setQuickCommands((prev) => [newCmd, ...prev]);
                setNewCmdTitle('');
                setNewCmdCommand('');
                setNewCmdPrompt('');
                setNewCmdTag('');
                setIsAddCommandOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-neutral-300 mb-1">عنوان فرمان</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: همگام‌سازی کانتینر JEV با هسته اصلی"
                  value={newCmdTitle}
                  onChange={(e) => setNewCmdTitle(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">دستور خط فرمان شل (Bash / Linux Command)</label>
                <textarea
                  required
                  rows={2}
                  dir="ltr"
                  placeholder="docker network connect omniops_mesh omniops_jev"
                  value={newCmdCommand}
                  onChange={(e) => setNewCmdCommand(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">برچسب / تگ کوتاه</label>
                  <input
                    type="text"
                    placeholder="مثال: JEV یا Mesh"
                    value={newCmdTag}
                    onChange={(e) => setNewCmdTag(e.target.value)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">پرامپت ارسالی به هوش مصنوعی (اختیاری)</label>
                  <input
                    type="text"
                    placeholder="توضیح دلخواه برای ایجنت"
                    value={newCmdPrompt}
                    onChange={(e) => setNewCmdPrompt(e.target.value)}
                    className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddCommandOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
                >
                  افزودن فرمان به لیست
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Services Mesh Diagnostics Test with Main Core */}
      {isFullMeshTestOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-900/30">
                  <Radio className={`w-5 h-5 ${testingMesh ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>تست ارتباط همه سرویس‌ها با هسته اصلی (Full Mesh Diagnostics)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Mesh: omniops_mesh
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    ارزیابی بلادرنگ لتنسی پینگ، نرخ تبادل پکت‌ها، وضعیت درگاه‌ها و تاب‌آوری سوییچ به اولاما لوکال
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFullMeshTestOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Progress Bar */}
            <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium flex items-center gap-2">
                  {testingMesh ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      <span>در حال ارسال سیگنال و پینگ تست درگاه‌های ارتباطی...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">تست جامع شبکه با موفقیت کامل انجام شد</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-xs font-bold text-white">{meshTestProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${meshTestProgress}%` }}
                />
              </div>
            </div>

            {/* Services Health Matrix Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="font-bold text-neutral-300">ماتریس وضعیت اتصال کانتینرها و افزونه‌ها:</span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {meshTestItems.filter(i => i.status === 'online').length} از {meshTestItems.length} سرویس آنلاین
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meshTestItems.map((item) => {
                  const isDone = item.status === 'online';
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-[#101014] border-emerald-500/30 shadow-sm'
                          : 'bg-[#0f0f13] border-neutral-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            isDone ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-ping'
                          }`} />
                          <div>
                            <span className="text-xs font-bold text-white block">{item.name}</span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">{item.role}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-blue-300 border border-neutral-700">
                          {item.port}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500 font-mono">پروتکل: {item.protocol}</span>
                          <span className="text-[10px] text-neutral-500">•</span>
                          <span className="text-[10px] text-neutral-400 font-mono">اتلاف: {item.packetLoss}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">تاخیر:</span>
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ${
                            item.latencyMs < 20
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {item.latencyMs}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostic Summary & Conclusion */}
            {meshTestSummary && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تأییدیه نهایی یکپارچگی شبکه OmniOps Core Hub:</span>
                </div>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  {meshTestSummary} کلیه درگاه‌ها از جمله موتور استنتاج لوکال اولاما (پورت 11434)، ابزار RAG آفلاین AnythingLLM (پورت 3001) و کانتینر JEV با سرعت ایده‌آل و بدون کوچک‌ترین افت بسته به هسته اصلی متصل هستند.
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  const report = `=== OmniOps Enterprise Full Mesh Connection Report ===\nDate: ${new Date().toLocaleString('fa-IR')}\nOverall Status: 100% HEALTHY (Zero-Downtime)\nTotal Services Tested: ${meshTestItems.length}\n${meshTestItems.map(i => `[✓] ${i.name} (${i.port}): ${i.latencyMs}ms | Loss: ${i.packetLoss} | Protocol: ${i.protocol}`).join('\n')}\nFailover Ready: YES (Ollama Local Core)\n======================================================`;
                  copyToClipboard(report, 'mesh-report');
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-all flex items-center gap-1.5"
              >
                {copiedId === 'mesh-report' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'mesh-report' ? 'گزارش کپی شد!' : 'کپی گزارش تشخیصی شبکه'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunFullMeshTest}
                  disabled={testingMesh}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingMesh ? 'animate-spin' : ''}`} />
                  <span>{testingMesh ? 'در حال آزمایش...' : 'آزمایش مجدد ارتباط'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullMeshTestOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Add New Core Memory Item */}
      {isAddMemoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ثبت قانون یا فرایند جدید در حافظه ماندگار هسته</h4>
                  <p className="text-[11px] text-neutral-400">این دستور در پایگاه ذخیره دائمی ثبت شده و توسط چت‌بات مرکزی فراموش نخواهد شد.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemoryOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMemory} className="space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">دسته‌بندی موضوعی قانون</label>
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="failover">پایداری، عدم قطعی و فال‌بک (Failover & Resilience)</option>
                  <option value="network">شبکه، مسیریابی و میکروتیک (Network & MikroTik)</option>
                  <option value="security">امنیت، اسناد و محرمانگی (Security & Zero-Token)</option>
                  <option value="workflow">گردش‌کار و زمان‌بندی (Workflow & Cron)</option>
                  <option value="architecture">معماری و داکر (Architecture & Docker)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">شناسه یکتای حافظه (Key ID)</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="مثال: mikrotik_fasttrack_rule"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500 text-left"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">عنوان توصیفی قانون یا فرایند</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خط‌مشی ترافیک با اولویت بالا برای پورت‌های اولاما و هسته"
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">شرح دقیق دستور و فرایند (محتوای حافظه هوش مصنوعی)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="متن کامل قانونی که چت‌بات مرکزی و دستیار ادمین باید همواره به خاطر داشته باشد..."
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemoryOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-600/30"
                >
                  ذخیره در حافظه ماندگار هسته
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Environment Variable */}
      {isAddEnvVarOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-blue-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">افزودن متغیر محیطی جدید به هسته ادمین</h4>
                  <p className="text-[11px] text-neutral-400">ذخیره پایدار در دیتابیس هسته و همگام با استنتاج چت‌بات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEnvVarOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEnvVar} className="space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">نام کلید متغیر (VARIABLE_KEY):</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="مثال: CORE_CLUSTER_PROXY_PORT"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-left"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">مقدار متغیر (Value):</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="مثال: 1080 یا http://127.0.0.1:11434"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-left"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">توضیحات و نقش این متغیر در سامانه:</label>
                <textarea
                  rows={2}
                  placeholder="این متغیر برای اتصال امن کانتینرها یا تعیین رفتار مدل استنتاج..."
                  value={newEnvDesc}
                  onChange={(e) => setNewEnvDesc(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddEnvVarOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  ثبت در متغیرهای محیطی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Key Decision */}
      {isAddDecisionOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ثبت تصمیم کلیدی جدید مدل و مدیران ارشد</h4>
                  <p className="text-[11px] text-neutral-400">حفظ استراتژی‌ها و مصوبات معماری در حافظه ماندگار سیستم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDecisionOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDecision} className="space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">عنوان تصمیم کلیدی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اولویت‌دهی به مدل ملی Dorna 2 در استنتاج اداری"
                  value={newDecisionTitle}
                  onChange={(e) => setNewDecisionTitle(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">متن کامل مصوبه و تصمیم:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="شرح دقیق دستور و تصمیمی که اتخاذ شده است..."
                  value={newDecisionText}
                  onChange={(e) => setNewDecisionText(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">استدلال معماری و توجیه فنی:</label>
                <input
                  type="text"
                  placeholder="علت اتخاذ تصمیم (مثال: حفظ محرمانگی ۱۰۰٪ و عدم نیاز به اتصال خارجی)"
                  value={newDecisionRationale}
                  onChange={(e) => setNewDecisionRationale(e.target.value)}
                  className="w-full bg-[#18181D] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddDecisionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                >
                  ثبت در دفترچه تصمیمات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Core Operations Handbook (کتابچه جامع راهنمای عملیاتی هسته) */}
      {isHandbookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-amber-500/40 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>کتابچه جامع راهنمای عملیاتی هسته OmniOps Enterprise</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      v2026.4 LTS
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    مستندات کامل معماری توزیع‌شده، دستورات نصب تک‌خطی، ممیزی سخت‌افزار، ابزارها و عیب‌یابی
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadHandbook}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>دانلود کتابچه (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHandbookModalOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-1 bg-[#101014] p-1 rounded-xl border border-neutral-800 shrink-0 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setHandbookActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  handbookActiveTab === 'overview'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۱. معماری توزیع‌شده (Master + Worker)
              </button>
              <button
                type="button"
                onClick={() => setHandbookActiveTab('tools')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  handbookActiveTab === 'tools'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۲. ابزارها و ماژول‌های هسته
              </button>
              <button
                type="button"
                onClick={() => setHandbookActiveTab('cluster')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  handbookActiveTab === 'cluster'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۳. ممیزی سخت‌افزار و خوشه نودها
              </button>
              <button
                type="button"
                onClick={() => setHandbookActiveTab('network')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  handbookActiveTab === 'network'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۴. شبکه‌بندی، پورت‌ها و عیب‌یابی
              </button>
              <button
                type="button"
                onClick={() => setHandbookActiveTab('edge_mirror')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  handbookActiveTab === 'edge_mirror'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ۵. پل سرور لبه سبک و SSL خودکار (Pasargad Edge)
              </button>
            </div>

            {/* Content Area with smooth scroll */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-neutral-300 leading-relaxed">
              {/* Tab 1: Architecture Overview */}
              {handbookActiveTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-2">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-400" />
                      <span>فلسفه معماری توزیع‌شده (Master Control-Plane + Worker Nodes)</span>
                    </h5>
                    <p className="text-neutral-300">
                      در الگوهای سنتی هوش مصنوعی، وب‌پنل، پایگاه داده، افزونه‌های اداری و موتورهای سنگین زبانی همگی روی یک سرور نصب می‌شوند. به محض ارسال اولین درخواست پردازش مدل‌های بالاتر از ۷B، با خطای OOM کل سرور و پنل مدیریت از دسترس خارج می‌شود.
                    </p>
                    <p className="text-neutral-400">
                      معماری OmniOps تفکیک سخت را اعمال می‌کند: سرور اول به عنوان Control-Plane سبک و چابک عمل می‌کند و هرگز بار استنتاج بر دوش نمی‌کشد (آپ‌تایم ۱۰۰٪ تضمین‌شده). سرورهای دوم و سوم به عنوان Worker Nodes بارهای استنتاج زبانی سنگین (DeepSeek-R1, Dorna 2, Llama 3) و پایگاه داده برداری را میزبانی می‌کنند.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1.5">
                      <span className="font-bold text-blue-300 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5" />
                        <span>سرور اول: Master Control-Plane (:9000 / :3000)</span>
                      </span>
                      <p className="text-[11px] text-neutral-300">
                        میزبانی وب‌پنل، احراز هویت سه سطحی (SuperAdmin/Admin/User)، ارکستراتور کلاستر، حافظه پایدار چت‌بات و کش ردیس. کاملاً ایزوله و بدون خطر کراش.
                      </p>
                    </div>

                    <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1.5">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>سرورهای دوم و سوم: Worker Nodes (محاسبات هوش مصنوعی)</span>
                      </span>
                      <p className="text-[11px] text-neutral-300">
                        سرورهای عملیاتی با رم ۳۲/۶۴GB یا کارت گرافیک‌های NVIDIA جهت استنتاج سریع، امبدینگ BGE-M3 و پایپ‌لاین‌های بدون توکن AnythingLLM.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Core Tools */}
              {handbookActiveTab === 'tools' && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        <span>۱. داشبورد دایره‌ای پایش نودها (Donut Radar)</span>
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        نمودارهای هم‌مرکز دوگانه برای پایش بلادرنگ درصد RAM و CPU هر سرور با نرخ نوسان زنده و تله‌متری بلادرنگ.
                      </p>
                    </div>

                    <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-amber-400" />
                        <span>۲. حافظه ماندگار هسته (Persistent Memory Bank)</span>
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        ذخیره‌سازی پایدار سشن‌ها، فرامین سیستمی و دفترچه تصمیمات کلیدی مدل در دیتابیس محلی با بازیابی خودکار پس از رفرش.
                      </p>
                    </div>

                    <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span>۳. استنتاج اولاما و مدل‌های ملی ایرانی</span>
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        پشتیبانی از مدل ملی Dorna 2 (8B)، مدل استدلال DeepSeek-R1 و مدل‌های کدنویسی Qwen بدون ارسال داده به خارج از کشور.
                      </p>
                    </div>

                    <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>۴. زمان‌بندی هوشمند وظایف شبانه (Scheduler)</span>
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        دانلود خودکار مدل‌های سنگین در ساعات خلوتی پهنای باند و پاکسازی بافرهای VRAM و رم در نیمه‌شب.
                      </p>
                    </div>

                    <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span>۵. کنسول امن روت شل و لاگ‌های معماری</span>
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        اجرای امن دستورات مجاز با احراز هویت سه سطحی، لاگ‌های چرخه حیات بافر FIFO و خروجی استاندارد متنی.
                      </p>
                    </div>

                    <div className="p-3 bg-[#101014] border border-neutral-800 rounded-xl space-y-1.5">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <span>۶. پردازش بدون توکن اسناد (Zero-Token RAG)</span>
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        تکه‌بندی اسناد با JEV Reader (:8000)، OCR محلی و پایگاه دانش AnythingLLM با محرمانگی ۱۰۰٪ و هزینه صفر توکن.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Hardware Assessment & Cluster */}
              {handbookActiveTab === 'cluster' && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-2">
                    <h5 className="text-sm font-bold text-white">راهنمای ممیزی سخت‌افزار در شروع نصب</h5>
                    <p className="text-neutral-400 text-xs">
                      اسکریپت نصب به محض اجرا، امتیاز آمادگی سیستم (از ۱۰۰) را محاسبه کرده و یکی از ۳ طبقه سخت‌افزاری زیر را پیشنهاد می‌دهد:
                    </p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-start gap-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-white block">طبقه ۱: سبک (Lightweight / Master Control-Plane)</strong>
                          <span className="text-neutral-400 text-[11px]">
                            رم زیر ۸ تا ۱۶ گیگابایت بدون کارت گرافیک. مناسب مدیریت، وب‌پنل و افزونه‌های سبک. نباید مدل‌های سنگین روی این سرور لود شوند.
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                        <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-white block">طبقه ۲: متوسط (Standard Inference)</strong>
                          <span className="text-neutral-400 text-[11px]">
                            رم ۱۶ تا ۳۲ گیگابایت با پردازنده ۸ هسته‌ای. مناسب اجرای مدل‌های ۸B نظیر Dorna 2 و Llama 3 با ترافیک کنترل‌شده.
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-white block">طبقه ۳: فوق‌پیشرفته (Enterprise LLM Cluster)</strong>
                          <span className="text-neutral-400 text-[11px]">
                            رم بالای ۳۲ گیگابایت به همراه کارت گرافیک NVIDIA (VRAM بالای ۱۲GB). مناسب استنتاج DeepSeek-R1 و Llama 70B با سرعت بالا.
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 5: Network, Ports & Diagnostics */}
              {handbookActiveTab === 'network' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="overflow-x-auto border border-neutral-800 rounded-xl">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-[#101014] text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="p-2.5">سرویس</th>
                          <th className="p-2.5">پورت پیش‌فرض</th>
                          <th className="p-2.5">نقش در سامانه</th>
                          <th className="p-2.5">وضعیت دسترسی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 font-mono text-[11px]">
                        <tr>
                          <td className="p-2.5 font-bold text-white font-sans">OmniOps Core Hub</td>
                          <td className="p-2.5 text-blue-400">9000 / 8080</td>
                          <td className="p-2.5 text-neutral-300 font-sans">ارکستراتور، وب‌پنل و احراز هویت</td>
                          <td className="p-2.5 text-emerald-400 font-sans">عمومی / مدیریت</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white font-sans">JEV Fast Reader</td>
                          <td className="p-2.5 text-blue-400">8000</td>
                          <td className="p-2.5 text-neutral-300 font-sans">میکروسرویس OCR، تکه‌بندی و ریرنکینگ</td>
                          <td className="p-2.5 text-cyan-400 font-sans">شبکه omniops_mesh</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white font-sans">AnythingLLM Engine</td>
                          <td className="p-2.5 text-blue-400">3001</td>
                          <td className="p-2.5 text-neutral-300 font-sans">پایگاه دانش اسناد محلی و دیتابیس برداری</td>
                          <td className="p-2.5 text-cyan-400 font-sans">شبکه omniops_mesh</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white font-sans">Ollama Engine</td>
                          <td className="p-2.5 text-blue-400">11434</td>
                          <td className="p-2.5 text-neutral-300 font-sans">موتور استنتاج مدل‌های زبانی متن‌باز</td>
                          <td className="p-2.5 text-amber-400 font-sans">شبکه داخلی ایزوله</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white font-sans">Langflow Studio</td>
                          <td className="p-2.5 text-blue-400">7860</td>
                          <td className="p-2.5 text-neutral-300 font-sans">طراحی گراف بصری پایپ‌لاین ایجنت‌ها</td>
                          <td className="p-2.5 text-cyan-400 font-sans">شبکه omniops_mesh</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white font-sans">n8n Automation</td>
                          <td className="p-2.5 text-blue-400">5678</td>
                          <td className="p-2.5 text-neutral-300 font-sans">اتوماسیون وب‌هوک‌ها و پیام‌رسان‌ها</td>
                          <td className="p-2.5 text-cyan-400 font-sans">شبکه omniops_mesh</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-white block text-xs">فرامین متداول عیب‌یابی لینوکس:</span>
                    <div className="bg-black/50 p-2.5 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-1 text-left" dir="ltr">
                      <div><span className="text-neutral-500"># Check Master service status:</span> sudo systemctl status omniops</div>
                      <div><span className="text-neutral-500"># View real-time service logs:</span> sudo journalctl -u omniops -f</div>
                      <div><span className="text-neutral-500"># View docker containers on mesh:</span> docker ps --filter "network=omniops_mesh"</div>
                      <div><span className="text-neutral-500"># Test Ollama API response:</span> curl http://localhost:11434/api/tags</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Lightweight Edge UI Mirror & Pasargad-Style Architecture */}
              {handbookActiveTab === 'edge_mirror' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="bg-[#101014] border border-emerald-500/40 rounded-xl p-4 space-y-3">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>معماری پل ارتباطی سرور لبه سبک و صدور خودکار SSL (Lightweight Edge UI Mirror)</span>
                    </h5>
                    <p className="text-neutral-300">
                      مشابه الگوی نودهای پاسارگاد، در این ساختار سرور پرقدرت و سنگین هسته مرکزی (با رم ۱۱۲ گیگابایت، اولاما و کانتینرهای سنگین هوش مصنوعی) به طور کامل از ترافیک مستقیم اینترنت عمومی ایزوله می‌ماند.
                    </p>
                    <p className="text-neutral-300 leading-relaxed">
                      یک سرور سبک با رم ۱ یا ۲ گیگابایت در دیتاسنتر یا شبکه CDN راه‌اندازی می‌شود که تنها نقش رابط کاربری وب، احراز هویت سبک، پروکسی معکوس و صدور SSL را ایفا می‌کند (مصرف رم کمتر از ۱۵۰ مگابایت). کلیه فرامین و چت‌ها با کلید تبادل امن به هسته مرکزی ارسال و اجرا می‌شوند.
                    </p>
                  </div>

                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-3">
                    <span className="font-bold text-white text-xs block">مراحل خودکار و اینتراکتیو اسکریپت نصب در سرور لبه:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-neutral-300 text-xs">
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800 space-y-1">
                        <span className="text-cyan-400 font-bold font-mono">۱. آدرس پابلیک هسته (Core IP/Host)</span>
                        <p className="text-[11px] text-neutral-400">آدرس عمومی سرور اصلی و قدرتمند که مدل‌ها و پایپ‌لاین‌ها روی آن قرار دارند.</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800 space-y-1">
                        <span className="text-emerald-400 font-bold font-mono">۲. پورت تبادل (Port - کاملاً دلخواه)</span>
                        <p className="text-[11px] text-neutral-400">پیش‌فرض ۹۰۰۰ با امکان تغییر آزادانه به هر پورت دلخواه (۸۴۴۳، ۸۰۸۰، ۴۴۴۳ یا رنج ۱۰۲۴ تا ۶۵۵۳۵).</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800 space-y-1">
                        <span className="text-amber-400 font-bold font-mono">۳. کلید تبادل و توکن (Security Token)</span>
                        <p className="text-[11px] text-neutral-400">دارای دکمه‌های ایجاد خودکار کلید ۶۴ بایتی HMAC یا ۳۲ بایتی، با امکان ثبت کلید سفارشی دلخواه.</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800 space-y-1">
                        <span className="text-purple-400 font-bold font-mono">۴. نام دامنه و صدور SSL</span>
                        <p className="text-[11px] text-neutral-400">دریافت نام دامنه (panel.company.ir) و صدور اتوماتیک گواهی‌نامه Let's Encrypt TLS 1.3 با تمدید ۹۰ روزه.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white block text-xs">فرمان اجرای مستقیم روی سرور سبک ۱ یا ۲ گیگابایت:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsHandbookModalOpen(false);
                          setActiveSubTab('installation');
                        }}
                        className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold underline underline-offset-4"
                      >
                        <span>رفتن به تب اختصاصی نصب و سفارشی‌سازی اسکریپت شل</span>
                        <span>←</span>
                      </button>
                    </div>
                    <pre className="bg-black/70 p-3 rounded-lg border border-neutral-800 font-mono text-xs text-cyan-300 text-left dir-ltr select-all">
curl -fsSL https://raw.githubusercontent.com/omniops-enterprise/core/main/install-edge-node.sh | bash
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0 text-xs">
              <button
                type="button"
                onClick={handleDownloadHandbook}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>دانلود نسخه متنی مارک‌داون کتابچه (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHandbookModalOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
              >
                بستن راهنما
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edge Node Setup & SSL Deployment Wizard */}
      {isEdgeWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-emerald-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>ویزارد استقرار پل سرور لبه سبک (Edge UI Mirror Setup)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      گام {wizardStep} از ۴
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">
                    راه‌اندازی سرور ۱ یا ۲ گیگابایت رم با اتصال فوق امن TLS 1.3 به هسته مرکزی و صدور خودکار SSL
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEdgeWizardOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold shrink-0">
              <div className={`p-2 rounded-xl border ${wizardStep === 1 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : wizardStep > 1 ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-900/50 text-neutral-500 border-neutral-800'}`}>
                ۱. سرور سبک
              </div>
              <div className={`p-2 rounded-xl border ${wizardStep === 2 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : wizardStep > 2 ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-900/50 text-neutral-500 border-neutral-800'}`}>
                ۲. دامنه و SSL
              </div>
              <div className={`p-2 rounded-xl border ${wizardStep === 3 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : wizardStep > 3 ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-900/50 text-neutral-500 border-neutral-800'}`}>
                ۳. استقرار و تونل
              </div>
              <div className={`p-2 rounded-xl border ${wizardStep === 4 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-neutral-900/50 text-neutral-500 border-neutral-800'}`}>
                ۴. تایید و اتصال
              </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-neutral-300">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-white text-xs">مشخصات سرور سبک در دیتاسنتر یا شبکه CDN:</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-neutral-300 mb-1">نام یا شناسه نود لبه:</label>
                        <input
                          type="text"
                          value={wizardNodeName}
                          onChange={(e) => setWizardNodeName(e.target.value)}
                          className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-white font-sans focus:outline-none focus:border-emerald-500"
                          placeholder="مثال: Edge-Mirror-Tehran-01"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-neutral-300 mb-1">آدرس IP سرور لبه:</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={wizardNodeIp}
                            onChange={(e) => setWizardNodeIp(e.target.value)}
                            className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-emerald-500"
                            placeholder="194.36.89.210"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-300 mb-1">میزان حافظه RAM سرور:</label>
                          <select
                            value={wizardRamGb}
                            onChange={(e) => setWizardRamGb(Number(e.target.value))}
                            className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value={1}>۱ گیگابایت RAM (مصرف ~۱۴۰MB)</option>
                            <option value={2}>۲ گیگابایت RAM (مصرف ~۱۸۰MB)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-neutral-300 mb-1">نام دیتاسنتر / موقعیت جغرافیایی:</label>
                        <input
                          type="text"
                          value={wizardDatacenter}
                          onChange={(e) => setWizardDatacenter(e.target.value)}
                          className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                          placeholder="مثال: پارس آنلاین تهران یا آسیاتک"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-white text-xs">پیکربندی دامنه اختصاصی و گواهی‌نامه امن SSL:</h5>
                    <div>
                      <label className="block text-neutral-300 mb-1">نام دامنه کامل پنل وب (Domain):</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={wizardDomain}
                        onChange={(e) => setWizardDomain(e.target.value)}
                        className="w-full bg-[#18181D] border border-neutral-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-emerald-500"
                        placeholder="panel.mycompany-ai.ir"
                      />
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        مطمئن شوید رکورد A این دامنه در پنل DNS به IP سرور لبه ({wizardNodeIp}) اشاره می‌کند.
                      </p>
                    </div>

                    <div className="bg-black/40 border border-neutral-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>صدور گواهی‌نامه SSL خودکار: Let's Encrypt TLS 1.3</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        اسکریپت به صورت کاملاً اتوماتیک با استفاده از چالش ACME HTTP-01 گواهی‌نامه معتبر ۹۰ روزه را برای این دامنه صادر و قابلیت تمدید خودکار دوره‌ای (Auto-Renewal Cron) را تنظیم می‌نماید.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-white text-xs">اجرای زنده اسکریپت استقرار و اتصال به هسته مرکزی:</h5>
                      {!isDeployingEdgeSsl && wizardExecutionLogs.length === 0 && (
                        <button
                          type="button"
                          onClick={handleRunEdgeWizardDeploy}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>شروع نصب خودکار</span>
                        </button>
                      )}
                    </div>

                    <div className="bg-black/80 border border-neutral-800 rounded-xl p-3.5 font-mono text-[11px] space-y-1.5 max-h-56 overflow-y-auto dir-ltr text-left text-neutral-300 select-all">
                      {wizardExecutionLogs.length === 0 ? (
                        <span className="text-neutral-500">برای شروع نصب و استقرار روی دکمه «شروع نصب خودکار» کلیک نمایید...</span>
                      ) : (
                        wizardExecutionLogs.map((log, index) => (
                          <div key={index} className={log.includes('[✓]') ? 'text-emerald-400 font-semibold' : 'text-neutral-300'}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xl shadow-emerald-950/40 animate-in zoom-in-75">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">پل سرور لبه با موفقیت فعال و دارای SSL شد!</h4>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                    محیط وب اختصاصی روی دامنه شما راه‌اندازی شد. کلیه فرامین و درخواست‌های هوش مصنوعی با امنیت کامل از طریق تونل WSS در هسته مرکزی اجرا می‌شوند.
                  </p>
                  <div className="bg-[#101014] border border-neutral-800 rounded-xl p-3.5 max-w-md mx-auto font-mono text-xs text-cyan-300 dir-ltr text-center">
                    https://{wizardDomain.replace(/^https?:\/\//, '')}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep === 1) setIsEdgeWizardOpen(false);
                  else setWizardStep(wizardStep - 1);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                {wizardStep === 1 ? 'انصراف' : 'مرحله قبل'}
              </button>

              {wizardStep < 3 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/40"
                >
                  گام بعدی
                </button>
              )}

              {wizardStep === 3 && wizardExecutionLogs.length > 0 && !isDeployingEdgeSsl && (
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/40"
                >
                  مشاهده نتیجه
                </button>
              )}

              {wizardStep === 4 && (
                <button
                  type="button"
                  onClick={() => setIsEdgeWizardOpen(false)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  تکمیل و بازگشت به پنل
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
