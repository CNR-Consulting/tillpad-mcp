---
name: tillpad
description: >-
  Connect to Tillpad MCP for bounded KVP, RAG search, receive-only email inboxes
  (webhooks, blocklist, raw MIME), and run-key wipe receipts. Use when onboarding
  to Tillpad, minting API keys, creating agent inboxes, or running the zero-human
  bootstrap loop.
---

# Tillpad MCP

Tillpad is metered bounded storage and search for agent jobs: namespaced KVP, file upload + RAG search, receive-only email inboxes, budget-aware metering, and run keys that wipe with a signed receipt.

**Live endpoint:** https://tillpad.cnrcode.com/mcp

## Zero-human bootstrap

1. `POST https://tillpad.cnrcode.com/api/agents/bootstrap` with `{ "email": "agent@example.com" }` → `bootstrapToken`
2. `POST https://tillpad.cnrcode.com/api/billing/machine-pay` with `Authorization: Bearer <bootstrapToken>` and `{ "sku": "pro_prepaid_30d" }`
3. Settle Stripe MPP ($9.00 / 30 days) → response includes `secret` (`tp_…`) and `planPeriodEnd`

Or use MCP tools `bootstrap_agent` and `manage_billing` (`action=machine_pay`).

## Typical agent loop

1. Mint a **run** key with `create_api_key` (or the dashboard): dedicated namespace, TTL, optional op budget
2. Store working state with `manage_kv` and/or `index_document`
3. Retrieve with `manage_kv` (`action=get` or `action=list`) and `search_documents`
4. Call `finish_run` to wipe run namespaces and keep the signed receipt

Use `estimate_usage` before large index jobs. `get_usage` shows remaining quota.

## Receive-only email inboxes

Agents can provision **inbound-only** addresses on Tillpad's configured domain (`GET /api/config` → `inboundEmailDomain`, default `centralmail.us`). No outbound send — receive, store, and read only.

**Create an inbox** with `manage_inbox` `action=create`:

- `kind`: `temporary` (TTL expires and purges) or `permanent`
- `localPart`: the address prefix before `@domain`

**Read mail** via `read_inbox_message`: `action=list`, `action=get`, `action=raw` (raw MIME, meters 1 kvp_op), and `action=attachment` (base64, meters 1 kvp_op).

**Webhooks:** register with `manage_inbox_webhook` `action=create` for HMAC-signed `email.received` notifications (metadata only, no body in the webhook payload). Monitor failures with `action=deliveries` (`status=failed` after retries).

**Blocklist:** `manage_inbox_blocklist` `action=add` / `action=delete` to block sender addresses or entire domains account-wide.

**Audit:** `manage_inbox` `action=audit` for who created inboxes and received messages.

Inbound email is metered (`inbound_email` quota). See llms-full.txt for REST equivalents under `/api/inboxes`.

## Discovery

| Resource | URL |
|----------|-----|
| LLM site map | https://tillpad.cnrcode.com/llms.txt |
| Full agent guide | https://tillpad.cnrcode.com/llms-full.txt |
| Scratchpad quickstart | https://tillpad.cnrcode.com/scratchpad.txt |
| MCP discovery | https://tillpad.cnrcode.com/.well-known/mcp.json |

## Billing errors

402/429 responses include `code`, `actions` (checkout or machine_pay), and `budget`. Follow the offered actions — do not invent a billing flow.

Legal: https://tillpad.cnrcode.com/terms
