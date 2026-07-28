/** Approximate minutes to read from markdown source. */
export function getReadingTimeInMinutes(markdown: string): number {
	const text = markdown
		.replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
		.replace(/`[^`]*`/g, ' ') // inline code
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → label text
		.replace(/<\/?[^>]+>/g, ' ') // HTML tags
		.replace(/[#>*_~|]+/g, ' ') // markdown punctuation
		.replace(/\s+/g, ' ')
		.trim();
	const words = text ? text.split(' ').length : 0;
	const wpm = 180;
	return Math.max(1, Math.ceil(words / wpm));
}
