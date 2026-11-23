#!/usr/bin/env bash
# MyVoipCRM lead havuzuna lead gönderir.
# Kullanım: MYVOIPCRM_API_KEY=crm_xxxxx ./lead-gonder.sh
set -euo pipefail

BASE_URL="https://externalapi.myvoipcrm.com/api/external/v1"

curl -sS -X POST "$BASE_URL/campaign-leads" \
  -H "X-Api-Key: ${MYVOIPCRM_API_KEY:?MYVOIPCRM_API_KEY tanımlı değil}" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmet Yılmaz",
    "phoneNumber1": "5321234567",
    "dialCode1": "+90",
    "countryCode1": "tr",
    "email": "ahmet@example.com",
    "leadSource": "Web formu",
    "externalId": "form-8842",
    "leadPriority": 2,
    "tags": ["sıcak"],
    "commercialDescription": "Demo talep etti"
  }'
echo
