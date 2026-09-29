import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Shield, 
  KeyRound, 
  User as UserIcon, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  X, 
  Check, 
  Terminal, 
  Network, 
  MousePointer, 
  Monitor, 
  HelpCircle,
  Laptop
} from 'lucide-react';

interface AuthModalProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  usersList: User[];
  onAddUser?: (user: { username: string; email: string; role: UserRole; full_name: string }) => void;
  onUpdateUserPermissions?: (userId: number, allowedTools: string[]) => void;
}

export const MASTER_TOOLS = [
  { id: 't-chrome', name: 'افزونه کروم (Chrome Extension Agent)', category: 'وب و مرورگر', desc: 'استخراج داده‌های تب‌های فعال کروم، DOM صفحات، پایش ترافیک وب و اتوماسیون مرورگر' },
  { id: 't-winbox', name: 'MikroTik Winbox v3.40', category: 'شبکه', desc: 'مدیریت و پیکربندی فایروال و روتر MikroTik' },
  { id: 't-wireshark', name: 'Wireshark Packet Analyzer', category: 'شبکه', desc: 'شنود بسته و تحلیل ترافیک شبکه' },
  { id: 't-nmap', name: 'Nmap Security Scanner', category: 'شبکه', desc: 'اسکن پورت و تست نفوذ فایروال' },
  { id: 't-putty', name: 'PuTTY / Cisco CLI', category: 'شبکه', desc: 'کنسول SSH سوئیچ‌ها و ترمینال ریموت' },
  { id: 't-winrm', name: 'Windows Remote Management (WinRM)', category: 'ویندوز', desc: 'کنترل ریموت و اجرای اسکریپت‌های ویندوز' },
  { id: 't-hid', name: 'Virtual HID (کنترل ماوس و کیبورد)', category: 'اتوماسیون', desc: 'شبیه‌سازی کلیک ماوس و تایپ کیبورد در ویندوز' },
  { id: 't-screen', name: 'Screen Capture & Grabber', category: 'اتوماسیون', desc: 'تصویربرداری از دسکتاپ و پنجره‌های فعال' },
  { id: 't-terminal', name: 'Terminal Shell Execution (Root)', category: 'سرور', desc: 'اجرای مستقیم دستورات شل در سرور مرکزی' }
];

