import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'extension',
  manifest: {
    name: 'Crosslister',
    description: 'List clothing once, post to Poshmark and Depop.',
    permissions: ['storage', 'tabs'],
    host_permissions: ['https://poshmark.com/*', 'https://www.depop.com/*', 'https://*.supabase.co/*'],
  },
});
