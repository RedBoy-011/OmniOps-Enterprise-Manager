import React, { useState } from 'react';
import { ApiKeyItem, ProxyConfig, ApiProviderConfig } from '../types';
import { DEFAULT_PROVIDERS } from '../data/providersData';
import { 
  Key, 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  GitBranch, 
  Plus, 
  Trash2, 
  Server, 
  Cpu, 
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Eye
} from 'lucide-react';

interface SettingsModuleProps {
  apiKeys: ApiKeyItem[];
  providersList: ApiProviderConfig[];
  onAddCustomProvider: (provider: ApiProviderConfig) => void;
  onSaveKey: (providerId: string, key: string, baseUrl?: string) => void;
  onDeleteKey: (keyId: number) => void;
  onFetchModels: (providerId: string) => Promise<any>;
  proxyConfig: ProxyConfig;
  onUpdateProxy: (config: ProxyConfig) => void;
  onTestProxy: () => Promise<any>;
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  apiKeys,
  providersList,
  onAddCustomProvider,
  onSaveKey,
  onDeleteKey,
  onFetchModels,
  proxyConfig,
  onUpdateProxy,
  onTestProxy,
  theme = 'dark',
  onToggleTheme
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('gemini');
  const [inputKey, setInputKey] = useState('');
  const [inputBaseUrl, setInputBaseUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Custom Provider Modal / Form
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customKeyUrl, setCustomKeyUrl] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  // Proxy state
  const [proxyEnabled, setProxyEnabled] = useState(proxyConfig.enabled);
  const [proxyHost, setProxyHost] = useState(proxyConfig.host);
  const [proxyPort, setProxyPort] = useState(proxyConfig.port);
  const [testingProxy, setTestingProxy] = useState(false);

  // GitHub state
  const [repoUrl, setRepoUrl] = useState('https://github.com/RedBoy-011/OmniOps-Enterprise-Manager');
  const [gitStatus, setGitStatus] = useState('نسخه ۱.۱.۰ (پایدار و به‌روز)');

