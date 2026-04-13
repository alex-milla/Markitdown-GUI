#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/markitdown-gui"
FRONTEND_DIR="/usr/share/markitdown-gui/frontend"
SERVICE_NAME="markitdown-gui"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Actualizando MarkItDown GUI ==="

# 1. Copiar backend actualizado
echo "[1/4] Actualizando backend..."
rm -rf "$APP_DIR"/backend
cp -r "$PROJECT_DIR"/backend "$APP_DIR"/
"$APP_DIR"/venv/bin/pip install -r "$APP_DIR"/backend/requirements.txt

# 2. Recompilar frontend
echo "[2/4] Recompilando frontend..."
cd "$PROJECT_DIR"/frontend
npm install
npm run build
rm -rf "$FRONTEND_DIR"/*
cp -r "$PROJECT_DIR"/frontend/dist/* "$FRONTEND_DIR"/

# 3. Recargar nginx si cambió la configuración
echo "[3/5] Recargando Nginx..."
if ! diff -q "$PROJECT_DIR"/nginx/markitdown-gui.conf /etc/nginx/sites-available/markitdown-gui >/dev/null 2>&1; then
    cp "$PROJECT_DIR"/nginx/markitdown-gui.conf /etc/nginx/sites-available/markitdown-gui
    nginx -t
    systemctl reload nginx
    echo "Configuración de Nginx actualizada."
else
    echo "Configuración de Nginx sin cambios."
fi

# 4. Actualizar servicio systemd si cambió
echo "[4/5] Actualizando servicio systemd..."
if ! diff -q "$PROJECT_DIR"/systemd/markitdown-gui.service /etc/systemd/system/markitdown-gui.service >/dev/null 2>&1; then
    cp "$PROJECT_DIR"/systemd/markitdown-gui.service /etc/systemd/system/
    systemctl daemon-reload
    echo "Servicio systemd actualizado."
else
    echo "Servicio systemd sin cambios."
fi

# 5. Regenerar upgrade-cron.sh con la última lógica
echo "[5/5] Regenerando script de actualización automática..."
cat > "$APP_DIR"/upgrade-cron.sh <<'CRON_EOF'
#!/usr/bin/env bash
set -euo pipefail
TRIGGER="/opt/markitdown-gui/.upgrade-requested"
PROJECT_DIR="PROJECT_DIR_PLACEHOLDER"
LOG_FILE="/var/log/markitdown-upgrade.log"

if [ ! -f "$TRIGGER" ]; then
    exit 0
fi

rm -f "$TRIGGER"
cd "$PROJECT_DIR"
git fetch origin >> "$LOG_FILE" 2>&1

BRANCH=$(git rev-parse --abbrev-ref HEAD)
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH" || true)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No updates available (already on $BRANCH $LOCAL)." >> "$LOG_FILE"
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Upgrade triggered." >> "$LOG_FILE"
git pull >> "$LOG_FILE" 2>&1
"$PROJECT_DIR/scripts/update.sh" >> "$LOG_FILE" 2>&1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Upgrade completed." >> "$LOG_FILE"
CRON_EOF
sed -i "s|PROJECT_DIR_PLACEHOLDER|$PROJECT_DIR|g" "$APP_DIR"/upgrade-cron.sh
chmod +x "$APP_DIR"/upgrade-cron.sh

# Reiniciar backend
echo "Reiniciando servicio backend..."
systemctl restart "$SERVICE_NAME"

echo ""
echo "=== Actualización completada ==="
