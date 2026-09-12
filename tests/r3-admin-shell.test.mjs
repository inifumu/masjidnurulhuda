import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('active admin presentation is free of custom CSS and legacy components', async () => {
  const paths = ['src/App.vue', 'src/layouts/AdminLayoutV2.vue', 'src/layouts/AdminSettingsLayout.vue', ...['LoginV2','DashboardV2','FinanceV2','MediaLibrary','GaleriDokumentasi','PublicationsView','PublicationUnavailable'].map(f => 'src/views/admin/' + f + '.vue'), ...['FunctionalCashForm','FunctionalTransactions','FunctionalSettings','FunctionalMediaNavigation','FunctionalMediaUpload'].map(f => 'src/components/admin/' + f + '.vue')];
  for (const path of paths) {
    const source = await readFile(path, 'utf8');
    assert.doesNotMatch(source, /<style\b|\s:?(?:class|style)=|\.css['"]|v-ripple/, path);
    assert.doesNotMatch(source, /components\/(?:legacy|ui)\/|useAdminShellTheme|useTheme|vue-sonner/, path);
  }
  const main = await readFile('src/main.ts', 'utf8');
  assert.doesNotMatch(main, /import\s+['"][^'"]+\.css/);
  assert.ok(main.includes('import("./publicStyles")'));
});
