// @ts-check
import { defineConfig } from 'astro/config';
import { execSync } from 'child_process';

/**
 * Automatically determine site + base for GitHub Pages.
 *
 * - username.github.io repo → site at root (https://username.github.io)
 * - any other repo → project site (https://username.github.io/reponame)
 *
 * Works in GitHub Actions (via GITHUB_REPOSITORY) and locally (via git remote).
 */
function getSiteAndBase() {
  let owner = 'example';
  let repo = '';

  // 1. GitHub Actions environment (highest priority)
  const ghRepo = process.env.GITHUB_REPOSITORY;
  if (ghRepo) {
    [owner, repo] = ghRepo.split('/');
  } else {
    // 2. Try to detect from local git remote (great for `bun dev` / local builds)
    try {
      const remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      // Supports:
      //   git@github.com:owner/repo.git
      //   https://github.com/owner/repo.git
      //   https://github.com/owner/repo
      const match = remoteUrl.match(/[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    } catch {
      // No git remote or command failed — use defaults
    }
  }

  const isUserSite = repo === `${owner}.github.io`;
  const site = `https://${owner}.github.io`;
  const base = isUserSite ? undefined : `/${repo}`;

  return { site, base };
}

const { site, base } = getSiteAndBase();

// https://astro.build/config
export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  // No manual configuration needed for GitHub Pages URLs.
  // See README for details.
});

