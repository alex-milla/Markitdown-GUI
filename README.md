# MarkItDown GUI

**Version 1.0**

A full-stack web interface for [Microsoft MarkItDown](https://github.com/microsoft/markitdown). It allows you to convert documents to Markdown directly from your browser, with user authentication, conversion history tracking, and result downloads.

Designed for **native deployment** inside an LXC container running Ubuntu 25.x (Proxmox, etc.). No Docker required.

---

## What it does

- **Drag & drop** file conversion to Markdown
- **Multi-user** support with JWT authentication
- **Conversion history** with manual delete and download
- **One-click upgrade** from GitHub (checks for changes before updating)
- **HTTPS-only** access with a self-signed certificate by default

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| OS | Ubuntu 25.04 (LXC) |
| Web Server | Nginx with forced HTTPS |
| Backend API | FastAPI + Uvicorn |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Database | SQLite (WAL mode) |
| Process Manager | systemd |
| Document Engine | Microsoft MarkItDown |

---

## Installation

Prerequisites inside the LXC:

- Ubuntu 25.04 (or 24.04/25.10)
- Root or sudo access
- Internet connection
- Project cloned/copied inside the LXC (e.g. `/root/Markitdown-GUI`)

Run the installer:

```bash
cd /root/Markitdown-GUI
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

The installer will automatically:

1. Install system dependencies (`python3`, `nodejs`, `npm`, `nginx`, `openssl`, `libmagic1`, `poppler-utils`, etc.).
2. Create the `markitdown` system user.
3. Install the backend inside a Python virtual environment at `/opt/markitdown-gui`.
4. Build the frontend and copy it to `/usr/share/markitdown-gui/frontend`.
5. Generate a **self-signed SSL certificate** at `/etc/nginx/ssl/markitdown-gui/`.
6. Configure Nginx to **force HTTPS** and enable the virtual host.
7. Create and start the `markitdown-gui` systemd service.
8. Set up a cron-based auto-upgrade system from GitHub.

After installation, open your browser at:

```
https://<LXC-IP>
```

> **Note:** Because the certificate is self-signed, your browser will show a security warning. Accept the exception or manually trust the certificate to continue.

---

## Update

When a new version is available on GitHub, click the **"Upgrade from GitHub"** button in the Admin Panel. The system checks for real changes before scheduling the update, so it won't recompile unnecessarily when you are already on the latest version.

Alternatively, you can trigger it manually from the LXC:

```bash
cd /root/Markitdown-GUI
sudo ./scripts/update.sh
```

This script reinstalls dependencies, rebuilds the frontend, updates the systemd service if needed, and restarts the backend. **Existing SSL certificates are preserved.**

---

## Configuration

Sensitive configuration is handled via environment variables in the systemd service file (`/etc/systemd/system/markitdown-gui.service`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Absolute path to the SQLite database | `sqlite:////var/lib/markitdown-gui/data/markitdown.db` |
| `SECRET_KEY` | Secret key for signing JWTs | (see service file) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `60` |
| `CONVERTED_DIR` | Directory for generated `.md` files | `/var/lib/markitdown-gui/converted` |

> **Important:** Edit `SECRET_KEY` in the systemd service file before exposing the app in production.

---

## Useful Admin Commands

```bash
# Check backend status
sudo systemctl status markitdown-gui

# View real-time backend logs
sudo journalctl -u markitdown-gui -f

# Restart backend
sudo systemctl restart markitdown-gui

# Reload Nginx after manual changes
sudo nginx -t
sudo systemctl reload nginx
```

---

## License

This project is **free to distribute and modify**, but **you must mention the original author** in any derivative work.

---

## Author

**Alex Millà**

- Website: [alexmilla.dev](https://alexmilla.dev)
