/**
 * Download GitHub profile avatars into public/media/avatars/.
 *
 * github.com/<login>.png is a no-cache 302 that may land on a short-lived JWT
 * private-avatars URL. Prefer a local copy. If download fails, fall back to
 * avatars.githubusercontent.com/u/<id> (GitHub's documented long-lived public
 * form) rather than the username shortcut.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { extFromMagic } from './github-images';

export const AVATAR_DIR = 'public/media/avatars';

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export type AvatarRef = {
  login?: string;
  userId?: number;
};

export function publicAvatarUrl(userId: number): string {
  return `https://avatars.githubusercontent.com/u/${userId}?v=4`;
}

export function usernameAvatarUrl(login: string): string {
  return `https://github.com/${login}.png`;
}

/** Decode GraphQL node id (`MDQ6VXNlcjEzMzMyNzQ=` → 1333274). */
export function databaseIdFromNodeId(id: string): number | undefined {
  if (!id) return undefined;
  if (/^\d+$/.test(id)) return Number(id);
  try {
    const decoded = Buffer.from(id, 'base64').toString('utf8');
    const match = decoded.match(/User:?(\d+)$/);
    if (match) return Number(match[1]);
  } catch {
    // ignore
  }
  return undefined;
}

export function isGithubAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;
    if (host === 'github.com' && /^\/[^/]+\.png$/i.test(path)) return true;
    if (host === 'github.com' && /^\/user_avatars\/\d+$/.test(path)) return true;
    if (
      (host === 'avatars.githubusercontent.com' || host === 'private-avatars.githubusercontent.com') &&
      /^\/u\/\d+/.test(path)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Pair override URL fields with the issue author without mixing two people. */
export function postAvatarRef(
  fromOverride: AvatarRef | undefined,
  post: { authorLogin?: string; authorId?: number },
): AvatarRef {
  const login = fromOverride?.login || post.authorLogin;
  const overrideLogin = fromOverride?.login;
  const samePerson =
    !overrideLogin ||
    !post.authorLogin ||
    overrideLogin.toLowerCase() === post.authorLogin.toLowerCase();
  const userId =
    fromOverride?.userId ?? (samePerson ? post.authorId : undefined);
  return { login, userId };
}

export function parseGithubAvatarRef(url: string): AvatarRef | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;
    const userPath = path.match(/^\/u\/(\d+)/);
    if (
      userPath &&
      (host === 'avatars.githubusercontent.com' || host === 'private-avatars.githubusercontent.com')
    ) {
      return { userId: Number(userPath[1]) };
    }
    const alias = path.match(/^\/user_avatars\/(\d+)$/);
    if (host === 'github.com' && alias) return { userId: Number(alias[1]) };
    const loginPng = path.match(/^\/([^/]+)\.png$/i);
    if (host === 'github.com' && loginPng) return { login: loginPng[1] };
  } catch {
    // ignore
  }
  return undefined;
}

