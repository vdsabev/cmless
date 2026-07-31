import { absoluteUrl, escapeMd, getTagsMap } from '../../lib/content';

export function getStaticPaths() {
	const tagsMap = getTagsMap();
	return [...tagsMap.entries()].map(([tag, posts]) => ({
		params: { tag },
		props: { tag, posts },
	}));
}

export function GET({
	props,
	site,
}: {
	props: {
		tag: string;
		posts: Array<{
			slug: string;
			title: string;
			date: string;
			description: string;
		}>;
	};
	site?: URL;
}) {
	const siteUrl = site ?? import.meta.env.SITE;
	const { tag, posts } = props;

	const lines: string[] = [
		`# #${escapeMd(tag)}`,
		'',
		`Posts tagged ${escapeMd(tag)}.`,
		'',
	];

	for (const post of posts) {
		const href = absoluteUrl(`${post.slug}.md`, siteUrl);
		const date = post.date || '';
		const desc = post.description ? ` — ${escapeMd(post.description)}` : '';
		const datePart = date ? ` — ${date}` : '';
		lines.push(`- [${escapeMd(post.title)}](${href})${datePart}${desc}`);
	}

	if (posts.length === 0) {
		lines.push('- (no posts)');
	}

	lines.push('');

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
}
