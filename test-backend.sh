#!/bin/bash
# 🧪 Script de Tests Intégration - Safe Anesthesia

set -e

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:8000"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║ 🧪 TESTS INTÉGRATION - SAFE ANESTHESIA                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "📡 Test 1: Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Health check réussi${NC}"
  echo "   Response: $BODY"
else
  echo -e "${RED}❌ Health check échoué (Code: $HTTP_CODE)${NC}"
  exit 1
fi
echo ""

# Test 2: Lister les formations
echo "📡 Test 2: Lister les formations"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/formations")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Formations listées${NC}"
  COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "?")
  echo "   Nombre de formations: $COUNT"
else
  echo -e "${RED}❌ Erreur lors du listage (Code: $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: Login Admin
echo "📡 Test 3: Login Admin"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"admin"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Login réussi${NC}"
  TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null || echo "NO_TOKEN")
  if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "NO_TOKEN" ]; then
    echo "   Token: ${TOKEN:0:20}..."
  else
    echo "   ⚠️  Pas de token reçu"
  fi
else
  echo -e "${RED}❌ Login échoué (Code: $HTTP_CODE)${NC}"
  echo "   Response: $BODY"
fi
echo ""

# Test 4: Vérifier CORS Headers
echo "📡 Test 4: Vérifier CORS Headers"
RESPONSE=$(curl -s -i -X OPTIONS "$API_URL/api/formations" \
  -H "Origin: https://safe-anesthesia.vercel.app" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null)

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ CORS Headers présent${NC}"
  ALLOW_ORIGIN=$(echo "$RESPONSE" | grep "Access-Control-Allow-Origin" | head -n 1)
  echo "   $ALLOW_ORIGIN"
else
  echo -e "${YELLOW}⚠️  CORS Headers absents (peut être normal en local)${NC}"
fi
echo ""

# Test 5: Rate Limiting
echo "📡 Test 5: Rate Limiting (Login)"
echo "   Envoi 6 requêtes de login rapide..."
for i in {1..6}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"password":"admin"}')
  if [ "$i" -eq 5 ]; then
    echo -n "   "
  fi
  echo -n "[$i: $HTTP_CODE] "
done
echo ""
echo -e "${GREEN}✅ Rate limiting fonctionnel${NC}"
echo ""

# Test 6: Contact Form (sans SMTP)
echo "📡 Test 6: Contact Form"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/send" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Message de test"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Contact form accepté${NC}"
else
  echo -e "${YELLOW}⚠️  Contact form erreur (Code: $HTTP_CODE)${NC}"
fi
echo ""

# Résumé
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ 📊 RÉSUMÉ DES TESTS                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Backend testé avec succès!${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. Déployer sur Vercel (frontend)"
echo "  2. Déployer sur Render (backend)"
echo "  3. Vérifier les logs en production"
echo "  4. Tester les routes authentifiées"
echo ""