export type LocalizeAvatarsResult = {
  resolved: Map<string, string>;
  downloaded: number;
  cached: number;
  failed: number;
};

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export async function localizeGithubAvatars(
  refs: AvatarRef[],
  opts: {
    pagesBase: string;
    fetch?: FetchLike;
    avatarDir?: string;
    lookupUser?: (login: string) => Promise<{ id: number } | undefined>;
  },
): Promise<LocalizeAvatarsResult> {
  const avatarDir = opts.avatarDir || AVATAR_DIR;
  mkdirSync(avatarDir, { recursive: true });

  const resolved = new Map<string, string>();
  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  const usedFiles = new Set<string>();
  const fetchFn = opts.fetch || fetch;
  const loginMap = loadLoginMap(avatarDir);
  let unresolvedLogin = false;

  const unique = dedupeRefs(refs);

  for (const ref of unique) {
    let userId = ref.userId;
    if (!userId && ref.login && opts.lookupUser) {
      const user = await opts.lookupUser(ref.login);
      if (user?.id) userId = user.id;
    }
    if (!userId && ref.login) {
      userId = loginMap.get(ref.login.toLowerCase());
    }
    if (ref.login && userId) loginMap.set(ref.login.toLowerCase(), userId);
    const keys = refKeys({ login: ref.login, userId });

    const fallback = userId ? publicAvatarUrl(userId) : ref.login ? usernameAvatarUrl(ref.login) : '';
    if (!userId) {
      if (ref.login) unresolvedLogin = true;
      if (fallback) for (const key of keys) resolved.set(key, fallback);
      continue;
    }

    const cacheId = String(userId);
    const hit = existingAvatar(avatarDir, cacheId);

    try {
      const res = await fetchWithRetry(fetchFn, publicAvatarUrl(userId), {
        headers: {
          Accept: 'image/*, */*',
          'User-Agent': 'cmless',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext =
        extFromContentType(res.headers.get('content-type')) || extFromMagic(buf);
      if (!ext) throw new Error('unknown avatar type');
      const file = `${cacheId}.${ext}`;
      const dest = join(avatarDir, file);
      const tmp = `${dest}.tmp`;
      writeFileSync(tmp, buf);
      renameSync(tmp, dest);
      if (hit && hit.file !== file) rmSync(join(avatarDir, hit.file), { force: true });
      usedFiles.add(file);
      const local = localAvatarPath(cacheId, ext, opts.pagesBase);
      for (const key of keys) resolved.set(key, local);
      downloaded += 1;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  Could not download avatar u/${userId}: ${detail}`);
      if (hit) {
        usedFiles.add(hit.file);
        const local = localAvatarPath(cacheId, hit.ext, opts.pagesBase);
        for (const key of keys) resolved.set(key, local);
        cached += 1;
      } else {
        failed += 1;
        for (const key of keys) resolved.set(key, fallback);
      }
    }
  }

  saveLoginMap(avatarDir, loginMap);

  if (existsSync(avatarDir) && !unresolvedLogin) {
    for (const name of readdirSync(avatarDir)) {
      if (name.startsWith('.')) continue;
      if (!usedFiles.has(name)) rmSync(join(avatarDir, name), { force: true });
    }
  }

  return { resolved, downloaded, cached, failed };
}

function localAvatarPath(cacheId: string, ext: string, pagesBase: string): string {
  const base = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`;
  return `${base}media/avatars/${cacheId}.${ext}`;
}

function extFromContentType(type: string | null): string | undefined {
  if (!type) return undefined;
  const mime = type.split(';')[0].trim().toLowerCase();
  return EXT_BY_TYPE[mime];
}

const LOGIN_MAP_FILE = '.ids.json';

function loadLoginMap(dir: string): Map<string, number> {
  const map = new Map<string, number>();
  const path = join(dir, LOGIN_MAP_FILE);
  if (!existsSync(path)) return map;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, number>;
    for (const [login, id] of Object.entries(raw)) {
      if (typeof id === 'number' && Number.isFinite(id)) map.set(login.toLowerCase(), id);
    }
  } catch {
    // ignore corrupt sidecar
  }
  return map;
}

function saveLoginMap(dir: string, map: Map<string, number>): void {
  if (map.size === 0) return;
  writeFileSync(join(dir, LOGIN_MAP_FILE), JSON.stringify(Object.fromEntries(map)));
}

function existingAvatar(dir: string, cacheId: string): { file: string; ext: string } | undefined {
  if (!existsSync(dir)) return undefined;
  for (const name of readdirSync(dir)) {
    if (!name.startsWith(`${cacheId}.`) || name.endsWith('.tmp')) continue;
    const ext = name.slice(cacheId.length + 1);
    if (ext) return { file: name, ext };
  }
  return undefined;
}

function dedupeRefs(refs: AvatarRef[]): AvatarRef[] {
  const byId = new Map<number, AvatarRef>();
  const byLogin = new Map<string, AvatarRef>();
  const out: AvatarRef[] = [];
  for (const ref of refs) {
    if (ref.userId) {
      const existing = byId.get(ref.userId);
      if (existing) {
        if (ref.login && !existing.login) existing.login = ref.login;
        continue;
      }
      if (ref.login) {
        const byName = byLogin.get(ref.login.toLowerCase());
        if (byName) {
          byName.userId = ref.userId;
          byId.set(ref.userId, byName);
          continue;
        }
      }
      const merged = { ...ref };
      byId.set(ref.userId, merged);
      if (ref.login) byLogin.set(ref.login.toLowerCase(), merged);
      out.push(merged);
      continue;
    }
    if (ref.login) {
      const key = ref.login.toLowerCase();
      const existing = byLogin.get(key);
      if (existing) continue;
      const merged = { ...ref };
      byLogin.set(key, merged);
      out.push(merged);
    }
  }
  return out;
}

function refKeys(ref: AvatarRef): string[] {
  const keys: string[] = [];
  if (ref.login) {
    keys.push(ref.login.toLowerCase());
    keys.push(usernameAvatarUrl(ref.login));
  }
  if (ref.userId) {
    keys.push(`id:${ref.userId}`);
    keys.push(publicAvatarUrl(ref.userId));
  }
  return keys;
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

export function pickResolvedAvatar(
  resolved: Map<string, string>,
  ref: AvatarRef,
  fallback: string,
): string {
  if (ref.login) {
    const byLogin = resolved.get(ref.login.toLowerCase());
    if (byLogin) return byLogin;
    const byShortcut = resolved.get(usernameAvatarUrl(ref.login));
    if (byShortcut) return byShortcut;
  }
  if (ref.userId) {
    const byId = resolved.get(`id:${ref.userId}`);
    if (byId) return byId;
    const byPublic = resolved.get(publicAvatarUrl(ref.userId));
    if (byPublic) return byPublic;
  }
  return fallback;
}
