# Glama release runbook

Steps to satisfy [awesome-mcp-servers PR #13043](https://github.com/punkpeye/awesome-mcp-servers/pull/13043) Glama requirements.

**Prerequisite:** Push the repo changes that add `src/main.ts`, build scripts, and Dockerfile.

## 1. Submit and claim

1. Open [glama.ai/mcp/servers](https://glama.ai/mcp/servers) and submit `github.com/CNR-Consulting/tillpad-mcp` if not indexed.
2. Open [glama.ai/mcp/servers/number1101/tillpad-mcp/score](https://glama.ai/mcp/servers/number1101/tillpad-mcp/score).
3. Click **Sync Server** (Glama mirror can lag behind GitHub).
4. Click **Claim ownership** — `glama.json` must list your GitHub username (`number1101` or `riderc`).

## 2. Configure build

Admin page: [glama.ai/mcp/servers/number1101/tillpad-mcp/admin/dockerfile](https://glama.ai/mcp/servers/number1101/tillpad-mcp/admin/dockerfile)

| Field | Value |
|-------|-------|
| Base image | `debian:trixie-slim` (default) |
| Build steps | `["npm ci", "npm run build"]` |
| CMD arguments | `["node", "dist/main.js"]` |
| Environment variables JSON schema | default (`{"properties":{},"required":[],"type":"object"}`) |
| Placeholder parameters | `{}` |
| Pinned commit SHA | empty (use latest HEAD after Sync) |

Glama wraps CMD with `mcp-proxy --`. Do not mix npm build steps with a pnpm CMD.

## 3. Deploy and release

1. Click **Deploy** and wait for the build test (build + boot + introspection).
2. On success, click **Make Release** (e.g. version `0.1.1`).
3. Optional: use **Try in Browser** once if Glama flags low usage.

## 4. Update awesome-mcp-servers PR

After the listing passes and the badge URL resolves, edit the Tillpad line on branch `patch-1` in [riderc/awesome-mcp-servers](https://github.com/riderc/awesome-mcp-servers) (PR [#13043](https://github.com/punkpeye/awesome-mcp-servers/pull/13043)).

**Before:**

```markdown
- [number1101/tillpad-mcp](https://github.com/number1101/tillpad-mcp) 📇 ☁️ - Tillpad: bounded storage and search for agent jobs. Remote MCP at https://tillpad.dev/mcp (streamable HTTP, Bearer auth). Docs: https://tillpad.dev/docs
```

**After:**

```markdown
- [CNR-Consulting/tillpad-mcp](https://github.com/CNR-Consulting/tillpad-mcp) [![number1101/tillpad-mcp MCP server](https://glama.ai/mcp/servers/number1101/tillpad-mcp/badges/score.svg)](https://glama.ai/mcp/servers/number1101/tillpad-mcp) 📇 ☁️ - Tillpad: bounded storage and search for agent jobs. Remote MCP at https://tillpad.dev/mcp (streamable HTTP, Bearer auth). Docs: https://tillpad.dev/docs
```

Reply on PR #13043 that Glama checks are complete.

## Local verify (before Glama)

```bash
npm ci && npm run build && npm start   # hangs on stdio — expected
docker build -t tillpad-mcp-stub . && docker run -i tillpad-mcp-stub
```

## Optional: hosted connector

Separate from the servers badge. Product already serves `https://tillpad.dev/.well-known/glama.json` for connector claim at [glama.ai/mcp/connectors](https://glama.ai/mcp/connectors).
