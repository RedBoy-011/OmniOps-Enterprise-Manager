#!/usr/bin/env bash
# ==============================================================================
# OmniOps Enterprise Manager - Modern Edge Node Installer (Ferrum-Grade CLI)
# ==============================================================================
# In script baraye nasb va rahandaziye sarvare Edge Node ba ghabeliate Auto-IP,
# modiriate hooshmande SSL (Domain/IP) va Token Handshake ba Master Node ast.
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.
# ==============================================================================

set -e

# ------------------------------------------------------------------------------
# 1. Tanzimate Rangha va Namayeshe Graphic (ANSI Colors & Styling)
# ------------------------------------------------------------------------------
COLOR_RESET="\033[0m"
COLOR_BOLD="\033[1m"
COLOR_CYAN="\033[0;36m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_RED="\033[0;31m"
COLOR_BLUE="\033[0;34m"
COLOR_PURPLE="\033[0;35m"
COLOR_GRAY="\033[0;90m"

# Tabee baraye pak kardane safhe va namayeshe Banner
show_banner() {
    clear
    echo -e "${COLOR_CYAN}${COLOR_BOLD}"
    cat << "EOF"
  ██████╗ ███╗   ███╗███╗   ██╗██╗ ██████╗ ██████╗ ███████╗
 ██╔═══██╗████╗ ████║████╗  ██║██║██╔═══██╗██╔══██╗██╔════╝
 ██║   ██║██╔████╔██║██╔██╗ ██║██║██║   ██║██████╔╝███████╗
 ██║   ██║██║╚██╔╝██║██║╚██╗██║██║██║   ██║██╔═══╝ ╚════██║
 ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║╚██████╔╝██║     ███████║
  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝     ╚══════╝
EOF
    echo -e "${COLOR_PURPLE}  --- Modern Edge Mirror & Secure Reverse Proxy Installer ---${COLOR_RESET}"
    echo -e "${COLOR_GRAY}  Version: 2.4.0-Enterprise | Architecture: Zero-Trust Gateway${COLOR_RESET}"
    echo -e "${COLOR_CYAN}===============================================================================${COLOR_RESET}\n"
}

# Tabee baraye namayeshe Spinner hengame anjame amaliate toolani dar pas-zamine
run_with_spinner() {
    local pid=$!
    local delay=0.08
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local message="$1"
    tput civis 2>/dev/null || true
    while kill -0 "$pid" 2>/dev/null; do
        local temp=${spinstr#?}
        printf "\r  ${COLOR_CYAN}%c${COLOR_RESET} %s..." "$spinstr" "$message"
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
    done
    wait "$pid"
    local exit_code=$?
    tput cnorm 2>/dev/null || true
    if [ $exit_code -eq 0 ]; then
        printf "\r  ${COLOR_GREEN}✓${COLOR_RESET} %-55s ${COLOR_GREEN}[OK]${COLOR_RESET}\n" "$message"
    else
        printf "\r  ${COLOR_RED}✗${COLOR_RESET} %-55s ${COLOR_RED}[FAILED]${COLOR_RESET}\n" "$message"
        return $exit_code
    fi
}

# ------------------------------------------------------------------------------
# 2. Check kardane Dastresi Root (Root Permission Verification)
# ------------------------------------------------------------------------------
# Barresi mikonim ke aya karbar dastresie root ya sudo darad ya kheyr
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${COLOR_RED}[!] Error: Lotfan in script ra ba dastresie root ya sudo ejra konid.${COLOR_RESET}"
    echo -e "    Mesal: ${COLOR_CYAN}sudo bash $0${COLOR_RESET}"
    exit 1
fi

show_banner

# ------------------------------------------------------------------------------
# STEP 1: Tashkhise Khodkare IP (Auto-IP Detection Engine)
# ------------------------------------------------------------------------------
# Dar in ghesmat IP haye mahali (LAN) va omoumi (Public) ba chand ravesh shenasaei mishavand
echo -e "${COLOR_BOLD}${COLOR_BLUE}[STEP 1/5]${COLOR_RESET} ${COLOR_BOLD}Tashkhise Khodkare IP va Moshakhassate Shabake...${COLOR_RESET}"

# Shenasaeiye Local LAN IP
DETECTED_LOCAL_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

# Shenasaeiye Public IP ba timeout kootah baraye jelogiri az hang kardan dar shabakehaye mahali
DETECTED_PUBLIC_IP=$(curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 https://icanhazip.com 2>/dev/null || curl -s -m 2 https://ip.sb 2>/dev/null || echo "")

# Agar pasokh dorost nabood ya HTML bood pak mikonim
if [[ "$DETECTED_PUBLIC_IP" =~ "<" ]] || [ -z "$DETECTED_PUBLIC_IP" ]; then
    DETECTED_PUBLIC_IP=""
fi

echo -e "  ${COLOR_GRAY}┌─────────────────────────────────────────────────────────────┐${COLOR_RESET}"
echo -e "  ${COLOR_GRAY}│${COLOR_RESET} ${COLOR_CYAN}IP haye shenasaei shode dar in server:${COLOR_RESET}                      ${COLOR_GRAY}│${COLOR_RESET}"
echo -e "  ${COLOR_GRAY}│${COLOR_RESET} • Local LAN IP (Shabake Dakheli): ${COLOR_GREEN}${DETECTED_LOCAL_IP}${COLOR_RESET}"
if [ -n "$DETECTED_PUBLIC_IP" ]; then
    echo -e "  ${COLOR_GRAY}│${COLOR_RESET} • Public Internet IP (Omoumi):    ${COLOR_GREEN}${DETECTED_PUBLIC_IP}${COLOR_RESET}"
else
    echo -e "  ${COLOR_GRAY}│${COLOR_RESET} • Public Internet IP (Omoumi):    ${COLOR_YELLOW}Shenasaei nashod (Offline/LAN mode)${COLOR_RESET}"
fi
echo -e "  ${COLOR_GRAY}└─────────────────────────────────────────────────────────────┘${COLOR_RESET}\n"

# Entekhabe IP tavasote karbar
echo -e "${COLOR_YELLOW}Kodam IP ra mikhahid be onvane neshani asli in Edge Node estefade konid?${COLOR_RESET}"
echo -e "  1) Local LAN IP:    [ ${COLOR_GREEN}${DETECTED_LOCAL_IP}${COLOR_RESET} ] (Monaseb baraye shabake dakheli, WiFi va Office)"
if [ -n "$DETECTED_PUBLIC_IP" ]; then
    echo -e "  2) Public IP:       [ ${COLOR_GREEN}${DETECTED_PUBLIC_IP}${COLOR_RESET} ] (Monaseb baraye dastresi az internet)"
    echo -e "  3) Vared kardane IP ya Domain be soorate dasti"
    read -p "Lotfan gozineye morede nazar ra entekhab konid [Pishfarz: 1]: " IP_CHOICE
    IP_CHOICE=${IP_CHOICE:-1}
    case $IP_CHOICE in
        1) CHOSEN_HOST="$DETECTED_LOCAL_IP" ;;
        2) CHOSEN_HOST="$DETECTED_PUBLIC_IP" ;;
        3) 
           read -p "Lotfan IP ya Domain delkhah ra vared konid: " CUSTOM_HOST
           CHOSEN_HOST="${CUSTOM_HOST:-$DETECTED_LOCAL_IP}"
           ;;
        *) CHOSEN_HOST="$DETECTED_LOCAL_IP" ;;
    esac
