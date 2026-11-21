import { describe, expect, test } from 'bun:test';
import {
  autoDescription,
  DESCRIPTION_MAX,
  embedMedia,
  parseFrontmatter,
  splitCode,
  stripMarkdown,
  truncateWords,
} from './markdown';

const YT = '![Demo](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';

describe('embedMedia', () => {
  test('embeds media in prose', () => {
    const out = embedMedia(`Intro\n\n${YT}\n`);
    expect(out).toContain('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
    expect(out).toContain('title="Demo"');
  });

  test('leaves fenced code blocks untouched', () => {
    for (const fence of ['```', '~~~', '````']) {
      const md = `Use this syntax:\n\n${fence}md\n${YT}\n${fence}\n\nAfter.\n`;
      expect(embedMedia(md)).toBe(md);
    }
  });

  test('leaves inline code untouched', () => {
    const md = `Write \`${YT}\` to embed a video.`;
    expect(embedMedia(md)).toBe(md);
  });

  test('embeds outside code but not inside on the same page', () => {
    const md = `\`\`\`\n${YT}\n\`\`\`\n\n${YT}\n`;
    const out = embedMedia(md);
    expect(out.startsWith(`\`\`\`\n${YT}\n\`\`\``)).toBe(true);
    expect(out.match(/<iframe/g)).toHaveLength(1);
  });

  test('a shorter closing fence does not end a longer one', () => {
    const md = `\`\`\`\`\n\`\`\`\n${YT}\n\`\`\`\n\`\`\`\`\n`;
    expect(embedMedia(md)).toBe(md);
  });

  test('an unclosed fence protects the rest of the post', () => {
    const md = `\`\`\`\n${YT}\n`;
    expect(embedMedia(md)).toBe(md);
  });

  test('escapes quotes in titles', () => {
    expect(embedMedia('![say "hi"](https://youtu.be/dQw4w9WgXcQ)')).toContain('title="say &quot;hi&quot;"');
  });

  test('other providers still embed', () => {
    expect(embedMedia('![](https://x.com/user/status/123)')).toContain('twitter-tweet');
    expect(embedMedia('![](https://www.instagram.com/p/abc_1/)')).toContain('instagram-media');
    expect(embedMedia('![](https://gist.github.com/user/abc123)')).toContain('gist.github.com/user/abc123.js');
    expect(embedMedia('![pen](https://codepen.io/user/pen/xyz)')).toContain('codepen.io/user/embed/xyz');
  });
});

describe('splitCode', () => {
  test('round-trips the input', () => {
    const md = 'a `b` c\n\n```js\nx\n```\nd ``e ` f`` g\n';
    expect(splitCode(md).map((s) => s.text).join('')).toBe(md);
  });
});

describe('stripMarkdown', () => {
  test('removes formatting and keeps the words', () => {
    expect(stripMarkdown('This is **bold**, *italic*, _also_ and ~~gone~~ text.')).toBe(
      'This is bold, italic, also and gone text.',
    );
    expect(stripMarkdown('See [the docs](https://example.com) and <https://a.b>.')).toBe(
      'See the docs and https://a.b.',
    );
    expect(stripMarkdown('Run `npm test` now')).toBe('Run npm test now');
    expect(stripMarkdown('Hello <strong>world</strong><br>')).toBe('Hello world');
  });

  test('keeps snake_case and lone asterisks', () => {
    expect(stripMarkdown('Set my_var_name to 2 * 3')).toBe('Set my_var_name to 2 * 3');
  });

  test('strips block markers', () => {
    expect(stripMarkdown('> quoted line')).toBe('quoted line');
    expect(stripMarkdown('- one\n- two')).toBe('one two');
    expect(stripMarkdown('1. first\n2. second')).toBe('first second');
  });
});

describe('truncateWords', () => {
  test('short text is unchanged', () => {
    expect(truncateWords('Short text.')).toBe('Short text.');
  });

  test('cuts at a word boundary with an ellipsis', () => {
    const text = 'word '.repeat(60).trim();
    const out = truncateWords(text);
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(out.endsWith('word…')).toBe(true);
  });

  test('hard-cuts a single very long word', () => {
    const out = truncateWords('x'.repeat(300));
    expect(out).toBe(`${'x'.repeat(DESCRIPTION_MAX - 1)}…`);
  });
});

describe('autoDescription', () => {
  test('uses the first prose paragraph as plain text', () => {
    expect(autoDescription('Hello **there**, see [link](https://x.y).\n\nSecond.')).toBe(
      'Hello there, see link.',
    );
  });

  test('skips images, headings, code blocks, rules and tables', () => {
    const body = [
      '![cover](https://x.y/a.png)',
      '## Intro',
      '```js\nconst a = 1;\n\nconst b = 2;\n```',
      '---',
      '| a | b |\n|---|---|\n| 1 | 2 |',
      'Actual first paragraph.',
    ].join('\n\n');
    expect(autoDescription(body)).toBe('Actual first paragraph.');
  });

  test('never exceeds the max length', () => {
    expect(autoDescription('lorem ipsum '.repeat(40)).length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  test('empty body gives empty description', () => {
    expect(autoDescription('')).toBe('');
    expect(autoDescription('![only](https://x.y/a.png)')).toBe('');
  });
});

describe('parseFrontmatter', () => {
  test('no frontmatter returns the trimmed body', () => {
    expect(parseFrontmatter('  Hello\n')).toEqual({ frontmatter: {}, content: 'Hello' });
  });

  test('plain and quoted values', () => {
    const { frontmatter, content } = parseFrontmatter(
      '---\ntitle: "Hello: World"\nslug: \'hi\'\ndate:2026-01-02\n# comment\n---\n\nBody',
    );
    expect(frontmatter).toEqual({ title: 'Hello: World', slug: 'hi', date: '2026-01-02' });
    expect(content).toBe('Body');
  });

  test('comma-separated tags stay as-is', () => {
    expect(parseFrontmatter('---\ntags: a, b\n---\n').frontmatter.tags).toBe('a, b');
  });

  test('flow lists', () => {
    expect(parseFrontmatter('---\ntags: [a, "b", \'c\']\n---\n').frontmatter.tags).toBe('a, b, c');
    expect(parseFrontmatter('---\ntags: []\n---\n').frontmatter.tags).toBeUndefined();
  });

  test('block lists, including quoted items', () => {
    const { frontmatter } = parseFrontmatter('---\ntags:\n  - one\n  - "two"\ntitle: T\n---\n');
    expect(frontmatter).toEqual({ tags: 'one, two', title: 'T' });
  });

  test('block scalars', () => {
    const literal = parseFrontmatter('---\ndescription: |\n  Line one\n  Line two\ntitle: T\n---\n');
    expect(literal.frontmatter).toEqual({ description: 'Line one\nLine two', title: 'T' });
    const folded = parseFrontmatter('---\ndescription: >-\n  Folded\n  together\n---\n');
    expect(folded.frontmatter.description).toBe('Folded together');
  });

  test('CRLF bodies from the GitHub web editor', () => {
    const { frontmatter, content } = parseFrontmatter('---\r\ntitle: Hi\r\ntags: [x, y]\r\n---\r\n\r\nBody\r\n');
    expect(frontmatter).toEqual({ title: 'Hi', tags: 'x, y' });
    expect(content.trim()).toBe('Body');
  });

  test('a body thematic break is not frontmatter', () => {
    const { frontmatter } = parseFrontmatter('Intro\n\n---\n\nMore');
    expect(frontmatter).toEqual({});
  });
});
