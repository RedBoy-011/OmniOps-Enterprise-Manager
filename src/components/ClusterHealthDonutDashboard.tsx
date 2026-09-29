import React, { useState, useEffect } from 'react';
import { WorkerNode, MASTER_NODE_SPECS } from './ServerManagementModule';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Flame,
  Gauge
} from 'lucide-react';

interface ClusterHealthDonutDashboardProps {
  workerNodes: WorkerNode[];
  onPingNode?: (nodeId: string) => void;
  onSelectNode?: (node: WorkerNode) => void;
}

// Single SVG Donut Chart Component with smooth animation and modern dark aesthetic
export const DonutRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  trackColor?: string;
  gradientId?: string;
  label?: string;
  sublabel?: string;
  valueText?: string;
  icon?: React.ReactNode;
}> = ({
  percentage,
  size = 130,
  strokeWidth = 10,
  primaryColor = '#06b6d4',
  trackColor = '#222228',
  gradientId,
  label,
  sublabel,
  valueText,
  icon
}) => {
  const cleanPercent = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          {gradientId && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
            </linearGradient>
          )}
        </defs>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Active Value Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientId ? `url(#${gradientId})` : primaryColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </svg>

      {/* Center Label / Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none select-none">
        {icon && <div className="mb-0.5">{icon}</div>}
        <span className="text-base font-extrabold font-mono text-white leading-none tracking-tight">
          {valueText || `${cleanPercent}%`}
        </span>
        {label && <span className="text-[10px] text-neutral-400 mt-1 font-medium leading-none">{label}</span>}
        {sublabel && <span className="text-[9px] text-neutral-500 font-mono mt-0.5 leading-none">{sublabel}</span>}
      </div>
    </div>
  );
};

// Dual Concentric Donut Ring (Outer: RAM %, Inner: CPU %)
export const DualDonutRing: React.FC<{
  ramPercent: number;
  cpuPercent: number;
  size?: number;
  ramColor?: string;
  cpuColor?: string;
  nodeTitle?: string;
}> = ({
  ramPercent,
  cpuPercent,
  size = 150,
  ramColor = '#06b6d4',
  cpuColor = '#8b5cf6',
  nodeTitle
}) => {
  const outerWidth = 9;
  const innerWidth = 7;
  const gap = 3;

  const outerRadius = (size - outerWidth) / 2;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const cleanRam = Math.min(100, Math.max(0, Math.round(ramPercent)));
  const outerOffset = outerCircumference - (cleanRam / 100) * outerCircumference;

  const innerRadius = outerRadius - outerWidth - gap;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const cleanCpu = Math.min(100, Math.max(0, Math.round(cpuPercent)));
  const innerOffset = innerCircumference - (cleanCpu / 100) * innerCircumference;

  // Determine overall load status color
  const maxLoad = Math.max(cleanRam, cleanCpu);
  const isWarning = maxLoad >= 75 && maxLoad < 88;
  const isCritical = maxLoad >= 88;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Outer Ring (RAM) Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#1e2029"
          strokeWidth={outerWidth}
          fill="transparent"
        />
        {/* Outer Ring (RAM) Active */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : ramColor}
          strokeWidth={outerWidth}
          fill="transparent"
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />

        {/* Inner Ring (CPU) Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="#181920"
          strokeWidth={innerWidth}
          fill="transparent"
        />
        {/* Inner Ring (CPU) Active */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke={cleanCpu >= 85 ? '#f43f5e' : cpuColor}
          strokeWidth={innerWidth}
          fill="transparent"
          strokeDasharray={innerCircumference}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>

      {/* Center Metrics */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none select-none">
        <div className="flex items-center gap-1 mb-0.5">
          {isCritical ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          ) : isWarning ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="text-[10px] font-bold text-neutral-300">سلامت</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-extrabold font-mono text-cyan-400">{cleanRam}%</span>
          <span className="text-[9px] text-neutral-500 font-mono">RAM</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold font-mono text-purple-400">{cleanCpu}%</span>
          <span className="text-[9px] text-neutral-500 font-mono">CPU</span>
        </div>
      </div>
    </div>
  );
};

