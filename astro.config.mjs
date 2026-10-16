import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Hemi Relay Zone. The game page is static. /api/chains reads the public
// Hemi mainnet block. /api/scores stores wallet high scores for the list.
// Neither route signs or spends.
export default defineConfig({
  adapter: netlify({
    imageCDN: false,
  }),
  server: {
    port: 4177,
    host: '127.0.0.1',
  },
});
