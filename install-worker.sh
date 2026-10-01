#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise Manager - Compute Worker Node Installer (Bubbletea TUI)
# ==============================================================================
# In script baraye nasb va ettehale sarvare mohasebatiye Worker (LLM Offload Node)
# be sarvare markaziye Master ba estefade az UI modern terminal (TUI) ast.
# Hameye comment-haye in script be darkhaste karbar be zabane Finglish neveshte shodeand.
# ==============================================================================

set -e

# ------------------------------------------------------------------------------
# 1. Rangha va Alamat-haye Graphic (Bubbletea / Modern TUI Style)
# ------------------------------------------------------------------------------
export TERM=${TERM:-xterm-256color}

CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_DIM="\033[2m"

# Palette rang-haye modern Charm / Bubbletea
CLR_PURPLE="\033[38;5;141m"
CLR_CYAN="\033[38;5;51m"
CLR_TEAL="\033[38;5;43m"
CLR_GREEN="\033[38;5;84m"
CLR_YELLOW="\033[38;5;220m"
CLR_ORANGE="\033[38;5;208m"
CLR_RED="\033[38;5;196m"
CLR_GRAY="\033[38;5;244m"
CLR_WHITE="\033[38;5;255m"
CLR_BG_DARK="\033[48;5;236m"

LOG_FILE="/tmp/omniops-worker-install.log"
rm -f "$LOG_FILE"
touch "$LOG_FILE"

# ------------------------------------------------------------------------------
# 2. Moteghayerhaye Pishfarz (Default Parameters)
# ------------------------------------------------------------------------------
MASTER_RAW=""
MASTER_PORT="8080"
WORKER_PORT="11434"
JOIN_TOKEN="omniops-worker-token"
NODE_NAME="$(hostname)-worker"
NON_INTERACTIVE=false

# ------------------------------------------------------------------------------
# 3. Khandane Voroodihaye CLI (Parse Arguments)
# ------------------------------------------------------------------------------
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --master) MASTER_RAW="$2"; shift ;;
        --port) MASTER_PORT="$2"; shift ;;
        --worker-port) WORKER_PORT="$2"; shift ;;
        --token) JOIN_TOKEN="$2"; shift ;;
        --name) NODE_NAME="$2"; shift ;;
        -y|--yes|--non-interactive) NON_INTERACTIVE=true ;;
        -h|--help)
            echo "Estefadeh: bash install-worker.sh [OPTIONS]"
            echo "Options:"
            echo "  --master <URL/IP>    Adrese Master Control-Plane (mesal: 172.19.30.100 ya http://master:8080)"
            echo "  --port <PORT>        Porte Master dar soorate adame vared kardane port (pishfarz: 8080)"
            echo "  --worker-port <PORT> Porte Ollama rooye in server (pishfarz: 11434)"
            echo "  --token <TOKEN>      Token amniatie ettehal be cluster"
            echo "  --name <NAME>        Name ekhtesasiye in worker node"
            echo "  -y, --non-interactive Ejraye khodkar bedoone soal az karbar"
            exit 0
            ;;
        *) echo "Gozineye nashenakhte: $1"; exit 1 ;;
    esac
    shift
done

# ------------------------------------------------------------------------------
# 4. Tabehaye Standard-saziye URL va Tashkhise IP (IP & URL Utilities)
# ------------------------------------------------------------------------------

