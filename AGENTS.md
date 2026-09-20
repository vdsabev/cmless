This blog is built from GitHub issues: each issue is a post, and a GitHub Actions workflow turns issues into a static site. Full docs live in [README.md](README.md):

- [Writing Posts](README.md#️-writing-posts) - issues become posts; title, body, labels
- [Using the gh CLI](README.md#with-the-gh-cli) - uploading images without the web interface
- [Publishing States](README.md#️-publishing-states) - `status: draft` / `status: unlisted` / `status: published`
- [Frontmatter Options](README.md#️-configuration) - series, tags, navigation pages, author overrides
- [How It Works](README.md#️-how-it-works) - how site generation works, including attachment handling

Conventions:

- Run `npm run dev` for local development; posts live as issues, not in the repo.
- Never edit files in `src/generated/` - they are produced by `scripts/generate.ts`.
- `npm test` runs the unit tests under `scripts/`.
