#!/bin/bash

# === Configuration ===
USER="ton-identifiant-ssh"
HOST="sshXXX.infomaniak.com"
REMOTE_DIR="sites/TON_SITE"
PASSWORD="TON_MOT_DE_PASSE" # stocké localement
LOCAL_DIR="public"

# === Étapes ===

echo "🔧 Génération du site Hugo..."
hugo --cleanDestinationDir

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build Hugo."
  exit 1
fi

echo "🚀 Déploiement via rsync vers Infomaniak..."
sshpass -p "$PASSWORD" rsync -avz --delete \
  --exclude=".gitignore" \
  --exclude="config.mail.example.php" \
  "$LOCAL_DIR"/ "$USER@$HOST:$REMOTE_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Déploiement réussi sur ton serveur"
else
  echo "❌ Échec du déploiement."
  exit 1
fi