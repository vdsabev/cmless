/**
 * GitHub repo detection and GitHub Pages URLs, shared by astro.config.mjs and
 * scripts/generate.ts so the site base and localized media paths always agree.
 */

import { spawnSync } from 'child_process';

/** `owner/repo` from a git remote URL (ssh or https, with or without `.git`). */
export function parseGithubRemote(remoteUrl: string): string {
  const match = remoteUrl.trim().match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/);
  return match ? `${match[1]}/${match[2]}` : '';
}

/**
 * `owner/repo`: GH_REPO (preview another cmless repo locally), else
 * GITHUB_REPOSITORY (Actions), else the origin remote, else ''.
 */
export function detectGithubRepo(env: Record<string, string | undefined> = process.env): string {
  const fromEnv = (env.GH_REPO || env.GITHUB_REPOSITORY || '').trim();
  if (fromEnv) return fromEnv;
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  return result.status === 0 ? parseGithubRemote(result.stdout || '') : '';
}

/**
 * GitHub Pages site and base path for a repo.
 * - `owner/owner.github.io` → user site at the root (`/`)
 * - any other repo → project site under `/<repo>/`
 */
export function pagesFromRepo(repo: string): { site: string; base: string } {
  const [owner, name] = repo.split('/');
  if (!owner || !name) return { site: 'https://example.github.io', base: '/' };
  return {
    site: `https://${owner}.github.io`,
    base: name === `${owner}.github.io` ? '/' : `/${name}/`,
  };
}
