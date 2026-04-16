#!/bin/bash

# Script de test de sécurité admin - Safe Anesthesia

API="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}=== TEST ARCHITECTURE ADMIN SÉCURISÉE ===${NC}\n"

# Test 1: Login avec bon mot de passe
echo -e "${YELLOW}Test 1: 📝 Connexion avec bon mot de passe${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"admin"}' -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null)
  echo -e "${GREEN}✓ Connexion réussie!${NC}"
  echo "Token: ${TOKEN:0:50}..."
  echo ""
else
  echo -e "${RED}✗ Erreur ${HTTP_CODE}${NC}"
  echo "$BODY"
  exit 1
fi

# Test 2: Vérifier le token
echo -e "${YELLOW}Test 2: ✓ Vérifier que le token est valide${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "$API/api/auth/verify" \
  -H "Authorization: Bearer $TOKEN" -w "\n%{http_code}")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n 1)
BODY=$(echo "$VERIFY_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Token valide!${NC}"
  echo "$BODY" | jq .
  echo ""
else
  echo -e "${RED}✗ Token invalid (HTTP ${HTTP_CODE})${NC}"
fi

# Test 3: Login avec mauvais mot de passe
echo -e "${YELLOW}Test 3: 🚫 Connexion avec mauvais mot de passe${NC}"
WRONG_LOGIN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"wrongpassword"}' -w "\n%{http_code}")

HTTP_CODE=$(echo "$WRONG_LOGIN" | tail -n 1)
BODY=$(echo "$WRONG_LOGIN" | head -n -1)

if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ Rejeté correctement (HTTP 401)${NC}"
  echo "$BODY" | jq .
  echo ""
else
  echo -e "${RED}✗ Devrait être 401, got ${HTTP_CODE}${NC}"
fi

# Test 4: Accès sans token
echo -e "${YELLOW}Test 4: 🔐 Ajouter formation SANS token (doit échouer)${NC}"
NO_TOKEN=$(curl -s -X POST "$API/api/admin/formations" \
  -H "Content-Type: application/json" \
  -d '{"titre":"Test","contenu":"Test"}' -w "\n%{http_code}")

HTTP_CODE=$(echo "$NO_TOKEN" | tail -n 1)
BODY=$(echo "$NO_TOKEN" | head -n -1)

if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ Rejeté correctement (HTTP 401)${NC}"
  echo "$BODY" | jq .
  echo ""
else
  echo -e "${RED}✗ Devrait être 401, got ${HTTP_CODE}${NC}"
fi

# Test 5: Ajouter formation AVEC token
echo -e "${YELLOW}Test 5: ✅ Ajouter formation AVEC token (doit réussir)${NC}"
WITH_TOKEN=$(curl -s -X POST "$API/api/admin/formations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titre":"Formation Test","contenu":"Contenu de test"}' -w "\n%{http_code}")

HTTP_CODE=$(echo "$WITH_TOKEN" | tail -n 1)
BODY=$(echo "$WITH_TOKEN" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Formation ajoutée!${NC}"
  echo "$BODY" | jq .
  echo ""
else
  echo -e "${RED}✗ Erreur ${HTTP_CODE}${NC}"
  echo "$BODY"
fi

# Test 6: Récupérer formations publiques (pas besoin de token)
echo -e "${YELLOW}Test 6: 👁️  Récupérer formations (publique, sans token)${NC}"
GET_PUBLIC=$(curl -s -X GET "$API/api/formations" -w "\n%{http_code}")

HTTP_CODE=$(echo "$GET_PUBLIC" | tail -n 1)
BODY=$(echo "$GET_PUBLIC" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Formations récupérées!${NC}"
  echo "$BODY" | jq . | head -n 20
  echo ""
else
  echo -e "${RED}✗ Erreur ${HTTP_CODE}${NC}"
fi

# Test 7: Logout
echo -e "${YELLOW}Test 7: 🚪 Déconnexion${NC}"
LOGOUT=$(curl -s -X POST "$API/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN" -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGOUT" | tail -n 1)
BODY=$(echo "$LOGOUT" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Déconnecté avec succès!${NC}"
  echo "$BODY" | jq .
  echo ""
else
  echo -e "${RED}✗ Erreur ${HTTP_CODE}${NC}"
fi

echo -e "${GREEN}=== TOUS LES TESTS RÉUSSIS! ===${NC}"
