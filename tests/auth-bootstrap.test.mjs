import test from "node:test";
import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "../src/stores/authStore.ts";

const withFetch = async (fetchImpl, run) => {
  const original = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try { await run(); } finally { globalThis.fetch = original; }
};

const createStore = () => {
  setActivePinia(createPinia());
  return useAuthStore();
};

test("401 definitif menandai unauthenticated dan mengizinkan redirect login", async () => {
  const store = createStore();
  await withFetch(async () => new Response(null, { status: 401 }), () => store.checkAuth());
  assert.equal(store.authStatus, "unauthenticated");
  assert.equal(store.shouldRedirectToLogin, true);
});

test("500 menjadi error operasional dan tidak mengizinkan redirect login", async () => {
  const store = createStore();
  await withFetch(async () => new Response(null, { status: 500 }), () => store.checkAuth());
  assert.equal(store.authStatus, "error");
  assert.equal(store.shouldRedirectToLogin, false);
});

test("network error dapat diretry dan retry sukses mengautentikasi sesi", async () => {
  const store = createStore();
  let attempts = 0;
  await withFetch(async () => {
    attempts += 1;
    if (attempts === 1) throw new TypeError("offline");
    return Response.json({ status: "success", data: { id: 7, name: "Ketua", role: "ketua" } });
  }, async () => {
    await store.checkAuth();
    assert.equal(store.authStatus, "error");
    await store.retryAuth();
  });
  assert.equal(attempts, 2);
  assert.equal(store.authStatus, "authenticated");
  assert.equal(store.isAuthenticated, true);
});

test("response sukses dengan kontrak rusak tetap error operasional", async () => {
  const store = createStore();
  await withFetch(async () => Response.json({ status: "unexpected" }), () => store.checkAuth());
  assert.equal(store.authStatus, "error");
  assert.equal(store.shouldRedirectToLogin, false);
});

test("response bootstrap lama tidak menimpa retry yang lebih baru", async () => {
  const store = createStore();
  let resolveOld;
  const oldResponse = new Promise((resolve) => { resolveOld = resolve; });
  let calls = 0;
  await withFetch(async () => {
    calls += 1;
    if (calls === 1) return oldResponse;
    return Response.json({ status: "success", data: { id: 9, name: "Bendahara", role: "bendahara" } });
  }, async () => {
    const first = store.checkAuth();
    await store.retryAuth();
    resolveOld(new Response(null, { status: 401 }));
    await first;
  });
  assert.equal(store.authStatus, "authenticated");
  assert.equal(store.user?.id, 9);
});
