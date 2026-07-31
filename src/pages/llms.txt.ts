import {
	abs,
	absoluteUrl,
	escapeMd,
	getNavPages,
	getPublishedPosts,
	getTagsMap,
	indexMdPath,
	parseContentDate,
	postHtmlPath,
	postMdPath,
	siteBase,
	tagMdPath,
	type ContentEntry,
} from '../lib/content';
import site from '../generated/site.json';

/** Meta in parentheses after the link: date, tags, author (when present). */
function formatEntryMeta(entry: ContentEntry): string {
	const parts: string[] = [];
	const d = parseContentDate(entry.date);
	if (d) {
		parts.push(d.toISOString().slice(0, 10));
	} else if (entry.date.trim()) {
		parts.push(escapeMd(entry.date.trim()));
	}
	if (entry.tags.length > 0) {
		parts.push(`tags: ${entry.tags.map((t) => escapeMd(t)).join(', ')}`);
	}
	if (entry.author) {
		parts.push(`author: ${escapeMd(entry.author)}`);
	}
	return parts.length > 0 ? ` (${parts.join('; ')})` : '';
}

function formatCatalogLine(entry: ContentEntry, href: string): string {
	const meta = formatEntryMeta(entry);
	const desc = entry.description ? `: ${escapeMd(entry.description)}` : '';
	return `- [${escapeMd(entry.title)}](${href})${meta}${desc}`;
}

export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	const posts = getPublishedPosts();
	const publishedSlugs = new Set(posts.map((p) => p.slug));
	// Nav entries that are also published posts are listed under Posts only.
	const pages = getNavPages().filter((p) => !publishedSlugs.has(p.slug));
	const tagsMap = getTagsMap();
	const tagNames = [...tagsMap.keys()].sort((a, b) => a.localeCompare(b));
	const base = siteBase();
	const exampleHtml = postHtmlPath('example-post');
	const exampleMd = postMdPath('example-post');
	const indexMd = indexMdPath();
	const tagMdExample = `${base}tags/<tag>.md`;

	const lines: string[] = [`# ${escapeMd(site.siteTitle)}`, ''];
	if (site.siteDescription) {
		lines.push(`> ${escapeMd(site.siteDescription)}`, '');
	}
	lines.push(
		'This site is a static blog. Posts and pages are available as Markdown at the same',
		`slug with a \`.md\` extension (\`${exampleHtml}\` ↔ \`${exampleMd}\`). The post index`,
		`is \`${indexMd}\`; tag listings are \`${tagMdExample}\`.`,
		'',
		'## Posts',
		'',
	);

	for (const post of posts) {
		const href = absoluteUrl(`${post.slug}.md`, siteUrl);
		lines.push(formatCatalogLine(post, href));
	}

	if (posts.length === 0) {
		lines.push('- (no published posts)');
	}

	lines.push('', '## Pages', '');

	for (const page of pages) {
		const href = absoluteUrl(`${page.slug}.md`, siteUrl);
		lines.push(formatCatalogLine(page, href));
	}

	if (pages.length === 0) {
		lines.push('- (no navigation pages)');
	}

	lines.push('', '## Tags', '');

	for (const tag of tagNames) {
		const count = tagsMap.get(tag)?.length ?? 0;
		const tagHref = abs(tagMdPath(tag), siteUrl);
		lines.push(`- [#${escapeMd(tag)}](${tagHref}): ${count} post${count === 1 ? '' : 's'}`);
	}

	if (tagNames.length === 0) {
		lines.push('- (no tags)');
	}

	const rssHref = absoluteUrl('rss.xml', siteUrl);
	const sitemapHref = absoluteUrl('sitemap.xml', siteUrl);
	const indexHref = abs(indexMdPath(), siteUrl);

	lines.push(
		'',
		'## Feeds',
		'',
		`- [RSS](${rssHref}): Published posts`,
		`- [Sitemap](${sitemapHref}): HTML and Markdown URLs`,
		`- [Post index (Markdown)](${indexHref})`,
		'',
	);

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