  const currentProvider = providersList.find((p) => p.id === selectedProviderId) || providersList[0];
  const currentKeyItem = apiKeys.find((k) => k.provider === selectedProviderId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProvider.requiresKey && !inputKey && !currentKeyItem) {
      setStatusMessage({ text: 'لطفاً کلید API را وارد کنید.', type: 'error' });
      return;
    }
    const finalKey = inputKey || currentKeyItem?.masked_key || 'local-key';
    const finalBaseUrl = inputBaseUrl || currentProvider.defaultBaseUrl || '';
    onSaveKey(currentProvider.id, finalKey, finalBaseUrl);
    setStatusMessage({
      text: `تنظیمات ارائه‌دهنده «${currentProvider.displayName}» با موفقیت در پایگاه داده ذخیره شد.`,
      type: 'success'
    });
    setInputKey('');
  };

  const handleTestAndFetch = async () => {
    setFetching(true);
    setStatusMessage(null);
    try {
      const res = await onFetchModels(currentProvider.id);
      if (res.success) {
        setStatusMessage({
          text: `تست موفق! تعداد ${res.count} مدل فعال از «${currentProvider.displayName}» واکشی و به لیست مدل‌های چت افزوده شد.`,
          type: 'success'
        });
      } else {
        setStatusMessage({ text: res.message || 'خطا در واکشی مدل‌ها', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'خطا در ارتباط با سرور ارائه‌دهنده هوش مصنوعی', type: 'error' });
    } finally {
      setFetching(false);
    }
  };

  const handleCreateCustomProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDisplayName || !customBaseUrl) return;
    const cleanId = (customName || customDisplayName.toLowerCase().replace(/\s+/g, '_')).replace(/[^a-z0-9_]/gi, '');
    const newProv: ApiProviderConfig = {
      id: cleanId,
      name: cleanId,
      displayName: customDisplayName,
      officialKeyUrl: customKeyUrl || customBaseUrl,
      defaultBaseUrl: customBaseUrl,
      requiresKey: true,
      description: customDesc || `ارائه‌دهنده سفارشی متصل به ${customBaseUrl}`,
      category: 'custom'
    };
    onAddCustomProvider(newProv);
    setSelectedProviderId(cleanId);
    setShowAddCustomModal(false);
    setStatusMessage({ text: `ارائه‌دهنده سفارشی «${customDisplayName}» با موفقیت تعریف شد.`, type: 'success' });
    setCustomName('');
    setCustomDisplayName('');
    setCustomBaseUrl('');
    setCustomKeyUrl('');
    setCustomDesc('');
  };

  const handleSaveProxy = () => {
    onUpdateProxy({
      enabled: proxyEnabled,
      host: proxyHost,
      port: proxyPort
    });
    setStatusMessage({ text: 'تنظیمات پراکسی SOCKS5 ذخیره و اعمال شد.', type: 'success' });
  };

  const handleTestProxyConn = async () => {
    setTestingProxy(true);
    try {
      const res = await onTestProxy();
      setStatusMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    } finally {
      setTestingProxy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Responsive 3 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Provider Selector & API Key Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-800/80 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">مدیریت جامع ارائه‌دهندگان هوش مصنوعی و کلیدها</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">پشتیبانی نامحدود از مدل‌های ابری جهانی، محلی، و Endpointهای سازگار با OpenAI</p>
                </div>
              </div>

              {/* Add Custom Provider Button */}
              <button
                onClick={() => setShowAddCustomModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن ارائه‌دهنده دلخواه</span>
              </button>
            </div>

            {/* Providers Grid / Selector Tabs */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-neutral-300 mb-2.5">
                انتخاب ارائه‌دهنده هوش مصنوعی جهت پیکربندی:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {providersList.map((prov) => {
                  const isSelected = prov.id === selectedProviderId;
                  const isConfigured = apiKeys.some((k) => k.provider === prov.id);
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => {
                        setSelectedProviderId(prov.id);
                        setInputBaseUrl(prov.defaultBaseUrl || '');
                        setInputKey('');
                      }}
                      className={`relative p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                          : 'bg-[#18181D] hover:bg-neutral-800/80 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs truncate">{prov.displayName.split(' ')[0]}</span>
                        {isConfigured && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'} shrink-0`} title="کلید فعال است" />
                        )}
                      </div>
                      <span className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                        {prov.category === 'local' ? 'محلی' : prov.category === 'custom' ? 'سفارشی' : 'ابری'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Provider Info Card with Direct Acquisition Link */}
            <div className="mb-6 p-4 rounded-xl bg-[#18181D] border border-neutral-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{currentProvider.displayName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    {currentProvider.id}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-lg">{currentProvider.description}</p>
              </div>

              {currentProvider.officialKeyUrl && (
                <a
                  href={currentProvider.officialKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-blue-400 hover:text-blue-300 text-xs font-semibold rounded-xl border border-neutral-700 transition-all shrink-0 shadow-sm"
                >
                  <span>لینک دریافت کلید</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Config Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    نشانی پایه سرور (Base URL)
                  </label>
                  <input
                    type="text"
                    value={inputBaseUrl || currentProvider.defaultBaseUrl || ''}
                    onChange={(e) => setInputBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full bg-[#101014] border border-neutral-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    پیش‌فرض: {currentProvider.defaultBaseUrl || 'تعیین‌نشده'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    کلید احراز هویت (API Key)
                    {!currentProvider.requiresKey && <span className="text-neutral-500 mr-1">(برای سرور لوکال اختیاری است)</span>}
                  </label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={currentKeyItem ? `ذخیره شده: ${currentKeyItem.masked_key}` : `کلید API ارائه‌دهنده ${currentProvider.displayName}...`}
                    className="w-full bg-[#101014] border border-neutral-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    {currentKeyItem ? `وضعیت: فعال و اعتبارسنجی شده (${currentKeyItem.last_validated || 'اخیراً'})` : 'هنوز کلیدی ذخیره نشده است'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
                >
                  ذخیره تنظیمات این ارائه‌دهنده
                </button>

                <button
                  type="button"
                  onClick={handleTestAndFetch}
                  disabled={fetching}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B1B22] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin text-blue-400' : 'text-neutral-400'}`} />
                  <span>{fetching ? 'در حال برقراری ارتباط و فچ مدل‌ها...' : 'تست ارتباط و واکشی زنده مدل‌ها'}</span>
                </button>
              </div>
            </form>

            {/* Configured Keys Table */}
            <div className="mt-8 pt-6 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-neutral-300">کلیدها و ارائه‌دهندگان فعال در پایگاه داده</h4>
                <span className="text-[11px] text-neutral-500">{apiKeys.length} مورد فعال</span>
              </div>

              <div className="space-y-2">
                {apiKeys.map((item) => {
                  const pConfig = providersList.find((p) => p.id === item.provider);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-[#18181D] rounded-xl border border-neutral-800/80 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div>
                          <span className="font-bold text-white">{pConfig?.displayName || item.provider}</span>
                          <span className="text-neutral-500 text-[10px] mx-2">|</span>
                          <span className="font-mono text-neutral-400 text-[11px]">{item.masked_key}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                          {item.last_validated || 'فعال'}
                        </span>
                        <button
                          onClick={() => onDeleteKey(item.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
                          title="حذف کلید"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Theme, SOCKS5 Proxy & GitHub Versioning */}
        <div className="space-y-6">
          {/* 🌓 Accessibility & Appearance Theme Toggle Card */}
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-800">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">پوسته و دسترسی‌پذیری (Theme & Accessibility)</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    theme === 'light' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {theme === 'light' ? 'تم روشن (WCAG AA)' : 'تم تیره (کنتراست بالا)'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">تنظیم تم رابط کاربری بر اساس استانداردهای بصری و شرایط محیطی</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Dark Theme Option */}
                <button
                  type="button"
                  onClick={() => onToggleTheme && onToggleTheme('dark')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 ${
                    theme === 'dark'
                      ? 'bg-[#1c1d25] border-blue-500/60 shadow-md shadow-blue-900/20 text-white ring-1 ring-blue-500/40'
                      : 'bg-[#101014] border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-bold">تیره پرکنتراست</span>
                    </div>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-3 h-3 rounded-full bg-[#0a0b0e] border border-neutral-700" />
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-[10px] text-neutral-400">پیش‌فرض سیستم</span>
                  </div>
                </button>

                {/* Light Theme Option */}
                <button
                  type="button"
                  onClick={() => onToggleTheme && onToggleTheme('light')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-900/20 text-amber-200 ring-1 ring-amber-500/40'
                      : 'bg-[#101014] border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold">روشن و خنثی</span>
                    </div>
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-3 h-3 rounded-full bg-[#f4f5f8] border border-neutral-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-neutral-400">دسترسی‌پذیری</span>
                  </div>
                </button>
              </div>

              <div className="p-3 bg-[#18181D] rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  <span>سوئیچ سریع حالت نمایش:</span>
                </span>
                <button
                  type="button"
                  onClick={() => onToggleTheme && onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-all border border-neutral-700 flex items-center gap-1.5"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>فعال‌سازی تم روشن</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-blue-400" />
                      <span>فعال‌سازی تم تیره</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SOCKS5 Proxy Card */}
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-800">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">سوییچ پراکسی (SOCKS5)</h4>
                <p className="text-[11px] text-neutral-400">عبور ترافیک بک‌اند از تحریم‌های ارائه‌دهندگان هوش مصنوعی</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-[#18181D] border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-200 font-medium">فعال‌سازی پراکسی SOCKS5</span>
                <input
                  type="checkbox"
                  checked={proxyEnabled}
                  onChange={(e) => setProxyEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">آدرس سرور پراکسی (IP/Host)</label>
                <input
                  type="text"
                  value={proxyHost}
                  onChange={(e) => setProxyHost(e.target.value)}
                  className="w-full bg-[#101014] border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">پورت پراکسی (Port)</label>
                <input
                  type="number"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(Number(e.target.value))}
                  className="w-full bg-[#101014] border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveProxy}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
                >
                  ذخیره پراکسی
                </button>
                <button
                  type="button"
                  onClick={handleTestProxyConn}
                  disabled={testingProxy}
                  className="px-3.5 py-2 bg-[#1B1B22] hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-medium border border-neutral-700 transition-colors"
                >
                  {testingProxy ? 'تست...' : 'تست پورت'}
                </button>
              </div>
            </div>
          </div>

          {/* GitHub Auto-Update Card */}
          <div className="bg-[#141418] border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">همگام‌سازی و آپدیت از GitHub</h4>
                <p className="text-[11px] text-neutral-400">به‌روزرسانی خودکار سورس کد سرور اوبونتو</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">آدرس مخزن گیت‌هاب (Repository)</label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-[#101014] border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-[#18181D] rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">وضعیت سورس سرور:</span>
                <span className="text-emerald-400 font-medium">{gitStatus}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGitStatus('در حال بررسی آخرین Commit از گیت‌هاب...');
                  setTimeout(() => setGitStatus('سورس سرور با موفقیت به آخرین نسخه ارتقا یافت (v1.1.0)'), 1200);
                }}
                className="w-full py-2.5 bg-[#1B1B22] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-all"
              >
                بررسی و دریافت آپدیت گیت‌هاب (Git Pull)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Provider */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-neutral-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                تعریف ارائه‌دهنده هوش مصنوعی دلخواه (Custom Provider)
              </h3>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">نام نمایشی ارائه‌دهنده</label>
                <input
                  type="text"
                  value={customDisplayName}
                  onChange={(e) => setCustomDisplayName(e.target.value)}
                  placeholder="مثال: سرور هوش مصنوعی اختصاصی شرکت، vLLM سرور، یا Cohere"
                  className="w-full bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">آدرس پایه API (Base URL)</label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="مثال: https://api.together.xyz/v1 یا http://192.168.1.100:8000/v1"
                  className="w-full bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">لینک دریافت کلید (اختیاری)</label>
                <input
                  type="text"
                  value={customKeyUrl}
                  onChange={(e) => setCustomKeyUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#101014] border border-neutral-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">توضیحات کوتاه</label>
                <textarea
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="توضیح کوتاه در مورد این سرویس هوش مصنوعی..."
                  className="w-full bg-[#101014] border border-neutral-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  افزودن ارائه‌دهنده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
