import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { extFromContentType, fetchWithRetry, findCachedFile, mediaUrlPath } from './media-util';

describe('extFromContentType', () => {
  test('maps MIME types and ignores parameters', () => {
    expect(extFromContentType('image/png; charset=binary')).toBe('png');
    expect(extFromContentType('video/mp4')).toBe('mp4');
    expect(extFromContentType(null)).toBeUndefined();
  });

  test('respects an allow-list', () => {
    expect(extFromContentType('image/svg+xml', { 'image/png': 'png' })).toBeUndefined();
  });
});

describe('findCachedFile', () => {
  test('finds a finished download and skips partial files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-media-'));
    try {
      writeFileSync(join(dir, 'abc.png.tmp'), '');
      expect(findCachedFile(dir, 'abc')).toBeUndefined();
      writeFileSync(join(dir, 'abc.png'), '');
      expect(findCachedFile(dir, 'abc')).toEqual({ file: 'abc.png', ext: 'png' });
      expect(findCachedFile(join(dir, 'missing'), 'abc')).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('mediaUrlPath', () => {
  test('joins base, subdir and file', () => {
    expect(mediaUrlPath('/blog', 'avatars/', '1', 'png')).toBe('/blog/media/avatars/1.png');
    expect(mediaUrlPath('/', '', 'x', 'jpg')).toBe('/media/x.jpg');
  });
});

describe('fetchWithRetry', () => {
  test('retries 5xx, returns 4xx straight away', async () => {
    let calls = 0;
    const flaky = async () => new Response('', { status: ++calls < 2 ? 503 : 200 });
    expect((await fetchWithRetry(flaky, 'https://x', {})).status).toBe(200);
    expect(calls).toBe(2);

    calls = 0;
    const missing = async () => (calls++, new Response('', { status: 404 }));
    expect((await fetchWithRetry(missing, 'https://x', {})).status).toBe(404);
    expect(calls).toBe(1);
  });
});
