import { defineConfig } from 'vite';

export default defineConfig({
  // Local development stays at /. Pages serves this project under its repo name.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/RecreateRocketLeague/' : '/',
});
