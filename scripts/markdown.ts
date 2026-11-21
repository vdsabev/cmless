/**
 * Markdown helpers for generate.ts: frontmatter parsing, auto descriptions,
 * and media embeds. Pure functions so they can be unit tested.
 */

// ---------------------------------------------------------------------------
// Code-aware rewriting
// ---------------------------------------------------------------------------

type Segment = { code: boolean; text: string };

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;

/** Split markdown into fenced-code / inline-code segments and everything else. */
export function splitCode(markdown: string): Segment[] {
  const segments: Segment[] = [];
  const push = (code: boolean, text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.code === code) last.text += text;
    else segments.push({ code, text });
  };

  // Fenced blocks first (line-based, per CommonMark: the closing fence uses the
  // same character and is at least as long; an unclosed fence runs to the end).
  const lines = markdown.match(/[^\n]*\n|[^\n]+$/g) || [];
  let prose = '';
  let fence: { char: string; len: number } | null = null;
  let block = '';
  for (const line of lines) {
    if (!fence) {
      const open = line.match(FENCE_OPEN);
      // A backtick fence's info string may not contain backticks.
      if (open && !(open[1][0] === '`' && line.slice(open[0].length).includes('`'))) {
        pushProse(prose, push);
        prose = '';
        fence = { char: open[1][0], len: open[1].length };
        block = line;
      } else {
        prose += line;
      }
      continue;
    }
    block += line;
    const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
    if (close && close[1][0] === fence.char && close[1].length >= fence.len) {
      push(true, block);
      fence = null;
      block = '';
    }
  }
  if (fence) push(true, block);
  pushProse(prose, push);
  return segments;
}

/** Inline code spans: a run of N backticks closed by the next run of exactly N. */
const INLINE_CODE = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g;

function pushProse(text: string, push: (code: boolean, text: string) => void) {
  let last = 0;
  for (const match of text.matchAll(INLINE_CODE)) {
    push(false, text.slice(last, match.index));
    push(true, match[0]);
    last = match.index! + match[0].length;
  }
  push(false, text.slice(last));
}

/** Apply `fn` only to text outside fenced and inline code. */
export function mapOutsideCode(markdown: string, fn: (text: string) => string): string {
  return splitCode(markdown)
    .map((segment) => (segment.code ? segment.text : fn(segment.text)))
    .join('');
}

// ---------------------------------------------------------------------------
// Media embeds
// ---------------------------------------------------------------------------

const escapeAttr = (value: string) => value.replace(/"/g, '&quot;');

function embedProse(text: string): string {
  return (
    text
      // Embed YouTube videos
      .replace(
        /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^)]*\)/g,
        (_, alt, id) =>
          `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%"><iframe src="https://www.youtube.com/embed/${id}" title="${escapeAttr(alt)}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`,
      )
      // Embed X/Twitter posts
      .replace(
        /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)[^)]*\)/g,
        (_, _alt, screenName, tweetId) =>
          `<blockquote class="twitter-tweet" data-media-max-width="560"><a href="https://twitter.com/${screenName}/status/${tweetId}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`,
      )
      // Embed Instagram posts/reels
      .replace(
        /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)[^)]*\)/g,
        (_, _alt, type, shortcode) =>
          `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/${type}/${shortcode}/" style="background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:1px;max-width:540px;min-width:326px;padding:0;width:calc(100% - 2px)"></blockquote><script async src="//www.instagram.com/embed.js"></script>`,
      )
      // Embed GitHub Gists
      .replace(
        /!\[([^\]]*)\]\s*\(https?:\/\/gist\.github\.com\/(\w+)\/([a-f0-9]+)[^)]*\)/g,
        (_, _alt, user, gistId) => `<script src="https://gist.github.com/${user}/${gistId}.js"></script>`,
      )
      // Embed CodePen pens
      .replace(
        /!\[([^\]]*)\]\s*\(https?:\/\/(?:www\.)?codepen\.io\/(\w+)\/pen\/([a-zA-Z0-9_-]+)[^)]*\)/g,
        (_, alt, user, slug) =>
          `<iframe height="450" style="width:100%;" scrolling="no" title="${escapeAttr(alt)}" src="https://codepen.io/${user}/embed/${slug}?default-tab=html%2Cresult" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>`,
      )
  );
}

/**
 * Turn `![alt](url)` for YouTube, X/Twitter, Instagram, Gists and CodePen into
 * embeds. Code blocks and inline code are left untouched so posts can show
 * the syntax itself.
 */
export function embedMedia(markdown: string): string {
  return mapOutsideCode(markdown, embedProse);
}

