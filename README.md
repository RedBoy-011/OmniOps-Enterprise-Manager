# 🌐 OmniOps Enterprise Manager
### پلتفرم توزیع‌شده و هیبریدی مدیریت زیرساخت سرور، خوشه محاسباتی (Master + Worker Nodes) و پردازش هوشمند اسناد با هوش مصنوعی محلی (Zero-Token Edge Architecture)

[![GitHub Repo](https://img.shields.io/badge/GitHub-RedBoy--011%2FOmniOps--Enterprise--Manager-181717.svg?logo=github)](https://github.com/RedBoy-011/OmniOps-Enterprise-Manager)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04%20%7C%2024.04%20LTS-E95420.svg?logo=ubuntu)](https://ubuntu.com/)
[![WireGuard](https://img.shields.io/badge/Network-Zero--Trust%20WireGuard-88171A.svg?logo=wireguard)](https://www.wireguard.com/)
[![Caddy](https://img.shields.io/badge/SSL%20Engine-Caddy%20v2%20Auto--TLS-1f88c0.svg?logo=caddy)](https://caddyserver.com/)
[![Python TUI](https://img.shields.io/badge/CLI-Python%20Rich%20TUI-3776AB.svg?logo=python)](https://github.com/Textualize/rich)
[![Docker](https://img.shields.io/badge/Docker-Containers-blue.svg?logo=docker)](https://www.docker.com/)
[![MCP Ready](https://img.shields.io/badge/MCP-Ready%20(4%20Servers)-0ea5e9.svg)](SYSTEM_RULES.md)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM%20Engine-black.svg)](https://ollama.com/)
[![AnythingLLM](https://img.shields.io/badge/AnythingLLM-Local%20RAG-orange.svg)](https://anythingllm.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ⚡ دستورات نصب سریع تک‌خطی (Fast One-Line Installers)

کلیه فرامین نصب رسمی به مخزن سازمانی متصل بوده و جهت استقرار آنی روی سرورهای **Ubuntu (20.04 / 22.04 / 24.04 LTS)** و Debian بهینه‌سازی شده‌اند:

### ۱. دستور نصب سریع سرور کنترل مرکزی (Master Control-Plane):
این دستور ارزیابی بلادرنگ سخت‌افزار سرور را اجرا کرده، پیش‌نیازها، پایتون، داکر، شبکه امن مش، پایگاه‌داده و پنل ادمین را مستقر می‌نماید:

```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install.sh | bash
```

#### 👈 نصب سرور اصلی با تعیین مستقیم نام کاربری، رمز عبور ادمین و پورت شبکه:
```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install.sh | bash -s -- --role master --admin-user "admin" --admin-pass "OmniOps#2026!Sec" --web-port 9000 --enable-mesh
```

---

### ۲. دستور الحاق سرورهای دوم و سوم به عنوان نود محاسباتی (Worker Compute Nodes):
جهت اختصاص سرورهای دارای کارت‌های گرافیک NVIDIA یا پردازنده‌های پرقدرت برای میزبانی مدل‌های زبانی سنگین (DeepSeek-R1, Dorna 2, Llama 3.3) و تضمین آپ‌تایم ۱۰۰٪ پنل مرکزی:

```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install-worker.sh | bash -s -- --master "http://MASTER_SERVER_IP:9000" --token "omniops.v2.join-token-sec99" --name "Worker-Node-02"
```

> **نکته معمار سیستم:** با اجرای اسکریپت ورکر، منابع سخت‌افزاری سرور به صورت خودکار ممیزی شده و درایورهای GPU کشف و به استخر پردازشی متصل می‌گردند.

---

### ۳. دستور نصب سرور لبه، آینه گرافیکی و تونل امن (Lightweight Zero-Trust Edge UI Mirror):
جهت راه‌اندازی درگاه وب سازمانی روی سرورهای سبک ابری (۱ یا ۲ گیگابایت رم) در دیتاسنتر یا شبکه CDN با **محیط تعاملی گرافیکی پایتون (Python TUI)**، برقراری خودکار **تونل رمزنگاری‌شده WireGuard** و صدور بومی **گواهی‌نامه SSL با Caddy**:

#### 🚀 الف) حالت تعاملی گرافیکی (Interactive Python CLI - پیشنهادی):
این فرمان محیط بصری ترمینال (بر پایه کتابخانه `rich`) را بوت کرده و پارامترهای اتصال را به صورت هوشمند و اعتبارسنجی‌شده دریافت می‌کند:

```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install-edge-node.sh | bash
```

#### ⚡ ب) حالت خودکار مستقیم (Unattended / Silent Execution):
```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install-edge-node.sh | bash -s -- --core "185.190.22.45" --port 9000 --token "YOUR_STRUCTURED_EXCHANGE_TOKEN" --domain "panel.mycompany-ai.ir" --auto-ssl
```

---

## 🛡️ نوآوری‌های کلیدی معماری لبه و امنیت Zero-Trust

### ۱. محیط تعاملی نصب با Python CLI (به جای Bash ساده):
اسکریپت بوت‌استرپ `install-edge-node.sh` بدون نیاز به دخالت کاربر، محیط اجرایی پایتون ۳ را آماده کرده و یک رابط کاربری ترمینالی پیشرفته (TUI) با جعبه‌های رنگی، انیمیشن اسپینر، جدول خلاصه مشخصات و اعتبارسنجی بلادرنگ فیلدها اجرا می‌کند:
1. **دریافت IP و پورت مستر:** دریافت آدرس سرور اصلی و امکان تعریف پورت دلخواه (مانند 9000, 8443, 8080).
2. **دریافت توکن ساختاریافته (Structured Token):** اعتبارسنجی ساختار کلید تبادل و تجزیه خودکار اطلاعات کلاستر.
3. **گزینش متدولوژی SSL:** امکان انتخاب بین صدور خودکار ACME توسط Caddy یا مشخص‌سازی مسیر فایل‌های اختصاصی گواهی (`.crt` و `.key`).

### ۲. مکانیزم کلید تبادل امن و شبکه Zero-Trust با WireGuard:
- **توکن ساختاریافته هوشمند (Kubernetes-Style Token):** سیستم به جای رشته‌های متنی ساده از توکن‌های ساختاریافته دارای امضای دیجیتال (مانند `omniops.v2.<cluster_id>.<endpoint_payload>.<signature>`) استفاده می‌کند.
- **ارتباط همتا-به-همتا با WireGuard:** پس از ورود توکن در سرور لبه، اسکریپت جفت‌کلید رمزنگاری (`PrivateKey` و `PublicKey`) را ایجاد کرده و یک تونل ارتباطی ایزوله (`10.88.0.2 ⟷ 10.88.0.1`) می‌سازد.
- **مسدودسازی پورت‌های اینترنتی:** سرور مستر هیچ درگاه ناامنی روی وب ندارد؛ تمام داده‌ها منحصراً از بستر تونل رمزنگاری‌شده WireGuard مخابره می‌شوند.

### ۳. مدیریت خودکار SSL با Caddy Engine در لبه:
- برخلاف پیچیدگی‌ها و ریسک‌های کران‌جاب Certbot در Nginx، سرور لبه از وب‌سرور مدرن **Caddy v2** با قابلیت **Zero-Config Automatic HTTPS** بهره می‌برد.
- به محض معرفی نام دامنه سازمانی، پروتکل ACME فعال شده، گواهی‌نامه رسمی Let's Encrypt / ZeroSSL صادر و هر ۹۰ روز بدون دخالت ادمین تمدید می‌گردد.
- ترافیک کاربران از پورت ۴۴۳ دریافت و از بستر تونل WireGuard به کنترل‌پنل مستر هدایت می‌شود.
- **مصرف حافظه رم سرور لبه:** کمتر از ۱۵۰ مگابایت (ایزوله کامل از پردازش‌های سنگین هوش مصنوعی).

---

## 🏗️ دیاگرام معماری توزیع‌شده کلاستر و مش امنیتی (Distributed Architecture)

```text
                  +-------------------------------------------------------+
                  |         کاربران، مدیران شبکه و کلاینت‌ها (Web UI)        |
                  +---------------------------+---------------------------+
                                              |
                                     (HTTPS / TLS 1.3 - پورت 443)
                                              v
   ===================================================================================
   [ سرور لبه: آینه گرافیکی و درگاه معکوس سبک ]  EDGE UI MIRROR NODE (1-2GB RAM VPS)
   - وب‌سرور Caddy v2: صدور و تمدید خودکار بومی SSL (ACME Protocol TLS 1.3)
   - رابط گرافیکی Python Rich TUI برای استقرار و عیب‌یابی در ترمینال لینوکس
   - جفت‌کلید WireGuard Client: اینترفیس wg0 (IP مجازی: 10.88.0.2/24)
   - مصرف حافظه: < 150 MB RAM | ایزوله کامل از مدل‌های زبانی سنگین
   ===================================================================================
                                              |
                   (تونل رمزنگاری‌شده نقطه-به-نقطه Zero-Trust WireGuard)
                     [ UDP 51820 Peer-to-Peer Tunnel / رنج 10.88.0.0/24 ]
                                              v
   ===================================================================================
   [ سرور اول: پنل کنترل و هسته مرکزی ]  MASTER CONTROL-PLANE NODE (10.88.0.1:9000)
   - ارکستراسیون کلان، OmniRoute Intelligent Router و پایگاه‌داده
   - تولید و مدیریت توکن‌های ساختاریافته الحاق (Structured Join Tokens)
   - اجرای فرامین روت شل و پایش تله‌متری سلامت گره‌ها
   ===================================================================================
                                              |
                           (شبکه امن داخلی / WireGuard Overlay Mesh)
                                              |
              +--------------------------------+--------------------------------+
              |                                                                 |
              v                                                                 v
===========================================       ===========================================
[ سرور دوم: نود پردازش سنگین ]                    [ سرور سوم: نود وکتور و پایپ‌لاین ]
WORKER COMPUTE NODE 01 (GPU Dedicated)            WORKER COMPUTE NODE 02 (CPU/RAG Dedicated)
- سخت‌افزار: 24 vCPUs | 64GB RAM | RTX 4090       - سخت‌افزار: 16 vCPUs | 32GB RAM | AVX-512
- موتور استنتاج سنگین: Ollama Local Engine        - موتور اسناد اداری: AnythingLLM + JEV Reader
- مدل‌های فعال:                                   - پایپ‌لاین ایجنت‌ها: Langflow (:7860)
  • DeepSeek-R1 (14B/32B Reasoning)              - اتوماسیون سازمانی: n8n Workflow (:5678)
  • Dorna 2 (8B National Model)                   - وکتورسازی و امبدینگ: BGE-M3 Multilingual
  • Llama 3.3 (70B Quantized)                     - صفر هزینه توکن و محرمانگی مطلق اسناد
===========================================       ===========================================
```

---

## 🚀 امکانات و قابلیت‌های اصلی سامانه

### ۱. داشبورد دایره‌ای پایش سلامت نودها (Cluster Health Donut Dashboard)
- **نمودارهای هم‌مرکز دوگانه (Dual Concentric Donut Rings):**
  - **حلقه خارجی:** پایش لحظه‌ای درصد مصرف حافظه RAM با کد رنگی هوشمند (فیروزه‌ای، کهربایی، قرمز بحرانی).
  - **حلقه داخلی:** پایش درصد بار پردازشی هسته‌های CPU.
  - **مرکز دایره:** شاخص سلامت، وضعیت تونل WireGuard، تاخیر پینگ و مدل‌های لودشده.
- **تله‌متری زنده (Live Telemetry Streaming):** پایش پیوسته با نشانگر پالس‌دار آنلاین و نوسان سنسورهای فیزیکی سرورها.
- **نمای تجمیعی کل استخر کلاستر:** نمایش مجموع کل RAM کلاستر (مثلاً ۱۱۲ گیگابایت)، کل هسته‌ها (۵۶ هسته) و کارت‌های گرافیک فعال (۲۴GB VRAM).

### ۲. گزارش ارزیابی هوشمند سخت‌افزار سرور (Hardware Assessment & Upgrade Advisor)
- ممیزی کامل در لحظه استقرار:
  - **ارزیابی RAM:** تشخیص حداقل حافظه مورد نیاز برای مدل‌های سبک (۸GB)، مدل‌های استدلال (۳۲GB) یا مدل‌های سازمانی (۶۴GB).
  - **ارزیابی پردازنده (CPU):** سنجش تعداد هسته‌ها و توانایی استنتاج موازی.
  - **ارزیابی کارت گرافیک (GPU):** کشف شتاب‌دهنده NVIDIA و هشدار سرعت در حالت CPU Inference.
  - **توصیه معمار سیستم (Architect Verdict):** راهنمای گام‌به‌گام ارتقا و پیشنهاد ایزوله‌سازی سرور پنل از نودهای پردازشی.

### ۳. سیستم حافظه پایدار چت‌بات هسته (Persistent Chat Memory)
- ذخیره‌سازی محلی و ماندگار در پایگاه‌داده و مرورگر (`localStorage`).
- بازیابی خودکار تمامی سشن‌ها، فرامین سیستمی و پاسخ‌های استدلال عمیق پس از رفرش صفحه یا قطع موقت شبکه.
- **دفترچه تصمیمات کلیدی (Key Decisions Ledger):** ثبت تصمیمات کلیدی اتخاذ شده توسط مدل هوش مصنوعی و مدیران سیستم.
- **ثبت متغیرهای محیطی:** نگهداری اسنپ‌شات از مقادیر متغیرها در هر پاسخ.

### ۴. چت‌روم چندمنظوره با دسترسی به مدل‌های ابری و محلی
- رتبه‌بندی پویای مدل‌های فعال بر اساس تاخیر، دسترسی API و سرعت.
- پشتیبانی کامل از مدل‌های ملی ایرانی نظیر **Dorna 2:8b** و **Maral 7B** روی موتور اولاما بدون نیاز به اینترنت.
- سوئیچ روان میان مدل‌های داخلی محلی، سرورهای ورکر و APIهای ابری.

### ۵. موتورهای پردازش محلی اسناد اداری و محرمانگی داده‌ها
- **AnythingLLM (:3001):** پایگاه دانش اسناد محلی با دیتابیس برداری بر پایه وکتورهای BGE-M3.
- **JEV Reader (:8000):** خرد کردن هوشمند متون (Chunking 512)، OCR اسناد اسکن‌شده و ریرنکینگ محلی.
- **تضمین هزینه صفر توکن (Zero-Token Guarantee):** عدم ارسال مکاتبات و داده‌های سازمانی به خارج از شبکه.

---

## 🌐 جدول پورت‌ها، سرویس‌ها و شبکه‌بندی امن (Network & Ports Matrix)

| نام سرویس | پورت پیش‌فرض | نقش در سامانه | پروتکل و لایه امنیتی |
| :--- | :--- | :--- | :--- |
| **Edge UI Gateway** | `443` / `80` | درگاه امن وب و پروکسی معکوس | HTTPS / Caddy TLS 1.3 Auto-ACME |
| **WireGuard Mesh** | `51820/udp` | تونل رمزنگاری‌شده همتا-به-همتا | ChaCha20-Poly1305 Zero-Trust Tunnel |
| **OmniOps Control-Plane** | `9000` / `8080` | هسته مرکزی، احراز هویت و API | شبکه اختصاصی `10.88.0.1` (ایزوله از وب) |
| **MCP Git Daemon** | `local://mcp-git` | بازرسی شاخه‌ها و `git_diff` | درون‌پروسسی / IPC امن |
| **MCP Terminal Daemon** | `local://mcp-term`| اجرای امن linter و آزمون‌های کد | سندباکس ایزوله لینوکس |
| **JEV Fast Reader** | `8000` | موتور خواندن، OCR و ریرنکینگ | شبکه امن `omniops_mesh` |
| **AnythingLLM Engine** | `3001` | پایگاه دانش اسناد محلی RAG | شبکه امن `omniops_mesh` |
| **Ollama Local LLM** | `11434` | استنتاج مدل‌های متنی، استدلال و کد | شبکه امن داخلی ورکرها |
| **Langflow Visual Studio** | `7860` | طراحی گراف بصری خطوط لوله ایجنت‌ها | شبکه امن `omniops_mesh` |
| **n8n Workflow Engine** | `5678` | اتوماسیون وب‌هوک‌ها و پایگاه‌های داده | شبکه امن `omniops_mesh` |

---

## 📚 کتابچه راهنمای جامع و مستندات عملیاتی (Documentation & User Manual)

کتابچه‌های راهنمای تفصیلی معماری، ابزارهای شبکه، عیب‌یابی و فرآیندها در مسیرهای زیر در دسترس است:
- 📜 [مانیفست دکترینال و سند بالادستی قوانین ایجنت مهندسی (SYSTEM_RULES.md)](SYSTEM_RULES.md)
- 📘 [کتابچه راهنمای جامع کاربران و راهنمای عملیاتی هسته (Comprehensive User Manual)](docs/USER_MANUAL.md)
- 📖 [کتابچه راهنمای ابزارهای هسته و سناریوهای شبکه (Core Operations Handbook)](docs/HANDBOOK.md)
- 🔌 [راهنمای افزونه و بازوی اجرایی کروم (Chrome Extension Guide)](chrome_extension/INSTALL_GUIDE.md)

---

## 🛠️ استقرار دستی با Docker Compose

در صورت تمایل به راه‌اندازی دستی کانتینرها بدون اسکریپت خودکار، فایل `deployment/docker-compose.local.yml` در دسترس است:

```bash
docker compose -f deployment/docker-compose.local.yml up -d
```

---

## 🔒 امنیت، محرمانگی و ایزولاسیون سازمانی
- کلیه کانتینرهای ماژولار درون شبکه داکر Bridge ایزوله به نام `omniops_mesh` (رنج `172.28.0.0/16`) ارتباط برقرار می‌کنند.
- ارتباط سرور مستر با نودهای لبه و ورکر منحصراً از طریق تونل رمزنگاری‌شده WireGuard (`10.88.0.0/24`) صورت می‌پذیرد.
- احراز هویت سه سطحی مبتنی بر نقش (`SuperAdmin`, `Admin`, `User`) با تفکیک وظایف و ثبت کلیه لاگ‌های چرخه حیات.

---

## 📄 لایسنس
این سامانه تحت پروانه متن‌باز [MIT License](LICENSE) در مخزن [RedBoy-011/OmniOps-Enterprise-Manager](https://github.com/RedBoy-011/OmniOps-Enterprise-Manager) منتشر شده است.  
طراحی و پیاده‌سازی‌شده با استانداردهای مدرن DevOps، شبکه‌های Zero-Trust و استنتاج مرزی هوش مصنوعی.
