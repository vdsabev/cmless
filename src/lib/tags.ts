const hashColors = ['text-yellow-600', 'text-lime-600', 'text-blue-600', 'text-red-600'] as const;

export function tagHashColor(tag: string): (typeof hashColors)[number] {
	let hash = 0;
	for (let i = 0; i < tag.length; i++) {
		hash = (hash * 31 + tag.charCodeAt(i)) | 0;
	}
	return hashColors[Math.abs(hash) % hashColors.length];
}

/** Windows device basenames (case-insensitive), optionally with a stream suffix. */
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

/**
 * True when a tag can be a single URL path segment under `/tags/<tag>/`.
 * Rejects empty, `.` / `..`, path separators, query/fragment/percent characters,
 * Windows-reserved filename characters / device names, and trailing `.` / space.
 */
export function isSafeTagSegment(tag: string): boolean {
	if (!tag || tag === '.' || tag === '..') return false;
	// Separators, URL delimiters, and Windows-reserved path/filename chars.
	if (/[/\\?#%<>:"|*]/.test(tag)) return false;
	// Trailing dot/space is invalid or awkward as a Windows filename.
	if (/[. ]$/.test(tag)) return false;
	if (WINDOWS_RESERVED.test(tag)) return false;
	return true;
}

/** Normalize frontmatter tags (array or comma-separated string) to a string[]. */
export function parseTags(tags: string[] | string | undefined | null): string[] {
	const raw = Array.isArray(tags)
		? tags.map((t) => String(t).trim()).filter(Boolean)
		: tags == null || tags === ''
			? []
			: String(tags)
					.split(/,\s*/)
					.map((tag) => tag.trim())
					.filter(Boolean);

	// Dedupe (first wins) and drop path-unsafe segments so HTML, .md, and catalogs agree.
	const seen = new Set<string>();
	const out: string[] = [];
	const warned = new Set<string>();
	for (const tag of raw) {
		if (!isSafeTagSegment(tag)) {
			const key = `unsafe:${tag}`;
			if (!warned.has(key)) {
				warned.add(key);
				console.warn(
					`[cmless] Dropping unsafe tag (not a valid single path segment): ${JSON.stringify(tag)}`,
				);
			}
			continue;
		}
		if (seen.has(tag)) {
			const key = `dup:${tag}`;
			if (!warned.has(key)) {
				warned.add(key);
				console.warn(`[cmless] Dropping duplicate tag: ${JSON.stringify(tag)}`);
			}
			continue;
		}
		seen.add(tag);
		out.push(tag);
	}
	return out;
}
