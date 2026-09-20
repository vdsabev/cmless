# cmless
Seamless blogging with GitHub issues.

- Open GitHub issues in your repo to write posts
- Drag-and-drop or paste images in the issue to upload them to GitHub (copied into the site at build time)
- Blog post automatically rebuilds when its issue is created or updated
- Manually manage post publishing by applying labels: `status: draft`, `status: unlisted`, `status: published`
- Set metadata via Frontmatter
- Add a link to a page in the header or footer
- Full-text client-side search (Pagefind) — titles, content, tags, and descriptions

## 🚀 Get Started
1. Click **"Use this template"** → create a new repository
2. Naming the repo `<your-username>.github.io` hosts it at `https://<your-username>.github.io`, naming it `<your-repo>` hosts it at `https://<your-username>.github.io/<your-repo>`
3. In repo **Settings → Pages** set **Source** to **GitHub Actions**.
4. Create or edit an issue to trigger the first build.

The labels are provided by the "Blog post" issue template. Or create them with the `gh` CLI:

```sh
gh label create "status: draft"    --color "d73a4a" --description "Not published"
gh label create "status: unlisted" --color "5319e7" --description "Published but hidden from list"
gh label create "status: published" --color "0e8a16" --description "Published and listed"
```

## 🏷️ Publishing States
| Label                | Listed on homepage? | Reachable by direct URL? | Best for                                 |
|----------------------|---------------------|--------------------------|------------------------------------------|
| `status: draft`      | No                  | No                       | Work in progress, only visible on GitHub |
| `status: unlisted`   | No                  | Yes                      | Private links / previews / pages         |
| `status: published`  | Yes                 | Yes                      | Public posts                             |

> [!NOTE]
> Publishing is only controlled by the status labels which are limited to contributors by default, but if you want to prevent random people from opening issues in your blog repo - limit issue creation to collaborators only in **Settings → General**.

> [!TIP]
> When you're done writing and editing a post you can close its respective issue.

## ✍️ Writing Posts
### On GitHub
1. **Issues → New issue**.
2. Choose the **"Blog post"** template or start blank.
3. Title = post title. Body = Markdown (drag and drop images straight in, or link external images by URL).
4. Apply `status: published` (or `unlisted`).
5. Site updates in ~1 minute.

The template documents Frontmatter options.

### With the gh CLI
```sh
# Draft
gh issue create --title "Hello" --body '---
title: Hello
date: 2026-07-10
description: Short blurb.
author: Name
tags: tech
---
Content here.'

# Publish it
gh issue edit 42 --add-label "status: published"

# Update content
gh issue edit 42 --body 'New markdown...'
```

Re-applying the status label (or just editing a published/unlisted issue) triggers a rebuild.

> [!TIP]
> Since `gh` v2.99.0 you can attach images and videos with `--attach`, with no need to upload them via the web interface. The flag can be repeated for multiple files, and alt text goes after a hash: `gh issue create --attach './shot.png#A red error dialog'`. If the body already references the file (`![alt](./shot.png)`), that link is rewritten to the uploaded asset; otherwise the attachment is appended.

## 🛠️ Local Development
```sh
git clone https://.../your-repo.git
cd your-repo
npm install # or bun, etc.
npm run dev # run the current folder's repo as a blog
GH_REPO=<username>/<repo> npm run dev # run another cmless-based repo as a blog
```

## 🔍 Search
[Pagefind](https://pagefind.app/) indexes published posts and navigation pages (title, description, tags, body). Build writes the index into `dist/pagefind/` and copies it to gitignored `public/pagefind/` so `dev` can serve it; re-run `build` (or `pagefind` if `dist/` is current) after content changes. Assets and result links follow Astro’s `base` for project-site subpaths.

## ⚙️ Configuration
**Site title and description** come from the GitHub repository description. Optionally split one field into both with a separator:

| Repository description | Title | Description |
|------------------------|-------|-------------|
| `Vlad Sabev \| Essays on software` | Vlad Sabev | Essays on software |
| `cmless - use GitHub as a blog` | cmless | use GitHub as a blog |
| `Vlad Sabev – Essays on software` | Vlad Sabev | Essays on software |
| `Vlad Sabev — Essays on software` | Vlad Sabev | Essays on software |
| `Vlad Sabev: Essays on software` | Vlad Sabev | Essays on software |
| `My Blog` | My Blog | *(empty)* |

Supported separators (first match wins): pipe (`|`) with spaces on both sides; hyphen (`-`), en dash (`–`), or em dash (`—`) with spaces on both sides; colon (`:`) with a space after (optional space before). Without a separator, the whole string is the title. The description feeds homepage meta tags, RSS channel text, `llms.txt`, `llms-full.txt`, and `index.md`.

**Author / avatar / profile:** auto from the GitHub issue author (or override with `author`, `authorUrl`, `authorAvatar`). GitHub profile photos are downloaded into `public/media/avatars/` at generate time. If a download fails, the site falls back to `avatars.githubusercontent.com/u/<id>` (stable user id) instead of `github.com/<login>.png`.

**Footer social links:** from the repository owner’s GitHub profile — website (`blog` field) plus [social accounts](https://docs.github.com/en/rest/users/social-accounts) (X/Twitter, Mastodon, Bluesky, LinkedIn, etc.).

**Series:** from `series: My Series Name` Frontmatter. Posts that share the same series name get previous/next navigation and a list of posts in the series, ordered by date (oldest first).

**Tags:** from `tags: a, b` Frontmatter.

**Navigation pages:** useful for custom pages like "About me". Add `navigation: Label` and `navigationIndex: N` to an issue's Frontmatter. Negative indices place the link before "Posts" in the header, non-negative after. Footer links are sorted by index and appear before "powered by". These pages render as plain prose without blog metadata. Leading body images stay in the page content (unlike blog posts, where the first image is promoted to a cover and removed from the body); they may still set Open Graph `image` when frontmatter omits it.

**Custom domain:** Place a `CNAME` file in `public/` and set up DNS.

## 🔄 How It Works
A GitHub Actions workflow runs `scripts/generate.ts` (via `gh`) on issue events and pushes. Draft issue edits and non-status label changes skip the build (they cannot change the live site). It turns qualifying issues into Markdown files in `src/content/blog/`. GitHub issue attachments (`github.com/user-attachments/assets/…` and `user-images.githubusercontent.com`) are downloaded into `public/media/` and rewritten to site-relative URLs — those attachment URLs 302 to a 5-minute S3 signature and are not safe to hotlink. Author and site-owner GitHub avatars are downloaded into `public/media/avatars/` the same way (those `github.com/<login>.png` shortcuts are an uncached 302 and can land on short-lived private-avatar JWTs). Attachment downloads are incremental: a file is skipped if that attachment id is already on disk; CI restores `public/media/` with Actions cache. Astro builds a static site that GitHub Pages serves. Nothing about individual posts is stored in the repository.

## ⬆️ Syncing updates from cmless
Template clones have their own history. To sync:

```sh
# first time
git remote add cmless https://github.com/vdsabev/cmless.git
git fetch cmless && git merge cmless/master --allow-unrelated-histories

# thereafter
git fetch cmless && git merge cmless/master
```

For conflicts on engine files: `git checkout --theirs <file>`.

### Custom README
You can replace cmless's template-oriented README in your own blog repo. To protect it from merges, add this to `.gitattributes`:

```text
README.md merge=ours
```

## 📄 License
MIT — use it for anything.

---

Made for people who want to write in GitHub Issues and have a fast, reliable blog.
