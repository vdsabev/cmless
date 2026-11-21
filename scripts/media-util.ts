/**
 * Helpers shared by the attachment (github-images) and avatar (github-avatars) downloaders.
 */

import { existsSync, readdirSync } from 'fs';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** MIME type → file extension for everything we localize. */
export const EXT_BY_TYPE: Record<string, string> = {
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

/** Extension for a `Content-Type` header, limited to `allowed` (default: all known types). */
export function extFromContentType(
  type: string | null,
  allowed: Record<string, string> = EXT_BY_TYPE,
): string | undefined {
  if (!type) return undefined;
  const mime = type.split(';')[0].trim().toLowerCase();
  return allowed[mime];
}

/** Sniff the file type from its first bytes. */
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
    .replace(/^﻿/, '')
    .trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && /<svg[\s>]/i.test(head))) return 'svg';
  return undefined;
}

/**
 * Previously downloaded files in `dir`, keyed by cache id (`<cacheId>.<ext>`).
 * Reads the directory once so lookups stay O(1) however many files are cached.
 * Partial downloads (`.tmp`/`.bin`) and dotfiles are ignored.
 */
export function indexCachedFiles(dir: string): Map<string, { file: string; ext: string }> {
  const index = new Map<string, { file: string; ext: string }>();
  if (!existsSync(dir)) return index;
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name.endsWith('.tmp') || name.endsWith('.bin')) continue;
    const dot = name.lastIndexOf('.');
    if (dot <= 0 || dot === name.length - 1) continue;
    const id = name.slice(0, dot);
    if (!index.has(id)) index.set(id, { file: name, ext: name.slice(dot + 1) });
  }
  return index;
}

/** Site URL path for a file under `public/media/` (`subdir` e.g. `avatars/`). */
export function mediaUrlPath(pagesBase: string, subdir: string, cacheId: string, ext: string): string {
  const base = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`;
  return `${base}media/${subdir}${cacheId}.${ext}`;
}

/** Retry network errors and 5xx responses with a short linear backoff. */
export async function fetchWithRetry(
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

/** Run async jobs with at most `concurrency` in flight. */
export async function runPool(jobs: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const i = next;
      next += 1;
      await jobs[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), jobs.length) }, () => worker()));
}