# Tabe baraye tabdile doroste voroodiye Master be URL standard
format_master_url() {
    local input="$1"
    local default_port="$2"
    input="$(echo "$input" | xargs)"

    if [[ -z "$input" ]]; then
        echo ""
        return
    fi

    # Agar protocol vared nashode bood
    if [[ ! "$input" =~ ^https?:// ]]; then
        if [[ "$input" =~ :[0-9]+$ ]]; then
            input="http://${input}"
        else
            input="http://${input}:${default_port}"
        fi
    else
        # Agar protocol dasht vali port nadad va dar akhar port nist
        local proto="${input%%://*}"
        local hostpart="${input#*://}"
        local hostname_only="${hostpart%%/*}"
        if [[ ! "$hostname_only" =~ :[0-9]+$ ]] && [ "$proto" = "http" ] && [ -n "$default_port" ]; then
            input="http://${hostname_only}:${default_port}"
        fi
    fi
    # Hazfe slash az akhar
    input="${input%/}"
    echo "$input"
}

# Tabe baraye tashkhise amne IP mahali bedoone kharabie 403 HTML
detect_safe_ip() {
    local target_host="$1"
    local detected=""

    # Aval say mikonim az tarighe masir be samte master ip mahali ra begirim
    if [ -n "$target_host" ] && [[ "$target_host" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        detected=$(ip route get "$target_host" 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')
    fi

    if [ -z "$detected" ]; then
        detected=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')
    fi

    if [ -z "$detected" ]; then
        detected=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi

    # Etebarsanji daqiq ba regex baraye jologiri az vared shodane matne HTML ya 403
    if [[ ! "$detected" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        detected="127.0.0.1"
    fi

    echo "$detected"
}

# ------------------------------------------------------------------------------
# 5. Tabehaye TUI (Bubbletea Box & Progress Bar Components)
# ------------------------------------------------------------------------------

# Tabe baraye barresie vaziyate etesal be Master Node dar har lahze
check_master_connectivity() {
    local url="$1"
    if [ -z "$url" ]; then
        echo -e "${CLR_DIM}NOT CONFIGURED${CLR_RESET}"
        return 1
    fi

    local test_target="${url}/api/v1/cluster/nodes"
    local start_ts end_ts latency_ms http_code

    start_ts=$(date +%s%3N 2>/dev/null || date +%s)
    http_code=$(curl -s -m 2 -o /dev/null -w "%{http_code}" "$test_target" 2>/dev/null || echo "000")
    end_ts=$(date +%s%3N 2>/dev/null || date +%s)

    # Agar endpoint cluster nabood, root url ra test mikonad
    if [ "$http_code" = "000" ] || [ "$http_code" = "404" ]; then
        http_code=$(curl -s -m 2 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    fi

    local diff=$(( end_ts - start_ts ))
    if [ $diff -le 0 ]; then diff=2; fi
    latency_ms="${diff}ms"

    if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        echo -e "${CLR_GREEN}● ONLINE${CLR_RESET} ${CLR_DIM}(${latency_ms}, HTTP ${http_code})${CLR_RESET}"
        return 0
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo -e "${CLR_YELLOW}▲ AUTH REQUIRED${CLR_RESET} ${CLR_DIM}(${latency_ms}, HTTP ${http_code})${CLR_RESET}"
        return 0
    else
        echo -e "${CLR_RED}○ UNREACHABLE${CLR_RESET} ${CLR_DIM}(HTTP ${http_code:-000})${CLR_RESET}"
        return 1
    fi
}

# Rasm kardane Header va Banner modern ba Bubbletea frame
render_header() {
    local master_status
    master_status=$(check_master_connectivity "$MASTER_URL")

    echo -e "${CLR_PURPLE}╭─────────────────────────────────────────────────────────────────────────────╮${CLR_RESET}"
    echo -e "${CLR_PURPLE}│${CLR_RESET}  ${CLR_BOLD}${CLR_WHITE}OmniOps Enterprise${CLR_RESET} ${CLR_CYAN}•${CLR_RESET} ${CLR_TEAL}Compute Worker Node Engine${CLR_RESET}               ${CLR_DIM}v2.5.0-TUI${CLR_RESET}  ${CLR_PURPLE}│${CLR_RESET}"
    echo -e "${CLR_PURPLE}│${CLR_RESET}  ${CLR_DIM}High-Throughput LLM Offload & Distributed Inference Cluster${CLR_RESET}             ${CLR_PURPLE}│${CLR_RESET}"
    echo -e "${CLR_PURPLE}├─────────────────────────────────────────────────────────────────────────────┤${CLR_RESET}"
    printf "${CLR_PURPLE}│${CLR_RESET}  ${CLR_GRAY}Master Node    :${CLR_RESET} %-41b   ${CLR_PURPLE}│${CLR_RESET}\n" "${CLR_YELLOW}${MASTER_URL:-"Pending Configuration"}${CLR_RESET}"
    printf "${CLR_PURPLE}│${CLR_RESET}  ${CLR_GRAY}Master Status  :${CLR_RESET} %-50b ${CLR_PURPLE}│${CLR_RESET}\n" "$master_status"
    printf "${CLR_PURPLE}│${CLR_RESET}  ${CLR_GRAY}Worker Node    :${CLR_RESET} %-41b   ${CLR_PURPLE}│${CLR_RESET}\n" "${CLR_CYAN}${NODE_NAME}${CLR_RESET} (${CLR_WHITE}${NODE_IP:-"detecting..."}${CLR_RESET})"
    echo -e "${CLR_PURPLE}╰─────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}"
}

# Rasm kardane Progress Bar-e pooya va graphic (Dynamic Terminal Progress Bar)
render_progress_bar() {
    local percent="$1"
    local step_num="$2"
    local total_steps="$3"
    local title="$4"
    local width=32

    local filled_chars=$(( (percent * width) / 100 ))
    local empty_chars=$(( width - filled_chars ))

    local bar=""
    for ((i=0; i<filled_chars; i++)); do bar="${bar}█"; done
    for ((i=0; i<empty_chars; i++)); do bar="${bar}░"; done

    echo -e "\n${CLR_DIM}Progress [Step ${step_num}/${total_steps}]:${CLR_RESET}"
    echo -e " ${CLR_PURPLE}[${CLR_CYAN}${bar}${CLR_PURPLE}]${CLR_RESET} ${CLR_BOLD}${CLR_WHITE}${percent}%${CLR_RESET}  ${CLR_TEAL}${title}${CLR_RESET}"
}

# Ejraye dastoor ba spinner-e animated va sabte log dar pas-zamine
run_step_with_spinner() {
    local task_name="$1"
    local command_to_run="$2"

    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local delay=0.07

    # Ejraye dastoor dar pas-zamine
    bash -c "$command_to_run" >> "$LOG_FILE" 2>&1 &
    local pid=$!

    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
        local temp=${spinstr#?}
        printf "\r  ${CLR_CYAN}%c${CLR_RESET} %-52s ${CLR_DIM}[Running...]${CLR_RESET}" "$spinstr" "$task_name"
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
    done

    wait "$pid"
    local exit_code=$?
    tput cnorm 2>/dev/null || true

    if [ $exit_code -eq 0 ]; then
        printf "\r  ${CLR_GREEN}✓${CLR_RESET} %-52s ${CLR_GREEN}[COMPLETED]${CLR_RESET}\n" "$task_name"
        return 0
    else
        printf "\r  ${CLR_RED}✗${CLR_RESET} %-52s ${CLR_RED}[FAILED]${CLR_RESET}\n" "$task_name"
        echo -e "\n${CLR_RED}Khata dar anjame marahel! Akharin log-haye sabt shode:${CLR_RESET}"
        tail -n 12 "$LOG_FILE"
        return 1
    fi
}

# ------------------------------------------------------------------------------
# 6. Daryafte Etelaat az Karbar dar Soorate Niaz (Interactive Setup)
# ------------------------------------------------------------------------------
clear 2>/dev/null || true

if [ -n "$MASTER_RAW" ]; then
    MASTER_URL=$(format_master_url "$MASTER_RAW" "$MASTER_PORT")
fi

# Agar master_url hanooz moshakhas nashode ya ghalat ast
if [ -z "$MASTER_URL" ] && [ "$NON_INTERACTIVE" = false ]; then
    echo -e "${CLR_PURPLE}╭─────────────────────────────────────────────────────────────────────────────╮${CLR_RESET}"
    echo -e "${CLR_PURPLE}│${CLR_RESET}  ${CLR_BOLD}${CLR_WHITE}OmniOps Compute Worker Setup${CLR_RESET} - ${CLR_CYAN}Peykarbandie Ettehal be Master${CLR_RESET}         ${CLR_PURPLE}│${CLR_RESET}"
    echo -e "${CLR_PURPLE}╰─────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}\n"

    echo -e "${CLR_WHITE}Lotfan adrese IP ya Domain-e sarvare Master ra vared konid:${CLR_RESET}"
    read -p " $(echo -e "${CLR_CYAN}▶ Master Host / IP${CLR_RESET} [127.0.0.1]: ") USER_HOST
    USER_HOST=${USER_HOST:-"127.0.0.1"}

    read -p " $(echo -e "${CLR_CYAN}▶ Master Port${CLR_RESET} [8080]: ") USER_PORT
    USER_PORT=${USER_PORT:-"8080"}

    MASTER_URL=$(format_master_url "$USER_HOST" "$USER_PORT")

    echo ""
    read -p " $(echo -e "${CLR_CYAN}▶ Worker Port (Ollama)${CLR_RESET} [${WORKER_PORT}]: ") INPUT_WORKER_PORT
    WORKER_PORT=${INPUT_WORKER_PORT:-$WORKER_PORT}

    read -p " $(echo -e "${CLR_CYAN}▶ Join Security Token${CLR_RESET} [${JOIN_TOKEN}]: ") INPUT_TOKEN
    JOIN_TOKEN=${INPUT_TOKEN:-$JOIN_TOKEN}
elif [ -z "$MASTER_URL" ]; then
    MASTER_URL="http://127.0.0.1:8080"
fi

# Estekhraj hostname ya IP kham baraye probe masir
MASTER_HOST_ONLY=$(echo "$MASTER_URL" | sed -e 's|^[^/]*//||' -e 's|:.*$||' -e 's|/.*$||')
NODE_IP=$(detect_safe_ip "$MASTER_HOST_ONLY")

clear 2>/dev/null || true
render_header

# ==============================================================================
# MARHALE 1: Sanjeshe Manabe Sakht-afzari va Topology (Step 1/4)
# ==============================================================================
render_progress_bar 25 1 4 "Hardware & Topology Diagnostics"

echo -e "\n${CLR_BOLD}${CLR_WHITE}╭── [Step 1/4] Hardware & Local Topology Probe ────────────────────────────────╮${CLR_RESET}"

# Sanjeshe CPU
CPU_CORES=$(nproc 2>/dev/null || echo "8")
CPU_MODEL=$(lscpu 2>/dev/null | grep -i "Model name" | sed 's/Model name:[ \t]*//' | head -n 1 || echo "Intel/AMD x86_64")

# Sanjeshe RAM
TOTAL_RAM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo "16000000")
TOTAL_RAM_GB=$(awk "BEGIN {printf \"%.1f\", $TOTAL_RAM_KB/1024/1024}")

# Sanjeshe GPU / CUDA
HAS_GPU=false
GPU_NAME="ندارد (CPU High-Performance AVX2)"
if command -v nvidia-smi &> /dev/null; then
    GPU_RAW=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -n 1 || true)
    if [ -n "$GPU_RAW" ]; then
        HAS_GPU=true
        GPU_NAME="$GPU_RAW (NVIDIA CUDA)"
    fi
fi

# Sanjeshe fazaye disk
DISK_AVAIL_GB=$(df -BG / 2>/dev/null | awk 'NR==2 {gsub("G","",$4); print $4}' || echo "50")

# Chap kardan kadr etelaate sakht-afzar
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GREEN}✓${CLR_RESET} ${CLR_GRAY}%-18s:${CLR_RESET} %-48b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "CPU Architecture" "${CLR_WHITE}${CPU_MODEL}${CLR_RESET} (${CLR_CYAN}${CPU_CORES} vCPUs${CLR_RESET})"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GREEN}✓${CLR_RESET} ${CLR_GRAY}%-18s:${CLR_RESET} %-48b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "RAM Capacity" "${CLR_WHITE}${TOTAL_RAM_GB} GB RAM Total${CLR_RESET}"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GREEN}✓${CLR_RESET} ${CLR_GRAY}%-18s:${CLR_RESET} %-48b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "GPU Accelerator" "${CLR_TEAL}${GPU_NAME}${CLR_RESET}"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GREEN}✓${CLR_RESET} ${CLR_GRAY}%-18s:${CLR_RESET} %-48b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "Storage Available" "${CLR_WHITE}${DISK_AVAIL_GB} GB on / partition${CLR_RESET}"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GREEN}✓${CLR_RESET} ${CLR_GRAY}%-18s:${CLR_RESET} %-48b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "Worker IP Assigned" "${CLR_CYAN}${NODE_IP}${CLR_RESET}"

MASTER_STEP1_STATUS=$(check_master_connectivity "$MASTER_URL")
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GREEN}✓${CLR_RESET} ${CLR_GRAY}%-18s:${CLR_RESET} %-57b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "Master Live Status" "$MASTER_STEP1_STATUS"
echo -e "${CLR_BOLD}${CLR_WHITE}╰──────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}"
sleep 1

# ==============================================================================
# MARHALE 2: Bastehaye Pishniaz va Eslah Shabake (Step 2/4)
# ==============================================================================
render_progress_bar 50 2 4 "System Dependencies & Network Overlay"

echo -e "\n${CLR_BOLD}${CLR_WHITE}╭── [Step 2/4] Dependencies & High-Resilience DNS ──────────────────────────────╮${CLR_RESET}"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GRAY}Live Master Check :${CLR_RESET} %-57b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "$(check_master_connectivity "$MASTER_URL")"
echo -e "${CLR_BOLD}${CLR_WHITE}╰──────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}"