export const AuthModule: React.FC<AuthModalProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  usersList,
  onAddUser,
  onUpdateUserPermissions
}) => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('Admin@2026');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tool inspection & permissions modal state
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);
  const [editingUserPermissions, setEditingUserPermissions] = useState<User | null>(null);
  const [tempAllowedTools, setTempAllowedTools] = useState<string[]>([]);

  // New user form state for SuperAdmin
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('User');
  const [newFullName, setNewFullName] = useState('');

  const getUserToolsList = (u: User) => {
    if (u.allowed_tools !== undefined) {
      return MASTER_TOOLS.filter((t) => u.allowed_tools!.includes(t.id)).map((t) => t.name);
    }
    if (u.active_tools_list && u.active_tools_list.length > 0) {
      return u.active_tools_list;
    }
    if (u.role === 'SuperAdmin') {
      return MASTER_TOOLS.map((t) => t.name);
    }
    if (u.role === 'Admin') {
      return ['MikroTik Winbox v3.40', 'Wireshark Packet Analyzer', 'Nmap Security Scanner', 'Windows Remote Management (WinRM)', 'PuTTY / Cisco CLI'];
    }
    return [];
  };

  const handleOpenPermissionsModal = (u: User) => {
    setEditingUserPermissions(u);
    const existing = u.allowed_tools !== undefined 
      ? u.allowed_tools 
      : (
        u.role === 'SuperAdmin'
          ? MASTER_TOOLS.map((t) => t.id)
          : u.role === 'Admin'
          ? ['t-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm']
          : []
      );
    setTempAllowedTools(existing);
  };

  const handleToggleToolPermission = (toolId: string) => {
    setTempAllowedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSelectAllTools = () => {
    setTempAllowedTools(MASTER_TOOLS.map((t) => t.id));
  };

  const handleDeselectAllTools = () => {
    setTempAllowedTools([]);
  };

  const handleSavePermissions = () => {
    if (editingUserPermissions) {
      if (onUpdateUserPermissions) {
        onUpdateUserPermissions(editingUserPermissions.id, tempAllowedTools);
      }
      setSuccessMsg(`مجوزهای ابزاری کاربر @${editingUserPermissions.username} با موفقیت به‌روزرسانی شد (${tempAllowedTools.length} ابزار فعال).`);
      setEditingUserPermissions(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-configured accounts for testing, synced with usersList state
    if (username === 'superadmin' && password === 'Admin@2026') {
      const match = usersList.find((u) => u.username === 'superadmin') || {
        id: 1,
        username: 'superadmin',
        email: 'director@omniops.internal',
        role: 'SuperAdmin' as UserRole,
        full_name: 'مدیر کل سامانه (SuperAdmin)',
        created_at: '2026-01-01 08:00',
        agent_connected: true,
        allowed_tools: MASTER_TOOLS.map((t) => t.id),
        active_tools_count: MASTER_TOOLS.length
      };
      onLoginSuccess(match);
      setSuccessMsg('ورود موفقیت‌آمیز به عنوان مدیر ارشد سیستم');
    } else if (username === 'itadmin' && password === 'It@2026') {
      const match = usersList.find((u) => u.username === 'itadmin') || {
        id: 2,
        username: 'itadmin',
        email: 'it-lead@omniops.internal',
        role: 'Admin' as UserRole,
        full_name: 'مدیر فناوری اطلاعات (IT Admin)',
        created_at: '2026-02-15 10:30',
        agent_connected: true,
        allowed_tools: ['t-chrome', 't-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm'],
        active_tools_count: 6
      };
      onLoginSuccess(match);
      setSuccessMsg('ورود موفقیت‌آمیز به عنوان مدیر IT');
    } else if (username === 'user' && password === 'User@2026') {
      const match = usersList.find((u) => u.username === 'user') || {
        id: 3,
        username: 'user',
        email: 'operator@omniops.internal',
        role: 'User' as UserRole,
        full_name: 'کارشناس عملیات (Standard User)',
        created_at: '2026-03-01 12:00',
        agent_connected: true,
        allowed_tools: [],
        active_tools_count: 0
      };
      onLoginSuccess(match);
      setSuccessMsg('ورود موفقیت‌آمیز کاربر عادی');
    } else {
      const found = usersList.find((u) => u.username === username);
      if (found) {
        onLoginSuccess(found);
        setSuccessMsg(`ورود موفقیت‌آمیز با نام کاربری @${found.username}`);
      } else {
        setErrorMsg('نام کاربری یا رمز عبور اشتباه است. (راهنما: superadmin / Admin@2026 یا itadmin / It@2026 یا user / User@2026)');
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail) return;
    if (onAddUser) {
      onAddUser({
        username: newUsername,
        email: newEmail,
        role: newRole,
        full_name: newFullName
      });
      setSuccessMsg(`کاربر ${newUsername} با نقش ${newRole} با موفقیت افزوده شد`);
      setNewUsername('');
      setNewEmail('');
      setNewFullName('');
    }
  };

  if (currentUser) {
    return (
      <div className="space-y-6">
        {/* User Card */}
        <div className="bg-[#18181B] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{currentUser.full_name || currentUser.username}</h3>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <span>@{currentUser.username}</span>
                  <span>·</span>
                  <span>{currentUser.email}</span>
                  <span>·</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    currentUser.role === 'SuperAdmin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    currentUser.role === 'Admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-neutral-800 text-neutral-300'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              خروج از حساب
            </button>
          </div>
        </div>

        {/* SuperAdmin Management Panel */}
        {currentUser.role === 'SuperAdmin' && (
          <div className="bg-[#18181B] border border-neutral-800 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-400" />
              مدیریت کاربران و سطوح دسترسی (RBAC)
            </h4>

            {/* Create form */}
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-neutral-900/60 rounded-lg border border-neutral-800/80">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">نام کاربری</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="admin_network"
                  className="w-full bg-[#111113] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">ایمیل سازمانی</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@omniops.internal"
                  className="w-full bg-[#111113] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">سطح دسترسی (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-[#111113] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="SuperAdmin">SuperAdmin (مدیر کل)</option>
                  <option value="Admin">Admin (مدیر فناوری اطلاعات)</option>
                  <option value="User">User (کاربر عادی)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                >
                  افزودن کاربر جدید
                </button>
              </div>
            </form>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="py-2.5 px-3">شناسه</th>
                    <th className="py-2.5 px-3">نام و مشخصات</th>
                    <th className="py-2.5 px-3">نام کاربری</th>
                    <th className="py-2.5 px-3">سطح دسترسی</th>
                    <th className="py-2.5 px-3">ایجنت محلی (Client Agent)</th>
                    <th className="py-2.5 px-3">مجوز ابزارهای هوش مصنوعی</th>
                    <th className="py-2.5 px-3 text-left">وضعیت حساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-800/30">
                      <td className="py-3 px-3 font-mono text-neutral-400">#{u.id}</td>
                      <td className="py-3 px-3 text-white font-medium">{u.full_name || '—'}</td>
                      <td className="py-3 px-3 font-mono text-neutral-300">@{u.username}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          u.role === 'SuperAdmin' ? 'text-amber-400 bg-amber-400/10' :
                          u.role === 'Admin' ? 'text-blue-400 bg-blue-400/10' :
                          'text-neutral-400 bg-neutral-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.agent_connected ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                              ایجنت فعال ({u.agent_version || 'v2.4'})
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">
                              {u.agent_ip || '192.168.1.104'}
                            </span>

                            {/* Interactive Tools Badge with Hover Popover */}
                            <div 
                              className="relative inline-block"
                              onMouseEnter={() => setHoveredUserId(u.id)}
                              onMouseLeave={() => setHoveredUserId(null)}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenPermissionsModal(u)}
                                className="text-[10px] text-blue-300 hover:text-white bg-blue-500/15 hover:bg-blue-600 border border-blue-500/30 px-2 py-0.5 rounded-md font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                title="نگه داشتن ماوس برای مشاهده لیست ابزارها / کلیک برای مدیریت"
                              >
                                <span>{u.active_tools_count || getUserToolsList(u).length} ابزار فعال</span>
                                <HelpCircle className="w-2.5 h-2.5 opacity-60" />
                              </button>

                              {/* Hover Popover showing exact tools in use */}
                              {hoveredUserId === u.id && (
                                <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-[#1A1A22] border border-neutral-700 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 text-xs text-right">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-700/80 mb-2 font-bold text-white text-[11px]">
                                    <span className="flex items-center gap-1.5">
                                      <Laptop className="w-3.5 h-3.5 text-blue-400" />
                                      <span>ابزارهای در حال استفاده:</span>
                                    </span>
                                    <span className="text-emerald-400 font-mono text-[10px]">Connected</span>
                                  </div>
                                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                                    {getUserToolsList(u).length === 0 ? (
                                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-300 space-y-1">
                                        <div className="font-semibold flex items-center gap-1 text-red-400">
                                          <AlertCircle className="w-3.5 h-3.5" />
                                          <span>فاقد هرگونه مجوز ابزاری</span>
                                        </div>
                                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                                          هوش مصنوعی برای این کاربر دستورات را اجرا نخواهد کرد و خطای «تو دسترسی اجرا فرامین نداری» نمایش می‌دهد.
                                        </p>
                                      </div>
                                    ) : (
                                      getUserToolsList(u).map((toolName, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-200 p-1.5 rounded bg-[#131317] border border-neutral-800/80">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                          <span className="truncate">{toolName}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  <div className="pt-2 mt-2 border-t border-neutral-800 text-[10px] text-blue-400 text-center font-medium">
                                    جهت تغییر یا تخصیص دسترسی کلیک نمایید
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                              <span>فاقد ایجنت فعال (متوقف)</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleOpenPermissionsModal(u)}
                          className="px-2.5 py-1 rounded-lg bg-[#14141A] hover:bg-blue-600 hover:text-white border border-neutral-700/80 text-neutral-300 text-[11px] font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Sliders className="w-3 h-3 text-blue-400" />
                          <span>تخصیص ابزارها ({u.allowed_tools ? u.allowed_tools.length : (u.role === 'SuperAdmin' ? 8 : u.role === 'Admin' ? 5 : 0)})</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          فعال
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: RBAC Tool Permissions Manager */}
        {editingUserPermissions && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#141418] border border-neutral-700/80 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      مدیریت سطوح دسترسی به ابزارهای هوش مصنوعی (Tool RBAC)
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      کاربر: <span className="text-white font-mono">@{editingUserPermissions.username}</span> ({editingUserPermissions.full_name})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUserPermissions(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-200/90 leading-relaxed">
                تنها ابزارهای تیک‌خورده در این بخش توسط هوش مصنوعی در چت‌روم برای این کاربر قابل فراخوانی خواهند بود. در صورت عدم انتخاب، هوش مصنوعی درخواست‌های این ابزار را مسدود و خطای <span className="font-mono text-red-400 font-bold">«عدم دسترسی امنیتی»</span> صادر خواهد کرد.
              </div>

              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-neutral-400 text-[11px]">انتخاب ابزارهای مجاز:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllTools}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
                  >
                    ✓ انتخاب همه (۸ ابزار)
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllTools}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                  >
                    لغو همه (۰ ابزار)
                  </button>
                </div>
              </div>

              {/* Tools Checklist */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {MASTER_TOOLS.map((tool) => {
                  const isChecked = tempAllowedTools.includes(tool.id);
                  return (
                    <label
                      key={tool.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-600/10 border-blue-500/40 text-white'
                          : 'bg-[#18181D] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleToolPermission(tool.id)}
                        className="w-4 h-4 accent-blue-600 rounded mt-0.5 shrink-0"
                      />
                      <div className="flex-1 truncate">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{tool.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{tool.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-400">
                  {tempAllowedTools.length} از {MASTER_TOOLS.length} ابزار مجاز شد
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUserPermissions(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ذخیره مجوزها و اعمال در هوش مصنوعی</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-[#18181B] border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">ورود به OmniOps Enterprise</h2>
            <p className="text-xs text-neutral-400">احراز هویت و دسترسی به ابزارهای سازمانی</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#111113] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="superadmin"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">کلمه عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111113] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <KeyRound className="w-4 h-4" />
            ورود به سیستم
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-800 text-xs text-neutral-400 space-y-2.5">
          <p className="font-semibold text-neutral-300">ورود سریع ۱-کلیکه جهت تست سطوح دسترسی (RBAC):</p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setUsername('superadmin');
                setPassword('Admin@2026');
                const match = usersList.find((u) => u.username === 'superadmin') || {
                  id: 1,
                  username: 'superadmin',
                  email: 'director@omniops.internal',
                  role: 'SuperAdmin' as UserRole,
                  full_name: 'مدیر کل سامانه (SuperAdmin)',
                  agent_connected: true,
                  allowed_tools: MASTER_TOOLS.map((t) => t.id),
                  active_tools_count: 8
                };
                onLoginSuccess(match);
              }}
              className="text-right p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-between text-[11px] transition-colors"
            >
              <span className="font-semibold">۱. مدیر کل سامانه (SuperAdmin)</span>
              <span className="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">مجوز کامل (۸ ابزار)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsername('itadmin');
                setPassword('It@2026');
                const match = usersList.find((u) => u.username === 'itadmin') || {
                  id: 2,
                  username: 'itadmin',
                  email: 'it-lead@omniops.internal',
                  role: 'Admin' as UserRole,
                  full_name: 'مدیر فناوری اطلاعات (IT Admin)',
                  agent_connected: true,
                  allowed_tools: ['t-winbox', 't-wireshark', 't-nmap', 't-putty', 't-winrm'],
                  active_tools_count: 5
                };
                onLoginSuccess(match);
              }}
              className="text-right p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 flex items-center justify-between text-[11px] transition-colors"
            >
              <span className="font-semibold">۲. مدیر شبکه و آیتی (Admin)</span>
              <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">ابزارهای شبکه (۵ ابزار)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsername('user');
                setPassword('User@2026');
                const match = usersList.find((u) => u.username === 'user') || {
                  id: 3,
                  username: 'user',
                  email: 'operator@omniops.internal',
                  role: 'User' as UserRole,
                  full_name: 'کارشناس عملیات (Standard User)',
                  agent_connected: true,
                  allowed_tools: [],
                  active_tools_count: 0
                };
                onLoginSuccess(match);
              }}
              className="text-right p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-between text-[11px] transition-colors"
            >
              <span className="font-semibold">۳. کاربر عادی (User - تست رد دسترسی)</span>
              <span className="font-mono text-[10px] bg-red-500/20 px-2 py-0.5 rounded">فاقد ابزار (تست عدم دسترسی)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
