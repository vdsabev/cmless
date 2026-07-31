import { pathToSlug } from './slug';
import { parseTags } from './tags';

export type ContentEntry = {
	slug: string;
	title: string;
	date: string;
	description: string;
	status: string;
	tags: string[];
	/** From frontmatter `author`; empty when unset. */
	author: string;
	/** Same truthiness as `[slug].astro` (`!!frontmatter.navigation`). */
	isNav: boolean;
	/** From frontmatter; used to match human header/footer order. */
	navigationIndex: number;
	image?: string;
	imageAlt?: string;
	/** Markdown body without frontmatter (for reading-time). */
	body: string;
};

/** Parse a frontmatter date string; returns undefined when missing or invalid. */
export function parseContentDate(date: string): Date | undefined {
	if (!date) return undefined;
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return undefined;
	return d;
}

/** Site base path with trailing slash (`/` or `/repo/`). */
export function siteBase(): string {
	const base = import.meta.env.BASE_URL || '/';
	return base.endsWith('/') ? base : `${base}/`;
}

/**
 * Absolute URL when `site` is set; otherwise the path as-is.
 * `pathWithBase` must already include the site base (e.g. from `postHtmlPath`).
 */
export function abs(pathWithBase: string, site?: string | URL | null): string {
	if (site) return new URL(pathWithBase, site).href;
	return pathWithBase;
}

/** Absolute URL for a path under the site base (`slug.md`, `rss.xml`, …). */
export function absoluteUrl(pathUnderBase: string, site?: string | URL | null): string {
	const trimmed = pathUnderBase.replace(/^\//, '');
	return abs(`${siteBase()}${trimmed}`, site);
}

export function postHtmlPath(slug: string): string {
	return `${siteBase()}${slug}/`;
}

export function postMdPath(slug: string): string {
	return `${siteBase()}${slug}.md`;
}

export function indexMdPath(): string {
	return `${siteBase()}index.md`;
}

/** Encode a tag for use as a single path segment (matches HTML tag routes). */
export function encodeTagSegment(tag: string): string {
	return encodeURIComponent(tag);
}

export function tagHtmlPath(tag: string): string {
	return `${siteBase()}tags/${encodeTagSegment(tag)}/`;
}

export function tagMdPath(tag: string): string {
	return `${siteBase()}tags/${encodeTagSegment(tag)}.md`;
}

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** Escape text for use inside a Markdown link label `[...]` or plain list prose. */
export function escapeMd(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\*/g, '\\*')
		.replace(/_/g, '\\_')
		.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]')
		.replace(/\r?\n/g, ' ');
}

type MetaModule = {
	frontmatter: Record<string, unknown>;
	rawContent?: () => string;
};

/** Module-level cache for production builds. Skipped in dev so content edits refresh. */
let inventoryCache: ContentEntry[] | null = null;

function loadInventory(): ContentEntry[] {
	const useCache = !import.meta.env.DEV;
	if (useCache && inventoryCache) return inventoryCache;

	const metaModules: Record<string, MetaModule> = import.meta.glob('../content/blog/*.md', {
		eager: true,
	});

	const entries: ContentEntry[] = [];

	for (const [filePath, mod] of Object.entries(metaModules)) {
		const slug = pathToSlug(filePath);
		const fm = mod.frontmatter || {};
		const body = typeof mod.rawContent === 'function' ? mod.rawContent() : '';
		const title = typeof fm.title === 'string' ? fm.title : slug;
		const date = typeof fm.date === 'string' ? fm.date : '';
		const description = typeof fm.description === 'string' ? fm.description : '';
		// Blank string status stays blank (not published); only missing/non-string defaults.
		const status = typeof fm.status === 'string' ? fm.status : 'published';
		// Match `[slug].astro`: `const isPage = !!frontmatter.navigation`
		const isNav = !!fm.navigation;
		const navigationIndex =
			typeof fm.navigationIndex === 'number'
				? fm.navigationIndex
				: typeof fm.navigationIndex === 'string' && fm.navigationIndex.trim() !== ''
					? Number.parseInt(fm.navigationIndex, 10) || 0
					: 0;
		const image = typeof fm.image === 'string' ? fm.image : undefined;
		const imageAlt = typeof fm.imageAlt === 'string' ? fm.imageAlt : undefined;
		const author = typeof fm.author === 'string' ? fm.author.trim() : '';

		entries.push({
			slug,
			title,
			date,
			description,
			status,
			tags: parseTags(fm.tags as string[] | string | undefined),
			author,
			isNav,
			navigationIndex,
			image,
			imageAlt,
			body,
		});
	}

	if (useCache) inventoryCache = entries;
	return entries;
}

/** All blog content entries (posts + nav pages). Cached per module load. */
export function getAllContent(): ContentEntry[] {
	return loadInventory();
}

/** Published content only (newest first). Nav is allowed — a post may also live in the nav. */
export function getPublishedPosts(): ContentEntry[] {
	return getAllContent()
		.filter((e) => e.status === 'published')
		.sort((a, b) => {
			const tb = parseContentDate(b.date)?.getTime() ?? 0;
			const ta = parseContentDate(a.date)?.getTime() ?? 0;
			return tb - ta;
		});
}

/** Navigation pages (any status), ordered like site chrome (`navigationIndex`, then title). */
export function getNavPages(): ContentEntry[] {
	return getAllContent()
		.filter((e) => e.isNav)
		.sort((a, b) => {
			if (a.navigationIndex !== b.navigationIndex) {
				return a.navigationIndex - b.navigationIndex;
			}
			return a.title.localeCompare(b.title);
		});
}

/** Unique tags → published posts with that tag (newest first). Same set as tag HTML routes. */
export function getTagsMap(): Map<string, ContentEntry[]> {
	const map = new Map<string, ContentEntry[]>();
	for (const post of getPublishedPosts()) {
		// post.tags already deduped in parseTags; still guard against double-push.
		const seen = new Set<string>();
		for (const tag of post.tags) {
			if (seen.has(tag)) continue;
			seen.add(tag);
			const list = map.get(tag) ?? [];
			list.push(post);
			map.set(tag, list);
		}
	}
	return map;
}

export function getTagNames(): string[] {
	return [...getTagsMap().keys()].sort((a, b) => a.localeCompare(b));
}
