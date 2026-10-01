import React, { useState, useEffect } from 'react';
import { MochiCompanion } from './components/MochiCompanion';
import { SettingsModal } from './components/SettingsModal';
import { CommandApprovalModal } from './components/CommandApprovalModal';
import { UpdatePromptModal } from './components/UpdatePromptModal';
import { streamOmniChat, ChatMessage } from './services/omniApi';
import { extractAgentCommands, ParsedCommand } from './services/commandParser';
import { getStoredCredentials } from './services/credentialService';
import { checkMasterForUpdates, VersionCheckResult, CURRENT_AGENT_VERSION } from './services/updateService';

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null);
  const [agentState, setAgentState] = useState<'idle' | 'listening' | 'executing' | 'approved' | 'error'>('idle');
  const [isConnected, setIsConnected] = useState(true);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [activePendingCommand, setActivePendingCommand] = useState<ParsedCommand | null>(null);
  const [processedCommandIds, setProcessedCommandIds] = useState<Set<string>>(new Set());

  // Check initial connection and version check with Master
  useEffect(() => {
    initAgent();
  }, []);

  const initAgent = async () => {
    await checkConnection();
    // Version check ping to Master Server on startup
    const updateResult = await checkMasterForUpdates();
    if (updateResult && updateResult.updateAvailable) {
      setUpdateInfo(updateResult);
      setIsUpdateModalOpen(true);
    }
  };

  const checkConnection = async () => {
    try {
      const creds = await getStoredCredentials();
      const res = await fetch(`${creds.masterUrl.replace(/\/+$/, '')}/api/health`, {
        headers: { 'Authorization': `Bearer ${creds.exchangeToken}` }
      });
      setIsConnected(res.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userText = inputPrompt;
    setInputPrompt('');
    setIsPromptOpen(false);

    const newMsgs: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userText }
    ];
    setMessages(newMsgs);
    setAgentState('listening');

    let assistantText = '';

    await streamOmniChat(newMsgs, {
      onToken: (token) => {
        assistantText += token;
        
        // Parse kardan-e faramin [WIN_AGENT:ACTION:دستور]
        const { cleanText, commands } = extractAgentCommands(assistantText);

        // Barresi dastoorat jadid baraye baz shodane Approval Modal
        for (const cmd of commands) {
          if (!processedCommandIds.has(cmd.id)) {
            setProcessedCommandIds((prev) => new Set(prev).add(cmd.id));
            setAgentState('executing');
            setActivePendingCommand(cmd);
          }
        }

        setMessages([
          ...newMsgs,
          { role: 'assistant', content: cleanText }
        ]);
      },
      onCommandDetected: (action, cmd) => {
        console.log('Command detected:', action, cmd);
      },
      onError: (err) => {
        console.error('Chat stream error:', err);
        setAgentState('error');
      },
      onDone: () => {
        if (!activePendingCommand) {
          setAgentState('idle');
        }
      }
    });
  };

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden font-sans">
      {/* Visual Top Companion Notch */}
      <MochiCompanion
        state={agentState}
        isConnected={isConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuickPrompt={() => setIsPromptOpen(!isPromptOpen)}
      />

      {/* Quick Prompt Floating Drawer below Companion */}
      {isPromptOpen && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 w-full max-w-md p-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-[#18181b]/95 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-2xl p-4 text-zinc-100">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-300">ارسال دستور به سرور مستر OmniOps</span>
              <button onClick={() => setIsPromptOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="مثلاً: وضعیت سرویس‌ها و پردازش‌های سنگین ویندوز را بررسی کن..."
                rows={3}
                className="w-full bg-zinc-900/90 border border-zinc-700 focus:border-cyan-500 rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none leading-relaxed text-right"
                dir="rtl"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setInputPrompt('پروسس‌های پرمصرف ویندوز را لیست کن'); }}
                    className="px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 rounded text-[10px] text-zinc-400"
                  >
                    پروسس‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInputPrompt('آدرس‌های شبکه و کانفیگ IP را نشان بده'); }}
                    className="px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 rounded text-[10px] text-zinc-400"
                  >
                    شبکه/IP
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition shadow-md"
                >
                  ارسال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={checkConnection}
      />

      {/* Zero-Trust Command Approval Gate */}
      <CommandApprovalModal
        pendingCommand={activePendingCommand}
        onResolved={(id, success, output) => {
          setActivePendingCommand(null);
          setAgentState(success ? 'approved' : 'error');
          setTimeout(() => setAgentState('idle'), 3000);
        }}
        onReject={(id) => {
          setActivePendingCommand(null);
          setAgentState('idle');
        }}
      />

      {/* Auto-Update Prompt Triggered by Startup Version Check */}
      <UpdatePromptModal
        updateInfo={updateInfo}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
};

export default App;
