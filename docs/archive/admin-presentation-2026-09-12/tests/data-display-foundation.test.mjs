import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
test("data display canonical menyediakan desktop table, mobile card, dan timeline", async () => {
  const [table, card, timeline] = await Promise.all([read("src/components/ui/data-table/DataTable.vue"), read("src/components/ui/mobile-data-card/MobileDataCard.vue"), read("src/components/ui/timeline/Timeline.vue")]);
  assert.match(table, /<table/); assert.match(table, /hidden.*md:block/); assert.match(table, /caption/);
  assert.match(card, /md:hidden/); assert.match(card, /name="actions"/);
  assert.match(timeline, /<ol/); assert.match(timeline, /name="meta"/); assert.match(timeline, /aria-hidden="true"/);
});
