# cmless

**A clean, instant blog template.**  
Use **GitHub Issues as your CMS** + **Astro** + **GitHub Pages**.

No database. No admin UI. No commits for content.  
Just create or edit issues, apply labels, and your site rebuilds automatically.

## ✨ Features

- Post title and full Markdown body (with images) come directly from GitHub Issues
- Drag-and-drop images in issues are hosted by GitHub automatically
- Three publishing states via labels
- Rebuilds on any issue edit or label change
- Excellent `gh` CLI support
- Clean professional theme; zero sample posts

## 🚀 Get Started

1. Click **"Use this template"** → create a new repository (name it `user.github.io` for a root site, or anything else).
2. In repo **Settings → Pages**, set Source to **GitHub Actions**.
3. Create or edit an issue to trigger the first build.
4. Your site will be live at `https://<user>.github.io` (or `.../repo-name/` for project sites).

Labels are provided by the "Blog post" issue template. If needed, create them with:

```sh
gh label create "status: draft"    --color "d73a4a" --description "Not published"
gh label create "status: unlisted" --color "5319e7" --description "Published but hidden from list"
gh label create "status: published" --color "0e8a16" --description "Published and listed"
```

## 🏷️ Publishing States

| Label                | Listed on homepage? | Reachable by direct URL? | Best for                     |
|----------------------|---------------------|--------------------------|------------------------------|
| `status: draft`      | No                  | No                       | Work in progress             |
| `status: unlisted`   | No                  | Yes                      | Private links / previews     |
| `status: published`  | Yes                 | Yes                      | Public posts                 |

Only `unlisted` and `published` issues generate pages at `/<slug>/`. Close issues freely; the labels control everything.

## ✍️ Writing Posts

### On GitHub

1. **Issues → New issue**.
2. Choose the **"Blog post"** template (recommended) or start blank.
3. Title = post title. Body = Markdown (drag images straight in).
4. Apply `status: published` (or `unlisted`).
5. Site updates in ~1 minute.

The template documents frontmatter options (`title`, `date`, `description`, `slug`).

### With the gh CLI

```sh
# Draft
gh issue create --title "Hello" --body '---
title: Hello
date: 2026-07-10
description: Short blurb.
---
Content here.'

# Publish it
gh issue edit 42 --add-label "status: published"

# Update content
gh issue edit 42 --body 'New markdown...'
```

Re-applying the status label (or just editing a published/unlisted issue) triggers a rebuild.

## 🛠️ Local Development

```sh
git clone https://.../your-repo.git && cd your-repo
npm install
GH_TOKEN=... npm run generate-posts   # optional
npm run dev
```

## ⚙️ Configuration

**URLs** are auto-detected:
- `name.github.io` repo → `https://name.github.io/`
- Everything else → `https://name.github.io/name/`

No need to change `astro.config.mjs` in most cases.

**Site title** is taken from the GitHub repository description. Edit the description on your repo to change it.

**Custom domain:** Place a `CNAME` file in `public/` and set up DNS.

## 📝 Tips

- Use `slug: my-custom-slug` in frontmatter to keep a stable URL when you rename an issue.
- Hundreds of issues are fine — only labeled ones become posts.
- Post paths are flat: `https://.../my-post/` (no `/posts/` segment).

## 🔄 How It Works

A GitHub Actions workflow runs `scripts/generate-posts.ts` (via `gh`) on issue events and pushes. It turns qualifying issues into Markdown files in `src/content/blog/`. Astro builds a static site that GitHub Pages serves. Nothing about individual posts is stored in the repository.

## ⬆️ Syncing updates from cmless

Template clones start with unrelated history.

```sh
# once
git remote add cmless https://github.com/vdsabev/cmless.git
git fetch cmless
git merge cmless/master --allow-unrelated-histories

# thereafter
git fetch cmless && git merge cmless/master
```

For conflicts on engine files: `git checkout --theirs <file>`. Check branch via `git branch -r` (`master` today).

### Custom README

Replace cmless's template-oriented README in your blog repo. Protect it from merges:

```text
README.md merge=ours
```

(in `.gitattributes`)

## 📄 License

MIT — use it for anything.

---

Made for people who want to write in GitHub Issues and have a fast, reliable blog.