else
    echo -e "  2) Vared kardane IP ya Domain be soorate dasti"
    read -p "Lotfan gozineye morede nazar ra entekhab konid [Pishfarz: 1]: " IP_CHOICE
    IP_CHOICE=${IP_CHOICE:-1}
    if [ "$IP_CHOICE" -eq 2 ]; then
        read -p "Lotfan IP ya Domain delkhah ra vared konid: " CUSTOM_HOST
        CHOSEN_HOST="${CUSTOM_HOST:-$DETECTED_LOCAL_IP}"
    else
        CHOSEN_HOST="$DETECTED_LOCAL_IP"
    fi
fi

echo -e "  ${COLOR_GREEN}✓ Host entekhab shode:${COLOR_RESET} ${COLOR_BOLD}${CHOSEN_HOST}${COLOR_RESET}\n"

# ------------------------------------------------------------------------------
# STEP 2: Modiriate Hooshmande SSL (Domain vs Raw IP)
# ------------------------------------------------------------------------------
# Dar in marhale moshakhas mikonim aya karbar Domain darad ya mikhahad ba IP vasl shavad
echo -e "${COLOR_BOLD}${COLOR_BLUE}[STEP 2/5]${COLOR_RESET} ${COLOR_BOLD}Peykarbandie Amniat va Govahie SSL/TLS...${COLOR_RESET}"
echo -e "${COLOR_YELLOW}Aya baraye in Edge Node Domain darid ya mikhahid mostaghim ba IP motasel shavid?${COLOR_RESET}"
echo -e "  1) Estefade az Domain (Let's Encrypt / Certbot Auto-SSL ba emtehan va tajdid khodkar)"
echo -e "  2) Estefade az IP kham (Tolid khodkare Self-Signed TLS Certificate ba SAN motabar)"
read -p "Gozineye morede nazar ra entekhab konid [Pishfarz: 2]: " SSL_MODE_CHOICE
SSL_MODE_CHOICE=${SSL_MODE_CHOICE:-2}

