/**
 * Links (portfolio cards) from GitHub issues labeled `link`.
 *
 * A link issue is not a blog post: it gets no page of its own, only a card in a
 * homepage strip that opens the link's `url`. Cards are grouped into sections
 * (frontmatter `section:`, default "Projects"). Pure helpers live here so they
 * can be unit tested without running the generator.
 */
import { autoDescription } from './markdown';

/** Label that marks an issue as a link card instead of a blog post. */
export const LINK_LABEL = 'link';

export const DEFAULT_SECTION = 'Projects';

export function isLinkLabel(label: string): boolean {
  return label.trim().toLowerCase() === LINK_LABEL;
}

export type Link = {
  number: number;
  title: string;
  url: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Homepage section heading this card goes under. */
  section: string;
  /** Open in a new tab (default true; frontmatter `newTab: false` turns it off). */
  newTab: boolean;
  /** From frontmatter `order`; lower comes first. Undefined sorts after numbered links. */
  order?: number;
  /** Issue creation date (ISO); newest first among links without `order`. */
  createdAt: string;
};

export type LinkIssue = {
  number: number;
  title?: string;
  createdAt?: string;
};

/** `https://…` and `http://…` pass; `/path` stays site-relative; bare domains get https. */
export function normalizeLinkUrl(value: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ''; // javascript:, mailto:, … are not cards
  return `https://${v}`;
}

/** First image anywhere in the body (Markdown or HTML), for the card thumbnail. */
export function firstImage(content: string): { src?: string; alt?: string } {
  const md = content.match(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  const html = content.match(/<img\b[^>]*>/i);
  const mdIndex = md?.index ?? Infinity;
  const htmlIndex = html?.index ?? Infinity;
  if (md && mdIndex <= htmlIndex) {
    return { src: md[2].trim() || undefined, alt: md[1].trim() || undefined };
  }
  if (html) {
    const tag = html[0];
    const src = tag.match(/\bsrc\s*=\s*(["'])([\s\S]*?)\1/i)?.[2]?.trim();
    const alt = tag.match(/\balt\s*=\s*(["'])([\s\S]*?)\1/i)?.[2]?.trim();
    return { src: src || undefined, alt: alt || undefined };
  }
  return {};
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  const v = (value || '').trim().toLowerCase();
  if (['false', 'no', 'off', '0'].includes(v)) return false;
  if (['true', 'yes', 'on', '1'].includes(v)) return true;
  return fallback;
}

/** Build a link from an issue's parsed frontmatter + body. Returns a reason string when skipped. */
export function parseLink(
  issue: LinkIssue,
  frontmatter: Record<string, string>,
  content: string,
): Link | string {
  const title = (frontmatter.title || issue.title || '').trim() || `Issue #${issue.number}`;
  const url = normalizeLinkUrl(frontmatter.url || '');
  if (!url) return `link issue #${issue.number} "${title}" has no valid \`url:\` in its frontmatter; skipped`;

  const lead = firstImage(content);
  const image = (frontmatter.image || lead.src || '').trim();
  const imageAlt = (frontmatter.imageAlt || (image && image === lead.src ? lead.alt : '') || '').trim();
  const description = (frontmatter.description || '').trim() || autoDescription(content);
  const orderRaw = (frontmatter.order || '').trim();
  const order = orderRaw === '' ? undefined : Number(orderRaw);

  return {
    number: issue.number,
    title,
    url,
    description,
    image,
    imageAlt,
    section: (frontmatter.section || '').trim() || DEFAULT_SECTION,
    newTab: parseBoolean(frontmatter.newTab, true),
    order: order === undefined || Number.isNaN(order) ? undefined : order,
    createdAt: issue.createdAt || '',
  };
}

/** Links with `order` first (ascending), then the rest newest first; title breaks ties. */
export function sortLinks<T extends Pick<Link, 'order' | 'createdAt' | 'title'>>(links: T[]): T[] {
  return [...links].sort((a, b) => {
    const ao = a.order ?? Infinity;
    const bo = b.order ?? Infinity;
    if (ao !== bo) return ao < bo ? -1 : 1;
    if (a.order === undefined && a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Sort links, then group them by section (case-insensitive; the first card's
 * spelling names it). A section's position is that of its first card, so the
 * section holding the lowest `order` comes first.
 */
export function groupLinks<T extends Pick<Link, 'order' | 'createdAt' | 'title' | 'section'>>(
  links: T[],
): { title: string; links: T[] }[] {
  const sections = new Map<string, { title: string; links: T[] }>();
  for (const link of sortLinks(links)) {
    const title = link.section.trim() || DEFAULT_SECTION;
    const key = title.toLowerCase();
    if (!sections.has(key)) sections.set(key, { title, links: [] });
    sections.get(key)!.links.push(link);
  }
  return [...sections.values()];
}
