import { pathToSlug } from '../lib/slug';
import {
	absoluteUrl,
	escapeMd,
	getNavPages,
	getPublishedPosts,
} from '../lib/content';
import site from '../generated/site.json';

/**
 * Fence raw twin Markdown so frontmatter (`---`) and headings inside a body
 * cannot reshape the outer llms-full outline.
 */
function fenceSource(raw: string): string {
	const body = raw.trimEnd();
	let ticks = '```';
	// Prefer a fence longer than any run of backticks in the body.
	const runs = body.match(/`+/g);
	if (runs) {
		const max = Math.max(...runs.map((r) => r.length));
		if (max >= 3) ticks = '`'.repeat(max + 1);
	}
	return `${ticks}markdown\n${body}\n${ticks}`;
}

/**
 * Full-text Markdown dump for agents (`/llms-full.txt`).
 * Same selection as `llms.txt`: published posts + navigation pages (nav-only once).
 * Bodies match the per-slug `.md` twins (frontmatter + source), fenced per entry.
 */
export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	const posts = getPublishedPosts();
	const publishedSlugs = new Set(posts.map((p) => p.slug));
	const pages = getNavPages().filter((p) => !publishedSlugs.has(p.slug));

	const rawModules: Record<string, string> = import.meta.glob('../content/blog/*.md', {
		query: '?raw',
		import: 'default',
		eager: true,
	});
	const rawBySlug = new Map<string, string>();
	for (const [filePath, raw] of Object.entries(rawModules)) {
		rawBySlug.set(pathToSlug(filePath), raw as string);
	}

	const catalog = absoluteUrl('llms.txt', siteUrl);
	const lines: string[] = [`# ${escapeMd(site.siteTitle)}`, ''];
	if (site.siteDescription) {
		lines.push(`> ${escapeMd(site.siteDescription)}`, '');
	}
	lines.push(
		'Full Markdown sources for published posts and navigation pages (same text as each `/{slug}.md` twin).',
		`Catalog with summaries and tag index: [${catalog}](${catalog}).`,
		'Each body is a fenced `markdown` code block so frontmatter and headings stay isolated from this outline.',
		'',
	);

	const appendSection = (heading: string, emptyLine: string, entries: { slug: string; title: string }[]) => {
		lines.push(`## ${heading}`, '');
		if (entries.length === 0) {
			lines.push(emptyLine, '');
			return;
		}
		for (const entry of entries) {
			const mdUrl = absoluteUrl(`${entry.slug}.md`, siteUrl);
			const htmlUrl = absoluteUrl(`${entry.slug}/`, siteUrl);
			const raw = rawBySlug.get(entry.slug) ?? '';
			lines.push(
				`### ${escapeMd(entry.title)}`,
				'',
				`- Markdown: ${mdUrl}`,
				`- HTML: ${htmlUrl}`,
				'',
				fenceSource(raw),
				'',
			);
		}
	};

	appendSection('Posts', '- (no published posts)', posts);
	appendSection('Pages', '- (no navigation pages)', pages);

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
