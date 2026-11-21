import { describe, expect, test } from 'bun:test';
import { assertIssuesNotTruncated, dedupeSlugs, ISSUE_LIMIT, issueListArgs } from './posts';

describe('issueListArgs', () => {
  test('requests all states with the issue limit', () => {
    const args = issueListArgs('owner/blog');
    expect(args.slice(0, 4)).toEqual(['issue', 'list', '-R', 'owner/blog']);
    expect(args[args.indexOf('--state') + 1]).toBe('all');
    expect(args[args.indexOf('--limit') + 1]).toBe(String(ISSUE_LIMIT));
    expect(ISSUE_LIMIT).toBeGreaterThan(200);
  });

  test('omits -R when no repo is given', () => {
    expect(issueListArgs('')).not.toContain('-R');
  });
});

describe('assertIssuesNotTruncated', () => {
  test('passes below the limit', () => {
    expect(() => assertIssuesNotTruncated(199, 200)).not.toThrow();
  });

  test('throws when the limit is reached', () => {
    expect(() => assertIssuesNotTruncated(200, 200)).toThrow(/limit of 200/);
  });
});

describe('dedupeSlugs', () => {
  test('leaves unique slugs alone', () => {
    const posts = [
      { slug: 'a', number: 1 },
      { slug: 'b', number: 2 },
    ];
    expect(dedupeSlugs(posts)).toEqual([]);
    expect(posts.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  test('oldest issue keeps the slug regardless of list order', () => {
    // gh lists newest first
    const posts = [
      { slug: 'hello', number: 9 },
      { slug: 'hello', number: 3 },
    ];
    const warnings = dedupeSlugs(posts);
    expect(posts.map((p) => p.slug)).toEqual(['hello-9', 'hello']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('#9');
  });

  test('collisions are case-insensitive', () => {
    const posts = [
      { slug: 'Hello', number: 1 },
      { slug: 'hello', number: 2 },
    ];
    dedupeSlugs(posts);
    expect(posts.map((p) => p.slug)).toEqual(['Hello', 'hello-2']);
  });

  test('a suffixed slug never takes another post\'s real slug', () => {
    const posts = [
      { slug: 'foo', number: 1 },
      { slug: 'foo', number: 2 },
      { slug: 'foo-2', number: 3 },
    ];
    dedupeSlugs(posts);
    const slugs = posts.map((p) => p.slug);
    expect(slugs).toEqual(['foo', 'foo-2-2', 'foo-2']);
    expect(new Set(slugs.map((s) => s.toLowerCase())).size).toBe(3);
  });
});
