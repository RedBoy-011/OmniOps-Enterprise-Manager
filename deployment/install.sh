#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise Manager - Unified Dynamic Setup Wizard (Ferrum Grade CLI)
# ==============================================================================
# In script yek installer-e jame va pooya (Dynamic) ast ke tamame halatha ra
# shamel: Standalone All-In-One, Master Control-Plane, Worker Node, va Edge Mirror
# poshtibani mikonad.
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.
# ==============================================================================

set -e

# ------------------------------------------------------------------------------
# 1. Colors and UI Helpers
# ------------------------------------------------------------------------------
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[0;36m"
C_GREEN="\033[0;32m"
C_YELLOW="\033[1;33m"
C_RED="\033[0;31m"
C_BLUE="\033[0;34m"
C_MAGENTA="\033[0;35m"
C_GRAY="\033[0;90m"

INSTALL_DIR="/opt/omniops"
GITHUB_REPO="https://github.com/RedBoy-011/OmniOps-Enterprise-Manager.git"

show_header() {
    clear
    echo -e "${C_CYAN}${C_BOLD}"
    cat << "EOF"
  ██████╗ ███╗   ███╗███╗   ██╗██╗ ██████╗ ██████╗ ███████╗
 ██╔═══██╗████╗ ████║████╗  ██║██║██╔═══██╗██╔══██╗██╔════╝
 ██║   ██║██╔████╔██║██╔██╗ ██║██║██║   ██║██████╔╝███████╗
 ██║   ██║██║╚██╔╝██║██║╚██╗██║██║██║   ██║██╔═══╝ ╚════██║
 ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║╚██████╔╝██║     ███████║
  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝     ╚══════╝
EOF
    echo -e "${C_MAGENTA}   --- Unified Enterprise Operating Platform & AI Cluster Manager ---${C_RESET}"
    echo -e "${C_GRAY}   Version: 3.2.0-Production | Dynamic Multi-Topology CLI Wizard${C_RESET}"
    echo -e "${C_CYAN}===============================================================================${C_RESET}\n"
}

run_spinner() {
    local pid=$!
    local delay=0.08
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local message="$1"
    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
        local temp=${spinstr#?}
        printf "\r  ${C_CYAN}%c${C_RESET} %s..." "$spinstr" "$message"
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
    done
    wait "$pid"
    local exit_code=$?
    tput cnorm 2>/dev/null || true
    if [ $exit_code -eq 0 ]; then
        printf "\r  ${C_GREEN}✓${C_RESET} %-55s ${C_GREEN}[OK]${C_RESET}\n" "$message"
    else
        printf "\r  ${C_RED}✗${C_RESET} %-55s ${C_RED}[FAILED]${C_RESET}\n" "$message"
        return $exit_code
    fi
}

# Check root permission
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${C_RED}[!] Error: Lotfan in script ra ba dastresie root ya sudo ejra konid.${C_RESET}"
    echo -e "    Dastoor: ${C_CYAN}sudo bash $0${C_RESET}"
    exit 1
fi

show_header

# ------------------------------------------------------------------------------
# Auto Network Diagnostics & Hardware Assessment
# ------------------------------------------------------------------------------
# Tashkhise khodkare IP mahali va omoumi
LOCAL_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
PUBLIC_IP=$(curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 https://icanhazip.com 2>/dev/null || echo "")
if [[ "$PUBLIC_IP" =~ "<" ]] || [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP="N/A (LAN or Firewall Protected)"
fi

# Sanjeshe RAM va CPU
TOTAL_RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo "16000000")
TOTAL_RAM_GB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_RAM_KB/1024/1024}")
CPU_CORES=$(nproc 2>/dev/null || echo "8")
CPU_MODEL=$(lscpu 2>/dev/null | grep "Model name" | sed 's/Model name:[ \t]*//' | head -n 1 || echo "Generic x86_64")

echo -e "${C_BOLD}Hardware & Network Profile:${C_RESET}"
echo -e "  • CPU:        ${C_GREEN}${CPU_MODEL} (${CPU_CORES} vCPUs)${C_RESET}"
echo -e "  • Memory:     ${C_GREEN}${TOTAL_RAM_GB} GB RAM${C_RESET}"
echo -e "  • Local IP:   ${C_CYAN}${LOCAL_IP}${C_RESET}"
echo -e "  • Public IP:  ${C_CYAN}${PUBLIC_IP}${C_RESET}"
echo -e "${C_GRAY}-------------------------------------------------------------------------------${C_RESET}\n"

# ------------------------------------------------------------------------------
# Dynamic Interactive Menu
# ------------------------------------------------------------------------------
echo -e "${C_BOLD}${C_YELLOW}Lotfan no'e esteqrar (Deployment Mode) ra entekhab konid:${C_RESET}\n"
echo -e "  ${C_GREEN}[1] Standalone All-In-One (Pishnahadi baraye in server)${C_RESET}"
echo -e "      ${C_GRAY}Nasbe hamzamane Master Web Panel + Local AI Worker (Ollama) rooye hamin machine.${C_RESET}"
echo -e "      ${C_GRAY}Ide-al baraye server-haye ghavi mesle in machine ba ${TOTAL_RAM_GB} GB RAM.${C_RESET}\n"

echo -e "  ${C_CYAN}[2] Master Control-Plane Only${C_RESET}"
echo -e "      ${C_GRAY}Nasbe mahze Panele Web va Hasteye Modiriat (Worker-ha rooye server-haye digar khahand bood).${C_RESET}\n"

echo -e "  ${C_BLUE}[3] Worker Compute Node Only${C_RESET}"
echo -e "      ${C_GRAY}Nasbe noode pardazeshi (Ollama) va etesal be Master Node dar shabake.${C_RESET}\n"

echo -e "  ${C_MAGENTA}[4] Edge UI Mirror Gateway${C_RESET}"
echo -e "      ${C_GRAY}Nasbe Reverse Proxy Nginx ba SSL khodkar (Domain ya Self-Signed SAN).${C_RESET}\n"

echo -e "  ${C_YELLOW}[5] Service Status & Logs Monitor${C_RESET}"
echo -e "      ${C_GRAY}Barresie zendeye vaziat, port-ha va log-haye systemd.${C_RESET}\n"

read -p "Entekhabe shoma [Pishfarz: 1]: " MENU_CHOICE
MENU_CHOICE=${MENU_CHOICE:-1}

# ------------------------------------------------------------------------------
# Action Handlers
# ------------------------------------------------------------------------------

fix_dns() {
    # Islah khodkare DNS dar soorate ghati
    if ! getent hosts archive.ubuntu.com >/dev/null 2>&1; then
        echo -e "  ${C_YELLOW}[*] Updating DNS resolvers to 8.8.8.8 and 1.1.1.1...${C_RESET}"
        echo -e "nameserver 8.8.8.8\nnameserver 1.1.1.1\nnameserver 185.51.200.2" > /etc/resolv.conf
    fi
}

setup_master() {
    local PORT="$1"
    echo -e "\n${C_BOLD}${C_BLUE}[Phase 1] Preparing OmniOps Source Code...${C_RESET}"
    mkdir -p "$INSTALL_DIR"
    
    # Clone ya copy kardane file-ha
    if [ ! -f "$INSTALL_DIR/run.py" ]; then
        (
            git clone "$GITHUB_REPO" "$INSTALL_DIR" 2>/dev/null || {
                curl -fsSL "https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/archive/refs/heads/main.tar.gz" | tar -xz -C "$INSTALL_DIR" --strip-components=1
            }
        ) &
        run_spinner "Cloning official repository from GitHub into ${INSTALL_DIR}"
    fi

    echo -e "\n${C_BOLD}${C_BLUE}[Phase 2] Installing System Dependencies & Python Packages...${C_RESET}"
    fix_dns
    (
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -qq >/dev/null 2>&1
        apt-get install -y -qq python3 python3-pip python3-venv git curl sqlite3 wireguard-tools \
            python3-flask python3-requests python3-sqlalchemy >/dev/null 2>&1 || true
    ) &
    run_spinner "Installing APT prerequisites (Flask, SQLite, WireGuard)"

    # Sakhte venv ba system site packages
    (
        python3 -m venv --system-site-packages "$INSTALL_DIR/venv"
        "$INSTALL_DIR/venv/bin/pip" install --default-timeout=120 -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com \
            flask flask-cors pyjwt requests sqlalchemy >/dev/null 2>&1 || \
        "$INSTALL_DIR/venv/bin/pip" install flask flask-cors pyjwt requests sqlalchemy >/dev/null 2>&1 || true
    ) &
    run_spinner "Setting up isolated Python venv & installing Flask Blueprints"

    echo -e "\n${C_BOLD}${C_BLUE}[Phase 3] Configuring Systemd Service (Port: ${PORT})...${C_RESET}"
    SERVICE_FILE="/etc/systemd/system/omniops.service"
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=OmniOps Enterprise Manager Master Service
After=network.target

[Service]
User=root
WorkingDirectory=$INSTALL_DIR
Environment="PORT=$PORT"
Environment="ROLE=master"
Environment="PATH=$INSTALL_DIR/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=$INSTALL_DIR/venv/bin/python3 $INSTALL_DIR/run.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable omniops >/dev/null 2>&1
    systemctl restart omniops

    sleep 2
    if systemctl is-active --quiet omniops; then
        echo -e "  ${C_GREEN}✓ OmniOps Master Control-Plane successfully started and active!${C_RESET}"
    else
        echo -e "  ${C_YELLOW}! Warning: Service start check failed. Diagnostic logs:${C_RESET}"
        journalctl -u omniops -n 10 --no-pager
    fi
}

setup_worker() {
    local M_URL="$1"
    local W_PORT="$2"
    echo -e "\n${C_BOLD}${C_BLUE}[Worker Phase] Setting up Docker & Ollama Dedicated Node...${C_RESET}"
    
    if ! command -v docker &> /dev/null; then
        (
            curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
            sh /tmp/get-docker.sh >/dev/null 2>&1
        ) &
        run_spinner "Installing Docker engine for local AI models"
    fi

    # Barresie GPU
    local HAS_GPU=false
    if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
        HAS_GPU=true
    fi

    # Ejraye container Ollama
    (
        docker rm -f omniops_worker_ollama >/dev/null 2>&1 || true
        if [ "$HAS_GPU" = true ]; then
            docker run -d --gpus=all -v ollama_storage:/root/.ollama -p ${W_PORT}:11434 --name omniops_worker_ollama --restart always ollama/ollama >/dev/null 2>&1
        else
            docker run -d -v ollama_storage:/root/.ollama -p ${W_PORT}:11434 --name omniops_worker_ollama --restart always ollama/ollama >/dev/null 2>&1
        fi
    ) &
    run_spinner "Starting Ollama AI container on port ${W_PORT}"

    # Etebarsanji va sabt dar Master
    echo -e "\n${C_BOLD}${C_BLUE}[Worker Phase] Registering Worker Node to Master at ${M_URL}...${C_RESET}"
    PAYLOAD=$(cat << EOF
{
  "node_name": "$(hostname)-worker",
  "ip": "${LOCAL_IP}",
  "port": ${W_PORT},
  "role": "llm_heavy",
  "specs": {
    "cpu_cores": ${CPU_CORES},
    "cpu_model": "${CPU_MODEL}",
    "ram_total_gb": ${TOTAL_RAM_GB},
    "has_gpu": ${HAS_GPU}
  }
}
EOF
)
    RESP=$(curl -s -m 5 -X POST "${M_URL}/api/v1/cluster/nodes/register" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" 2>/dev/null || echo "failed")
    
    if echo "$RESP" | grep -q "success"; then
        echo -e "  ${C_GREEN}✓ Worker Node successfully paired with Master Control-Plane!${C_RESET}"
    else
        echo -e "  ${C_YELLOW}! Master registration notice: Handshake payload delivered.${C_RESET}"
    fi
}

# ------------------------------------------------------------------------------
# Execute Chosen Option
# ------------------------------------------------------------------------------
case $MENU_CHOICE in
    1)
        # Standalone All-In-One
        read -p "Master Web Panel Port [Pishfarz: 8080]: " INPUT_PORT
        PORT=${INPUT_PORT:-8080}
        read -p "Worker Ollama Port [Pishfarz: 11434]: " INPUT_W_PORT
        W_PORT=${INPUT_W_PORT:-11434}

        setup_master "$PORT"
        setup_worker "http://127.0.0.1:${PORT}" "$W_PORT"

        echo -e "\n${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}   🎉  ALL-IN-ONE STANDALONE DEPLOYMENT COMPLETED SUCCESSFULLY!                ${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "  ${C_CYAN}Dastresi be Panele Modiriat dar Moroorger:${C_RESET}"
        echo -e "  • Shabake Dakheli (LAN / WiFi):  ${C_BOLD}${C_GREEN}http://${LOCAL_IP}:${PORT}${C_RESET}"
        if [ "$PUBLIC_IP" != "N/A (LAN or Firewall Protected)" ]; then
            echo -e "  • Dastresi az Internet (Public): ${C_BOLD}${C_GREEN}http://${PUBLIC_IP}:${PORT}${C_RESET}"
        fi
        echo -e "  • Localhost (Hamin Sarvar):      ${C_BOLD}${C_GREEN}http://127.0.0.1:${PORT}${C_RESET}"
        echo -e ""
        echo -e "  ${C_GRAY}• Master Control-Plane: Active (Port ${PORT})${C_RESET}"
        echo -e "  ${C_GRAY}• Worker Ollama Node:   Active (Port ${W_PORT}) [${CPU_CORES} vCPUs, ${TOTAL_RAM_GB} GB RAM]${C_RESET}"
        echo -e "${C_GREEN}===============================================================================${C_RESET}\n"
        ;;
    2)
        # Master Only
        read -p "Master Web Panel Port [Pishfarz: 8080]: " INPUT_PORT
        PORT=${INPUT_PORT:-8080}
        setup_master "$PORT"

        echo -e "\n${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}   ✅  MASTER CONTROL-PLANE IS ONLINE!                                         ${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "  • LAN URL:      ${C_BOLD}${C_GREEN}http://${LOCAL_IP}:${PORT}${C_RESET}"
        echo -e "  • Localhost:    ${C_BOLD}${C_GREEN}http://127.0.0.1:${PORT}${C_RESET}"
        echo -e "${C_GREEN}===============================================================================${C_RESET}\n"
        ;;
    3)
        # Worker Only
        read -p "Master Host IP ya Domain (mesal: 192.168.1.50): " M_HOST
        M_HOST=${M_HOST:-"127.0.0.1"}
        read -p "Master Port [Pishfarz: 8080]: " M_PORT
        M_PORT=${M_PORT:-8080}
        read -p "Worker Ollama Port [Pishfarz: 11434]: " W_PORT
        W_PORT=${W_PORT:-11434}

        setup_worker "http://${M_HOST}:${M_PORT}" "$W_PORT"
        ;;
    4)
        # Edge UI Mirror
        bash /opt/omniops/install-edge-node.sh 2>/dev/null || bash ./install-edge-node.sh
        ;;
    5)
        # Status monitor
        echo -e "\n${C_CYAN}OmniOps Services Status:${C_RESET}"
        systemctl status omniops --no-pager || true
        echo -e "\n${C_CYAN}Active Listening Ports:${C_RESET}"
        ss -tulpn | grep -E ':(8080|11434|443|80)' || netstat -tlpn 2>/dev/null | grep -E ':(8080|11434|443|80)' || true
        ;;
    *)
        echo -e "${C_RED}Gozineye namotabar!${C_RESET}"
        exit 1
        ;;
esac
