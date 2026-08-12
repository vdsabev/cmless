/**
 * Localize GitHub issue attachment URLs into public/media/.
 *
 * github.com/user-attachments/assets/… 302s to a 5-minute S3 signature, so
 * hotlinking from the static site breaks. Attachment UUIDs are immutable:
 * skip a file that is already on disk (local + Actions cache).
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

export const MEDIA_DIR = 'public/media';

/** Match GitHub-hosted issue/PR/discussion attachments (not avatars or repo files). */
export const GITHUB_ATTACHMENT_RE =
  /https:\/\/(?:github\.com\/user-attachments\/assets\/[0-9a-fA-F-]+|github\.com\/[^/\s"'<>]+\/[^/\s"'<>]+\/assets\/\d+\/[0-9a-fA-F-]+|user-images\.githubusercontent\.com\/[^\s"'<>)]+|private-user-images\.githubusercontent\.com\/[^\s"'<>)]+)/gi;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

export function pagesBaseFromRepo(repo: string): string {
  const [owner, name] = repo.split('/');
  if (!owner || !name) return '/';
  return name === `${owner}.github.io` ? '/' : `/${name}/`;
}

export function isGithubAttachmentUrl(url: string): boolean {
  GITHUB_ATTACHMENT_RE.lastIndex = 0;
  const match = url.match(GITHUB_ATTACHMENT_RE);
  return !!match && match[0] === url;
}

/** Stable cache key: UUID for user-attachments, filename for user-images, else hash. */
export function cacheIdForUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return sha8(url);
  }
  const path = parsed.pathname;

  const attachment = path.match(/\/user-attachments\/assets\/([0-9a-fA-F-]+)$/);
  if (attachment) return attachment[1].toLowerCase();

  const repoAsset = path.match(/\/assets\/\d+\/([0-9a-fA-F-]+)$/);
  if (repoAsset) return repoAsset[1].toLowerCase();

  if (
    parsed.hostname === 'user-images.githubusercontent.com' ||
    parsed.hostname === 'private-user-images.githubusercontent.com'
  ) {
    const leaf = path.split('/').pop() || '';
    const bare = leaf.replace(/\.[a-zA-Z0-9]+$/, '');
    return bare || sha8(path);
  }

  return sha8(parsed.origin + path);
}

function sha8(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function collectGithubImageUrls(...texts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const text of texts) {
    if (!text) continue;
    GITHUB_ATTACHMENT_RE.lastIndex = 0;
    for (const match of text.matchAll(GITHUB_ATTACHMENT_RE)) {
      const url = match[0];
      const key = normalizeUrlKey(url);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(url);
    }
  }
  return out;
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.href;
  } catch {
    return url;
  }
}

export function rewriteGithubImageUrls(
  text: string,
  urlToLocal: Map<string, string>,
): string {
  if (!text || urlToLocal.size === 0) return text;
  GITHUB_ATTACHMENT_RE.lastIndex = 0;
  return text.replace(GITHUB_ATTACHMENT_RE, (url) => urlToLocal.get(normalizeUrlKey(url)) || url);
}

export function localMediaPath(cacheId: string, ext: string, pagesBase: string): string {
  const base = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`;
  return `${base}media/${cacheId}.${ext}`;
}

function extFromContentType(type: string | null): string | undefined {
  if (!type) return undefined;
  const mime = type.split(';')[0].trim().toLowerCase();
  return EXT_BY_TYPE[mime];
}

function extFromUrl(url: string): string | undefined {
  try {
    const leaf = new URL(url).pathname.split('/').pop() || '';
    const match = leaf.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (!match) return undefined;
    const ext = match[1].toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    if (ext === 'jpg' || EXT_BY_TYPE[`image/${ext}`] || EXT_BY_TYPE[`video/${ext}`]) return ext;
  } catch {
    // ignore
  }
  return undefined;
}

export function extFromMagic(buf: Buffer): string | undefined {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    if (brand.startsWith('avif') || brand === 'avis' || brand === 'avio') return 'avif';
    return 'mp4';
  }
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return 'webm';
  }
  const head = buf
    .subarray(0, Math.min(buf.length, 256))
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && /<svg[\s>]/i.test(head))) return 'svg';
  return undefined;
}

function extFromContentDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const star = header.match(/filename\*=(?:UTF-8'')?([^;\s]+)/i);
  const quoted = header.match(/filename="([^"]+)"/i);
  const bare = header.match(/filename=([^;\s]+)/i);
  const raw = decodeURIComponent((star?.[1] || quoted?.[1] || bare?.[1] || '').replace(/["']/g, ''));
  return extFromUrl(`https://example.com/${raw.split(/[/\\]/).pop() || ''}`);
}

