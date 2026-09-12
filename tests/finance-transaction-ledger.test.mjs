import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("state dan payload kas memisahkan judul dari detail serta reset keduanya", async () => {
  const [state, service, actions] = await Promise.all([
    read("src/composables/admin/kas/useKasState.ts"),
    read("src/services/admin/kasService.ts"),
    read("src/composables/admin/kas/useKasActions.ts"),
  ]);
  assert.match(state, /keperluan: string/);
  assert.match(service, /keperluan: string/);
  assert.match(service, /keperluan: form\.keperluan\.trim\(\)/);
  assert.match(service, /keterangan: form\.keterangan\.trim\(\)/);
  assert.match(actions, /formInput\.value\.keperluan = ""/);
  assert.match(actions, /formProposal\.value\.keperluan = ""/);
});
