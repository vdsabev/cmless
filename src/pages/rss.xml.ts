import rss from '@astrojs/rss';
import {
	SITE_DESCRIPTION,
	abs,
	absoluteUrl,
	escapeXml,
	getPublishedPosts,
	parseContentDate,
	postHtmlPath,
	siteBase,
} from '../lib/content';
import site from '../generated/site.json';

export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	// Channel <link> is createCanonicalURL(site); include BASE_URL for project Pages.
	const channelSite = abs(siteBase(), siteUrl);
	const posts = getPublishedPosts();

	return rss({
		title: site.siteTitle,
		description: SITE_DESCRIPTION,
		site: channelSite,
		xmlns: {
			atom: 'http://www.w3.org/2005/Atom',
		},
		items: posts.map((post) => {
			const mdUrl = absoluteUrl(`${post.slug}.md`, siteUrl);
			return {
				title: post.title,
				// Omit invalid dates so @astrojs/rss Zod refine does not fail the build.
				pubDate: parseContentDate(post.date),
				description: post.description,
				// HTML remains canonical; Markdown is advertised via atom:link alternate.
				// Path includes BASE_URL so project sites resolve correctly.
				link: postHtmlPath(post.slug),
				customData: `<atom:link rel="alternate" type="text/markdown" href="${escapeXml(mdUrl)}"/>`,
			};
		}),
	});
};
