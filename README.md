# MarkItDown GUI

Interfaz web full-stack para [microsoft/markitdown](https://github.com/microsoft/markitdown). Permite convertir archivos a Markdown desde un navegador, con autenticación de usuarios, historial de conversiones y descarga de resultados.

Diseñado para desplegarse de forma **nativa** en un contenedor LXC con Ubuntu 25.x (Proxmox, etc.). No requiere Docker.

## Arquitectura

- **Sistema operativo**: Ubuntu 25.04 en LXC
- **Servidor web**: Nginx con **HTTPS obligatorio** (certificado autofirmado por defecto)
- **Backend API**: FastAPI + Uvicorn
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Base de datos**: SQLite (modo WAL) para usuarios e historial
- **Proceso backend**: Gestionado por `systemd`

## Estructura del proyecto

```
Markitdown-GUI/
├── README.md
├── .gitignore
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── dependencies.py
│       ├── routers/
│       │   ├── auth.py
│       │   └── convert.py
│       └── services/
│           └── markitdown.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api.ts
│       ├── types.ts
│       ├── index.css
│       └── components/
│           ├── LoginForm.tsx
│           ├── Converter.tsx
│           └── History.tsx
├── nginx/
│   └── markitdown-gui.conf
├── systemd/
│   └── markitdown-gui.service
└── scripts/
    ├── install.sh
    └── update.sh
```

## Requisitos previos en el LXC

- Ubuntu 25.04 (o 24.04/25.10)
- Acceso root o sudo
- Conexión a Internet
- Repositorio clonado/copiado dentro del LXC (por ejemplo en `/root/Markitdown-GUI`)

## Instalación

Desde dentro del LXC, con el código del proyecto disponible (ej. en `/root/Markitdown-GUI`):

```bash
cd /root/Markitdown-GUI
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

El script realizará automáticamente:

1. Instalación de dependencias del sistema (`python3`, `nodejs`, `npm`, `nginx`, `openssl`, `libmagic1`, `poppler-utils`, etc.).
2. Creación del usuario de sistema `markitdown`.
3. Instalación del backend en un entorno virtual Python en `/opt/markitdown-gui`.
4. Compilación del frontend y copia a `/usr/share/markitdown-gui/frontend`.
5. **Generación automática de un certificado SSL autofirmado** en `/etc/nginx/ssl/markitdown-gui/`.
6. Configuración de Nginx para **forzar HTTPS** y activación del virtual host.
7. Creación y arranque del servicio systemd `markitdown-gui`.

Tras la instalación, accede con tu navegador a la IP del contenedor LXC:

```
https://<IP-DEL-LXC>
```

> **Nota importante**: al usar un certificado autofirmado, tu navegador mostrará una advertencia de seguridad. Debes aceptar la excepción o confiar manualmente en el certificado para continuar.

## Actualización

Cuando descargues una nueva versión del código en el LXC:

```bash
cd /root/Markitdown-GUI
chmod +x scripts/update.sh
sudo ./scripts/update.sh
```

Este script reinstala dependencias, recompila el frontend y reinicia el servicio backend. **No sobrescribe los certificados SSL existentes**.

## Configuración y variables de entorno

La configuración sensible se controla a través de variables de entorno en el servicio systemd (`/etc/systemd/system/markitdown-gui.service`):

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Ruta absoluta de la base de datos SQLite | `sqlite:////var/lib/markitdown-gui/data/markitdown.db` |
| `SECRET_KEY` | Clave secreta para firmar JWTs | (ver service file) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token de acceso | `60` |
| `CONVERTED_DIR` | Directorio donde se guardan los archivos `.md` | `/var/lib/markitdown-gui/converted` |

**Importante**: edita `SECRET_KEY` en el fichero de servicio systemd antes de exponer la aplicación en producción:

```bash
sudo systemctl edit --full markitdown-gui
sudo systemctl daemon-reload
sudo systemctl restart markitdown-gui
```

## Certificados SSL

Por defecto, `install.sh` genera un certificado **autofirmado** válido por 365 días en:

- `/etc/nginx/ssl/markitdown-gui/cert.pem`
- `/etc/nginx/ssl/markitdown-gui/key.pem`

Si dispones de un dominio propio, es recomendable sustituirlos por certificados de una CA reconocida (por ejemplo, usando **Let's Encrypt** con `certbot`). Para ello:

1. Obtén los certificados con tu herramienta preferida.
2. Edita `/etc/nginx/sites-available/markitdown-gui` y actualiza las rutas de `ssl_certificate` y `ssl_certificate_key`.
3. Recarga Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

> El script `update.sh` no regenera ni sobrescribe certificados existentes.

## Persistencia de datos

Todos los datos persistentes residen en `/var/lib/markitdown-gui`:

- `/var/lib/markitdown-gui/data/markitdown.db` → Base de datos SQLite (usuarios + historial).
- `/var/lib/markitdown-gui/converted/` → Archivos `.md` generados, organizados por ID de usuario.

Asegúrate de incluir este directorio en tus backups del LXC.

## Desarrollo local (fuera del LXC)

Si deseas trabajar en el código en tu máquina local:

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

El proxy de Vite redirige automáticamente `/api` a `http://localhost:8000`.

## Comandos útiles de administración

```bash
# Ver estado del backend
sudo systemctl status markitdown-gui

# Ver logs del backend en tiempo real
sudo journalctl -u markitdown-gui -f

# Reiniciar backend
sudo systemctl restart markitdown-gui

# Recargar Nginx tras cambios manuales
sudo nginx -t
sudo systemctl reload nginx

# Renovar/regenerar certificado autofirmado (si no usas Let's Encrypt)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/markitdown-gui/key.pem \
  -out /etc/nginx/ssl/markitdown-gui/cert.pem \
  -subj "/CN=markitdown-gui"
sudo nginx -t && sudo systemctl reload nginx
```

## Notas de seguridad

- Cambia obligatoriamente `SECRET_KEY` en producción.
- La aplicación es **multi-usuario**: cada usuario solo accede a su propio historial y archivos convertidos.
- El tráfico HTTP (puerto 80) se redirige automáticamente a HTTPS (puerto 443).
- SQLite opera en modo **WAL**, lo que permite lecturas concurrentes sin bloquear escrituras.
