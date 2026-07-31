/**
 * Split a GitHub repo description into site title + optional site description.
 *
 * Separators (first match wins):
 *   - pipe | (whitespace on both sides)
 *   - hyphen -, en dash –, em dash — (whitespace on both sides)
 *   - colon : (optional space before; whitespace required after, so "Name: tagline" works)
 *
 * Examples:
 *   "Vlad Sabev | Essays on software"
 *   "cmless - use GitHub as a blog"
 *   "Vlad Sabev – Essays on software"
 *   "Vlad Sabev — Essays on software"
 *   "Vlad Sabev: Essays on software"
 *   "My Blog" → title "My Blog", description ""
 */
export function parseRepoDescription(raw: string): { title: string; description: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { title: '', description: '' };

  // Prefer pipe, then dash family, then colon so "A | B: C" keeps "B: C" as description
  // and "A - B: C" keeps "B: C" when the dash split wins first.
  const patterns = [
    /^(.+?)\s+\|\s+(.+)$/,
    /^(.+?)\s+[-–—]\s+(.+)$/,
    /^(.+?)\s*:\s+(.+)$/,
  ];

  for (const re of patterns) {
    const split = trimmed.match(re);
    if (!split) continue;
    const title = split[1].trim();
    const description = split[2].trim();
    if (title && description) return { title, description };
  }

  return { title: trimmed, description: '' };
}
