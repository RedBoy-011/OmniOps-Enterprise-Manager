# OmniOps Windows Edge Agent (Coucou Refactored Edition)

این پروژه نسخه مهندسی معکوس و بومی‌سازی‌شده مخزن متن‌باز [Louis-CFM/coucou](https://github.com/Louis-CFM/coucou) است که با معماری **Tauri 2 + Rust + React/TypeScript** به عنوان بازوی اجرایی ویندوزی (Windows Edge Execution Arm) برای پلتفرم اختصاصی **OmniOps Enterprise Manager** بازطراحی شده است.

---

### ۳ تغییر حیاتی اعمال‌شده:

1. **تغییر هسته ارتباطی (API Gateway):**
   - حذف کامل اتصالات مستقیم به کلود (OpenAI/Anthropic).
   - هدایت تمام استریم‌های LLM و مکالمات به سرور متمرکز OmniOps (`/v1/chat`).
   - افزودن هدر `Authorization: Bearer <exchangeToken>` و متادیتای سیستم‌عامل کلاینت.

2. **سیستم احراز هویت اختصاصی (Custom Auth & Windows Credential Manager):**
   - حذف دریافت کلیدهای کلود در فرم تنظیمات (`SettingsModal.tsx`).
   - دریافت آدرس سرور مستر (`Master Server URL`) و کلید تبادل امن (`Exchange Token`).
   - ذخیره سخت‌گیرانه در حافظه امن سیستم‌عامل ویندوز (**Windows Credential Manager**) از طریق کتابخانه Rust (`keyring`).

3. **سازگاری با معماری فرمان و گیت تاییدیه Zero-Trust:**
   - پارسر پیشرفته برای استخراج تگ‌های ساخت‌یافته `[WIN_AGENT:ACTION:دستور]`.
   - پنهان‌سازی کدهای خام از دید کاربر در چت و فعال‌سازی دیالوگ تاییدیه (**Command Approval Gate**).
   - اجرای فرامین با پرچم `CREATE_NO_WINDOW` در خط فرمان ویندوز (`powershell.exe` / `cmd.exe`) توسط ماژول Rust.
   - ارسال بلادرنگ خروجی (`stdout` / `stderr` / `exit_code`) به اندپوینت تله‌متری سرور مستر (`/v1/agent/callback`).

---

### راهنمای بیلد و اجرا روی ویندوز (Windows 10/11)

#### پیش‌نیازها:
- Node.js 18 یا بالاتر
- Rust و Cargo (`rustup-init.exe`)
- ابزارهای C++ بیلد ویندوز (Visual Studio Build Tools)

#### ۱. نصب وابستگی‌ها:
```powershell
cd agent/windows-edge-agent
npm install
```

#### ۲. اجرای نسخه توسعه:
```powershell
npm run tauri dev
```

#### ۳. بیلد نسخه نهایی فایل نصبی (`.exe` و `.msi`):
```powershell
npm run tauri build
```
فایل اجرایی در مسیر زیر تولید خواهد شد:
`src-tauri/target/release/omniops-windows-edge-agent.exe`
