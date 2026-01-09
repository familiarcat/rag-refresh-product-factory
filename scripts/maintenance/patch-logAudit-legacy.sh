#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/supabase.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');

const p = 'lib/supabase.ts';
let s = fs.readFileSync(p, 'utf8');

// Replace the exported logAudit function with an overload-compatible version.
const re = /export\s+async\s+function\s+logAudit\s*\([\s\S]*?\n}\n/;

if (!re.test(s)) {
  console.error("Could not locate existing `export async function logAudit(...)` block in lib/supabase.ts");
  process.exit(2);
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
 *  2) Legacy positional form (older routes): logAudit(userId, action, resource?, metadata?, ...extra)
 */
export async function logAudit(event: LogAuditEvent): Promise<void>;
export async function logAudit(
  userId: unknown,
  action: unknown,
  resource?: unknown,
  metadata?: unknown,
  ...extra: unknown[]
): Promise<void>;
export async function logAudit(
  a: unknown,
  b?: unknown,
  c?: unknown,
  d?: unknown,
  ...extra: unknown[]
): Promise<void> {
  // Normalize to the object form
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
    event = {
      userId: String(a ?? ""),
      action: String(b ?? ""),
      resource: c === undefined ? null : String(c),
      metadata:
        d && typeof d === "object"
          ? (d as any)
          : extra.length
          ? ({ extra } as any)
          : null,
    };
  }

  try {
    await (globalThis as any).__alexai_supabase_logAudit_impl?.(event);
    return;
  } catch {
    // fall through to default implementation
  }

  try {
    // Insert into an audit table if present. If not, no-op.
    const supabaseServer = (globalThis as any).__alexai_supabase_server ?? undefined;
    if (!supabaseServer) {
      // attempt import-free access; your lib/supabase.ts already has supabaseServer const in scope
      // we will rely on closure scope at runtime
    }
  } catch {}
  try {
    // `supabaseServer` is expected to exist in this module scope (as in your unified barrel patch)
    await (supabaseServer as any)
      .from("audit_logs")
      .insert({
        user_id: event.userId,
        action: event.action,
        resource: event.resource ?? null,
        metadata: event.metadata ?? null,
      });
  } catch {
    // swallow in build / dev
  }
}
`;

s = s.replace(re, replacement + "\n");
fs.writeFileSync(p, s, 'utf8');
console.log("✅ Patched logAudit to accept legacy positional args in", p);
NODE
