import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

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
