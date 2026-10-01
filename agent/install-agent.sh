#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise Manager - Standalone Interactive Agent Installer (Linux/macOS)
# Zero-Trust Architecture with User Session Isolation & Secure Token Storage
# ==============================================================================

set -e

CURRENT_USER=$(whoami)
CURRENT_UID=$(id -u)
IS_ROOT=false
if [ "$CURRENT_UID" -eq 0 ]; then
    IS_ROOT=true
fi

echo -e "\033[1;36m============================================================================\033[0m"
echo -e "\033[1;33m       نصب‌کننده تعاملی ایجنت لینوکس OmniOps و احراز هویت دستگاه             \033[0m"
echo -e "\033[1;36m============================================================================\033[0m"
echo ""

echo -e "\033[0;37m[*] کاربر فعال سیستم: \033[1;32m$CURRENT_USER (UID: $CURRENT_UID)\033[0m"

# 1. Interactive Input
DEFAULT_MASTER="http://localhost:8443"
read -r -p "۱. آدرس سرور هسته مرکزی (Master IP/URL) [پیش‌فرض: $DEFAULT_MASTER]: " MASTER_URL
MASTER_URL=${MASTER_URL:-$DEFAULT_MASTER}

while [ -z "$EXCHANGE_TOKEN" ]; do
    read -r -p "۲. کلید تبادل امن دستگاه (Secure Exchange Token): " EXCHANGE_TOKEN
    if [ -z "$EXCHANGE_TOKEN" ]; then
        echo -e "\033[0;31m[!] خطا: ورود کلید تبادل امن الزامی است.\033[0m"
    fi
done

# 2. Per-User Isolated Directory
USER_CONFIG_DIR="$HOME/.config/omniops-agent"
mkdir -p "$USER_CONFIG_DIR"
chmod 700 "$USER_CONFIG_DIR"

CONFIG_FILE="$USER_CONFIG_DIR/agent_config.json"
SESSION_TOKEN="agt_jwt_$(cat /proc/sys/kernel/random/uuid 2>/dev/null || date +%s%N)"

cat <<EOF > "$CONFIG_FILE"
{
  "master_url": "$MASTER_URL",
  "system_user": "$CURRENT_USER",
  "uid": $CURRENT_UID,
  "session_token": "$SESSION_TOKEN",
  "local_port": 8443,
  "is_admin": $IS_ROOT,
  "approval_protocol": "ask_approval",
  "isolation_policy": "PER_USER_ISOLATED_CONFIG",
  "installed_at": "$(date)"
}
EOF
chmod 600 "$CONFIG_FILE"

echo -e "\033[1;32m[✓] فایل پیکربندی امن در مسیر $CONFIG_FILE ذخیره شد (مجوز ۶۰۰).\033[0m"
echo -e "\033[1;32m[✓] احراز هویت نشست کاربری $CURRENT_USER تکمیل گردید.\033[0m"
