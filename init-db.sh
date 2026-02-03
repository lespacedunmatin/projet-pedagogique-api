#!/bin/bash

# Script d'aide pour initialiser la base de données

set -e

echo "==================================="
echo "Initialisation de la base de données"
echo "==================================="
echo ""

# Vérifier que les dépendances npm sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances npm…"
    npm install
fi

# Compiler le TypeScript
echo ""
echo "🔨 Compilation du TypeScript…"
npm run build

# Lancer le script d'initialisation
echo ""
echo "💾 Initialisation de la base de données…"
node dist/database/init.js

echo ""
echo "✅ Initialisation terminée !"
echo ""
echo "Vous pouvez maintenant :"
echo "  1. Vérifier les données : mysql -u app_projet_peda -p projet_pedagogique"
echo "  2. Démarrer le serveur : npm start"
echo ""
