import {
	absoluteUrl,
	escapeMd,
	getPublishedPosts,
} from '../lib/content';
import site from '../generated/site.json';
import { getLinkSections } from '../lib/links';

export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	const posts = getPublishedPosts();

	const lines: string[] = [`# ${escapeMd(site.siteTitle)}`, ''];
	if (site.siteDescription) {
		lines.push(`> ${escapeMd(site.siteDescription)}`, '');
	}
	for (const section of getLinkSections()) {
		lines.push(`## ${escapeMd(section.title)}`, '');
		for (const link of section.links) {
			const href = /^https?:\/\//i.test(link.url) ? link.url : siteUrl ? new URL(link.url, siteUrl).href : link.url;
			const desc = link.description ? ` — ${escapeMd(link.description)}` : '';
			lines.push(`- [${escapeMd(link.title)}](${href})${desc}`);
		}
		lines.push('');
	}

	lines.push('## Posts', '');

	for (const post of posts) {
		const href = absoluteUrl(`${post.slug}.md`, siteUrl);
		const date = post.date || '';
		const desc = post.description ? ` — ${escapeMd(post.description)}` : '';
		const datePart = date ? ` — ${date}` : '';
		lines.push(`- [${escapeMd(post.title)}](${href})${datePart}${desc}`);
	}

	if (posts.length === 0) {
		lines.push('- (no published posts)');
	}

	const llms = absoluteUrl('llms.txt', siteUrl);
	const llmsFull = absoluteUrl('llms-full.txt', siteUrl);
	const rss = absoluteUrl('rss.xml', siteUrl);

	lines.push(
		'',
		`Catalogs: [llms.txt](${llms}) · [llms-full.txt](${llmsFull}) · [rss.xml](${rss})`,
		'',
	);

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
};
