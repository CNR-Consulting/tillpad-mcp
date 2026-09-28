/**
 * Schema stub for directory crawlers.
 *
 * This is not the hosted Tillpad MCP server. Tool names, descriptions, and
 * input shapes match production. Handlers only tell clients to use:
 *   https://tillpad.cnrcode.com/mcp
 *   Authorization: Bearer tp_…
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const HOSTED_MCP = "https://tillpad.cnrcode.com/mcp";

const stubMessage =
  "This repository is a catalog stub. Connect to " +
  HOSTED_MCP +
  " with Authorization: Bearer tp_… (mint a key at https://tillpad.cnrcode.com).";

function stub() {
  return {
    content: [{ type: "text" as const, text: stubMessage }],
  };
}

export const server = new McpServer({
  name: "tillpad",
  version: "0.1.0",
});

server.tool(
  "get_usage",
  "Read this account's usage and quotas. Use view=summary for one calendar month (omit periodYm for the current UTC month, or pass YYYY-MM). Returns usage totals, the budget view, and whether that month is current. Use view=periods to page stored months newest-first. Returns periods, hasMore, and currentPeriodYm. Use view=budget for remaining included quota, hard caps, soft thresholds, checkout URLs, and this key's op budget when one is set. Returns budget and keyBudget. Read only: no writes, no deletes, no quota spend, no email. Choose estimate_usage before a spend, and manage_billing to pay. ACL is not consulted; usage_get, usage_periods_list, and budget_get were ungated reads.",
  {
    view: z
      .enum(["summary", "periods", "budget"])
      .describe(
        "Which usage read to run. summary: one month (ACL name usage_get). periods: paged history (ACL name usage_periods_list). budget: remaining quotas and checkout URLs (ACL name budget_get). Required. No default.",
      ),
    periodYm: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional()
      .describe(
        "UTC calendar month YYYY-MM. Used when view=summary. Omit for the current month. Ignored by view=periods and view=budget.",
      ),
    limit: z
      .number()
      .optional()
      .describe(
        "Page size when view=periods. Default 12, maximum 100. Ignored by view=summary and view=budget.",
      ),
    cursor: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional()
      .describe(
        "When view=periods, return months strictly older than this YYYY-MM. Omit for the first page. Ignored by other views.",
      ),
  },
  async () => stub(),
);

server.tool(
  "estimate_usage",
  "Predict whether a future meter spend would be rejected with 402 (no active plan) or 429 (hard cap) before calling a write or search tool. Returns {estimate} with allowed, would402, amount, and budget. For kind=rag_index, pass textLength or byteLength to estimate chunk count instead of amount. Read only: no writes, no quota spend, no email. Use get_usage view=budget to see what is already remaining. Use before manage_kv, index_document, search_documents, or read_inbox_message action=raw or action=attachment. Same behavior as the former budget_estimate tool. ACL is not consulted.",
  {
    kind: z
      .enum([
        "kvp_ops",
        "storage_bytes",
        "rag_index",
        "rag_query",
        "inbound_email",
        "outbound_http",
      ])
      .describe(
        "Meter to preflight. kvp_ops: key-value ops. storage_bytes: stored bytes. rag_index: document indexing chunks. rag_query: semantic search. inbound_email: received messages. outbound_http: scheduled HTTPS attempts.",
      ),
    amount: z
      .number()
      .optional()
      .describe(
        "Units to preflight. Default 1. For kind=rag_index, ignored when textLength or byteLength is set.",
      ),
    textLength: z
      .number()
      .optional()
      .describe(
        "Character length used to estimate rag_index chunks. Only for kind=rag_index. Omit to use amount.",
      ),
    byteLength: z
      .number()
      .optional()
      .describe(
        "Byte length used to estimate rag_index chunks when textLength is omitted. Only for kind=rag_index.",
      ),
  },
  async () => stub(),
);

server.tool(
  "manage_billing",
  "Payment helpers. Use action=machine_pay to learn how to unlock Pro or buy an agent SKU with Stripe Machine Payments. Returns sku, amount, currency, periodDays, and the POST URL the agent must call with an MPP Payment credential. This call does not charge. Default sku is pro_prepaid_30d. Use action=portal for a Stripe Customer Portal URL (subscription and invoices, for a human). Returns {url}. Fails when the account cannot open a portal. Use action=purchases to list local MPP purchases and logged Stripe events. Returns purchases and a cursor. Pass includeStripe=true to merge unlogged Stripe charges when a customer exists. No quota spend and no email. Sibling bootstrap_agent creates the account first. get_usage reads quotas. ACL is not consulted (billing_machine_pay, billing_portal, and billing_purchases_list were ungated).",
  {
    action: z
      .enum(["machine_pay", "portal", "purchases"])
      .describe(
        "machine_pay: MPP instructions (former billing_machine_pay). portal: Stripe Customer Portal URL (former billing_portal). purchases: payment history (former billing_purchases_list). Required. No default.",
      ),
    sku: z
      .enum([
        "pro_prepaid_30d",
        "pro_prepaid_90d",
        "topup_kvp_10k",
        "topup_storage_1gb",
      ])
      .optional()
      .describe(
        "Agent SKU for action=machine_pay. Default pro_prepaid_30d. Top-up SKUs require active Pro. Ignored by portal and purchases.",
      ),
    limit: z
      .number()
      .optional()
      .describe(
        "Page size for action=purchases. Default 20, maximum 100. Ignored by machine_pay and portal.",
      ),
    cursor: z
      .string()
      .optional()
      .describe(
        "Opaque cursor from a previous purchases page. Omit for the first page. Ignored by machine_pay and portal.",
      ),
    includeStripe: z
      .boolean()
      .optional()
      .describe(
        "When action=purchases and true, merge Stripe charges and invoices that are not already logged locally. Default false. Ignored by machine_pay and portal.",
      ),
  },
  async () => stub(),
);

server.tool(
  "bootstrap_agent",
  "Start zero-human onboarding from an email address. Writes a bootstrap account and returns bootstrapToken, accountId, expiresIn, next, and machinePay (url, sku, amount). Does not send email and does not charge. Next call is manage_billing action=machine_pay, or POST /api/billing/machine-pay with Authorization: Bearer bootstrapToken. Use create_api_key afterward to mint run or sub keys from the resulting account tp_ key. No quota spend. No API key is required. Former name: agent_bootstrap.",
  {
    email: z
      .string()
      .describe(
        "Account email. Required. Disposable domains are rejected. No message is sent to this address.",
      ),
    label: z
      .string()
      .optional()
      .describe("Optional label stored on the bootstrap account. Omit for none."),
  },
  async () => stub(),
);

server.tool(
  "create_api_key",
  "Mint a run or sub API key from the calling account tp_ key. Requires kind=account on the caller and an active plan. Writes a key row and returns the secret once, plus id, name, prefix, namespaces, tools, expiresAt, opBudgetTotal, and wipeOnExpire. No quota spend and no email. Run keys default to a 24 hour TTL, wipeOnExpire true, and one auto-generated namespace. Use finish_run to wipe a run key early. The tools array is the stored ACL allow-list of per-operation names, not these merged MCP names. manage_kv action=put is allowed only when the list includes kvp_put (or the list is omitted, which allows every operation). Unknown names are dropped. Former name: keys_create.",
  {
    kind: z
      .enum(["run", "sub"])
      .describe(
        "run: temporary job key with its own namespace. sub: longer-lived scoped key. Required. Account keys cannot be minted here.",
      ),
    name: z
      .string()
      .optional()
      .describe(
        "Display name. Default run-key or sub-key when omitted.",
      ),
    ttlSeconds: z
      .number()
      .optional()
      .describe(
        "Lifetime in seconds. Omit for the default: 24 hours on a run key, no expiry on a sub key.",
      ),
    namespaces: z
      .array(z.string())
      .optional()
      .describe(
        "Namespace allow-list. Omit on a run key to bind one generated run_ namespace. Omit on a sub key to allow every namespace.",
      ),
    tools: z
      .array(z.string())
      .optional()
      .describe(
        "ACL allow-list of per-operation names stored on the key. These are the names REST and metering already use. Examples: usage_get, usage_periods_list, budget_get, budget_estimate, billing_machine_pay, kvp_put, kvp_get, kvp_delete, kvp_list, memory_put, memory_get, memory_search, file_upload, files_list, files_types, file_get, file_delete, rag_note, rag_search, inspect_storage, run_finish, keys_create, keys_list, keys_revoke, support_contact, inbox_create, inbox_list, inbox_get, inbox_delete, inbox_messages_list, inbox_message_get, inbox_message_raw, inbox_attachment_get, inbox_webhook_create, inbox_webhook_list, inbox_webhook_delete, inbox_webhook_deliveries_list, inbox_audit_list, inbox_blocklist_list, inbox_blocklist_add, inbox_blocklist_delete, schedule_create, schedule_list, schedule_get, schedule_delete, schedule_runs_list. Merged MCP tools check the matching name per action (manage_kv action=put checks kvp_put, search_documents source=documents checks rag_search, search_documents source=memory checks memory_search, index_document kind=file checks file_upload, index_document kind=note checks rag_note). Omit to allow every operation. Names outside this list are dropped.",
      ),
    opBudget: z
      .number()
      .optional()
      .describe(
        "Maximum metered operations this key may spend. Omit for no per-key cap. Values of 0 or less mean no cap.",
      ),
    wipeOnExpire: z
      .boolean()
      .optional()
      .describe(
        "When true, namespaces bound to the key are wiped at expiry. Default true for run keys and false for sub keys.",
      ),
  },
  async () => stub(),
);

server.tool(
  "manage_kv",
  "Read and write arbitrary namespace strings. Use manage_memory when the namespace is prefs, facts, or run. action=put stores value and returns the stored row plus budget and keyBudget (writes; meters 1 kvp_ops; ACL kvp_put). action=get returns {value, budget, keyBudget} (meters 1 kvp_ops; ACL kvp_get). action=delete removes one key and returns {ok, budget, keyBudget} (deletes; meters 1 kvp_ops; ACL kvp_delete). action=list returns {keys, cursor, budget, keyBudget} (meters 1 kvp_ops; ACL kvp_list). No email. Use index_document and search_documents for semantic search, and get_storage_summary for a namespace inventory.",
  {
    action: z
      .enum(["put", "get", "delete", "list"])
      .describe(
        "put checks ACL kvp_put and writes. get checks kvp_get and reads one value. delete checks kvp_delete and removes one key. list checks kvp_list and pages keys. Required. No default.",
      ),
    namespace: z
      .string()
      .optional()
      .describe(
        "KVP namespace. Required for put, get, delete, and list. Must be in the key namespace allow-list when that list is set.",
      ),
    key: z
      .string()
      .optional()
      .describe(
        "Key name inside namespace. Required for put, get, and delete. Omit for list.",
      ),
    value: z
      .string()
      .optional()
      .describe("String to store. Required for put. Omit for get, delete, and list."),
    expirationTtl: z
      .number()
      .optional()
      .describe(
        "TTL in seconds for put. Omit to keep the value until it is deleted. Ignored by get, delete, and list.",
      ),
    limit: z
      .number()
      .optional()
      .describe(
        "Page size for list. Default 100, maximum 500. Ignored by put, get, and delete.",
      ),
    cursor: z
      .string()
      .optional()
      .describe(
        "Offset cursor from a previous list response. Omit for the first page. Ignored by put, get, and delete.",
      ),
  },
  async () => stub(),
);

server.tool(
  "manage_memory",
  "Store and read short strings in the memory scopes prefs, facts, and run. Run uses the run key's bound namespace. action=put writes and returns scope, namespace, budget, and keyBudget (meters 1 kvp_ops; ACL memory_put). action=get returns {value, scope, namespace, budget, keyBudget} (meters 1 kvp_ops; ACL memory_get). No deletes and no email. Use search_documents source=memory for semantic recall, manage_kv for any other namespace, and finish_run to wipe the run namespace.",
  {
    action: z
      .enum(["put", "get"])
      .describe(
        "put checks ACL memory_put and writes. get checks ACL memory_get and reads. Required. No default.",
      ),
    scope: z
      .enum(["prefs", "facts", "run"])
      .optional()
      .describe(
        "Memory scope. prefs and facts are fixed namespaces. run maps to the run key namespace, or the namespace run when the key has none. Required for put and get.",
      ),
    key: z
      .string()
      .optional()
      .describe("Key name inside the scope namespace. Required for put and get."),
    value: z
      .string()
      .optional()
      .describe("String to store. Required for put. Omit for get."),
    expirationTtl: z
      .number()
      .optional()
      .describe(
        "TTL in seconds for put. Omit to keep the value until it is deleted. Ignored by get.",
      ),
  },
  async () => stub(),
);

server.tool(
  "search_documents",
  "Semantic search over indexed notes and files. Meters 1 rag_query. Returns hits plus budget and keyBudget. source=documents searches the whole index or one namespace and checks ACL rag_search (former rag_search). source=memory limits the search to prefs, facts, or run and checks ACL memory_search (former memory_search). That response also includes scope and namespace. Read only: no writes and no email. Use index_document to add text first. Use manage_memory action=get to read an exact key.",
  {
    source: z
      .enum(["documents", "memory"])
      .describe(
        "documents checks ACL rag_search and accepts namespace. memory checks ACL memory_search and accepts scope. Required. No default.",
      ),
    query: z
      .string()
      .optional()
      .describe("Natural-language query. Required for both sources."),
    namespace: z
      .string()
      .optional()
      .describe(
        "Limit source=documents to this namespace. Omit to search every namespace the key may access. Ignored when source=memory.",
      ),
    scope: z
      .enum(["prefs", "facts", "run"])
      .optional()
      .describe(
        "Limit source=memory to this scope. Omit to search without a scope filter. Ignored when source=documents.",
      ),
    topK: z
      .number()
      .optional()
      .describe("Maximum hits. Default 5, maximum 20."),
  },
  async () => stub(),
);

server.tool(
  "index_document",
  "Add UTF-8 text to the RAG index. kind=file stores a named text file and checks ACL file_upload (former file_upload). kind=note stores a short note titled title or note.txt and checks ACL rag_note (former rag_note). Both preflight rag_index capacity, then meter 1 kvp_ops for the upload. Chunk indexing spends rag_index later on the queue. Returns file, an estimated chunk count, budget, and keyBudget. PDF and Excel binaries belong on REST multipart POST /api/files/:namespace. Use search_documents to query and list_files to list what was uploaded. No email.",
  {
    kind: z
      .enum(["file", "note"])
      .describe(
        "file checks ACL file_upload and requires filename. note checks ACL rag_note and uses title as the filename. Required. No default.",
      ),
    namespace: z
      .string()
      .optional()
      .describe(
        "Namespace that will own the file. Required for file and note. Must be in the key namespace allow-list when that list is set.",
      ),
    text: z
      .string()
      .optional()
      .describe("UTF-8 document body. Required for file and note."),
    filename: z
      .string()
      .optional()
      .describe(
        "File name including extension. Required for kind=file. Ignored for kind=note (use title).",
      ),
    contentType: z
      .string()
      .optional()
      .describe(
        "MIME type for kind=file. Default text/plain. Ignored for kind=note, which is stored as text/plain.",
      ),
    title: z
      .string()
      .optional()
      .describe(
        "Filename for kind=note, up to 180 characters. Default note.txt. Ignored for kind=file.",
      ),
  },
  async () => stub(),
);

server.tool(
  "list_files",
  "File catalog reads. view=files lists uploaded file metadata, optionally filtered by namespace, and checks ACL files_list. Returns {files}. view=supported_types returns kinds, extensions, mimeTypes, and extract notes for RAG uploads. That view checks no ACL and spends no quota (former files_types). Neither view writes, deletes, or sends email. Use index_document to upload. MCP indexing accepts UTF-8 text; REST multipart accepts PDF and Excel too.",
  {
    view: z
      .enum(["files", "supported_types"])
      .describe(
        "files checks ACL files_list and lists uploads. supported_types returns the supported-type catalog and checks no ACL. Required. No default.",
      ),
    namespace: z
      .string()
      .optional()
      .describe(
        "When view=files, limit results to this namespace. Omit to list every namespace the key may access. Ignored by view=supported_types.",
      ),
  },
  async () => stub(),
);

server.tool(
  "get_storage_summary",
  "Summarize storage for this account. Returns namespaces with key counts and file or vector inventory, narrowed to the key's namespace allow-list when one is set. Read only: no writes, no deletes, no quota spend, no email. Checks ACL inspect_storage. Use manage_kv action=list to page keys inside one namespace, and list_files view=files for file rows. Former name: inspect_storage.",
  {},
  async () => stub(),
);

server.tool(
  "finish_run",
  "Wipe every namespace bound to this run key and return a signed wipe receipt. Deletes stored data for those namespaces. Valid only for a run key. Checks ACL run_finish. No usage-meter spend and no email. Use manage_kv action=delete to remove one key, or let wipeOnExpire clear a run key at TTL. Former name: run_finish.",
  {},
  async () => stub(),
);

server.tool(
  "contact_support",
  "Email Tillpad support from a Pro account. Sends subject and message to the Tillpad team. Replies go to the account email. Returns {ok:true}. Requires an active Pro subscription. Checks ACL support_contact with no quota spend. Does not change billing, storage, or inboxes.",
  {
    subject: z.string().describe("Email subject line. Required."),
    message: z
      .string()
      .describe("Email body. Required. Sent to the Tillpad team."),
  },
  async () => stub(),
);

server.tool(
  "manage_inbox",
  "Create, read, delete, and audit receive-only email inboxes. action=create writes an address on the inbound domain and returns inbox plus address (ACL inbox_create). Requires an active plan. Temporary inboxes expire and purge. action=list returns active inboxes (ACL inbox_list). action=get returns one inbox (ACL inbox_get). action=delete deletes the inbox and purges stored messages (ACL inbox_delete). action=audit lists account audit entries (ACL inbox_audit_list). These calls do not meter; inbound mail later meters inbound_email. No outbound email. Use read_inbox_message for mail, manage_inbox_webhook for HTTPS notifications, and manage_inbox_blocklist for sender blocks.",
  {
    action: z
      .enum(["create", "list", "get", "delete", "audit"])
      .describe(
        "create checks ACL inbox_create and writes an inbox. list checks inbox_list. get checks inbox_get. delete checks inbox_delete and purges messages. audit checks inbox_audit_list. Required. No default.",
      ),
    localPart: z
      .string()
      .optional()
      .describe(
        "Address prefix before @domain. Required for action=create. Stored lowercased. Omit for other actions.",
      ),
    kind: z
      .enum(["temporary", "permanent"])
      .optional()
      .describe(
        "temporary expires after ttlSeconds (default 86400, max 604800 unless the deployment overrides those). permanent does not expire. Required for action=create. Omit otherwise.",
      ),
    ttlSeconds: z
      .number()
      .optional()
      .describe(
        "Lifetime for kind=temporary. Default 86400 seconds. Ignored for permanent and for actions other than create.",
      ),
    domain: z
      .string()
      .optional()
      .describe(
        "Inbound domain for action=create. Default is the deployment inbound domain. Must already be configured. Ignored by other actions.",
      ),
    inboxId: z
      .string()
      .optional()
      .describe("Inbox id. Required for get and delete. Omit for create, list, and audit."),
    limit: z
      .number()
      .optional()
      .describe(
        "Page size for action=audit. Default 50. Ignored by create, list, get, and delete.",
      ),
    offset: z
      .number()
      .optional()
      .describe(
        "Row offset for action=audit. Default 0. Ignored by create, list, get, and delete.",
      ),
  },
  async () => stub(),
);

server.tool(
  "read_inbox_message",
  "Read mail already stored on an inbox. action=list returns message metadata newest-first (ACL inbox_messages_list, no quota spend). action=get returns one message plus its attachment list (ACL inbox_message_get, no quota spend). action=raw returns raw MIME as rawBase64 and meters 1 kvp_ops (ACL inbox_message_raw). action=attachment returns filename, contentType, sizeBytes, and dataBase64 and meters 1 kvp_ops (ACL inbox_attachment_get). No deletes and no email send. Use manage_inbox to create the inbox first.",
  {
    action: z
      .enum(["list", "get", "raw", "attachment"])
      .describe(
        "list checks ACL inbox_messages_list. get checks inbox_message_get. raw checks inbox_message_raw and meters 1 kvp_ops. attachment checks inbox_attachment_get and meters 1 kvp_ops. Required. No default.",
      ),
    inboxId: z
      .string()
      .optional()
      .describe("Inbox id. Required for list, get, raw, and attachment."),
    messageId: z
      .string()
      .optional()
      .describe("Message id. Required for get, raw, and attachment. Omit for list."),
    attachmentId: z
      .string()
      .optional()
      .describe("Attachment id from action=get. Required for action=attachment. Omit otherwise."),
    limit: z
      .number()
      .optional()
      .describe("Page size for action=list. Default 50. Ignored by get, raw, and attachment."),
    offset: z
      .number()
      .optional()
      .describe("Row offset for action=list. Default 0. Ignored by get, raw, and attachment."),
  },
  async () => stub(),
);

server.tool(
  "manage_inbox_webhook",
  "HTTPS webhooks for email.received metadata (no message body). action=create registers a URL and returns the webhook plus the signing secret once (ACL inbox_webhook_create). action=list returns registered webhooks (ACL inbox_webhook_list). action=delete sets disabled_at so the webhook stops firing; the row stays (ACL inbox_webhook_delete). action=deliveries lists attempts; status=failed means retries are exhausted (ACL inbox_webhook_deliveries_list). These calls do not meter and do not send email. Later delivery attempts are separate from this call. Use manage_inbox for the inbox itself.",
  {
    action: z
      .enum(["create", "list", "delete", "deliveries"])
      .describe(
        "create checks ACL inbox_webhook_create and stores a webhook. list checks inbox_webhook_list. delete checks inbox_webhook_delete and disables the webhook. deliveries checks inbox_webhook_deliveries_list. Required. No default.",
      ),
    url: z
      .string()
      .optional()
      .describe(
        "HTTPS endpoint for action=create. Required then. Notifications are metadata only. Omit for other actions.",
      ),
    secret: z
      .string()
      .optional()
      .describe(
        "HMAC secret for action=create. Omit to have one generated. Returned once on create. Ignored by other actions.",
      ),
    webhookId: z
      .string()
      .optional()
      .describe(
        "Webhook id. Required for action=delete. Optional filter for action=deliveries. Omit for create and list.",
      ),
    status: z
      .enum(["pending", "retrying", "failed", "delivered", "skipped"])
      .optional()
      .describe(
        "Filter for action=deliveries. failed means every retry is exhausted. Omit for all statuses. Ignored by other actions.",
      ),
    limit: z
      .number()
      .optional()
      .describe(
        "Page size for action=deliveries. Default 50, maximum 100. Ignored by create, list, and delete.",
      ),
    offset: z
      .number()
      .optional()
      .describe(
        "Row offset for action=deliveries. Default 0. Ignored by create, list, and delete.",
      ),
  },
  async () => stub(),
);

server.tool(
  "manage_inbox_blocklist",
  "Block senders for every inbox on the account. action=list returns entries (ACL inbox_blocklist_list). action=add writes an address or domain block and returns the entry (ACL inbox_blocklist_add). action=delete removes one entry by id (ACL inbox_blocklist_delete). No quota spend and no email. Use manage_inbox to manage the inboxes these rules apply to.",
  {
    action: z
      .enum(["list", "add", "delete"])
      .describe(
        "list checks ACL inbox_blocklist_list. add checks inbox_blocklist_add and writes a block. delete checks inbox_blocklist_delete and removes one entry. Required. No default.",
      ),
    kind: z
      .enum(["address", "domain"])
      .optional()
      .describe(
        "address blocks one sender email. domain blocks every sender at that domain. Required for action=add. Omit for list and delete.",
      ),
    value: z
      .string()
      .optional()
      .describe(
        "Email address or domain to block. Required for action=add. Omit for list and delete.",
      ),
    entryId: z
      .string()
      .optional()
      .describe("Blocklist entry id. Required for action=delete. Omit for list and add."),
  },
  async () => stub(),
);

server.tool(
  "manage_schedule",
  "Account HTTPS interval jobs. action=create writes a schedule and returns it plus the delivery contract (ACL schedule_create). Requires an active plan. This call does not meter. Each later attempt meters outbound_http. Success actions store_kvp meter kvp_ops, store_rag meters rag_index, and notify_webhook meters another outbound_http. Contract: 10 second timeout, up to 3 attempts, exponential backoff capped at 300 seconds, success is HTTP 2xx, auto-disable after 5 consecutive exhausted failures. Minimum interval is 5 minutes. action=list returns schedules (ACL schedule_list). action=get returns one schedule and the contract (ACL schedule_get). action=delete sets enabled off and disabled_reason deleted, which stops future runs and keeps the row (ACL schedule_delete). action=runs lists attempts (ACL schedule_runs_list). No email from this call. Use get_usage to see outbound_http remaining.",
  {
    action: z
      .enum(["create", "list", "get", "delete", "runs"])
      .describe(
        "create checks ACL schedule_create and writes a schedule. list checks schedule_list. get checks schedule_get. delete checks schedule_delete and disables future runs. runs checks schedule_runs_list. Required. No default.",
      ),
    name: z
      .string()
      .optional()
      .describe(
        "Display name for action=create, up to 120 characters. Default empty. Ignored by other actions.",
      ),
    url: z
      .string()
      .optional()
      .describe("HTTPS URL to call. Required for action=create. Omit otherwise."),
    method: z
      .enum(["GET", "POST"])
      .optional()
      .describe(
        "HTTP method for action=create. Default GET. POST may send bodyTemplate. Ignored by other actions.",
      ),
    bodyTemplate: z
      .string()
      .optional()
      .describe(
        "POST body for action=create when method=POST. Omit for an empty body. Ignored for GET and for other actions.",
      ),
    authMode: z
      .enum(["none", "bearer", "header"])
      .optional()
      .describe(
        "How action=create authenticates the outbound call. Default none. bearer and header require authSecret. Ignored by other actions.",
      ),
    authHeaderName: z
      .string()
      .optional()
      .describe(
        "Header name when authMode=header. Default authorization. Ignored unless action=create and authMode=header.",
      ),
    authSecret: z
      .string()
      .optional()
      .describe(
        "Secret for authMode=bearer or header on action=create. Stored encrypted. Required for those modes. Omit for authMode=none.",
      ),
    intervalMinutes: z
      .number()
      .optional()
      .describe(
        "Minutes between runs. Required for action=create. Minimum 5. Ignored by other actions.",
      ),
    timezone: z
      .string()
      .optional()
      .describe(
        "Timezone label stored on the schedule. Default UTC. Used when action=create. Ignored by other actions.",
      ),
    onSuccess: z
      .array(z.record(z.unknown()))
      .optional()
      .describe(
        "Actions after a 2xx response, for action=create. Each item is {type:store_kvp, namespace, key}, {type:store_rag, namespace}, or {type:notify_webhook, url}. Omit for none. store_kvp meters kvp_ops, store_rag meters rag_index, notify_webhook meters outbound_http when the run happens.",
      ),
    onFailure: z
      .array(z.record(z.unknown()))
      .optional()
      .describe(
        "Actions after retries are exhausted, for action=create. Same object shapes as onSuccess. Omit for none.",
      ),
    scheduleId: z
      .string()
      .optional()
      .describe(
        "Schedule id. Required for get and delete. Optional filter for runs. Omit for create and list.",
      ),
    status: z
      .enum(["pending", "running", "retrying", "failed", "delivered", "skipped"])
      .optional()
      .describe(
        "Filter for action=runs. failed means retries are exhausted. Omit for every status. Ignored by other actions.",
      ),
    limit: z
      .number()
      .optional()
      .describe(
        "Page size for action=runs. Default 50, maximum 100. Ignored by create, list, get, and delete.",
      ),
    offset: z
      .number()
      .optional()
      .describe(
        "Row offset for action=runs. Default 0. Ignored by create, list, get, and delete.",
      ),
  },
  async () => stub(),
);
