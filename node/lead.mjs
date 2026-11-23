// MyVoipCRM lead havuzu örneği — Node.js 18+ (yerleşik fetch, bağımlılık yok).
// Kullanım:
//   MYVOIPCRM_API_KEY=crm_xxxxx node lead.mjs gonder
//   MYVOIPCRM_API_KEY=crm_xxxxx node lead.mjs durum 2026-11-23T09:00:00Z
//   MYVOIPCRM_API_KEY=crm_xxxxx node lead.mjs siparis order-1001,order-1002

const BASE_URL = 'https://externalapi.myvoipcrm.com/api/external/v1';
const API_KEY = process.env.MYVOIPCRM_API_KEY;
if (!API_KEY) {
  console.error('MYVOIPCRM_API_KEY tanımlı değil');
  process.exit(1);
}

async function call(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: { 'X-Api-Key': API_KEY, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    // Hata gövdesi: { success: false, message, code } — ör. IP_NOT_ALLOWED, VALIDATION_FAILED
    throw new Error(`${res.status} ${body.code || ''} ${body.message || ''}`.trim());
  }
  return body.data;
}

// Lead gönderir. Aynı externalId ile tekrar gönderim yeni kayıt açmaz, günceller (wasUpdated: true).
export function sendLead(lead) {
  return call('/campaign-leads', { method: 'POST', body: JSON.stringify(lead) });
}

// updatedFrom'dan bu yana durumu değişen lead'ler (5–15 dakikada bir çağırın; aralık en fazla 90 gün).
export async function* changedLeadsSince(updatedFrom) {
  const updatedTo = new Date().toISOString();
  for (let page = 1; ; page++) {
    const q = new URLSearchParams({ updatedFrom, updatedTo, page: String(page), pageSize: '100' });
    const data = await call('/campaign-leads?' + q);
    yield* data.items;
    if (page >= data.totalPages) break;
  }
}

// Sipariş kimliklerine göre toplu durum (istek başına en fazla 100 kimlik).
export async function leadsByExternalIds(ids) {
  const q = new URLSearchParams({ externalIds: ids.join(','), pageSize: '100' });
  return (await call('/campaign-leads?' + q)).items;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'gonder') {
  const lead = await sendLead({
    fullName: 'Ahmet Yılmaz',
    phoneNumber1: '5321234567',
    dialCode1: '+90',
    countryCode1: 'tr',
    email: 'ahmet@example.com',
    leadSource: 'Web formu',
    externalId: 'form-8842',
    leadPriority: 2,
  });
  console.log(`lead #${lead.id} — ${lead.leadPoolStatusDisplay}, güncelleme: ${lead.wasUpdated}`);
} else if (cmd === 'durum') {
  const since = arg || new Date(Date.now() - 15 * 60 * 1000).toISOString();
  for await (const l of changedLeadsSince(since)) {
    console.log(`${l.externalId ?? l.id}\t${l.statusDisplayName}\t${l.updatedAt}`);
  }
} else if (cmd === 'siparis') {
  for (const l of await leadsByExternalIds((arg || '').split(',').filter(Boolean))) {
    console.log(`${l.externalId}\t${l.statusDisplayName}`);
  }
} else {
  console.log('Komutlar: gonder | durum [updatedFrom] | siparis id1,id2');
}
