/** Homepage app cards, written by scripts/generate.ts from issues labeled `app` (already sorted). */
export type App = {
	title: string;
	url: string;
	description: string;
	image: string;
	imageAlt: string;
};

// Optional: older generated output (or a fresh clone before `bun generate`) has no apps.json.
const modules = import.meta.glob<{ default: App[] }>('../generated/apps.json', { eager: true });

export function getApps(): App[] {
	const data = Object.values(modules)[0]?.default;
	return Array.isArray(data) ? data : [];
}
