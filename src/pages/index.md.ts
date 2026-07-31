import {
	absoluteUrl,
	escapeMd,
	getPublishedPosts,
} from '../lib/content';
import site from '../generated/site.json';

export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	const posts = getPublishedPosts();

	const lines: string[] = [`# ${escapeMd(site.siteTitle)}`, ''];
	if (site.siteDescription) {
		lines.push(`> ${escapeMd(site.siteDescription)}`, '');
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
	const rss = absoluteUrl('rss.xml', siteUrl);

	lines.push('', `Catalogs: [llms.txt](${llms}) · [rss.xml](${rss})`, '');

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
};
