import { describe, expect, test } from 'bun:test';
import { resolveAbsUrl } from '../src/lib/content';
import { blogPostingJsonLd } from '../src/lib/jsonld';

const site = 'https://owner.github.io';

describe('resolveAbsUrl', () => {
  test('absolute URLs pass through', () => {
    expect(resolveAbsUrl('https://cdn.example/x.png', site)).toBe('https://cdn.example/x.png');
  });

  test('base-prefixed media paths resolve against the origin without doubling the base', () => {
    // generate.ts writes localized covers as `${pagesBase}media/<id>.<ext>`
    expect(resolveAbsUrl('/blog/media/abc.png', site)).toBe('https://owner.github.io/blog/media/abc.png');
  });

  test('protocol-relative URLs become https', () => {
    expect(resolveAbsUrl('//cdn.example/x.png', site)).toBe('https://cdn.example/x.png');
  });

  test('empty values are undefined', () => {
    expect(resolveAbsUrl('', site)).toBeUndefined();
    expect(resolveAbsUrl('  ', site)).toBeUndefined();
    expect(resolveAbsUrl(undefined, site)).toBeUndefined();
  });

  test('without a site, root-relative paths are returned as-is', () => {
    expect(resolveAbsUrl('/blog/media/abc.png')).toBe('/blog/media/abc.png');
  });
});

describe('JSON-LD images', () => {
  test('localized cover and avatar become absolute URLs', () => {
    const node = blogPostingJsonLd({
      site,
      slug: 'post',
      title: 'Post',
      date: '2026-01-01',
      image: '/blog/media/abc.png',
      author: 'Someone',
      authorAvatar: '/blog/media/avatars/1.png',
      siteTitle: 'Blog',
    }) as Record<string, any>;
    const image = typeof node.image === 'string' ? node.image : node.image?.url;
    expect(image).toBe('https://owner.github.io/blog/media/abc.png');
    expect(JSON.stringify(node)).toContain('https://owner.github.io/blog/media/avatars/1.png');
    expect(JSON.stringify(node)).not.toContain('/blog/blog/');
  });
});
