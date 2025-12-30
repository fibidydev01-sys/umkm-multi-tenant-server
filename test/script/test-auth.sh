#!/bin/bash

# Warna untuk output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000/api"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🧪 TESTING AUTH MODULE${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# 1. Test Register
echo -e "${YELLOW}📝 Test 1: Register New Tenant${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tokoauto",
    "name": "Toko Auto Test",
    "category": "WARUNG_KELONTONG",
    "email": "autotest@example.com",
    "password": "password123",
    "whatsapp": "6281234567888"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✅ Register Success${NC}"
  echo "$REGISTER_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Register Failed${NC}"
  echo "$REGISTER_RESPONSE" | jq '.'
fi
echo ""

# 2. Test Login
echo -e "${YELLOW}🔐 Test 2: Login with Seeded Data${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tokosari@fibidy.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✅ Login Success${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
  echo "$LOGIN_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Login Failed${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi
echo ""

# 3. Test Me (Protected Route)
echo -e "${YELLOW}👤 Test 3: Get Current User (Protected)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "slug"; then
  echo -e "${GREEN}✅ Get Me Success${NC}"
  echo "$ME_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Get Me Failed${NC}"
  echo "$ME_RESPONSE" | jq '.'
fi
echo ""

# 4. Test Invalid Token
echo -e "${YELLOW}🚫 Test 4: Access with Invalid Token${NC}"
INVALID_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer invalid-token-12345")

if echo "$INVALID_RESPONSE" | grep -q "Unauthorized"; then
  echo -e "${GREEN}✅ Correctly Rejected Invalid Token${NC}"
  echo "$INVALID_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Should Reject Invalid Token${NC}"
  echo "$INVALID_RESPONSE" | jq '.'
fi
echo ""

# 5. Test Validation Errors
echo -e "${YELLOW}⚠️  Test 5: Validation Errors${NC}"
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "AB",
    "name": "T",
    "category": "",
    "email": "invalid-email",
    "password": "123",
    "whatsapp": "08123"
  }')

if echo "$VALIDATION_RESPONSE" | grep -q "Bad Request"; then
  echo -e "${GREEN}✅ Validation Works Correctly${NC}"
  echo "$VALIDATION_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Validation Should Fail${NC}"
  echo "$VALIDATION_RESPONSE" | jq '.'
fi
echo ""

# 6. Test Duplicate Email
echo -e "${YELLOW}🔄 Test 6: Duplicate Email${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tokotest2",
    "name": "Toko Test 2",
    "category": "WARUNG_KELONTONG",
    "email": "tokosari@fibidy.com",
    "password": "password123",
    "whatsapp": "6281234567777"
  }')

if echo "$DUPLICATE_RESPONSE" | grep -q "sudah terdaftar"; then
  echo -e "${GREEN}✅ Correctly Rejected Duplicate Email${NC}"
  echo "$DUPLICATE_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Should Reject Duplicate Email${NC}"
  echo "$DUPLICATE_RESPONSE" | jq '.'
fi
echo ""

# 7. Test Wrong Password
echo -e "${YELLOW}🔒 Test 7: Wrong Password${NC}"
WRONG_PASSWORD_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tokosari@fibidy.com",
    "password": "wrongpassword"
  }')

if echo "$WRONG_PASSWORD_RESPONSE" | grep -q "401\|Unauthorized"; then
  echo -e "${GREEN}✅ Correctly Rejected Wrong Password${NC}"
  echo "$WRONG_PASSWORD_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Should Reject Wrong Password${NC}"
  echo "$WRONG_PASSWORD_RESPONSE" | jq '.'
fi
echo ""

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}✨ ALL TESTS COMPLETED!${NC}"
echo -e "${BLUE}=====================================${NC}"