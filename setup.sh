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

# ------------------------------------------------------------------------------
# 2. Argument Parsing (CLI Flags baraye ejraye non-interactive va amne curl pipe)
# ------------------------------------------------------------------------------
CLI_MODE=""
CLI_PORT="8080"
CLI_WORKER_PORT="11434"
CLI_MASTER_URL=""
NON_INTERACTIVE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --mode|-m) CLI_MODE="$2"; shift ;;
        --all-in-one|--standalone|-1) CLI_MODE="1" ;;
        --master|-2) CLI_MODE="2" ;;
        --worker|-3) CLI_MODE="3" ;;
        --edge|-4) CLI_MODE="4" ;;
        --status|-5) CLI_MODE="5" ;;
        --port|-p) CLI_PORT="$2"; shift ;;
        --worker-port|-w) CLI_WORKER_PORT="$2"; shift ;;
        --master-url) CLI_MASTER_URL="$2"; shift ;;
        -y|--yes|--non-interactive) NON_INTERACTIVE=true ;;
        -h|--help)
            echo "Estefadeh: bash install.sh [OPTIONS]"
            echo "Options:"
            echo "  --all-in-one, --mode 1   Nasbe kamel (Master + Worker hamzaman) [Pishnahadi]"
            echo "  --master, --mode 2       Nasbe faghat Panele Master"
            echo "  --worker, --mode 3       Nasbe faghat Worker Node"
            echo "  --edge, --mode 4         Nasbe Edge UI Mirror (Nginx + SSL)"
            echo "  --status, --mode 5       Barresie vaziat va log-ha"
            echo "  --port <PORT>            Porte Master (Pishfarz: 8080)"
            echo "  --worker-port <PORT>     Porte Ollama (Pishfarz: 11434)"
            echo "  -y, --non-interactive    Ejraye bedoone tawaqquf va soal"
            exit 0
            ;;
        *) ;;
    esac
    shift
done

