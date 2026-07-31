import { absoluteUrl } from '../lib/content';

export const GET = (context: { site?: URL }) => {
	const siteUrl = context.site ?? import.meta.env.SITE;
	const lines = ['User-agent: *', 'Allow: /', ''];
	// Sitemap protocol requires an absolute URL; omit when site is unset.
	if (siteUrl) {
		lines.push(`Sitemap: ${absoluteUrl('sitemap.xml', siteUrl)}`, '');
	}

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
