import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    devServer({
      entry: "server/index.ts",
      adapter: cloudflareAdapter,
      // Regex: Abaikan semua request, KECUALI yang diawali dengan "/api"
      exclude: [/^(?!\/api).*/],
      injectClientScript: false,
    }),
  ],
});
