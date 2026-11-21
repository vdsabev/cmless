// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { detectGithubRepo, pagesFromRepo } from './scripts/repo.ts';

/**
 * Site + base for GitHub Pages, from GITHUB_REPOSITORY (Actions) or the git
 * origin remote (local builds). Shared with scripts/generate.ts so media paths
 * and the site base always agree.
 *
 * - username.github.io repo → site at root (https://username.github.io)
 * - any other repo → project site (https://username.github.io/reponame)
 */
const { site, base } = pagesFromRepo(detectGithubRepo());

// https://astro.build/config
export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  server: { host: true, allowedHosts: true },
  vite: {
    plugins: [tailwindcss()],
  },
  // No manual configuration needed for GitHub Pages URLs.
  // See README for details.
});
