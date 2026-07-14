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

function parseFrontmatter(rawBody: string): { frontmatter: Record<string, string>; content: string } {
  const match = rawBody.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: rawBody.trim() };
  }

  const yamlBlock = match[1];
  const content = match[2].trimStart();

  const frontmatter: Record<string, string> = {};
  const lines = yamlBlock.split(/\r?\n/);
  let currentKey = '';
  let currentList: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const listMatch = trimmed.match(/^-\s+(.*)$/);
    if (listMatch && currentKey) {
      currentList.push(listMatch[1].trim());
      continue;
    }
    if (currentKey && currentList.length) {
      frontmatter[currentKey] = currentList.join(', ');
      currentList = [];
    }
    const matches = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (matches) {
      currentKey = matches[1];
      let value = matches[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value) {
        frontmatter[currentKey] = value;
      }
      currentList = [];
    }
  }
  if (currentKey && currentList.length) {
    frontmatter[currentKey] = currentList.join(', ');
  }
  return { frontmatter: frontmatter, content };
}

function main() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env;

  console.log('Fetching issues using gh CLI...');

  // --state all so we can publish from closed issues too if desired
  const getGitHubIssues = `gh issue list --state all --limit 200 --json number,title,body,labels,createdAt,url,author`;

  let output: string;
  try {
    output = execSync(getGitHubIssues, {
      encoding: 'utf8',
      env,
      stdio: ['pipe', 'pipe', 'inherit'],
    });
  } catch (error) {
    console.error('❌ Failed to list issues with gh.');
    console.error('Make sure the GitHub CLI (gh) is installed and you are logged in (gh auth status).');
    console.error(error);
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
  let socialPreviewUrl = '';
  try {
    const repoOutput = execSync('gh repo view --json description,owner,name,openGraphImageUrl', {
      encoding: 'utf8',
      env,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const repo = JSON.parse(repoOutput);
    if (repo.description && typeof repo.description === 'string') {
      const desc = repo.description.trim();
      if (desc) {
        siteTitle = desc;
      }
    }
    ownerLogin = repo.owner?.login || '';
    socialPreviewUrl = repo.openGraphImageUrl || '';
  } catch (err) {
    console.warn('⚠️  Could not fetch repo info, using defaults.');
  }
  console.log(`Using site title: ${siteTitle}`);
  const ownerAvatar = ownerLogin ? `https://github.com/${ownerLogin}.png` : '';

  const posts: any[] = [];

  for (const issue of issues) {
    const labelNames: string[] = (issue.labels || []).map((label: any) => typeof label === 'string' ? label : label.name);
    const isPublished = labelNames.some((label) => /^status:\s*published$/i.test(label) || label === 'status:published');
    const isUnlisted = labelNames.some((label) => /^status:\s*unlisted$/i.test(label) || label === 'status:unlisted');

    if (!isPublished && !isUnlisted) continue;

    const status = isPublished ? 'published' : 'unlisted';

    // Frontmatter
    const { frontmatter, content } = parseFrontmatter(issue.body || '');

    const title = (frontmatter.title || issue.title || `Issue #${issue.number}`).trim();
    const slug = (frontmatter.slug || slugify(title) || `issue-${issue.number}`).trim();
    const date = (frontmatter.date || (issue.createdAt ? issue.createdAt.split('T')[0] : '')).trim();
    const description = frontmatter.description || content.split(/\n\n+/)[0]?.slice(0, 180).trim() || '';
    
    // Image
    let image = frontmatter.image;
    if (!image) {
      const firstLine = content.split('\n')[0]?.trim() || '';
      const imgTagMatch = firstLine.match(/^<img\s[^>]*src=(["'])([^"']+)\1[^>]*\/?\s*>$/i);
      if (imgTagMatch) {
        image = imgTagMatch[2];
      }
    }
    if (!image) {
      image = socialPreviewUrl;
    }

    // Author from GitHub issue author (issue author's login)
    const githubAuthor = issue.author || {};
    const author = (frontmatter.author || githubAuthor.name || githubAuthor.login || '').trim();
    const authorUrl = (frontmatter.authorUrl || (githubAuthor.login ? `https://github.com/${githubAuthor.login}` : '')).trim();
    const authorAvatar = (frontmatter.authorAvatar || (githubAuthor.login ? `https://github.com/${githubAuthor.login}.png` : '')).trim();

    // Tags from frontmatter (comma separated or YAML list)
    const tags = frontmatter.tags
      ? frontmatter.tags.split(/,\s*/).map((tag: string) => tag.trim()).filter(Boolean)
      : [];

    // Navigation - insert link to page in header or footer; index sorts the link relative to other links 
    const navigation = frontmatter.navigation || '';
    const navigationIndex = frontmatter.navigationIndex ? parseInt(frontmatter.navigationIndex, 10) : 0;

    posts.push({
      status,
      number: issue.number,
      title,
      slug,
      date,
      description,
      image,
      tags,
      author,
      authorUrl,
      authorAvatar,
      navigation,
      navigationIndex,
      content: content
        // Embed YouTube videos
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^)]*\)/g,
          (_, alt, id) =>
            `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe src="https://www.youtube.com/embed/${id}" title="${alt.replace(/"/g, '&quot;')}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`
        )
        // Embed X/Twitter posts
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)[^)]*\)/g,
          (_, _alt, screenName, tweetId) =>
            `<blockquote class="twitter-tweet" data-media-max-width="560"><a href="https://twitter.com/${screenName}/status/${tweetId}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`
        )
        // Embed Instagram posts/reels
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)[^)]*\)/g,
          (_, alt, type, shortcode) =>
            `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/${type}/${shortcode}/" style="background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:1px;max-width:540px;min-width:326px;padding:0;width:calc(100% - 2px)"></blockquote><script async src="//www.instagram.com/embed.js"></script>`
        )
        // Embed GitHub Gists
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/gist\.github\.com\/(\w+)\/([a-f0-9]+)[^)]*\)/g,
          (_, _alt, user, gistId) =>
            `<script src="https://gist.github.com/${user}/${gistId}.js"></script>`
        )
        // Embed CodePen pens
        .replace(
          /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?codepen\.io\/(\w+)\/pen\/([a-zA-Z0-9_-]+)[^)]*\)/g,
          (_, alt, user, slug) =>
            `<iframe height="450" style="width:100%;" scrolling="no" title="${alt.replace(/"/g, '&quot;')}" src="https://codepen.io/${user}/embed/${slug}?default-tab=html%2Cresult" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>`
        ),
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
    JSON.stringify({ siteTitle, owner: { login: ownerLogin, avatarUrl: ownerAvatar }, socialPreviewUrl }, null, 2) + '\n',
    'utf8'
  );
  console.log(`✓ generated/site.json (siteTitle: ${siteTitle})`);

  // Build navigation links
  const headerNavLinks = posts
    .filter((post: any) => post.navigation === 'header')
    .map((post: any) => ({ title: post.title, slug: post.slug, navigationIndex: post.navigationIndex }));
  const footerNavLinks = posts
    .filter((post: any) => post.navigation === 'footer')
    .map((post: any) => ({ title: post.title, slug: post.slug, navigationIndex: post.navigationIndex }));

  writeFileSync(
    join(GENERATED_DIR, 'navigation.json'),
    JSON.stringify({ header: headerNavLinks, footer: footerNavLinks }, null, 2) + '\n',
    'utf8'
  );
  console.log(`✓ generated/navigation.json (header: ${headerNavLinks.length}, footer: ${footerNavLinks.length})`);

  for (const post of posts) {
    const lines = [];
    const fields = [
      'status',
      'title',
      'date',
      'description',
      'image',
      'author',
      'authorUrl',
      'authorAvatar',
      'tags',
      'navigation',
      'navigationIndex',
    ];
    for (const field of fields) {
      const value = post[field];
      if (
        value != null &&
        !(typeof value === 'string' && value.trim() === '') &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        lines.push(`${field}: ${JSON.stringify(value)}`);
      }
    }

    const markdown = `---\n${lines.join('\n')}\n---\n\n${post.content}\n`;
    const outPath = join(CONTENT_DIR, `${post.slug}.md`);
    writeFileSync(outPath, markdown, 'utf8');
    console.log(`✓ ${post.slug}.md  (issue #${post.number}, ${post.status})`);
  }

  console.log(`\nGenerated ${posts.length} post(s).`);
}

main();