function existingFile(dir: string, cacheId: string): { file: string; ext: string } | undefined {
  if (!existsSync(dir)) return undefined;
  for (const name of readdirSync(dir)) {
    if (!name.startsWith(`${cacheId}.`) || name.endsWith('.tmp') || name.endsWith('.bin')) continue;
    const ext = name.slice(cacheId.length + 1);
    if (ext) return { file: name, ext };
  }
  return undefined;
}

export function hostNeedsGithubAuth(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'github.com' || host.endsWith('.githubusercontent.com');
  } catch {
    return false;
  }
}

export type LocalizeResult = {
  urlToLocal: Map<string, string>;
  downloaded: number;
  cached: number;
  failed: number;
};

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export async function localizeGithubImages(
  urls: string[],
  opts: {
    token?: string;
    pagesBase: string;
    fetch?: FetchLike;
    concurrency?: number;
    mediaDir?: string;
  },
): Promise<LocalizeResult> {
  const mediaDir = opts.mediaDir || MEDIA_DIR;
  mkdirSync(mediaDir, { recursive: true });

  const urlToLocal = new Map<string, string>();
  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  const usedFiles = new Set<string>();
  const fetchFn = opts.fetch || fetch;
  const token = opts.token || '';
  const concurrency = Math.max(1, opts.concurrency ?? 6);

  const unique = urls.filter((url, i, all) => all.findIndex((u) => normalizeUrlKey(u) === normalizeUrlKey(url)) === i);

  const work = unique.map((url) => async () => {
    const key = normalizeUrlKey(url);
    const id = cacheIdForUrl(url);
    const hit = existingFile(mediaDir, id);
    if (hit) {
      usedFiles.add(hit.file);
      urlToLocal.set(key, localMediaPath(id, hit.ext, opts.pagesBase));
      cached += 1;
      return;
    }

    try {
      const res = await fetchAttachment(fetchFn, url, token);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext =
        extFromContentType(res.headers.get('content-type')) ||
        extFromContentDisposition(res.headers.get('content-disposition')) ||
        extFromUrl(url) ||
        extFromMagic(buf);
      if (!ext) throw new Error('unknown attachment type');
      const file = `${id}.${ext}`;
      const dest = join(mediaDir, file);
      const tmp = `${dest}.tmp`;
      writeFileSync(tmp, buf);
      renameSync(tmp, dest);
      usedFiles.add(file);
      urlToLocal.set(key, localMediaPath(id, ext, opts.pagesBase));
      downloaded += 1;
    } catch (err) {
      failed += 1;
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  Could not download image ${url}: ${detail}`);
    }
  });

  await runPool(work, concurrency);

  if (existsSync(mediaDir)) {
    for (const name of readdirSync(mediaDir)) {
      if (name.startsWith('.')) continue;
      if (statSync(join(mediaDir, name)).isDirectory()) continue;
      if (!usedFiles.has(name)) rmSync(join(mediaDir, name));
    }
  }

  return { urlToLocal, downloaded, cached, failed };
}

function requestHeaders(url: string, token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/octet-stream, image/*, */*',
    'User-Agent': 'cmless',
  };
  if (token && hostNeedsGithubAuth(url)) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchAttachment(fetchFn: FetchLike, url: string, token: string): Promise<Response> {
  let current = url;
  for (let hops = 0; hops < 10; hops++) {
    const res = await fetchWithRetry(fetchFn, current, {
      headers: requestHeaders(current, token),
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error(`HTTP ${res.status} without Location`);
      current = new URL(location, current).href;
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}

async function fetchWithRetry(
  fetchFn: FetchLike,
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchFn(url, init);
      if (res.ok || res.status < 500) return res;
      last = new Error(`HTTP ${res.status}`);
    } catch (err) {
      last = err;
    }
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function runPool(jobs: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const i = next;
      next += 1;
      await jobs[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker()));
}
