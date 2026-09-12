import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("SelectTrigger canonical memenuhi touch target dan semantic invalid", async () => {
  const trigger = await read("src/components/ui/select/SelectTrigger.vue");
  assert.match(trigger, /data-\[size=default\]:h-11/);
  assert.match(trigger, /aria-invalid:border-destructive/);
  assert.doesNotMatch(trigger, /rounded-lg/);
});

test("DatePicker canonical typed, aksesibel, dan menutup popover setelah memilih", async () => {
  const picker = await read("src/components/ui/datepicker/DatePicker.vue");
  assert.match(picker, /DateValue/);
  assert.match(picker, /open/);
  assert.match(picker, /open\.value = false/);
  assert.match(picker, /aria-invalid/);
  assert.match(picker, /aria-describedby/);
  assert.match(picker, /aria-labelledby/);
  assert.match(picker, /:size="props\.size"/);
  assert.match(picker, /import \{ Button \} from "\.\.\/button"/);
  assert.match(picker, /<Button[\s\S]*variant="outline"/);
  assert.doesNotMatch(picker, /<button/);
  assert.match(picker, /<PopoverContent class="z-\[100\] w-auto p-0"/);
  assert.doesNotMatch(picker, /<PopoverContent[^>]*rounded-md|<PopoverContent[^>]*\bborder\b/);
  assert.doesNotMatch(picker, /\bas any\b/);
  assert.doesNotMatch(picker, /slate-|dark:\[#/);
});
