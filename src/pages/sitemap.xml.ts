import {
	abs,
	escapeXml,
	getNavPages,
	getPublishedPosts,
	getTagNames,
	indexMdPath,
	parseContentDate,
	postHtmlPath,
	postMdPath,
	siteBase,
	tagHtmlPath,
	tagMdPath,
} from '../lib/content';

type SitemapUrl = {
	loc: string;
	lastmod?: string;
};

function formatLastmod(date: string): string | undefined {
	const d = parseContentDate(date);
	return d ? d.toISOString().slice(0, 10) : undefined;
}

export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	const posts = getPublishedPosts();
	const pages = getNavPages();
	const tags = getTagNames();
	const urls: SitemapUrl[] = [];
	const seen = new Set<string>();

	const push = (pathWithBase: string, lastmod?: string) => {
		const loc = abs(pathWithBase, siteUrl);
		if (seen.has(loc)) return;
		seen.add(loc);
		urls.push({ loc, lastmod });
	};

	push(siteBase());
	push(indexMdPath());

	// Published first; nav pages may overlap (published post also in nav) — dedupe by loc.
	for (const post of posts) {
		const lastmod = formatLastmod(post.date);
		push(postHtmlPath(post.slug), lastmod);
		push(postMdPath(post.slug), lastmod);
	}

	for (const page of pages) {
		const lastmod = formatLastmod(page.date);
		push(postHtmlPath(page.slug), lastmod);
		push(postMdPath(page.slug), lastmod);
	}

	for (const tag of tags) {
		push(tagHtmlPath(tag));
		push(tagMdPath(tag));
	}

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls.map((u) => {
			const parts = [`  <url>`, `    <loc>${escapeXml(u.loc)}</loc>`];
			if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
			parts.push(`  </url>`);
			return parts.join('\n');
		}),
		'</urlset>',
		'',
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
