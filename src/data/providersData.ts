import { ApiProviderConfig } from '../types';

export const DEFAULT_PROVIDERS: ApiProviderConfig[] = [
  {
    id: 'gemini',
    name: 'gemini',
    displayName: 'Google Gemini (AI Studio)',
    officialKeyUrl: 'https://aistudio.google.com/app/apikey',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    requiresKey: true,
    description: 'مدل‌های پرچمدار و پرسرعت گوگل (Gemini 2.5 Flash, 2.5 Pro, 2.0 Flash) با توانایی تحلیل تصاویر و پنجره زمینه ۱ میلیون توکن',
    category: 'cloud'
  },
  {
    id: 'openrouter',
    name: 'openrouter',
    displayName: 'OpenRouter (Multi-Model Hub)',
    officialKeyUrl: 'https://openrouter.ai/keys',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    description: 'درگاه یکپارچه جهانی به بیش از ۲۰۰ مدل هوش مصنوعی (Claude 3.5 Sonnet, GPT-4o, DeepSeek, Llama 3.3)',
    category: 'cloud'
  },
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI (Official API)',
    officialKeyUrl: 'https://platform.openai.com/api-keys',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    description: 'مدل‌های رسمی OpenAI شامل GPT-4o، GPT-4o-mini و مدل‌های استدلال عمیق o1 و o3',
    category: 'cloud'
  },
  {
    id: 'deepseek',
    name: 'deepseek',
    displayName: 'DeepSeek (Official Platform)',
    officialKeyUrl: 'https://platform.deepseek.com/api_keys',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    description: 'مدل‌های فوق‌العاده ارزان و قدرتمند DeepSeek-V3 و DeepSeek-R1 با قابلیت‌های بی‌نظیر کدنویسی و تحلیل شبکه',
    category: 'cloud'
  },
  {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic Claude (Official API)',
    officialKeyUrl: 'https://console.anthropic.com/settings/keys',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    description: 'هوش مصنوعی Claude 3.7 Sonnet (Hybrid Reasoning) و Claude 3.5 با درک عمیق منطقی، کدنویسی پیشرفته و تحلیل اسکریپت‌های پیچیده سیستمی',
    category: 'cloud'
  },
  {
    id: 'nvidia',
    name: 'nvidia',
    displayName: 'NVIDIA NIM (Build Nvidia Cloud)',
    officialKeyUrl: 'https://build.nvidia.com',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresKey: true,
    description: 'میکروسرویس‌های پردازشی ان‌ویدیا (NVIDIA NIM) شامل Llama 3.3 70B Instruct، Nemotron-70B، DeepSeek-R1 و Mistral-NeMo با شتاب‌دهنده GPU و زمان تأخیر استثنایی',
    category: 'cloud'
  },
  {
    id: 'groq',
    name: 'groq',
    displayName: 'Groq Cloud (Ultra-Fast LPU)',
    officialKeyUrl: 'https://console.groq.com/keys',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    description: 'سریع‌ترین موتور پردازش هوش مصنوعی در جهان (بیش از ۵۰۰ توکن در ثانیه برای Llama 3.3 70B و Mixtral)',
    category: 'cloud'
  },
  {
    id: 'mistral',
    name: 'mistral',
    displayName: 'Mistral AI (La Plateforme)',
    officialKeyUrl: 'https://console.mistral.ai/api-keys',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    requiresKey: true,
    description: 'مدل‌های اروپایی و سازمانی Mistral Large 2 و Codestral تخصصی برنامه‌نویسی و اتوماسیون',
    category: 'cloud'
  },
  {
    id: 'together',
    name: 'together',
    displayName: 'Together AI',
    officialKeyUrl: 'https://api.together.xyz/settings/api-keys',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    description: 'کلاود تخصصی برای مدل‌های متن‌باز Qwen 2.5، Llama 3 و DeepSeek با قیمت بسیار پایین',
    category: 'cloud'
  },
  {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama (Local Offline)',
    officialKeyUrl: 'https://ollama.com',
    defaultBaseUrl: 'http://localhost:11434',
    requiresKey: false,
    description: 'سرور محلی کامپیوتر بدون نیاز به اینترنت و بدون تحریم؛ ایده‌آل برای زمان بحران و حفظ امنیت داده‌های محرمانه',
    category: 'local'
  },
  {
    id: 'anythingllm',
    name: 'anythingllm',
    displayName: 'AnythingLLM (Local Document RAG & Office Letters)',
    officialKeyUrl: 'https://anythingllm.com',
    defaultBaseUrl: 'http://localhost:3001/api/v1',
    requiresKey: false,
    description: 'موتور قدرتمند تحلیل اسناد اداری، نامه‌نگاری، فایلهای PDF/Word/Excel و پایگاه دانش سازمانی آفلاین بدون کسر توکن ابری',
    category: 'local'
  },
  {
    id: 'langflow',
    name: 'langflow',
    displayName: 'Langflow (Visual AI Workflow & Agent Pipelines)',
    officialKeyUrl: 'https://www.langflow.org',
    defaultBaseUrl: 'http://localhost:7860/api/v1',
    requiresKey: false,
    description: 'محیط بصری طراحی پایپ‌لاین‌های هوش مصنوعی محلی، خطوط پردازش چندمرحله‌ای اسناد و اتصال به ابزارهای سیستمی',
    category: 'local'
  },
  {
    id: 'jev',
    name: 'jev',
    displayName: 'JEV Engine (Jina Local Reader & Embedder)',
    officialKeyUrl: 'https://jina.ai',
    defaultBaseUrl: 'http://localhost:8000/v1',
    requiresKey: false,
    description: 'موتور سبک خواندن اسناد، قطعه‌بندی هوشمند متون (Chunking) و بازخوانی اسناد اداری در شبکه محلی بدون وابستگی به اینترنت',
    category: 'local'
  },
  {
    id: 'ember',
    name: 'ember',
    displayName: 'Ember-1 (Agentic Internal Engine & Vision)',
    officialKeyUrl: 'https://omniops.internal/models/ember-1',
    defaultBaseUrl: 'http://localhost:8443/v1/ember',
    requiresKey: false,
    description: 'مدل تخصصی عامل‌محور داخلی برای Tool Calling آنی، کدنویسی سبک، تحلیل بصری (Vision) و پایپ‌لاین‌های اتوماسیون با حداقل تأخیر',
    category: 'local'
  },
  {
    id: 'lmstudio',
    name: 'lmstudio',
    displayName: 'LM Studio / LocalAI / vLLM',
    officialKeyUrl: 'https://lmstudio.ai',
    defaultBaseUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    description: 'اتصال به کلاینت‌های لوکال سازگار با فرمت استاندارد OpenAI در شبکه داخلی ادمین',
    category: 'local'
  }
];
