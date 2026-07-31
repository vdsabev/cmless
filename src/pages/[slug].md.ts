import { pathToSlug } from '../lib/slug';

/**
 * Static Markdown twin of each post/page at `/<slug>.md`.
 * Same source file the HTML build uses (frontmatter + body).
 */
export function getStaticPaths() {
	const modules = import.meta.glob('../content/blog/*.md', {
		query: '?raw',
		import: 'default',
		eager: true,
	});

	return Object.entries(modules).map(([filePath, raw]) => ({
		params: { slug: pathToSlug(filePath) },
		props: { raw: raw as string },
	}));
}

export function GET({ props }: { props: { raw: string } }) {
	return new Response(props.raw, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
}
