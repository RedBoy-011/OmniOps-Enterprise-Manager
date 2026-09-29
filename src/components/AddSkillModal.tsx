import React, { useState } from 'react';
import { SkillItem, AiModel } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Network, 
  Terminal, 
  Shield, 
  Cpu, 
  Activity, 
  BookOpen, 
  RefreshCw, 
  CheckCircle2,
  X
} from 'lucide-react';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSkill: (skill: SkillItem) => void;
  availableModels: AiModel[];
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onSaveSkill,
  availableModels
}) => {
  const [activeTab, setActiveTab] = useState<'ai_dialog' | 'editor'>('ai_dialog');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    availableModels[0]?.model_id || 'gemini-2.5-flash'
  );

  // AI Architect Chat state
  const [dialogInput, setDialogInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogMessages, setDialogMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `سلام! من **«طراح هوشمند مهارت‌های سازمانی (AI Skill Architect)»** هستم.
لطفاً حوزه، تخصص یا سناریویی که می‌خواهید هوش مصنوعی در آن مهارت داشته باشد را به زبان ساده توضیح دهید (مثلاً: *«می‌خواهم یک مهارت برای مانیتورینگ ترافیک شبکه با پروتکل NetFlow و کشف رفتارهای ناهنجار امنیتی ایجاد کنم»*).

من بر اساس توضیحات شما، **سرفصل‌های دانش تخصصی**، **دستورالعمل‌های سیستمی (System Prompt)** و **نمونه سناریوها** را تدوین و آماده ویراستاری می‌کنم.`
    }
  ]);

  // Skill Form State (Synced with AI suggestions)
  const [skillId, setSkillId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState<'network' | 'system' | 'security' | 'devops' | 'automation'>('network');
  const [icon, setIcon] = useState('Network');
  const [description, setDescription] = useState('');
  const [domainKnowledge, setDomainKnowledge] = useState<string[]>([]);
  const [newKnowledgeItem, setNewKnowledgeItem] = useState('');
  const [systemPromptInjection, setSystemPromptInjection] = useState('');
  const [sampleQueries, setSampleQueries] = useState<string[]>([]);
  const [newSampleQuery, setNewSampleQuery] = useState('');

  if (!isOpen) return null;

  const handleSendPromptToAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dialogInput.trim() || isGenerating) return;

    const userText = dialogInput.trim();
    setDialogInput('');
    setDialogMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsGenerating(true);

    // Simulate AI skill extraction and blueprint synthesis
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const lower = userText.toLowerCase();
    let generatedName = 'تخصص سازمانی جدید';
    let generatedCat: 'network' | 'system' | 'security' | 'devops' | 'automation' = 'network';
    let generatedIcon = 'Network';
    let generatedDesc = '';
    let generatedKnowledge: string[] = [];
    let generatedPrompt = '';
    let generatedQueries: string[] = [];

    if (lower.includes('ddos') || lower.includes('امنیت') || lower.includes('حمله') || lower.includes('فایروال')) {
      generatedName = 'دفاع سایبری و مقابله با حملات DDoS و اسکن پورت';
      generatedCat = 'security';
      generatedIcon = 'Shield';
      generatedDesc = 'تزریق دانش تخصصی ایمن‌سازی سرورها و روترها در برابر حملات DDoS لایه ۳، ۴ و ۷ و پیاده‌سازی بلک‌لیست خودکار';
      generatedKnowledge = [
        'معماری تفکیک حملات حجمی (SYN Flood, UDP Flood, ICMP Flood) از ترافیک نرمال',
        'پیاده‌سازی قوانین Connection Tracking و شناسایی IPهای با نرخ درخواست غیرطبیعی',
        'استفاده از مکانیزم‌های SYN Cookies و مسدودسازی خودکار آدرس‌های مشکوک در فایروال',
        'پیکربندی Rate Limiting در وب‌سرورهای Nginx و Reverse Proxyها'
      ];
      generatedPrompt = `شما مجهز به دانش فوق تخصصی "دفاع در برابر حملات DDoS و کاهش سطح حمله" هستید.
دستورالعمل‌ها:
1. در پاسخ به سناریوهای نفوذ، همواره روش‌های کاهش آسیب و فیلترینگ خودکار را پیشنهاد دهید.
2. قواعد فایروال لینوکس (iptables/nftables) و میکروتیک را با بهینه‌ترین مصرف پردازنده بنویسید.
3. تفکیک ترافیک تجاری مجاز از حملات ربات‌ها را در نظر بگیرید.`;
      generatedQueries = [
        'قوانین فایروال میکروتیک برای بلاک کردن خودکار اسکن‌کننده‌های پورت SSH و Winbox',
        'تنظیم محافظت در برابر SYN Flood با iptables در اوبونتو سرور',
        'روش پیکربندی Fail2ban برای محافظت از اندپوینت‌های وب سازمانی'
      ];
    } else if (lower.includes('بک‌آپ') || lower.includes('backup') || lower.includes('پشتیبان')) {
      generatedName = 'استراتژی و اتوماسیون جامع پشتیبان‌گیری (Enterprise Backup)';
      generatedCat = 'system';
      generatedIcon = 'Terminal';
      generatedDesc = 'تزریق الگوهای استاندارد بک‌آپ‌گیری 3-2-1، اتوماسیون با اسکریپت‌های رمزنگاری‌شده و ذخیره‌سازی ابری/آفلاین';
      generatedKnowledge = [
        'قانون استاندارد پشتیبان‌گیری ۳-۲-۱ (سه نسخه، دو رسانه متفاوت، یک نسخه آفلاین/خارج از سایت)',
        'اتوماسیون پشتیبان‌گیری دیتابیس‌های PostgreSQL، MySQL و فایل‌های پیکربندی سیستم',
        'رمزنگاری فایل‌های بک‌آپ با الگوریتم AES-256 قبل از انتقال به استوریج',
        'تست دوره‌ای بازیابی (Disaster Recovery Simulation) و اعتبارسنجی سلامت آرشیوها'
      ];
      generatedPrompt = `شما به عنوان "معمار ارشد پشتیبان‌گیری و تداوم کسب‌وکار (BCDR)" عمل می‌کنید.
دستورالعمل‌ها:
1. در تمام راهکارها، مقادیر RPO (حداکثر داده از دست رفته) و RTO (زمان بازیابی) را ارزیابی کنید.
2. اسکریپت‌های Bash و PowerShell پشتیبان‌گیری باید دارای اعتبارسنجی هش (SHA256) و گزارش‌دهی ایمیلی باشند.`;
      generatedQueries = [
        'اسکریپت کامل پشتیبان‌گیری خودکار دیتابیس همراه با فشرده‌سازی و انتقال به سرور پشتیبان',
        'چک‌لیست تدوین سند Disaster Recovery و زمان‌بندی تست‌های بازیابی',
        'روش امن نگهداری نسخه‌های بک‌آپ دوره‌ای کانتینرهای داکر و ولوم‌ها'
      ];
    } else {
      generatedName = `تخصص: ${userText.slice(0, 35)}...`;
      generatedCat = 'automation';
      generatedIcon = 'Activity';
      generatedDesc = `تزریق الگوها، دیسیپلین و دانش فنی مورد نیاز برای: ${userText}`;
      generatedKnowledge = [
        `تحلیل جامع و مدل‌سازی استاندارد مسائل مرتبط با ${userText.slice(0, 30)}`,
        'اجرای بهترین شیوه‌های بین‌المللی (Best Practices) در پیکربندی و اجرا',
        'کاهش زمان خطایابی و بهینه‌سازی منابع پردازشی و شبکه',
        'مستندسازی و استخراج چک‌لیست‌های اعتبارسنجی عملیاتی'
      ];
      generatedPrompt = `شما دارای تخصص ارشد در حوزه "${userText}" هستید.
دستورالعمل‌ها:
1. در ارائه راهکارها از رویکرد تحلیلی، کدهای بهینه و استانداردهای صنعتی استفاده نمایید.
2. مخاطرات احتمالی تغییرات را پیش از اجرا یادآور شوید.`;
      generatedQueries = [
        `راهنمای گام‌به‌گام پیاده‌سازی و اجرای ${userText.slice(0, 30)}`,
        'عیب‌یابی خطاهای رایج در این سناریو و روش‌های رفع گلوگاه‌ها',
        'نمونه کدهای بهینه و کانفیگ پیشنهادی جهت استفاده در سیستم'
      ];
    }

    const newId = `custom_skill_${Date.now()}`;
    setSkillId(newId);
    setSkillName(generatedName);
    setCategory(generatedCat);
    setIcon(generatedIcon);
    setDescription(generatedDesc);
    setDomainKnowledge(generatedKnowledge);
    setSystemPromptInjection(generatedPrompt);
    setSampleQueries(generatedQueries);

    const assistantResponse = `طرح مهارت **«${generatedName}»** با موفقیت تدوین شد! 🎯

• **دسته‌بندی:** ${generatedCat}
• **تعداد سرفصل‌های دانشی:** ${generatedKnowledge.length} مورد
• **دستورالعمل سیستمی و نمونه پرسش‌ها:** تکمیل گردید.

اکنون می‌توانید در تب **«ویراستاری و جزییات مهارت»** مقادیر را تغییر دهید یا در صورت رضایت، دکمه **«ثبت و افزودن مهارت به سامانه»** را کلیک فرمایید.`;

    setDialogMessages((prev) => [...prev, { role: 'assistant', content: assistantResponse }]);
    setIsGenerating(false);
  };

  const handleAddKnowledgePoint = () => {
    if (newKnowledgeItem.trim()) {
      setDomainKnowledge([...domainKnowledge, newKnowledgeItem.trim()]);
      setNewKnowledgeItem('');
    }
  };

  const handleRemoveKnowledgePoint = (index: number) => {
    setDomainKnowledge(domainKnowledge.filter((_, i) => i !== index));
  };

  const handleAddSampleQuery = () => {
    if (newSampleQuery.trim()) {
      setSampleQueries([...sampleQueries, newSampleQuery.trim()]);
      setNewSampleQuery('');
    }
  };

  const handleRemoveSampleQuery = (index: number) => {
    setSampleQueries(sampleQueries.filter((_, i) => i !== index));
  };

  const handleFinalSave = () => {
    if (!skillName.trim()) {
      alert('لطفاً عنوان مهارت را وارد کنید یا از طریق گفتگو با هوش مصنوعی تدوین نمایید.');
      return;
    }

    const finalSkill: SkillItem = {
      id: skillId || `skill_${Date.now()}`,
      name: skillName,
      category,
      icon,
      description: description || `مهارت سازمانی در حوزه ${skillName}`,
      domainKnowledge: domainKnowledge.length > 0 ? domainKnowledge : ['اصول و استانداردهای این حوزه تخصصی'],
      systemPromptInjection: systemPromptInjection || `شما به عنوان متخصص ارشد در حوزه ${skillName} پاسخ می‌دهید.`,
      sampleQueries: sampleQueries.length > 0 ? sampleQueries : [`روش پیاده‌سازی و استانداردهای ${skillName}`]
    };

    onSaveSkill(finalSkill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-[#121216] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                طراحی و افزودن مهارت تخصصی جدید (AI Skill Creator)
              </h3>
              <p className="text-xs text-neutral-400">
                گفتگو با هوش مصنوعی جهت تدوین سرفصل‌های دانشی و دستورالعمل‌های سیستمی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader: Model Selector & View Mode Switcher */}
        <div className="px-5 py-3 border-b border-neutral-800 bg-[#16161B] flex flex-wrap items-center justify-between gap-3">
          {/* Active Model Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">موتور هوش مصنوعی طراح:</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-[#101014] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {availableModels.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.display_name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#101014] border border-neutral-800 rounded-xl">
            <button
              onClick={() => setActiveTab('ai_dialog')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'ai_dialog'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>گفتگوی هوشمند با هوش مصنوعی</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویراستاری و جزییات مهارت ({skillName ? 'آماده' : 'خالی'})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'ai_dialog' ? (
            <div className="flex flex-col h-[460px] justify-between">
              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {dialogMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md ${
                        isUser
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#18181D] border border-neutral-700 text-blue-400'
                      }`}>
                        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-[#18181D] border border-neutral-800 text-neutral-200 rounded-bl-sm whitespace-pre-wrap'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {isGenerating && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#18181D] border border-neutral-700 flex items-center justify-center text-blue-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 bg-[#18181D] border border-neutral-800 rounded-2xl text-xs text-neutral-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <span>در حال تحلیل موضوع و تدوین سرفصل‌های دانشی و پرامپت سیستمی...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendPromptToAI} className="pt-3 border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="text"
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  placeholder="شرح مهارت یا سناریوی مد نظرتان را اینجا بنویسید (مثلاً: مهارت اتوماسیون با وب‌هوک و امنیت شبکه)..."
                  className="flex-1 bg-[#101014] border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!dialogInput.trim() || isGenerating}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-600/20 shrink-0"
                >
                  <span>تدوین با AI</span>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </button>
              </form>
            </div>
          ) : (
            /* Manual Blueprint Editor Form */
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    عنوان مهارت (Skill Title)
                  </label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="مثال: دفاع سایبری و مقابله با حملات DDoS"
                    className="w-full bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    دسته‌بندی مهارت (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="network">شبکه و روتینگ (Network)</option>
                    <option value="security">امنیت و فارنزیک (Security)</option>
                    <option value="system">سیستم و سیستم‌عامل (System)</option>
                    <option value="devops">دوآپس و داکر (DevOps)</option>
                    <option value="automation">اتوماسیون و ابزارها (Automation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  توضیحات کوتاه مهارت
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح خلاصه‌ای از حوزه دانشی و کارکرد این مهارت در سیستم..."
                  className="w-full bg-[#101014] border border-neutral-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Domain Knowledge Pillars */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  سرفصل‌های دانش تخصصی (Domain Knowledge Pillars):
                </label>
                <div className="space-y-2 mb-2.5">
                  {domainKnowledge.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-[#18181D] rounded-xl border border-neutral-800 text-xs">
                      <span className="text-neutral-200">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKnowledgePoint(idx)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKnowledgeItem}
                    onChange={(e) => setNewKnowledgeItem(e.target.value)}
                    placeholder="افزودن سرفصل دانشی جدید..."
                    className="flex-1 bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKnowledgePoint}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium border border-neutral-700"
                  >
                    افزودن
                  </button>
                </div>
              </div>

              {/* System Prompt Injection Directives */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  دستورالعمل سیستمی تزریقی به هوش مصنوعی (System Prompt Directives)
                </label>
                <textarea
                  rows={4}
                  value={systemPromptInjection}
                  onChange={(e) => setSystemPromptInjection(e.target.value)}
                  placeholder="دستورالعمل‌های رفتاری، اصول تحلیل و استانداردهایی که هوش مصنوعی در حین چت باید رعایت کند..."
                  className="w-full bg-[#101014] border border-neutral-700 rounded-xl p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Sample Queries */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  نمونه پرسش‌ها و سناریوهای آزمایشی
                </label>
                <div className="space-y-1.5 mb-2.5">
                  {sampleQueries.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#18181D] rounded-xl border border-neutral-800 text-xs">
                      <span className="text-neutral-300">{q}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSampleQuery(idx)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSampleQuery}
                    onChange={(e) => setNewSampleQuery(e.target.value)}
                    placeholder="افزودن سناریوی نمونه جدید..."
                    className="flex-1 bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSampleQuery}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium border border-neutral-700"
                  >
                    افزودن
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-[#121216] flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            {skillName ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مهارت آماده ثبت: {skillName}</span>
              </span>
            ) : (
              <span>هنوز مهارتی تعریف نشده است.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition-colors"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleFinalSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>ثبت و افزودن مهارت به سامانه</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