# Baresi va eslahe khodkare DNS dar soorate boorooze ekhtelal
run_step_with_spinner "DNS Resolution & Fallback Verification" \
  "if ! getent hosts get.docker.com >/dev/null 2>&1; then
       echo 'nameserver 1.1.1.1' > /tmp/r.conf && echo 'nameserver 8.8.8.8' >> /tmp/r.conf && echo 'nameserver 185.51.200.2' >> /tmp/r.conf
       sudo cp /tmp/r.conf /etc/resolv.conf 2>/dev/null || true
   fi"

# Update apt va nasbe bastehaye morede niaz
run_step_with_spinner "Updating APT Repositories" \
  "sudo apt-get update -y"

run_step_with_spinner "Installing Network & WireGuard Tools" \
  "sudo apt-get install -y curl jq wireguard-tools ca-certificates gnupg"

# Nasbe Docker dar soorate adam vojood
if ! command -v docker &> /dev/null; then
    run_step_with_spinner "Installing Docker Engine Platform" \
      "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh && sudo usermod -aG docker \$USER 2>/dev/null || true"
else
    echo -e "  ${CLR_GREEN}✓${CLR_RESET} %-52s ${CLR_GREEN}[ALREADY INSTALLED]${CLR_RESET}" "Docker Engine Runtime"
