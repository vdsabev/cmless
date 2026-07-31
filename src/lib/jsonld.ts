import { abs, absoluteUrl, parseContentDate, postHtmlPath, postMdPath, siteBase } from './content';

export type JsonLd = Record<string, unknown>;

/** ISO-8601 when `date` parses; otherwise omit from JSON-LD. */
export function jsonLdDate(date: string): string | undefined {
	const d = parseContentDate(date);
	return d ? d.toISOString() : undefined;
}

/**
 * Absolute URL for schema.org fields. Already-absolute `http(s):` values pass through;
 * site-relative paths resolve against `site` via the same base rules as HTML/Markdown twins.
 */
export function jsonLdAbsUrl(
	value: string | undefined,
	site?: string | URL | null,
): string | undefined {
	const v = value?.trim();
	if (!v) return undefined;
	if (/^https?:\/\//i.test(v)) return v;
	return absoluteUrl(v.replace(/^\//, ''), site);
}

export function personJsonLd(opts: {
	name?: string;
	url?: string;
	image?: string;
}): JsonLd | undefined {
	const name = opts.name?.trim();
	const url = opts.url?.trim();
	const image = opts.image?.trim();
	if (!name && !url) return undefined;
	const person: JsonLd = { '@type': 'Person' };
	if (name) person.name = name;
	if (url) person.url = url;
	if (image) person.image = image;
	return person;
}

/** Site publisher as Organization (shared by Blog and BlogPosting). */
export function organizationPublisherJsonLd(opts: {
	site?: string | URL | null;
	name: string;
	/** Optional logo URL (absolute or site-relative). */
	logo?: string;
}): JsonLd {
	const name = opts.name.trim() || 'Site';
	const url = abs(siteBase(), opts.site);
	const org: JsonLd = {
		'@type': 'Organization',
		name,
		url,
	};
	const logo = jsonLdAbsUrl(opts.logo, opts.site);
	if (logo) {
		org.logo = { '@type': 'ImageObject', url: logo };
	}
	return org;
}

function imageField(
	image: string | undefined,
	imageAlt: string | undefined,
	site?: string | URL | null,
): string | JsonLd | undefined {
	const url = jsonLdAbsUrl(image, site);
	if (!url) return undefined;
	if (imageAlt?.trim()) {
		return { '@type': 'ImageObject', url, description: imageAlt.trim() };
	}
	return url;
}

export function blogPostingJsonLd(opts: {
	site?: string | URL | null;
	slug: string;
	title: string;
	description?: string;
	date?: string;
	image?: string;
	imageAlt?: string;
	tags?: string[];
	author?: string;
	authorUrl?: string;
	authorAvatar?: string;
	siteTitle?: string;
}): JsonLd {
	const htmlUrl = abs(postHtmlPath(opts.slug), opts.site);
	const mdUrl = abs(postMdPath(opts.slug), opts.site);
	const published = opts.date ? jsonLdDate(opts.date) : undefined;
	const author = personJsonLd({
		name: opts.author,
		url: opts.authorUrl,
		image: jsonLdAbsUrl(opts.authorAvatar, opts.site),
	});

	const node: JsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: opts.title,
		url: htmlUrl,
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': htmlUrl,
		},
		isAccessibleForFree: true,
		encodingFormat: 'text/html',
		// Machine-readable twin; agents prefer this over HTML.
		associatedMedia: {
			'@type': 'MediaObject',
			contentUrl: mdUrl,
			encodingFormat: 'text/markdown',
		},
	};

	if (opts.description) node.description = opts.description;
	if (published) node.datePublished = published;
	const image = imageField(opts.image, opts.imageAlt, opts.site);
	if (image) node.image = image;
	if (opts.tags && opts.tags.length > 0) node.keywords = opts.tags.join(', ');
	if (author) node.author = author;
	if (opts.siteTitle) {
		node.publisher = organizationPublisherJsonLd({
			site: opts.site,
			name: opts.siteTitle,
		});
	}

	return node;
}

export function webPageJsonLd(opts: {
	site?: string | URL | null;
	slug: string;
	title: string;
	description?: string;
	date?: string;
	image?: string;
	author?: string;
	authorUrl?: string;
	authorAvatar?: string;
}): JsonLd {
	const htmlUrl = abs(postHtmlPath(opts.slug), opts.site);
	const mdUrl = abs(postMdPath(opts.slug), opts.site);
	const published = opts.date ? jsonLdDate(opts.date) : undefined;
	const author = personJsonLd({
		name: opts.author,
		url: opts.authorUrl,
		image: jsonLdAbsUrl(opts.authorAvatar, opts.site),
	});

	const node: JsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: opts.title,
		url: htmlUrl,
		'@id': htmlUrl,
		isAccessibleForFree: true,
		associatedMedia: {
			'@type': 'MediaObject',
			contentUrl: mdUrl,
			encodingFormat: 'text/markdown',
		},
	};

	if (opts.description) node.description = opts.description;
	if (published) node.datePublished = published;
	const image = imageField(opts.image, undefined, opts.site);
	if (image) node.image = image;
	if (author) node.author = author;

	return node;
}

/** Homepage collection / blog root. */
export function blogJsonLd(opts: {
	site?: string | URL | null;
	siteTitle: string;
	description?: string;
	image?: string;
	ownerLogin?: string;
	ownerAvatar?: string;
}): JsonLd {
	const url = abs(siteBase(), opts.site);
	const node: JsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: opts.siteTitle,
		url,
		'@id': url,
		isAccessibleForFree: true,
	};

	if (opts.description) node.description = opts.description;
	const image = jsonLdAbsUrl(opts.image, opts.site);
	if (image) node.image = image;

	// Person author when we know the GitHub owner; publisher is always Organization.
	if (opts.ownerLogin) {
		const author = personJsonLd({
			name: opts.ownerLogin,
			url: `https://github.com/${opts.ownerLogin}`,
			image: jsonLdAbsUrl(opts.ownerAvatar, opts.site),
		});
		if (author) node.author = author;
	}

	node.publisher = organizationPublisherJsonLd({
		site: opts.site,
		name: opts.siteTitle,
		logo: opts.ownerAvatar,
	});

	return node;
}

/** Safe embedding in `<script type="application/ld+json">`. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
