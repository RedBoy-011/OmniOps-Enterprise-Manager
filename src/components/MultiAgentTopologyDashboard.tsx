import React, { useState } from 'react';
import {
  Brain,
  Cpu,
  Layers,
  Activity,
  Zap,
  CheckCircle,
  Clock,
  Shield,
  Server,
  Terminal,
  Workflow,
  Sparkles,
  GitBranch,
  UploadCloud,
  HardDrive,
  Database,
  Globe,
  Radio,
  Lock,
  ChevronRight,
  Play,
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';

export interface TopologyNode {
  id: string;
  name: string;
  persianName: string;
  role: string;
  category: 'orchestrator' | 'internal_model' | 'engineering' | 'network' | 'financial' | 'github_cicd' | 'cloud_core' | 'windows_agent' | 'web_ext';
  status: 'active' | 'processing' | 'standby';
  modelAssigned: string;
  latencyMs: number;
  cpuPercent: number;
  memoryMb: number;
  throughputReqMin: number;
  authProtocol: string;
  tagFormat: string;
  capabilities: string[];
  description: string;
}

const INITIAL_TOPOLOGY_NODES: TopologyNode[] = [
  {
    id: 'node-central',
    name: 'Central Node (Orchestrator L3)',
    persianName: 'هسته مرکزی ارکستراسیون چندعاملی سطح ۳',
    role: 'گره مرکزی هدایت و شکست تسک‌ها',
    category: 'orchestrator',
    status: 'active',
    modelAssigned: 'Level 3 Central Node Engine',
    latencyMs: 4,
    cpuPercent: 5.2,
    memoryMb: 340,
    throughputReqMin: 180,
    authProtocol: 'Internal Bus (mTLS)',
    tagFormat: '[ORCHESTRATOR:DISPATCH:node_target]',
    capabilities: ['تریاژ هوشمند سختی تسک', 'مدیریت پروتکل تأییدیه گام‌به‌گام', 'هدایت به گره‌های تخصصی', 'تزریق امن Environment Variables'],
    description: 'گره مرکزی در شبکه توزیع‌شده هوش مصنوعی؛ دریافت تسک، تحلیل معماری و صدور فرامین ساختاریافته به بازوها.'
  },
  {
    id: 'node-ember',
    name: 'Ember-1 Agentic Node',
    persianName: 'گره تخصصی داخلی Ember-1 (Tools & Vision)',
    role: 'مدل عامل‌محور داخلی برای Tool Calling سریع',
    category: 'internal_model',
    status: 'active',
    modelAssigned: 'Ember-1 Local Micro-Engine v1.4',
    latencyMs: 12,
    cpuPercent: 8.4,
    memoryMb: 1240,
    throughputReqMin: 240,
    authProtocol: 'Internal IPC / Zero-Token Core',
    tagFormat: '[INTERNAL_NODE:EMBER:درخواست]',
    capabilities: ['Tool Calling فوق سریع', 'کدنویسی سبک و تولید تابع', 'بینایی ماشین (Vision)', 'تولید YAML و Workflow پایپ‌لاین'],
    description: 'مدل تخصصی متصل به صورت محلی و داخلی برای تسک‌هایی که نیازمند ابزارسازی سریع و تولید سبک کد هستند.'
  },
  {
    id: 'node-eng',
    name: 'Software Engineering Node',
    persianName: 'گره مهندسی نرم‌افزار و معماری سیستم',
    role: 'تحلیل عمیق منطق، طراحی پایگاه و ریفکتورینگ',
    category: 'engineering',
    status: 'active',
    modelAssigned: 'Claude 3.7 Sonnet / Gemini 2.5 Pro',
    latencyMs: 42,
    cpuPercent: 12.1,
    memoryMb: 680,
    throughputReqMin: 65,
    authProtocol: 'Backend Proxy (Secret Key Encrypted)',
    tagFormat: '[ENG_NODE:REFRACTOR:target]',
    capabilities: ['تحلیل معماری چندمرحله‌ای', 'شکست مسائل پیچیده به Sub-tasks', 'ریفرکتورینگ ساختار کد', 'طراحی الگوهای توزیع‌شده'],
    description: 'تحلیل استدلال ترکیبی و مسائل پرچالش نرم‌افزاری با هماهنگی گره مرکزی.'
  },
  {
    id: 'node-net',
    name: 'Network & Gateway Node',
    persianName: 'گره نظارت بر شبکه و فایروال میکروتیک',
    role: 'ممیزی سوکت‌ها، روت‌ها و امنیت لایه ۳/۴',
    category: 'network',
    status: 'active',
    modelAssigned: 'DeepSeek V3 / RouterOS API Hub',
    latencyMs: 22,
    cpuPercent: 6.8,
    memoryMb: 420,
    throughputReqMin: 110,
    authProtocol: 'RouterOS SSL / API-SSL',
    tagFormat: '[WIN_AGENT:ROUTER_API:cmd]',
    capabilities: ['استعلام روت‌های RouterOS v7', 'ممیزی قوانین استیت‌فول فایروال', 'اسکن پورت‌های باز ساب‌نت', 'پایش بسته‌های FastTrack'],
    description: 'مدیریت و ممیزی بلادرنگ روترها و سوئیچ‌های سازمانی بدون دخالت دستی.'
  },
  {
    id: 'node-fin',
    name: 'Financial & Resource Triage Node',
    persianName: 'گره مالی و بهینه‌سازی هزینه (Jev Gatekeeper)',
    role: 'تریاژ پیچیدگی و صرفه‌جویی ۹۰٪ هزینه توکن',
    category: 'financial',
    status: 'active',
    modelAssigned: 'Jev Triage Engine (Jina Local Embedder)',
    latencyMs: 10,
    cpuPercent: 3.1,
    memoryMb: 210,
    throughputReqMin: 320,
    authProtocol: 'Local Zero-Cost Triage',
    tagFormat: '[GATEWAY:TRIAGE:prompt_cost]',
    capabilities: ['تشخیص هزینه نزدیک صفر سوالات', 'تفکیک پرامپت ساده از پیچیده', 'کاهش ۹۰٪ هزینه‌های API ماهانه', 'تخصیص هوشمند سهمیه'],
    description: 'دروازه هوشمند تریاژ پرامپت‌ها؛ سوالات ساده به مدل‌های سریع و رایگان و مسائل سخت به مدل‌های استدلال عمیق ارجاع می‌شوند.'
  },
  {
    id: 'node-github',
    name: 'GitHub CI/CD Automation Node',
    persianName: 'گره مدیریت سورس‌کد و گیت‌هاب (CI/CD)',
    role: 'ایجاد مخزن، کامیت، پوش و ورک‌فلو اکشنز',
    category: 'github_cicd',
    status: 'active',
    modelAssigned: 'GitHub Automation Protocol & Actions',
    latencyMs: 35,
    cpuPercent: 4.5,
    memoryMb: 310,
    throughputReqMin: 90,
    authProtocol: 'PAT Encrypted in Backend (Injected via Env Var)',
    tagFormat: '[WIN_AGENT:GIT:cmd]',
    capabilities: ['ساخت مخزن جدید از طریق GitHub API', 'مقداردهی git init در پوشه ایزوله', 'اجرای git add/commit/push', 'تولید خودکار .github/workflows/deploy.yml'],
    description: 'زنجیره خودکار کنترل نسخه؛ توکن‌های PAT از کاربر پرسیده نمی‌شوند و به صورت متغیر محیطی امن تزریق می‌گردند.'
  },
  {
    id: 'node-cloud',
    name: 'Google Drive Cloud Core',
    persianName: 'گره فضای ابری (Google Drive Cloud Core)',
    role: 'پوشه‌های ابری ایزوله و پشتیبان‌گیری',
    category: 'cloud_core',
    status: 'active',
    modelAssigned: 'Google Drive OAuth Engine v3',
    latencyMs: 28,
    cpuPercent: 3.8,
    memoryMb: 280,
    throughputReqMin: 130,
    authProtocol: 'OAuth 2.0 Encrypted Bearer (Env Var Injected)',
    tagFormat: '[CLOUD_CORE:DRIVE_SYNC:path]',
    capabilities: ['ایجاد ساختار پوشه بر اساس شناسه چت و تاریخ', 'همگام‌سازی فایل‌های Cloud Core', 'احراز هویت رمزنگاری‌شده بدون افشای توکن', 'ثبت هش SHA-256 فایل‌ها'],
    description: 'مدیریت پوشه‌های متصل به فضای ابری گوگل درایو متناسب با هر چت و تاریخ ایجاد.'
  },
  {
    id: 'node-win',
    name: 'Windows Agent Arm (:8443)',
    persianName: 'بازوی اجرایی سیستم‌عامل ویندوز (Windows Agent)',
    role: 'اجرای دستورات و مدیریت فایل‌ها در کامپیوتر کاربر',
    category: 'windows_agent',
    status: 'active',
    modelAssigned: 'OmniOps Installed Agent :8443',
    latencyMs: 14,
    cpuPercent: 6.2,
    memoryMb: 490,
    throughputReqMin: 210,
    authProtocol: 'Local Pairing Token (WSS TLS 1.3)',
    tagFormat: '[WIN_AGENT:ACTION:دستور]',
    capabilities: ['اجرای اسکریپت در پوشه ایزوله چت', 'فراخوانی PowerShell و CMD', 'پایش منابع و پروسه‌های RAM/CPU', 'همگام‌سازی Local Core'],
    description: 'بازوی نصب‌شده روی سیستم‌عامل ویندوز کاربر؛ اجرای فیزیکی دستورات با اعتبارسنجی جفت‌سازی پروفایل.'
  },
  {
    id: 'node-web',
    name: 'Web Extension Arm',
    persianName: 'بازوی افزونه مرورگر (Web Extension)',
    role: 'اسکن مستندات وب و خودآموزی (Self-Reflection)',
    category: 'web_ext',
    status: 'active',
    modelAssigned: 'Chrome Extension Bridge v2.4',
    latencyMs: 18,
    cpuPercent: 4.1,
    memoryMb: 190,
    throughputReqMin: 140,
    authProtocol: 'Chrome Native Messaging Host',
    tagFormat: '[WEB_EXT:ACTION:دستور]',
    capabilities: ['اسکرپ ساختاریافته صفحات مستندات', 'مکانیسم خودآموزی (Self-Reflection)', 'تراورس عناصر DOM و کدهای سمپل', 'ارسال نتایج به هسته جهت تولید اسکریپت'],
    description: 'افزونه مرورگر برای مطالعه مستندات تازه ابزارها در صورت نبود دانش قبلی.'
  }
];

export const MultiAgentTopologyDashboard: React.FC<{
  onSelectNodeForTask?: (node: TopologyNode) => void;
  compact?: boolean;
}> = ({ onSelectNodeForTask, compact = false }) => {
  const [nodes, setNodes] = useState<TopologyNode[]>(INITIAL_TOPOLOGY_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-central');
  const [testTaskInput, setTestTaskInput] = useState<string>('');
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState<boolean>(false);
  const [delegationLogs, setDelegationLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('fa-IR')}] [CENTRAL_NODE] هسته ارکستراسیون سطح ۳ راه‌اندازی شد. کلیه ۸ گره شبکه فعال هستند.`,
    `[${new Date().toLocaleTimeString('fa-IR')}] [EMBER-1] گره تخصصی Ember-1 متصل شد (زمان تأخیر: 12ms | ابزارساز محلی).`,
    `[${new Date().toLocaleTimeString('fa-IR')}] [GITHUB_CI] گره گیت‌هاب آماده است (PAT رمزنگاری‌شده در متغیر محیطی تزریق شد).`,
    `[${new Date().toLocaleTimeString('fa-IR')}] [WORKSPACE] نگاشت هسته‌های چندگانه Local Core و Cloud Core فعال گردید.`
  ]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const handleTestDispatch = (nodeId: string) => {
    setIsSimulatingDispatch(true);
    const targetNode = nodes.find(n => n.id === nodeId);
    const nodeName = targetNode?.persianName || nodeId;

    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'processing' } : n));

    setTimeout(() => {
      setDelegationLogs(prev => [
        `[${new Date().toLocaleTimeString('fa-IR')}] [DELEGATE ➔ ${targetNode?.name}] تسک آزمایشی با فرمت تگ ${targetNode?.tagFormat} به گره «${nodeName}» ارجاع گردید. تأخیر: ${targetNode?.latencyMs}ms.`,
        ...prev.slice(0, 15)
      ]);
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'active' } : n));
      setIsSimulatingDispatch(false);
    }, 700);
  };

  return (
    <div className="space-y-4 text-xs select-text font-sans" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-[#12131C] border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-blue-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Workflow className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm sm:text-base">
                  شبکه زنده گره‌های چندعاملی سطح ۳ (Multi-Agent Topology)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Level 3 Orchestrator
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                هسته مرکزی هوش مصنوعی وظایف را دریافت و از طریق بازوهای اجرایی و گره‌های تخصصی توزیع‌شده به انجام می‌رساند
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>۹ گره فعال و آنلاین</span>
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
              میانگین تأخیر: ۱۶ms
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
              صرفه‌جویی گیت‌وی: ۹۱.۴٪
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Graphical Canvas with Central Node and Connected Sub-Nodes */}
      <div className="bg-[#0D0E15] border border-neutral-800 rounded-2xl p-4 shadow-xl overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-4">
          <span className="text-xs font-bold text-neutral-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>نمای گراف زنده توزیع تسک‌ها و پیوندهای ارتباطی</span>
          </span>
          <span className="text-[11px] text-neutral-400">
            برای بازرسی و ارجاع تسک، روی هر گره کلیک فرمایید
          </span>
        </div>

        {/* Central Hub Display */}
        <div className="flex flex-col items-center justify-center my-2 mb-6">
          <div 
            onClick={() => setSelectedNodeId('node-central')}
            className={`cursor-pointer p-4 rounded-3xl border-2 transition-all duration-300 max-w-md w-full text-center relative ${
              selectedNodeId === 'node-central'
                ? 'bg-gradient-to-br from-amber-500/25 via-blue-600/20 to-purple-600/20 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                : 'bg-[#151722] border-amber-500/40 hover:border-amber-400/80 hover:bg-[#1a1c2a]'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] shadow-md uppercase tracking-wider">
              Central Node · رهبر ارکستر
            </div>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <Brain className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-right">
                <h4 className="font-extrabold text-white text-sm">هسته مرکزی ارکستراسیون (Central Orchestrator)</h4>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                  <span className="text-emerald-400 font-bold">● آنلاین</span>
                  <span>|</span>
                  <span>تأخیر: 4ms</span>
                  <span>|</span>
                  <span>کانکشن‌ها: ۸ پیوند فعال</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Distributed Sub-Nodes Grid (Categorized around the core) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {nodes.filter(n => n.id !== 'node-central').map(node => {
            const isSelected = node.id === selectedNodeId;
            let iconEl = <Cpu className="w-4 h-4 text-blue-400" />;
            let borderColor = 'border-neutral-800';
            let activeColor = 'text-blue-400';

            if (node.category === 'internal_model') {
              iconEl = <Sparkles className="w-4 h-4 text-amber-400" />;
              borderColor = 'border-amber-500/30';
              activeColor = 'text-amber-400';
            } else if (node.category === 'github_cicd') {
              iconEl = <GitBranch className="w-4 h-4 text-purple-400" />;
              borderColor = 'border-purple-500/30';
              activeColor = 'text-purple-400';
            } else if (node.category === 'cloud_core') {
              iconEl = <UploadCloud className="w-4 h-4 text-cyan-400" />;
              borderColor = 'border-cyan-500/30';
              activeColor = 'text-cyan-400';
            } else if (node.category === 'windows_agent') {
              iconEl = <Terminal className="w-4 h-4 text-emerald-400" />;
              borderColor = 'border-emerald-500/30';
              activeColor = 'text-emerald-400';
            } else if (node.category === 'web_ext') {
              iconEl = <Globe className="w-4 h-4 text-teal-400" />;
              borderColor = 'border-teal-500/30';
              activeColor = 'text-teal-400';
            } else if (node.category === 'financial') {
              iconEl = <Zap className="w-4 h-4 text-yellow-400" />;
              borderColor = 'border-yellow-500/30';
              activeColor = 'text-yellow-400';
            } else if (node.category === 'network') {
              iconEl = <Activity className="w-4 h-4 text-rose-400" />;
              borderColor = 'border-rose-500/30';
              activeColor = 'text-rose-400';
            }

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 text-right ${
                  isSelected
                    ? 'bg-[#181a28] border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50 scale-[1.01]'
                    : `bg-[#12131C] ${borderColor} hover:bg-[#161724] hover:border-neutral-700`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-neutral-300 border border-neutral-800">
                      {node.latencyMs}ms
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${activeColor}`}>
                        {node.category === 'internal_model' ? 'Ember-1 داخلی' : node.role.split(' ')[0]}
                      </span>
                      <div className="p-1 rounded-lg bg-white/5">{iconEl}</div>
                    </div>
                  </div>

                  <h5 className="font-extrabold text-white text-xs leading-snug">
                    {node.persianName}
                  </h5>
                  <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2">
                    {node.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                    <span className="text-cyan-300 font-bold truncate max-w-[130px]">{node.modelAssigned}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      آماده
                    </span>
                  </div>

                  <div className="bg-[#090a10] px-2 py-1 rounded text-[9px] font-mono text-amber-300 truncate" dir="ltr">
                    {node.tagFormat}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Node Details Inspector & Action Drawer */}
      <div className="bg-[#12131C] border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>شناسنامه و مشخصات گره: {selectedNode.persianName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  {selectedNode.name}
                </span>
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {selectedNode.role} — مدل فعال: <strong className="text-cyan-300 font-mono">{selectedNode.modelAssigned}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestDispatch(selectedNode.id)}
              disabled={isSimulatingDispatch}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulatingDispatch ? 'در حال ارسال فرمان...' : 'تست ارجاع تسک به این گره'}</span>
            </button>
          </div>
        </div>

        {/* Node Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-[#0b0c13] p-3 rounded-xl border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>زمان پاسخ / تأخیر:</span>
            </span>
            <div className="font-mono text-cyan-300 text-sm font-bold">{selectedNode.latencyMs} ms</div>
          </div>

          <div className="bg-[#0b0c13] p-3 rounded-xl border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-400" />
              <span>نرخ پردازش (Throughput):</span>
            </span>
            <div className="font-mono text-purple-300 text-sm font-bold">{selectedNode.throughputReqMin} req/min</div>
          </div>

          <div className="bg-[#0b0c13] p-3 rounded-xl border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>امنیت و پروتکل احراز هویت:</span>
            </span>
            <div className="font-mono text-emerald-300 text-xs font-semibold truncate" title={selectedNode.authProtocol}>
              {selectedNode.authProtocol}
            </div>
          </div>

          <div className="bg-[#0b0c13] p-3 rounded-xl border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-amber-400" />
              <span>تگ ساختاریافته رهگیری:</span>
            </span>
            <div className="font-mono text-amber-300 text-xs font-bold truncate" dir="ltr">
              {selectedNode.tagFormat}
            </div>
          </div>
        </div>

        {/* Capabilities Pills */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-neutral-300 block mb-2">توانمندی‌ها و وظایف تخصیص‌یافته به این گره:</span>
          <div className="flex flex-wrap gap-1.5">
            {selectedNode.capabilities.map((cap, i) => (
              <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-800/90 border border-neutral-700 text-neutral-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{cap}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Delegation Log Stream */}
      <div className="bg-[#0d0e14] border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>لاگ‌های رهگیری زنده ارکستراسیون (Multi-Agent Telemetry Stream)</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-500">Live IPC Protocol</span>
        </div>

        <div className="bg-[#06070a] p-3 rounded-xl border border-neutral-900 font-mono text-[10px] space-y-1.5 max-h-40 overflow-y-auto" dir="ltr">
          {delegationLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed text-neutral-300">
              {log.includes('SUCCESS') ? (
                <span className="text-emerald-400 font-bold">{log}</span>
              ) : log.includes('EMBER') ? (
                <span className="text-amber-300">{log}</span>
              ) : log.includes('GITHUB') ? (
                <span className="text-purple-300">{log}</span>
              ) : (
                <span className="text-cyan-300">{log}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
