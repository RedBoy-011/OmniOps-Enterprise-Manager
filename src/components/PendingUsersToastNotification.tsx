import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, X, ShieldAlert, AlertCircle, RefreshCw, UserCheck, ChevronLeft, Phone, Building } from 'lucide-react';
import { User } from '../types';

interface PendingUsersToastProps {
  currentUser: User | null;
}

interface PendingUserItem {
  id: number;
  username: string;
  mobile: string;
  full_name: string;
  department: string;
  created_at: string;
}

export const PendingUsersToastNotification: React.FC<PendingUsersToastProps> = ({ currentUser }) => {
  // Tedad va liste karbarane dar hale entezar
  const [pendingUsers, setPendingUsers] = useState<PendingUserItem[]>([]);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Hook: Check kardane karbarane pending vaghti SuperAdmin login mikonad
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'SuperAdmin') {
      setPendingUsers([]);
      return;
    }

    // Daryafte liste karbarane pending az backend
    fetchPendingUsers();

    // Polling har 20 saniye baraye daryafte darkhast-haye jadid
    const interval = setInterval(fetchPendingUsers, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/pending-users');
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data.users || []);
      }
    } catch (err) {
      console.log('[PENDING-CHECK] Khataye daryaft:', err);
    }
  };

  // Taeede karbar
  const handleApprove = async (userId: number) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/v1/admin/pending-users/${userId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Rade karbar
  const handleReject = async (userId: number) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/v1/admin/pending-users/${userId}/reject`, {
        method: 'POST'
      });
      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Faghat agar SuperAdmin bashad va darkhaste pending bashad namayesh midahad
  if (!currentUser || currentUser.role !== 'SuperAdmin' || pendingUsers.length === 0 || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Toast-e Shenavar dar goosheye payin-rast (RTL) */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed bottom-14 right-5 z-40 max-w-sm w-full bg-[#121016]/95 border-2 border-red-500/40 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(220,38,38,0.3)] backdrop-blur-xl text-zinc-100 flex items-center justify-between gap-3 select-none"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center animate-bounce shadow-md">
                {pendingUsers.length}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>درخواست‌های ثبت‌نام جدید</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                شما <span className="text-red-400 font-bold font-mono">{pendingUsers.length}</span> درخواست در انتظار تایید دارید.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition shadow-sm"
            >
              بررسی
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
              title="بستن موقت"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal-e Barresi va Taeede Karbarane Pending */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0e0e14] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-zinc-100 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">مدیریت درخواست‌های ثبت‌نام در انتظار</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">Status: Pending SuperAdmin Approval</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List-e karbaran */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {pendingUsers.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  هیچ کاربری در صف انتظار وجود ندارد.
                </div>
              ) : (
                pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-850 space-y-2.5 hover:border-red-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs block">{u.full_name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">@{u.username}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[9px] border border-amber-500/20">
                        در انتظار تایید
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-900">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-red-400" />
                        <span>موبایل: {u.mobile}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-zinc-500" />
                        <span>واحد: {u.department || 'عمومی'}</span>
                      </div>
                    </div>

                    {/* Dokmehaye Taeed va Rad */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-900">
                      <button
                        type="button"
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleReject(u.id)}
                        className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-xs transition"
                      >
                        رد درخواست
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === u.id}
                        onClick={() => handleApprove(u.id)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
                      >
                        {actionLoadingId === u.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تایید و فعال‌سازی حساب</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
              >
                بستن پنجره
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
