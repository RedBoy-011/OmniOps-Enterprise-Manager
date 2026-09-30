import React, { useState, useMemo } from 'react';
import { AiModel } from '../types';
import {
  Sparkles,
  Zap,
  Cpu,
  Clock,
  CheckCircle2,
  HardDrive,
  Globe,
  Coins,
  Shield,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Brain,
  Eye,
  Wrench,
  FileCode
} from 'lucide-react';

export interface RankedModelItem extends AiModel {
  rank: number;
  rankBadge: string;
  smartScore: number;
  costTier: 'free_local' | 'ultra_low' | 'standard' | 'flagship';
  costTierLabel: string;
  sourceType: 'local_node' | 'internal_api' | 'cloud_api';
  specialties: string[];
}

interface ModelRankingSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: AiModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelRankingSelectorModal: React.FC<ModelRankingSelectorModalProps> = ({
  isOpen,
  onClose,
  availableModels,
  selectedModelId,
  onSelectModel
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'local_internal' | 'cloud_active' | 'agentic_tools'>('all');
  const [sortCriteria, setSortCriteria] = useState<'smart' | 'latency' | 'cost' | 'reasoning'>('smart');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Enhanced model metadata and dynamic ranking computation
  const rankedModelsList: RankedModelItem[] = useMemo(() => {
    const enriched = availableModels.map((m) => {
      const isLocal = ['ollama', 'anythingllm', 'jev', 'lmstudio', 'langflow', 'ember'].includes(m.provider);
      const isEmber = m.id === 'ember-1' || m.model_id.includes('ember');
      const isJev = m.provider === 'jev';
      const isClaude = m.provider === 'anthropic' || m.model_id.includes('claude');
      const isGeminiFlash = m.id === 'gemini-2.5-flash' || m.model_id === 'gemini-2.5-flash';
      const isGroq = m.provider === 'groq';
      const isDeepSeek = m.provider === 'deepseek' || m.model_id.includes('deepseek');

      let costTier: 'free_local' | 'ultra_low' | 'standard' | 'flagship' = 'standard';
      let costTierLabel = 'استاندارد کلاود';
      let sourceType: 'local_node' | 'internal_api' | 'cloud_api' = 'cloud_api';

      if (isLocal) {
        costTier = 'free_local';
        costTierLabel = '۰ توکن (محلی/داخلی)';
        sourceType = isEmber ? 'internal_api' : 'local_node';
      } else if (isGeminiFlash || isGroq || isDeepSeek) {
        costTier = 'ultra_low';
        costTierLabel = 'فوق‌العاده ارزان و پرسرعت';
      } else if (isClaude || m.model_id.includes('pro') || m.model_id.includes('gpt-4o')) {
        costTier = 'flagship';
        costTierLabel = 'پرچمدار استدلال عمیق';
      }

      const specialties: string[] = [];
      if (m.supports_vision) specialties.push('Vision');
      if (isEmber || isClaude || isGeminiFlash) specialties.push('Tool Calling');
      if (isDeepSeek || isClaude || isEmber) specialties.push('Code');
      if (isClaude || m.model_id.includes('pro') || isDeepSeek) specialties.push('Reasoning');
      if (isLocal) specialties.push('Zero-Token');
      if (m.context_length >= 1000000) specialties.push('1M+ Context');

      // Calculate composite score (Higher is better)
      // Latency weight: lower latency gives more points (max 50 points)
      const latencyScore = Math.max(0, 50 - Math.min(m.latency_ms, 300) / 6);
      // Cost weight: local gets 35 points, ultra low gets 25, standard gets 15, flagship gets 10
      const costScore = costTier === 'free_local' ? 35 : costTier === 'ultra_low' ? 25 : costTier === 'standard' ? 15 : 10;
      // Capability weight:
      const capScore = (m.supports_vision ? 10 : 0) + (specialties.includes('Tool Calling') ? 10 : 0) + (m.context_length > 100000 ? 8 : 4);
      // Online bonus
      const statusScore = m.status === 'online' ? 15 : 0;

      const smartScore = Math.round(latencyScore + costScore + capScore + statusScore);

      return {
        ...m,
        rank: 0,
        rankBadge: '',
        smartScore,
        costTier,
        costTierLabel,
        sourceType,
        specialties
      };
    });

    // Sort based on chosen criteria
    enriched.sort((a, b) => {
      if (sortCriteria === 'smart') {
        return b.smartScore - a.smartScore;
      } else if (sortCriteria === 'latency') {
        return a.latency_ms - b.latency_ms;
      } else if (sortCriteria === 'cost') {
        const costWeight = { free_local: 4, ultra_low: 3, standard: 2, flagship: 1 };
        return costWeight[b.costTier] - costWeight[a.costTier] || a.latency_ms - b.latency_ms;
      } else {
        // reasoning
        const hasReasoningA = a.specialties.includes('Reasoning') ? 10 : 0;
        const hasReasoningB = b.specialties.includes('Reasoning') ? 10 : 0;
        return (hasReasoningB + b.context_length / 100000) - (hasReasoningA + a.context_length / 100000);
      }
    });

    // Assign rank positions and badges
    return enriched.map((item, idx) => {
      const rankNum = idx + 1;
      let rankBadge = `#${rankNum}`;
      if (rankNum === 1) rankBadge = '🥇 #1 رتبه اول';
      else if (rankNum === 2) rankBadge = '🥈 #2 رتبه دوم';
      else if (rankNum === 3) rankBadge = '🥉 #3 رتبه سوم';

      return {
        ...item,
        rank: rankNum,
        rankBadge
      };
    });
  }, [availableModels, sortCriteria]);

  // Filter models based on search and category tab
  const filteredModels = useMemo(() => {
    return rankedModelsList.filter((m) => {
      const matchSearch =
        m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.model_id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterCategory === 'local_internal') {
        return m.sourceType === 'local_node' || m.sourceType === 'internal_api';
      }
      if (filterCategory === 'cloud_active') {
        return m.sourceType === 'cloud_api';
      }
      if (filterCategory === 'agentic_tools') {
        return m.specialties.includes('Tool Calling') || m.id === 'ember-1' || m.provider === 'ember';
      }
      return true;
    });
  }, [rankedModelsList, filterCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-[#12131C] border border-neutral-700/80 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-[#161724] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-blue-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  رتبه‌بندی پویای مدل‌های فعال (Dynamic Model Ranking)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Auto-Ranked
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                رتبه‌بندی خودکار مدل‌ها بر اساس وضعیت اتصال APIها، گره‌های لوکال و داخلی (Ember-1)، سرعت پاسخ و بهینگی هزینه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-neutral-800 bg-[#0E0F17] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در بین مدل‌های لوکال، داخلی و کلاود..."
                className="w-full bg-[#161722] border border-neutral-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-semibold">
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>معیار رتبه‌بندی:</span>
              </span>
              <select
                value={sortCriteria}
                onChange={(e) => setSortCriteria(e.target.value as any)}
                className="bg-[#161722] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="smart">امتیاز جامع هوشمند (پیش‌فرض)</option>
                <option value="latency">کمترین تأخیر و بالاترین سرعت (ms)</option>
                <option value="cost">صرفه‌جویی هزینه و مدل‌های محلی (۰ توکن)</option>
                <option value="reasoning">استدلال عمیق و پنجره زمینه بزرگ</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCategory === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>همه مدل‌ها ({rankedModelsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory('local_internal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCategory === 'local_internal'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-md'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>مدل‌های محلی و گره‌های داخلی (Ember-1 / اولاما)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory('cloud_active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCategory === 'cloud_active'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>مدل‌های کلاود فعال (Gemini, Claude, GPT-4o, Groq)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory('agentic_tools')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterCategory === 'agentic_tools'
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-purple-400" />
              <span>عامل‌محور و Tool-Calling سریع</span>
            </button>
          </div>
        </div>

        {/* Model Cards List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 bg-[#090A10]">
          {filteredModels.map((model) => {
            const isSelected = model.model_id === selectedModelId || model.id === selectedModelId;
            const isRank1 = model.rank === 1;
            const isRank2 = model.rank === 2;
            const isRank3 = model.rank === 3;

            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.model_id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right ${
                  isSelected
                    ? 'bg-blue-950/40 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : isRank1
                    ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                    : 'bg-[#12131C] border-neutral-800 hover:border-neutral-700 hover:bg-[#161724]'
                }`}
              >
                {/* Model Info */}
                <div className="flex items-start gap-3.5">
                  {/* Rank Badge */}
                  <div
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-black shrink-0 flex items-center justify-center ${
                      isRank1
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20'
                        : isRank2
                        ? 'bg-gradient-to-br from-slate-200 to-neutral-400 text-black shadow-md'
                        : isRank3
                        ? 'bg-gradient-to-br from-amber-700 to-yellow-800 text-white shadow-md'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    }`}
                  >
                    {model.rankBadge}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">
                        {model.display_name}
                      </h4>

                      {/* Source Type Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          model.sourceType === 'internal_api'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : model.sourceType === 'local_node'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {model.sourceType === 'internal_api'
                          ? 'گره داخلی Ember-1'
                          : model.sourceType === 'local_node'
                          ? 'هسته محلی (Local Core)'
                          : 'سرویس کلاود (Cloud API)'}
                      </span>

                      {/* Cost Tier Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-neutral-300 border border-neutral-800 font-mono">
                        {model.costTierLabel}
                      </span>
                    </div>

                    {/* Specialties pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {model.specialties.map((spec, sidx) => (
                        <span
                          key={sidx}
                          className="text-[9px] px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-300 border border-neutral-700/60 font-mono"
                        >
                          {spec}
                        </span>
                      ))}
                      <span className="text-[9px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono" dir="ltr">
                        {model.context_length > 1000 ? `${(model.context_length / 1024).toFixed(0)}K ctx` : `${model.context_length} ctx`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Latency, score, and select button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                  <div className="text-left font-mono">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{model.latency_ms} ms</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      امتیاز رتبه: <strong className="text-amber-400">{model.smartScore}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>مدل فعال</span>
                      </>
                    ) : (
                      <span>انتخاب این مدل</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-[#0d0e15] border-t border-neutral-800 text-[11px] text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-2 px-5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              رتبه‌بندی به صورت خودکار با اضافه یا حذف کلیدهای API و راه‌اندازی گره‌های لوکال آپدیت می‌شود.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
