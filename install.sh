#!/bin/bash
# ==============================================================================
# OmniOps Enterprise Manager - Ubuntu Automated Installer (Master Control-Plane)
# سیستم ارزیابی خودکار منابع سرور و استقرار هسته مدیریت توزیع‌شده
# ==============================================================================

set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_CYAN}==========================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}    OmniOps Enterprise - Ubuntu Master Node Installer     ${COLOR_RESET}"
echo -e "${COLOR_CYAN}    معماری توزیع‌شده: پنل کنترل مرکزی (Control-Plane)      ${COLOR_RESET}"
echo -e "${COLOR_CYAN}==========================================================${COLOR_RESET}"

# ==============================================================================
# فاز ۱: ممیزی و ارزیابی هوشمند منابع سخت‌افزاری سرور (Hardware Assessment)
# ==============================================================================
echo -e "\n${COLOR_BLUE}[1/5] در حال ارزیابی مشخصات سخت‌افزاری سرور...${COLOR_RESET}"

# سنجش RAM به گیگابایت
TOTAL_RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo "8000000")
TOTAL_RAM_GB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_RAM_KB/1024/1024}")
FREE_RAM_KB=$(awk '/MemAvailable/ {print $2}' /proc/meminfo 2>/dev/null || echo "4000000")
FREE_RAM_GB=$(awk "BEGIN {printf \"%.1f\", $FREE_RAM_KB/1024/1024}")

# سنجش هسته‌های پردازشی CPU
CPU_CORES=$(nproc 2>/dev/null || echo "4")
CPU_MODEL=$(lscpu 2>/dev/null | grep "Model name" | sed 's/Model name:[ \t]*//' | head -n 1 || echo "Generic x86_64")

# سنجش فضای دیسک
DISK_FREE_GB=$(df -BG / 2>/dev/null | awk 'NR==2 {print $4}' | tr -d 'G' || echo "50")

# بررسی کارت گرافیک اختصاصی NVIDIA
HAS_GPU=false
GPU_NAME="یافت نشد (CPU Only)"
if command -v nvidia-smi &> /dev/null; then
    GPU_RAW=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -n 1 || true)
    if [ -n "$GPU_RAW" ]; then
        HAS_GPU=true
        GPU_NAME="$GPU_RAW"
    fi
fi

echo -e "----------------------------------------------------------"
echo -e " 📊 گزارش منابع شناسایی‌شده سرور:"
echo -e " • مدل پردازنده (CPU):    ${COLOR_GREEN}${CPU_MODEL} (${CPU_CORES} vCPUs)${COLOR_RESET}"
echo -e " • حافظه موقت (RAM):      ${COLOR_GREEN}${TOTAL_RAM_GB} GB${COLOR_RESET} (آزاد: ${FREE_RAM_GB} GB)"
echo -e " • کارت گرافیک (GPU):     ${COLOR_GREEN}${GPU_NAME}${COLOR_RESET}"
echo -e " • فضای آزاد دیسک:        ${COLOR_GREEN}${DISK_FREE_GB} GB${COLOR_RESET}"
echo -e "----------------------------------------------------------"

# ==============================================================================
# تحلیل هوشمند و راهنمای ارتقا (Intelligent Upgrade & Architecture Advisor)
# ==============================================================================
echo -e "\n${COLOR_YELLOW}💡 تحلیل هوشمند معمار سیستم و راهنمای ارتقا (Architect Advisor):${COLOR_RESET}"

RAM_INT=$(echo "$TOTAL_RAM_GB" | cut -d. -f1)

if [ "$RAM_INT" -lt 8 ]; then
    echo -e "${COLOR_RED}⚠️  هشدار RAM محدود (${TOTAL_RAM_GB} GB):${COLOR_RESET}"
    echo -e "   حجم رم سرور برای اجرای همزمان پنل وب و مدل‌های هوش محلی کم است."
    echo -e "   👈 توصیه معماری: این سرور را منحصراً به عنوان ${COLOR_GREEN}Master Control-Plane سبک${COLOR_RESET} استفاده کنید"
    echo -e "      و پردازش‌های سنگین LLM را به یک ${COLOR_CYAN}Worker Node کمکی${COLOR_RESET} بسپارید تا پنل هرگز Down نشود."
    echo -e "   👈 پیشنهاد ارتقا: افزایش RAM به حداقل ۱۶ یا ۳۲ گیگابایت برای استنتاج محلی روان."
elif [ "$RAM_INT" -lt 16 ]; then
    echo -e "${COLOR_YELLOW}⚡ سطح منابع متوسط (${TOTAL_RAM_GB} GB):${COLOR_RESET}"
    echo -e "   مناسب برای اجرای پنل مرکزی و مدل‌های سبک ۸ بیتی (مثل Dorna2-8B یا Llama3-8B)."
    echo -e "   👈 پیشنهاد ارتقا: جهت پاسخ‌دهی بدون تاخیر در ساعات پیک، پیشنهاد می‌شود یک Worker Node ثانویه به کلاستر متصل کنید."
