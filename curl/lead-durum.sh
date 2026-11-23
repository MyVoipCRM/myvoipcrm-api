#!/usr/bin/env bash
# Son 15 dakikada durumu değişen lead'leri listeler (polling).
# Sipariş kimliğine göre sorgu için: ?externalIds=order-1001,order-1002&pageSize=100
# Kullanım: MYVOIPCRM_API_KEY=crm_xxxxx ./lead-durum.sh
set -euo pipefail

BASE_URL="https://externalapi.myvoipcrm.com/api/external/v1"
FROM=$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-15M +%Y-%m-%dT%H:%M:%SZ)
TO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -sS "$BASE_URL/campaign-leads?updatedFrom=$FROM&updatedTo=$TO&page=1&pageSize=50" \
  -H "X-Api-Key: ${MYVOIPCRM_API_KEY:?MYVOIPCRM_API_KEY tanımlı değil}"
echo
