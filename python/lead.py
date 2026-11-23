"""MyVoipCRM lead havuzu örneği — Python 3.9+, `pip install requests`.

Kullanım:
    MYVOIPCRM_API_KEY=crm_xxxxx python lead.py gonder
    MYVOIPCRM_API_KEY=crm_xxxxx python lead.py durum 2026-11-23T09:00:00Z
    MYVOIPCRM_API_KEY=crm_xxxxx python lead.py siparis order-1001,order-1002
"""
import os
import sys
from datetime import datetime, timedelta, timezone

import requests

BASE_URL = "https://externalapi.myvoipcrm.com/api/external/v1"
API_KEY = os.environ.get("MYVOIPCRM_API_KEY") or sys.exit("MYVOIPCRM_API_KEY tanımlı değil")
session = requests.Session()
session.headers.update({"X-Api-Key": API_KEY})


def call(method, path, **kwargs):
    res = session.request(method, BASE_URL + path, timeout=30, **kwargs)
    try:
        body = res.json()
    except ValueError:
        body = {}
    if not res.ok or body.get("success") is False:
        # Hata gövdesi: {"success": false, "message": ..., "code": ...}
        raise RuntimeError(f"{res.status_code} {body.get('code', '')} {body.get('message', '')}".strip())
    return body.get("data")


def send_lead(lead):
    """Lead gönderir. Aynı externalId ile tekrar gönderim günceller (wasUpdated=True)."""
    return call("POST", "/campaign-leads", json=lead)


def changed_leads_since(updated_from):
    """updated_from'dan bu yana durumu değişen lead'ler. 5–15 dakikada bir çağırın; aralık en fazla 90 gün."""
    updated_to = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    page = 1
    while True:
        data = call("GET", "/campaign-leads", params={
            "updatedFrom": updated_from, "updatedTo": updated_to, "page": page, "pageSize": 100})
        yield from data["items"]
        if page >= data["totalPages"]:
            break
        page += 1


def leads_by_external_ids(ids):
    """Sipariş kimliklerine göre toplu durum (istek başına en fazla 100 kimlik)."""
    return call("GET", "/campaign-leads", params={"externalIds": ",".join(ids), "pageSize": 100})["items"]


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    arg = sys.argv[2] if len(sys.argv) > 2 else ""
    if cmd == "gonder":
        lead = send_lead({
            "fullName": "Ahmet Yılmaz",
            "phoneNumber1": "5321234567",
            "dialCode1": "+90",
            "countryCode1": "tr",
            "email": "ahmet@example.com",
            "leadSource": "Web formu",
            "externalId": "form-8842",
            "leadPriority": 2,
        })
        print(f"lead #{lead['id']} — {lead['leadPoolStatusDisplay']}, güncelleme: {lead['wasUpdated']}")
    elif cmd == "durum":
        since = arg or (datetime.now(timezone.utc) - timedelta(minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ")
        for l in changed_leads_since(since):
            print(f"{l.get('externalId') or l['id']}\t{l['statusDisplayName']}\t{l['updatedAt']}")
    elif cmd == "siparis":
        for l in leads_by_external_ids([x for x in arg.split(",") if x]):
            print(f"{l['externalId']}\t{l['statusDisplayName']}")
    else:
        print("Komutlar: gonder | durum [updatedFrom] | siparis id1,id2")
