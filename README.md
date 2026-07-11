# cmless - seamless GitHub blog
- Use GitHub issues to write posts
- Drag-and-drop or paste an image in the issue body to upload it to GitHub
- Blog automatically rebuilds when an issue is created or updated
- Manually manage post publishing by applying labels: `state: draft`, `state: unlisted`, `state: published`
- Set metadata via Frontmatter

## 🚀 Get Started
1. Click **"Use this template"** → create a new repository
2. Naming the repo `<your-username>.github.io` hosts it at `https://<your-username>.github.io`, naming it `<your-repo>` hosts it at `https://<your-username>.github.io/<your-repo>`
3. In repo **Settings → Pages** set **Source** to **GitHub Actions**.
4. Create or edit an issue to trigger the first build.
5. **Recommended:** to prevent random people from writing posts on your blog, limit issue creation to collaborators only in **Settings → General**.

Labels are provided by the "Blog post" issue template. Or create them with the `gh` CLI:

```sh
gh label create "status: draft"    --color "d73a4a" --description "Not published"
gh label create "status: unlisted" --color "5319e7" --description "Published but hidden from list"
gh label create "status: published" --color "0e8a16" --description "Published and listed"
```

## 🏷️ Publishing States
| Label                | Listed on homepage? | Reachable by direct URL? | Best for                                 |
|----------------------|---------------------|--------------------------|------------------------------------------|
| `status: draft`      | No                  | No                       | Work in progress, only visible on GitHub |
| `status: unlisted`   | No                  | Yes                      | Private links / previews                 |
| `status: published`  | Yes                 | Yes                      | Public posts                             |

If you want, close issues when you're done with them - publishing is controlled by the labels.

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

> [!NOTE]
> You cannot upload images through the `gh` CLI.

## 🛠️ Local Development
```sh
git clone https://.../your-repo.git && cd your-repo
npm install
GH_TOKEN=... npm run generate-posts   # optional
npm run dev
```

## ⚙️ Configuration
**Site title** is taken from the GitHub repository description.

**Author / avatar / profile:** auto from the GitHub issue author (or override with `author`, `authorUrl`, `authorAvatar`).

**Tags:** from `tag: foo` labels or `tags: a, b` frontmatter.

**Custom domain:** Place a `CNAME` file in `public/` and set up DNS.

## 🔄 How It Works
A GitHub Actions workflow runs `scripts/generate-posts.ts` (via `gh`) on issue events and pushes. It turns qualifying issues into Markdown files in `src/content/blog/`. Astro builds a static site that GitHub Pages serves. Nothing about individual posts is stored in the repository.

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