else
    echo -e "${COLOR_GREEN}🚀 سطح منابع عالی (${TOTAL_RAM_GB} GB RAM / ${CPU_CORES} Cores):${COLOR_RESET}"
    echo -e "   ظرفیت سرور برای میزبانی پنل و سرویس‌های محلی بسیار مطلوب است."
fi

if [ "$HAS_GPU" = false ]; then
    echo -e "${COLOR_YELLOW}💡 وضعیت شتاب‌دهنده گرافیکی (GPU):${COLOR_RESET}"
    echo -e "   کارت گرافیک NVIDIA در این سرور یافت نشد؛ استنتاج روی CPU انجام خواهد شد."
    echo -e "   👈 راهکار بهینه: با دستور ${COLOR_CYAN}install-worker.sh${COLOR_RESET} روی سرور دوم (دارای کارت گرافیک)،"
    echo -e "      آن را در قالب Worker Node به این پنل متصل کنید تا بار استنتاج به سرور دوم هدایت شود."
fi

if [ "$DISK_FREE_GB" -lt 30 ]; then
    echo -e "${COLOR_RED}⚠️  هشدار فضای دیسک: تنها ${DISK_FREE_GB} GB فضای آزاد موجود است.${COLOR_RESET}"
    echo -e "   وزن هر مدل هوش مصنوعی بین ۴ تا ۲۰ گیگابایت است. حداقل ۵۰ گیگابایت فضای خالی توصیه می‌شود."
fi

echo -e "\n----------------------------------------------------------"
read -p "آیا مایل به ادامه نصب پنل مرکزی روی این سرور هستید؟ (Y/n): " CONFIRM_INSTALL
CONFIRM_INSTALL=${CONFIRM_INSTALL:-Y}
if [[ "$CONFIRM_INSTALL" =~ ^[Nn]$ ]]; then
    echo -e "${COLOR_YELLOW}نصب توسط کاربر متوقف شد.${COLOR_RESET}"
    exit 0
fi

# ==============================================================================
# فاز ۲: پیکربندی پورت و وابستگی‌ها
# ==============================================================================
read -p "لطفاً پورت اجرای سرویس را وارد کنید [پیش‌فرض 8080]: " USER_PORT
PORT=${USER_PORT:-8080}
echo -e "${COLOR_GREEN}[*] پورت انتخاب شده: $PORT${COLOR_RESET}"

echo -e "\n${COLOR_BLUE}[2/5] در حال به‌روزرسانی مخازن سیستم و نصب پیش‌نیازها...${COLOR_RESET}"
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv git curl sqlite3 wireguard-tools

# نصب اختیاری داکر در صورت عدم وجود برای Dify و n8n و Ollama
if ! command -v docker &> /dev/null; then
    echo -e "${COLOR_BLUE}[3/5] نصب Docker جهت پشتیبانی از ابزارهای لوکال (Ollama, Dify, n8n)...${COLOR_RESET}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

echo -e "\n${COLOR_BLUE}[4/5] ساخت محیط مجازی پایتون و نصب وابستگی‌ها...${COLOR_RESET}"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask flask-cors pyjwt requests sqlalchemy

echo -e "\n${COLOR_BLUE}[5/5] ایجاد سرویس systemd جهت اجرای مداوم در بک‌گراند...${COLOR_RESET}"
SERVICE_FILE="/etc/systemd/system/omniops.service"
sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=OmniOps Enterprise Manager Master Service
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
Environment="PORT=$PORT"
Environment="ROLE=master"
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/python3 run.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable omniops
sudo systemctl start omniops

SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo -e "\n${COLOR_GREEN}==========================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}✅ نصب پنل مرکزی (Master Node) با موفقیت انجام شد!${COLOR_RESET}"
echo -e "🌐 آدرس دسترسی به پنل ادمین: ${COLOR_CYAN}http://${SERVER_IP}:${PORT}${COLOR_RESET}"
echo -e "⚙️ وضعیت سرویس: ${COLOR_YELLOW}sudo systemctl status omniops${COLOR_RESET}"
echo -e ""
echo -e "🔗 ${COLOR_YELLOW}نحوه اتصال سرورهای دوم و سوم (Worker Nodes) برای توزیع بار سنگین:${COLOR_RESET}"
echo -e "   روی هر سرور عملیاتی دوم، دستور زیر را اجرا کنید:"
echo -e "   ${COLOR_CYAN}curl -fsSL https://raw.githubusercontent.com/RedBoy-011/OmniOps-Enterprise-Manager/main/deployment/install-worker.sh | bash -s -- --master http://${SERVER_IP}:${PORT}${COLOR_RESET}"
echo -e "${COLOR_GREEN}==========================================================${COLOR_RESET}"

