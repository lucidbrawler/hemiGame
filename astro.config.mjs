import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Hemi Relay Zone. The game page is static. /api/chains is on-demand
// and only reads public chain data. It does not sign or spend.
export default defineConfig({
  adapter: netlify({
    imageCDN: false,
  }),
  server: {
    port: 4177,
    host: '127.0.0.1',
  },
});
