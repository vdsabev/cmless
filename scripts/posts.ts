/**
 * Pure helpers for generate.ts: issue listing limits and slug de-duplication.
 * Kept separate so they can be unit tested without running the generator.
 */

/**
 * Upper bound on issues fetched per build. `gh issue list` pages through the
 * API internally, so this only caps the total; generate fails loudly when it
 * is reached instead of silently dropping older posts.
 */
export const ISSUE_LIMIT = 10000;

export function issueListArgs(repo: string, limit = ISSUE_LIMIT): string[] {
  return [
    'issue',
    'list',
    ...(repo ? ['-R', repo] : []),
    '--state',
    'all',
    '--limit',
    String(limit),
    '--json',
    'number,title,body,labels,createdAt,url,author',
  ];
}

/** Throws when the fetched count reached the limit (results may be truncated). */
export function assertIssuesNotTruncated(count: number, limit = ISSUE_LIMIT): void {
  if (count >= limit) {
    throw new Error(
      `Fetched ${count} issues, which reaches the limit of ${limit}; older posts may be missing. ` +
        'Raise ISSUE_LIMIT in scripts/posts.ts.',
    );
  }
}

export type SluggedPost = { slug: string; number: number };

/**
 * Make slugs unique (case-insensitive, since output files share one directory).
 * The oldest issue (lowest number) keeps the slug so existing URLs stay stable
 * when a newer issue reuses a title; later ones get `-<issue number>`.
 * Mutates `slug` in place and returns human-readable warnings.
 */
export function dedupeSlugs(posts: SluggedPost[]): string[] {
  const warnings: string[] = [];
  const taken = new Set<string>();
  const byNumber = [...posts].sort((a, b) => a.number - b.number);

  // Reserve every original slug first so a suffixed slug never steals one.
  const original = new Set(posts.map((post) => post.slug.toLowerCase()));

  for (const post of byNumber) {
    const key = post.slug.toLowerCase();
    if (!taken.has(key)) {
      taken.add(key);
      continue;
    }
    const base = post.slug;
    let candidate = `${base}-${post.number}`;
    for (let n = 2; taken.has(candidate.toLowerCase()) || original.has(candidate.toLowerCase()); n++) {
      candidate = `${base}-${post.number}-${n}`;
    }
    taken.add(candidate.toLowerCase());
    warnings.push(`Slug "${base}" from issue #${post.number} is already used; writing it as "${candidate}".`);
    post.slug = candidate;
  }
  return warnings;
}
