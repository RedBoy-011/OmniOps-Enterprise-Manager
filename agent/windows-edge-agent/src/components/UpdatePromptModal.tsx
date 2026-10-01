import React, { useState } from 'react';
import { VersionCheckResult } from '../services/updateService';

interface UpdatePromptModalProps {
  updateInfo: VersionCheckResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  updateInfo,
  isOpen,
  onClose
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!isOpen || !updateInfo || !updateInfo.updateAvailable) return null;

  const handleUpdateNow = async () => {
    setDownloading(true);
    setDownloadProgress(15);

    try {
      // Simulate/trigger download of new binary from Master
      const progressSteps = [35, 65, 88, 100];
      for (const step of progressSteps) {
        await new Promise((r) => setTimeout(r, 300));
        setDownloadProgress(step);
      }

      setDownloadCompleted(true);

      // Open download URL or trigger system installer
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = updateInfo.downloadUrl;
        link.setAttribute('download', `OmniOps-Windows-Edge-Agent-v${updateInfo.latestVersion}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    } catch (err) {
      console.error('Update download error:', err);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#121216] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 text-zinc-100 shadow-[0_0_50px_rgba(6,182,212,0.25)]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="font-semibold text-sm tracking-wide text-zinc-100">
              بروزرسانی خودکار بازوی ویندوزی OmniOps
            </h3>
          </div>
          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="my-4 space-y-3 text-right" dir="rtl">
          <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
            <div>
              <span className="text-zinc-400 text-xs block">نسخه فعلی کلاینت:</span>
              <span className="font-mono text-xs text-rose-400 font-bold">
                v{updateInfo.currentClientVersion}
              </span>
            </div>
            <div className="text-left" dir="ltr">
              <span className="text-zinc-400 text-xs block text-right" dir="rtl">جدیدترین نسخه مستر:</span>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                v{updateInfo.latestVersion}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-zinc-300 block mb-1">
              تغییرات کلیدی (Changelog):
            </span>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed max-h-28 overflow-y-auto">
              {updateInfo.changelog || 'بهبودهای امنیتی و همگام‌سازی سریع‌تر با هسته مرکزی OmniOps.'}
            </div>
          </div>

          {updateInfo.sha256 && (
            <div className="text-[10px] font-mono text-zinc-500 truncate" dir="ltr">
              SHA256: {updateInfo.sha256}
            </div>
          )}

          {downloading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>در حال دریافت پکیج از سرور مستر...</span>
                <span className="font-mono text-cyan-400">{downloadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {downloadCompleted && (
            <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono text-center">
              ✓ فایل بروزرسانی با موفقیت دانلود شد و آماده اعمال است.
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              disabled={downloading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              یادآوری در ورود بعدی
            </button>
          )}
          <button
            onClick={handleUpdateNow}
            disabled={downloading}
            className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg text-xs shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال دریافت...
              </>
            ) : (
              `دریافت و بروزرسانی به v${updateInfo.latestVersion}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