TARGET_DOMAIN=""
USE_LETS_ENCRYPT=false

if [ "$SSL_MODE_CHOICE" -eq 1 ]; then
    read -p "Lotfan name Domain ra vared konid (mesal: edge.mycompany.com): " USER_DOMAIN
    if [ -n "$USER_DOMAIN" ]; then
        TARGET_DOMAIN="$USER_DOMAIN"
        USE_LETS_ENCRYPT=true
        read -p "Lotfan email baraye Let's Encrypt ra vared konid: " LETS_EMAIL
        LETS_EMAIL=${LETS_EMAIL:-"admin@$TARGET_DOMAIN"}
        echo -e "  ${COLOR_GREEN}✓ Halate Domain fa'al shod:${COLOR_RESET} https://${TARGET_DOMAIN}"
    else
        echo -e "  ${COLOR_YELLOW}! Domain vared nashod; be halate IP bazgasht dadeh shod.${COLOR_RESET}"
        USE_LETS_ENCRYPT=false
    fi
else
    USE_LETS_ENCRYPT=false
    echo -e "  ${COLOR_GREEN}✓ Halate Raw IP fa'al shod:${COLOR_RESET} https://${CHOSEN_HOST}"
fi
echo ""

# ------------------------------------------------------------------------------
# STEP 3: Daryaft va Etebarsanjie Master Node (Token Handshake)
# ------------------------------------------------------------------------------
# Daryafte neshani Master Control-Plane va Exchange Token baraye barghararie peyvand
echo -e "${COLOR_BOLD}${COLOR_BLUE}[STEP 3/5]${COLOR_RESET} ${COLOR_BOLD}Etebarsanji va Token Handshake ba Master Control-Plane...${COLOR_RESET}"
read -p "Neshani IP ya Domain sarvare Master [Pishfarz: 127.0.0.1]: " USER_M_HOST
read -p "Porte sarvare Master [Pishfarz: 8080]: " USER_M_PORT
USER_M_HOST=${USER_M_HOST:-"127.0.0.1"}
USER_M_PORT=${USER_M_PORT:-"8080"}

