import {
	SITE_DESCRIPTION,
	abs,
	absoluteUrl,
	escapeMd,
	getNavPages,
	getPublishedPosts,
	getTagsMap,
	indexMdPath,
	postHtmlPath,
	postMdPath,
	siteBase,
	tagMdPath,
} from '../lib/content';
import site from '../generated/site.json';

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

	const lines: string[] = [
		`# ${escapeMd(site.siteTitle)}`,
		'',
		`> ${SITE_DESCRIPTION}`,
		'',
		'This site is a static blog. Posts and pages are available as Markdown at the same',
		`slug with a \`.md\` extension (\`${exampleHtml}\` ↔ \`${exampleMd}\`). The post index`,
		`is \`${indexMd}\`; tag listings are \`${tagMdExample}\`.`,
		'',
		'## Posts',
		'',
	];

	for (const post of posts) {
		const href = absoluteUrl(`${post.slug}.md`, siteUrl);
		const desc = post.description ? `: ${escapeMd(post.description)}` : '';
		lines.push(`- [${escapeMd(post.title)}](${href})${desc}`);
	}

	if (posts.length === 0) {
		lines.push('- (no published posts)');
	}

	lines.push('', '## Pages', '');

	for (const page of pages) {
		const href = absoluteUrl(`${page.slug}.md`, siteUrl);
		const desc = page.description ? `: ${escapeMd(page.description)}` : '';
		lines.push(`- [${escapeMd(page.title)}](${href})${desc}`);
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
