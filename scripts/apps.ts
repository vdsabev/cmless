/**
 * Apps (portfolio entries) from GitHub issues labeled `app`.
 *
 * An app issue is not a blog post: it gets no page of its own, only a card on
 * the homepage that links to the app's `url`. Pure helpers live here so they
 * can be unit tested without running the generator.
 */
import { autoDescription } from './markdown';

/** Label that marks an issue as an app instead of a blog post. */
export const APP_LABEL = 'app';

export function isAppLabel(label: string): boolean {
  return label.trim().toLowerCase() === APP_LABEL;
}

export type App = {
  number: number;
  title: string;
  url: string;
  description: string;
  image: string;
  imageAlt: string;
  /** From frontmatter `order`; lower comes first. Undefined sorts after numbered apps. */
  order?: number;
  /** Issue creation date (ISO); newest first among apps without `order`. */
  createdAt: string;
};

export type AppIssue = {
  number: number;
  title?: string;
  createdAt?: string;
};

/** `https://…` and `http://…` pass; `/path` stays site-relative; bare domains get https. */
export function normalizeAppUrl(value: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ''; // javascript:, mailto:, … are not apps
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

/** Build an app from an issue's parsed frontmatter + body. Returns a reason string when skipped. */
export function parseApp(
  issue: AppIssue,
  frontmatter: Record<string, string>,
  content: string,
): App | string {
  const title = (frontmatter.title || issue.title || '').trim() || `Issue #${issue.number}`;
  const url = normalizeAppUrl(frontmatter.url || '');
  if (!url) return `app issue #${issue.number} "${title}" has no valid \`url:\` in its frontmatter; skipped`;

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
    order: order === undefined || Number.isNaN(order) ? undefined : order,
    createdAt: issue.createdAt || '',
  };
}

/** Apps with `order` first (ascending), then the rest newest first; title breaks ties. */
export function sortApps<T extends Pick<App, 'order' | 'createdAt' | 'title'>>(apps: T[]): T[] {
  return [...apps].sort((a, b) => {
    const ao = a.order ?? Infinity;
    const bo = b.order ?? Infinity;
    if (ao !== bo) return ao < bo ? -1 : 1;
    if (a.order === undefined && a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? 1 : -1;
    }
    return a.title.localeCompare(b.title);
  });
}
