#!/usr/bin/env bash
set -euo pipefail

VENV_PATH="/opt/markitdown-gui/venv"

echo "=== Instalando microsoft/markitdown ==="

# Instalar dependencias del sistema necesarias para markitdown
apt-get update
apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    libmagic1 poppler-utils \
    build-essential

# Si existe el entorno virtual del proyecto, usarlo; si no, crear uno nuevo
if [ -d "$VENV_PATH" ]; then
    echo "Instalando en el entorno virtual existente: $VENV_PATH"
    "$VENV_PATH/bin/pip" install --upgrade pip
    "$VENV_PATH/bin/pip" install "markitdown[all]"
    echo "=== markitdown instalado correctamente ==="
    echo "Ubicación: $VENV_PATH/bin/markitdown"
    "$VENV_PATH/bin/markitdown" --version || true
else
    echo "No se encontró el entorno virtual del proyecto. Creando uno nuevo en /opt/markitdown-venv..."
    python3 -m venv /opt/markitdown-venv
    /opt/markitdown-venv/bin/pip install --upgrade pip
    /opt/markitdown-venv/bin/pip install "markitdown[all]"
    echo "=== markitdown instalado correctamente ==="
    echo "Ubicación: /opt/markitdown-venv/bin/markitdown"
    /opt/markitdown-venv/bin/markitdown --version || true
    echo "Añade /opt/markitdown-venv/bin al PATH o usa la ruta completa."
fi
