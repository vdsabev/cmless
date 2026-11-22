import { describe, expect, test } from 'bun:test';
import { firstImage, isAppLabel, normalizeAppUrl, parseApp, sortApps } from './apps';

describe('isAppLabel', () => {
  test('matches app case-insensitively', () => {
    expect(isAppLabel('app')).toBe(true);
    expect(isAppLabel('App')).toBe(true);
    expect(isAppLabel(' app ')).toBe(true);
    expect(isAppLabel('apps')).toBe(false);
    expect(isAppLabel('status: published')).toBe(false);
  });
});

describe('normalizeAppUrl', () => {
  test('keeps http(s) and site-relative paths', () => {
    expect(normalizeAppUrl('https://vdsabev.github.io/tanlines/')).toBe('https://vdsabev.github.io/tanlines/');
    expect(normalizeAppUrl('/composer/')).toBe('/composer/');
  });

  test('adds https to bare domains', () => {
    expect(normalizeAppUrl('example.com/app')).toBe('https://example.com/app');
  });

  test('rejects empty and non-web schemes', () => {
    expect(normalizeAppUrl('')).toBe('');
    expect(normalizeAppUrl('javascript:alert(1)')).toBe('');
    expect(normalizeAppUrl('mailto:me@example.com')).toBe('');
  });
});

describe('firstImage', () => {
  test('finds a Markdown image anywhere in the body', () => {
    expect(firstImage('Intro text\n\n![Shot](https://x/a.png)')).toEqual({ src: 'https://x/a.png', alt: 'Shot' });
  });

  test('finds an HTML image', () => {
    expect(firstImage('<img width="300" alt="Shot" src="https://x/b.png">')).toEqual({
      src: 'https://x/b.png',
      alt: 'Shot',
    });
  });

  test('picks whichever comes first', () => {
    expect(firstImage('<img src="https://x/1.png"> ![](https://x/2.png)').src).toBe('https://x/1.png');
    expect(firstImage('![](https://x/2.png) <img src="https://x/1.png">').src).toBe('https://x/2.png');
  });

  test('no image', () => {
    expect(firstImage('Just text')).toEqual({});
  });
});

describe('parseApp', () => {
  const issue = { number: 7, title: 'Tanlines', createdAt: '2026-01-02T00:00:00Z' };

  test('reads url, description, image and order', () => {
    const app = parseApp(
      issue,
      { url: 'https://vdsabev.github.io/tanlines/', order: '2' },
      '![Screenshot](https://x/t.png)\n\nTrack your tan.',
    );
    expect(app).toEqual({
      number: 7,
      title: 'Tanlines',
      url: 'https://vdsabev.github.io/tanlines/',
      description: 'Track your tan.',
      image: 'https://x/t.png',
      imageAlt: 'Screenshot',
      order: 2,
      createdAt: '2026-01-02T00:00:00Z',
    });
  });

  test('frontmatter overrides title, description and image', () => {
    const app = parseApp(
      issue,
      { url: '/t/', title: 'Tan', description: 'Short', image: 'https://x/fm.png', imageAlt: 'Alt' },
      '![Other](https://x/body.png)\n\nLong body.',
    );
    expect(app).toMatchObject({ title: 'Tan', description: 'Short', image: 'https://x/fm.png', imageAlt: 'Alt' });
  });

  test('missing or invalid order is undefined', () => {
    expect((parseApp(issue, { url: '/t/' }, '') as any).order).toBeUndefined();
    expect((parseApp(issue, { url: '/t/', order: 'first' }, '') as any).order).toBeUndefined();
    expect((parseApp(issue, { url: '/t/', order: '-1.5' }, '') as any).order).toBe(-1.5);
  });

  test('skips an app without a url', () => {
    expect(typeof parseApp(issue, {}, 'Body')).toBe('string');
    expect(typeof parseApp(issue, { url: 'javascript:void(0)' }, 'Body')).toBe('string');
  });
});

describe('sortApps', () => {
  const app = (title: string, order?: number, createdAt = '2026-01-01') => ({ title, order, createdAt });

  test('ordered apps first, ascending', () => {
    const sorted = sortApps([app('C'), app('B', 2), app('A', 1)]);
    expect(sorted.map((a) => a.title)).toEqual(['A', 'B', 'C']);
  });

  test('unordered apps newest first', () => {
    const sorted = sortApps([app('Old', undefined, '2025-01-01'), app('New', undefined, '2026-06-01')]);
    expect(sorted.map((a) => a.title)).toEqual(['New', 'Old']);
  });

  test('equal order falls back to title', () => {
    const sorted = sortApps([app('Zed', 1), app('Ace', 1)]);
    expect(sorted.map((a) => a.title)).toEqual(['Ace', 'Zed']);
  });
});
