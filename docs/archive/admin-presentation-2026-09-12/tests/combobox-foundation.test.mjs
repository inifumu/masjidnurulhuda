import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Combobox canonical memakai reka dengan filter, empty state, dan contract form", async () => {
  const component = await read("src/components/ui/combobox/Combobox.vue");
  assert.match(component, /ComboboxRoot/);
  assert.match(component, /ComboboxInput/);
  assert.match(component, /ComboboxEmpty/);
  assert.equal((component.match(/<ComboboxInput/g) ?? []).length, 1);
  assert.match(component, /aria-labelledby/);
  assert.match(component, /aria-describedby/);
  assert.match(component, /min-h-11/);
  assert.match(component, /update:modelValue/);
});
