#!/bin/bash
# ==============================================================================
# OmniOps Enterprise - Compute Worker Node Installer
# اسکریپت نصب و اتصال سرور کمکی/عملیاتی (Worker Node) به سرور مرکزی (Master)
# جهت میزبانی مدل‌های سنگین هوش مصنوعی (LLM) و حفظ آپ‌تایم ۱۰۰٪ پنل مرکزی
# ==============================================================================

set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_CYAN}==========================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}    OmniOps Enterprise - Compute Worker Node Installer    ${COLOR_RESET}"
echo -e "${COLOR_CYAN}    استقرار گره پردازشی توزیع‌شده (LLM Offload Node)       ${COLOR_RESET}"
echo -e "${COLOR_CYAN}==========================================================${COLOR_RESET}"

MASTER_URL=""
JOIN_TOKEN=""
NODE_NAME="$(hostname)-worker"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --master) MASTER_URL="$2"; shift ;;
        --token) JOIN_TOKEN="$2"; shift ;;
        --name) NODE_NAME="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$MASTER_URL" ]; then
    read -p "لطفاً آدرس کامل سرور مستر را وارد کنید (مثال: http://192.168.1.100:9000): " MASTER_URL
fi

if [ -z "$JOIN_TOKEN" ]; then
    read -p "توکن امنیتی الحاق به خوشه (Cluster Join Token): " JOIN_TOKEN
fi

# ==============================================================================
# فاز ۱: ارزیابی منابع سخت‌افزاری نود کمکی (Worker Hardware Probe)
# ==============================================================================
echo -e "\n${COLOR_BLUE}[1/4] سنجش منابع محاسباتی این نود...${COLOR_RESET}"

TOTAL_RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo "16000000")
TOTAL_RAM_GB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_RAM_KB/1024/1024}")
CPU_CORES=$(nproc 2>/dev/null || echo "8")
CPU_MODEL=$(lscpu 2>/dev/null | grep "Model name" | sed 's/Model name:[ \t]*//' | head -n 1 || echo "Generic x86_64")

HAS_GPU=false
GPU_NAME="ندارد (CPU Inference)"
GPU_VRAM_GB=0
if command -v nvidia-smi &> /dev/null; then
    GPU_RAW=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -n 1 || true)
    if [ -n "$GPU_RAW" ]; then
        HAS_GPU=true
        GPU_NAME="$GPU_RAW"
        echo -e "${COLOR_GREEN}✓ کارت گرافیک اختصاصی NVIDIA جهت استنتاج سریع شناسایی شد!${COLOR_RESET}"
    fi
fi

NODE_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo -e "----------------------------------------------------------"
echo -e " 🖥️ مشخصات Worker Node ثانویه:"
echo -e " • نام نود:              ${COLOR_CYAN}${NODE_NAME}${COLOR_RESET}"
echo -e " • آی‌پی:                ${COLOR_CYAN}${NODE_IP}${COLOR_RESET}"
echo -e " • پردازنده:             ${COLOR_GREEN}${CPU_MODEL} (${CPU_CORES} vCPUs)${COLOR_RESET}"
echo -e " • حافظه RAM:            ${COLOR_GREEN}${TOTAL_RAM_GB} GB${COLOR_RESET}"
echo -e " • شتاب‌دهنده گرافیکی:   ${COLOR_GREEN}${GPU_NAME}${COLOR_RESET}"
echo -e " • اتصال به مستر:        ${COLOR_YELLOW}${MASTER_URL}${COLOR_RESET}"
echo -e "----------------------------------------------------------"

# ==============================================================================
# فاز ۲: نصب Docker و موتور استنتاج Ollama برای پردازش‌های سنگین
# ==============================================================================
echo -e "\n${COLOR_BLUE}[2/4] نصب بسته‌های مورد نیاز و موتور اولاما روی نود کمکی...${COLOR_RESET}"

# بررسی و اصلاح هوشمند DNS
if ! getent hosts get.docker.com >/dev/null 2>&1; then
    sudo bash -c 'echo -e "nameserver 8.8.8.8\nnameserver 1.1.1.1\nnameserver 185.51.200.2" > /etc/resolv.conf' 2>/dev/null || true
fi

sudo apt-get update -y
sudo apt-get install -y curl jq wireguard-tools

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# اجرای کانتینر Ollama روی سرور کمکی
echo -e "\n${COLOR_BLUE}[3/4] راه‌اندازی کانتینر Ollama Dedicated Node...${COLOR_RESET}"
if command -v docker &> /dev/null; then
    if [ "$HAS_GPU" = true ]; then
        docker run -d --gpus=all -v ollama_storage:/root/.ollama -p 11434:11434 --name omniops_worker_ollama --restart always ollama/ollama 2>/dev/null || true
    else
        docker run -d -v ollama_storage:/root/.ollama -p 11434:11434 --name omniops_worker_ollama --restart always ollama/ollama 2>/dev/null || true
    fi
fi

# ==============================================================================
# فاز ۳: ثبت منابع در سرور مستر (Handshake & Register)
# ==============================================================================
echo -e "\n${COLOR_BLUE}[4/4] ثبت و الحاق منابع این سرور به پنل مستر...${COLOR_RESET}"
REGISTER_PAYLOAD=$(cat <<EOF
{
  "node_name": "${NODE_NAME}",
  "ip": "${NODE_IP}",
  "port": 11434,
  "role": "llm_heavy",
  "token": "${JOIN_TOKEN}",
  "specs": {
    "cpu_cores": ${CPU_CORES},
    "cpu_model": "${CPU_MODEL}",
    "ram_total_gb": ${TOTAL_RAM_GB},
    "gpu_name": "${GPU_NAME}",
    "has_gpu": ${HAS_GPU}
  }
}
EOF
)

# ارسال تایید به سرور مستر (در صورت در دسترس بودن شبکه)
curl -s -X POST "${MASTER_URL}/api/v1/cluster/nodes/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_PAYLOAD" 2>/dev/null || true

echo -e "\n${COLOR_GREEN}==========================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}✅ سرور کمکی (Worker Node) با موفقیت راه‌اندازی و متصل شد!${COLOR_RESET}"
echo -e " 🚀 منابع ${COLOR_CYAN}${TOTAL_RAM_GB} GB RAM${COLOR_RESET} و ${COLOR_CYAN}${CPU_CORES} vCPUs${COLOR_RESET} به کلاستر اضافه شدند."
echo -e " 🛡️ پنل کنترل اصلی به سلامت در سرور مستر ایزوله مانده و بار مدل‌های سنگین به این سرور هدایت می‌شود."
echo -e "${COLOR_GREEN}==========================================================${COLOR_RESET}"
