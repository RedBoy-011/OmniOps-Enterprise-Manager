import React, { useState, useRef, useEffect } from 'react';
import { 
  Laptop, 
  Terminal, 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  Check, 
  X, 
  Copy, 
  Paperclip, 
  Upload, 
  Maximize2, 
  Minimize2, 
  Pin, 
  PinOff,
  User as UserIcon, 
  Users, 
  Flame, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { User, AiModel, ChatAttachment } from '../types';

export interface DesktopOverlayCompanionProps {
  currentUser: User | null;
  onSwitchUser?: (newUser: User) => void;
  availableModels?: AiModel[];
  onExecuteStructuredAction?: (type: 'WIN_AGENT' | 'WEB_EXT', action: string, command: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface StructuredCommandProposal {
  id: string;
  type: 'WIN_AGENT' | 'WEB_EXT';
  action: string;
  command: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  timestamp: string;
}

export const DesktopOverlayCompanion: React.FC<DesktopOverlayCompanionProps> = ({
  currentUser,
  onSwitchUser,
  availableModels = [],
  onExecuteStructuredAction,
  isOpen,
  onClose
}) => {
  // Floating Window States
  const [isPinned, setIsPinned] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'commands' | 'session_isolation' | 'install'>('chat');

  // Multi-User Windows Session Isolation Simulator (Arman vs Masood)
  const [simulatedWindowsUser, setSimulatedWindowsUser] = useState<'arman' | 'masood'>(
    currentUser?.username === 'user' ? 'masood' : 'arman'
  );
  const [sessionToken, setSessionToken] = useState<string>('agt_jwt_arm890x1f92e');
  const [sessionStatus, setSessionStatus] = useState<'isolated_active' | 'session_switched' | 'auth_required'>('isolated_active');

  // Approval Protocol State: 'ask_approval' (Step-by-Step) vs 'auto_pilot' (Auto execution)
  const [approvalProtocol, setApprovalProtocol] = useState<'ask_approval' | 'auto_pilot'>('ask_approval');

  // Chat & Command State
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('ember-1');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; text: string; time: string; tag?: string }>>([
    {
      role: 'assistant',
      text: 'ایجنت دسکتاپ ویندوزی OmniOps (System Tray Overlay) فعال است. فرامین با پروتکل ایزوله نشست کاربری اجرا می‌شوند.',
      time: '12:00'
    }
  ]);

  // File Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Approval Queue (Pending proposals)
  const [proposals, setProposals] = useState<StructuredCommandProposal[]>([
    {
      id: 'prop-1',
      type: 'WIN_AGENT',
      action: 'SHELL',
      command: 'Get-Service -Name "OmniAgent*" | Restart-Service -Force',
      description: 'راه‌اندازی مجدد سرویس پردازشی ایجنت در سشن اختصاصی ویندوز',
      status: 'pending',
      timestamp: 'هم‌اکنون'
    },
    {
      id: 'prop-2',
      type: 'WEB_EXT',
      action: 'NAVIGATE',
      command: 'https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/pulls',
      description: 'بررسی پول‌ریکوئست‌های ارسالی با افزونه مرورگر کروم',
      status: 'pending',
      timestamp: '۲ دقیقه قبل'
    }
  ]);

  const [copiedInstallCmd, setCopiedInstallCmd] = useState(false);

  // Sync simulated user when currentUser changes
  useEffect(() => {
    if (currentUser?.username === 'user') {
      setSimulatedWindowsUser('masood');
      setSessionToken('agt_jwt_masood_std_4421');
    } else {
      setSimulatedWindowsUser('arman');
      setSessionToken('agt_jwt_arm890x1f92e');
    }
  }, [currentUser]);

  // Handle Windows User Switch (Arman vs Masood)
  const handleSwitchWindowsSession = (targetUser: 'arman' | 'masood') => {
    setSimulatedWindowsUser(targetUser);
    setSessionStatus('session_switched');

    // Simulate session teardown & rebuild for isolation
    setTimeout(() => {
      if (targetUser === 'masood') {
        setSessionToken('agt_jwt_masood_std_4421');
        setSessionStatus('isolated_active');
        if (onSwitchUser) {
          onSwitchUser({
            id: 3,
            username: 'user',
            email: 'operator@omniops.internal',
            role: 'User',
            full_name: 'مسعود حسینی (کارشناس عادی)',
            agent_connected: true,
            active_tools_count: 2,
            allowed_tools: ['t-screen', 't-hid'],
            active_tools_list: ['Screen Grabber', 'Virtual HID']
          });
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            text: '⚠️ تغییر نشست ویندوز: کاربر "مسعود" (کاربر عادی) لاگین کرد. نشست آرمان منقضی و دسترسی‌های ادمین قفل شدند. توکن در %AppData%\\masood ایزوله شد.',
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setSessionToken('agt_jwt_arm890x1f92e');
        setSessionStatus('isolated_active');
        if (onSwitchUser) {
          onSwitchUser({
            id: 1,
            username: 'superadmin',
            email: 'director@omniops.internal',
            role: 'SuperAdmin',
            full_name: 'آرمان فغانی (مدیر کل سیستم)',
            agent_connected: true,
            active_tools_count: 8,
            allowed_tools: ['t-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm', 't-hid', 't-screen', 't-terminal'],
            active_tools_list: ['MikroTik Winbox', 'Wireshark', 'WinRM Remote', 'Nmap', 'PuTTY CLI', 'Terminal Root']
          });
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            text: '🔒 بازگشت به نشست "آرمان" (SuperAdmin): توکن اختصاصی از HKCU و %AppData%\\arman بارگذاری شد و ابزارهای سطح ۳ فعال شدند.',
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }, 450);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newAtts: ChatAttachment[] = files.map((f) => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : 'file',
      mimeType: f.type || 'application/octet-stream',
      size: f.size
    }));
    setAttachments((prev) => [...prev, ...newAtts]);
  };

  // Execute Proposal (Approval Protocol)
  const handleApproveProposal = (propId: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === propId) {
          if (onExecuteStructuredAction) {
            onExecuteStructuredAction(p.type, p.action, p.command);
          }
          return { ...p, status: 'executed' };
        }
        return p;
      })
    );
  };

  const handleRejectProposal = (propId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status: 'rejected' } : p))
    );
  };

  // Send Chat message
  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    const userMsg = inputText.trim();
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { role: 'user', text: userMsg, time: timeStr }]);
    setInputText('');
    setAttachments([]);

    // Check if message demands structured action
    setTimeout(() => {
      if (userMsg.includes('گیت') || userMsg.includes('git') || userMsg.includes('پروسه') || userMsg.includes('دستور')) {
        const newProp: StructuredCommandProposal = {
          id: `prop-${Date.now()}`,
          type: 'WIN_AGENT',
          action: 'SHELL',
          command: '[WIN_AGENT:SHELL:git status && git log -n 1 --oneline]',
          description: 'بررسی وضعیت برنچ و آخرین کامیت مخزن محلی',
          status: approvalProtocol === 'auto_pilot' ? 'executed' : 'pending',
          timestamp: 'لحظاتی پیش'
        };

        setProposals((prev) => [newProp, ...prev]);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: approvalProtocol === 'auto_pilot'
              ? `🚀 حالت اجرای خودکار (Auto-Pilot): فرمان [WIN_AGENT:SHELL:git status] بدون وقفه در سشن ${simulatedWindowsUser} اجرا گردید.`
              : `🛡️ پروتکل تأییدیه گام‌به‌گام فعال است: فرمان سیستمی زیر تولید گردید و منتظر تأیید دستی شما روی دسکتاپ است:\n\n[WIN_AGENT:SHELL:git status]`,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            tag: '[WIN_AGENT:SHELL]'
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `پاسخ توسط مدل تخصصی عامل‌محور (${selectedModel === 'ember-1' ? 'Ember-1 Agentic' : selectedModel}) پردازش شد. ارتباط با نشست ایزوله ویندوز برقرار است.`,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 font-sans ${
        isMinimized 
          ? 'bottom-4 left-4 w-72 h-14' 
          : 'bottom-4 left-4 sm:left-6 w-96 sm:w-[420px] max-h-[88vh] h-[640px]'
      }`}
      dir="rtl"
    >
      {/* Floating Glassmorphism Container with Swiss Dark styling */}
      <div 
        className="w-full h-full bg-[#141418]/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden text-zinc-100"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Title Bar simulating Windows Dynamic Bar & Tray Companion */}
        <div className="h-11 px-3.5 bg-[#1b1b22] border-b border-zinc-800 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-extrabold shadow-sm">
              Ω
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">OmniOps Tray Companion</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
                v3.4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'حالت شناور آزاد' : 'پین شده روی دسکتاپ'}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {isPinned ? <Pin className="w-3.5 h-3.5 text-sky-400" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized View Header */}
        {isMinimized ? (
          <div className="flex-1 px-3 flex items-center justify-between text-xs cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">نشست فعال: @{simulatedWindowsUser}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">کلیک جهت باز شدن</span>
          </div>
        ) : (
          <>
            {/* Active User Session & Isolation Status Strip */}
            <div className="px-3.5 py-2 bg-[#18181f] border-b border-zinc-800/90 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">
                  کاربر ویندوز: <strong className="text-white font-mono">{simulatedWindowsUser}</strong>
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  simulatedWindowsUser === 'arman'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {simulatedWindowsUser === 'arman' ? 'SuperAdmin' : 'Standard'}
                </span>
              </div>

              {/* Fast User Switch Simulator Button */}
              <button
                type="button"
                onClick={() => handleSwitchWindowsSession(simulatedWindowsUser === 'arman' ? 'masood' : 'arman')}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-300 flex items-center gap-1 transition-all border border-zinc-700"
                title="تغییر نشست ویندوز بین آرمان و مسعود جهت تست ایزوله‌سازی توکن"
              >
                <Users className="w-3 h-3" />
                <span>سوییچ به {simulatedWindowsUser === 'arman' ? 'مسعود' : 'آرمان'}</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-zinc-800 text-xs shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'chat'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  چت سریع
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('commands')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === 'commands'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>فرامین و تایید</span>
                  {proposals.filter((p) => p.status === 'pending').length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-extrabold text-[9px] flex items-center justify-center">
                      {proposals.filter((p) => p.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('session_isolation')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'session_isolation'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ایزوله‌سازی نشست
                </button>
              </div>

              {/* Approval Protocol Toggle Pill */}
              <button
                type="button"
                onClick={() => setApprovalProtocol(approvalProtocol === 'ask_approval' ? 'auto_pilot' : 'ask_approval')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 border transition-all ${
                  approvalProtocol === 'ask_approval'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
                title="تغییر پروتکل تأییدیه: گام‌به‌گام در برابر اجرای خودکار"
              >
                {approvalProtocol === 'ask_approval' ? <ShieldAlert className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{approvalProtocol === 'ask_approval' ? 'تأیید گام‌به‌گام' : 'Auto-Pilot'}</span>
              </button>
            </div>

            {/* TAB CONTENT 1: CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Message Stream */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed ${
                        m.role === 'user'
                          ? 'mr-auto bg-sky-600/20 border border-sky-500/40 text-sky-100 text-right'
                          : m.role === 'system'
                          ? 'mx-auto w-full bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]'
                          : 'ml-auto bg-[#1a1a24] border border-zinc-800 text-zinc-200 text-right'
                      }`}
                    >
                      {m.tag && (
                        <div className="text-[9px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          <span>{m.tag}</span>
                        </div>
                      )}
                      <div>{m.text}</div>
                      <div className="text-[9px] text-zinc-500 mt-1 font-mono text-left">{m.time}</div>
                    </div>
                  ))}

                  {/* Drag and drop indicator overlay */}
                  {isDragging && (
                    <div className="p-4 border-2 border-dashed border-sky-400 bg-sky-500/10 rounded-xl text-center text-xs text-sky-300 animate-pulse">
                      رها کردن فایل برای ارسال مستقیم به ایجنت دسکتاپ...
                    </div>
                  )}
                </div>

                {/* Attachments preview */}
                {attachments.length > 0 && (
                  <div className="px-3 py-1.5 bg-[#181820] border-t border-zinc-800 flex items-center gap-2 overflow-x-auto text-[11px]">
                    {attachments.map((att) => (
                      <span key={att.id} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono flex items-center gap-1 shrink-0">
                        <Paperclip className="w-3 h-3 text-sky-400" />
                        <span>{att.name}</span>
                        <button type="button" onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))} className="text-zinc-500 hover:text-white">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-2.5 bg-[#17171e] border-t border-zinc-800 shrink-0 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>مدل انتخابی:</span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-[#121217] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 font-mono text-[10px] focus:outline-none"
                      >
                        <option value="ember-1">Ember-1 (مدل عامل‌محور داخلی)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gpt-4o">OpenAI GPT-4o</option>
                      </select>
                    </div>

                    <span className="text-zinc-500 font-mono">درگ‌وان‌دراپ فایل فعال</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) handleFiles(Array.from(e.target.files));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      title="پیوست فایل"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="پیام یا فرمان (مثال: بررسی وضعیت گیت)..."
                      className="flex-1 bg-[#121216] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                    />

                    <button
                      type="button"
                      onClick={handleSend}
                      className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md shadow-sky-600/30"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: COMMAND PROPOSALS & APPROVAL QUEUE */}
            {activeTab === 'commands' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block text-xs">وضعیت پروتکل تأییدیه</span>
                    <span className="text-[10px] text-zinc-400">
                      {approvalProtocol === 'ask_approval'
                        ? 'تأیید گام‌به‌گام (Ask for Approval): تمام فرامین قبل از اجرا نیازمند تایید هستند.'
                        : 'اجرای خودکار (Auto-Pilot): فرامین ایمن مستقیماً اجرا می‌شوند.'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 block">صف فرامین ساختاریافته:</span>
                  {proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className={`p-3 rounded-xl border space-y-2 transition-all ${
                        prop.status === 'executed'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : prop.status === 'rejected'
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-[#181822] border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          prop.type === 'WIN_AGENT' ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          [{prop.type}:{prop.action}]
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{prop.timestamp}</span>
                      </div>

                      <div className="text-zinc-200 text-xs font-medium">{prop.description}</div>

                      <div className="p-2 rounded bg-black/50 border border-zinc-800 font-mono text-[11px] text-emerald-400 overflow-x-auto text-left" dir="ltr">
                        {prop.command}
                      </div>

                      {prop.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => handleRejectProposal(prop.id)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 text-[11px] transition-colors"
                          >
                            رد فرمان
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveProposal(prop.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تأیید و اجرای دستور</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>وضعیت: {prop.status === 'executed' ? 'اجرا شده در سشن کاربر' : 'رد شده توسط ادمین'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: SESSION ISOLATION (Arman vs Masood) */}
            {activeTab === 'session_isolation' && (
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-1.5 text-sky-200">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>سیاست امنیتی ایزوله‌سازی نشست‌های ویندوز (User Session Isolation)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    توکن‌ها هرگز در مسیر عمومی مانند <code className="text-zinc-100 font-mono">%ProgramData%</code> ذخیره نمی‌شوند. با خروج کاربر آرمان و ورود مسعود، سشن قبلی متوقف و ایجنت فقط با توکن مسعود اجرا می‌گردد.
                  </p>
                </div>

                {/* Session Card */}
                <div className="p-3.5 bg-[#181822] border border-zinc-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">کاربر فعال در ویندوز:</span>
                    <span className="text-white font-bold font-mono">
                      {simulatedWindowsUser === 'arman' ? 'ARMAN\\arman (Admin)' : 'ARMAN\\masood (Standard)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">مسیر ذخیره توکن ایزوله:</span>
                    <span className="text-sky-300 font-mono text-[10px]">
                      %AppData%\{simulatedWindowsUser}\OmniOpsAgent
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">کلید رجیستری اختصاصی:</span>
                    <span className="text-zinc-300 font-mono text-[10px]">HKCU:\Software\OmniOps</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">وضعیت سشن توکن:</span>
                    <span className="text-emerald-400 font-mono font-bold text-[10px]">
                      {sessionToken.substring(0, 18)}...
                    </span>
                  </div>
                </div>

                {/* Switcher demonstration */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-zinc-300 block">شبیه‌سازی تغییر کاربر ویندوز (Fast Session Switch):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchWindowsSession('arman')}
                      className={`p-2.5 rounded-xl border text-right transition-all ${
                        simulatedWindowsUser === 'arman'
                          ? 'bg-sky-600/20 border-sky-500 text-white font-bold'
                          : 'bg-[#141418] border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">آرمان (SuperAdmin)</div>
                      <div className="text-[9px] text-zinc-400 mt-0.5">دسترسی به ترمینال و WinRM</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchWindowsSession('masood')}
                      className={`p-2.5 rounded-xl border text-right transition-all ${
                        simulatedWindowsUser === 'masood'
                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                          : 'bg-[#141418] border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">مسعود (کاربر عادی)</div>
                      <div className="text-[9px] text-zinc-400 mt-0.5">ایزوله متنی بدون فرامین سیستمی</div>
                    </button>
                  </div>
                </div>

                {/* Standalone Installer Fast Copy */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-400 block font-medium">دستور نصب تک‌خطی ایجنت از گیت‌هاب (PowerShell):</span>
                  <div className="p-2.5 rounded-xl bg-black border border-zinc-800 font-mono text-[10px] text-emerald-400 flex items-center justify-between gap-2 overflow-x-auto text-left" dir="ltr">
                    <span className="truncate">irm https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/agent/install-agent.ps1 | iex</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('irm https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/agent/install-agent.ps1 | iex');
                        setCopiedInstallCmd(true);
                        setTimeout(() => setCopiedInstallCmd(false), 2000);
                      }}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                      title="کپی دستور نصب"
                    >
                      {copiedInstallCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
