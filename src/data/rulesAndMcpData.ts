import { ProjectRuleItem, McpServerConfig } from '../types';

export const DEFAULT_PROJECT_RULES: ProjectRuleItem[] = [
  {
    id: 'RULE-SEC-01',
    title: 'سیاست افشای صفر توکن و رمز (Zero-Secret Leak Policy)',
    category: 'security',
    severity: 'critical',
    rulePattern: 'No hardcoded API keys, JWT tokens, private keys or passwords in source code',
    description: 'هیچ‌گونه کلید API، توکن، رمز عبور یا کلید خصوصی نباید به صورت رشته هاردکد شده در کدهای پروژه نوشته شود. مقادیر باید از طریق متغیرهای محیطی یا هدرهای امنیتی مدیریت شوند.',
    enforcementAction: 'block_commit',
    isActive: true,
    tags: ['Security', 'Zero-Leak', 'Vault']
  },
  {
    id: 'RULE-ARCH-02',
    title: 'تفکیک معماری کنترل‌پنل از نودهای محاسباتی (Decoupled Architecture)',
    category: 'architecture',
    severity: 'critical',
    rulePattern: 'Zero Heavy AI inference load on Master/Edge Control-plane (< 150MB Edge)',
    description: 'مدل‌های سنگین زبانی (>3B) و وکتورایزرهای حجیم هرگز نباید روی سرور وب اصلی یا سرور لبه سبک اجرا شوند. کلیه پردازش‌های هوش مصنوعی باید به نودهای ورکر و دیتاسنتر اختصاص یابد.',
    enforcementAction: 'block_commit',
    isActive: true,
    tags: ['Architecture', 'Anti-Crash', 'Resilience']
  },
  {
    id: 'RULE-CODE-03',
    title: 'تایپ‌اسکریپت سفت‌وسخت و عدم استفاده از any (Strict TypeScript)',
    category: 'code_style',
    severity: 'critical',
    rulePattern: 'TypeScript strict compilation without unhandled null or undefined casts',
    description: 'تمامی اینترفیس‌ها باید صریحاً تعریف شوند. استفاده از any بدون توجیه ممنوع است و کدهای سورس باید آزمایش کامپایل بدون خطا را پاس کنند.',
    enforcementAction: 'require_fix',
    isActive: true,
    tags: ['TypeScript', 'Quality', 'Lint']
  },
  {
    id: 'RULE-TEST-04',
    title: 'پوشش تست و فرآیند LintAndTest الزامی (Mandatory Unit Testing)',
    category: 'testing',
    severity: 'critical',
    rulePattern: 'All core logic functions and utilities must have verified unit tests',
    description: 'توابع حیاتی ارکستراسیون، احراز هویت، تولید اسکریپت شل و روتینگ باید تست‌های واحد معتبر داشته باشند و پیش از کامیت موفقیت‌آمیز بودن تست‌ها محرز شود.',
    enforcementAction: 'require_fix',
    isActive: true,
    tags: ['Vitest', 'Testing', 'Reliability']
  },
  {
    id: 'RULE-GIT-05',
    title: 'دیسیپلین پیام کامیت و تغییرات تمیز (Conventional Commits Discipline)',
    category: 'git_commit',
    severity: 'warning',
    rulePattern: 'feat: | fix: | refactor: | docs: | test: | chore: (<scope>): <description>',
    description: 'پیام‌های کامیت باید با پیشوندهای استاندارد (feat, fix, refactor, docs, chore) همراه با تشریح شفاف تغییرات ثبت شوند.',
    enforcementAction: 'require_fix',
    isActive: true,
    tags: ['Git', 'Clean-Code']
  },
  {
    id: 'RULE-NET-06',
    title: 'امنیت ارتباط بین‌سروری و رمزنگاری TLS 1.3 (Encrypted Tunnel Mesh)',
    category: 'security',
    severity: 'critical',
    rulePattern: 'Enforce TLS 1.3, HTTPS 301 redirect, HMAC-SHA256 Token Header injection',
    description: 'ارتباطات نودهای لبه و سرورهای ورکر با هسته مستر باید حتماً رمزنگاری شده و هدر X-OmniOps-Exchange-Token به عنوان احراز هویت اعتبارسنجی گردد.',
    enforcementAction: 'block_commit',
    isActive: true,
    tags: ['Networking', 'TLS1.3', 'HMAC']
  }
];

