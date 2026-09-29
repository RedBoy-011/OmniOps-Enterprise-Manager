import React, { useState } from 'react';
import { 
  ProjectRuleItem, 
  McpServerConfig, 
  RuleViolation 
} from '../types';
import { generateDoctrinalRulesMarkdown } from '../data/rulesAndMcpData';
import { 
  ShieldCheck, 
  Layers, 
  Terminal, 
  FileCode, 
  Check, 
  Copy, 
  Download, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  BookOpen, 
  Cpu, 
  Lock, 
  GitBranch, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface McpRulesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ProjectRuleItem[];
  onToggleRule: (ruleId: string) => void;
  onAddRule: (rule: ProjectRuleItem) => void;
  onDeleteRule: (ruleId: string) => void;
  mcpServers: McpServerConfig[];
  onTriggerSkillInChat?: (skillTag: string, samplePrompt: string) => void;
}

export const McpRulesManagerModal: React.FC<McpRulesManagerModalProps> = ({
  isOpen,
  onClose,
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule,
  mcpServers,
  onTriggerSkillInChat
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'skills' | 'mcp_hub' | 'simulation'>('rules');
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const [isAddingNewRule, setIsAddingNewRule] = useState<boolean>(false);
  const [newRuleTitle, setNewRuleTitle] = useState<string>('');
  const [newRuleCategory, setNewRuleCategory] = useState<ProjectRuleItem['category']>('security');
  const [newRuleSeverity, setNewRuleSeverity] = useState<ProjectRuleItem['severity']>('critical');
  const [newRulePattern, setNewRulePattern] = useState<string>('');
  const [newRuleDesc, setNewRuleDesc] = useState<string>('');
  const [newRuleAction, setNewRuleAction] = useState<ProjectRuleItem['enforcementAction']>('block_commit');

  // Simulation State
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simScenario, setSimScenario] = useState<'violation_leak' | 'violation_ts' | 'clean_pass'>('violation_leak');
  const [simLogs, setSimLogs] = useState<string[]>([
    '# آماده اجرای پایپ‌لاین ایجنت مهندسی: دسترسی (MCP) → تحلیل (Skills) → کنترل و فیلتر (Rules Gate)'
  ]);
  const [simViolations, setSimViolations] = useState<RuleViolation[]>([]);
  const [simDecision, setSimDecision] = useState<'idle' | 'blocked' | 'passed'>('idle');

  if (!isOpen) return null;

  const handleCopyRules = () => {
    const md = generateDoctrinalRulesMarkdown(rules);
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  const handleDownloadRules = () => {
    const md = generateDoctrinalRulesMarkdown(rules);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim() || !newRulePattern.trim()) return;

    const newRule: ProjectRuleItem = {
      id: `RULE-CUSTOM-${Date.now().toString().slice(-4)}`,
      title: newRuleTitle.trim(),
      category: newRuleCategory,
      severity: newRuleSeverity,
      rulePattern: newRulePattern.trim(),
      description: newRuleDesc.trim() || 'قانون سفارشی دکترینال ثبت‌شده توسط معمار پروژه',
      enforcementAction: newRuleAction,
      isActive: true,
      tags: ['Custom', 'User-Defined']
    };

    onAddRule(newRule);
    setNewRuleTitle('');
    setNewRulePattern('');
    setNewRuleDesc('');
    setIsAddingNewRule(false);
  };

  const handleRunAgentSimulation = async () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimDecision('idle');
    setSimViolations([]);
    setSimLogs([
      '[*] 🚀 شروع فرآیند مهندسی ایجنت: فراخوانی پروتکل کانتکست مدل (MCP Handshake)...',
      '[*] اتصال به سرور محلی: local://mcp-git-daemon (Latency: 1.1ms)',
      '[*] فراخوانی ابزار MCP: git_diff(target_branch="main", staged_only=true)...'
    ]);

    await new Promise((r) => setTimeout(r, 600));

    if (simScenario === 'violation_leak') {
      setSimLogs((prev) => [
        ...prev,
        '[+] دریافت ۵۴ خط کدهای تغییریافته در src/services/authBridge.ts',
        '[*] فعال‌سازی مهارت تخصصی: #LintAndTest و #QualityGate...',
        '[*] ارزیابی کدها در برابر ۶ قانون دکترینال پروژه...',
        '[!] ⛔ نقض قانون بحرانی کشف گردید: [RULE-SEC-01] افشای صفر توکن و رمز',
        '    فایل: src/services/authBridge.ts:42',
        '    محتوا: const CORE_TOKEN = "omni-live-super-secret-key-123456";',
        '[!] اقدام حفاظتی: BLOCK_COMMIT (جلوی کامیت و مرج با موفقیت مسدود شد)',
        '[*] ایجنت در حال تولید تکه‌کد اصلاحی (Fix Patch) بر مبنای متغیرهای محیطی...'
      ]);
      setSimViolations([
        {
          ruleId: 'RULE-SEC-01',
          ruleTitle: 'سیاست افشای صفر توکن و رمز (Zero-Secret Leak Policy)',
          file: 'src/services/authBridge.ts',
          line: 42,
          severity: 'critical',
          explanation: 'رشته توکن به صورت هاردکد در کد قرار دارد. این مقدار در تاریخچه گیت لو خواهد رفت.',
          proposedFix: 'const CORE_TOKEN = process.env.OMNIOPS_CORE_TOKEN || "";'
        }
      ]);
      setSimDecision('blocked');
    } else if (simScenario === 'violation_ts') {
      setSimLogs((prev) => [
        ...prev,
        '[+] دریافت ۲۸ خط کدهای تغییریافته در src/utils/networkParser.ts',
        '[*] فعال‌سازی مهارت تخصصی: #LintAndTest...',
        '[*] اجرای کامپایلر تایپ‌اسکریپت از طریق mcp-terminal (tsc --noEmit)...',
        '[!] ⚠️ اخطار نقض استاندارد: [RULE-CODE-03] استفاده از تایپ any نامشخص',
        '    فایل: src/utils/networkParser.ts:18',
        '    محتوا: function parsePacket(raw: any): any',
        '[*] اقدام حفاظتی: REQUIRE_FIX (نیازمند اصلاح اینترفیس قبل از تایید نهایی)',
        '[*] ایجنت در حال تدوین اینترفیس صریح NetworkPacketData...'
      ]);
      setSimViolations([
        {
          ruleId: 'RULE-CODE-03',
          ruleTitle: 'تایپ‌اسکریپت سفت‌وسخت (Strict TypeScript)',
          file: 'src/utils/networkParser.ts',
          line: 18,
          severity: 'warning',
          explanation: 'استفاده از تایپ any خلاف استانداردهای پروژه است و ایمنی نوع داده را خنثی می‌کند.',
          proposedFix: 'interface NetworkPacketData { id: string; bytes: number; protocol: string; }\nfunction parsePacket(raw: ArrayBuffer): NetworkPacketData'
        }
      ]);
      setSimDecision('blocked');
    } else {
      setSimLogs((prev) => [
        ...prev,
        '[+] دریافت ۸۵ خط کدهای تغییریافته در src/components/ClusterHealthDonutDashboard.tsx',
        '[*] فعال‌سازی مهارت‌های: #LintAndTest و #AutoTest...',
        '[*] اجرای Linter و کامپایلر تایپ‌اسکریپت: ۰ ارور / ۰ هشدار',
        '[*] اجرای ۲۴ تست واحد Vitest: تمامی تست‌ها پاس شدند (100% Passed)',
        '[*] ارزیابی با کلیه قوانین دکترینال: تایید انطباق کامل (All 6 Rules Passed ✓)',
        '[*] دیسیپلین کامیت: پیام کامیت استاندارد تایید شد: "feat(cluster): add concentric donut ring gauges"',
        '🎉 مجوز نهایی کامیت و استقرار توسط ایجنت صادر شد (PASSED ✓)'
      ]);
      setSimViolations([]);
      setSimDecision('passed');
    }

    setSimRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#121319] border border-cyan-500/40 rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-700/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-lg shadow-cyan-950/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>مرکز کنترل سه‌گانه: دسترسی (MCP) + تخصص (Skills) + قوانین (Rules)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Agentic Engineering Gate
                </span>
              </h4>
              <p className="text-xs text-neutral-400">
                تبدیل چت‌روم هوش مصنوعی به عضو جدی تیم فنی با دسترسی استاندارد به کدها، مهارت‌های تخصصی و سد کنترل کیفیت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRules}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="کپی متن مارک‌داون فایل قوانین (.omniops/rules.md)"
            >
              {copiedMarkdown ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{copiedMarkdown ? 'کپی شد!' : 'کپی فایل Rules.md'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadRules}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="دانلود فایل .omniops/rules.md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود Rules.md</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0E0F14] p-1.5 rounded-xl border border-neutral-800 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>۱. قوانین دکترینال پروژه (Doctrinal Rules)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {rules.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'skills'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>۲. اسکیل‌های تخصصی (#LintAndTest)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mcp_hub')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'mcp_hub'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>۳. مرکز سرورهای MCP (Model Context Protocol)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'simulation'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>شبیه‌ساز زنده گیت کیفی (Live Gate Simulator)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: RULES ENGINE */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>قوانین فعال و دکترین‌های معماری پروژه (Active Quality Rules)</span>
                  </h5>
                  <p className="text-xs text-neutral-400">
                    این قوانین مستقیماً توسط ایجنت در چت‌روم بر کدهای تغییریافته اعمال می‌شوند و در صورت تخلف، جلوی کامیت را می‌گیرند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingNewRule(!isAddingNewRule)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNewRule ? 'بستن فرم' : 'افزودن قانون دکترینال جدید'}</span>
                </button>
              </div>

              {/* Add New Rule Form */}
              {isAddingNewRule && (
                <form onSubmit={handleCreateRuleSubmit} className="bg-[#161720] border border-cyan-500/40 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-cyan-300 block">ثبت قانون دکترینال جدید برای مخزن و ایجنت:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-1">عنوان قانون:</label>
                      <input
                        type="text"
                        value={newRuleTitle}
                        onChange={(e) => setNewRuleTitle(e.target.value)}
                        placeholder="مثال: الزام تست واحد برای توابع احراز هویت"
                        className="w-full bg-[#0E0F14] border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">دسته‌بندی:</label>
                      <select
                        value={newRuleCategory}
                        onChange={(e) => setNewRuleCategory(e.target.value as any)}
                        className="w-full bg-[#0E0F14] border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="security">امنیت و افشای اطلاعات (Security)</option>
                        <option value="architecture">معماری و پرفورمنس (Architecture)</option>
                        <option value="testing">تست و پوشش کد (Testing)</option>
                        <option value="code_style">کیفیت کد و تایپ‌اسکریپت (Code Style)</option>
                        <option value="git_commit">پیام‌های کامیت (Git Commit)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">شدت برخورد و گیت:</label>
                      <select
                        value={newRuleAction}
                        onChange={(e) => setNewRuleAction(e.target.value as any)}
                        className="w-full bg-[#0E0F14] border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="block_commit">توقف قطعی و مسدودسازی کامیت (Block Commit)</option>
                        <option value="require_fix">نیازمند اصلاح فوری کد (Require Fix)</option>
                        <option value="warn_only">فقط هشدار در چت (Warn Only)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">الگوی تطبیق (Rule Pattern):</label>
                      <input
                        type="text"
                        value={newRulePattern}
                        onChange={(e) => setNewRulePattern(e.target.value)}
                        placeholder="مثال: No hardcoded tokens, Enforce Vitest mocks"
                        className="w-full bg-[#0E0F14] border border-neutral-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">شرح و علت فنی قانون:</label>
                    <textarea
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      placeholder="توضیح دهید چرا این قانون برای ثبات و امنیت پروژه حیاتی است..."
                      rows={2}
                      className="w-full bg-[#0E0F14] border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewRule(false)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      ذخیره و فعال‌سازی قانون
                    </button>
                  </div>
                </form>
              )}

              {/* Rules Cards Grid */}
              <div className="space-y-2.5">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      rule.isActive
                        ? 'bg-[#15161E] border-neutral-700/80 hover:border-cyan-500/50'
                        : 'bg-[#101014] border-neutral-800/60 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-cyan-300">[{rule.id}]</span>
                        <h6 className="text-xs font-bold text-white">{rule.title}</h6>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          rule.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          rule.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {rule.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono">
                          {rule.enforcementAction === 'block_commit' ? 'مسدودسازی کامیت' : 'الزام اصلاح'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">{rule.description}</p>
                      <div className="text-[10.5px] font-mono text-neutral-400 flex items-center gap-1.5 pt-0.5">
                        <span className="text-cyan-400 font-semibold">الگو:</span>
                        <span>{rule.rulePattern}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onToggleRule(rule.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          rule.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {rule.isActive ? 'فعال ✓' : 'غیرفعال'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
                        title="حذف این قانون"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SPECIALIST SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="bg-[#15161E] border border-cyan-500/30 rounded-xl p-4 space-y-2">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>اسکیل‌های تخصصی یکپارچه مهندسی نرم‌افزار (Specialist Skills Playbook)</span>
                </h5>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  هنگامی که این تگ‌ها را در چت‌روم مرکزی تایپ می‌کنید (مانند <code className="text-cyan-300 font-mono">#LintAndTest</code> یا <code className="text-purple-300 font-mono">#QualityGate</code>)، مدل مسیریاب OmniRoute به صورت خودکار دانش عمیق، استانداردهای کامپایلر و پرامپت‌های کنترلی مربوطه را فعال می‌سازد.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Skill 1: #LintAndTest */}
                <div className="bg-[#12131A] border border-neutral-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>#LintAndTest</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">DevOps</span>
                    </div>
                    <h6 className="text-xs font-bold text-white">ممیزی استاتیک و تست خودکار کدهای سورس</h6>
                    <p className="text-[11.5px] text-neutral-400 mt-1 leading-relaxed">
                      بررسی تایپ‌اسکریپت، کشف خطاهای کامپایل، ایمپورت‌های مفقود و متغیرهای تعریف‌نشده به همراه اجرای پایپ‌لاین تست‌های واحد.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerSkillInChat?.('skill_lint_and_test', '#LintAndTest کدهای تغییریافته اخیر را برای وجود خطاهای تایپ‌اسکریپت و سینتکس ممیزی و تست کن');
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>اجرای این اسکیل در چت‌روم مرکزی</span>
                    <span>←</span>
                  </button>
                </div>

                {/* Skill 2: #AutoTest */}
                <div className="bg-[#12131A] border border-neutral-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-purple-400 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span>#AutoTest</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">Automation</span>
                    </div>
                    <h6 className="text-xs font-bold text-white">تولید خودکار سوئیت تست‌های واحد و یکپارچگی</h6>
                    <p className="text-[11.5px] text-neutral-400 mt-1 leading-relaxed">
                      نگارش سناریوهای تست واحد با Vitest و Jest با پوشش خطاهای مرزی، ماک کردن فراخوانی‌های شبکه و تضمین پوشش بالای ۸۰٪.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerSkillInChat?.('skill_auto_test', '#AutoTest برای تابع‌های مدیریت زیرساخت سرور و توکن‌ها تست جامع Vitest بنویس');
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>اجرای این اسکیل در چت‌روم مرکزی</span>
                    <span>←</span>
                  </button>
                </div>

                {/* Skill 3: #DocGen */}
                <div className="bg-[#12131A] border border-neutral-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-blue-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-blue-400 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span>#DocGen</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">System</span>
                    </div>
                    <h6 className="text-xs font-bold text-white">مستندسازی خودکار و نگارش داکیومنت فنی</h6>
                    <p className="text-[11.5px] text-neutral-400 mt-1 leading-relaxed">
                      تولید قراردادهای API، جدول پارامترها، کامنت‌های ساختاریافته JSDoc و به‌روزرسانی کتابچه فنی همگام با کدهای جدید.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerSkillInChat?.('skill_doc_gen', '#DocGen مستندات جامع برای معماری سه‌گانه MCP + Skills + Rules تدوین کن');
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>اجرای این اسکیل در چت‌روم مرکزی</span>
                    <span>←</span>
                  </button>
                </div>

                {/* Skill 4: #QualityGate */}
                <div className="bg-[#12131A] border border-neutral-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-amber-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>#QualityGate</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">Security</span>
                    </div>
                    <h6 className="text-xs font-bold text-white">کنترل دکترینال و صدور مجوز کامیت</h6>
                    <p className="text-[11.5px] text-neutral-400 mt-1 leading-relaxed">
                      بررسی سخت‌گیرانه با Rules پروژه، مسدودسازی نشت توکن‌ها، کنترل Conventional Commit و صدور تصمیم PASSED یا BLOCKED.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerSkillInChat?.('skill_quality_gate', '#QualityGate کدهای آماده کامیت را ارزیابی کن؛ آیا مجاز به تایید و مرج در مخزن هستند؟');
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>اجرای این اسکیل در چت‌روم مرکزی</span>
                    <span>←</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MCP HUB */}
          {activeTab === 'mcp_hub' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="bg-[#15161E] border border-cyan-500/30 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>وضعیت سرورهای پروتکل کانتکست مدل (Model Context Protocol Daemon Hub)</span>
                  </h5>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ۴ سرور MCP متصل و آماده
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  پروتکل استاندارد MCP به ایجنت‌ها اجازه می‌دهد بدون حدس زدن، به صورت امن و ساختاربندی‌شده تفاوت‌های کد (Git Diff)، لاگ‌های سیستمی و فایل‌ها را از ابزارهای بومی دریافت کنند.
                </p>
              </div>

              {/* MCP Servers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {mcpServers.map((srv) => (
                  <div key={srv.id} className="bg-[#12131A] border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{srv.name}</span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                            {srv.transport.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{srv.endpoint}</div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {srv.latencyMs}ms
                      </span>
                    </div>

                    <div>
                      <span className="text-[10.5px] text-neutral-400 block mb-1.5 font-semibold">ابزارهای در دسترس ایجنت:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {srv.toolsList.map((t) => (
                          <span
                            key={t.name}
                            className="text-[10px] px-2 py-1 rounded bg-[#181922] text-cyan-300 font-mono border border-neutral-700/80 flex items-center gap-1"
                            title={t.description}
                          >
                            <FileCode className="w-3 h-3 text-cyan-400" />
                            <span>{t.name}()</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SIMULATION SANDBOX */}
          {activeTab === 'simulation' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="bg-[#15161E] border border-purple-500/30 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-purple-400" />
                      <span>شبیه‌ساز تعاملی رفتار ایجنت با کدهای تغییریافته (Agent Quality Gate Simulation)</span>
                    </h5>
                    <p className="text-xs text-neutral-400">
                      سناریوی مدنظر را انتخاب کنید و ببینید چگونه ایجنت با خواندن کد از طریق MCP، مهارت #LintAndTest را اجرا و با Rules جلوی کامیت را می‌گیرد:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={simScenario}
                      onChange={(e) => setSimScenario(e.target.value as any)}
                      className="bg-[#0E0F14] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="violation_leak">سناریوی ۱: نشت توکن محرمانه (مسدودسازی کامیت)</option>
                      <option value="violation_ts">سناریوی ۲: خطای تایپ‌اسکریپت و استفاده از any</option>
                      <option value="clean_pass">سناریوی ۳: کدهای بدون خطا و پاس شدن ۱۰۰٪ قوانین</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleRunAgentSimulation}
                      disabled={simRunning}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      <Play className={`w-3.5 h-3.5 ${simRunning ? 'animate-spin' : ''}`} />
                      <span>{simRunning ? 'در حال تحلیل...' : 'اجرای سناریو'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Terminal Logs Window */}
              <div className="bg-[#0A0B0E] border border-neutral-800 rounded-xl overflow-hidden font-mono text-xs">
                <div className="bg-[#14151D] px-3.5 py-2 border-b border-neutral-800 flex items-center justify-between text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>Agent Quality Gate Execution Pipeline</span>
                  </div>
                  {simDecision === 'blocked' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                      ⛔ COMMIT BLOCKED
                    </span>
                  )}
                  {simDecision === 'passed' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                      ✓ PASSED (APPROVED)
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-1.5 max-h-[220px] overflow-y-auto">
                  {simLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`${
                        log.includes('⛔') || log.includes('BLOCKED')
                          ? 'text-rose-400 font-bold'
                          : log.includes('✓') || log.includes('🎉')
                          ? 'text-emerald-400 font-bold'
                          : log.includes('⚠️')
                          ? 'text-amber-400'
                          : log.includes('🚀') || log.includes('MCP')
                          ? 'text-cyan-300'
                          : 'text-neutral-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Violations & Proposed Fix Card if any */}
              {simViolations.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-4 space-y-2.5 animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>گزارش نقض قوانین دکترینال و راهکار اصلاحی ایجنت:</span>
                  </div>
                  {simViolations.map((v, i) => (
                    <div key={i} className="space-y-1.5 text-xs">
                      <div className="text-neutral-200">
                        قانون نقض‌شده: <span className="text-rose-300 font-bold font-mono">[{v.ruleId}] {v.ruleTitle}</span>
                      </div>
                      <div className="text-neutral-400 text-[11.5px]">{v.explanation}</div>
                      <div className="bg-black/60 p-2.5 rounded-lg border border-neutral-800 text-[11px] font-mono text-emerald-300 text-left dir-ltr">
                        <div className="text-neutral-500 text-[10px] mb-1"># Proposed Fix Patch:</div>
                        <pre className="whitespace-pre-wrap">{v.proposedFix}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 shrink-0 text-xs">
          <div className="text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>پروتکل MCP و موتور قوانین بر روی روتر OmniRoute و کلیه سشن‌های چت مرکزی یکپارچه است.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
