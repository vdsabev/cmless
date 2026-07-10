// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  // For GitHub Pages user/org site, set to https://<username>.github.io
  // For project site (username.github.io/reponame), also set base: '/reponame'
  // See README for details.
});

