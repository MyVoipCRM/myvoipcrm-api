# MyVoipCRM API örnekleri

[MyVoipCRM](https://www.myvoipcrm.com/?utm_source=github&utm_medium=repo&utm_campaign=api-examples) External API için
çalışan örnek kodlar. Tam doküman: **https://www.myvoipcrm.com/gelistirici**

*English: sample code for the MyVoipCRM External API (lead pool). Full reference:
https://www.myvoipcrm.com/gelistirici/lead-pool-integration-en*

## Başlamadan önce

- **API anahtarı:** `POST /auth/company-api-key` ile firmanızın yönetici kullanıcısıyla alınır (ayrıntı:
  [External API → Kimlik doğrulama](https://www.myvoipcrm.com/gelistirici/external-api)). Her istekte `X-Api-Key`
  başlığıyla gönderilir.
- **IP izni:** İstek atan sunucunun IP adresi CRM'deki izin listesinde olmalı; değilse `403 IP_NOT_ALLOWED` döner.
- **Temel adres:** `https://externalapi.myvoipcrm.com/api/external/v1`

Anahtarı koda yazmayın; ortam değişkeninden okuyun:

```bash
export MYVOIPCRM_API_KEY="crm_xxxxx"
```

## Örnekler

| Klasör | Ne yapar |
|---|---|
| [`curl/`](curl) | Lead gönderme ve durum sorgulama (cURL) |
| [`node/`](node) | Lead gönderme + `updatedFrom` ile durum takibi (Node.js 18+, bağımlılık yok) |
| [`python/`](python) | Aynı akış, Python 3.9+ ve `requests` |

## Lead havuzu akışı

1. **Lead gönder:** `POST /campaign-leads` — `fullName` zorunlu, diğer alanlar isteğe bağlı. `status` göndermeyin.
2. **CRM'de işlenir:** ekip lead'i işler, iş akışı durumu (`status` 0–10) değişir.
3. **Durumu al:** `GET /campaign-leads?updatedFrom=...` ile 5–15 dakikada bir sorgulayın
   ya da `externalIds=a,b,c` ile sipariş kimliğine göre toplu sorgulayın (istek başına en fazla 100 kimlik).

Aynı `externalId` ile tekrar gönderim yeni kayıt açmaz, mevcut kaydı günceller (`wasUpdated: true`).

### `leadPoolStatus`

| Değer | Anlam |
|---:|---|
| 0 | Geçerli |
| 1 | Geçersiz telefon |
| 2 | Mükerrer (son 5 dakikada aynı ad + telefon + e-posta) |

### Hata kodları

| HTTP | `code` | Ne zaman |
|---|---|---|
| 400 | `FULL_NAME_REQUIRED` / `VALIDATION_FAILED` | Eksik veya geçersiz alan |
| 401 | `INVALID_API_KEY` | `X-Api-Key` hatalı ya da eksik |
| 403 | `IP_NOT_ALLOWED` | Sunucu IP'si izin listesinde değil |
| 409 | `EXTERNAL_ID_CONFLICT` | Aynı `externalId` ile eşzamanlı istek |
| 429 | `RATE_LIMIT_EXCEEDED` | İstek sınırı aşıldı |

## Diğer API'ler

Kişi, ürün/hizmet, kategori, sipariş (`POST /orders/complete` ile tek istekte), teklif, satış, kargo ve WhatsApp şablon
mesajı uçları için: https://www.myvoipcrm.com/gelistirici/external-api

## Lisans

MIT
