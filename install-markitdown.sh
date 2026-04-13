#!/usr/bin/env bash
set -euo pipefail

VENV_PATH="/opt/markitdown-gui/venv"

echo "=== Instalando microsoft/markitdown ==="

# Instalar dependencias del sistema necesarias para markitdown
apt-get update
apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    libmagic1 poppler-utils ffmpeg \
    build-essential

# Determinar qué entorno virtual usar
if [ -d "$VENV_PATH" ]; then
    TARGET_VENV="$VENV_PATH"
    echo "Instalando en el entorno virtual existente: $TARGET_VENV"
else
    TARGET_VENV="/opt/markitdown-venv"
    echo "No se encontró el entorno virtual del proyecto. Creando uno nuevo en $TARGET_VENV..."
    python3 -m venv "$TARGET_VENV"
fi

# Instalar/actualizar markitdown
"$TARGET_VENV/bin/pip" install --upgrade pip
"$TARGET_VENV/bin/pip" install "markitdown[all]"

# Crear enlace simbólico global para que esté en PATH
ln -sf "$TARGET_VENV/bin/markitdown" /usr/local/bin/markitdown

echo "=== markitdown instalado correctamente ==="
echo "Ubicación: $TARGET_VENV/bin/markitdown"
echo "Enlace global: /usr/local/bin/markitdown"
markitdown --version || true
