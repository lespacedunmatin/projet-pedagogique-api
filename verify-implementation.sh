#!/bin/bash

# Script de vérification complète de l'implémentation BD
# Vérifie que tous les fichiers sont en place et que le code compile

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Vérification de l'implémentation de la BD - Phase 1  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MANQUANT)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (MANQUANT)"
        return 1
    fi
}

# Compteurs
total=0
checked=0

echo -e "${BLUE}1. Fichiers TypeScript${NC}"
check_file "src/database/config.ts" && ((checked++)) ; ((total++))
check_file "src/database/init.ts" && ((checked++)) ; ((total++))
check_file "src/database/index.ts" && ((checked++)) ; ((total++))
check_file "src/models/Animateur.ts" && ((checked++)) ; ((total++))
check_file "src/models/index.ts" && ((checked++)) ; ((total++))
echo ""

echo -e "${BLUE}2. Fichiers de configuration${NC}"
check_file ".env" && ((checked++)) ; ((total++))
check_file ".env.example" && ((checked++)) ; ((total++))
check_file "init-db.sh" && ((checked++)) ; ((total++))
echo ""

echo -e "${BLUE}3. Fichiers de documentation${NC}"
check_file "README_DATABASE.md" && ((checked++)) ; ((total++))
check_file "DATABASE_SETUP.md" && ((checked++)) ; ((total++))
check_file "NOTES_DATABASE.md" && ((checked++)) ; ((total++))
check_file "FINAL_SUMMARY.md" && ((checked++)) ; ((total++))
check_file "DOCUMENTATION_INDEX.md" && ((checked++)) ; ((total++))
check_file "IMPLEMENTATION_SUMMARY.md" && ((checked++)) ; ((total++))
check_file "CHECKLIST_VALIDATION.md" && ((checked++)) ; ((total++))
check_file "FILE_CONTENTS_OVERVIEW.md" && ((checked++)) ; ((total++))
check_file "START_HERE.md" && ((checked++)) ; ((total++))
echo ""

echo -e "${BLUE}4. Fichiers SQL${NC}"
check_file "sql/01_init_database.sql" && ((checked++)) ; ((total++))
echo ""

echo -e "${BLUE}5. Répertoires${NC}"
check_dir "src/database" && ((checked++)) ; ((total++))
check_dir "src/models" && ((checked++)) ; ((total++))
check_dir "sql" && ((checked++)) ; ((total++))
echo ""

# Compilation
echo -e "${BLUE}6. Compilation TypeScript${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Compilation réussie"
    ((checked++))
else
    echo -e "${RED}✗${NC} Erreur de compilation"
fi
((total++))
echo ""

echo -e "${BLUE}7. Fichiers compilés${NC}"
check_file "dist/database/config.js" && ((checked++)) ; ((total++))
check_file "dist/database/init.js" && ((checked++)) ; ((total++))
check_file "dist/models/Animateur.js" && ((checked++)) ; ((total++))
echo ""

# Contenu .env
echo -e "${BLUE}8. Configuration .env${NC}"
if grep -q "DB_HOST=localhost" .env; then
    echo -e "${GREEN}✓${NC} DB_HOST configuré"
    ((checked++))
else
    echo -e "${RED}✗${NC} DB_HOST non configuré"
fi
((total++))

if grep -q "DB_NAME=projet_pedagogique" .env; then
    echo -e "${GREEN}✓${NC} DB_NAME configuré"
    ((checked++))
else
    echo -e "${RED}✗${NC} DB_NAME non configuré"
fi
((total++))

if grep -q "NODE_ENV=development" .env; then
    echo -e "${GREEN}✓${NC} NODE_ENV configuré"
    ((checked++))
else
    echo -e "${RED}✗${NC} NODE_ENV non configuré"
fi
((total++))
echo ""

# package.json
echo -e "${BLUE}9. Configuration package.json${NC}"
if grep -q '"db:init"' package.json; then
    echo -e "${GREEN}✓${NC} Script 'db:init' configuré"
    ((checked++))
else
    echo -e "${RED}✗${NC} Script 'db:init' non configuré"
fi
((total++))

if grep -q '"@types/node"' package.json; then
    echo -e "${GREEN}✓${NC} Dépendance '@types/node' configurée"
    ((checked++))
else
    echo -e "${RED}✗${NC} Dépendance '@types/node' manquante"
fi
((total++))
echo ""

# Résumé
echo "╔════════════════════════════════════════════════════════╗"
percentage=$((checked * 100 / total))
if [ "$percentage" -eq 100 ]; then
    echo -e "║  ${GREEN}RÉSULTAT: $checked/$total vérifications réussies${NC}      ║"
else
    echo -e "║  RÉSULTAT: $checked/$total vérifications réussies ($percentage%)  ║"
fi
echo "╚════════════════════════════════════════════════════════╝"
echo ""

if [ "$checked" -eq "$total" ]; then
    echo -e "${GREEN}✓ TOUT EST EN ORDRE - PRÊT À DÉMARRER${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Installer MariaDB:  brew install mariadb && brew services start mariadb"
    echo "2. Initialiser la BD:  npm run db:init"
    echo "3. Vérifier:           mysql -u app_projet_peda -p projet_pedagogique"
    echo ""
    exit 0
else
    echo -e "${RED}✗ CERTAINS ÉLÉMENTS SONT MANQUANTS${NC}"
    echo ""
    exit 1
fi
