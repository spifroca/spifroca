# spifroca – Bauprojektmanagement Web App

Webbasierte Bauprojektmanagement-Software entwickelt von **Spiderfrog AG**.  
Gebaut mit **Next.js 14**, **PostgreSQL**, **Prisma** und **Docker**.

[![Deploy](https://github.com/DEIN-GITHUB-USERNAME/spifroca/actions/workflows/deploy.yml/badge.svg)](https://github.com/DEIN-GITHUB-USERNAME/spifroca/actions/workflows/deploy.yml)

---

## 🔄 Workflow

```
Code ändern → git push → GitHub Actions baut Image → NAS deployed automatisch
```

---

## 🚀 Einmaliges Setup

### 1. GitHub Repository erstellen
```bash
git init
git add .
git commit -m "Initial commit: spifroca"
git remote add origin https://github.com/DEIN-USERNAME/spifroca.git
git push -u origin main
```

### 2. GitHub Secrets setzen
GitHub → Repository → Settings → Secrets → Actions → New secret:

| Secret | Wert |
|---|---|
| `NAS_HOST` | IP deines NAS z.B. `192.168.1.100` |
| `NAS_USER` | Synology Benutzername z.B. `admin` |
| `NAS_PASSWORD` | Synology Passwort |
| `NAS_SSH_PORT` | `22` |

### 3. compose-live.yml auf NAS anpassen
```yaml
# DEIN-GITHUB-USERNAME ersetzen:
image: ghcr.io/DEIN-GITHUB-USERNAME/spifroca-app:latest

# NAS-IP ersetzen:
NEXTAUTH_URL: http://192.168.1.100:3000
```

### 4. NAS vorbereiten
```bash
# SSH auf NAS:
ssh admin@192.168.1.100

# Ordner erstellen:
mkdir -p /volume1/docker/spifroca

# compose-live.yml hochladen (via File Station)
# .env Datei erstellen (via File Station)
```

### 5. Ersten Deploy auslösen
```bash
git push origin main
```
→ GitHub Actions startet automatisch → Image wird gebaut → NAS deployed ✅

---

## 📁 Projektstruktur

```
spifroca/
├── .github/
│   └── workflows/
│       ├── deploy.yml        # Automatisches Deployment bei push
│       └── pr-check.yml      # Code-Prüfung bei Pull Requests
├── src/
│   ├── app/
│   │   ├── auth/login/       # Login-Seite
│   │   ├── dashboard/        # Alle Module
│   │   └── api/auth/         # NextAuth API
│   ├── components/layout/    # Sidebar, Topbar
│   └── lib/                  # Prisma, Auth Konfiguration
├── prisma/
│   ├── schema.prisma         # Datenbankschema
│   └── seed.ts               # Demo-Daten
├── compose.yml               # Lokal / Entwicklung
├── compose-live.yml          # NAS Produktion (ghcr.io Image)
├── compose-prebuilt.yml      # NAS ohne CI/CD
├── Dockerfile.synology       # Optimiertes Dockerfile
└── .env.example              # Umgebungsvariablen Vorlage
```

---

## 👤 Demo-Zugänge

| E-Mail | Passwort | Rolle |
|---|---|---|
| admin@spiderfrog.ch | Admin123! | Administrator |
| leiter@spiderfrog.ch | Leiter123! | Projektleiter |
| controlling@spiderfrog.ch | Control123! | Controlling |
| planer@extern.ch | Planer123! | Externer Planer |

---

## 🛠️ Lokale Entwicklung

```bash
# .env erstellen
cp .env.example .env

# Mit Docker starten
docker compose up -d

# Datenbank initialisieren
docker compose exec app npx prisma migrate dev
docker compose exec app npm run db:seed

# App öffnen
open http://localhost:3000
```

---

## 🔒 Sicherheit

- `.env` ist in `.gitignore` → wird **nie** auf GitHub gepusht
- Passwörter und Secrets nur als GitHub Secrets hinterlegen
- Image in GitHub Container Registry (privat möglich)
- Alle Logins werden im Audit-Log gespeichert
