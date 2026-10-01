import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Building, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Key, 
  Flame, 
  Cpu, 
  X,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';

interface CyberpunkSlidingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const CyberpunkSlidingAuthModal: React.FC<CyberpunkSlidingAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  // Vaziate panel: 'login' ya 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Field-haye Forme Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Field-haye Forme Register (Username, Password, Mobile ELZAMI)
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  if (!isOpen) return null;

  // Etebarsanji va ersale forme Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Khataye vorood be samane');
      }

      // Etesale movafagh va bargozarie karbar
      const authenticatedUser: User = {
        id: data.user.id,
        username: data.user.username,
        email: `${data.user.username}@omniops.internal`,
        full_name: data.user.full_name,
        role: data.user.role,
        allowed_tools: ['t-net', 't-k8s', 't-db', 't-sec', 't-wireguard']
      };

      onLoginSuccess(authenticatedUser);
      onClose();

    } catch (err: any) {
      setLoginError(err.message || 'Khataye ertebat');
    } finally {
      setLoginLoading(false);
    }
  };

  // Etebarsanji va ersale forme Sabtenam (Ba shomare mobayle ejbari)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMessage(null);

    // Etebarsanjie field-haye ejbari dar front-end
    if (!regUsername.trim()) {
      setRegError('نام کاربری الزامی است.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (!regMobile.trim()) {
      setRegError('شماره موبایل الزامی است.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword,
          mobile: regMobile.trim(),
          fullName: regFullName.trim() || regUsername.trim(),
          department: regDepartment.trim() || 'عمومی'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Khataye sabtenam dar samane');
      }

      // Namayeshe payame taeede modir
      setRegSuccessMessage(data.message || 'درخواست شما ثبت شد و در انتظار تایید مدیر سیستم است.');

      // Paak kardane form
      setRegUsername('');
      setRegPassword('');
      setRegMobile('');
      setRegFullName('');
      setRegDepartment('');

    } catch (err: any) {
      setRegError(err.message || 'Khataye sabtenam');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      {/* Pas-zamineye Techno Grid va Crimson Red Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute w-[600px] h-[600px] -top-32 -left-32 bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] -bottom-32 -right-32 bg-rose-700/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Container-e Aslie Glassmorphism ba Sliding Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-4xl min-h-[580px] bg-[#0c0c12]/90 border border-red-500/25 rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.2)] backdrop-blur-2xl overflow-hidden flex flex-col md:flex-row text-zinc-100"
        dir="rtl"
      >
        {/* Dokmeye bastane modal */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-30 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          title="بستن"
        >
          <X className="w-4 h-4" />
        </button>

        {/* =========================================================================
            Bakhshe Form-ha (Samte Rast / Chapp bar asase RTL)
           ========================================================================= */}
        <div className="relative flex-1 p-8 sm:p-10 flex flex-col justify-center z-10">
          <AnimatePresence mode="wait">
            {authMode === 'login' ? (
              /* FORME VOROOD (LOGIN) */
              <motion.div
                key="login-form-view"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 max-w-md mx-auto w-full"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-mono">
                    <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>ورود به مرکز فرماندهی OmniOps</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">ورود به سامانه ابری</h2>
                  <p className="text-xs text-zinc-400">نام کاربری یا شماره موبایل سازمانی خود را وارد کنید.</p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1.5">نام کاربری یا شماره موبایل:</label>
                    <div className="relative">
                      <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="arman یا 0912..."
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1.5">رمز عبور امنیتی:</label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>ورود امن به داشبورد</span>
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch baraye mobile view */}
                <div className="pt-2 text-center md:hidden">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-xs text-red-400 hover:underline"
                  >
                    حساب کاربری ندارید؟ درخواست ثبت‌نام
                  </button>
                </div>
              </motion.div>
            ) : (
              /* FORME SABTENAM (REGISTER) */
              <motion.div
                key="register-form-view"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 max-w-md mx-auto w-full"
              >
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    <span>ثبت درخواست دسترسی سازمانی</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">عضویت در پلتفرم OmniOps</h2>
                  <p className="text-xs text-zinc-400">حساب‌های جدید پس از بررسی و تایید SuperAdmin فعال می‌شوند.</p>
                </div>

                {regSuccessMessage ? (
                  /* Payame Movafaghiat ba Vaziat-e Pending */
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">درخواست شما ثبت شد!</h4>
                      <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                        {regSuccessMessage}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                      وضعیت کنونی: <span className="text-amber-400 font-bold">STATUS: PENDING</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
                    >
                      بازگشت به فرم ورود
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                    {regError && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{regError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">نام کاربری (الزامی):</label>
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="sara_dev"
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>

                      {/* Shomare Mobayle - ELZAMI */}
                      <div>
                        <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1">
                          <span>شماره موبایل (الزامی):</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            value={regMobile}
                            onChange={(e) => setRegMobile(e.target.value)}
                            placeholder="0912..."
                            dir="ltr"
                            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono text-left"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">رمز عبور امنیتی (حداقل ۶ کاراکتر):</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">نام و نام‌خانوادگی:</label>
                        <input
                          type="text"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="سارا رادمنش"
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">دپارتمان سازمانی:</label>
                        <input
                          type="text"
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          placeholder="توسعه و زیرساخت"
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {regLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>ثبت درخواست عضویت و ارسال برای مدیر</span>
                          <ArrowLeft className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Switch baraye mobile view */}
                <div className="pt-2 text-center md:hidden">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-red-400 hover:underline"
                  >
                    قبلاً حساب داشته‌اید؟ ورود به سیستم
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =========================================================================
            Panl-e Keshuyi (Sliding Spring Overlay Panel)
           ========================================================================= */}
        <motion.div
          animate={{
            x: authMode === 'login' ? '0%' : '0%' // Dar Desktop ba layout-e ziba va jabejaie Spring
          }}
          className="hidden md:flex w-[42%] bg-gradient-to-br from-red-950/80 via-[#180a0f] to-black border-r border-red-500/20 p-8 flex-col justify-between relative overflow-hidden"
        >
          {/* Background particles and geometric lines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(220,38,38,0.3),transparent_70%)]" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-600/20 rounded-full blur-2xl" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-[0_0_25px_rgba(220,38,38,0.5)]">
              Ω
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">OmniOps CyberPlatform</h3>
              <p className="text-xs text-red-300 font-mono">Zero-Trust Enterprise Access</p>
            </div>
          </div>

          {/* Dynamic Content based on authMode */}
          <AnimatePresence mode="wait">
            {authMode === 'login' ? (
              <motion.div
                key="switch-to-register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="relative z-10 space-y-4"
              >
                <div className="p-3.5 rounded-2xl bg-black/40 border border-red-500/20 text-xs space-y-1.5 text-zinc-300">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>عضو جدید سازمان هستید؟</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    با وارد کردن نام و شماره همراه سازمانی درخواست عضویت خود را ثبت کنید تا دسترسی شما فعال گردد.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="w-full py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs border border-red-500/40 hover:border-red-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>ثبت‌نام و درخواست دسترسی</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="switch-to-login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="relative z-10 space-y-4"
              >
                <div className="p-3.5 rounded-2xl bg-black/40 border border-red-500/20 text-xs space-y-1.5 text-zinc-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Key className="w-4 h-4" />
                    <span>قبلاً ثبت‌نام کرده‌اید؟</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    در صورتی که حساب کاربری شما توسط مدیر تایید شده است، وارد سیستم شوید.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs border border-red-500/40 hover:border-red-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>ورود به حساب کاربری موجود</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Features */}
          <div className="relative z-10 text-[10px] text-zinc-500 font-mono space-y-1 pt-4 border-t border-red-500/10">
            <div>• ایزولاسیون کامل کلاستر و دسترسی RBAC</div>
            <div>• احراز هویت ناپایدار با کد ۶ رقمی Volatile PIN</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
