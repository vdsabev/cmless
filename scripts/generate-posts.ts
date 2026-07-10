#!/usr/bin/env bun
/**
 * Generates blog posts from GitHub Issues for cmless.
 *
 * - Fetches issues labeled "status: published" or "status: unlisted"
 * - Optional frontmatter at top of issue body (--- ... ---)
 * - Writes Markdown files to src/content/blog/
 * - Completely external images (drag & drop in GitHub Issues works)
 *
 * Local usage:
 *   GH_TOKEN=ghp_yourpat bun run generate-posts
 *
 * In GitHub Actions:
 *   env:
 *     GH_TOKEN: ${{ github.token }}
 *   (The default GITHUB_TOKEN has the necessary permissions when
 *    the workflow has `issues: read`.)
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = 'src/content/blog';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
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

  if (!token) {
    console.error('❌ No GH_TOKEN (or GITHUB_TOKEN) found.');
    console.error('In GitHub Actions, set:');
    console.error('  env:');
    console.error('    GH_TOKEN: ${{ github.token }}');
    console.error('For local: GH_TOKEN=... bun run generate-posts');
    process.exit(1);
  }

  console.log('Fetching issues using gh CLI...');

  // --state all so we can publish from closed issues too if desired
  // Limit high to get everything reasonable for a blog
  const ghCmd = `gh issue list --state all --limit 200 --json number,title,body,labels,createdAt,url`;

  let output: string;
  try {
    output = execSync(ghCmd, {
      encoding: 'utf8',
      env: { ...process.env, GH_TOKEN: token },
      stdio: ['pipe', 'pipe', 'inherit'],
    });
  } catch (err) {
    console.error('❌ Failed to list issues with gh.');
    console.error('Make sure the GitHub CLI (gh) is installed and the token has issues:read permission.');
    console.error('For local runs: export GH_TOKEN=...');
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

    posts.push({
      slug,
      title,
      date,
      description,
      image,
      status,
      content,
      number: issue.number,
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

  for (const p of posts) {
    const lines = [
      `title: ${JSON.stringify(p.title)}`,
      `date: "${p.date}"`,
      `status: ${p.status}`,
    ];
    if (p.description) lines.push(`description: ${JSON.stringify(p.description)}`);
    if (p.image) lines.push(`image: ${p.image}`);

    const md = `---\n${lines.join('\n')}\n---\n\n${p.content}\n`;
    const outPath = join(CONTENT_DIR, `${p.slug}.md`);
    writeFileSync(outPath, md, 'utf8');
    console.log(`✓ ${p.slug}.md  (issue #${p.number}, ${p.status})`);
  }

  console.log(`\nGenerated ${posts.length} post(s).`);
}

main();
