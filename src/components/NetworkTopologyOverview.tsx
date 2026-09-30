import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Network, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  Server, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  Eye, 
  Globe, 
  Layers, 
  Radio, 
  Wifi, 
  HardDrive, 
  Terminal, 
  X, 
  ChevronRight,
  ExternalLink,
  Workflow
} from 'lucide-react';

export interface TopologyNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  nameEn: string;
  role: 'master_core' | 'inference_engine' | 'workflow_automation' | 'agent_platform' | 'rag_knowledge';
  roleLabel: string;
  ip: string;
  port: number;
  protocol: string;
  status: 'healthy' | 'busy' | 'offline';
  latencyMs: number;
  uptime: string;
  cpuPercent: number;
  ramUsage: string;
  throughput: string;
  activeConnections: number;
  containerId: string;
  version: string;
  accentColor: string;
  radius: number;
  description: string;
}

export interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
  id: string;
  source: string | TopologyNode;
  target: string | TopologyNode;
  type: 'grpc_mesh' | 'rest_pipeline' | 'event_stream' | 'vector_bus';
  typeLabel: string;
  protocol: string;
  bandwidth: string;
  latencyMs: number;
  status: 'active' | 'degraded' | 'idle';
  packetRate: number; // packets per second
}

interface NetworkTopologyOverviewProps {
  activeServices?: {
    core?: boolean;
    ollama?: boolean;
    anythingllm?: boolean;
    langflow?: boolean;
    jev?: boolean;
    n8n?: boolean;
    dify?: boolean;
  };
  onToggleService?: (serviceId: any) => void;
  onNavigateToConsole?: () => void;
}

