/** Homepage link cards, written by scripts/generate.ts from issues labeled `link` (already grouped and sorted). */
export type Link = {
	title: string;
	url: string;
	description: string;
	image: string;
	imageAlt: string;
	newTab: boolean;
};

export type LinkSection = {
	title: string;
	links: Link[];
};

// Optional: older generated output (or a fresh clone before `bun generate`) has no links.json.
const modules = import.meta.glob<{ default: LinkSection[] }>('../generated/links.json', { eager: true });

export function getLinkSections(): LinkSection[] {
	const data = Object.values(modules)[0]?.default;
	return Array.isArray(data) ? data.filter((section) => section.links?.length > 0) : [];
}
