import type { ContentfulStatusCode } from "hono/utils/http-status";
import { TransactionConflictError } from "./transaction.ts";

const KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

export const parseIdempotencyKey = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const key = value.trim();
  return KEY_PATTERN.test(key) ? key : null;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
};

export const canonicalRequestHash = async (payload: unknown): Promise<string> => {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(payload)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

type StoredIdempotency = {
  request_hash: string;
  response_status: ContentfulStatusCode | null;
  response_body: string | null;
};

export const resolveIdempotencyReplay = (stored: StoredIdempotency, requestHash: string) => {
  if (stored.request_hash !== requestHash) {
    throw new TransactionConflictError("Idempotency key telah digunakan dengan payload berbeda.");
  }
  if (stored.response_status === null || stored.response_body === null) {
    throw new TransactionConflictError("Mutasi dengan idempotency key ini masih diproses.");
  }
  return {
    replayed: true as const,
    status: stored.response_status,
    body: JSON.parse(stored.response_body) as unknown,
  };
};

export type IdempotencyContext = {
  key: string;
  operation: "create_direct" | "submit_proposal" | "approve_ketua" | "approve_bendahara" | "reject" | "void";
  requestHash: string;
};

export const getIdempotencyRecord = async (
  db: D1Database, actorId: number, operation: string, key: string,
) => db.prepare(`SELECT request_hash, response_status, response_body, transaction_id
  FROM transaction_idempotency_keys WHERE actor_id = ? AND operation = ? AND idempotency_key = ?`)
  .bind(actorId, operation, key).first<StoredIdempotency & { transaction_id: number | null }>();

export const resolveClaimFailure = async (
  db: D1Database,
  actorId: number,
  context: IdempotencyContext,
): Promise<ReturnType<typeof resolveIdempotencyReplay>> => {
  const stored = await getIdempotencyRecord(db, actorId, context.operation, context.key);
  if (!stored) {
    throw new TransactionConflictError("Mutasi idempotent gagal diklaim; silakan muat ulang data.");
  }
  return resolveIdempotencyReplay(stored, context.requestHash);
};
