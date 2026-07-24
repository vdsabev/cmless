import rss from '@astrojs/rss';
import { pathToSlug } from '../lib/slug';
import site from '../generated/site.json';

const modules: Record<string, { frontmatter: Record<string, any> }> = import.meta.glob('../content/blog/*.md', { eager: true });

const publishedPosts = Object.entries(modules)
  .map(([path, post]) => {
    const slug = pathToSlug(path);
    return {
      slug,
      title: post.frontmatter.title,
      date: post.frontmatter.date,
      description: post.frontmatter.description,
      status: post.frontmatter.status || 'published',
    };
  })
  .filter((post) => post.status === 'published')
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const GET = () =>
  rss({
    title: site.siteTitle,
    description: 'A blog powered by GitHub Issues and Astro.',
    site: import.meta.env.SITE,
    items: publishedPosts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.date),
      description: post.description,
      link: `/${post.slug}/`,
    })),
  });