export const ClusterHealthDonutDashboard: React.FC<ClusterHealthDonutDashboardProps> = ({
  workerNodes,
  onPingNode,
  onSelectNode
}) => {
  // Live auto-refresh telemetry simulation state
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'ram_focus' | 'cpu_focus' | 'aggregate'>('all');
  const [lastTick, setLastTick] = useState<Date>(new Date());
  const [telemetryVariance, setTelemetryVariance] = useState<Record<string, { ramDelta: number; cpuDelta: number }>>({});

  // Periodic natural fluctuation to simulate real server metrics streaming
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      setLastTick(new Date());
      // Generate slight realistic fluctuation (-2% to +2%)
      const nextVariance: Record<string, { ramDelta: number; cpuDelta: number }> = {};
      workerNodes.forEach(node => {
        nextVariance[node.id] = {
          ramDelta: (Math.random() - 0.5) * 2.5,
          cpuDelta: (Math.random() - 0.5) * 5
        };
      });
      nextVariance['master'] = {
        ramDelta: (Math.random() - 0.5) * 1.5,
        cpuDelta: (Math.random() - 0.5) * 3
      };
      setTelemetryVariance(nextVariance);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveStream, workerNodes]);

  // Master Specs with fluctuation
  const masterRamFluct = Math.min(100, Math.max(10, Math.round(((MASTER_NODE_SPECS.ramUsedGb / MASTER_NODE_SPECS.ramTotalGb) * 100) + (telemetryVariance['master']?.ramDelta || 0))));
  const masterCpuFluct = Math.min(100, Math.max(5, Math.round(MASTER_NODE_SPECS.cpuUsagePercent + (telemetryVariance['master']?.cpuDelta || 0))));

  // All Nodes combined list for unified monitoring
  const allNodesData = [
    {
      id: 'master-node',
      name: MASTER_NODE_SPECS.name,
      ip: MASTER_NODE_SPECS.ip,
      isMaster: true,
      role: 'Master Control-Plane',
      status: MASTER_NODE_SPECS.status,
      cores: MASTER_NODE_SPECS.cpuCores,
      cpuModel: MASTER_NODE_SPECS.cpuModel,
      cpuUsage: masterCpuFluct,
      ramTotal: MASTER_NODE_SPECS.ramTotalGb,
      ramUsed: Number((MASTER_NODE_SPECS.ramUsedGb + (telemetryVariance['master']?.ramDelta ? telemetryVariance['master'].ramDelta * 0.16 : 0)).toFixed(1)),
      ramPercent: masterRamFluct,
      vramTotal: undefined,
      vramUsed: undefined,
      pingMs: MASTER_NODE_SPECS.pingMs,
      models: ['OmniOps Core Hub', 'PostgreSQL DB', 'Redis Cache']
    },
    ...workerNodes.map(node => {
      const ramBase = Math.round((node.specs.ramUsedGb / node.specs.ramTotalGb) * 100);
      const varData = telemetryVariance[node.id];
      const ramPercent = Math.min(100, Math.max(5, Math.round(ramBase + (varData?.ramDelta || 0))));
      const cpuPercent = Math.min(100, Math.max(5, Math.round(node.specs.cpuUsagePercent + (varData?.cpuDelta || 0))));

      return {
        id: node.id,
        name: node.name,
        ip: `${node.sshUser}@${node.ip}`,
        isMaster: false,
        role: node.role === 'llm_heavy' ? 'LLM Heavy Compute' : node.role === 'embedding_rag' ? 'RAG & Vector Search' : 'Hybrid Worker',
        status: node.status,
        cores: node.specs.cpuCores,
        cpuModel: node.specs.cpuModel,
        cpuUsage: cpuPercent,
        ramTotal: node.specs.ramTotalGb,
        ramUsed: Number((node.specs.ramUsedGb + (varData?.ramDelta ? varData.ramDelta * (node.specs.ramTotalGb / 100) : 0)).toFixed(1)),
        ramPercent,
        vramTotal: node.specs.vramTotalGb,
        vramUsed: node.specs.vramUsedGb,
        gpuName: node.specs.gpuName,
        pingMs: node.specs.pingMs,
        models: node.assignedModels
      };
    })
  ];

  // Aggregate Cluster Metrics
  const totalClusterRamGb = allNodesData.reduce((acc, n) => acc + n.ramTotal, 0);
  const totalClusterUsedRamGb = Number(allNodesData.reduce((acc, n) => acc + n.ramUsed, 0).toFixed(1));
  const aggregateRamPercent = Math.round((totalClusterUsedRamGb / totalClusterRamGb) * 100);

  const totalClusterCores = allNodesData.reduce((acc, n) => acc + n.cores, 0);
  const aggregateCpuPercent = Math.round(allNodesData.reduce((acc, n) => acc + n.cpuUsage * n.cores, 0) / totalClusterCores);

  // Overall Health Score (0 - 100)
  const healthScore = Math.max(60, Math.round(100 - (aggregateRamPercent * 0.25 + aggregateCpuPercent * 0.2)));

  return (
    <div className="bg-[#121217] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Top Header of the Donut Dashboard */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-950/40">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                داشبورد دایره‌ای پایش سلامت لحظه‌ای نودها (Cluster Health Radar)
              </h3>
              {isLiveStream && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Telemetry
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              نمایش بصری لحظه‌ای مصرف CPU و RAM سرور مستر و کلیه Worker Nodeهای متصل به همراه سطح سلامت کلاستر
            </p>
          </div>
        </div>

        {/* Controls & Filter Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live stream toggle */}
          <button
            type="button"
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isLiveStream
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
            title="توقف یا ادامه به‌روزرسانی لحظه‌ای متریک‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveStream ? 'animate-spin' : ''}`} />
            <span>{isLiveStream ? 'پایش زنده فعال' : 'پایش متوقف'}</span>
          </button>

          {/* Filter views */}
          <div className="flex items-center bg-[#0D0D10] p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                filterMode === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              همه نودها
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ram_focus')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                filterMode === 'ram_focus' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              تمرکز RAM
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('cpu_focus')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                filterMode === 'cpu_focus' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              تمرکز CPU
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('aggregate')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                filterMode === 'aggregate' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              تجمیع کل کلاستر
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Cluster Donut Hero Summary (Displayed at top or in aggregate mode) */}
      <div className="bg-gradient-to-r from-[#15161E] via-[#12131A] to-[#17141E] border border-neutral-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                وضعیت سلامت کلی کلاستر توزیع‌شده
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                امتیاز سلامت: {healthScore}/100
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-white">
              استخر یکپارچه سخت‌افزاری: {allNodesData.length} سرور آنلاین ({totalClusterRamGb} GB RAM | {totalClusterCores} هسته vCPU)
            </h4>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              توزیع بار بهینه: مصرف میانگین پردازنده در حد مجاز ({aggregateCpuPercent}%) و رم بافر آزاد کافی ({Number((totalClusterRamGb - totalClusterUsedRamGb).toFixed(1))} GB آزاد) جهت اجرای ایمن مدل‌های بزرگ استدلال DeepSeek-R1 و Dorna 2 بدون تاخیر.
            </p>
          </div>

          {/* 3 Donut Gauges in Hero (RAM Aggregate, CPU Aggregate, Overall Health) */}
          <div className="flex flex-wrap items-center justify-center gap-6 shrink-0">
            {/* Cluster RAM Donut */}
            <div className="flex flex-col items-center">
              <DonutRing
                percentage={aggregateRamPercent}
                size={110}
                strokeWidth={9}
                primaryColor="#06b6d4"
                label="مصرف RAM"
                sublabel={`${totalClusterUsedRamGb}/${totalClusterRamGb}GB`}
                icon={<HardDrive className="w-3.5 h-3.5 text-cyan-400" />}
              />
              <span className="text-[11px] font-bold text-cyan-300 mt-2">RAM کلاستر</span>
            </div>

            {/* Cluster CPU Donut */}
            <div className="flex flex-col items-center">
              <DonutRing
                percentage={aggregateCpuPercent}
                size={110}
                strokeWidth={9}
                primaryColor="#a855f7"
                label="بار پردازنده"
                sublabel={`${totalClusterCores} هسته`}
                icon={<Cpu className="w-3.5 h-3.5 text-purple-400" />}
              />
              <span className="text-[11px] font-bold text-purple-300 mt-2">میانگین CPU</span>
            </div>

            {/* Overall Health Index */}
            <div className="flex flex-col items-center">
              <DonutRing
                percentage={healthScore}
                size={110}
                strokeWidth={9}
                primaryColor="#10b981"
                label="پایداری سیستم"
                sublabel="Zero OOM Risk"
                icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              />
              <span className="text-[11px] font-bold text-emerald-300 mt-2">شاخص سلامت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Node Donut Cards Grid (Master + All Worker Nodes) */}
      {filterMode !== 'aggregate' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>تفکیک سرورهای ثبت‌شده در کلاستر ({allNodesData.length} سرور):</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                <span>حلقه خارجی: RAM</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                <span>حلقه داخلی: CPU</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {allNodesData.map((node) => {
              const isHeavy = Math.max(node.ramPercent, node.cpuUsage) >= 80;
              const isNominal = Math.max(node.ramPercent, node.cpuUsage) < 65;

              return (
                <div
                  key={node.id}
                  className={`bg-[#141419] rounded-2xl p-5 border transition-all duration-300 hover:shadow-2xl flex flex-col justify-between ${
                    node.isMaster
                      ? 'border-amber-500/40 bg-gradient-to-b from-[#161622] to-[#121217]'
                      : 'border-neutral-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-neutral-800/80 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          node.isMaster
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {node.isMaster ? <ShieldCheck className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[200px]" title={node.name}>
                              {node.name}
                            </h5>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono block">
                            {node.ip}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          node.isMaster
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {node.isMaster ? 'Master Control' : 'Worker Node'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {node.pingMs}ms
                        </span>
                      </div>
                    </div>

                    {/* Donut Chart Visualization Area */}
                    <div className="flex items-center justify-center py-2">
                      {filterMode === 'all' && (
                        <div className="flex items-center gap-4">
                          <DualDonutRing
                            ramPercent={node.ramPercent}
                            cpuPercent={node.cpuUsage}
                            size={140}
                            ramColor="#06b6d4"
                            cpuColor="#a855f7"
                            nodeTitle={node.name}
                          />

                          {/* Legend alongside dual ring */}
                          <div className="space-y-3 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                <HardDrive className="w-3 h-3 text-cyan-400" />
                                <span>حافظه RAM:</span>
                              </span>
                              <div className="font-mono text-cyan-300 font-extrabold text-sm">
                                {node.ramUsed} / {node.ramTotal} GB
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">({node.ramPercent}% اشغال)</span>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-purple-400" />
                                <span>پردازنده CPU:</span>
                              </span>
                              <div className="font-mono text-purple-300 font-extrabold text-sm">
                                {node.cpuUsage}% بار
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">({node.cores} هسته)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {filterMode === 'ram_focus' && (
                        <div className="flex items-center gap-6">
                          <DonutRing
                            percentage={node.ramPercent}
                            size={125}
                            strokeWidth={11}
                            primaryColor="#06b6d4"
                            label="مصرف RAM"
                            sublabel={`${node.ramUsed} GB`}
                            icon={<HardDrive className="w-4 h-4 text-cyan-400" />}
                          />
                          <div className="space-y-1.5 text-xs">
                            <span className="text-neutral-400 block text-[11px]">ظرفیت حافظه موقت:</span>
                            <div className="text-base font-bold font-mono text-white">
                              {node.ramTotal} GB کل RAM
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              فضای آزاد: <span className="text-emerald-400 font-mono">{Number((node.ramTotal - node.ramUsed).toFixed(1))} GB</span>
                            </div>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              node.ramPercent >= 80 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {node.ramPercent >= 80 ? 'پربار' : 'پایدار'}
                            </span>
                          </div>
                        </div>
                      )}

                      {filterMode === 'cpu_focus' && (
                        <div className="flex items-center gap-6">
                          <DonutRing
                            percentage={node.cpuUsage}
                            size={125}
                            strokeWidth={11}
                            primaryColor="#a855f7"
                            label="بار پردازشی"
                            sublabel={`${node.cores} هسته`}
                            icon={<Cpu className="w-4 h-4 text-purple-400" />}
                          />
                          <div className="space-y-1.5 text-xs">
                            <span className="text-neutral-400 block text-[11px]">مشخصات CPU:</span>
                            <div className="text-xs font-bold text-white max-w-[140px] truncate" title={node.cpuModel}>
                              {node.cpuModel}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono">
                              تعداد vCPU: <span className="text-purple-300 font-bold">{node.cores} هسته</span>
                            </div>
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                              Active Threads
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* VRAM / GPU indicator if available */}
                    {node.vramTotal && (
                      <div className="mt-3 p-2.5 bg-black/40 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
                          <Zap className="w-3.5 h-3.5 text-purple-400" />
                          <span>شتاب‌دهنده گرافیکی (GPU VRAM):</span>
                        </span>
                        <span className="font-mono text-purple-300 font-bold">
                          {node.vramUsed} / {node.vramTotal} GB ({Math.round(((node.vramUsed || 0) / node.vramTotal) * 100)}%)
                        </span>
                      </div>
                    )}

                    {/* Models Tag Cloud */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 block mb-1">مدل‌ها و سرویس‌های در حال اجرا:</span>
                      <div className="flex flex-wrap gap-1">
                        {node.models.slice(0, 3).map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-300 font-mono border border-neutral-700/60"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Status & Action */}
                  <div className="pt-3 border-t border-neutral-800/80 mt-4 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      {isNominal ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">سالم و آماده استنتاج</span>
                        </>
                      ) : isHeavy ? (
                        <>
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 font-medium">بار سنگین مدل‌ها</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-neutral-300 font-medium">وضعیت نرمال</span>
                        </>
                      )}
                    </span>

                    {!node.isMaster && onPingNode && (
                      <button
                        type="button"
                        onClick={() => onPingNode(node.id)}
                        className="text-[10px] text-neutral-400 hover:text-cyan-300 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 font-mono transition-colors"
                      >
                        سنجش مجدد
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
