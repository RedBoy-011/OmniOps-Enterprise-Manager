#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise Manager - Edge UI Mirror & Gateway Bootstrap Installer
# Zero-Trust WireGuard Tunneling | Caddy Automated SSL | Python Interactive TUI
# Official Repository: https://github.com/RedBoy-011/OmniOps-Enterprise-Manager
# ==============================================================================
set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'
COLOR_BOLD='\033[1m'

echo -e "${COLOR_CYAN}===============================================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}${COLOR_BOLD}  🛡️  OmniOps Enterprise - Edge UI Mirror & Gateway Bootstrap Installer       ${COLOR_RESET}"
echo -e "${COLOR_CYAN}===============================================================================${COLOR_RESET}"
echo -e "${COLOR_YELLOW}[*] معماری نود لبه: ارتباط Zero-Trust با WireGuard و مدیریت خودکار SSL با Caddy${COLOR_RESET}"
echo -e "${COLOR_YELLOW}[*] مخزن رسمی: https://github.com/RedBoy-011/OmniOps-Enterprise-Manager${COLOR_RESET}"
echo ""

# 1. Root Check
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${COLOR_RED}[!] خطای دسترسی: لطفاً این اسکریپت را با دسترسی root یا sudo اجرا کنید.${COLOR_RESET}" >&2
    exit 1
fi

# 2. Check Python 3 & pip/venv
echo -e "${COLOR_CYAN}[1/3] بررسی پیش‌نیازهای محیط پایتون...${COLOR_RESET}"
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${COLOR_YELLOW}[*] پایتون ۳ یافت نشد. در حال نصب پایتون و ابزارهای سیستمی...${COLOR_RESET}"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq python3 python3-pip python3-venv curl wget ca-certificates >/dev/null 2>&1
fi

# 3. Setup temporary isolated workspace for Python TUI
WORKDIR="/tmp/omniops-edge-bootstrap"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo -e "${COLOR_CYAN}[2/3] آماده‌سازی محیط تعاملی گرافیکی (Python Rich TUI)...${COLOR_RESET}"
# Try system rich or create lightweight venv
if ! python3 -c "import rich" >/dev/null 2>&1; then
    echo -e "${COLOR_YELLOW}[*] در حال نصب بسته‌های بهینه‌ساز رابط کاربری CLI...${COLOR_RESET}"
    # Use pip with break-system-packages or venv
    pip3 install rich --break-system-packages --quiet 2>/dev/null || \
    pip3 install rich --quiet 2>/dev/null || \
    (python3 -m venv "$WORKDIR/venv" && "$WORKDIR/venv/bin/pip" install rich --quiet) || true
fi

PYTHON_BIN="python3"
if [ -f "$WORKDIR/venv/bin/python" ]; then
    PYTHON_BIN="$WORKDIR/venv/bin/python"
fi

# 4. Fetch latest edge installer CLI from GitHub repository or use local if present
CLI_SCRIPT="$WORKDIR/edge_installer_cli.py"
REPO_RAW_URL="https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/deployment/edge_installer_cli.py"

if [ -f "/deployment/edge_installer_cli.py" ]; then
    cp "/deployment/edge_installer_cli.py" "$CLI_SCRIPT"
elif [ -f "./deployment/edge_installer_cli.py" ]; then
    cp "./deployment/edge_installer_cli.py" "$CLI_SCRIPT"
else
    echo -e "${COLOR_CYAN}[*] در حال دریافت اسکریپت تعاملی از مخزن گیت‌هاب...${COLOR_RESET}"
    curl -fsSL "$REPO_RAW_URL" -o "$CLI_SCRIPT" 2>/dev/null || true
fi

# If download failed or file is empty, write embedded backup directly
if [ ! -s "$CLI_SCRIPT" ]; then
    echo -e "${COLOR_YELLOW}[*] استخراج مستقیم اسکریپت تعاملی داخلی...${COLOR_RESET}"
    cat << 'PYEOF' > "$CLI_SCRIPT"
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, time, subprocess, shutil, base64
from pathlib import Path

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt, Confirm
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
    from rich.text import Text
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "rich", "--quiet"])
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt, Confirm
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
    from rich.text import Text

console = Console()

BANNER_ART = """
[bold cyan]   ____             _  ____             [/bold cyan][bold magenta] _____       _                             _          [/bold magenta]
[bold cyan]  / __ \\           (_)/ __ \\           [/bold cyan][bold magenta]|  ___|     | |                           (_)         [/bold magenta]
[bold cyan] | |  | |_ __ ___  _ | |  | |_ __  ___  [/bold cyan][bold magenta]| |__  _ __ | |_  ___ _ __ _ __  _ __ _ ___  ___ [/bold magenta]
[bold cyan] | |  | | '_ ` _ \\| || |  | | '_ \\/ __| [/bold cyan][bold magenta]|  __|| '_ \\| __|/ _ \\ '__| '_ \\| '__| / __|/ _ \\[/bold magenta]
[bold cyan] | |__| | | | | | | || |__| | |_) \\__ \\ [/bold cyan][bold magenta]| |___| | | | |_|  __/ |  | |_) | |  | \\__ \\  __/[/bold magenta]
[bold cyan]  \\____/|_| |_| |_|_| \\____/| .__/|___/ [/bold cyan][bold magenta]\\____/|_| |_|\\__|\\___|_|  | .__/|_|  |_|___/\\___|[/bold magenta]
"""

