import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("FormField menghubungkan label, description, error, dan control secara semantik", async () => {
  const component = await read("src/components/ui/form-field/FormField.vue");
  assert.match(component, /:for="controlId"/);
  assert.match(component, /:id="descriptionId"/);
  assert.match(component, /:id="errorId"/);
  assert.match(component, /:id="labelId"/);
  assert.match(component, /:labelledby="labelId"/);
  assert.match(component, /role="alert"/);
  assert.match(component, /name="control"/);
  assert.match(component, /ariaDescribedby/);
});

test("CurrencyInput memakai formatter Rupiah canonical dan contract input aksesibel", async () => {
  const component = await read("src/components/ui/currency-input/CurrencyInput.vue");
  assert.match(component, /formatInputRupiah/);
  assert.match(component, /parseInputRupiah/);
  assert.match(component, /inputmode="numeric"/);
  assert.match(component, /aria-invalid/);
  assert.match(component, /aria-describedby/);
  assert.match(component, /aria-labelledby/);
  assert.match(component, /update:modelValue/);
  assert.match(component, /input\.value = formatted/);
  assert.match(component, /font-tabular/);
});
