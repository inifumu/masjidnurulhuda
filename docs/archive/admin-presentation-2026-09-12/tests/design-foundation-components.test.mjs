import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("status indicator memiliki tone semantik dan label non-color", async () => {
  const component = await read("src/components/ui/status/StatusIndicator.vue");
  assert.match(component, /success.*warning.*info.*destructive/s);
  assert.match(component, /role="status"/);
  assert.match(component, /<slot\s*\/>/);
});

test("page header dan metric menyediakan hierarchy reusable", async () => {
  const [header, metric] = await Promise.all([
    read("src/components/ui/page-header/PageHeader.vue"),
    read("src/components/ui/metric/Metric.vue"),
  ]);
  assert.match(header, /<h1/);
  assert.match(header, /name="actions"/);
  assert.match(metric, /font-tabular/);
  assert.match(metric, /aria-live="polite"/);
});

test("data state canonical memiliki semantic status dan retry action", async () => {
  const [empty, error, permission, conflict] = await Promise.all([
    read("src/components/ui/data-state/EmptyState.vue"),
    read("src/components/ui/data-state/ErrorState.vue"),
    read("src/components/ui/data-state/PermissionState.vue"),
    read("src/components/ui/data-state/ConflictState.vue"),
  ]);
  assert.match(empty, /name="action"/);
  assert.match(error, /role="alert"/);
  assert.match(error, /emit\(["']retry["']\)/);
  assert.match(permission, /role="status"/);
  assert.match(conflict, /role="alert"/);
  assert.match(conflict, /emit\(["']refresh["']\)/);
});

test("component lab memakai foundation primitives, bukan status hardcoded", async () => {
  const lab = await read("src/views/dev/DesignSystemLab.vue");
  for (const name of ["PageHeader", "Metric", "StatusIndicator", "EmptyState", "ErrorState", "PermissionState", "ConflictState"]) {
    assert.match(lab, new RegExp(name));
  }
});
