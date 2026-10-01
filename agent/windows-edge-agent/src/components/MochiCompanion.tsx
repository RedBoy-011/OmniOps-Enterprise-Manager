import React, { useState, useEffect } from 'react';

interface MochiProps {
  state: 'idle' | 'listening' | 'executing' | 'approved' | 'error';
  onOpenSettings: () => void;
  onOpenQuickPrompt: () => void;
  isConnected: boolean;
}

export const MochiCompanion: React.FC<MochiProps> = ({
  state,
  onOpenSettings,
  onOpenQuickPrompt,
  isConnected
}) => {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  // Mouse tracking baraye cheshm-haye Mochi
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 6;
      const y = (e.clientY / window.innerHeight - 0.5) * 4;
      setEyePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Palak zadan-e khodkar (Blinking)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!isConnected) return 'from-rose-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    if (state === 'executing') return 'from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse';
    if (state === 'approved') return 'from-emerald-400 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
    if (state === 'error') return 'from-red-500 to-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.5)]';
    return 'from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.35)]';
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 shadow-2xl select-none">
      {/* Visual Mochi Character Squircle */}
      <div
        onClick={onOpenQuickPrompt}
        className={`relative w-8 h-8 rounded-xl bg-gradient-to-br ${getStatusColor()} flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105`}
        title="کلیک برای ارسال فرمان سریع به مستر"
      >
        {/* Cheshm-haye mochi */}
        <div className="flex gap-1.5 items-center">
          <div
            className={`w-1.5 bg-black rounded-full transition-all duration-75 ${blink ? 'h-0.5' : 'h-2'}`}
            style={{ transform: `translate(${eyePos.x}px, ${eyePos.y}px)` }}
          />
          <div
            className={`w-1.5 bg-black rounded-full transition-all duration-75 ${blink ? 'h-0.5' : 'h-2'}`}
            style={{ transform: `translate(${eyePos.x}px, ${eyePos.y}px)` }}
          />
        </div>
      </div>

      {/* Label and Agent State */}
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-bold tracking-wider text-zinc-200">
          OMNIOPS WIN-AGENT
        </span>
        <span className="text-[9px] font-mono text-zinc-400">
          {isConnected ? (state === 'executing' ? '⚡ RUNNING CMD' : '● ONLINE') : '○ DISCONNECTED'}
        </span>
      </div>

      {/* Settings Gear Button */}
      <button
        onClick={onOpenSettings}
        className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition ml-1"
        title="تنظیمات اتصال سرور مرکزی"
      >
        ⚙
      </button>
    </div>
  );
};
