import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("dialog operasional memakai reka dan mempertahankan pending guard", async () => {
  const [confirm, audit] = await Promise.all([
    read("src/components/ui/ConfirmModal.vue"),
    read("src/components/admin/kas/TransactionAuditDialog.vue"),
  ]);
  for (const source of [confirm, audit]) assert.doesNotMatch(source, /@headlessui\/vue/);
  assert.match(confirm, /@update:open/);
  assert.match(confirm, /pending/);
  assert.match(confirm, /DialogContent/);
  assert.match(audit, /@update:open/);
  assert.match(audit, /reasonInput/);
  assert.match(audit, /DialogContent/);
});
