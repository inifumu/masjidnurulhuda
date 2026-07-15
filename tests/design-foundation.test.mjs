import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("runtime CSS memakai token Civic Editorial dan satu font self-hosted", async () => {
  const css = await read("src/assets/main.css");
  assert.match(css, /--brand-emerald:\s*#0B6B4B/i);
  assert.match(css, /--brand-gold:\s*#D6A62E/i);
  assert.match(css, /--background:\s*#F7F7F2/i);
  assert.match(css, /--foreground:\s*#17211C/i);
  assert.match(css, /--radius:\s*0\.625rem/i);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|font-family:\s*["']Geist/i);
});

test("button dan input canonical memenuhi touch target 44px", async () => {
  const [button, input] = await Promise.all([
    read("src/components/ui/button/index.ts"),
    read("src/components/ui/input/Input.vue"),
  ]);
  assert.match(button, /default[^\n]*h-11/);
  assert.match(button, /icon[^\n]*size-11/);
  assert.match(button, /gold:/);
  assert.match(input, /h-11/);
});

test("component lab tersedia hanya sebagai route development", async () => {
  const [router, app] = await Promise.all([
    read("src/router/index.ts"),
    read("src/App.vue"),
  ]);
  assert.match(router, /import\.meta\.env\.DEV/);
  assert.match(router, /path:\s*["']\/_design-system["']/);
  assert.match(router, /DesignSystemLab\.vue/);
  assert.match(router, /meta:\s*\{\s*skipAuthBootstrap:\s*true\s*\}/);
  assert.match(router, /to\.meta\.skipAuthBootstrap/);
  assert.match(app, /import\.meta\.env\.DEV/);
  assert.match(app, /\/_design-system/);
});
