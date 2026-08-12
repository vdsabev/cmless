import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  databaseIdFromNodeId,
  isGithubAvatarUrl,
  localizeGithubAvatars,
  parseGithubAvatarRef,
  pickResolvedAvatar,
  postAvatarRef,
  publicAvatarUrl,
} from './github-avatars';

describe('publicAvatarUrl / parse / node id', () => {
  test('public CDN form', () => {
    expect(publicAvatarUrl(1333274)).toBe('https://avatars.githubusercontent.com/u/1333274?v=4');
  });

  test('parses username shortcut and id URLs', () => {
    expect(parseGithubAvatarRef('https://github.com/vdsabev.png')).toEqual({ login: 'vdsabev' });
    expect(parseGithubAvatarRef('https://avatars.githubusercontent.com/u/1333274?v=4')).toEqual({
      userId: 1333274,
    });
    expect(
      parseGithubAvatarRef('https://private-avatars.githubusercontent.com/u/1333274?jwt=x'),
    ).toEqual({ userId: 1333274 });
    expect(parseGithubAvatarRef('https://github.com/user_avatars/1333274')).toEqual({
      userId: 1333274,
    });
  });

  test('isGithubAvatarUrl ignores attachments', () => {
    expect(isGithubAvatarUrl('https://github.com/vdsabev.png')).toBe(true);
    expect(isGithubAvatarUrl('https://github.com/user-attachments/assets/abc')).toBe(false);
    expect(isGithubAvatarUrl('/me.jpg')).toBe(false);
  });

  test('decodes GraphQL user node id', () => {
    expect(databaseIdFromNodeId('MDQ6VXNlcjEzMzMyNzQ=')).toBe(1333274);
    expect(databaseIdFromNodeId('1333274')).toBe(1333274);
  });
});

describe('localizeGithubAvatars', () => {
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

  test('writes local file and maps login + id', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    const fetchMock: typeof fetch = async () =>
      new Response(jpg, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    try {
      const result = await localizeGithubAvatars([{ login: 'vdsabev', userId: 1333274 }], {
        pagesBase: '/cmless/',
        fetch: fetchMock,
        avatarDir: dir,
      });
      expect(result.failed).toBe(0);
      expect(result.downloaded).toBe(1);
      expect(result.resolved.get('vdsabev')).toBe('/cmless/media/avatars/1333274.jpg');
      expect(readFileSync(join(dir, '1333274.jpg')).equals(jpg)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('falls back to public u/id URL when download fails and nothing is cached', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    const fetchMock: typeof fetch = async () => new Response('nope', { status: 404 });
    try {
      const result = await localizeGithubAvatars([{ login: 'vdsabev', userId: 1333274 }], {
        pagesBase: '/',
        fetch: fetchMock,
        avatarDir: dir,
      });
      expect(result.failed).toBe(1);
      expect(result.resolved.get('vdsabev')).toBe(
        'https://avatars.githubusercontent.com/u/1333274?v=4',
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('keeps cached file when download fails', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    writeFileSync(join(dir, '1333274.png'), 'old');
    const fetchMock: typeof fetch = async () => new Response('nope', { status: 404 });
    try {
      const result = await localizeGithubAvatars([{ userId: 1333274 }], {
        pagesBase: '/',
        fetch: fetchMock,
        avatarDir: dir,
      });
      expect(result.cached).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.resolved.get('id:1333274')).toBe('/media/avatars/1333274.png');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('merges login-only then id ref into one download', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    let fetches = 0;
    const fetchMock: typeof fetch = async () => {
      fetches += 1;
      return new Response(jpg, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    };
    try {
      const result = await localizeGithubAvatars(
        [
          { login: 'vdsabev' },
          { login: 'vdsabev', userId: 1333274 },
        ],
        { pagesBase: '/', fetch: fetchMock, avatarDir: dir },
      );
      expect(result.downloaded).toBe(1);
      expect(fetches).toBe(1);
      expect(result.resolved.get('vdsabev')).toBe('/media/avatars/1333274.jpg');
      expect(result.resolved.get('id:1333274')).toBe('/media/avatars/1333274.jpg');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('looks up numeric id when only login is known', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    const fetchMock: typeof fetch = async () =>
      new Response(jpg, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    try {
      const result = await localizeGithubAvatars([{ login: 'vdsabev' }], {
        pagesBase: '/',
        fetch: fetchMock,
        avatarDir: dir,
        lookupUser: async () => ({ id: 1333274 }),
      });
      expect(result.downloaded).toBe(1);
      expect(result.resolved.get('vdsabev')).toBe('/media/avatars/1333274.jpg');
      expect(result.resolved.get('id:1333274')).toBe('/media/avatars/1333274.jpg');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('reuses sidecar id when lookup fails so prune keeps the cached file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    writeFileSync(join(dir, '1333274.jpg'), jpg);
    writeFileSync(join(dir, '.ids.json'), JSON.stringify({ vdsabev: 1333274 }));
    const fetchMock: typeof fetch = async () => new Response('nope', { status: 404 });
    try {
      const result = await localizeGithubAvatars([{ login: 'vdsabev' }], {
        pagesBase: '/',
        fetch: fetchMock,
        avatarDir: dir,
        lookupUser: async () => undefined,
      });
      expect(result.cached).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.resolved.get('vdsabev')).toBe('/media/avatars/1333274.jpg');
      expect(existsSync(join(dir, '1333274.jpg'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('does not prune avatars when a login-only ref never resolves an id', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-avatars-'));
    writeFileSync(join(dir, '1333274.jpg'), jpg);
    writeFileSync(join(dir, '99.png'), 'other');
    const fetchMock: typeof fetch = async () => new Response('nope', { status: 404 });
    try {
      await localizeGithubAvatars([{ login: 'vdsabev' }], {
        pagesBase: '/',
        fetch: fetchMock,
        avatarDir: dir,
        lookupUser: async () => undefined,
      });
      expect(existsSync(join(dir, '1333274.jpg'))).toBe(true);
      expect(existsSync(join(dir, '99.png'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('postAvatarRef', () => {
  test('does not attach issue author id to a different override login', () => {
    expect(
      postAvatarRef({ login: 'other' }, { authorLogin: 'vdsabev', authorId: 1333274 }),
    ).toEqual({ login: 'other', userId: undefined });
  });

  test('keeps issue author id when override login matches', () => {
    expect(
      postAvatarRef({ login: 'Vdsabev' }, { authorLogin: 'vdsabev', authorId: 1333274 }),
    ).toEqual({ login: 'Vdsabev', userId: 1333274 });
  });

  test('prefers numeric override id', () => {
    expect(
      postAvatarRef({ userId: 99 }, { authorLogin: 'vdsabev', authorId: 1333274 }),
    ).toEqual({ login: 'vdsabev', userId: 99 });
  });
});

describe('pickResolvedAvatar', () => {
  test('prefers resolved map then fallback', () => {
    const resolved = new Map([['vdsabev', '/media/avatars/1.jpg']]);
    expect(pickResolvedAvatar(resolved, { login: 'vdsabev' }, 'https://github.com/vdsabev.png')).toBe(
      '/media/avatars/1.jpg',
    );
    expect(pickResolvedAvatar(new Map(), { login: 'x' }, 'keep')).toBe('keep');
  });
});
