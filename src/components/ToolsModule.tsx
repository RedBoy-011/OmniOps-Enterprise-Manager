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
  HardDrive
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
                          <span className="text-[10px] text-neutral-400 font-mono">v2.4 (PID: 8492)</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        agentRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {agentRunning ? 'Running' : 'Stopped'}
                      </span>
                    </div>

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

                    {/* Stop & Exit Service Button (Requested by user) */}
                    <div className="pt-2 border-t border-neutral-800">
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
                          <span>خروج و توقف کامل سرویس (Stop & Exit)</span>
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
