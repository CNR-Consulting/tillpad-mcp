# Tillpad MCP

**Bounded storage and search for agent jobs.**

[![Remote MCP](https://img.shields.io/badge/MCP-remote-555?style=flat-square)](https://tillpad.cnrcode.com/mcp)
[![Transport](https://img.shields.io/badge/transport-streamable--http-0ea5e9?style=flat-square)](https://modelcontextprotocol.io)
[![Auth](https://img.shields.io/badge/auth-Bearer%20tp__-111?style=flat-square)](https://tillpad.cnrcode.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![Listed on mcpservers.org](https://mcpservers.org/badge.svg)](https://mcpservers.org/servers/number1101/tillpad-mcp)

Tillpad gives agents namespaced key-value storage, file upload + semantic search, receive-only email inboxes, budget-aware metering, and run keys that wipe with a signed receipt when the job is done.

**Live endpoint:** [`https://tillpad.cnrcode.com/mcp`](https://tillpad.cnrcode.com/mcp)

> This repository is the **public catalog and schema stub** for directory crawlers. It is not the hosted server. Point MCP clients at the live URL above with a Tillpad API key. Running the TypeScript in this repo does not store or search anything.

**Agent guide:** see [AGENTS.md](./AGENTS.md) for discovery URLs, auth, and MCP connect snippets.

## Get an API key

### Zero-human (agents)

1. `POST https://tillpad.cnrcode.com/api/agents/bootstrap` with `{ "email": "agent@example.com" }` → `bootstrapToken` (no outbound mail).
2. `POST https://tillpad.cnrcode.com/api/billing/machine-pay` with `Authorization: Bearer <bootstrapToken>` and optional `{ "sku": "pro_prepaid_30d" }`.
3. Settle Stripe MPP ($9.00 / 30 days) → response includes `secret` (`tp_…`) and `planPeriodEnd`.

See [scratchpad.txt](https://tillpad.cnrcode.com/scratchpad.txt) and [llms-full.txt](https://tillpad.cnrcode.com/llms-full.txt). Legal: [Terms](https://tillpad.cnrcode.com/terms).

### Human path

1. Open [tillpad.cnrcode.com](https://tillpad.cnrcode.com) and create an account.
2. Subscribe to Tillpad Pro on [Pricing](https://tillpad.cnrcode.com/pricing), then mint an API key in the dashboard. Secrets start with `tp_`.
3. Use an **account** key for ongoing access, or a **run** key when the job should expire and wipe.

Never commit a real key. Use the `tp_…` placeholder in configs.

## Connect a client

Transport is **Streamable HTTP**. Send `Authorization: Bearer tp_…` on every request.

### Cursor

#### Install via Cursor Marketplace (plugin)

This repo includes a [Cursor plugin manifest](.cursor-plugin/plugin.json) and root [`mcp.json`](mcp.json) for one-click install from the [Cursor Marketplace](https://cursor.com/marketplace/publish).

Tillpad MCP tools cover namespaced KVP, RAG search, **receive-only email inboxes**, **scheduled HTTPS jobs**, budget metering, and run-key wipe receipts.

1. Install the **Tillpad** plugin from the marketplace (or test locally — see below).
2. Open **Cursor Settings → Customize → Tillpad** and set **Tillpad API key** (`tp_…` from bootstrap + machine-pay or the dashboard).
3. Reload the window. MCP tools should appear under the Tillpad server.

The plugin points at `https://tillpad.cnrcode.com/mcp` with `Authorization: Bearer ${TILLPAD_API_KEY}`. Never commit a real key.

**Local plugin test** (before marketplace submission):

```powershell
# Copy catalog repo into Cursor local plugins folder
$dest = "$env:USERPROFILE\.cursor\plugins\local\tillpad"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Recurse -Force "C:\dev\tillpad\tillpad-mcp\*" $dest
# Then: Cursor Customize → Tillpad → set TILLPAD_API_KEY → Developer: Reload Window
```

Submit the public repo at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) when ready.

#### Manual MCP config

User or project MCP config:

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

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "tillpad": {
      "command": "npx",
      "args": ["mcp-remote", "https://tillpad.cnrcode.com/mcp", "--header", "Authorization: Bearer tp_…"]
    }
  }
}
```

### Generic remote MCP

```json
{
  "url": "https://tillpad.cnrcode.com/mcp",
  "headers": {
    "Authorization": "Bearer tp_…"
  }
}
```

Discovery manifests on the product host:

- [/.well-known/mcp.json](https://tillpad.cnrcode.com/.well-known/mcp.json)
- [/.well-known/mcp/server.json](https://tillpad.cnrcode.com/.well-known/mcp/server.json)
- [/llms.txt](https://tillpad.cnrcode.com/llms.txt)

## Tools

Schemas in [`src/server.ts`](src/server.ts) match the hosted server.

| Tool | What it does |
|------|----------------|
| `get_usage` | Usage for one month (`view=summary`), paged history (`view=periods`), or remaining quotas (`view=budget`) |
| `estimate_usage` | Preflight 402/429 before a meter spend (`textLength` / `byteLength` for `rag_index`) |
| `manage_billing` | MPP machine-pay instructions (`action=machine_pay`), Stripe portal URL, or purchase history |
| `bootstrap_agent` | Zero-human onboarding: bootstrap token from email (no outbound mail) |
| `create_api_key` | Mint a run or sub key from an account `tp_` key |
| `manage_kv` | Put, get, delete, or list a namespaced string |
| `manage_memory` | Put or get memory scope `prefs` / `facts` / `run` |
| `search_documents` | Semantic search over indexed documents or a memory scope |
| `index_document` | Index a named UTF-8 file (`kind=file`) or a short note (`kind=note`) |
| `list_files` | List uploads (`view=files`) or supported types (`view=supported_types`) |
| `get_storage_summary` | Namespace inventory (scoped to the key when applicable) |
| `finish_run` | Wipe namespaces bound to this **run** key; returns a signed wipe receipt |
| `contact_support` | Contact Tillpad support from a **Pro** account; replies go to the account email |
| `manage_inbox` | Create, list, get, delete, or audit receive-only inboxes |
| `read_inbox_message` | List metadata, get one message, download raw MIME, or fetch an attachment |
| `manage_inbox_webhook` | Register, list, disable, or inspect `email.received` webhook deliveries |
| `manage_inbox_blocklist` | List, add, or remove a blocked sender address or domain |
| `manage_schedule` | Create, list, get, disable, or list runs for HTTPS interval jobs |

## Typical agent loop

1. Mint a **run** key with `create_api_key` (or the dashboard): dedicated namespace, TTL, optional op budget.
2. Store working state with `manage_memory` / `manage_kv` and/or `index_document`.
3. Retrieve with `manage_memory` / `manage_kv` and `search_documents`.
4. Call `finish_run` to wipe run namespaces and keep the signed receipt.

Use `estimate_usage` before large index jobs. `get_usage` shows what is left in the period.

## Auth and errors

- **401** — missing or invalid `Authorization: Bearer tp_…`
- **402 / 429** — plan or quota. JSON includes `code`, `status`, `actions`, and `budget`
  - `actions[].type: "checkout"` — hosted Stripe Checkout URL for a **recurring** human subscription
  - `actions[].type: "machine_pay"` — agent prepaid Pro (30/90 days) or top-up SKUs via Stripe MPP; default sku `pro_prepaid_30d` at $9.00

This is Stripe Machine Payments Protocol, not ChatGPT Instant Checkout / ACP.

## Product docs

- App: [tillpad.cnrcode.com](https://tillpad.cnrcode.com)
- Docs: [tillpad.cnrcode.com/docs](https://tillpad.cnrcode.com/docs)
- Scratchpad: [tillpad.cnrcode.com/docs/scratchpad](https://tillpad.cnrcode.com/docs/scratchpad)
- OpenAPI: [tillpad.cnrcode.com/openapi.json](https://tillpad.cnrcode.com/openapi.json)

The Tillpad product (Worker, billing, storage) is closed source. This catalog is MIT-licensed so directories can list tools and install snippets.

## Directory listing

Registry name: **`com.cnrcode/tillpad`** (domain namespace via [cnrcode.com](https://cnrcode.com/.well-known/mcp-registry-auth)).

1. Ensure `https://cnrcode.com/.well-known/mcp-registry-auth` is deployed (`cnrcode-site` repo).
2. Set GitHub repo secret **`MCP_PRIVATE_KEY`** (hex; see `cnrcode-site` key generation script).
3. Push a version tag so [GitHub Actions](.github/workflows/publish-mcp.yml) publishes `server.json` to the [official MCP Registry](https://registry.modelcontextprotocol.io):

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

4. Optionally submit [https://github.com/CNR-Consulting/tillpad-mcp](https://github.com/CNR-Consulting/tillpad-mcp) at [mcp.directory/submit](https://mcp.directory/submit).

### Glama

This repo includes a **stdio catalog stub** (`src/main.ts`) so [Glama](https://glama.ai/mcp/servers) can build a container, start the process, and introspect the **18** tool definitions. It does not implement storage or billing — clients still connect to the hosted endpoint above.

Listing: [glama.ai/mcp/servers/number1101/tillpad-mcp](https://glama.ai/mcp/servers/number1101/tillpad-mcp)

After claiming via [`glama.json`](glama.json), configure the Dockerfile admin page:

| Field | Value |
|-------|-------|
| Build steps | `["npm ci", "npm run build"]` |
| CMD arguments | `["node", "dist/main.js"]` |
| Env schema | default (empty — no credentials needed) |
| Placeholder params | `{}` |

Glama generates its own Dockerfile from that form; the repo [`Dockerfile`](Dockerfile) is for local smoke tests only.

Score badge (for awesome-mcp-servers and similar lists):

```markdown
[![number1101/tillpad-mcp MCP server](https://glama.ai/mcp/servers/number1101/tillpad-mcp/badges/score.svg)](https://glama.ai/mcp/servers/number1101/tillpad-mcp)
```

Local verify:

```bash
npm ci && npm run build && npm start   # hangs on stdio — expected
docker build -t tillpad-mcp-stub . && docker run -i tillpad-mcp-stub
```

Full step-by-step (claim, admin Dockerfile, release, awesome-mcp PR): [docs/glama-release.md](docs/glama-release.md).

## License

[MIT](./LICENSE) — catalog, documentation, and schema stub only.