export const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
  {
    id: 'mcp-git',
    name: 'Git Context Protocol Server',
    transport: 'stdio',
    command: 'npx @modelcontextprotocol/server-git',
    endpoint: 'local://mcp-git-daemon',
    status: 'connected',
    toolsCount: 6,
    latencyMs: 1.2,
    toolsList: [
      { name: 'git_diff', description: 'دریافت تغییرات کدهای مرحله‌بندی‌شده (Staged) یا تغییرات کاری اخیر', category: 'git', parameters: ['target_branch', 'staged_only'] },
      { name: 'git_status', description: 'مشاهده لیست فایل‌های ویرایش‌شده، حذف‌شده و جدید', category: 'git', parameters: [] },
      { name: 'git_log', description: 'بررسی لاگ کامیت‌های اخیر و هش تغییرات', category: 'git', parameters: ['max_count'] },
      { name: 'git_commit_gate', description: 'اعمال گیت کیفی و ممانعت از کامیت در صورت نقض قوانین دکترینال', category: 'git', parameters: ['message', 'force'] }
    ]
  },
  {
    id: 'mcp-terminal',
    name: 'Terminal & Quality Runner MCP',
    transport: 'stdio',
    command: 'omniops-mcp-terminal-runner --safe-mode',
    endpoint: 'ipc:///run/omniops/mcp-terminal.sock',
    status: 'connected',
    toolsCount: 5,
    latencyMs: 0.8,
    toolsList: [
      { name: 'exec_lint', description: 'اجرای استاتیک Linter و بررسی قواعد کدنویسی پروژه', category: 'terminal', parameters: ['fix'] },
      { name: 'run_tests', description: 'اجرای سریع سوئیت تست‌های واحد Vitest و استخراج گزارش شکست/پاس', category: 'terminal', parameters: ['coverage'] },
      { name: 'typecheck_project', description: 'اجرای کامپایلر تایپ‌اسکریپت (tsc --noEmit) و استخراج ارورها', category: 'terminal', parameters: [] }
    ]
  },
  {
    id: 'mcp-filesystem',
    name: 'Workspace Filesystem MCP',
    transport: 'stdio',
    command: 'npx @modelcontextprotocol/server-filesystem ./src',
    endpoint: 'local://fs-isolated',
    status: 'connected',
    toolsCount: 4,
    latencyMs: 1.5,
    toolsList: [
      { name: 'read_changed_file', description: 'خواندن خطوط دقیق فایل‌های تغییریافته پروژه', category: 'fs', parameters: ['filepath', 'line_start', 'line_end'] },
      { name: 'apply_code_patch', description: 'اعمال تکه‌کد اصلاحی (Diff Patch) روی فایل بدون بازنویسی کل آن', category: 'fs', parameters: ['filepath', 'patch'] }
    ]
  },
  {
    id: 'mcp-github',
    name: 'GitHub Enterprise PR Gateway',
    transport: 'sse',
    command: 'github-mcp-gateway --org=omniops-enterprise',
    endpoint: 'https://api.github.com/mcp-sse',
    status: 'connected',
    toolsCount: 5,
    latencyMs: 24.0,
    toolsList: [
      { name: 'inspect_pull_request', description: 'دریافت تفاوت‌های کدهای یک Pull Request فعال', category: 'code', parameters: ['pr_number'] },
      { name: 'post_review_comment', description: 'ارسال نظر بازبینی و گزارش قوانین نقض‌شده در گیت‌هاب', category: 'code', parameters: ['pr_number', 'comment'] },
      { name: 'block_pr_merge', description: 'مسدودسازی دکمه Merge در گیت‌هاب تا رفع خطاهای کیفی', category: 'code', parameters: ['pr_number', 'reason'] }
    ]
  }
];

export const generateDoctrinalRulesMarkdown = (rules: ProjectRuleItem[]): string => {
  return `# 📜 سند قوانین دکترینال و گیت‌های کیفی پروژه (Doctrinal Project Rules & Quality Gate)
# تولید شده به صورت خودکار توسط OmniOps Enterprise Engine
# مسیر پیشنهادی در مخزن: .omniops/rules.md یا .cursorrules

version: "2.4.0-Enterprise"
enforcement_mode: "Strict-PreCommit-Gate"
audit_protocol: "Model-Context-Protocol (MCP)"

---

## ۱. مانیفست بنیادین کیفیت و امنیت (Core Manifesto)
کلیه مشارکت‌کنندگان، ایجنت‌های هوش مصنوعی و مدل‌های زبانی موظف به رعایت اصول زیر پیش از کامیت، ساخت پول‌ریکوئست یا استقرار بر روی سرورها هستند:

${rules.map((r, i) => `### ${i + 1}. [${r.id}] ${r.title}
- **دسته‌بندی:** \`${r.category}\`
- **شدت برخورد:** \`${r.severity.toUpperCase()}\`
- **اقدام کنترلی:** \`${r.enforcementAction}\`
- **الگوی قانون:** \`${r.rulePattern}\`
- **شرح دکترینال:** ${r.description}
- **وضعیت در پروژه:** ${r.isActive ? '✅ فعال و دارای نظارت خودکار' : '⏸️ موقتاً غیرفعال'}
`).join('\n')}

---

## ۲. پروتکل بازبینی خودکار ایجنت (Agentic Engineering Loop)
1. **دسترسی (MCP):** ایجنت از طریق پروتکل MCP دستورات \`git_diff\` و \`read_changed_file\` را فراخوانی می‌کند.
2. **اجرای مهارت‌ها (Skills):** فرآیند بازبینی تخصصی با مهارت‌های \`#LintAndTest\` و \`#QualityGate\` آغاز می‌شود.
3. **کنترل و فیلترینگ (Rules Gate):**
   - در صورت کشف هرگونه تناقض، فرآیند کامیت متوقف (\`BLOCKED\`) شده و تکه‌کد اصلاحی در چت ارائه می‌گردد.
   - در صورت انطباق کامل، مجوز کامیت (\`PASSED ✓\`) با ساختار Conventional Commit صادر می‌شود.
`;
};
