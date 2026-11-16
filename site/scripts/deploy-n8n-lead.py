"""
Deploy the "ORA 60A — Lead form → Telegram" workflow to the VPS n8n (https://n8n.erythro.ai).

  Webhook POST /webhook/ora-lead  (Header Auth: X-Webhook-Secret = LEAD_WEBHOOK_SECRET)
    → Code: format the lead
    → Telegram sendMessage (same bot + chat as the Marketing Digest workflow; token is read from that live workflow)

Usage (reads VPS_PASSWORD from C:/dev/erythro-ai/.env*, never prints secrets):
  set LEAD_WEBHOOK_SECRET=...
  py -3 site/scripts/deploy-n8n-lead.py
Re-running updates the same workflow / credential (stable ids).
"""
from __future__ import annotations

import json
import os
import time
import urllib.request
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ERY = Path("C:/dev/erythro-ai")
for f in (".env.local", ".env"):
    load_dotenv(ERY / f)

HOST = os.environ.get("VPS_HOST", "46.202.155.56")
USER = os.environ.get("VPS_USER", "root")
PASSWORD = os.environ.get("VPS_PASSWORD")
SECRET = (os.environ.get("LEAD_WEBHOOK_SECRET") or "").strip()

WF_ID = "ora60a-lead-form"
CRED_ID = "ora60aLeadSecret01"
CRED_NAME = "ORA 60A lead webhook secret"
DIGEST_WF = "ai-marketing-copilot"   # its Telegram node holds the bot token + chat id
PATH = "ora-lead"

FORMAT_JS = r"""
const b = $json.body || {};
// sent with parse_mode HTML: escape user input so "_", "*", "<" never break the message
const esc = (s) => String(s).slice(0, 1500).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const line = (k, v) => (v ? `<b>${k}:</b> ${esc(v)}` : null);
const text = [
  '🕰 <b>ORA 60A — новая заявка с сайта</b>',
  '',
  line('Имя', b.name),
  line('Email', b.email),
  line('Сообщение', b.message),
  '',
  line('Язык', b.lang),
  line('Источник', b.source || 'прямой заход'),
  line('Страница', b.page),
  line('Время', b.createdAt),
].filter((x) => x !== null).join('\n');
return [{ json: { text: text.slice(0, 4000) } }];
"""


def sh(c: paramiko.SSHClient, cmd: str) -> str:
    _, out, err = c.exec_command(cmd)
    code = out.channel.recv_exit_status()
    o, e = out.read().decode(), err.read().decode()
    if code:
        raise RuntimeError(f"failed ({code}): {cmd.split('&&')[0][:120]}\n{(e or o)[-800:]}")
    return o


def main() -> None:
    if not PASSWORD:
        raise SystemExit("VPS_PASSWORD not found")
    if len(SECRET) < 16:
        raise SystemExit("Set LEAD_WEBHOOK_SECRET (16+ chars)")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = c.open_sftp()
    tmp = "/tmp/ora-lead-import"
    sh(c, f"mkdir -p {tmp} && chmod 700 {tmp}")

    # 1. Telegram URL + chat id from the live digest workflow
    sh(c, f"docker exec -u node n8n n8n export:workflow --id={DIGEST_WF} --output=/tmp/digest.json "
          f"&& docker cp n8n:/tmp/digest.json {tmp}/digest.json && docker exec -u root n8n rm -f /tmp/digest.json")
    with sftp.open(f"{tmp}/digest.json") as fh:
        dig = json.loads(fh.read().decode())
    dig = dig[0] if isinstance(dig, list) else dig
    tg = next(n for n in dig["nodes"] if n["type"] == "n8n-nodes-base.telegram")
    tg_cred = tg["credentials"]["telegramApi"]
    chat_id = str(tg["parameters"]["chatId"])
    print(f"[n8n] telegram node found: credential '{tg_cred['name']}', chat_id={chat_id}")

    # 2. credential (header auth)
    creds = [{"id": CRED_ID, "name": CRED_NAME, "type": "httpHeaderAuth",
              "data": {"name": "X-Webhook-Secret", "value": SECRET}}]
    # 3. workflow
    wf = {
        "id": WF_ID,
        "name": "ORA 60A — Lead form → Telegram",
        "active": False,
        "settings": {"executionOrder": "v1"},
        "connections": {
            "Lead webhook": {"main": [[{"node": "Format lead", "type": "main", "index": 0}]]},
            "Format lead": {"main": [[{"node": "Send to Telegram", "type": "main", "index": 0}]]},
        },
        "nodes": [
            {"id": "a1", "name": "Lead webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 2,
             "position": [0, 0], "webhookId": "ora60a-lead-form-hook",
             "parameters": {"httpMethod": "POST", "path": PATH, "authentication": "headerAuth",
                            "responseMode": "onReceived", "options": {}},
             "credentials": {"httpHeaderAuth": {"id": CRED_ID, "name": CRED_NAME}}},
            {"id": "a2", "name": "Format lead", "type": "n8n-nodes-base.code", "typeVersion": 2,
             "position": [240, 0], "parameters": {"jsCode": FORMAT_JS}},
            {"id": "a3", "name": "Send to Telegram", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2,
             "position": [480, 0],
             "parameters": {"operation": "sendMessage", "chatId": chat_id, "text": "={{ $json.text }}",
                            "additionalFields": {"appendAttribution": False, "disable_web_page_preview": True,
                                                 "parse_mode": "HTML"}},
             "credentials": {"telegramApi": {"id": tg_cred["id"], "name": tg_cred["name"]}}},
        ],
    }
    for name, data in (("credentials.json", creds), ("workflow.json", [wf])):
        with sftp.open(f"{tmp}/{name}", "w") as fh:
            fh.write(json.dumps(data, ensure_ascii=False))
    print("[n8n] import credential + workflow")
    sh(c, f"docker cp {tmp}/credentials.json n8n:/tmp/ora-cred.json && docker cp {tmp}/workflow.json n8n:/tmp/ora-wf.json "
          "&& docker exec -u node n8n n8n import:credentials --input=/tmp/ora-cred.json "
          "&& docker exec -u node n8n n8n import:workflow --input=/tmp/ora-wf.json "
          "&& docker exec -u root n8n rm -f /tmp/ora-cred.json /tmp/ora-wf.json")
    sh(c, f"rm -rf {tmp}")

    print("[n8n] publish + restart")
    try:
        sh(c, f"docker exec -u node n8n n8n publish:workflow --id={WF_ID}")
    except RuntimeError:
        sh(c, f"docker exec -u node n8n n8n update:workflow --id={WF_ID} --active=true")
    sh(c, "cd /root/n8n && docker compose restart n8n")
    for i in range(30):
        try:
            if urllib.request.urlopen("https://n8n.erythro.ai/healthz", timeout=5).status == 200:
                print(f"[n8n] healthz ok ({i + 1})")
                break
        except Exception:
            pass
        time.sleep(3)
    print(sh(c, "docker exec -u node n8n n8n list:workflow --active=true").strip())
    c.close()


if __name__ == "__main__":
    main()