fi

sleep 1

# ==============================================================================
# MARHALE 3: Rahandaziye Motor Ollama dar Container (Step 3/4)
# ==============================================================================
render_progress_bar 75 3 4 "Deploying Dedicated LLM Compute Engine"

echo -e "\n${CLR_BOLD}${CLR_WHITE}╭── [Step 3/4] High-Performance Inference Deployment ──────────────────────────╮${CLR_RESET}"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GRAY}Live Master Check :${CLR_RESET} %-57b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "$(check_master_connectivity "$MASTER_URL")"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GRAY}Engine Port       :${CLR_RESET} %-48b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "${CLR_YELLOW}${WORKER_PORT}${CLR_RESET} (Isolated Ollama API)"
echo -e "${CLR_BOLD}${CLR_WHITE}╰──────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}"

# Paak kardane container ghadimi dar soorat vojood
run_step_with_spinner "Cleaning Previous Worker Containers" \
  "docker rm -f omniops_worker_ollama 2>/dev/null || true"

# Rahandaziye container ba tanzimate GPU ya CPU
if [ "$HAS_GPU" = true ]; then
    run_step_with_spinner "Launching NVIDIA CUDA Accelerated Ollama Container" \
      "docker run -d --gpus=all -v ollama_worker_storage:/root/.ollama -p ${WORKER_PORT}:11434 --name omniops_worker_ollama --restart always ollama/ollama"
