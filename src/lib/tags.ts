const hashColors = ['text-yellow-600', 'text-lime-600', 'text-blue-600', 'text-red-600'] as const;

export function tagHashColor(tag: string): (typeof hashColors)[number] {
	let hash = 0;
	for (let i = 0; i < tag.length; i++) {
		hash = (hash * 31 + tag.charCodeAt(i)) | 0;
	}
	return hashColors[Math.abs(hash) % hashColors.length];
}
