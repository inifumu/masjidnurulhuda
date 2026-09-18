import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { applyAdminTheme } from "./utils/adminTheme";

async function bootstrap() {
  const app = createApp(App).use(createPinia());
  const isAdminDocument = /^\/admin(?:\/|$)/.test(window.location.pathname);

  if (isAdminDocument) {
    applyAdminTheme();
    await import("./adminStyles");
  } else {
    await import("./publicStyles");
  }

  app.use(router).mount("#app");
}

void bootstrap();
