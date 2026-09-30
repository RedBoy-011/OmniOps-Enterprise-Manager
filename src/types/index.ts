export type UserRole = 'SuperAdmin' | 'Admin' | 'User';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at?: string;
  last_login?: string;
  agent_connected?: boolean;
  agent_ip?: string;
  agent_version?: string;
  active_tools_count?: number;
  allowed_tools?: string[]; // IDs of tools this user is permitted to invoke
  active_tools_list?: string[]; // Names of currently active tools
}

export interface CustomQuickCommand {
  id: string;
  title: string;
  command: string;
  prompt: string;
  tag: string;
  is_custom?: boolean;
}

export interface ToolExecutionAction {
  id: string;
  tool_id: string;
  tool_name: string;
  command: string;
  status: 'executing' | 'success' | 'permission_denied' | 'failed';
  denied_reason?: string;
  output?: string;
  executed_at?: string;
  execution_arm?: string;
}

export interface LocalAgentConfig {
  serverWsUrl: string;
  agentToken: string;
  localPort: number;
  enableMouseKeyboard: boolean;
  enableScreenCapture: boolean;
  enableNetworkTools: boolean;
  useSocks5Proxy: boolean;
  proxyHost: string;
  proxyPort: number;
  status: 'running' | 'stopped' | 'error';
  lastPingMs?: number;
}

export interface AgentToolItem {
  id: string;
  name: string;
  category: 'network' | 'remote_control' | 'input_hid' | 'prerequisite';
  description: string;
  status: 'installed' | 'active' | 'pending' | 'missing';
  version?: string;
  requiredFor: string;
}

export interface ApiProviderConfig {
  id: string; // e.g. 'gemini', 'openrouter', 'openai', 'deepseek', 'anthropic', 'groq', 'mistral', 'ollama', 'custom'
  name: string;
  displayName: string;
  officialKeyUrl: string;
  defaultBaseUrl?: string;
  requiresKey: boolean;
  description: string;
  category: 'cloud' | 'local' | 'custom';
}

export interface ApiKeyItem {
  id: number;
  provider: string; // provider id
  providerName?: string;
  base_url?: string;
  is_active: number;
  last_validated?: string;
  masked_key: string;
  raw_key?: string;
}

export interface AiModel {
  id: number | string;
  provider: string;
  model_id: string;
  display_name: string;
  context_length: number;
  status: 'online' | 'degraded' | 'offline';
  latency_ms: number;
  is_recommended: boolean;
  category?: string;
  supports_image_generation?: boolean;
  supports_video_generation?: boolean;
  supports_vision?: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'network' | 'system' | 'security' | 'devops' | 'automation' | 'plugin';
  icon: string;
  description: string;
  domainKnowledge: string[]; // Key domain knowledge points brought to conversation
  systemPromptInjection: string; // Directives injected into the AI system prompt
  sampleQueries: string[];
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'DEPLOY' | 'SUCCESS';
  component: 'Core' | 'AnythingLLM' | 'Langflow' | 'JEV' | 'Ollama' | 'n8n' | 'Dify' | 'Network' | 'Security';
  phase?: 'INSTALL' | 'CONFIG' | 'UPDATE' | 'LIFECYCLE' | 'DISPATCH' | 'HEALTHCHECK';
  message: string;
  details?: string;
}

export interface LocalServiceStatus {
  id: 'ollama' | 'anythingllm' | 'langflow' | 'jev' | 'n8n' | 'dify';
  name: string;
  displayName: string;
  port: number;
  isInstalled: boolean;
  isRunning: boolean;
  category: 'core' | 'document' | 'agent' | 'automation';
  version?: string;
  description: string;
}

export interface DocumentAnalysisResult {
  id: string;
  fileName: string;
  fileSize: number;
  documentType: 'letter' | 'report' | 'financial' | 'technical' | 'spreadsheet';
  title: string;
  summary: string;
  keyPoints: string[];
  letterDraft?: {
    subject: string;
    recipient: string;
    sender: string;
    body: string;
    actionRequired: string;
  };
  tableData?: { headers: string[]; rows: string[][] };
  engine: 'AnythingLLM (Local Offline)' | 'JEV + AnythingLLM (Local Offline)' | 'Langflow Hybrid RAG' | 'Cloud API';
  tokensSavedEstimate: number;
  privacyNotice: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  size: number;
  previewUrl?: string; // Data URL for image or preview
  content?: string; // Text content if text/log file
  documentCategory?: 'pdf' | 'word' | 'excel' | 'text' | 'scanned';
}