# Sakhte URL kamel ba protocol
if [[ "$USER_M_HOST" =~ ^http:// || "$USER_M_HOST" =~ ^https:// ]]; then
    MASTER_URL="${USER_M_HOST}:${USER_M_PORT}"
else
    MASTER_URL="http://${USER_M_HOST}:${USER_M_PORT}"
fi

# Hazfe slash akhar dar soorate vojood
MASTER_URL="${MASTER_URL%/}"

read -p "Porte HTTPS baraye in Edge Node [Pishfarz: 443]: " EDGE_HTTPS_PORT
EDGE_HTTPS_PORT=${EDGE_HTTPS_PORT:-"443"}

read -p "Secure Exchange Token (Kelide Tabadole Amn) [Pishfarz: omniops-secure-token]: " EXCHANGE_TOKEN
EXCHANGE_TOKEN=${EXCHANGE_TOKEN:-"omniops-secure-token"}

echo -e "  [*] Dar hal barresie dastresi va ping be sarvare Master (${MASTER_URL})..."
# Test kardane dastresi be Master
MASTER_HEALTH=$(curl -s -m 3 "${MASTER_URL}/api/health" 2>/dev/null || true)

if echo "$MASTER_HEALTH" | grep -q "healthy" 2>/dev/null; then
    echo -e "  ${COLOR_GREEN}✓ Ertebate Master Control-Plane taeed shod (Status: Healthy).${COLOR_RESET}\n"
else
    echo -e "  ${COLOR_YELLOW}⚠️  Peyvand ba Master dar hale hazer bargharar nashod (Timeout ya dar hale ejra nist).${COLOR_RESET}"
    echo -e "  ${COLOR_GRAY}   (Edge Node tanzim mishavad va pas az bala amadane Master khodkar vasl khahad shod).${COLOR_RESET}\n"
fi

# ------------------------------------------------------------------------------
# STEP 4: Nasbe Pishniazha va Bazsazie Nginx (System Setup & Reverse Proxy)
# ------------------------------------------------------------------------------
# Nasbe pishniazha mesle nginx, openssl, curl ba namayeshe spinner modern
echo -e "${COLOR_BOLD}${COLOR_BLUE}[STEP 4/5]${COLOR_RESET} ${COLOR_BOLD}Nasbe Bastahaye Pishniaz va Reverse Proxy Nginx...${COLOR_RESET}"

# Update kardane apt va nasbe nginx va openssl dar pas zamine
(
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq >/dev/null 2>&1
    apt-get install -y -qq nginx openssl curl jq certbot python3-certbot-nginx >/dev/null 2>&1
) &
run_with_spinner "Dar hale amadesazie makhanhaye apt va nasbe Nginx & OpenSSL"

# Sakhte posheye zakhireye certificate ha
CERT_DIR="/etc/omniops-edge/certs"
mkdir -p "$CERT_DIR"

if [ "$USE_LETS_ENCRYPT" = true ]; then
    # Rahandazie Certbot baraye Domain
    echo -e "  [*] Darkhaste govahie rasmi az Let's Encrypt baraye ${TARGET_DOMAIN}..."
    systemctl stop nginx 2>/dev/null || true
    
    certbot certonly --standalone -d "$TARGET_DOMAIN" --non-interactive --agree-tos --email "$LETS_EMAIL" --preferred-challenges http >/dev/null 2>&1 || true
    
    if [ -f "/etc/letsencrypt/live/${TARGET_DOMAIN}/fullchain.pem" ]; then
        SSL_CERT_PATH="/etc/letsencrypt/live/${TARGET_DOMAIN}/fullchain.pem"
        SSL_KEY_PATH="/etc/letsencrypt/live/${TARGET_DOMAIN}/privkey.pem"
        echo -e "  ${COLOR_GREEN}✓ Govahie motabare Let's Encrypt ba movafaghiat daryaft shod.${COLOR_RESET}"
    else
        echo -e "  ${COLOR_YELLOW}! Darkhaste Let's Encrypt namovafagh bood; tolid certificate self-signed ba SAN anjam mishavad.${COLOR_RESET}"
        USE_LETS_ENCRYPT=false
    fi
fi

if [ "$USE_LETS_ENCRYPT" = false ]; then
    # Tolid kardane Self-Signed Certificate ba Subject Alternative Name (SAN) motabar baraye IP
    (
        SSL_CERT_PATH="${CERT_DIR}/edge-cert.pem"
        SSL_KEY_PATH="${CERT_DIR}/edge-key.pem"
        OPENSSL_CONF="${CERT_DIR}/openssl.cnf"

        # Sakhte config ekhtesasi baraye SAN ba IP va Localhost
        cat > "$OPENSSL_CONF" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = US
ST = State
L = City
O = OmniOps Enterprise
OU = Edge Node Unit
CN = ${CHOSEN_HOST}

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${CHOSEN_HOST}
IP.2 = 127.0.0.1
DNS.1 = localhost
EOF

        # Tolid kelid va certificate 10 sale (3650 rooz)
        openssl req -new -nodes -x509 -days 3650 -keyout "$SSL_KEY_PATH" -out "$SSL_CERT_PATH" -config "$OPENSSL_CONF" >/dev/null 2>&1
        chmod 600 "$SSL_KEY_PATH"
        chmod 644 "$SSL_CERT_PATH"
    ) &
    run_with_spinner "Dar hale tolide Self-Signed TLS Certificate ba SAN (4096-bit SHA256)"
fi

# ------------------------------------------------------------------------------
# STEP 5: Peykarbandie Configuration Nginx (Edge UI Mirror Config)
# ------------------------------------------------------------------------------
# Sakhte file vhost baraye Nginx ba poshtibani az HTTPS, WebSockets va Proxy be Master
echo -e "\n${COLOR_BOLD}${COLOR_BLUE}[STEP 5/5]${COLOR_RESET} ${COLOR_BOLD}Tanzime VirtualHost dar Nginx va Rahandazie Service...${COLOR_RESET}"

NGINX_CONF="/etc/nginx/sites-available/omniops-edge.conf"

SERVER_NAME_DIRECTIVE="_"
if [ -n "$TARGET_DOMAIN" ]; then
    SERVER_NAME_DIRECTIVE="${TARGET_DOMAIN}"
fi

cat > "$NGINX_CONF" << EOF
# ==============================================================================
# OmniOps Enterprise Manager - Edge Node Reverse Proxy Config
# Generated automatically by edge installer script
# ==============================================================================

# Redirection az HTTP be HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME_DIRECTIVE};
    return 301 https://\$host\$request_uri;
}

# Sarvare Amn HTTPS
server {
    listen ${EDGE_HTTPS_PORT} ssl http2;
    listen [::]:${EDGE_HTTPS_PORT} ssl http2;
    server_name ${SERVER_NAME_DIRECTIVE};

    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Amniat va Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Route-e aslie proxy be Master Control-Plane
    location / {
        proxy_pass ${MASTER_URL};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-OmniOps-Edge-Token "${EXCHANGE_TOKEN}";
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Proxy baraye WebSocket haye zende
    location /socket.io/ {
        proxy_pass ${MASTER_URL};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }
}
EOF

# Fa'alsazie site dar Nginx
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/omniops-edge.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test kardane syntax Nginx va reload
nginx -t >/dev/null 2>&1
systemctl restart nginx
systemctl enable nginx >/dev/null 2>&1

# Zakhireye file config tanzimate Edge baraye modiriate aati
EDGE_META_DIR="/etc/omniops-edge"
cat > "${EDGE_META_DIR}/edge-config.json" << EOF
{
  "role": "edge_mirror",
  "chosen_host": "${CHOSEN_HOST}",
  "master_url": "${MASTER_URL}",
  "ssl_mode": "$([ "$USE_LETS_ENCRYPT" = true ] && echo "letsencrypt" || echo "self_signed_san")",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# ------------------------------------------------------------------------------
# Payane Nasb va Namayeshe Dashboard Natijeh (Ferrum-Style Output Box)
# ------------------------------------------------------------------------------
FINAL_DISPLAY_URL="https://${CHOSEN_HOST}"
if [ -n "$TARGET_DOMAIN" ]; then
    FINAL_DISPLAY_URL="https://${TARGET_DOMAIN}"
fi

if [ "$EDGE_HTTPS_PORT" != "443" ]; then
    FINAL_DISPLAY_URL="${FINAL_DISPLAY_URL}:${EDGE_HTTPS_PORT}"
fi

echo -e "\n${COLOR_GREEN}${COLOR_BOLD}===============================================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}${COLOR_BOLD}   🎉  OmniOps Edge Node ba Movafaghiate Kamel Rahandazi va Fa'al Shod!        ${COLOR_RESET}"
echo -e "${COLOR_GREEN}${COLOR_BOLD}===============================================================================${COLOR_RESET}"
echo -e "  ${COLOR_CYAN}Neshani Dastresi be Panele Amn (HTTPS):${COLOR_RESET} ${COLOR_BOLD}${COLOR_GREEN}${FINAL_DISPLAY_URL}${COLOR_RESET}"
echo -e "  ${COLOR_GRAY}• Protocol:${COLOR_RESET}              ${COLOR_CYAN}HTTPS (Port ${EDGE_HTTPS_PORT}) ba Redirect Khodkare Port 80${COLOR_RESET}"
echo -e "  ${COLOR_GRAY}• Vaziat SSL:${COLOR_RESET}            $([ "$USE_LETS_ENCRYPT" = true ] && echo -e "${COLOR_GREEN}Let's Encrypt Verified (Auto-Renew)${COLOR_RESET}" || echo -e "${COLOR_YELLOW}Self-Signed TLS ba SAN (Chrome/Firefox Ready)${COLOR_RESET}")"
echo -e "  ${COLOR_GRAY}• Master Control-Plane:${COLOR_RESET}  ${COLOR_CYAN}${MASTER_URL}${COLOR_RESET}"
echo -e "  ${COLOR_GRAY}• Exchange Token:${COLOR_RESET}        ${COLOR_YELLOW}${EXCHANGE_TOKEN:0:6}********${COLOR_RESET}"
echo -e ""
echo -e "  ${COLOR_BOLD}💡 Rahnama baraye Dastresi dar Moroorger:${COLOR_RESET}"
if [ "$USE_LETS_ENCRYPT" = false ]; then
    echo -e "  Dar moroorgere khod (Chrome ya Firefox) be neshani ${COLOR_CYAN}${FINAL_DISPLAY_URL}${COLOR_RESET} beravid."
    echo -e "  Hengame namayeshe hoshdare gowahi (Warning: Potential Security Risk):"
    echo -e "  Rooye ${COLOR_YELLOW}Advanced${COLOR_RESET} va sepas ${COLOR_GREEN}Proceed to ${CHOSEN_HOST} (unsafe)${COLOR_RESET} ya ${COLOR_GREEN}Accept the Risk and Continue${COLOR_RESET} click konid."
fi
echo -e ""
echo -e "  ${COLOR_CYAN}Faramine Modiriati:${COLOR_RESET}"
echo -e "  • Barresie vaziat Nginx: ${COLOR_YELLOW}sudo systemctl status nginx${COLOR_RESET}"
echo -e "  • Moshahedeye Log-ha:    ${COLOR_YELLOW}sudo tail -f /var/log/nginx/error.log${COLOR_RESET}"
echo -e "${COLOR_GREEN}===============================================================================${COLOR_RESET}\n"
