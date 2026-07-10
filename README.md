# cmless

**A clean, instant blog template.**  
Use **GitHub Issues as your CMS** + **Astro** + **GitHub Pages**.

No database. No admin UI. No commits for content.  
Just create/edit issues, apply labels, and your site rebuilds automatically.

## ✨ Features

- Post title = GitHub Issue title
- Post content = Issue body (full Markdown + drag-and-drop images)
- Images uploaded in GitHub issues work automatically (hosted by GitHub)
- Three publishing states via labels:
  - `status: draft` — not published
  - `status: unlisted` — published at its direct URL (e.g. `/my-post/`) but hidden from the post list
  - `status: published` — fully visible + listed at the root of the site (e.g. `/my-post/`)
- Rebuilds on issue open / edit / label changes
- Fully works with the `gh` CLI
- Clean professional default theme
- Zero sample posts (starts empty)

## 🚀 Get Started (New Blog)

1. Click **"Use this template"** → **"Create a new repository"** on GitHub.
2. Name it something like `username.github.io` (for user site) or any name.
3. After creation, go to **Settings → Pages** and set:
   - Source: **GitHub Actions**
4. (Optional but recommended) Create the labels:

   ```sh
   gh label create "status: draft" --color "d73a4a" --description "Not published"
   gh label create "status: unlisted" --color "5319e7" --description "Published but hidden from list"
   gh label create "status: published" --color "0e8a16" --description "Published and listed"
   ```

5. Push or create an issue to trigger the first build.
6. Your site will be live at `https://<your-username>.github.io` (or the project URL). Posts appear at `/<slug>/` (e.g. `/hello-world/`).

## ✍️ Writing Posts

### Using the GitHub website

1. Go to **Issues** → **New issue**
2. Use the **"Blog post"** template (or start fresh)
3. Title = post title
4. Body = your Markdown content
   - Paste or drag images directly into the editor
5. Save as draft or immediately apply a label:
   - `status: published`
   - `status: unlisted`
6. The site rebuilds within ~1 minute.

### Using the gh CLI (fastest for writers)

```sh
# Create a draft
gh issue create --title "My First Post" --body "$(cat <<'EOF'
---
title: My First Post
date: 2026-07-10
description: A short summary appears in the list.
---
# Hello World

This is the post body. Supports **Markdown** and images.

![Alt text](https://user-images.githubusercontent.com/.../image.png)
EOF
)"

# Publish it
gh issue edit 42 --add-label "status: published"

# Make it unlisted instead
gh issue edit 42 --add-label "status: unlisted" --remove-label "status: published"

# Update content (triggers rebuild)
gh issue edit 42 --body "$(cat <<'EOP'
---
title: Updated Title
description: New summary.
---
New body here...
EOP
)"
```

Editing the issue body + re-applying the status label always updates the site.

## 🏷️ Label Reference

| Label                | Visible in list? | Accessible by URL? | Notes                     |
|----------------------|------------------|--------------------|---------------------------|
| `status: draft`      | No               | No                 | Default / work in progress |
| `status: unlisted`   | No               | Yes                | Good for private share links (e.g. `/my-post/`) |
| `status: published`  | Yes              | Yes                | Listed + accessible at `/<slug>/` |

Only issues with `status: unlisted` **or** `status: published` become pages at `/<slug>/` (under your site's base path).

## 🛠️ Local Development

```sh
# 1. Clone your repo
git clone https://github.com/you/your-blog.git
cd your-blog

# 2. Install
bun install

# 3. (Optional) Generate posts locally
GH_TOKEN=your_pat_here bun run generate-posts

# 4. Start dev server (auto-generates if token present)
bun dev
```

The dev server will show published posts.

## ⚙️ Configuration

### Site URL

The site and base path are **automatically detected** from your repository:

- If your repo is named `yourname.github.io` → served at the root (`https://yourname.github.io`)
- Otherwise (project site) → served under `/your-repo-name` (`https://yourname.github.io/your-repo-name/`)

This works both in GitHub Actions and locally (it reads your git remote).

You normally don't need to touch `site` or `base` in `astro.config.mjs`.

(Advanced: you can still override by setting the `GITHUB_REPOSITORY` env var or editing the detection logic.)

### Changing the blog title

In `src/layouts/Layout.astro`, change the default `siteTitle`.

Or pass it from pages.

## 🔄 How It Works

- `.github/workflows/deploy.yml` runs on pushes and issue events.
- `scripts/generate-posts.ts` uses the `gh` CLI to fetch labeled issues.
- It writes fresh Markdown files into `src/content/blog/`.
- Astro builds a static site.
- GitHub Pages serves the `dist/` folder.

Nothing is committed for individual posts — they are generated at build time.

## 📝 Tips

- Post URLs are at the root of your site: `https://.../<slug>/` (no `/posts/` prefix).
- Put a `slug:` in frontmatter if you ever rename an issue title and want to keep the old URL.
- Close issues whenever you want — labels still work.
- You can have hundreds of issues; only the ones with status labels become posts.
- Want a different domain? Add a `CNAME` file in `public/` and configure DNS.

## 📄 License

MIT — use it for anything.

---

Made for people who want to write in GitHub Issues and have a fast, reliable blog.

