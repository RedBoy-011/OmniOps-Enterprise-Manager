# 🌐 OmniOps Enterprise Manager
### پلتفرم ابری هوش مصنوعی و ارکستراسیون ایجنت‌های خودمختار با معماری توزیع‌شده (Master / Worker / Edge) و امنیت Zero-Trust

[![GitHub Repo](https://img.shields.io/badge/GitHub-RedBoy--011%2FOmniOps--Enterprise--Manager-181717.svg?logo=github)](https://github.com/RedBoy-011/OmniOps-Enterprise-Manager)
[![Ubuntu LTS](https://img.shields.io/badge/Ubuntu-22.04%20%7C%2024.04%20LTS-E95420.svg?logo=ubuntu)](https://ubuntu.com/)
[![Windows Edge Agent](https://img.shields.io/badge/Windows-Tauri%202%20%7C%20Rust-0078D6.svg?logo=windows)](agent/windows-edge-agent)
[![WireGuard Mesh](https://img.shields.io/badge/Network-Zero--Trust%20WireGuard-88171A.svg?logo=wireguard)](https://www.wireguard.com/)
[![MCP Protocol](https://img.shields.io/badge/MCP-JSON--RPC%20Gateway-0ea5e9.svg)](modules/mcp)
[![Docker Sandbox](https://img.shields.io/badge/Sandbox-MicroVM%20%7C%20Docker-blue.svg?logo=docker)](modules/sandbox)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 کتابچه راهنمای جامع صفر تا صد معماری (The Definitive Handbook)

> 🌟 **راهنمای جامع، صفر تا ۱۰۰، دیاگرام‌های تفصیلی، کالبدشکافی فنی، ماتریس امنیتی و نقشه راه کامل پروژه:**  
> لطفاً برای بررسی ریزجزئیات مهندسی، ماتریس RBAC، پروتکل‌های امنیتی و راهنمای استقرار سازمانی، کتابچه مرجع را در آدرس زیر مطالعه فرمایید:  
> 🔗 **[کتابچه مرجع صفر تا صد معماری و استقرار سازمانی (docs/ENTERPRISE_ARCHITECTURE_AND_ROADMAP.md)](docs/ENTERPRISE_ARCHITECTURE_AND_ROADMAP.md)**

---

## 🏛️ دیاگرام توپولوژی و کالبدشکافی معماری (Architecture Topology)

پلتفرم **OmniOps Enterprise Manager** با هدف رفع مشکل همیشگی کرش ناشی از مصرف رم (OOM Crash) در سرورهای هوش مصنوعی، به صورت معماری کاملاً تفکیک‌شده و توزیع‌شده طراحی شده است:

```
                                      ┌─────────────────────────────────────┐
                                      │   کاربر / داشبورد وب ادمین مرکزی     │
                                      │  Minimalist Progressive UI (Dark)   │
                                      └──────────────────┬──────────────────┘
                                                         │ HTTPS / WSS / SSE
                                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             سرور کنترل مرکزی مستر (OmniOps Master Node)                          │
│  ┌───────────────────────────┐  ┌────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ State-Machine Dual Header │  │ Central API Gateway        │  │ Identity & Cyber Defense    │  │
│  │ [گفتگو] <---> [وظیفه]     │  │ /v1/chat, /v1/agent/...    │  │ LDAPS, SQLite, Rate-Limit   │  │
│  └─────────────┬─────────────┘  └─────────────┬──────────────┘  └──────────────┬──────────────┘  │
│                │                              │                                │                 │
│  ┌─────────────▼─────────────┐  ┌─────────────▼──────────────┐  ┌──────────────▼──────────────┐  │
│  │ MCP & Skills Hub          │  │ Sandboxed Execution Engine │  │ Direct Downloads & Releases │  │
│  │ JSON-RPC Connectors       │  │ MicroVM / Docker SSE Logs  │  │ Win Agent .exe / Pre-Config │  │
│  └───────────────────────────┘  └────────────────────────────┘  └─────────────────────────────┘  │
└──────────────┬──────────────────────────────┬──────────────────────────────────┬─────────────────┘
               │ WireGuard Mesh               │ WebSocket / SSE                  │ Bearer Handshake
               ▼                              ▼                                  ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌────────────────────────────────┐
│ نودهای محاسباتی (Workers)    │ │ سرورهای لبه (Edge Mirrors)   │ │ بازوی ویندوزی (Windows Agent)  │
│ استخر پردازشی GPU و مدل‌ها   │ │ درگاه سبک با تونل امن و Caddy│ │ نسخه بومی‌سازی‌شده Coucou (Tauri│
│ پردازش عمیق و مدل‌های محلی   │ │ پروکسی معکوس با پینگ زیر ۵ms │ │ گیت تاییدیه Zero-Trust و ترمینال│
└──────────────────────────────┘ └──────────────────────────────┘ └────────────────────────────────┘
```

---

## ⚡ دستورات نصب سریع و تک‌خطی (Fast One-Line Installers)

کلیه فرامین به صورت تعاملی و مجهز به واسط کاربری متنی پیشرفته (**Bubbletea / Rich TUI**) و با قابلیت اجرای خودکار طراحی شده‌اند:

### ۱. نصب سرور کنترل مرکزی (Master Control-Plane):
```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install.sh | bash
```
> **نصب سفارشی با پارامترهای مستقیم:**
> ```bash
> curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install.sh | bash -s -- --role master --admin-user "admin" --admin-pass "OmniOps#2026!Sec" --web-port 9000
> ```

---

### ۲. الحاق سرورهای دوم و سوم به عنوان نود محاسباتی (Worker Compute Nodes):
اختصاص سرورهای دارای کارت‌های گرافیک NVIDIA جهت استنتاج مدل‌های سنگین و جلوگیری از اشغال رم سرور مستر:
```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install-worker.sh | bash -s -- --master "http://MASTER_IP:9000" --token "omni_sec_tok_master_default" --name "Worker-Node-01"
```

---

### ۳. نصب سرور لبه سبک، آینه وب و تونل امن (Zero-Trust Edge UI Mirror):
جهت استقرار درگاه وب روی سرورهای سبک (۱ یا ۲ گیگابایت رم) با **پروکسی معکوس خودکار Caddy** و صدور گواهی‌نامه رایگان SSL:
```bash
curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/install-edge-node.sh | bash
```

---

### ۴. راه‌اندازی بازوی ویندوزی (Windows Edge Agent - Coucou Refactored):
اجرای دستور نصب و هندشیک امن با سرور مستر در خط فرمان PowerShell ویندوز:
```powershell
irm https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/agent/install-agent.ps1 | iex
```
یا بیلد مستقیم فایل نصبی (`.exe`) با استفاده از ابزار آماده مخزن:
```powershell
.\scripts\build-windows-agent.ps1 -Version "2.4.1"
```

---

## ✨ ویژگی‌ها و ارکان کلیدی پلتفرم

### ۱. رابط کاربری مینیمال نئونی (Minimalist Progressive UI)
* **پالت تیره عمیق (Deep Dark Zinc `#121214`):** حذف باکس‌های تودرتو (De-boxing) و بهره‌گیری از خطوط مرزی بسیار ظریف و جلوه‌های مات Glassmorphism.
* **هدر دوگانه مرکزی (State-Machine Header):** سوییچ نرم بین حالت **«گفتگو (Chat)»** (مکالمات متنی و RAG اسناد اداری) و حالت **«وظیفه (Autonomous Agent)»** (اجرای کدهای سیستمی، ترمینال و اسکریپت‌ها).
* **کنسول فرمان متمرکز شناور (Omni-Command Bar):** ورودی با تغییر ارتفاع خودکار (Auto-expand) و دکمه‌های قرصی‌شکل درون‌خطی برای انتخاب پروژه (Workspace)، ابزارهای افزونه (Extensions)، سطح توان پردازشی (Effort Level) و دروازه تاییدیه سه‌سطحی (Manual / Semi-Auto / Full Access).

### ۲. اتصال افزونه‌ها با استاندارد MCP و بانک مهارت‌ها
* **پروتکل رسمی MCP (Model Context Protocol):** تبادل ساخت‌یافته JSON-RPC با کانکتورهای محلی فایل‌سیستم (`mcp-fs`)، گیت‌هاب انترپرایز (`mcp-github`)، دیتابیس پستگرس (`mcp-postgres`) و کانتینرهای داکر (`mcp-docker`).
* **بانک مهارت‌های محلی (Skills Bank):** پرامپت‌های تخصصی و سیستم‌دستورهای ساب-ایجنت‌های مهندسی کش‌شده در دیتابیس SQLite.

### ۳. امنیت در عمق و اجرای ایزوله کدها (MicroVM / Docker Sandbox)
* عدم اجرای کدهای خطرناک یا اسکریپت‌های سیستمی روی روت سرور مستر.
* ارجاع لحظه‌ای وظایف به کانتینرهای موقت ایزوله داکر با محدودیت منابع و استریم زنده `stdout` و `stderr` با پروتکل Server-Sent Events (SSE).
* تولید خودکار پیش‌نمایش تفاوت خط‌به‌خط (Diff View) قبل از اعمال تغییرات در فایل‌ها.

### ۴. مدیریت هویت و دفاع سایبری چندلایه (RBAC & Cyber Defense)
* ادغام با اکتیو دایرکتوری (LDAPS) و نگاشت خودکار گروه‌ها به نقش‌های سیستم با پشتیبانی از Fallback به پایگاه‌داده محلی.
* ماتریس دسترسی ۴ لایه: **SuperAdmin**, **Admin**, **Operator**, **Viewer**.
* ثبت‌نام سلف‌سرویس کاربران جدید با تاییدیه ادمین (Self-Service Access Requests).
* سیستم دفاع سایبری در برابر حملات Brute-Force (قفل شدن خودکار IP پس از ۵ بار تلاش ناموفق ورود).

### ۵. بازوی اجرایی ویندوزی (Windows Edge Agent - Coucou Refactored)
* مهندسی معکوس و بازنویسی مخزن متن‌باز **Coucou** با فریم‌ورک **Tauri 2 + Rust + React**.
* تغییر Gateway جهت هدایت تمام استریم‌های LLM به سرور مستر (`/v1/chat`).
* ذخیره امن توکن‌ها در **Windows Credential Manager** از طریق باینری بومی Rust.
* پارسر فرامین اختصاصی `[WIN_AGENT:ACTION:دستور]` و گیت تاییدیه Zero-Trust Approval.
* استعلام خودکار نسخه در زمان راه‌اندازی (Startup Version Check) و اعلان آپدیت به کاربر.

### ۶. خط تولید بیلد CI/CD و دانلود مستقیم از داشبورد مستر
* کامپایل خودکار باینری‌های اجرایی ویندوز (`.exe` و `.zip`) توسط GitHub Actions (`build-windows-agent.yml`).
* امکان دانلود مستقیم بسته اجرایی از داشبورد وب مستر (`/api/v1/agent/download/windows-agent-binary`).
* تولید اسکریپت نصب تک‌کلیکه ویندوزی با آدرس سرور و توکن از پیش تزریق‌شده (`/api/v1/agent/download/windows-setup`).

---

## 📂 ساختار درختی پروژه (Repository Structure)

```
OmniOps-Enterprise-Manager/
├── .github/workflows/
│   ├── build-windows-agent.yml      # پایپ‌لاین CI/CD کامپایل و انتشار خودکار فایل باینری ویندوز
│   └── agent-build-release.yml      # انتشار بسته‌های فشرده ایجنت و افزونه کروم
├── agent/
│   ├── install-agent.ps1            # اسکریپت نصب و پیکربندی خودکار کلاینت ویندوز
│   ├── version-manifest.json        # متادیتای نسخه‌گذاری، چک‌سام و آدرس‌های توزیع
│   └── windows-edge-agent/          # سورس‌کد بومی‌سازی‌شده Coucou (Tauri 2 + Rust + React)
│       ├── package.json
│       ├── src/                     # فرانت‌اند، کاراکتر Mochi، پارسر و استریم
│       └── src-tauri/               # بک‌اند Rust، ماژول‌های Credential Manager و ترمینال
├── docs/
│   ├── ENTERPRISE_ARCHITECTURE_AND_ROADMAP.md # کتابچه مرجع صفر تا صد معماری و استقرار
│   ├── HANDBOOK.md                  # راهنمای ابزارهای عملیاتی
│   └── USER_MANUAL.md               # راهنمای کاربری پنل وب
├── modules/                         # بک‌اند ماژولار Flask Blueprints
│   ├── auth/                        # احراز هویت، RBAC، LDAPS و ریت‌لیمیت
│   ├── chat/                        # موتور مکالمه و اندپوینت‌های agent_routes.py
│   ├── cluster/                     # رجیستری و مانیتورینگ سلامت نودها
│   ├── mcp/                         # اتصالات JSON-RPC ابزارهای MCP
│   └── sandbox/                     # موتور اجرای ایزوله در MicroVM/داکر
├── public/downloads/                # مخزن توزیع مستقیم فایل‌های باینری ویندوز از سرور مستر
├── scripts/
│   ├── build-windows-agent.ps1      # اسکریپت بیلد محلی برای ویندوز
│   └── build-windows-agent.sh       # اسکریپت بیلد و آماده‌سازی پکیج‌ها برای لینوکس
├── src/                             # رابط کاربری وب مستر (React + Tailwind CSS)
│   ├── App.tsx                      # کامپوننت ریشه و کنترل رول‌های سازمانی
│   └── components/
│       ├── ChatModule.tsx           # کنسول مکالمه و وظایف خودمختار
│       ├── DesktopOverlayCompanion.tsx # سینی سیستم و بخش دانلود مستقیم باینری
│       └── MinimalistAiOsView.tsx   # رابط کاربری نئونی مدرن
├── install.sh                       # اینستالر تعاملی سرور مستر لینوکس
├── install-worker.sh                # اینستالر نود محاسباتی ورکر
├── run.py                           # نقطه ورود پایتون (Flask WSGI)
└── server.ts                        # نقطه ورود فول‌استک (Node.js Express + Vite)
```

---

## 🗺️ نقشه راه توسعه (Roadmap Highlights)

- [x] **فاز ۱:** جداسازی معماری Master و Worker و استقرار شبکه امن مش با WireGuard.
- [x] **فاز ۲:** بازطراحی پروژه Coucou و ایجاد بازوی اجرایی ویندوزی (Tauri 2 + Rust).
- [x] **فاز ۳:** استقرار پروتکل MCP با ترنسپورت‌های stdio و sse و بانک مهارت‌های بومی.
- [x] **فاز ۴:** احراز هویت LDAPS، ماتریس ۴ لایه RBAC، دفاع Brute-Force و ثبت‌نام سلف‌سرویس.
- [x] **فاز ۵:** خط تولید CI/CD، توزیع مستقیم باینری از مستر و سامانه پایش خودکار نسخه (Auto-Update).
- [ ] **فاز ۶ (در حال توسعه):** ارتباط صوتی بلادرنگ دوطرفه با WebRTC و ارکستراسیون خودکار Kubernetes.

---

## 🤝 مشارکت و پروانه نرم‌افزار (Contributing & License)

پروژه **OmniOps Enterprise Manager** تحت پروانه متن‌باز **MIT License** منتشر شده است. هرگونه مشارکت، ارسال Pull Request و گزارش باگ با آغوش باز پذیرفته می‌شود.

* برای مشاهده مستندات تکمیلی، مطالعه [کتابچه مرجع صفر تا صد معماری (ENTERPRISE_ARCHITECTURE_AND_ROADMAP.md)](docs/ENTERPRISE_ARCHITECTURE_AND_ROADMAP.md) پیشنهاد می‌شود.
* جهت گزارش آسیب‌پذیری‌های امنیتی، لطفاً مستقیماً با تیم معماری زیرساخت در ارتباط باشید.