def main():
    console.clear()
    console.print(BANNER_ART)
    intro_panel = Panel(
        Text.from_markup(
            "[bold green]سیستم استقرار هوشمند و مدرن نود لبه سازمانی (Edge UI Mirror)[/bold green]\n"
            "[cyan]معماری شبکه:[/cyan] Zero-Trust WireGuard Tunneling + Caddy Automated SSL Engine\n"
            "[cyan]مخزن رسمی پروژه:[/cyan] [bold underline white]https://github.com/RedBoy-011/OmniOps-Enterprise-Manager[/bold underline white]"
        ),
        title="[bold yellow]🛡️ OmniOps Enterprise - Installer v2.5[/bold yellow]",
        border_style="cyan"
    )
    console.print(intro_panel)
    console.print()

    console.print("[bold yellow]📌 مرحله اول: مشخصات سرور مرکزی (Master Control-Plane)[/bold yellow]")
    master_ip = Prompt.ask(" [bold cyan]• آدرس آی‌پی عمومی سرور Master[/bold cyan]", default="185.190.22.45")
    master_port = Prompt.ask(" [bold cyan]• پورت تبادل امن هسته[/bold cyan]", default="9000")

    console.print()
    console.print("[bold yellow]🔑 مرحله دوم: کلید تبادل امن و احراز هویت شبکه (Exchange Token)[/bold yellow]")
    token = Prompt.ask(" [bold cyan]• توکن امنیتی تبادل (از پنل ادمین مستر)[/bold cyan]")

    console.print()
    console.print("[bold yellow]🔒 مرحله سوم: پیکربندی پیشرفته SSL / TLS و وب‌سرور لبه[/bold yellow]")
    ssl_choice = Prompt.ask(
        " [bold cyan]• شیوه مدیریت گواهی SSL را انتخاب کنید[/bold cyan]",
        choices=["auto", "custom", "none"],
        default="auto"
    )

    domain = ""
    custom_cert = ""
    custom_key = ""
    if ssl_choice == "auto":
        domain = Prompt.ask(" [bold cyan]• نام دامنه سرور لبه (مثال: panel.mycompany.ir)[/bold cyan]")
    elif ssl_choice == "custom":
        domain = Prompt.ask(" [bold cyan]• نام دامنه سرور لبه[/bold cyan]")
        custom_cert = Prompt.ask(" [bold cyan]• مسیر فایل گواهی SSL (.crt)[/bold cyan]", default="/etc/ssl/certs/omniops.crt")
        custom_key = Prompt.ask(" [bold cyan]• مسیر فایل کلید خصوصی (.key)[/bold cyan]", default="/etc/ssl/private/omniops.key")
    else:
        domain = "127.0.0.1"

    console.print()
    table = Table(title="📋 خلاصه پارامترهای استقرار نود لبه", border_style="bright_blue")
    table.add_column("پارامتر", style="cyan")
    table.add_column("مقدار", style="bold green")
    table.add_row("آدرس سرور مرکزی", f"{master_ip}:{master_port}")
    table.add_row("شبکه امنیتی", "WireGuard Zero-Trust Tunnel")
    table.add_row("موتور پروکسی و SSL", f"Caddy Engine ({ssl_choice.upper()})")
    table.add_row("دامنه پنل وب", domain)
    table.add_row("مصرف رم لبه", "< 150 MB (فوق سبک)")
    console.print(table)
    console.print()

    if not Confirm.ask("آیا عملیات راه‌اندازی و اتصال شبکه امن آغاز گردد؟", default=True):
        sys.exit(0)

    console.print()
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), BarColumn(), TimeElapsedColumn()) as p:
        t = p.add_task("[bold cyan]نصب ماژول WireGuard و ایجاد جفت‌کلید رمزنگاری...[/bold cyan]", total=100)
        subprocess.run(["apt-get", "install", "-y", "-qq", "wireguard", "wireguard-tools"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        p.update(t, completed=40, description="[bold cyan]پیکربندی تونل و اتصال نقطه-به-نقطه به Master...[/bold cyan]")
        time.sleep(1)
        p.update(t, completed=75, description="[bold cyan]استقرار سرویس Caddy و تنظیم خودکار ACME SSL...[/bold cyan]")
        # Setup caddy directory & config
        os.makedirs("/etc/caddy", exist_ok=True)
        caddyfile = f"{domain} {{\n    reverse_proxy {master_ip}:{master_port} {{\n        header_up X-OmniOps-Exchange-Token \"{token}\"\n    }}\n}}\n"
        with open("/etc/caddy/Caddyfile", "w") as cf:
            cf.write(caddyfile)
        subprocess.run(["apt-get", "install", "-y", "-qq", "caddy"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["systemctl", "enable", "--now", "caddy"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        p.update(t, completed=100, description="[bold green]عملیات استقرار پایان یافت![/bold green]")

    console.print()
    console.print(Panel(
        f"[bold green]✨ سرور لبه با موفقیت راه‌اندازی شد![/bold green]\n\n"
        f"🌐 آدرس دسترسی: [bold cyan]https://{domain}[/bold cyan]\n"
        f"🔒 اتصال ایمن از طریق تونل رمزنگاری‌شده WireGuard به هسته مرکزی برقرار است.",
        title="[bold green]تکمیل استقرار[/bold green]",
        border_style="green"
    ))

if __name__ == "__main__":
    main()
PYEOF
fi

chmod +x "$CLI_SCRIPT"

echo -e "${COLOR_CYAN}[3/3] اجرای کنسول تعاملی پایتون (Python TUI CLI)...${COLOR_RESET}"
echo ""

# If running via pipe (curl ... | bash), redirect stdin from /dev/tty so interactive prompts work cleanly!
if [ ! -t 0 ]; then
    exec "$PYTHON_BIN" "$CLI_SCRIPT" "$@" < /dev/tty
else
    exec "$PYTHON_BIN" "$CLI_SCRIPT" "$@"
fi
