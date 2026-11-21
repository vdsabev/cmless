import { describe, expect, test } from 'bun:test';
import { detectGithubRepo, pagesFromRepo, parseGithubRemote } from './repo';

describe('parseGithubRemote', () => {
  test('ssh and https remotes', () => {
    expect(parseGithubRemote('git@github.com:owner/blog.git')).toBe('owner/blog');
    expect(parseGithubRemote('https://github.com/owner/blog.git')).toBe('owner/blog');
    expect(parseGithubRemote('https://github.com/owner/blog')).toBe('owner/blog');
    expect(parseGithubRemote('https://github.com/owner/blog/\n')).toBe('owner/blog');
  });

  test('repo names with dots (user sites)', () => {
    expect(parseGithubRemote('git@github.com:owner/owner.github.io.git')).toBe('owner/owner.github.io');
    expect(parseGithubRemote('https://github.com/owner/owner.github.io')).toBe('owner/owner.github.io');
  });

  test('not a remote', () => {
    expect(parseGithubRemote('')).toBe('');
  });
});

describe('detectGithubRepo', () => {
  test('GH_REPO wins over GITHUB_REPOSITORY', () => {
    expect(detectGithubRepo({ GH_REPO: 'a/preview', GITHUB_REPOSITORY: 'b/ci' })).toBe('a/preview');
    expect(detectGithubRepo({ GITHUB_REPOSITORY: 'b/ci' })).toBe('b/ci');
  });
});

describe('pagesFromRepo', () => {
  test('user site at the root', () => {
    expect(pagesFromRepo('owner/owner.github.io')).toEqual({ site: 'https://owner.github.io', base: '/' });
  });

  test('project site under the repo name', () => {
    expect(pagesFromRepo('owner/blog')).toEqual({ site: 'https://owner.github.io', base: '/blog/' });
  });

  test('unknown repo falls back to the root', () => {
    expect(pagesFromRepo('')).toEqual({ site: 'https://example.github.io', base: '/' });
  });
});
