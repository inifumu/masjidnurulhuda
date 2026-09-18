import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("public data states render title and description contracts", async () => {
  const empty = await read("src/components/ui/data-state/EmptyState.vue");
  const error = await read("src/components/ui/data-state/ErrorState.vue");

  for (const source of [empty, error]) {
    assert.match(source, /defineProps/);
    assert.match(source, /props\.title/);
    assert.match(source, /props\.description/);
  }
});

test("public error state exposes retry only when handled", async () => {
  const source = await read("src/components/ui/data-state/ErrorState.vue");

  assert.match(source, /<Button/);
  assert.match(source, /Coba lagi/);
  assert.match(source, /emit\(["']retry["']\)/);
  assert.match(source, /hasRetryListener/);
});
