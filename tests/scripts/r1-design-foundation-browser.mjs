import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.R1_DESIGN_BASE_URL || "http://127.0.0.1:4175";
const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const evidence = [];
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseURL}/_design-system`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Informasi masjid yang hangat, jelas, dan dapat dipercaya." }).waitFor();

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      buttonHeights: [...document.querySelectorAll("button")].map((element) => element.getBoundingClientRect().height),
      inputHeights: [...document.querySelectorAll("input")].map((element) => element.getBoundingClientRect().height),
      googleFonts: [...document.styleSheets].some((sheet) => sheet.href?.includes("fonts.googleapis.com")),
    }));

    assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, `${viewport.name}: horizontal overflow`);
    assert.ok(dimensions.buttonHeights.every((height) => height >= 44), `${viewport.name}: button di bawah 44px`);
    assert.ok(dimensions.inputHeights.every((height) => height >= 44), `${viewport.name}: input di bawah 44px`);
    assert.equal(dimensions.googleFonts, false, `${viewport.name}: masih memuat Google Fonts`);
    assert.deepEqual(errors, [], `${viewport.name}: console error ${errors.join(" | ")}`);

    evidence.push({ viewport: `${viewport.width}x${viewport.height}`, overflow: "pass", touchTargets: "pass", console: "clean" });
    await page.close();
  }
  console.log(JSON.stringify({ componentLab: "pass", evidence }));
} finally {
  await browser.close();
}
