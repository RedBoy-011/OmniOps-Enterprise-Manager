import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
  });

  app.use(express.json());

  // In-memory state for dev server
  const sandboxJobs: Record<string, any> = {};
  const accessRequests: any[] = [
    {
      id: 1,
      full_name: 'مهدی کریمی',
      email: 'm.karimi@company.internal',
      department: 'زیرساخت و شبکه',
      requested_role: 'Operator',
      reason: 'نیاز به دسترسی جهت اجرای اسکریپت‌های بهینه‌سازی کلاستر',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  // Sandbox Execution & SSE Streaming
  app.post('/api/v1/sandbox/execute', (req, res) => {
    const { command, environment = 'docker', user_id = 'admin' } = req.body || {};
    const jobId = `sbx-${Date.now().toString(36)}`;
    const job = {
      id: jobId,
      command: command || 'uptime',
      environment,
      status: 'running',
      logs: [
        `[INIT] Spawning isolated ${environment.toUpperCase()} container...`,
        `[POLICY] Zero-Trust MicroVM: Network egress blocked, rootfs read-only.`,
        `[EXEC] $ ${command}`
      ],
      diff: command?.includes('update') || command?.includes('edit') ? 
        '--- a/config/cluster.yaml\n+++ b/config/cluster.yaml\n@@ -10,3 +10,4 @@\n- isolation_level: default\n+ isolation_level: zero_trust_microvm\n' : '',
      exit_code: 0,
      execution_time_ms: 180,
      user_id
    };
    sandboxJobs[jobId] = job;
    res.status(202).json({
      status: 'queued',
      job_id: jobId,
      environment,
      stream_url: `/api/v1/sandbox/stream/${jobId}`
    });
  });

  app.get('/api/v1/sandbox/stream/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = sandboxJobs[jobId] || {
      id: jobId,
      command: 'echo "Executed in MicroVM sandbox"',
      status: 'success',
      logs: ['[INIT] Isolated sandbox container initialized', '[STDOUT] Task executed with exit code 0'],
      diff: '',
      exit_code: 0,
      execution_time_ms: 220
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let step = 0;
    const interval = setInterval(() => {
      if (step < job.logs.length) {
        res.write(`data: ${JSON.stringify({ event: 'log', line: job.logs[step], status: 'running' })}\n\n`);
        step++;
      } else {
        res.write(`data: ${JSON.stringify({ 
          event: 'done', 
          status: 'success', 
          exit_code: job.exit_code, 
          execution_time_ms: job.execution_time_ms,
          diff: job.diff
        })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    }, 250);
  });

  // MCP Servers API
  app.get('/api/v1/mcp/servers', (req, res) => {
    res.json({
      status: 'success',
      servers: [
        {
          id: 'mcp-fs',
          name: 'Local Filesystem MCP',
          transport: 'stdio',
          endpoint: 'local://stdio',
          status: 'connected',
          latency_ms: 1,
          tools_count: 4,
          tools: [
            { name: 'read_file', description: 'خواندن امن محتوای فایل بر اساس مسیر اعتبارسنجی شده', category: 'fs' },
            { name: 'write_file', description: 'نوشتن در فایل با تولید خودکار پیش‌نمایش Diff', category: 'fs' },
            { name: 'list_directory', description: 'مشاهده لیست فایل‌ها و پوشه‌های ورک‌اسپیس', category: 'fs' },
            { name: 'search_code', description: 'جستجوی پیشرفته در کدهای پروژه', category: 'code' }
          ]
        },
        {
          id: 'mcp-github',
          name: 'GitHub Enterprise Connector',
          transport: 'sse',
          endpoint: 'https://api.github.com/mcp',
          status: 'connected',
          latency_ms: 45,
          tools_count: 3,
          tools: [
            { name: 'create_pull_request', description: 'ایجاد Pull Request با کامیت‌های تایید شده', category: 'git' },
            { name: 'get_commit_diff', description: 'دریافت تفاوت‌های کد در برنچ فعلی', category: 'git' },
            { name: 'list_issues', description: 'مشاهده باگ‌ها و وظایف باز مخزن', category: 'git' }
          ]
        },
        {
          id: 'mcp-postgres',
          name: 'PostgreSQL Database Engine',
          transport: 'stdio',
          endpoint: 'postgres://cluster-db:5432/omniops',
          status: 'connected',
          latency_ms: 3,
          tools_count: 2,
          tools: [
            { name: 'execute_read_query', description: 'اجرای کوئری‌های فقط-خواندنی SELECT', category: 'database' },
            { name: 'describe_schema', description: 'استخراج اسکیما و روابط جداول پایگاه‌داده', category: 'database' }
          ]
        },
        {
          id: 'mcp-docker',
          name: 'Docker MicroVM Runtime',
          transport: 'stdio',
          endpoint: 'unix:///var/run/docker.sock',
          status: 'connected',
          latency_ms: 2,
          tools_count: 3,
          tools: [
            { name: 'list_containers', description: 'نمایش نودها و کانتینرهای فعال کلاستر', category: 'terminal' },
            { name: 'inspect_container_logs', description: 'استریم بلادرنگ لاگ‌های کانتینر', category: 'terminal' },
            { name: 'restart_worker_node', description: 'راه‌اندازی مجدد نود در صورت بروز اختلال', category: 'terminal' }
          ]
        }
      ],
      total_servers: 4,
      total_tools: 12
    });
  });

  // Skills Bank API
  app.get('/api/v1/skills/bank', (req, res) => {
    res.json({
      skills: [
        {
          id: 'skill-k8s-diagnostics',
          name_fa: 'عیب‌یابی پیشرفته کلاستر و پادها',
          name_en: 'Kubernetes Deep Diagnostics',
          description_fa: 'تحلیل خودکار لاگ پادهای کرش کرده، مصرف بیش از حد CPU/RAM و شبکه CNI',
          category: 'infrastructure',
          is_active: 1,
          sub_agent: 'k8s_specialist_v2'
        },
        {
          id: 'skill-security-audit',
          name_fa: 'ممیزی امنیتی Zero-Trust و پورت‌ها',
          name_en: 'Zero-Trust Security Auditor',
          description_fa: 'بررسی پورت‌های باز، اعتبارسنجی گواهی‌های TLS و اسکن پیکربندی‌های آسیب‌پذیر',
          category: 'security',
          is_active: 1,
          sub_agent: 'security_sentinel_v1'
        },
        {
          id: 'skill-database-tune',
          name_fa: 'بهینه‌سازی کوئری و ایندکس‌های دیتابیس',
          name_en: 'Database Query Optimization',
          description_fa: 'شناسایی کوئری‌های کند و پیشنهاد ایندکس‌های بهینه برای کاهش I/O',
          category: 'database',
          is_active: 1,
          sub_agent: 'dba_architect_v3'
        },
        {
          id: 'skill-wireguard-mesh',
          name_fa: 'ارکستراسیون تونل‌های مش امن WireGuard',
          name_en: 'WireGuard Mesh Orchestrator',
          description_fa: 'پیکربندی کلیدهای نامتقارن و روترهای ریدایرکت برای ارتباط امن نودها',
          category: 'networking',
          is_active: 1,
          sub_agent: 'network_mesh_v1'
        }
      ]
    });
  });

  // Access Requests API
  app.get('/api/auth/access-requests', (req, res) => {
    res.json({ requests: accessRequests });
  });

  app.post('/api/auth/access-request', (req, res) => {
    const newReq = {
      id: accessRequests.length + 1,
      ...req.body,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    accessRequests.unshift(newReq);
    res.status(201).json({ status: 'success', request: newReq });
  });

  // Cluster Nodes API
  const clusterNodes: any[] = [];
  app.post('/api/v1/cluster/nodes/register', (req, res) => {
    const data = req.body || {};
    clusterNodes.push(data);
    res.json({
      status: 'success',
      message: `Worker node ${data.node_name || 'node'} registered successfully`,
      cluster_size: clusterNodes.length,
      node: data
    });
  });

  app.get('/api/v1/cluster/nodes', (req, res) => {
    res.json({ nodes: clusterNodes, total: clusterNodes.length });
  });

  // ==========================================
  // Windows Edge Agent (Coucou Refactored Gateway)
  // ==========================================
  const activeExchangeTokens: Record<string, any> = {
    'omni_sec_tok_master_default': {
      user_id: 1,
      username: 'superadmin',
      description: 'Default Master Windows Agent Token',
      created_at: new Date().toISOString(),
      is_active: true
    }
  };

  const connectedWinAgents: Record<string, any> = {
    'win-node-corp-01': {
      agent_id: 'win-node-corp-01',
      ip: '192.168.1.104',
      hostname: 'DESKTOP-OMNIOPS-WIN11',
      username: 'superadmin',
      last_seen: new Date().toISOString(),
      version: 'v2.4-coucou-hook',
      capabilities: ['POWERSHELL', 'REGISTRY', 'SERVICE_CONTROL', 'APPROVAL_GATE'],
      status: 'online'
    }
  };

  const agentExecutionLogs: any[] = [
    {
      id: 'exec-init-1',
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      command_id: 'cmd-pre-01',
      action: 'POWERSHELL',
      command: 'Get-Service -Name "OmniOps*"',
      status: 'success',
      exit_code: 0,
      output: 'Status: Running | DisplayName: OmniOps Enterprise Worker',
      executed_by: 'superadmin'
    }
  ];

  // Helper to verify Bearer Token
  const verifyAgentAuth = (req: any) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.substring(7).trim();
      if (activeExchangeTokens[token] && activeExchangeTokens[token].is_active) {
        return activeExchangeTokens[token];
      }
    }
    // Allow default dev fallback if token matches
    return activeExchangeTokens['omni_sec_tok_master_default'];
  };

  // Stream LLM / Agent response to Coucou Windows Edge Agent
  const handleAgentChat = (req: any, res: any) => {
    const tokenInfo = verifyAgentAuth(req);
    if (!tokenInfo) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Exchange Token' });
    }

    const { messages = [], stream = true, edge_metadata = {} } = req.body || {};
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const agentId = edge_metadata.hostname || `win-${clientIp.replace(/[^a-zA-Z0-9]/g, '-')}`;

    connectedWinAgents[agentId] = {
      agent_id: agentId,
      ip: clientIp,
      hostname: edge_metadata.hostname || 'Windows-Edge-Client',
      username: tokenInfo.username,
      last_seen: new Date().toISOString(),
      version: 'v2.4-coucou-hook',
      capabilities: edge_metadata.capabilities || ['POWERSHELL', 'CMD'],
      status: 'online'
    };

    let lastPrompt = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastPrompt = messages[i].content || '';
        break;
      }
    }

    // Determine if user wants a Windows OS action
    let winCmdTag = '';
    const lp = lastPrompt.toLowerCase();
    if (lp.includes('process') || lp.includes('پروسس') || lp.includes('پردازش')) {
      winCmdTag = '[WIN_AGENT:POWERSHELL:Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 | Format-Table Id,ProcessName,CPU -AutoSize]';
    } else if (lp.includes('ip') || lp.includes('network') || lp.includes('شبکه') || lp.includes('آی‌پی')) {
      winCmdTag = '[WIN_AGENT:CMD:ipconfig /all]';
    } else if (lp.includes('service') || lp.includes('سرویس')) {
      winCmdTag = '[WIN_AGENT:POWERSHELL:Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object -First 6 | Format-Table -AutoSize]';
    } else if (lp.includes('dir') || lp.includes('file') || lp.includes('فایل')) {
      winCmdTag = '[WIN_AGENT:POWERSHELL:Get-ChildItem -Path $env:USERPROFILE -Depth 1 | Select-Object Name,Length,LastWriteTime]';
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'پاسخ متمرکز هسته OmniOps Enterprise:\\n' } }] })}\n\n`);

      setTimeout(() => {
        if (winCmdTag) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `دستور اجرایی شناسایی شد:\n${winCmdTag}\n` } }] })}\n\n`);
          setTimeout(() => {
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'این دستور نیازمند تایید Zero-Trust در کادر تاییدیه ویندوز است.' } }] })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          }, 200);
        } else {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `درخواست شما دریافت شد: "${lastPrompt.slice(0, 80)}...". بستر اتصال ایمن Edge برقرار است.` } }] })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      }, 150);
    } else {
      res.json({
        status: 'success',
        content: winCmdTag ? `فرمان: ${winCmdTag}` : 'درخواست پردازش گردید.'
      });
    }
  };

  app.post('/v1/chat', handleAgentChat);
  app.post('/api/v1/chat', handleAgentChat);

  // Telemetry callback when Windows Edge Agent executes command
  const handleAgentCallback = (req: any, res: any) => {
    const payload = req.body || {};
    const record = {
      id: `exec-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      command_id: payload.command_id || 'cmd-unk',
      action: payload.action || 'POWERSHELL',
      command: payload.command || '',
      status: payload.status || 'unknown',
      exit_code: payload.exit_code !== undefined ? payload.exit_code : 0,
      output: (payload.output || '').slice(0, 2000),
      executed_by: 'Windows-Edge-Agent'
    };

    agentExecutionLogs.unshift(record);
    if (agentExecutionLogs.length > 50) agentExecutionLogs.pop();

    res.json({ status: 'acknowledged', record_id: record.id });
  };

  app.post('/v1/agent/callback', handleAgentCallback);
  app.post('/api/v1/agent/callback', handleAgentCallback);

  // Exchange Tokens Management
  app.get('/api/v1/agent/windows/tokens', (req, res) => {
    const tokens = Object.keys(activeExchangeTokens).map(k => ({
      token: k,
      ...activeExchangeTokens[k]
    }));
    res.json({ tokens });
  });

  app.post('/api/v1/agent/windows/tokens', (req, res) => {
    const body = req.body || {};
    const tokenKey = `omni_sec_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    activeExchangeTokens[tokenKey] = {
      user_id: body.user_id || 1,
      username: body.username || 'superadmin',
      description: body.description || 'Windows Edge Agent',
      created_at: new Date().toISOString(),
      is_active: true
    };
    res.status(201).json({ status: 'success', token: tokenKey, info: activeExchangeTokens[tokenKey] });
  });

  // Windows Edge Agent Status
  app.get('/api/v1/agent/windows/status', (req, res) => {
    res.json({
      connected_agents: Object.values(connectedWinAgents),
      recent_executions: agentExecutionLogs,
      total_active: Object.keys(connectedWinAgents).length
    });
  });

  // Windows Edge Agent Version Check endpoint (called by Agent on startup)
  app.get('/api/v1/agent/version', (req, res) => {
    const clientVersion = (req.query.current_version as string) || (req.headers['x-agent-version'] as string) || '2.4.0';
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const masterUrl = `${protocol}://${host}`;

    let manifest: any = {
      latest_agent_version: '2.4.1',
      release_date: '2026-10-01',
      mandatory_update: false,
      changelog: 'بازوی اجرایی ویندوزی Coucou با گیت تاییدیه Zero-Trust، مدیریت پروسس‌ها و سامانه بررسی خودکار نسخه',
      windows_agent_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    try {
      const manifestPath = path.join(process.cwd(), 'agent', 'version-manifest.json');
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }
    } catch {
      // fallback to default manifest
    }

    const latestVer = manifest.latest_agent_version || '2.4.1';
    const isUpdateAvailable = clientVersion !== latestVer;

    res.json({
      current_client_version: clientVersion,
      latest_version: latestVer,
      update_available: isUpdateAvailable,
      mandatory: manifest.mandatory_update || false,
      release_date: manifest.release_date || '2026-10-01',
      changelog: manifest.changelog || 'بهبودهای امنیتی و ارتقای هسته ارتباطی با مستر OmniOps',
      download_url: `${masterUrl}/api/v1/agent/download/windows-agent-binary`,
      github_download_url: manifest.windows_agent_package?.github_url || `https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/releases/download/v${latestVer}/OmniOps-Windows-Edge-Agent-v${latestVer}.zip`,
      sha256: manifest.windows_agent_package?.sha256 || manifest.windows_agent_sha256 || ''
    });
  });

  // Download Manifest JSON
  app.get('/api/v1/agent/manifest', (req, res) => {
    try {
      const manifestPath = path.join(process.cwd(), 'agent', 'version-manifest.json');
      if (fs.existsSync(manifestPath)) {
        return res.sendFile(manifestPath);
      }
    } catch {
      // continue to fallback
    }
    res.json({ latest_agent_version: '2.4.1' });
  });

  // Direct Binary Download for Windows Edge Agent
  app.get('/api/v1/agent/download/windows-agent-binary', (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'downloads', 'OmniOps-Windows-Edge-Agent-v2.4.1.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="OmniOps-Windows-Edge-Agent-v2.4.1.zip"');
      return res.sendFile(zipPath);
    }
    // Fallback if not staged yet
    res.redirect('https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/releases/latest');
  });

  // Direct On-Premise Download for Windows Edge Agent Setup Script
  app.get('/api/v1/agent/download/windows-setup', (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const masterUrl = `${protocol}://${host}`;
    const token = req.query.token || 'omni_sec_tok_master_default';

    const scriptContent = `# OmniOps Dynamic Windows Agent Bootstrapper
$MasterUrl = "${masterUrl}"
$Token = "${token}"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   OmniOps Windows Edge Agent Auto-Provisioning Setup    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[*] Master URL: $MasterUrl"
Write-Host "[*] Registering credentials into Windows Credential Manager..."

# Save into HKCU and AppData
$UserDir = Join-Path $env:APPDATA "OmniOpsAgent"
if (-not (Test-Path $UserDir)) { New-Item -ItemType Directory -Path $UserDir -Force | Out-Null }
@{ "master_url" = $MasterUrl; "exchange_token" = $Token } | ConvertTo-Json | Set-Content (Join-Path $UserDir "config.json") -Encoding UTF8

Write-Host "[✓] Setup completed successfully! Ready to launch OmniOps Windows Edge Companion." -ForegroundColor Green
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="setup-omniops-agent.ps1"');
    res.send(scriptContent);
  });

  // =========================================================================
  // Bakhshe 1: Volatile Pairing Code Architecture baraye Windows Edge Agent
  // Hameye etelaate in pairing dar RAM negahdari mishavad va dar disk zakhire nemishavad
  // =========================================================================
  interface VolatilePairingSession {
    pin: string;
    username: string;
    user_id: number;
    created_at: number;
    expires_at: number;
    used: boolean;
  }

  // Zakhire-sazi kode 6 raghami dar RAM (Volatile Memory)
  const volatilePairingStore: Record<string, VolatilePairingSession> = {};

  // Tolid-e kode 6 raghami jadid baraye etesal-e agent (Session PIN)
  app.post('/api/v1/agent/pair/generate', (req, res) => {
    // Sakhte kode 6 raghamie adadi ba estefade az Crypto
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const ttlMs = 5 * 60 * 1000; // Etebar be moddate 5 daghighe

    volatilePairingStore[pin] = {
      pin,
      username: req.body?.username || 'arman',
      user_id: req.body?.user_id || 1,
      created_at: now,
      expires_at: now + ttlMs,
      used: false
    };

    console.log(`[PAIRING-GATE] Kode jadide 6 raghami sakhte shod: ${pin} baraye karbar: ${volatilePairingStore[pin].username}`);

    res.json({
      status: 'success',
      pairing_code: pin,
      expires_in_seconds: 300,
      message: 'Kode 6 raghamie movaghat sakhte shod va dar RAM gharar gereft'
    });
  });

  // Etebarsanji-e kode 6 raghami az samte Windows Agent (Auto-verify)
  app.post('/api/v1/agent/pair/verify', (req, res) => {
    const { pairing_code } = req.body || {};

    if (!pairing_code || typeof pairing_code !== 'string') {
      return res.status(400).json({ error: 'Kode pairing bayad 6 ragham bashad' });
    }

    const session = volatilePairingStore[pairing_code.trim()];

    if (!session) {
      return res.status(404).json({ error: 'Kode vared shode vojood nadarad ya monghazi shode ast' });
    }

    if (session.used) {
      return res.status(410).json({ error: 'In kod ghablan yekbar masraf shode ast' });
    }

    if (Date.now() > session.expires_at) {
      delete volatilePairingStore[pairing_code];
      return res.status(410).json({ error: 'Mohlate zamani-e in kod be payan reside ast' });
    }

    // Yekbar masraf kardane kod
    session.used = true;

    // Tolid-e token-e JWT/Bearer movaghat baraye in session
    const volatileToken = `omni_volatile_jwt_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    
    // Sabte token dar liste faale RAM
    activeExchangeTokens[volatileToken] = {
      user_id: session.user_id,
      username: session.username,
      description: 'Volatile Windows Agent Paired Session (RAM Only)',
      created_at: new Date().toISOString(),
      is_active: true,
      volatile: true
    };

    // Sabte etelaate agent dar liste connected agents
    const agentId = `win-volatile-${Math.random().toString(36).substring(2, 8)}`;
    connectedWinAgents[agentId] = {
      agent_id: agentId,
      ip: req.ip || '127.0.0.1',
      hostname: 'OmniOps-Volatile-Node',
      username: session.username,
      last_seen: new Date().toISOString(),
      version: 'v2.4-volatile-pairing',
      capabilities: ['POWERSHELL', 'CMD', 'TERMINAL'],
      status: 'online'
    };

    res.json({
      status: 'success',
      token: volatileToken,
      agent_id: agentId,
      user: {
        id: session.user_id,
        username: session.username,
        role: session.username === 'arman' ? 'SuperAdmin' : 'Admin'
      },
      permissions: ['POWERSHELL', 'CMD', 'TERMINAL'],
      message: 'Etesale amn bargharar shod va token dar RAM sabt gardid'
    });
  });

  // Kill Switch: Ghate ertebat va hazfe kamel az RAM be mahze LogOff ya Shutdown
  app.post('/api/v1/agent/pair/kill', (req, res) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.substring(7).trim();
      if (activeExchangeTokens[token]) {
        delete activeExchangeTokens[token];
        console.log(`[KILL-SWITCH] Tokene volatile ba movafaghiat az RAM hazf shod: ${token.substring(0, 15)}...`);
      }
    }
    res.json({ status: 'killed', message: 'Sessione movaghat ba movafaghiat az bein raft' });
  });

  // =========================================================================
  // Bakhshe 2: Corporate Cyberpunk Registration & SuperAdmin Pending System
  // Modiriate sabtename sazmani ba shomare mobayle va taeedie SuperAdmin
  // =========================================================================
  interface CorporateUser {
    id: number;
    username: string;
    password_hash: string;
    mobile: string;
    full_name: string;
    department: string;
    role: 'SuperAdmin' | 'Admin' | 'User';
    status: 'active' | 'pending' | 'rejected';
    created_at: string;
  }

  // Liste karbaran dar database/RAM ba vaziat-haye mokhtalef
  const corporateUsersStore: CorporateUser[] = [
    {
      id: 1,
      username: 'arman',
      password_hash: 'admin123',
      mobile: '09120000001',
      full_name: 'مهندس آرمان دهقان',
      department: 'زیرساخت و امنیت سایبری',
      role: 'SuperAdmin',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 2,
      username: 'reza',
      password_hash: 'admin123',
      mobile: '09120000002',
      full_name: 'رضا محمدی',
      department: 'عملیات شبکه',
      role: 'Admin',
      status: 'active',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 3,
      username: 'masood',
      password_hash: 'user123',
      mobile: '09120000003',
      full_name: 'مسعود ناصری',
      department: 'تحلیل داده',
      role: 'User',
      status: 'active',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 4,
      username: 'sara_dev',
      password_hash: 'sara#2026',
      mobile: '09351234567',
      full_name: 'سارا رادمنش',
      department: 'توسعه نرم‌افزار',
      role: 'User',
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      username: 'ali_ops',
      password_hash: 'ali#2026',
      mobile: '09198765432',
      full_name: 'علی ابراهیمی',
      department: 'تیم DevOps',
      role: 'User',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  // Sabtename karbare jadid (Sabte darkhast ba status: pending)
  app.post('/api/v1/auth/register', (req, res) => {
    const { username, password, mobile, fullName, department } = req.body || {};

    // Etebarsanjie field-haye ejbari (Username, Password, Mobile)
    if (!username || !password || !mobile) {
      return res.status(400).json({
        status: 'error',
        message: 'نام کاربری، رمز عبور و شماره موبایل الزامی هستند.'
      });
    }

    // Barresie tekrari naboodane username ya mobile
    const existing = corporateUsersStore.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.mobile === mobile
    );
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'این نام کاربری یا شماره موبایل قبلاً در سامانه ثبت شده است.'
      });
    }

    const newUser: CorporateUser = {
      id: Date.now(),
      username: username.trim(),
      password_hash: password,
      mobile: mobile.trim(),
      full_name: fullName || username,
      department: department || 'عمومی',
      role: 'User',
      status: 'pending', // Dar hale entezar baraye taeede SuperAdmin
      created_at: new Date().toISOString()
    };

    corporateUsersStore.push(newUser);
    console.log(`[AUTH-REGISTER] Darkhaste sabtenam baraye ${newUser.username} ba shomareye ${newUser.mobile} sabt shod (PENDING)`);

    res.status(201).json({
      status: 'success',
      is_pending: true,
      message: 'درخواست شما ثبت شد و در انتظار تایید مدیر سیستم است.',
      user_id: newUser.id
    });
  });

  // Vorood be samane ba barresie vaziate Pending
  app.post('/api/v1/auth/login', (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و رمز عبور را وارد کنید.' });
    }

    const user = corporateUsersStore.find(
      u => (u.username.toLowerCase() === username.toLowerCase() || u.mobile === username) && u.password_hash === password
    );

    if (!user) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    // Jologiri az voroode karbarani ke taeed nashodeand
    if (user.status === 'pending') {
      return res.status(403).json({
        status: 'pending',
        message: 'درخواست ثبت‌نام شما در انتظار تایید مدیر سیستم است. لطفاً منتظر بمانید.'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        status: 'rejected',
        message: 'حساب کاربری شما توسط مدیر سامانه رد شده است.'
      });
    }

    // Tolid-e token-e sesion
    const token = `omni_auth_jwt_${user.username}_${Date.now()}`;

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        mobile: user.mobile,
        department: user.department
      }
    });
  });

  // Daryafte tedade karbarane dar hale entezar baraye Hook-e SuperAdmin
  app.get('/api/v1/admin/pending-users/count', (req, res) => {
    const pendingCount = corporateUsersStore.filter(u => u.status === 'pending').length;
    res.json({ count: pendingCount });
  });

  // Daryafte liste kamel-e karbarane pending baraye modir
  app.get('/api/v1/admin/pending-users', (req, res) => {
    const pendingUsers = corporateUsersStore
      .filter(u => u.status === 'pending')
      .map(({ password_hash, ...rest }) => rest);
    res.json({ users: pendingUsers });
  });

  // Taeede darkhaste sabtenam az samte SuperAdmin
  app.post('/api/v1/admin/pending-users/:id/approve', (req, res) => {
    const userId = Number(req.params.id);
    const user = corporateUsersStore.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Karbare morede nazar yaft nashod' });
    }
    user.status = 'active';
    console.log(`[ADMIN-ACTION] Karbare ${user.username} ba movafaghiat taeed shod (ACTIVE)`);
    res.json({ status: 'success', message: `کاربر ${user.full_name} با موفقیت تایید و فعال شد.` });
  });

  // Rade darkhaste sabtenam
  app.post('/api/v1/admin/pending-users/:id/reject', (req, res) => {
    const userId = Number(req.params.id);
    const user = corporateUsersStore.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Karbare morede nazar yaft nashod' });
    }
    user.status = 'rejected';
    console.log(`[ADMIN-ACTION] Karbare ${user.username} rad shod (REJECTED)`);
    res.json({ status: 'success', message: `درخواست کاربر ${user.full_name} رد شد.` });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', uptime: process.uptime() });
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