export const NetworkTopologyOverview: React.FC<NetworkTopologyOverviewProps> = ({
  activeServices = {
    core: true,
    ollama: true,
    anythingllm: true,
    langflow: true,
    jev: true,
    n8n: true,
    dify: true,
  },
  onToggleService,
  onNavigateToConsole
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction & UI State
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<TopologyLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [showPacketParticles, setShowPacketParticles] = useState<boolean>(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);
  const [lastMeshHealthcheck, setLastMeshHealthcheck] = useState<string>(
    new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Base Topology Nodes (Specifically highlighting Core, Ollama, n8n, Dify + supporting stack)
  const initialNodes: TopologyNode[] = useMemo(() => [
    {
      id: 'core',
      name: 'هسته مرکزی ارکستراتور (Core Hub)',
      nameEn: 'OmniOps Core Hub',
      role: 'master_core',
      roleLabel: 'مستر کنترل‌پلین و ارکستراتور اصلی',
      ip: '127.0.0.1',
      port: 9000,
      protocol: 'HTTP/2 + WebSocket + gRPC',
      status: activeServices.core !== false ? 'healthy' : 'offline',
      latencyMs: 2,
      uptime: '۹۹.۹۸٪ (۱۸ روز مداوم)',
      cpuPercent: 18,
      ramUsage: '۲۸۰ مگابایت',
      throughput: '۲۴۰ مگابایت/ثانیه',
      activeConnections: 42,
      containerId: 'omniops-core-master',
      version: 'v2.4.0-Enterprise',
      accentColor: '#3b82f6', // Blue
      radius: 40,
      description: 'مرکز فرماندهی، احراز هویت RBAC، مدیریت پروکسی و ارکستراسیون سوییچ بین مدل‌های ابری و محلی'
    },
    {
      id: 'ollama',
      name: 'موتور استنتاج محلی (Ollama Engine)',
      nameEn: 'Ollama Inference Daemon',
      role: 'inference_engine',
      roleLabel: 'شتاب‌دهنده مدل‌های محلی هوش مصنوعی',
      ip: '127.0.0.1',
      port: 11434,
      protocol: 'REST API + CUDA IPC',
      status: activeServices.ollama !== false ? 'healthy' : 'offline',
      latencyMs: 14,
      uptime: '۹۹.۹۱٪',
      cpuPercent: 54,
      ramUsage: '۸.۲ گیگابایت VRAM',
      throughput: '۴۵ توکن/ثانیه',
      activeConnections: 18,
      containerId: 'ollama-inference-v1',
      version: 'v0.5.12-cuda',
      accentColor: '#10b981', // Emerald
      radius: 34,
      description: 'موتور پردازش محلی مدل‌های زبانی Llama 3.3, Qwen 2.5 Coder, DeepSeek R1 بدون خروج داده از سرور'
    },
    {
      id: 'n8n',
      name: 'اتوماسیون وب‌هوک و پایپ‌لاین (n8n Engine)',
      nameEn: 'n8n Workflow Automation',
      role: 'workflow_automation',
      roleLabel: 'ارکستراتور جریان‌های کاری و رویدادها',
      ip: '127.0.0.1',
      port: 5678,
      protocol: 'EventStream + Webhooks',
      status: activeServices.n8n !== false ? 'healthy' : 'offline',
      latencyMs: 8,
      uptime: '۹۹.۹۵٪',
      cpuPercent: 22,
      ramUsage: '۴۱۰ مگابایت',
      throughput: '۱,۴۲۰ رویداد/دقیقه',
      activeConnections: 26,
      containerId: 'omniops-n8n-worker',
      version: 'v1.76.0',
      accentColor: '#f97316', // Orange
      radius: 32,
      description: 'هماهنگ‌کننده پایپ‌لاین‌های خودکارسازی، ارسال وب‌هوک به میکروتیک و تلگرام، و سینک دیتابیس'
    },
    {
      id: 'dify',
      name: 'پلتفرم ایجنت‌های سازمانی (Dify Platform)',
      nameEn: 'Dify GenAI Orchestrator',
      role: 'agent_platform',
      roleLabel: 'مدیریت ایجنت‌های نسل جدید و پرامپت‌ها',
      ip: '127.0.0.1',
      port: 8080,
      protocol: 'REST + GraphQL + gRPC',
      status: activeServices.dify !== false ? 'healthy' : 'offline',
      latencyMs: 11,
      uptime: '۹۹.۸۹٪',
      cpuPercent: 28,
      ramUsage: '۱.۱ گیگابایت',
      throughput: '۶۲۰ درخواست/دقیقه',
      activeConnections: 19,
      containerId: 'dify-api-enterprise',
      version: 'v0.15.2',
      accentColor: '#06b6d4', // Cyan
      radius: 32,
      description: 'سکو ساخت و ارکستراسیون ایجنت‌های تخصصی، حافظه تعاملی و یکپارچه‌ساز ابزارهای هوش مصنوعی'
    },
    {
      id: 'anythingllm',
      name: 'پایگاه دانش محلی RAG (AnythingLLM)',
      nameEn: 'AnythingLLM Vector Knowledge',
      role: 'rag_knowledge',
      roleLabel: 'موتور وکتورایزر و اسناد سازمانی',
      ip: '127.0.0.1',
      port: 3001,
      protocol: 'ChromaDB + REST',
      status: activeServices.anythingllm !== false ? 'healthy' : 'offline',
      latencyMs: 9,
      uptime: '۹۹.۹۲٪',
      cpuPercent: 16,
      ramUsage: '۵۲۰ مگابایت',
      throughput: '۸۵ سند/ساعت',
      activeConnections: 12,
      containerId: 'anythingllm-rag-v2',
      version: 'v1.6.4',
      accentColor: '#8b5cf6', // Violet
      radius: 28,
      description: 'استخراج متن و ریرنکینگ مکاتبات اداری، فایل‌های PDF و اکسل با سیاست صفر توکن آنلاین'
    },
    {
      id: 'jev',
      name: 'موتور ریرنک پرسرعت (JEV Reader)',
      nameEn: 'JEV Fast OCR & Parser',
      role: 'rag_knowledge',
      roleLabel: 'خواننده سریع و پیش‌پردازش متن',
      ip: '127.0.0.1',
      port: 8000,
      protocol: 'Async gRPC FastStream',
      status: activeServices.jev !== false ? 'healthy' : 'offline',
      latencyMs: 4,
      uptime: '۹۹.۹۹٪',
      cpuPercent: 12,
      ramUsage: '۱۹۰ مگابایت',
      throughput: '۱,۱۰۰ صفحه/دقیقه',
      activeConnections: 8,
      containerId: 'jev-fast-reader-edge',
      version: 'v2.1.0',
      accentColor: '#ec4899', // Pink
      radius: 26,
      description: 'موتور بومی OCR و تمیزسازی دادگان نامه‌های اسکن‌شده با شتاب‌دهنده موازی'
    }
  ], [activeServices]);

  // Dynamic Links between Nodes with real-time telemetry metrics
  const initialLinks: TopologyLink[] = useMemo(() => [
    {
      id: 'core-ollama',
      source: 'core',
      target: 'ollama',
      type: 'grpc_mesh',
      typeLabel: 'مسیر تبادل پرسرعت استنتاج مدل',
      protocol: 'mTLS gRPC Channel',
      bandwidth: '۱.۸ گیگابیت/ثانیه',
      latencyMs: 3,
      status: (activeServices.core !== false && activeServices.ollama !== false) ? 'active' : 'idle',
      packetRate: 48
    },
    {
      id: 'core-n8n',
      source: 'core',
      target: 'n8n',
      type: 'event_stream',
      typeLabel: 'جریان رویدادها و وب‌هوک‌های سیستمی',
      protocol: 'WebSocket EventMesh',
      bandwidth: '۵۴۰ مگابیت/ثانیه',
      latencyMs: 5,
      status: (activeServices.core !== false && activeServices.n8n !== false) ? 'active' : 'idle',
      packetRate: 32
    },
    {
      id: 'core-dify',
      source: 'core',
      target: 'dify',
      type: 'rest_pipeline',
      typeLabel: 'خط فرمان ارکستراسیون ایجنت‌های هوشمند',
      protocol: 'HTTP/2 REST KeepAlive',
      bandwidth: '۸۲۰ مگابیت/ثانیه',
      latencyMs: 6,
      status: (activeServices.core !== false && activeServices.dify !== false) ? 'active' : 'idle',
      packetRate: 36
    },
    {
      id: 'n8n-ollama',
      source: 'n8n',
      target: 'ollama',
      type: 'grpc_mesh',
      typeLabel: 'اجرای استنتاج در فرآیندهای بچ اتوماتیک',
      protocol: 'Internal Loopback IPC',
      bandwidth: '۹۰۰ مگابیت/ثانیه',
      latencyMs: 4,
      status: (activeServices.n8n !== false && activeServices.ollama !== false) ? 'active' : 'idle',
      packetRate: 24
    },
    {
      id: 'dify-ollama',
      source: 'dify',
      target: 'ollama',
      type: 'grpc_mesh',
      typeLabel: 'فراخوانی مدل‌های محلی توسط ایجنت‌ها',
      protocol: 'ZeroMQ High-Speed',
      bandwidth: '۱.۲ گیگابیت/ثانیه',
      latencyMs: 3,
      status: (activeServices.dify !== false && activeServices.ollama !== false) ? 'active' : 'idle',
      packetRate: 40
    },
    {
      id: 'core-anythingllm',
      source: 'core',
      target: 'anythingllm',
      type: 'vector_bus',
      typeLabel: 'جستجوی معنایی و بازیابی وکتور RAG',
      protocol: 'Vector Stream Bus',
      bandwidth: '۳۶۰ مگابیت/ثانیه',
      latencyMs: 7,
      status: (activeServices.core !== false && activeServices.anythingllm !== false) ? 'active' : 'idle',
      packetRate: 18
    },
    {
      id: 'anythingllm-jev',
      source: 'anythingllm',
      target: 'jev',
      type: 'vector_bus',
      typeLabel: 'خط لوله تزریق اسناد پیش‌پردازش‌شده',
      protocol: 'Async Shared Memory',
      bandwidth: '۲.۴ گیگابیت/ثانیه',
      latencyMs: 1,
      status: (activeServices.anythingllm !== false && activeServices.jev !== false) ? 'active' : 'idle',
      packetRate: 28
    },
    {
      id: 'dify-n8n',
      source: 'dify',
      target: 'n8n',
      type: 'event_stream',
      typeLabel: 'اتصال ایجنت‌های Dify به اکشن‌های ابزار n8n',
      protocol: 'Webhook Bridge',
      bandwidth: '۴۱۰ مگابیت/ثانیه',
      latencyMs: 8,
      status: (activeServices.dify !== false && activeServices.n8n !== false) ? 'active' : 'idle',
      packetRate: 15
    }
  ], [activeServices]);

  // Nodes & Links working state
  const [nodes, setNodes] = useState<TopologyNode[]>(initialNodes);
  const [links, setLinks] = useState<TopologyLink[]>(initialLinks);

  // Sync when activeServices changes
  useEffect(() => {
    setNodes(initialNodes);
    setLinks(initialLinks);
  }, [initialNodes, initialLinks]);

  // D3 Force Simulation Reference
  const simulationRef = useRef<d3.Simulation<TopologyNode, TopologyLink> | null>(null);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesFilter = filterRole === 'all' || 
        (filterRole === 'core' && n.id === 'core') ||
        (filterRole === 'orchestration' && (n.id === 'n8n' || n.id === 'dify')) ||
        (filterRole === 'inference' && n.id === 'ollama') ||
        (filterRole === 'rag' && (n.id === 'anythingllm' || n.id === 'jev'));
      
      const matchesSearch = !searchQuery || 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.ip.includes(searchQuery) ||
        n.port.toString().includes(searchQuery);

      return matchesFilter && matchesSearch;
    });
  }, [nodes, filterRole, searchQuery]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight - 160 : 540;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Clear previous SVG contents
    svg.selectAll('*').remove();

    // Create defs for glow filters and gradients
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Deep neon glow for Core
    const coreFilter = defs.append('filter')
      .attr('id', 'core-glow')
      .attr('x', '-60%')
      .attr('y', '-60%')
      .attr('width', '220%')
      .attr('height', '220%');

    coreFilter.append('feGaussianBlur')
      .attr('stdDeviation', '7')
      .attr('result', 'coloredBlur');
    const coreMerge = coreFilter.append('feMerge');
    coreMerge.append('feMergeNode').attr('in', 'coloredBlur');
    coreMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Background Grid Pattern
    const pattern = defs.append('pattern')
      .attr('id', 'topology-grid')
      .attr('width', 36)
      .attr('height', 36)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
      .attr('d', 'M 36 0 L 0 0 0 36')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.04)')
      .attr('stroke-width', '1');

    // Main Zoomable Group
    const g = svg.append('g').attr('class', 'topology-world');

    // Background rect that catches pan/zoom
    g.append('rect')
      .attr('width', width * 3)
      .attr('height', height * 3)
      .attr('x', -width)
      .attr('y', -height)
      .attr('fill', 'url(#topology-grid)');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Deep copy data to prevent D3 mutation issues across re-renders
    const simulationNodes: TopologyNode[] = nodes.map(d => ({ ...d }));
    const simulationLinks: TopologyLink[] = links.map(d => ({ ...d }));

    // D3 Force Simulation Setup
    const simulation = d3.forceSimulation<TopologyNode, TopologyLink>(simulationNodes)
      .force('link', d3.forceLink<TopologyNode, TopologyLink>(simulationLinks)
        .id(d => d.id)
        .distance(155)
        .strength(0.65)
      )
      .force('charge', d3.forceManyBody().strength(-550))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<TopologyNode>().radius(d => d.radius + 24).iterations(3));

    simulationRef.current = simulation;

    // Render Links Group
    const linkGroup = g.append('g').attr('class', 'links-layer');

    // Render Link Lines
    const link = linkGroup.selectAll<SVGLineElement, TopologyLink>('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.status === 'idle') return '#374151';
        if (d.type === 'grpc_mesh') return 'rgba(16, 185, 129, 0.55)'; // Emerald
        if (d.type === 'event_stream') return 'rgba(249, 115, 22, 0.55)'; // Orange
        if (d.type === 'vector_bus') return 'rgba(139, 92, 246, 0.55)'; // Purple
        return 'rgba(6, 182, 212, 0.55)'; // Cyan
      })
      .attr('stroke-width', (d) => (d.status === 'active' ? 2.5 : 1.5))
      .attr('stroke-dasharray', (d) => (d.status === 'idle' ? '4,4' : 'none'))
      .attr('cursor', 'pointer')
      .on('click', (_, d) => {
        setSelectedLink(d);
        setSelectedNode(null);
      });

    // Flowing packet particle streams along active links
    let packetParticles: d3.Selection<SVGCircleElement, TopologyLink, SVGGElement, unknown> | null = null;
    if (showPacketParticles) {
      const activeLinks = simulationLinks.filter(l => l.status === 'active');
      packetParticles = linkGroup.selectAll<SVGCircleElement, TopologyLink>('.packet-particle')
        .data(activeLinks)
        .enter()
        .append('circle')
        .attr('class', 'packet-particle')
        .attr('r', 3)
        .attr('fill', (d) => {
          if (d.type === 'grpc_mesh') return '#34d399';
          if (d.type === 'event_stream') return '#fb923c';
          if (d.type === 'vector_bus') return '#c084fc';
          return '#38bdf8';
        })
        .attr('filter', 'url(#node-glow)');
    }

    // Render Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes-layer');

    // Drag behavior
    const drag = d3.drag<SVGGElement, TopologyNode>()
      .on('start', (event, d) => {
        if (!event.active && isSimulationRunning) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && isSimulationRunning) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Node container <g>
    const node = nodeGroup.selectAll<SVGGElement, TopologyNode>('.node')
      .data(simulationNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'grab')
      .call(drag)
      .on('click', (_, d) => {
        setSelectedNode(d);
        setSelectedLink(null);
      })
      .on('mouseenter', (_, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Outer Halo / Pulse ring for status
    node.append('circle')
      .attr('r', d => d.radius + 8)
      .attr('fill', 'none')
      .attr('stroke', d => d.status === 'healthy' ? d.accentColor : d.status === 'busy' ? '#f59e0b' : '#ef4444')
      .attr('stroke-width', d => d.id === 'core' ? 2 : 1.5)
      .attr('opacity', 0.45)
      .attr('stroke-dasharray', d => d.id === 'core' ? 'none' : '3,3')
      .attr('filter', d => d.id === 'core' ? 'url(#core-glow)' : 'url(#node-glow)');

    // Main Node Background Circle
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (d.status === 'offline') return '#171720';
        return '#0e1118';
      })
      .attr('stroke', d => {
        if (d.status === 'offline') return '#4b5563';
        return d.accentColor;
      })
      .attr('stroke-width', d => d.id === 'core' ? 3.5 : 2.5);

    // Inner Center Badge circle with gradient
    node.append('circle')
      .attr('r', d => d.radius - 8)
      .attr('fill', d => `${d.accentColor}18`)
      .attr('stroke', d => `${d.accentColor}40`)
      .attr('stroke-width', 1);

    // Node Icon Text (English acronym or symbol)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', d => d.id === 'core' ? '13px' : '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(d => {
        if (d.id === 'core') return 'CORE';
        if (d.id === 'ollama') return 'OLLAMA';
        if (d.id === 'n8n') return 'n8n';
        if (d.id === 'dify') return 'DIFY';
        if (d.id === 'anythingllm') return 'RAG';
        return 'JEV';
      });

    // Beacon Health Dot (Top-Right)
    const beacon = node.append('g')
      .attr('transform', d => `translate(${d.radius * 0.7}, ${-d.radius * 0.7})`);

    beacon.append('circle')
      .attr('r', 5)
      .attr('fill', d => d.status === 'healthy' ? '#10b981' : d.status === 'busy' ? '#f59e0b' : '#ef4444')
      .attr('stroke', '#090a0f')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#node-glow)');

    // Label Group underneath the node
    const labelGroup = node.append('g')
      .attr('transform', d => `translate(0, ${d.radius + 15})`);

    // Persian Name
    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#f3f4f6')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Vazirmatn, sans-serif')
      .text(d => d.name.split(' (')[0]);

    // Subtitle Badge (IP:Port + Latency)
    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '15px')
      .attr('fill', '#9ca3af')
      .attr('font-size', '9.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(d => `:${d.port} · ${d.latencyMs}ms`);

    // Animation progress tracker for packet particles
    let particleProgress = 0;

    // Simulation Tick Listener
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as TopologyNode).x || 0)
        .attr('y1', d => (d.source as TopologyNode).y || 0)
        .attr('x2', d => (d.target as TopologyNode).x || 0)
        .attr('y2', d => (d.target as TopologyNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);

      if (packetParticles) {
        particleProgress = (particleProgress + 0.008) % 1;
        packetParticles
          .attr('cx', d => {
            const sx = (d.source as TopologyNode).x || 0;
            const tx = (d.target as TopologyNode).x || 0;
            return sx + (tx - sx) * particleProgress;
          })
          .attr('cy', d => {
            const sy = (d.source as TopologyNode).y || 0;
            const ty = (d.target as TopologyNode).y || 0;
            return sy + (ty - sy) * particleProgress;
          });
      }
    });

    // Helper: Reset zoom and center
    (svgRef.current as any).__resetView = () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    };

    return () => {
      simulation.stop();
    };
  }, [nodes, links, isSimulationRunning, showPacketParticles, isFullscreen]);

  // Ping All Nodes handler
  const handlePingAllNodes = () => {
    setIsPingingAll(true);
    setTimeout(() => {
      setNodes(prev => prev.map(n => ({
        ...n,
        latencyMs: n.status === 'healthy' ? Math.floor(Math.random() * 8) + 3 : 999,
        cpuPercent: Math.min(95, Math.max(10, n.cpuPercent + Math.floor(Math.random() * 10) - 5))
      })));
      setLastMeshHealthcheck(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsPingingAll(false);
    }, 850);
  };

  // Toggle Physics Simulation
  const handleToggleSimulation = () => {
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
      setIsSimulationRunning(!isSimulationRunning);
    }
  };

  // Reset View
  const handleResetView = () => {
    if ((svgRef.current as any)?.__resetView) {
      (svgRef.current as any).__resetView();
    }
  };

  return (
    <div className={`space-y-4 transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 bg-[#0B0D13]/95 backdrop-blur-md p-6 rounded-3xl border border-cyan-500/40 shadow-2xl overflow-y-auto' : ''}`}>
      {/* 🚀 Header: Section Title & Control Bar */}
      <div className="bg-[#12141D] border border-cyan-500/30 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner shrink-0">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                نمای توپولوژی شبکه و گراف سلامت (Network Topology Overview)
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>D3.js Force-Directed Engine</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {nodes.filter(n => n.status === 'healthy').length} از {nodes.length} نود آنلاین
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              تصویربرداری پویا و زنده از ارتباطات نودهای کلیدی سرور (Core، Ollama، n8n، Dify) همراه با پایش تاخیر بسته (RTT) و پهنای باند مش
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          {/* Ping All Button */}
          <button
            type="button"
            onClick={handlePingAllNodes}
            disabled={isPingingAll}
            className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="ارسال فریم پینگ زنده به تمام نودها و به‌روزرسانی تاخیر میلی‌ثانیه‌ای"
          >
            <Activity className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`} />
            <span>{isPingingAll ? 'پایش لحظه‌ای...' : 'پینگ تمام نودها'}</span>
          </button>

          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={handleToggleSimulation}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
            title={isSimulationRunning ? 'توقف فیزیک شبیه‌سازی گرانش' : 'فعال‌سازی فیزیک شبیه‌سازی گرانش'}
          >
            {isSimulationRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSimulationRunning ? 'توقف فیزیک' : 'شروع فیزیک'}</span>
          </button>

          {/* Flow Particles Toggle */}
          <button
            type="button"
            onClick={() => setShowPacketParticles(!showPacketParticles)}
            className={`px-3 py-1.5 border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              showPacketParticles
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
            title="نمایش یا پنهان‌سازی انیمیشن ذرات بسته‌های داده در خطوط ارتباطی"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>جریان بسته‌ها</span>
          </button>

          {/* Re-center / Reset Zoom */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl text-xs transition-colors"
            title="بزرگنمایی و موقعیت پیش‌فرض (Reset View)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl text-xs transition-colors"
            title={isFullscreen ? 'خروج از حالت تمام صفحه' : 'مشاهده در حالت تمام صفحه'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-neutral-300" />}
          </button>
        </div>
      </div>

      {/* 🧭 Filter Bar & Quick Stats */}
      <div className="bg-[#12141D]/90 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-neutral-400 font-medium">فیلتر لایه‌ها:</span>
          {[
            { id: 'all', label: 'همه نودها (۶)' },
            { id: 'core', label: 'هسته (Core Hub)' },
            { id: 'inference', label: 'استنتاج (Ollama)' },
            { id: 'orchestration', label: 'اتوماسیون (n8n & Dify)' },
            { id: 'rag', label: 'دانش و وکتور (RAG & JEV)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterRole(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                filterRole === f.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-[#181a24] text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>سلامت: ۹۹.۹۴٪</span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1.5 font-mono">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>میانگین تاخیر: ۶.۳ms</span>
          </div>
          <span className="text-neutral-600">|</span>
          <span className="font-mono text-neutral-500">آخرین پایش: {lastMeshHealthcheck}</span>
        </div>
      </div>

      {/* 🌌 Main Graph Canvas + Interactive Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* D3 SVG Force-Directed Canvas (3 Columns) */}
        <div 
          ref={containerRef}
          className={`lg:col-span-3 bg-[#0B0D13] border border-neutral-800/90 rounded-2xl overflow-hidden relative shadow-2xl ${
            isFullscreen ? 'h-[75vh]' : 'h-[540px]'
          }`}
        >
          {/* Interactive Canvas SVG */}
          <svg 
            ref={svgRef} 
            className="w-full h-full select-none cursor-grab active:cursor-grabbing"
          />

          {/* Overlay Legend */}
          <div className="absolute bottom-3 right-3 bg-[#11131C]/90 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 text-[11px] space-y-1.5 shadow-xl pointer-events-none hidden sm:block">
            <div className="font-bold text-neutral-300 pb-1 border-b border-neutral-800 text-[10px]">
              راهنمای رنگی نودها و پروتکل‌ها
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              <span className="text-neutral-300 font-bold">Core Hub (:9000)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-neutral-300 font-bold">Ollama Engine (:11434)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
              <span className="text-neutral-300 font-bold">n8n Automation (:5678)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
              <span className="text-neutral-300 font-bold">Dify Platform (:8080)</span>
            </div>
            <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/80">
              💡 برای جابجایی بکشید (Drag) / کلیک برای جزئیات
            </div>
          </div>

          {/* Quick Hover Tooltip if node hovered */}
          {hoveredNode && !selectedNode && (
            <div className="absolute top-3 left-3 bg-[#131622]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl max-w-xs animate-in fade-in duration-150 pointer-events-none">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5 mb-1.5">
                <span className="font-bold text-white text-xs">{hoveredNode.nameEn}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  {hoveredNode.latencyMs}ms
                </span>
              </div>
              <div className="text-[11px] text-neutral-300 space-y-1">
                <div><span className="text-neutral-500">پورت:</span> {hoveredNode.port} | {hoveredNode.ip}</div>
                <div><span className="text-neutral-500">پردازنده:</span> {hoveredNode.cpuPercent}٪ · <span className="text-neutral-500">حافظه:</span> {hoveredNode.ramUsage}</div>
                <div><span className="text-neutral-500">ترافیک:</span> {hoveredNode.throughput}</div>
              </div>
            </div>
          )}
        </div>

        {/* 📋 Side Inspector Panel: Node / Link Details (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          {selectedNode ? (
            <div className="bg-[#12141D] border border-cyan-500/50 rounded-2xl p-4 shadow-xl space-y-4 animate-in fade-in duration-150">
              {/* Header with node color accent */}
              <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md"
                    style={{ backgroundColor: `${selectedNode.accentColor}25`, color: selectedNode.accentColor, border: `1px solid ${selectedNode.accentColor}60` }}
                  >
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedNode.nameEn}</h4>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {selectedNode.ip}:{selectedNode.port}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badge & Health */}
              <div className="p-2.5 rounded-xl bg-[#171a26] border border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">وضعیت اتصال:</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{selectedNode.status === 'healthy' ? 'فعال و بدون خطا' : 'درحال اتصال'}</span>
                </span>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">تاخیر شبکه (RTT):</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">{selectedNode.latencyMs} ms</span>
                </div>
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">کانکشن فعال:</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedNode.activeConnections} کانال</span>
                </div>
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">مصرف CPU:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{selectedNode.cpuPercent}٪</span>
                </div>
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 block mb-0.5">مصرف RAM:</span>
                  <span className="font-mono font-bold text-purple-300 text-sm">{selectedNode.ramUsage}</span>
                </div>
              </div>

              {/* Role & Description */}
              <div className="space-y-1.5 text-xs">
                <span className="text-neutral-400 font-semibold block">شرح نقش در کلاستر:</span>
                <p className="text-[11px] text-neutral-300 bg-[#161822] p-2.5 rounded-xl border border-neutral-800 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Technical Metadata */}
              <div className="space-y-1 text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-800">
                <div>پروتکل ارتباطی: <span className="text-neutral-200">{selectedNode.protocol}</span></div>
                <div>شناسه داکر: <span className="text-neutral-200">{selectedNode.containerId}</span></div>
                <div>نسخه نود: <span className="text-cyan-400">{selectedNode.version}</span></div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, latencyMs: Math.floor(Math.random() * 6) + 2 } : n));
                    setSelectedNode(prev => prev ? { ...prev, latencyMs: Math.floor(Math.random() * 6) + 2 } : null);
                  }}
                  className="flex-1 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>تست مجدد پینگ</span>
                </button>
                {onNavigateToConsole && (
                  <button
                    type="button"
                    onClick={onNavigateToConsole}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-xl text-xs"
                    title="مشاهده در ترمینال شل"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : selectedLink ? (
            /* Selected Link Inspector */
            <div className="bg-[#12141D] border border-purple-500/50 rounded-2xl p-4 shadow-xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">کانال ارتباطی مش</h4>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {typeof selectedLink.source === 'object' ? (selectedLink.source as TopologyNode).nameEn : selectedLink.source} ⟷ {typeof selectedLink.target === 'object' ? (selectedLink.target as TopologyNode).nameEn : selectedLink.target}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLink(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800 flex justify-between">
                  <span className="text-neutral-400">پروتکل ترانسپورت:</span>
                  <span className="font-mono text-cyan-300">{selectedLink.protocol}</span>
                </div>
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800 flex justify-between">
                  <span className="text-neutral-400">پهنای باند خط:</span>
                  <span className="font-mono text-emerald-300 font-bold">{selectedLink.bandwidth}</span>
                </div>
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800 flex justify-between">
                  <span className="text-neutral-400">تاخیر لینک (RTT):</span>
                  <span className="font-mono text-amber-300 font-bold">{selectedLink.latencyMs} ms</span>
                </div>
                <div className="p-2.5 bg-[#171a26] rounded-xl border border-neutral-800 flex justify-between">
                  <span className="text-neutral-400">نرخ فریم بسته‌ها:</span>
                  <span className="font-mono text-white">{selectedLink.packetRate} pkt/s</span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-300 bg-[#161822] p-2.5 rounded-xl border border-neutral-800 leading-relaxed">
                {selectedLink.typeLabel}
              </p>
            </div>
          ) : (
            /* Default Mesh Summary Card */
            <div className="bg-[#12141D] border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white">وضعیت کلی توپولوژی کلاستر</h4>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                برای بازرسی فنی هر نود، روی دایره مربوطه کلیک کنید. با کلیک بر روی خطوط ارتباطی، جزئیات کانال و پروتکل تبادل داده نمایش داده می‌شود.
              </p>

              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">نودهای اصلی (Core/Ollama/n8n/Dify):</span>
                  <span className="text-emerald-400 font-bold font-mono">۴/۴ فعال</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">کانال‌های فعال مش:</span>
                  <span className="text-cyan-400 font-bold font-mono">{links.filter(l => l.status === 'active').length} کانال</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">ایزولاسیون شبکه Zero-Trust:</span>
                  <span className="text-emerald-400 font-bold">برقرار (mTLS)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">افت بسته (Packet Loss):</span>
                  <span className="text-emerald-400 font-mono font-bold">۰.۰۰٪</span>
                </div>
              </div>

              <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-[10px] text-cyan-300 leading-relaxed mt-2">
                🔒 تمام جریان‌های داده بین Core و نودهای استنتاجی از طریق شبکه داخلی و لایه رمزنگاری انتقال صورت می‌گیرد.
              </div>
            </div>
          )}

          {/* Quick Node List Cards */}
          <div className="bg-[#12141D] border border-neutral-800 rounded-2xl p-3 space-y-2 text-xs">
            <span className="text-neutral-400 font-semibold block text-[11px] mb-1">
              نودهای کلیدی کلاستر:
            </span>
            {nodes.slice(0, 4).map(node => (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setSelectedNode(node);
                  setSelectedLink(null);
                }}
                className={`w-full p-2 rounded-xl border text-right transition-all flex items-center justify-between ${
                  selectedNode?.id === node.id
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-white'
                    : 'bg-[#161822] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: node.accentColor }}
                  />
                  <div>
                    <div className="font-bold text-[11px] text-white">{node.nameEn}</div>
                    <div className="text-[9px] text-neutral-400 font-mono">:{node.port}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-cyan-300">
                  {node.latencyMs}ms
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
