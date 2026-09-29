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
  Activity
} from 'lucide-react';

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
  onOpenMcpRulesModal
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

  // 2 Chat Environment Modes:
  // Option 1: 'chat' (محیط چت خالص - مکالمه عادی متنی)
  // Option 2: 'agent_tools' (اجرای فرامین با ابزارها - ترکیب چت با بازوهای اجرایی ایجنت و کروم)
  const [chatMode, setChatMode] = useState<'chat' | 'agent_tools'>(
    hasCommandAccess ? 'agent_tools' : 'chat'
  );

  useEffect(() => {
    if (!hasCommandAccess && chatMode === 'agent_tools') {
      setChatMode('chat');
    }
  }, [hasCommandAccess, chatMode]);

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
    { id: 'openai', name: 'OpenAI (GPT-4o)', modelId: 'gpt-4o', status: 'available', latencyMs: 42, priority: 2, desc: 'هوش چندمنظوره سریع' },
    { id: 'gemini', name: 'Google Gemini (Gemini 2.5 Flash)', modelId: 'gemini-2.5-flash', status: 'available', latencyMs: 34, priority: 3, desc: 'کانتکست میلیونی و چندرسانه‌ای' },
    { id: 'deepseek', name: 'DeepSeek Reasoning (V3 / R1)', modelId: 'deepseek-chat', status: 'available', latencyMs: 55, priority: 4, desc: 'اسکریپت‌نویسی لینوکس و شبکه' },
    { id: 'groq', name: 'Groq LPU (Ultra-Fast 25ms)', modelId: 'groq-llama-3.3', status: 'available', latencyMs: 25, priority: 5, desc: 'سرعت استثنایی و کمترین تاخیر' },
    { id: 'ollama', name: 'Ollama Local Edge (Dorna 2 & Llama 3)', modelId: 'dorna-2-8b', status: 'available', latencyMs: 18, priority: 6, desc: 'استنتاج آفلاین محلی و مدل‌های بومی' },
    { id: 'openrouter', name: 'OpenRouter Unified Gateway', modelId: 'openrouter-auto', status: 'available', latencyMs: 60, priority: 7, desc: 'درگاه یکپارچه با هزاران مدل' }
  ]);

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
  const [serviceInactiveToast, setServiceInactiveToast] = useState<string | null>(null);

  // Multimedia Generation & Local RAG Mode (Image / Video / Document AnythingLLM)
  const [activeMediaIntent, setActiveMediaIntent] = useState<'image' | 'video' | 'document_rag' | null>(null);
  const [copiedLetterId, setCopiedLetterId] = useState<string | null>(null);

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

    const isToolExecution = chatMode === 'agent_tools';

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

  return (
    <div 
      className="flex flex-col lg:flex-row gap-4 md:gap-5 h-[calc(100vh-140px)] min-h-[580px] relative select-none overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Explicit Drag & Drop Visual Overlay with AnythingLLM offline banner */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-emerald-950/80 backdrop-blur-md border-3 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150 p-6 text-center">
          <div className="p-5 rounded-2xl bg-emerald-600/30 border border-emerald-400 text-white mb-3 shadow-2xl animate-bounce">
            <FileText className="w-12 h-12 text-emerald-300" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide">
            فایل نامه، سند PDF، اکسل یا گزارش را اینجا رها کنید (AnythingLLM Drag & Drop)
          </h3>
          <p className="text-xs text-emerald-200 mt-1 max-w-lg">
            سند شما به صورت ۱۰۰٪ آفلاین توسط موتور محلی AnythingLLM بدون کسر توکن‌های گران‌قیمت آنلاین و با حفظ کامل حریم خصوصی تحلیل و پاسخ داده می‌شود.
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

      {/* Sidebar: Chat Sessions (Desktop Animated Collapsible like Google Gemini & Mobile Drawer) */}
      <div className={`
        fixed inset-y-0 right-0 z-40 bg-[#141418] border-l border-neutral-800 transition-all duration-300 ease-in-out shadow-2xl
        lg:static lg:border-l-0 lg:border border-neutral-800/80 lg:rounded-2xl lg:shadow-xl
        ${showMobileSidebar ? 'translate-x-0 w-72 p-4 flex flex-col justify-between' : 'translate-x-full lg:translate-x-0'}
        ${isSidebarOpen 
          ? 'lg:w-80 lg:opacity-100 lg:p-4 lg:flex lg:flex-col lg:justify-between' 
          : 'lg:w-0 lg:opacity-0 lg:p-0 lg:border-0 lg:overflow-hidden lg:pointer-events-none lg:m-0'
        }
      `}>
        <div className={`space-y-3.5 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
            <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>مکالمات سازمانی ({sessions.length})</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={onCreateSession}
                className="p-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 transition-colors"
                title="چت‌روم جدید"
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* Gemini-style desktop collapse button inside sidebar */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="hidden lg:flex p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="بستن سایدبار سابقه چت (Gemini)"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="lg:hidden p-1.5 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
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
        <div className={`pt-3.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
              {currentUser.username[0].toUpperCase()}
            </div>
            <span className="truncate">@{currentUser.username}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Main Chat Canvas */}
      <div 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 min-w-0 bg-[#141418] border border-neutral-800/90 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl relative transition-all duration-300 ease-in-out"
      >
        {/* Drag and Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-blue-950/90 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-150 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-200 shadow-xl">
              <Download className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">فایل‌ها و تصاویر را اینجا رها کنید (Drop to Attach)</h4>
              <p className="text-xs text-blue-200/80 mt-1 max-w-sm">
                پشتیبانی خودکار از تصاویر، لاگ‌ها، اسکریپت‌های سیستمی و کانفیگ‌ها
              </p>
            </div>
          </div>
        )}
        {/* Top Control Bar: Mobile / Desktop Toggle (Gemini Style), Active Session Title, Model Picker, Skills Badge, Multimedia Status */}
        <div className="p-3.5 md:p-4 border-b border-neutral-800/80 bg-[#121215] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Gemini-style Collapsible Sidebar Toggle Button */}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setShowMobileSidebar(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 border border-neutral-700/60"
              title={isSidebarOpen ? 'بستن پنل تاریخچه گفتگو (Gemini Style)' : 'باز کردن پنل تاریخچه گفتگو (Gemini Style)'}
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4 text-blue-400" />}
              {!isSidebarOpen && (
                <span className="hidden sm:inline text-xs font-semibold text-neutral-200">سابقه چت</span>
              )}
            </button>

            {/* Active Session Title & Quick Rename / Pin Header */}
            {currentSession && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#18181D] border border-neutral-800 text-xs">
                {currentSession.is_pinned && (
                  <span title="پین شده به بالا" className="shrink-0 flex items-center">
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                )}

                {editingSessionId === currentSession.id ? (
                  <form onSubmit={(e) => handleSaveRename(currentSession.id, e)} className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={editingSessionTitle}
                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                      className="bg-black/40 border border-blue-500/60 rounded px-1.5 py-0.5 text-xs text-white max-w-[130px]"
                    />
                    <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300">
                      <Check className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => setEditingSessionId(null)} className="p-0.5 text-neutral-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <span className="font-semibold text-neutral-200 truncate max-w-[140px] md:max-w-[200px]" title={currentSession.title}>
                      {currentSession.title}
                    </span>
                    {onRenameSession && (
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(currentSession, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-white transition-opacity"
                        title="تغییر نام این چت"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {onTogglePinSession && (
                      <button
                        type="button"
                        onClick={() => onTogglePinSession(currentSession.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-amber-300 transition-opacity"
                        title={currentSession.is_pinned ? 'حذف پین' : 'پین کردن به بالا'}
                      >
                        {currentSession.is_pinned ? <PinOff className="w-2.5 h-2.5" /> : <Pin className="w-2.5 h-2.5" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* دو گزینه محیط چت و ابزارها: فقط در صورت دسترسی ابزار در پروفایل کاربر نمایش می‌یابد */}
            {hasCommandAccess ? (
              <div className="flex items-center gap-1 bg-[#101014] p-1 rounded-xl border border-neutral-800 text-xs shadow-inner">
                {/* گزینه ۱: محیط چت (مکالمه خالص) */}
                <button
                  type="button"
                  onClick={() => setChatMode('chat')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                    chatMode === 'chat'
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="محیط چت و مکالمه عادی متنی با هوش مصنوعی (بدون اجرای فرامین سیستمی)"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>محیط چت</span>
                </button>

                {/* گزینه ۲: اجرای فرامین با ابزارها */}
                <button
                  type="button"
                  onClick={() => setChatMode('agent_tools')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                    chatMode === 'agent_tools'
                      ? 'bg-gradient-to-r from-amber-500/25 to-emerald-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="ترکیب محیط چت با ابزارها (صحت‌سنجی خودکار مجوز کاربر و اجرا با ایجنت ویندوز و افزونه کروم)"
                >
                  <Zap className={`w-3.5 h-3.5 ${chatMode === 'agent_tools' ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`} />
                  <span>اجرای فرامین با ابزارها</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    {userAllowedTools.length} بازوی مجاز
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">چت‌روم سازمانی</span>
                <span className="text-[10px] text-blue-300 font-mono">مکالمه هوشمند</span>
              </div>
            )}

            {/* OmniRoute & Model Selection */}
            <div className="flex items-center gap-1.5 bg-[#101014] p-1 rounded-xl border border-neutral-800 text-xs">
              {/* Option 1: انتخاب هوشمند (OmniRoute) */}
              <button
                type="button"
                onClick={() => setModelSelectionMode('omniroute')}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                  modelSelectionMode === 'omniroute'
                    ? 'bg-gradient-to-r from-amber-500/25 to-cyan-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="مسیریابی خودکار ترافیک بین تمام ارائه‌دهندگان (توقف کمتر، زمان بیشتر)"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">OmniRoute</span>
              </button>

              {/* Option 2: انتخاب مدل */}
              <button
                type="button"
                onClick={() => setModelSelectionMode('manual')}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                  modelSelectionMode === 'manual'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="انتخاب دستی یک مدل خاص"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">مدل</span>
              </button>

              {/* When Manual is selected: clean single dropdown */}
              {modelSelectionMode === 'manual' && (
                <div className="flex items-center pl-1 animate-in fade-in zoom-in-95 duration-100">
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="bg-[#18181D] border border-blue-500/60 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-400 font-mono max-w-[190px] cursor-pointer"
                  >
                    {availableModels.map((m) => (
                      <option key={m.model_id} value={m.model_id}>
                        {m.display_name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* OmniRoute Status Pill */}
            {modelSelectionMode === 'omniroute' && (
              <button
                type="button"
                onClick={() => setShowOmniRouteModal(true)}
                className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] transition-colors"
                title="مشاهده معماری کنترل ترافیک و استخر ارائه‌دهندگان OmniRoute"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-cyan-300">Claude Code ➔ OmniRoute</span>
                <span className="text-neutral-400 text-[10px]">({omniRoutePool.filter(p => p.status === 'available').length} ارائه‌دهنده آماده)</span>
              </button>
            )}
          </div>

          {/* Active Skills Injection Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSkillDropdown(!showSkillDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181D] hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-neutral-200 rounded-xl transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>مهارت‌های تزریقی ({activeSkillIds.length})</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showSkillDropdown && (
              <div className="absolute left-0 mt-2 w-80 bg-[#18181D] border border-neutral-700 rounded-2xl shadow-2xl p-3 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-white">انتخاب حوزه‌های دانش و تخصص:</span>
                  <button
                    onClick={() => setShowSkillDropdown(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {availableSkills.map((skill) => {
                    const isChecked = activeSkillIds.includes(skill.id);
                    return (
                      <label
                        key={skill.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                          isChecked ? 'bg-blue-600/10 border border-blue-500/30' : 'hover:bg-neutral-800/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSkill(skill.id)}
                          className="w-4 h-4 accent-blue-600 rounded mt-0.5 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-semibold text-white truncate">{skill.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{skill.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Core Memory & Admin Resilience Quick Modal Trigger (Admin / SuperAdmin Only) */}
            {hasCommandAccess && (
              <button
                type="button"
                onClick={() => setShowCoreMemoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 rounded-xl transition-colors shadow-sm shrink-0"
                title="مشاهده حافظه ماندگار هسته ادمین و وضعیت پایداری اولاما لوکال"
              >
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">حافظه هسته ادمین</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}
          </div>
        </div>

        {/* Model Continuity Switch Alert */}
        {continuityToast && (
          <div className="bg-blue-500/15 border-b border-blue-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-blue-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 shrink-0 text-blue-400" />
              <span>{continuityToast}</span>
            </div>
            <button onClick={() => setContinuityToast(null)} className="text-neutral-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Automatic Token Failover Alert */}
        {failoverBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{failoverBanner}</span>
            </div>
            <button onClick={() => setFailoverBanner(null)} className="text-neutral-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* 🤖 Agentic Engineering Bar: MCP Protocol, Specialist Skills (#LintAndTest), Doctrinal Rules Gate */}
        <div className="bg-[#0B0D14] border-b border-cyan-500/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-inner">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-bold">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>پایپ‌لاین ایجنت هوشمند: MCP ⟷ Skills ⟷ Rules</span>
            </div>

            {/* MCP Protocol Badge */}
            <button
              type="button"
              onClick={() => onOpenMcpRulesModal && onOpenMcpRulesModal('mcp_hub')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/70 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="مشاهده سرورها و ابزارهای متصل پروتکل کانتکست مدل (MCP)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">MCP: {(mcpServers?.length || 4)} سرور متصل</span>
              <span className="text-[10px] text-neutral-500">(۱۸ ابزار)</span>
            </button>

            {/* Doctrinal Rules Gate Badge */}
            <button
              type="button"
              onClick={() => onOpenMcpRulesModal && onOpenMcpRulesModal('rules')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/70 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="مشاهده و ویرایش مانیفست قوانین دکترینال پروژه (Rules Gate)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">گیت قوانین: {(projectRules?.filter(r => r.isActive).length || 6)} قانون فعال</span>
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setInputText('#LintAndTest کدهای تغییریافته ماژول هسته را از طریق پروتکل MCP ارزیابی کرده و خطاهای احتمالی یا تست‌های واحد را بررسی کن.');
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
              title="اجرای تست و لینت کدهای تغییریافته با مهارت #LintAndTest"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>⚡ #LintAndTest</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputText('#QualityGate ممیزی انطباق تغییرات با قوانین دکترینال پروژه و سیاست افشای صفر توکن جهت تایید کامیت.');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
              title="ارزیابی کد با قوانین سخت‌گیرانه دکترینال پروژه"
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>🛡️ Rules Gate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputText('#AutoTest برای تابع تولید اسکریپت شل سرور لبه و اتوماسیون SSL، تست‌های واحد جامع بنویس.');
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-blue-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
              title="تولید خودکار تست‌های واحد"
            >
              <Activity className="w-3 h-3 text-blue-400" />
              <span>🧪 #AutoTest</span>
            </button>

            {onOpenMcpRulesModal && (
              <button
                type="button"
                onClick={() => onOpenMcpRulesModal('rules')}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 transition-colors"
                title="تنظیمات مانیفست قوانین و صدور فایل rules.md"
              >
                <FileCode className="w-3 h-3 text-amber-400" />
                <span>صدور rules.md</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {currentSession?.messages?.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Bot className="w-7 h-7" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-sm font-bold text-white">دستیار مهندسی شبکه و عملیات سازمانی OmniOps</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  می‌توانید فایل‌های کانفیگ، لاگ‌ها یا تصاویر را با <b>Drag & Drop</b> یا <b>Ctrl+V</b> الصاق کنید یا درخواست تولید دیاگرام شبکه و ویدیو شبیه‌ساز دهید.
                </p>
              </div>

              {/* Multimedia Quick Trigger Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-lg">
                <button
                  onClick={() => {
                    setInputText('دیاگرام توپولوژی شبکه سازمانی با روتر میکروتیک، دو سوئیچ سیسکو و ۳ ویلن را به صورت تصویر ترسیم کن.');
                    setActiveMediaIntent('image');
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>تولید دیاگرام توپولوژی شبکه (AI Diagram)</span>
                </button>

                <button
                  onClick={() => {
                    setInputText('انیمیشن ویدیویی شبیه‌سازی انتقال بسته‌های فایروال و FastTrack در میکروتیک را ایجاد کن.');
                    setActiveMediaIntent('video');
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>شبیه‌سازی ویدیویی جریان ترافیک (Video Flow)</span>
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
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-[#18181D] border border-neutral-700 text-blue-400'
                }`}>
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-[#18181D] border border-neutral-800/90 text-neutral-200 rounded-bl-sm space-y-3'
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

                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                  <div className={`flex items-center gap-2 text-[10px] ${
                    isUser ? 'text-blue-100' : 'text-neutral-500'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {msg.model_used && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{msg.model_used}</span>
                      </>
                    )}
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
                    : chatMode === 'agent_tools'
                    ? 'در حال صحت‌سنجی سطح دسترسی کاربر در پروفایل و اجرای خودکار دستور با بازوی اجرایی (ایجنت و کروم)...'
                    : 'در حال تحلیل با پایگاه دانش تخصصی و تدوین پاسخ...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
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

        {/* Input Bar with Gemini-Style (+) Menu and Attachments */}
        <div className="p-3 bg-[#121216] border-t border-neutral-800 relative">
          {/* نشانگر محیط ترکیب‌شده با ابزارها (گزینه ۲: اجرای فرامین با ابزارها) */}
          {chatMode === 'agent_tools' && (
            <div className="mb-2 flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/25 text-amber-300 animate-in fade-in duration-150 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-semibold text-white">محیط چت با ابزارها ترکیب شده است:</span>
                <span className="text-amber-200/90 font-mono text-[10px]">
                  {currentUser?.agent_connected 
                    ? `ایجنت لوکال ویندوز (${currentUser?.agent_ip || '192.168.1.145'}) · افزونه کروم` 
                    : 'سرور لینوکس مرکزی · افزونه کروم'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>صحت‌سنجی خودکار مجوز کاربر (@{currentUser.username})</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-black/40 border border-neutral-700/80 text-neutral-300 text-[10px] font-mono">
                  {userAllowedTools.length} بازوی مجاز
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2.5">
            {/* Gemini-style Plus (+) Button & Popover */}
            <div className="relative" ref={plusMenuRef}>
              <button
                type="button"
                onClick={() => setShowGeminiPlusMenu(!showGeminiPlusMenu)}
                className={`p-3 rounded-xl border transition-all shrink-0 flex items-center justify-center ${
                  showGeminiPlusMenu || activeMediaIntent
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-[#18181D] hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/80'
                }`}
                title="امکانات هوشمند، تحلیل اسناد و چندرسانه‌ای (مشابه چت‌بات Gemini)"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${showGeminiPlusMenu ? 'rotate-45' : ''}`} />
              </button>

              {/* Gemini Floating Popover Menu */}
              {showGeminiPlusMenu && (
                <div 
                  className="absolute bottom-full right-0 mb-3 w-80 md:w-96 bg-[#16161C] border border-neutral-700/90 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-bold text-white">امکانات هوشمند و چندرسانه‌ای</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                      Gemini Style
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* 1. Document RAG & AnythingLLM */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDocumentEngineActive) {
                          setServiceInactiveToast('سرویس پردازش اسناد (AnythingLLM / JEV) متوقف است. برای فعال‌سازی به بخش زیرساخت سرور مراجعه نمایید.');
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
                      className={`w-full text-right p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                        isDocumentEngineActive
                          ? 'hover:bg-neutral-800/80 text-neutral-200'
                          : 'opacity-70 hover:bg-neutral-800/40 text-neutral-400'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isDocumentEngineActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white">تحلیل سند و نامه‌نگاری اداری (AnythingLLM + JEV)</span>
                          {isDocumentEngineActive ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 shrink-0">
                              فعال (بدون کسر توکن)
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 shrink-0">
                              نیازمند نصب در سرور
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          خواندن اسناد PDF/Word، صدور پیش‌نویس پاسخ رسمی، اداری و RAG محلی
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
                        supportsImage ? 'hover:bg-neutral-800/80 text-neutral-200' : 'opacity-40 cursor-not-allowed text-neutral-500'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white">تولید دیاگرام و تصویر هوش مصنوعی</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono shrink-0">
                            {supportsImage ? 'پشتیبانی می‌شود' : 'غیرفعال در مدل'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          رندر گرافیکی معماری سرور، نقشه شبکه و دیاگرام‌های فنی
                        </p>
                      </div>
                    </button>

                    {/* 3. Video Simulation */}
                    <button
                      type="button"
                      disabled={!supportsVideo}
                      onClick={() => {
                        setActiveMediaIntent('video');
                        setShowGeminiPlusMenu(false);
                        if (!inputText) setInputText('شبیه‌سازی ویدیویی متحرک از جریان عبور ترافیک، بسته‌های شبکه و سوئیچینگ بساز');
                      }}
                      className={`w-full text-right p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                        supportsVideo ? 'hover:bg-neutral-800/80 text-neutral-200' : 'opacity-40 cursor-not-allowed text-neutral-500'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 border border-purple-500/30">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white">شبیه‌سازی ویدیویی متحرک</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono shrink-0">
                            {supportsVideo ? 'پشتیبانی می‌شود' : 'غیرفعال در مدل'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          انیمیشن شبیه‌سازی بسته‌ها، نفوذ، فایروال و ترافیک شبکه
                        </p>
                      </div>
                    </button>

                    {/* 4. Table & Spreadsheet Data Extraction */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDocumentEngineActive) {
                          setServiceInactiveToast('سرویس تحلیل اسناد (AnythingLLM / JEV) در حال حاضر غیرفعال است.');
                          setShowGeminiPlusMenu(false);
                          return;
                        }
                        setActiveMediaIntent('document_rag');
                        setShowGeminiPlusMenu(false);
                        if (attachments.length === 0) {
                          fileInputRef.current?.click();
                        }
                        setInputText('استخراج داده‌های عددی، اقلام مالی و تشکیل جدول ماتریسی و مقایسه‌ای از سند');
                      }}
                      className="w-full text-right p-2.5 rounded-xl hover:bg-neutral-800/80 transition-all flex items-start gap-2.5 text-neutral-200"
                    >
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white">استخراج ارقام و جدول از اسناد</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono shrink-0">
                            اکسل و حسابداری
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          تبدیل متون و شیت‌های اکسل به جدول ساختاریافته بدون هزینه توکن
                        </p>
                      </div>
                    </button>

                    {/* 5. Direct File Attachment */}
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowGeminiPlusMenu(false);
                      }}
                      className="w-full text-right p-2.5 rounded-xl hover:bg-neutral-800/80 transition-all flex items-start gap-2.5 text-neutral-200 border-t border-neutral-800/60 mt-1 pt-2"
                    >
                      <div className="p-2 rounded-xl bg-neutral-700/40 text-neutral-300 shrink-0 border border-neutral-600/40">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white">پیوست مستقیم فایل خام</span>
                          <span className="text-[9px] text-neutral-400 font-mono shrink-0">PDF, Word, Code</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          آپلود انواع فایل، لاگ یا تصاویر (پشتیبانی از Drag & Drop و Paste)
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File/Image Upload Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-[#18181D] hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 border border-neutral-700/80 transition-colors shrink-0"
              title="پیوست فایل یا تصویر (یا فایل را بکشید و اینجا رها کنید / Ctrl+V)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Text Input with Clipboard Paste listener */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                chatMode === 'agent_tools'
                  ? "فرمان سیستمی، وبگردی کروم، دستور شبکه یا سوال خود را بنویسید (اجرا و صحت‌سنجی خودکار با بازوهای فعال)..."
                  : "پیام یا درخواست خود را بنویسید... (عکس یا فایل را با Ctrl+V پیست یا Drag & Drop کنید)"
              }
              className={`flex-1 max-h-32 min-h-[46px] resize-none rounded-xl px-4 py-3 text-xs leading-relaxed transition-all ${
                chatMode === 'agent_tools'
                  ? 'bg-[#18181D] border border-amber-500/40 focus:border-amber-400 text-white placeholder-neutral-500 font-sans shadow-sm'
                  : 'bg-[#18181D] border border-neutral-700/80 focus:border-blue-500 text-white placeholder-neutral-500 font-sans'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && attachments.length === 0) || isSending}
              className={`px-5 py-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shrink-0 ${
                chatMode === 'agent_tools'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-amber-500/25'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              <span>{chatMode === 'agent_tools' ? 'اجرای فرمان' : 'ارسال'}</span>
              {chatMode === 'agent_tools' ? <Zap className="w-3.5 h-3.5 text-black" /> : <Send className="w-3.5 h-3.5 fill-current" />}
            </button>
          </form>
        </div>
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
    </div>
  );
};
