---
name: Blog post
about: Create a new blog post using GitHub Issues as CMS
title: ' '
labels: ['status: draft']
assignees: ''
---

> **How publishing works**
>
> - Write your post in this issue body (Markdown supported).
> - Drag & drop images directly here — GitHub hosts them and the URLs work on the live site.
> - Add a YAML frontmatter block at the very top (optional but recommended):
>
> ```yaml
> ---
> title: My Post Title
> date: 2026-07-10
> description: Short summary.
> slug: my-custom-url-slug   # optional
> image: https://...         # optional
> author: Name               # auto from GitHub issue user
> authorUrl: https://...
> authorAvatar: https://...
> tags: tech, dev            # or use `tag: tech` labels
> ---
> ```
>
> Author info, avatar and profile link come from the GitHub user who created the issue. Labels starting with `tag: ` become tags.
>
> Then apply one of these labels:
>
> - `status: draft` — not published (default)
> - `status: unlisted` — published at its direct URL (e.g. `/my-post/`) but hidden from the list
> - `status: published` — fully live and appears in sidebar / posts list
>
> Edit the issue + re-apply the status label to update the site.

<!-- Write your post content below this line. The frontmatter block above is optional. -->

# My New Post

Start writing here...
