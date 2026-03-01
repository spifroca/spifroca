#!/bin/bash
# ─── spifroca: Lokal bauen & für Synology exportieren ─────────────────────
echo "🔨 Schritt 1: Docker Image lokal bauen..."
docker build -f Dockerfile.synology -t spifroca-app:latest .

echo ""
echo "📦 Schritt 2: Image exportieren..."
docker save spifroca-app:latest | gzip > spifroca-app-image.tar.gz

echo ""
echo "✅ Fertig! Datei: spifroca-app-image.tar.gz"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. spifroca-app-image.tar.gz auf das NAS kopieren (z.B. nach /docker/spifroca/)"
echo "   2. Synology Container Manager → Image → Import → Datei auswählen"
echo "   3. compose.yml anpassen: 'build:' ersetzen mit 'image: spifroca-app:latest'"
echo "   4. Project in Container Manager erstellen"