export interface ServerCommandAction {
  id: string;
  title: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  exitCode?: number;
  executedAt?: string;
}

export interface GeneratedMediaItem {
  id: string;
  type: 'image' | 'video' | 'diagram';
  url: string;
  title: string;
  prompt: string;
  model: string;
}

export interface OmniRouteInfo {
  selected_provider: string;
  provider_id: string;
  latency_ms: number;
  hop_flow: string;
  failover_occurred?: boolean;
  previous_limited_provider?: string;
  routing_reason?: string;
}

export interface AgentCommandStep {
  stepNumber: number;
  title: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: string;
}

export interface AgentCommandProposal {
  id: string;
  intentSummary: string; // تفسیر قصد و نوع درخواست
  reasoning: string; // افکار و منطق ایجنت هوشمند
  targetSystem: 'windows' | 'cisco' | 'linux' | 'mikrotik' | 'browser' | 'security' | 'general';
  toolId: string;
  toolName: string;
  executionArm: string;
  command: string;
  steps: AgentCommandStep[];
  status: 'pending_approval' | 'approved_full' | 'approved_step' | 'rejected' | 'completed' | 'permission_denied';
  requiresRbacCheck: boolean;
  isRbacSatisfied?: boolean;
  rbacDeniedReason?: string;
  finalResultSummary?: string;
  approvedMode?: 'full' | 'step';
  currentStepIndex?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model_used?: string;
  active_skills_used?: string[];
  attachments?: ChatAttachment[];
  server_actions?: ServerCommandAction[];
  generated_media?: GeneratedMediaItem[];
  tool_execution?: ToolExecutionAction;
  command_proposal?: AgentCommandProposal;
  document_analysis?: DocumentAnalysisResult;
  is_tool_command?: boolean;
  is_command_mode?: boolean;
  omni_route?: OmniRouteInfo;
  network_scope?: string;
  mcp_execution?: McpAgentExecutionMeta;
}

export interface ChatSession {
  id: string;
  title: string;
  selected_model: string;
  active_skills: string[];
  created_at: string;
  messages: ChatMessage[];
  is_server_ops?: boolean;
  is_pinned?: boolean;
}

export interface CoreArchitectureMemoryItem {
  id: string;
  category: 'architecture' | 'network' | 'service' | 'credential' | 'decision' | 'rule';
  title: string;
  key: string;
  value: string;
  lastUpdated: string;
  isLocked?: boolean;
}

export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
}

// -----------------------------------------------------------------------------
// MCP (Model Context Protocol) & Doctrinal Rules Engine Types
// -----------------------------------------------------------------------------

export interface ProjectRuleItem {
  id: string; // e.g. "RULE-SEC-01"
  title: string;
  category: 'security' | 'architecture' | 'testing' | 'git_commit' | 'code_style';
  severity: 'critical' | 'warning' | 'info';
  rulePattern: string; // e.g. "No hardcoded secrets, API keys or tokens"
  description: string;
  enforcementAction: 'block_commit' | 'require_fix' | 'warn_only';
  isActive: boolean;
  tags?: string[];
}

export interface RuleViolation {
  ruleId: string;
  ruleTitle: string;
  file: string;
  line?: number;
  severity: 'critical' | 'warning' | 'info';
  explanation: string;
  proposedFix: string;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  category: 'git' | 'terminal' | 'fs' | 'database' | 'code';
  parameters: string[];
}

export interface McpServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'sse' | 'websocket';
  command: string;
  endpoint: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  toolsCount: number;
  latencyMs: number;
  toolsList: McpToolDefinition[];
}

export interface McpAgentExecutionMeta {
  mcpServerUsed: string;
  toolInvoked: string;
  diffSummary?: string;
  filesInspected?: string[];
  activeSkillsUsed?: string[];
  rulesCheckedCount?: number;
  violationsCount?: number;
  violations?: RuleViolation[];
  decision: 'approved' | 'blocked' | 'warning';
  commitMessageSuggested?: string;
  fixedCodeSnippet?: string;
}

