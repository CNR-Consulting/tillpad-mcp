# AGENTS.md

Guidance for AI agents and coding assistants working with Tillpad.

## What Tillpad is

Tillpad is metered bounded storage and search for agent jobs: namespaced KVP, memory conventions (`prefs` / `facts` / `run`), file upload + RAG search, receive-only email inboxes, scheduled HTTPS jobs, budget-aware metering, run keys that wipe with a signed receipt, REST + MCP.

**Live product:** https://tillpad.cnrcode.com

This repository (`tillpad-mcp`) is the **public MCP catalog stub** for directory crawlers. It is not the hosted server.

## Start here

1. Read the curated site index: https://tillpad.cnrcode.com/llms.txt
2. **Zero-human path:** bootstrap → machine-pay → account key (see scratchpad.txt § Zero-human)
3. Run the scratchpad loop: https://tillpad.cnrcode.com/scratchpad.txt (~5 min)
4. Full agent guide: https://tillpad.cnrcode.com/llms-full.txt

## Zero-human bootstrap

```bash
curl -s -X POST https://tillpad.cnrcode.com/api/agents/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com"}'
# → bootstrapToken

curl -s -X POST https://tillpad.cnrcode.com/api/billing/machine-pay \
  -H "Authorization: Bearer <bootstrapToken>" \
  -H "Content-Type: application/json" \
  -d '{"sku":"pro_prepaid_30d"}'
# MPP settle → secret tp_… + planPeriodEnd
```

Zero-human account creation is REST-only (`POST /api/agents/bootstrap`) because MCP requires `Authorization: Bearer tp_…` before any tool runs. After you have an account key, use MCP `manage_billing` (`action=machine_pay`) for top-ups. Top-up SKUs (`topup_kvp_10k`, `topup_storage_1gb`) require active Pro — see `GET /api/config` → `plans.agentSkus`.

Legal: https://tillpad.cnrcode.com/terms · https://tillpad.cnrcode.com/privacy · https://tillpad.cnrcode.com/refunds

## Connect MCP

Point any MCP client at the live endpoint with a Tillpad API key (`tp_…`):

```json
{
  "mcpServers": {
    "tillpad": {
      "url": "https://tillpad.cnrcode.com/mcp",
      "headers": {
        "Authorization": "Bearer tp_…"
      }
    }
  }
}
```

Mint keys via bootstrap + machine-pay, or at https://tillpad.cnrcode.com after human Pro checkout.

## Machine-readable discovery

| Resource | URL |
|----------|-----|
| LLM site map | https://tillpad.cnrcode.com/llms.txt |
| Full agent guide | https://tillpad.cnrcode.com/llms-full.txt |
| Scratchpad quickstart | https://tillpad.cnrcode.com/scratchpad.txt |
| OpenAPI 3.1 | https://tillpad.cnrcode.com/openapi.json |
| Interactive API | https://tillpad.cnrcode.com/swagger |
| MCP discovery | https://tillpad.cnrcode.com/.well-known/mcp.json |
| MCP server descriptor | https://tillpad.cnrcode.com/.well-known/mcp/server.json |
| Agent capability card | https://tillpad.cnrcode.com/.well-known/agent-card.json |
| Sitemap | https://tillpad.cnrcode.com/sitemap.xml |

## Authentication

- **Agents:** `Authorization: Bearer tp_…` (account, run, or scoped sub key); bootstrap JWT on machine-pay only
- **Humans:** email OTP → session JWT (Turnstile on OTP only; API/MCP paths are CAPTCHA-free)

Active Pro required to create keys and run metered work.

## Tool schemas

Input schemas for all **18** MCP tools are in:

- https://tillpad.cnrcode.com/.well-known/mcp.json (under `mcpServers.tillpad.tools`)
- [`src/server.ts`](src/server.ts) in this repo (Zod stubs matching production)

## Billing errors

402/429 responses include machine-readable JSON: `code`, `actions` (checkout or machine_pay), and `budget`. Do not invent a billing flow — follow the offered actions.

## This repo vs the product

| | Product (private) | This repo (public) |
|---|---|---|
| Role | Live Worker, REST, SPA, MCP | Catalog + schema stub for MCP Registry |
| MCP URL | https://tillpad.cnrcode.com/mcp | Points clients to product URL |
| Handlers | Real storage, billing, auth | Stub messages only |

When tool names or schemas change in production, update `src/server.ts` and README here to stay in sync.
