#!/usr/bin/env bash
set -euo pipefail

# Configuración
APP_USER="markitdown"
APP_DIR="/opt/markitdown-gui"
DATA_DIR="/var/lib/markitdown-gui"
FRONTEND_DIR="/usr/share/markitdown-gui/frontend"
NGINX_CONF="/etc/nginx/sites-available/markitdown-gui"
SERVICE_NAME="markitdown-gui"

# Detectar directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Instalando MarkItDown GUI en LXC ==="

# 1. Actualizar e instalar dependencias del sistema
echo "[1/9] Instalando dependencias del sistema..."
apt-get update
apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    nodejs npm \
    nginx \
    openssl \
    libmagic1 poppler-utils \
    build-essential

# 2. Crear usuario del servicio
echo "[2/9] Creando usuario ${APP_USER}..."
if ! id -u "$APP_USER" &>/dev/null; then
    useradd --system --no-create-home --home-dir "$DATA_DIR" "$APP_USER"
fi

# 3. Crear directorios
echo "[3/9] Creando directorios..."
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR"/data "$DATA_DIR"/converted
mkdir -p "$FRONTEND_DIR"
chown -R "$APP_USER":"$APP_USER" "$DATA_DIR"

# 4. Copiar/instalar backend
echo "[4/9] Instalando backend..."
rm -rf "$APP_DIR"/backend
cp -r "$PROJECT_DIR"/backend "$APP_DIR"/
python3 -m venv "$APP_DIR"/venv
"$APP_DIR"/venv/bin/pip install --upgrade pip
"$APP_DIR"/venv/bin/pip install -r "$APP_DIR"/backend/requirements.txt

# 5. Construir e instalar frontend
echo "[5/9] Compilando frontend..."
cd "$PROJECT_DIR"/frontend
npm install
npm run build
rm -rf "$FRONTEND_DIR"/*
cp -r "$PROJECT_DIR"/frontend/dist/* "$FRONTEND_DIR"/

# 6. Generar certificado SSL autofirmado si no existe
echo "[6/9] Configurando SSL..."
SSL_DIR="/etc/nginx/ssl/markitdown-gui"
mkdir -p "$SSL_DIR"
if [ ! -f "$SSL_DIR"/cert.pem ] || [ ! -f "$SSL_DIR"/key.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR"/key.pem \
        -out "$SSL_DIR"/cert.pem \
        -subj "/CN=markitdown-gui"
    chmod 600 "$SSL_DIR"/key.pem
    chmod 644 "$SSL_DIR"/cert.pem
fi

# 7. Configurar Nginx
echo "[7/9] Configurando Nginx..."
cp "$PROJECT_DIR"/nginx/markitdown-gui.conf "$NGINX_CONF"

# Desactivar default si existe
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

if [ ! -L /etc/nginx/sites-enabled/markitdown-gui ]; then
    ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/markitdown-gui
fi

nginx -t
systemctl restart nginx

# 8. Instalar servicio systemd
echo "[8/9] Configurando servicio systemd..."
cp "$PROJECT_DIR"/systemd/markitdown-gui.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

# 8b. Configurar auto-actualización desde GitHub
echo "[8b/9] Configurando sistema de actualización..."
chown "$APP_USER":"$APP_USER" "$APP_DIR"
touch /var/log/markitdown-upgrade.log
chmod 644 /var/log/markitdown-upgrade.log

cat > "$APP_DIR"/upgrade-cron.sh <<EOF
#!/usr/bin/env bash
set -euo pipefail
TRIGGER="/opt/markitdown-gui/.upgrade-requested"
PROJECT_DIR="$PROJECT_DIR"
LOG_FILE="/var/log/markitdown-upgrade.log"

if [ ! -f "\$TRIGGER" ]; then
    exit 0
fi

rm -f "\$TRIGGER"
cd "\$PROJECT_DIR"
git fetch origin >> "\$LOG_FILE" 2>&1

BRANCH=\$(git rev-parse --abbrev-ref HEAD)
LOCAL=\$(git rev-parse HEAD)
REMOTE=\$(git rev-parse "origin/\$BRANCH" || true)

if [ "\$LOCAL" = "\$REMOTE" ]; then
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] No updates available (already on \$BRANCH \$LOCAL)." >> "\$LOG_FILE"
    exit 0
fi

echo "[\$(date '+%Y-%m-%d %H:%M:%S')] Upgrade triggered." >> "\$LOG_FILE"
git pull >> "\$LOG_FILE" 2>&1
"\$PROJECT_DIR/scripts/update.sh" >> "\$LOG_FILE" 2>&1
echo "[\$(date '+%Y-%m-%d %H:%M:%S')] Upgrade completed." >> "\$LOG_FILE"
EOF
chmod +x "$APP_DIR"/upgrade-cron.sh

# Añadir cron job de root (cada minuto)
(crontab -l 2>/dev/null | grep -v upgrade-cron.sh || true; echo "* * * * * $APP_DIR/upgrade-cron.sh >> /var/log/markitdown-upgrade.log 2>&1") | crontab -

# 9. Arrancar servicio
echo "[9/9] Iniciando servicio..."
systemctl restart "$SERVICE_NAME"

echo ""
echo "=== Instalación completada ==="
echo "Accede en: https://<IP-del-LXC>"
echo "NOTA: El certificado es autofirmado. Acepta la excepción de seguridad en tu navegador."
echo "Logs backend: journalctl -u ${SERVICE_NAME} -f"
echo ""
