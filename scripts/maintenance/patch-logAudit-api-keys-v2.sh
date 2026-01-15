#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

node - <<'NODE'
const fs = require('fs');

function patchLibSupabase() {
  const p = 'lib/supabase.ts';
  if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
  let s = fs.readFileSync(p,'utf8');

  const reFn = /export\s+async\s+function\s+logAudit\s*\([\s\S]*?\n}\n/;
  if (!reFn.test(s)) {
    throw new Error("Could not locate `export async function logAudit(...)` block in lib/supabase.ts");
  }

  const replacement = `export type LogAuditEvent = {
  userId: string;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * logAudit supports BOTH:
 *  1) New form: logAudit({ userId, action, resource?, metadata? })
 *  2) Legacy positional form: logAudit(userId, action, resource?, scope?, permission?, ...extra)
 *
 * Prefer the object form in new code.
 */
export async function logAudit(event: LogAuditEvent): Promise<void>;
export async function logAudit(
  userId: unknown,
  action: unknown,
  resource?: unknown,
  scopeOrMeta?: unknown,
  permissionMaybe?: unknown,
  ...extra: unknown[]
): Promise<void>;
export async function logAudit(
  a: unknown,
  b?: unknown,
  c?: unknown,
  d?: unknown,
  e?: unknown,
  ...extra: unknown[]
): Promise<void> {
  // Normalize to object form
  let event: LogAuditEvent;

  if (typeof a === "object" && a !== null && b === undefined) {
    const obj = a as any;
    event = {
      userId: String(obj.userId ?? obj.user_id ?? ""),
      action: String(obj.action ?? ""),
      resource: obj.resource ?? null,
      metadata: obj.metadata ?? null,
    };
  } else {
    const meta =
      d && typeof d === "object"
        ? (d as any)
        : {
            scope: d === undefined ? null : String(d),
            permission: e === undefined ? null : String(e),
            extra,
          };

    event = {
      userId: String(a ?? ""),
      action: String(b ?? ""),
      resource: c === undefined ? null : String(c),
      metadata: meta,
    };
  }

  try {
    await (supabaseServer as any)
      .from("audit_logs")
      .insert({
        user_id: event.userId,
        action: event.action,
        resource: event.resource ?? null,
        metadata: event.metadata ?? null,
      });
  } catch {
    // no-op in build/dev if table doesn't exist yet
  }
}
`;

  s = s.replace(reFn, replacement + "\n");
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched lib/supabase.ts logAudit to be legacy-compatible");
}

function patchApiKeysRoute() {
  const p = 'app/api/auth/api-keys/route.ts';
  if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
  let s = fs.readFileSync(p,'utf8');

  // Replace legacy positional logAudit(...) call with object-form call.
  // Match: await logAudit( <args> );
  const reCall = /await\s+logAudit\s*\(\s*([\s\S]*?)\s*\)\s*;?/m;

  // We only want to replace the specific 7-arg call used in this route.
  // We'll look for the action string 'list_api_keys' in the matched args.
  const m = reCall.exec(s);
  if (!m || !m[1].includes("'list_api_keys'") && !m[1].includes('"list_api_keys"')) {
    console.log("ℹ️  Did not find legacy logAudit('list_api_keys', ...) call to replace (skipping).");
    return;
  }

  const replacement = `await logAudit({
    userId: user.id,
    action: "list_api_keys",
    resource: "api_key",
    metadata: { scope: "all", permission: "user:manage_api_keys" }
  });`;

  s = s.replace(reCall, replacement);
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched api-keys route to use object-form logAudit()");
}

try {
  patchLibSupabase();
  patchApiKeysRoute();
} catch (e) {
  console.error("❌ Patch failed:", e.message || e);
  process.exit(1);
}
NODE
