import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  cacheIdForUrl,
  collectGithubImageUrls,
  extFromMagic,
  hostNeedsGithubAuth,
  isGithubAttachmentUrl,
  localMediaPath,
  localizeGithubImages,
  pagesBaseFromRepo,
  rewriteGithubImageUrls,
} from './github-images';

describe('pagesBaseFromRepo', () => {
  test('user/org site is root', () => {
    expect(pagesBaseFromRepo('vdsabev/vdsabev.github.io')).toBe('/');
  });
  test('project site is /repo/', () => {
    expect(pagesBaseFromRepo('vdsabev/cmless')).toBe('/cmless/');
  });
});

describe('isGithubAttachmentUrl / cacheIdForUrl', () => {
  test('user-attachments UUID', () => {
    const url = 'https://github.com/user-attachments/assets/72d4755a-d308-49b9-b2bc-f4f6a8425ecc';
    expect(isGithubAttachmentUrl(url)).toBe(true);
    expect(cacheIdForUrl(url)).toBe('72d4755a-d308-49b9-b2bc-f4f6a8425ecc');
  });

  test('legacy repo assets URL', () => {
    const url = 'https://github.com/vdsabev/blog/assets/1333274/72d4755a-d308-49b9-b2bc-f4f6a8425ecc';
    expect(isGithubAttachmentUrl(url)).toBe(true);
    expect(cacheIdForUrl(url)).toBe('72d4755a-d308-49b9-b2bc-f4f6a8425ecc');
  });

  test('user-images filename without query', () => {
    const url = 'https://user-images.githubusercontent.com/1333274/abc123.png';
    expect(isGithubAttachmentUrl(url)).toBe(true);
    expect(cacheIdForUrl(url)).toBe('abc123');
  });

  test('private-user-images ignores JWT query', () => {
    const url =
      'https://private-user-images.githubusercontent.com/1333274/abc123.png?jwt=expires';
    expect(isGithubAttachmentUrl(url)).toBe(true);
    expect(cacheIdForUrl(url)).toBe('abc123');
  });

  test('does not treat avatars as attachments', () => {
    expect(isGithubAttachmentUrl('https://github.com/vdsabev.png')).toBe(false);
    expect(isGithubAttachmentUrl('https://avatars.githubusercontent.com/u/1')).toBe(false);
  });
});

describe('collect + rewrite', () => {
  const remote = 'https://github.com/user-attachments/assets/72d4755a-d308-49b9-b2bc-f4f6a8425ecc';
  const local = '/media/72d4755a-d308-49b9-b2bc-f4f6a8425ecc.jpg';

  test('dedupes markdown and html', () => {
    const body = `![a](${remote})\n<img src="${remote}" />`;
    expect(collectGithubImageUrls(body, remote)).toEqual([remote]);
  });

  test('rewrites html and markdown', () => {
    const map = new Map([[remote, local]]);
    const body = `![a](${remote})\n<img src="${remote}" />`;
    expect(rewriteGithubImageUrls(body, map)).toBe(`![a](${local})\n<img src="${local}" />`);
  });

  test('leaves unknown URLs alone', () => {
    const body = '![x](https://example.com/a.png)';
    expect(rewriteGithubImageUrls(body, new Map())).toBe(body);
  });
});

describe('localMediaPath', () => {
  test('joins site base', () => {
    expect(localMediaPath('abc', 'png', '/')).toBe('/media/abc.png');
    expect(localMediaPath('abc', 'png', '/cmless/')).toBe('/cmless/media/abc.png');
  });
});

describe('hostNeedsGithubAuth', () => {
  test('github hosts only', () => {
    expect(hostNeedsGithubAuth('https://github.com/user-attachments/assets/abc')).toBe(true);
    expect(hostNeedsGithubAuth('https://private-user-images.githubusercontent.com/1/a.png')).toBe(true);
    expect(hostNeedsGithubAuth('https://s3.amazonaws.com/bucket/key')).toBe(false);
  });
});

describe('extFromMagic', () => {
  test('detects svg xml avif mp4 webm', () => {
    expect(extFromMagic(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('svg');
    expect(extFromMagic(Buffer.from('<?xml version="1.0"?><svg ></svg>'))).toBe('svg');
    const avif = Buffer.alloc(12);
    avif.write('....ftypavif', 0, 'ascii');
    expect(extFromMagic(avif)).toBe('avif');
    const mp4 = Buffer.alloc(12);
    mp4.write('....ftypisom', 0, 'ascii');
    expect(extFromMagic(mp4)).toBe('mp4');
    expect(extFromMagic(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00]))).toBe('webm');
  });
});

describe('localizeGithubImages', () => {
  const remote = 'https://github.com/user-attachments/assets/72d4755a-d308-49b9-b2bc-f4f6a8425ecc';
  const s3 = 'https://s3.amazonaws.com/github-production-user-asset/file';

  test('does not send Authorization on the S3 redirect hop', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-media-'));
    const seen: Array<{ url: string; auth?: string; redirect?: RequestRedirect }> = [];
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const fetchMock: typeof fetch = async (input, init) => {
      const url = String(input);
      seen.push({
        url,
        auth: new Headers(init?.headers).get('Authorization') ?? undefined,
        redirect: init?.redirect,
      });
      if (url === remote) {
        return new Response(null, { status: 302, headers: { Location: s3 } });
      }
      return new Response(png, { status: 200, headers: { 'content-type': 'application/octet-stream' } });
    };
    try {
      const result = await localizeGithubImages([remote], {
        token: 'secret-token',
        pagesBase: '/',
        fetch: fetchMock,
        mediaDir: dir,
      });
      expect(result.failed).toBe(0);
      expect(result.downloaded).toBe(1);
      expect(seen).toHaveLength(2);
      expect(seen[0]).toEqual({
        url: remote,
        auth: 'Bearer secret-token',
        redirect: 'manual',
      });
      expect(seen[1]).toEqual({ url: s3, auth: undefined, redirect: 'manual' });
      expect(readFileSync(join(dir, '72d4755a-d308-49b9-b2bc-f4f6a8425ecc.png')).equals(png)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('does not treat .bin as a cache hit and fails unknown types', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-media-'));
    writeFileSync(join(dir, '72d4755a-d308-49b9-b2bc-f4f6a8425ecc.bin'), 'stale');
    const fetchMock: typeof fetch = async () =>
      new Response(Buffer.from('not-an-image'), {
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
      });
    try {
      const result = await localizeGithubImages([remote], {
        pagesBase: '/',
        fetch: fetchMock,
        mediaDir: dir,
      });
      expect(result.cached).toBe(0);
      expect(result.failed).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
