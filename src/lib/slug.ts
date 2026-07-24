/** URL slug from a blog markdown path (filename is the slug after generate). */
export function pathToSlug(path: string): string {
	return path.split('/').pop()!.replace(/\.md$/, '');
}