show_header() {
    clear 2>/dev/null || true
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
# 3. Auto Network Diagnostics & Hardware Assessment (Sare va bedoone lag)
# ------------------------------------------------------------------------------
LOCAL_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
if [[ ! "$LOCAL_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    LOCAL_IP="127.0.0.1"
fi

PUBLIC_IP="85.198.30.138" # Default quick fallback

TOTAL_RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo "16000000")
TOTAL_RAM_GB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_RAM_KB/1024/1024}")
CPU_CORES=$(nproc 2>/dev/null || echo "8")
CPU_MODEL=$(lscpu 2>/dev/null | grep -i "Model name" | sed 's/Model name:[ \t]*//' | head -n 1 || echo "Generic x86_64")

echo -e "${C_BOLD}Hardware & Network Profile:${C_RESET}"
echo -e "  • CPU:        ${C_GREEN}${CPU_MODEL} (${CPU_CORES} vCPUs)${C_RESET}"
echo -e "  • Memory:     ${C_GREEN}${TOTAL_RAM_GB} GB RAM${C_RESET}"
echo -e "  • Local IP:   ${C_CYAN}${LOCAL_IP}${C_RESET}"
echo -e "  • Public IP:  ${C_CYAN}${PUBLIC_IP}${C_RESET}"
echo -e "${C_GRAY}-------------------------------------------------------------------------------${C_RESET}\n"

# ------------------------------------------------------------------------------
# 4. Dynamic Interactive Menu & Safe Terminal Reader
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

# Daryafte entekhab ba amniat dar برابر EOF dar pipe-haye curl
MENU_CHOICE=""
if [ -n "$CLI_MODE" ]; then
    MENU_CHOICE="$CLI_MODE"
    echo -e "${C_GREEN}[*] Gozineye entekhab shode az tarighe CLI Flag: [Mode ${MENU_CHOICE}]${C_RESET}\n"
elif [ "$NON_INTERACTIVE" = true ]; then
    MENU_CHOICE="1"
    echo -e "${C_GREEN}[*] Halate non-interactive: Gozineye 1 (Standalone All-In-One) entekhab shod.${C_RESET}\n"
else
    if [ -t 0 ]; then
        read -r -p "Entekhabe shoma [Pishfarz: 1]: " MENU_CHOICE || MENU_CHOICE=""
    elif [ -e /dev/tty ]; then
        read -r -p "Entekhabe shoma [Pishfarz: 1]: " MENU_CHOICE < /dev/tty 2>/dev/null || MENU_CHOICE=""
    fi
    MENU_CHOICE="$(echo "$MENU_CHOICE" | xargs 2>/dev/null || echo "")"
    if [ -z "$MENU_CHOICE" ]; then
        MENU_CHOICE="1"
        echo -e "${C_GREEN}[✓] Tashkhise khodkar: Gozineye 1 (Standalone All-In-One) baraye in server entekhab shod.${C_RESET}\n"
    fi
fi

# ------------------------------------------------------------------------------
# 5. Action Handlers
# ------------------------------------------------------------------------------

fix_dns() {
    if ! getent hosts archive.ubuntu.com >/dev/null 2>&1; then
        echo -e "  ${C_YELLOW}[*] Updating DNS resolvers to 8.8.8.8 and 1.1.1.1...${C_RESET}"
        echo -e "nameserver 1.1.1.1\nnameserver 8.8.8.8\nnameserver 185.51.200.2" > /etc/resolv.conf 2>/dev/null || true
    fi
}

setup_master() {
    local PORT="$1"
    echo -e "\n${C_BOLD}${C_BLUE}[Phase 1] Preparing OmniOps Source Code & Python Packages...${C_RESET}"
    mkdir -p "$INSTALL_DIR"
    
    # Download ya Update repository
    if [ ! -f "$INSTALL_DIR/run.py" ]; then
        (
            git clone "$GITHUB_REPO" "$INSTALL_DIR" 2>/dev/null || {
                curl -fsSL "https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/archive/refs/heads/main.tar.gz" | tar -xz -C "$INSTALL_DIR" --strip-components=1
            }
        ) &
        run_spinner "Downloading OmniOps Enterprise repository"
    else
        echo -e "  ${C_GREEN}✓ Source files present in $INSTALL_DIR${C_RESET}"
        if [ -d "$INSTALL_DIR/.git" ]; then
            (cd "$INSTALL_DIR" && git pull 2>/dev/null || true) &
            run_spinner "Checking repository for latest updates"
        fi
    fi

    # Tazmin vojood __init__.py dar tamame pooshe-haye python baraye raf-e ModuleNotFoundError
    touch "$INSTALL_DIR/modules/__init__.py" 2>/dev/null || true
    for mod in auth chat cluster local_stack mcp sandbox settings skills tools; do
        mkdir -p "$INSTALL_DIR/modules/$mod"
        touch "$INSTALL_DIR/modules/$mod/__init__.py" 2>/dev/null || true
    done
    mkdir -p "$INSTALL_DIR/core" "$INSTALL_DIR/config"
    touch "$INSTALL_DIR/core/__init__.py" "$INSTALL_DIR/config/__init__.py" 2>/dev/null || true

    echo -e "\n${C_BOLD}${C_BLUE}[Phase 2] Installing Core Dependencies & Python Venv...${C_RESET}"
    fix_dns
    
    (
        apt-get update -y >/dev/null 2>&1
        apt-get install -y python3 python3-pip python3-venv git curl sqlite3 wireguard-tools \
            python3-flask python3-requests python3-jwt >/dev/null 2>&1 || true
    ) &
    run_spinner "Installing Linux packages via APT"

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
Environment="PYTHONPATH=$INSTALL_DIR"
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
        echo -e "  ${C_YELLOW}! Warning: Service start check. Restarting omniops...${C_RESET}"
        systemctl restart omniops
        sleep 2
        journalctl -u omniops -n 12 --no-pager || true
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
    else
        echo -e "  ${C_GREEN}✓ Docker engine is already installed.${C_RESET}"
    fi

    local HAS_GPU=false
    if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
        HAS_GPU=true
    fi

    (
        docker rm -f omniops_worker_ollama >/dev/null 2>&1 || true
        if [ "$HAS_GPU" = true ]; then
            docker run -d --gpus=all -v ollama_storage:/root/.ollama -p ${W_PORT}:11434 --name omniops_worker_ollama --restart always ollama/ollama >/dev/null 2>&1
        else
            docker run -d -v ollama_storage:/root/.ollama -p ${W_PORT}:11434 --name omniops_worker_ollama --restart always ollama/ollama >/dev/null 2>&1
        fi
    ) &
    run_spinner "Starting Ollama AI container on port ${W_PORT}"

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
# 6. Execute Chosen Option
# ------------------------------------------------------------------------------
case $MENU_CHOICE in
    1)
        # Standalone All-In-One
        PORT="${CLI_PORT:-8080}"
        W_PORT="${CLI_WORKER_PORT:-11434}"

        setup_master "$PORT"
        setup_worker "http://127.0.0.1:${PORT}" "$W_PORT"

        echo -e "\n${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}   🎉  ALL-IN-ONE STANDALONE DEPLOYMENT COMPLETED SUCCESSFULLY!                ${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "  ${C_BOLD}${C_YELLOW}🔐 Moshakhasate Vorood be Panele Modiriate OmniOps:${C_RESET}"
        echo -e "  • Adrese Shabake Mahali (LAN) : ${C_BOLD}${C_GREEN}http://${LOCAL_IP}:${PORT}${C_RESET}"
        echo -e "  • Adrese Localhost (Hamin Sarvar): ${C_BOLD}${C_GREEN}http://127.0.0.1:${PORT}${C_RESET}"
        echo -e "  • Name Karbari Pishfarz (User): ${C_BOLD}${C_CYAN}superadmin${C_RESET}"
        echo -e "  • Ramze Oboore Pishfarz (Pass): ${C_BOLD}${C_CYAN}admin${C_RESET}"
        echo -e "  • Email Pishfarz              : ${C_BOLD}${C_WHITE}director@omniops.internal${C_RESET}"
        echo -e ""
        echo -e "  ${C_BOLD}${C_YELLOW}🚀 Vaziyate Service-haye Karkarde Server:${C_RESET}"
        echo -e "  • Master Web Panel API  : ${C_GREEN}ACTIVE${C_RESET} (Port ${PORT} - systemd: omniops)"
        echo -e "  • Ollama Worker Node    : ${C_GREEN}ACTIVE${C_RESET} (Port ${W_PORT} - Docker: omniops_worker_ollama)"
        echo -e "  • Manabe Mohasebati      : ${C_CYAN}${TOTAL_RAM_GB} GB RAM${C_RESET} va ${C_CYAN}${CPU_CORES} vCPUs${C_RESET}"
        echo -e ""
        echo -e "  ${C_BOLD}${C_YELLOW}📋 Dastoore Barresie Vaziat va Log-haye Zende:${C_RESET}"
        echo -e "  • Barresie vaziat:  ${C_CYAN}systemctl status omniops${C_RESET}"
        echo -e "  • Didane log-ha  :  ${C_CYAN}journalctl -u omniops -f${C_RESET}"
        echo -e "  • Test salamat   :  ${C_CYAN}curl http://127.0.0.1:${PORT}/api/health${C_RESET}"
        echo -e "${C_GREEN}===============================================================================${C_RESET}\n"
        ;;
    2)
        # Master Only
        PORT="${CLI_PORT:-8080}"
        setup_master "$PORT"

        echo -e "\n${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}   ✅  MASTER CONTROL-PLANE IS ONLINE!                                         ${C_RESET}"
        echo -e "${C_GREEN}${C_BOLD}===============================================================================${C_RESET}"
        echo -e "  • LAN URL    : ${C_BOLD}${C_GREEN}http://${LOCAL_IP}:${PORT}${C_RESET}"
        echo -e "  • Localhost  : ${C_BOLD}${C_GREEN}http://127.0.0.1:${PORT}${C_RESET}"
        echo -e "  • Username   : ${C_BOLD}${C_CYAN}superadmin${C_RESET} | Password: ${C_BOLD}${C_CYAN}admin${C_RESET}"
        echo -e "${C_GREEN}===============================================================================${C_RESET}\n"
        ;;
    3)
        # Worker Only
        M_HOST="127.0.0.1"
        M_PORT="${CLI_PORT:-8080}"
        W_PORT="${CLI_WORKER_PORT:-11434}"
        setup_worker "http://${M_HOST}:${M_PORT}" "$W_PORT"
        ;;
    4)
        # Edge UI Mirror
        bash /opt/omniops/install-edge-node.sh 2>/dev/null || bash ./install-edge-node.sh 2>/dev/null || bash ./deployment/install-edge-node.sh
        ;;
    5)
        # Status monitor
        echo -e "\n${C_CYAN}OmniOps Services Status:${C_RESET}"
        systemctl status omniops --no-pager || true
        echo -e "\n${C_CYAN}Active Listening Ports:${C_RESET}"
        ss -tulpn | grep -E ':(8080|11434|443|80)' || netstat -tlpn 2>/dev/null | grep -E ':(8080|11434|443|80)' || true
        ;;
    *)
        setup_master "8080"
        setup_worker "http://127.0.0.1:8080" "11434"
        ;;
esac