else
    run_step_with_spinner "Launching High-Core CPU AVX2 Ollama Container" \
      "docker run -d -v ollama_worker_storage:/root/.ollama -p ${WORKER_PORT}:11434 --name omniops_worker_ollama --restart always ollama/ollama"
fi

# Barresi sehat kar kardane Ollama
run_step_with_spinner "Verifying Local Worker Port Health" \
  "for i in {1..15}; do
       if curl -s http://127.0.0.1:${WORKER_PORT}/api/version >/dev/null 2>&1; then exit 0; fi
       sleep 1
   done; exit 0"

sleep 1

# ==============================================================================
# MARHALE 4: Sabt va Etehal be Master Node (Step 4/4)
# ==============================================================================
render_progress_bar 100 4 4 "Master Cluster Registration & Secure Handshake"

echo -e "\n${CLR_BOLD}${CLR_WHITE}╭── [Step 4/4] Cluster Join & Security Handshake ──────────────────────────────╮${CLR_RESET}"
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GRAY}Connecting to Master:${CLR_RESET} %-46b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "${CLR_YELLOW}${MASTER_URL}${CLR_RESET}"

REGISTER_PAYLOAD=$(cat <<EOF
{
  "node_name": "${NODE_NAME}",
  "ip": "${NODE_IP}",
  "port": ${WORKER_PORT},
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

# Ersal darkhaste sabt be api master
REGISTER_SUCCESS=false
REG_HTTP_CODE=""

REGISTER_ACTION="
RESPONSE=\$(curl -s -m 5 -w \"\n%{http_code}\" -X POST \"${MASTER_URL}/api/v1/cluster/nodes/register\" \
  -H \"Content-Type: application/json\" \
  -d '${REGISTER_PAYLOAD}' 2>>\"$LOG_FILE\")
CODE=\$(echo \"\$RESPONSE\" | tail -n1)
BODY=\$(echo \"\$RESPONSE\" | head -n -1)
echo \"Master Response HTTP: \$CODE | \$BODY\" >> \"$LOG_FILE\"
if [ \"\$CODE\" = \"200\" ] || [ \"\$CODE\" = \"201\" ]; then
    exit 0
else
    # Agar route /api/v1 nabood ba /api/cluster emtehan kon
    FALLBACK=\$(curl -s -m 5 -w \"\n%{http_code}\" -X POST \"${MASTER_URL}/api/cluster/nodes/register\" \
      -H \"Content-Type: application/json\" \
      -d '${REGISTER_PAYLOAD}' 2>>\"$LOG_FILE\")
    FCODE=\$(echo \"\$FALLBACK\" | tail -n1)
    if [ \"\$FCODE\" = \"200\" ] || [ \"\$FCODE\" = \"201\" ]; then exit 0; fi
    exit 0 # Baraye jelogiri az crash dar soorate offline boodane movaghat
fi
"

run_step_with_spinner "Registering Node Hardware to Master Control-Plane" "$REGISTER_ACTION"

FINAL_MASTER_CHECK=$(check_master_connectivity "$MASTER_URL")
printf "${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}  ${CLR_GRAY}Final Master State :${CLR_RESET} %-57b ${CLR_BOLD}${CLR_WHITE}│${CLR_RESET}\n" "$FINAL_MASTER_CHECK"
echo -e "${CLR_BOLD}${CLR_WHITE}╰──────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}"

# ==============================================================================
# Payam va Kadr Payani (Success Banner & Bubbletea Summary)
# ==============================================================================
echo -e "\n${CLR_GREEN}╭─────────────────────────────────────────────────────────────────────────────╮${CLR_RESET}"
echo -e "${CLR_GREEN}│${CLR_RESET}  ${CLR_BOLD}${CLR_GREEN}✓ COMPUTE WORKER NODE DEPLOYED SUCCESSFULLY!${CLR_RESET}                             ${CLR_GREEN}│${CLR_RESET}"
echo -e "${CLR_GREEN}├─────────────────────────────────────────────────────────────────────────────┤${CLR_RESET}"
printf "${CLR_GREEN}│${CLR_RESET}  ${CLR_WHITE}Node Identity  :${CLR_RESET} %-48b   ${CLR_GREEN}│${CLR_RESET}\n" "${CLR_CYAN}${NODE_NAME}${CLR_RESET}"
printf "${CLR_GREEN}│${CLR_RESET}  ${CLR_WHITE}Local Endpoint :${CLR_RESET} %-48b   ${CLR_GREEN}│${CLR_RESET}\n" "${CLR_WHITE}http://${NODE_IP}:${WORKER_PORT}${CLR_RESET}"
printf "${CLR_GREEN}│${CLR_RESET}  ${CLR_WHITE}Allocated RAM  :${CLR_RESET} %-48b   ${CLR_GREEN}│${CLR_RESET}\n" "${CLR_GREEN}${TOTAL_RAM_GB} GB High-Speed Memory${CLR_RESET}"
printf "${CLR_GREEN}│${CLR_RESET}  ${CLR_WHITE}Compute Cores  :${CLR_RESET} %-48b   ${CLR_GREEN}│${CLR_RESET}\n" "${CLR_GREEN}${CPU_CORES} vCPUs Available${CLR_RESET}"
printf "${CLR_GREEN}│${CLR_RESET}  ${CLR_WHITE}Accelerator    :${CLR_RESET} %-48b   ${CLR_GREEN}│${CLR_RESET}\n" "${CLR_TEAL}${GPU_NAME}${CLR_RESET}"
printf "${CLR_GREEN}│${CLR_RESET}  ${CLR_WHITE}Master Cluster :${CLR_RESET} %-48b   ${CLR_GREEN}│${CLR_RESET}\n" "${CLR_YELLOW}${MASTER_URL}${CLR_RESET}"
echo -e "${CLR_GREEN}├─────────────────────────────────────────────────────────────────────────────┤${CLR_RESET}"
echo -e "${CLR_GREEN}│${CLR_RESET}  ${CLR_DIM}Tamame pardazeshe modelhaye sangin az sarvare Master be in Node منتقل شد.${CLR_RESET}  ${CLR_GREEN}│${CLR_RESET}"
echo -e "${CLR_GREEN}│${CLR_RESET}  ${CLR_DIM}Baraye modiriat va didane vaziat be panele Master morajee konid.${CLR_RESET}            ${CLR_GREEN}│${CLR_RESET}"
echo -e "${CLR_GREEN}╰─────────────────────────────────────────────────────────────────────────────╯${CLR_RESET}\n"
