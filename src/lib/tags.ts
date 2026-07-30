const hashColors = ['text-yellow-600', 'text-lime-600', 'text-blue-600', 'text-red-600'] as const;

export function tagHashColor(tag: string): (typeof hashColors)[number] {
	let hash = 0;
	for (let i = 0; i < tag.length; i++) {
		hash = (hash * 31 + tag.charCodeAt(i)) | 0;
	}
	return hashColors[Math.abs(hash) % hashColors.length];
}

/** Normalize frontmatter tags (array or comma-separated string) to a string[]. */
export function parseTags(tags: string[] | string | undefined | null): string[] {
	if (Array.isArray(tags)) return tags;
	if (tags == null || tags === '') return [];
	return String(tags)
		.split(/,\s*/)
		.map((tag) => tag.trim())
		.filter(Boolean);
}
