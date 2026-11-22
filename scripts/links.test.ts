import { describe, expect, test } from 'bun:test';
import { firstImage, groupLinks, isLinkLabel, normalizeLinkUrl, parseLink, sortLinks } from './links';

describe('isLinkLabel', () => {
  test('matches link case-insensitively', () => {
    expect(isLinkLabel('link')).toBe(true);
    expect(isLinkLabel('Link')).toBe(true);
    expect(isLinkLabel(' link ')).toBe(true);
    expect(isLinkLabel('links')).toBe(false);
    expect(isLinkLabel('status: published')).toBe(false);
  });

  test('still accepts the old app label', () => {
    expect(isLinkLabel('app')).toBe(true);
    expect(isLinkLabel('App')).toBe(true);
  });
});

describe('normalizeLinkUrl', () => {
  test('keeps http(s) and site-relative paths', () => {
    expect(normalizeLinkUrl('https://vdsabev.github.io/tanlines/')).toBe('https://vdsabev.github.io/tanlines/');
    expect(normalizeLinkUrl('/composer/')).toBe('/composer/');
  });

  test('adds https to bare domains', () => {
    expect(normalizeLinkUrl('example.com/app')).toBe('https://example.com/app');
  });

  test('rejects empty and non-web schemes', () => {
    expect(normalizeLinkUrl('')).toBe('');
    expect(normalizeLinkUrl('javascript:alert(1)')).toBe('');
    expect(normalizeLinkUrl('mailto:me@example.com')).toBe('');
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

describe('parseLink', () => {
  const issue = { number: 7, title: 'Tanlines', createdAt: '2026-01-02T00:00:00Z' };

  test('reads url, description, image and order with defaults', () => {
    const link = parseLink(
      issue,
      { url: 'https://vdsabev.github.io/tanlines/', order: '2' },
      '![Screenshot](https://x/t.png)\n\nTrack your tan.',
    );
    expect(link).toEqual({
      number: 7,
      title: 'Tanlines',
      url: 'https://vdsabev.github.io/tanlines/',
      description: 'Track your tan.',
      image: 'https://x/t.png',
      imageAlt: 'Screenshot',
      section: 'Projects',
      newTab: true,
      order: 2,
      createdAt: '2026-01-02T00:00:00Z',
    });
  });

  test('frontmatter overrides title, description, image and section', () => {
    const link = parseLink(
      issue,
      { url: '/t/', title: 'Tan', description: 'Short', image: 'https://x/fm.png', imageAlt: 'Alt', section: ' Talks ' },
      '![Other](https://x/body.png)\n\nLong body.',
    );
    expect(link).toMatchObject({ title: 'Tan', description: 'Short', image: 'https://x/fm.png', imageAlt: 'Alt', section: 'Talks' });
  });

  test('newTab can be turned off', () => {
    expect((parseLink(issue, { url: '/t/', newTab: 'false' }, '') as any).newTab).toBe(false);
    expect((parseLink(issue, { url: '/t/', newTab: 'no' }, '') as any).newTab).toBe(false);
    expect((parseLink(issue, { url: '/t/', newTab: 'true' }, '') as any).newTab).toBe(true);
    expect((parseLink(issue, { url: '/t/', newTab: 'maybe' }, '') as any).newTab).toBe(true);
  });

  test('missing or invalid order is undefined', () => {
    expect((parseLink(issue, { url: '/t/' }, '') as any).order).toBeUndefined();
    expect((parseLink(issue, { url: '/t/', order: 'first' }, '') as any).order).toBeUndefined();
    expect((parseLink(issue, { url: '/t/', order: '-1.5' }, '') as any).order).toBe(-1.5);
  });

  test('skips a link without a url', () => {
    expect(typeof parseLink(issue, {}, 'Body')).toBe('string');
    expect(typeof parseLink(issue, { url: 'javascript:void(0)' }, 'Body')).toBe('string');
  });
});

describe('sortLinks', () => {
  const link = (title: string, order?: number, createdAt = '2026-01-01') => ({ title, order, createdAt });

  test('ordered links first, ascending', () => {
    const sorted = sortLinks([link('C'), link('B', 2), link('A', 1)]);
    expect(sorted.map((a) => a.title)).toEqual(['A', 'B', 'C']);
  });

  test('unordered links newest first', () => {
    const sorted = sortLinks([link('Old', undefined, '2025-01-01'), link('New', undefined, '2026-06-01')]);
    expect(sorted.map((a) => a.title)).toEqual(['New', 'Old']);
  });

  test('equal order falls back to title', () => {
    const sorted = sortLinks([link('Zed', 1), link('Ace', 1)]);
    expect(sorted.map((a) => a.title)).toEqual(['Ace', 'Zed']);
  });
});

describe('groupLinks', () => {
  const link = (title: string, section: string, order?: number, createdAt = '2026-01-01') => ({
    title,
    section,
    order,
    createdAt,
  });
  const shape = (sections: ReturnType<typeof groupLinks>) =>
    sections.map((s) => [s.title, s.links.map((l) => l.title)]);

  test('sections are ordered by their lowest order', () => {
    const sections = groupLinks([link('Talk', 'Talks', 20), link('B', 'Projects', 2), link('A', 'Projects', 1)]);
    expect(shape(sections)).toEqual([
      ['Projects', ['A', 'B']],
      ['Talks', ['Talk']],
    ]);
  });

  test('a low order on any card moves its section up', () => {
    const sections = groupLinks([link('A', 'Projects', 5), link('Keynote', 'Talks', 1)]);
    expect(shape(sections)).toEqual([
      ['Talks', ['Keynote']],
      ['Projects', ['A']],
    ]);
  });

  test('section names match case-insensitively; first card names it', () => {
    const sections = groupLinks([link('A', 'Projects', 1), link('B', 'projects', 2)]);
    expect(shape(sections)).toEqual([['Projects', ['A', 'B']]]);
  });

  test('empty section falls back to the default', () => {
    expect(shape(groupLinks([link('A', '')]))).toEqual([['Projects', ['A']]]);
  });
});
