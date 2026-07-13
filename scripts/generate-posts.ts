#!/usr/bin/env bun
/**
 * Generates blog posts from GitHub Issues for cmless.
 *
 * - Fetches issues labeled "status: published" or "status: unlisted"
 * - Reads author (login, name) from issue; avatar + profile from login
 * - Tags from frontmatter (comma separated or list)
 * - Optional frontmatter at top of issue body (--- ... ---)
 * - Writes Markdown files to src/content/blog/
 *
 * Local usage:
 *   bun run generate-posts        (uses gh auth)
 *   GH_TOKEN=... bun run generate-posts  (explicit token)
 *
 * In GitHub Actions:
 *   env:
 *     GH_TOKEN: ${{ github.token }}
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = 'src/content/blog';
const GENERATED_DIR = 'src/generated';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFrontmatter(rawBody: string): { fm: Record<string, string>; content: string } {
  const match = rawBody.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { fm: {}, content: rawBody.trim() };
  }
  const yamlBlock = match[1];
  const content = match[2].trimStart();

  const fm: Record<string, string> = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[m[1]] = val;
    }
  }
  return { fm, content };
}

function main() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env;

  console.log('Fetching issues using gh CLI...');

  // --state all so we can publish from closed issues too if desired
  const ghCmd = `gh issue list --state all --limit 200 --json number,title,body,labels,createdAt,url,author`;

  let output: string;
  try {
    output = execSync(ghCmd, {
      encoding: 'utf8',
      env,
      stdio: ['pipe', 'pipe', 'inherit'],
    });
  } catch (err) {
    console.error('❌ Failed to list issues with gh.');
    console.error('Make sure the GitHub CLI (gh) is installed and you are logged in (gh auth status).');
    console.error(err);
    process.exit(1);
  }

  let issues: any[] = [];
  try {
    issues = JSON.parse(output);
  } catch (e) {
    console.error('Failed to parse gh output', e);
    process.exit(1);
  }

  // Fetch site title + repo owner login (for site credit + avatar)
  let siteTitle = 'My Blog';
  let ownerLogin = '';
  try {
    const repoOutput = execSync('gh repo view --json description,owner,name', {
      encoding: 'utf8',
      env,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const repo = JSON.parse(repoOutput);
    if (repo.description && typeof repo.description === 'string') {
      const desc = repo.description.trim();
      if (desc) siteTitle = desc;
    }
    ownerLogin = repo.owner?.login || '';
  } catch (err) {
    console.warn('⚠️  Could not fetch repo info, using defaults.');
  }
  console.log(`Using site title: ${siteTitle}`);
  const ownerAvatar = ownerLogin ? `https://github.com/${ownerLogin}.png` : '';

  const posts: any[] = [];

  for (const issue of issues) {
    const labelNames: string[] = (issue.labels || []).map((l: any) =>
      typeof l === 'string' ? l : l.name
    );

    const isPublished = labelNames.some((l) => /^status:\s*published$/i.test(l) || l === 'status:published');
    const isUnlisted = labelNames.some((l) => /^status:\s*unlisted$/i.test(l) || l === 'status:unlisted');

    if (!isPublished && !isUnlisted) continue;

    const status = isPublished ? 'published' : 'unlisted';

    const { fm, content } = parseFrontmatter(issue.body || '');

    const title = (fm.title || issue.title || `Issue #${issue.number}`).trim();
    let slug = (fm.slug || slugify(title) || `issue-${issue.number}`).trim();

    const date = (fm.date || (issue.createdAt ? issue.createdAt.split('T')[0] : '')).trim();
    const description = fm.description || content.split(/\n\n+/)[0]?.slice(0, 180).trim() || '';
    const image = fm.image || '';

    // Author from GitHub issue author (issue author's login)
    const ghAuthor = issue.author || {};
    const author = (fm.author || ghAuthor.name || ghAuthor.login || '').trim();
    const authorUrl = (fm.authorUrl || (ghAuthor.login ? `https://github.com/${ghAuthor.login}` : '')).trim();
    const authorAvatar = (fm.authorAvatar || (ghAuthor.login ? `https://github.com/${ghAuthor.login}.png` : '')).trim();

    // Tags from frontmatter only (comma separated)
    const tags = fm.tags
      ? fm.tags.split(/,\s*/).map((t: string) => t.trim()).filter(Boolean)
      : [];

    const navigation = fm.navigation || '';
    const navigationIndex = fm.navigationIndex ? parseInt(fm.navigationIndex, 10) : 0;

    posts.push({
      slug,
      title,
      date,
      description,
      image,
      status,
      navigation,
      navigationIndex,
      content: content
        // Embed X/Twitter posts
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)[^)]*\)/g,
          (_, _alt, screenName, tweetId) =>
            `<blockquote class="twitter-tweet" data-media-max-width="560"><a href="https://twitter.com/${screenName}/status/${tweetId}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`
        )
        // Embed CodePen pens
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?codepen\.io\/(\w+)\/pen\/([a-zA-Z0-9_-]+)[^)]*\)/g,
          (_, alt, user, slug) =>
            `<iframe height="450" style="width:100%;" scrolling="no" title="${alt.replace(/"/g, '&quot;')}" src="https://codepen.io/${user}/embed/${slug}?default-tab=html%2Cresult" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>`
        )
        // Embed GitHub Gists
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/gist\.github\.com\/(\w+)\/([a-f0-9]+)[^)]*\)/g,
          (_, _alt, user, gistId) =>
            `<script src="https://gist.github.com/${user}/${gistId}.js"></script>`
        )
        // Embed YouTube videos
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^)]*\)/g,
          (_, alt, id) =>
            `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe src="https://www.youtube.com/embed/${id}" title="${alt.replace(/"/g, '&quot;')}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`
        ),
      number: issue.number,
      author,
      authorUrl,
      authorAvatar,
      tags,
    });
  }

  // Remove previous generated posts (but preserve .gitkeep)
  if (existsSync(CONTENT_DIR)) {
    for (const file of readdirSync(CONTENT_DIR)) {
      if (file.endsWith('.md')) {
        rmSync(join(CONTENT_DIR, file));
      }
    }
  }
  mkdirSync(CONTENT_DIR, { recursive: true });

  // Write site metadata (title + repo owner for credit/avatar)
  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(
    join(GENERATED_DIR, 'site.json'),
    JSON.stringify({ siteTitle, owner: { login: ownerLogin, avatarUrl: ownerAvatar } }, null, 2) + '\n',
    'utf8'
  );
  console.log(`✓ generated/site.json (siteTitle: ${siteTitle})`);

  // Build navigation links
  const headerNav = posts
    .filter((p: any) => p.navigation === 'header')
    .map((p: any) => ({ title: p.title, slug: p.slug, navigationIndex: p.navigationIndex }));
  const footerNav = posts
    .filter((p: any) => p.navigation === 'footer')
    .map((p: any) => ({ title: p.title, slug: p.slug, navigationIndex: p.navigationIndex }));

  writeFileSync(
    join(GENERATED_DIR, 'navigation.json'),
    JSON.stringify({ header: headerNav, footer: footerNav }, null, 2) + '\n',
    'utf8'
  );
  console.log(`✓ generated/navigation.json (header: ${headerNav.length}, footer: ${footerNav.length})`);

  for (const p of posts) {
    const lines = [
      `title: ${JSON.stringify(p.title)}`,
      `date: "${p.date}"`,
      `status: ${p.status}`,
    ];
    if (p.description) lines.push(`description: ${JSON.stringify(p.description)}`);
    if (p.image) lines.push(`image: ${p.image}`);
    if (p.author) lines.push(`author: ${JSON.stringify(p.author)}`);
    if (p.authorUrl) lines.push(`authorUrl: ${JSON.stringify(p.authorUrl)}`);
    if (p.authorAvatar) lines.push(`authorAvatar: ${JSON.stringify(p.authorAvatar)}`);
    if (p.tags && p.tags.length) lines.push(`tags: ${JSON.stringify(p.tags)}`);
    if (p.navigation) lines.push(`navigation: ${p.navigation}`);
    lines.push(`navigationIndex: ${p.navigationIndex}`);

    const md = `---\n${lines.join('\n')}\n---\n\n${p.content}\n`;
    const outPath = join(CONTENT_DIR, `${p.slug}.md`);
    writeFileSync(outPath, md, 'utf8');
    console.log(`✓ ${p.slug}.md  (issue #${p.number}, ${p.status})`);
  }

  console.log(`\nGenerated ${posts.length} post(s).`);
}

main();
