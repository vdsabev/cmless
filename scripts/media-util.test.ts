import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { extFromContentType, fetchWithRetry, indexCachedFiles, mediaUrlPath, runPool } from './media-util';

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

describe('indexCachedFiles', () => {
  test('indexes finished downloads and skips partial files and dotfiles', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cmless-media-'));
    try {
      writeFileSync(join(dir, 'abc.png.tmp'), '');
      writeFileSync(join(dir, 'def.bin'), '');
      writeFileSync(join(dir, '.ids.json'), '');
      expect(indexCachedFiles(dir).size).toBe(0);
      writeFileSync(join(dir, 'abc.png'), '');
      writeFileSync(join(dir, '12-34.webm'), '');
      const index = indexCachedFiles(dir);
      expect(index.get('abc')).toEqual({ file: 'abc.png', ext: 'png' });
      expect(index.get('12-34')).toEqual({ file: '12-34.webm', ext: 'webm' });
      expect(index.size).toBe(2);
      expect(indexCachedFiles(join(dir, 'missing')).size).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('runPool', () => {
  test('runs every job with bounded concurrency', async () => {
    let active = 0;
    let peak = 0;
    const done: number[] = [];
    const jobs = Array.from({ length: 10 }, (_, i) => async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      done.push(i);
    });
    await runPool(jobs, 3);
    expect(done.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(peak).toBe(3);
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
