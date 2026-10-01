import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, RefreshCw, Power, Zap, Terminal, X } from 'lucide-react';

// Model baraye etelaate daryafti az server pas az pairing
export interface PairedSessionData {
  token: string;
  agent_id: string;
  username: string;
  role: string;
  permissions: string[];
}

interface VolatilePairingProps {
  masterServerUrl?: string;
  onPairingSuccess?: (session: PairedSessionData) => void;
  onKillSession?: () => void;
  onClose?: () => void;
  isLocked?: boolean;
}

export const VolatilePairingFloatingModal: React.FC<VolatilePairingProps> = ({
  masterServerUrl = window.location.origin,
  onPairingSuccess,
  onKillSession,
  onClose,
  isLocked = true
}) => {
  // Arreye 6 khane-ee baraye zakhireye ragham-haye OTP
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<PairedSessionData | null>(null);

  // Ref-haye input baraye jabejaie khodkare focus be khane-ye baadi
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus ruye khane-ye aval be mahze baz shodane panjere
  useEffect(() => {
    if (isLocked) {
      setPinDigits(['', '', '', '', '', '']);
      setIsSuccessAnim(false);
      setConnectedUser(null);
      setActiveSession(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isLocked]);

  // Tabeye modiriate voroode ragham dar har khane
  const handleDigitChange = (index: number, value: string) => {
    // Faghat adad ra ghabool mikonad
    const cleanVal = value.replace(/\D/g, '');

    // Agar karbar matne 6 raghami ra Paste karde bashad
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      const updated = [...pinDigits];
      pasted.forEach((char, i) => {
        if (i < 6) updated[i] = char;
      });
      setPinDigits(updated);
      setErrorMessage(null);

      // Agar 6 ragham kamel shod, mostaghiman auto-verify mikonad
      if (updated.every(d => d !== '')) {
        triggerAutoVerify(updated.join(''));
      } else {
        const nextIdx = Math.min(pasted.length, 5);
        inputRefs.current[nextIdx]?.focus();
      }
      return;
    }

    const updatedDigits = [...pinDigits];
    updatedDigits[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setPinDigits(updatedDigits);
    setErrorMessage(null);

    // Bordan-e focus be khane-ye baadi dar soorate vared kardane adad
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify be mahze vared shodane raghame 6-om (Bedoone niaz be zadane dokme)
    if (cleanVal && index === 5) {
      const fullPin = updatedDigits.join('');
      if (fullPin.length === 6 && updatedDigits.every(d => d !== '')) {
        triggerAutoVerify(fullPin);
      }
    }
  };

  // Modiriate dokmeye Backspace baraye bargashtan be khane-ye ghabli
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Tabeye ersale darkhaste verify be master node
  const triggerAutoVerify = async (code: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const targetUrl = masterServerUrl.replace(/\/+$/, '');
      const response = await fetch(`${targetUrl}/api/v1/agent/pair/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairing_code: code })
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.error || 'کد وارد شده نامعتبر یا منقضی شده است.');
      }

      const sessionObj: PairedSessionData = {
        token: data.token,
        agent_id: data.agent_id,
        username: data.user?.username || 'arman',
        role: data.user?.role || 'Admin',
        permissions: data.permissions || ['POWERSHELL', 'CMD']
      };

      setConnectedUser(sessionObj.username);
      setActiveSession(sessionObj);
      setIsSuccessAnim(true);

      // Pas az namayeshe animatsione movafaghiat
      setTimeout(() => {
        if (onPairingSuccess) {
          onPairingSuccess(sessionObj);
        }
      }, 1200);

    } catch (err: any) {
      setErrorMessage(err.message || 'خطای اتصال به سرور مرکزی');
      // Shake kardane khane-ha va focus ruye khane-ye aval baraye talashe mojadad
      setPinDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden bg-[#121212] text-zinc-100 rounded-3xl p-6 shadow-2xl border border-zinc-800/90 backdrop-blur-2xl select-none" dir="rtl">
      {/* Halo va glow-e ziba dar bala */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-20 p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Halate 1: Nemayeshe Forme OTP 6-raghami */}
        {!isSuccessAnim ? (
          <motion.div
            key="pairing-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center text-center space-y-5"
          >
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center shadow-inner relative group">
              <div className="absolute inset-0 bg-sky-500/20 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
              <Lock className="w-6 h-6 text-sky-400 relative z-10" />
            </div>

            {/* Titre panjere */}
            <div className="space-y-1">
              <h2 className="text-base font-bold tracking-tight text-white font-sans">
                احراز هویت ناپایدار (Session PIN)
              </h2>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[260px]">
                کد ۶ رقمی تصادفی نمایش‌داده‌شده در پنل وب را وارد کنید تا اتصال به صورت <span className="text-sky-300 font-mono">RAM-Only</span> برقرار گردد.
              </p>
            </div>

            {/* 6 Khane-ye voroode OTP */}
            <div className="flex items-center justify-center gap-2 pt-1" dir="ltr">
              {pinDigits.map((digit, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={isVerifying}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-10 h-13 text-center text-lg font-mono font-bold rounded-xl transition-all duration-200 outline-none select-all ${
                      digit
                        ? 'bg-zinc-800 text-white border-2 border-sky-500/80 shadow-[0_0_15px_rgba(14,165,233,0.35)]'
                        : 'bg-zinc-900/90 text-zinc-300 border border-zinc-700/80 focus:border-sky-400 focus:bg-zinc-800'
                    } ${isVerifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {!digit && (
                    <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-700 pointer-events-none" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Vaziat-e Verifying ya Error */}
            <div className="min-h-[22px] flex items-center justify-center">
              {isVerifying ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sky-400 text-xs font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال اعتبارسنجی خودکار در حافظه RAM...</span>
                </motion.div>
              ) : errorMessage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-rose-400 text-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">
                  Auto-Verify: به محض تایپ رقم ششم ارسال می‌شود
                </span>
              )}
            </div>

            {/* Badges-e amaniati */}
            <div className="w-full pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1 text-emerald-400/90">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Disk Policy</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Kill-Switch on Logoff</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Halate 2: Animatsione narm-e Framer Motion pas az etesale movafagh */
          <motion.div
            key="pairing-success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="py-6 flex flex-col items-center text-center space-y-4"
          >
            {/* Tike sabze derakhshan ba animatsione scale */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.25, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </motion.div>

            <div className="space-y-1">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold text-white tracking-wide"
              >
                متصل شد!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-zinc-400"
              >
                نشست اختصاصی کاربر <span className="text-emerald-400 font-mono font-bold">@{connectedUser}</span> با موفقیت در RAM بارگذاری گردید.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>آماده‌سازی کنسول عملیات دسکتاپ...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dokmeye Ghate Ertebat va Kill Switch dar soorate niaz */}
      {activeSession && (
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">نشست فعال در حافظه</span>
          <button
            type="button"
            onClick={async () => {
              // Paak kardane token az RAM va khabar be server
              try {
                await fetch(`${masterServerUrl.replace(/\/+$/, '')}/api/v1/agent/pair/kill`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${activeSession.token}` }
                });
              } catch (e) {
                console.log('[KILL-ACTION] Ersal shod:', e);
              }
              setActiveSession(null);
              setIsSuccessAnim(false);
              setPinDigits(['', '', '', '', '', '']);
              if (onKillSession) onKillSession();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors border border-rose-500/20"
          >
            <Power className="w-3.5 h-3.5" />
            <span>خروج و قطع ارتباط (Kill)</span>
          </button>
        </div>
      )}
    </div>
  );
};
