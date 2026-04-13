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
echo "[3/4] Recargando Nginx..."
if ! diff -q "$PROJECT_DIR"/nginx/markitdown-gui.conf /etc/nginx/sites-available/markitdown-gui >/dev/null 2>&1; then
    cp "$PROJECT_DIR"/nginx/markitdown-gui.conf /etc/nginx/sites-available/markitdown-gui
    nginx -t
    systemctl reload nginx
    echo "Configuración de Nginx actualizada."
else
    echo "Configuración de Nginx sin cambios."
fi

# 4. Reiniciar backend
echo "[4/4] Reiniciando servicio backend..."
systemctl daemon-reload
systemctl restart "$SERVICE_NAME"

echo ""
echo "=== Actualización completada ==="
