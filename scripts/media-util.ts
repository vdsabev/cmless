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

/** A previously downloaded `<cacheId>.<ext>` in `dir`, ignoring partial (`.tmp`/`.bin`) files. */
export function findCachedFile(dir: string, cacheId: string): { file: string; ext: string } | undefined {
  if (!existsSync(dir)) return undefined;
  for (const name of readdirSync(dir)) {
    if (!name.startsWith(`${cacheId}.`) || name.endsWith('.tmp') || name.endsWith('.bin')) continue;
    const ext = name.slice(cacheId.length + 1);
    if (ext) return { file: name, ext };
  }
  return undefined;
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
