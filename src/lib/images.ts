/** Alt text from the first HTML `<img>` or Markdown image in content. */
export function firstImageAlt(content: string): string | undefined {
	const htmlTag = content.match(/<img\b[^>]*>/i)?.[0];
	if (htmlTag) {
		const alt = htmlTag.match(/\balt\s*=\s*(["'])([\s\S]*?)\1/i)?.[2]?.trim();
		if (alt) return alt;
	}

	const mdAlt = content.match(/!\[([^\]]+)\]\([^)]+\)/)?.[1]?.trim();
	if (mdAlt) return mdAlt;

	return undefined;
}