// ---------------------------------------------------------------------------
// Auto description
// ---------------------------------------------------------------------------

export const DESCRIPTION_MAX = 180;

/** Markdown/HTML → plain text (for meta descriptions and cards). */
export function stripMarkdown(markdown: string): string {
  return (
    markdown
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
      .replace(/<img\b[^>]*>/gi, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url)
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1') // [text][ref]
      .replace(/<(https?:\/\/[^>\s]+)>/g, '$1') // <https://autolink>
      .replace(/<\/?[a-zA-Z][^>]*>/g, ' ') // HTML tags
      .replace(/(?<!`)(`+)(?!`)([\s\S]*?)(?<!`)\1(?!`)/g, '$2') // inline code → text
      .replace(/^ {0,3}(?:>\s?)+/gm, '') // blockquotes
      .replace(/^ {0,3}(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, '') // list items / task boxes
      .replace(/^ {0,3}#{1,6}\s+/gm, '') // ATX headings
      .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2') // bold
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '$1') // strikethrough
      .replace(/\*(?=\S)([^*]*?\S)\*/g, '$1') // *italic*
      .replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?!\w)/g, '$1$2') // _italic_ (not snake_case)
      .replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, '$1') // backslash escapes
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Cut at a word boundary and add an ellipsis when longer than `max`. */
export function truncateWords(text: string, max = DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const head = space >= max * 0.6 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.\-–—]+$/, '')}…`;
}

/**
 * First prose paragraph of the body as plain text, truncated for SEO / cards.
 * Skips code blocks, headings, images-only blocks, tables, and rules.
 */
export function autoDescription(body: string): string {
  const prose = splitCode(body)
    .map((segment) => (segment.code && /^ {0,3}(`{3,}|~{3,})/.test(segment.text) ? '\n\n' : segment.text))
    .join('');
  for (const block of prose.split(/\n\s*\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue; // heading
    if (/^(?:[-*_]\s*){3,}$/.test(trimmed)) continue; // thematic break
    if (/^\|.*\|$/m.test(trimmed) && /^\|?\s*:?-{3,}/m.test(trimmed)) continue; // table
    const text = stripMarkdown(trimmed);
    if (!text) continue; // e.g. image-only block
    return truncateWords(text);
  }
  return '';
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

/** `[a, "b", 'c']` → ['a', 'b', 'c'] (commas inside quotes are kept). */
function parseFlowList(value: string): string[] {
  const inner = value.trim().slice(1, -1);
  const items: string[] = [];
  let current = '';
  let quote = '';
  for (const char of inner) {
    if (quote) {
      if (char === quote) quote = '';
      current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === ',') {
      items.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  items.push(current);
  return items.map(unquote).filter(Boolean);
}

/**
 * Minimal YAML frontmatter at the top of an issue body (`--- … ---`).
 * Supports `key: value` (optionally quoted), lists (`- item` lines or
 * `[a, b]` flow form; joined with ", "), and block scalars (`|` keeps line
 * breaks, `>` folds them). Unknown syntax is ignored rather than failing.
 */
export function parseFrontmatter(rawBody: string): { frontmatter: Record<string, string>; content: string } {
  const match = rawBody.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: rawBody.trim() };
  }

  const frontmatter: Record<string, string> = {};
  const lines = match[1].split(/\r?\n/);
  let listKey = '';
  let list: string[] = [];
  const flushList = () => {
    if (listKey && list.length) frontmatter[listKey] = list.join(', ');
    listKey = '';
    list = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const item = trimmed.match(/^-\s+(.*)$/);
    if (item && listKey) {
      const value = unquote(item[1]);
      if (value) list.push(value);
      continue;
    }

    const pair = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    flushList();
    const key = pair[1];
    const value = pair[2].trim();

    const block = value.match(/^([|>])[+-]?$/);
    if (block) {
      const collected: string[] = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || !lines[i + 1].trim())) {
        collected.push(lines[++i].trim());
      }
      const text =
        block[1] === '|'
          ? collected.join('\n').trim()
          : collected
              .join('\n')
              .trim()
              .split(/\n\s*\n/)
              .map((para) => para.replace(/\n/g, ' '))
              .join('\n');
      if (text) frontmatter[key] = text;
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const items = parseFlowList(value);
      if (items.length) frontmatter[key] = items.join(', ');
      continue;
    }

    if (value) {
      frontmatter[key] = unquote(value);
    } else {
      listKey = key; // `key:` followed by `- item` lines
    }
  }
  flushList();

  return { frontmatter, content: match[2].trimStart() };
}
