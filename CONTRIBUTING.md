# Contributing

This repository is the public **catalog** for Tillpad MCP: README, `server.json`, and the tool schema stub in `src/server.ts`.

The hosted product is not developed here. Pull requests that add production Worker code, credentials, or a second live MCP URL will be declined.

## Welcome changes

- Doc fixes (install snippets, tool descriptions, links)
- Schema drift: tool **names**, descriptions, and input shapes must match the hosted server at `https://tillpad.dev/mcp`
- Registry metadata in `server.json` (keep `remotes[0].url` on the production endpoint; registry name is `com.cnrcode/tillpad`)

## MCP Registry publish

Publishing uses **HTTP domain auth** for `cnrcode.com`. The proof file is maintained in the `cnrcode-site` repo. CI needs the `MCP_PRIVATE_KEY` repository secret (Ed25519 private key hex, never commit it).

## Schema stub

[`src/server.ts`](src/server.ts) exists so crawlers can detect `server.tool(...)` registrations. Handlers only point at the hosted URL. Do not implement KVP, RAG, or billing here.

[`src/main.ts`](src/main.ts) wires the stub to stdio transport for Glama and directory introspection only. It is not a second live MCP endpoint.

## License

Contributions are accepted under the [MIT License](./LICENSE).
