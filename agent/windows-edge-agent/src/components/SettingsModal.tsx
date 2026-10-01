import React, { useState, useEffect } from 'react';
import { saveCredentials, getStoredCredentials } from '../services/credentialService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [masterUrl, setMasterUrl] = useState('http://localhost:3000');
  const [exchangeToken, setExchangeToken] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getStoredCredentials().then((creds) => {
        if (creds.masterUrl) setMasterUrl(creds.masterUrl);
        if (creds.exchangeToken) setExchangeToken(creds.exchangeToken);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await saveCredentials(masterUrl.trim(), exchangeToken.trim());
      setStatus('SUCCESS: پیکربندی با موفقیت در Windows Credential Manager ذخیره شد.');
      if (onSaved) onSaved();
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setStatus(`ERROR: ${err.message || 'خطا در ذخیره‌سازی کلیدها'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#141416] border border-cyan-500/30 rounded-2xl w-full max-w-md p-6 text-zinc-100 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100">تنظیمات اتصال به OmniOps Master</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition text-sm">✕</button>
        </div>

        <p className="text-xs text-zinc-400 mt-3 leading-relaxed" dir="rtl">
          در این نسخه مهندسی معکوس‌شده Coucou، کلیدهای کلود (OpenAI/Anthropic) حذف شده و تمامی درخواست‌ها به سرور مستر OmniOps هدایت می‌شوند.
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              آدرس سرور مرکزی (Master Server URL):
            </label>
            <input
              type="text"
              required
              placeholder="http://192.168.1.100:3000"
              value={masterUrl}
              onChange={(e) => setMasterUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none font-mono text-left"
              dir="ltr"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">اندپوینت API Gateway سرور OmniOps (مثلاً http://localhost:3000)</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              کلید تبادل امن (Exchange Token):
            </label>
            <input
              type="password"
              required
              placeholder="omni_sec_tok_..."
              value={exchangeToken}
              onChange={(e) => setExchangeToken(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none font-mono text-left"
              dir="ltr"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">در حافظه امن سیستم‌عامل (Windows Credential Manager) ذخیره می‌شود.</span>
          </div>

          {status && (
            <div className={`p-2.5 rounded text-xs font-mono ${status.startsWith('SUCCESS') ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'bg-rose-950/70 text-rose-300 border border-rose-800'}`}>
              {status}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2 rounded-lg text-xs transition disabled:opacity-50"
            >
              {loading ? 'در حال ثبت در سیستم‌عامل...' : 'ذخیره و برقراری ارتباط'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
