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
> title: "My Post Title"
> date: "2026-07-10"
> description: "Short summary for SEO."
> slug: my-custom-url-slug   # optional - stable if the title changes
> series: "My Series Name"   # optional - groups posts for prev/next + series list (by date)
> image: https://...         # optional
> author: Name               # optional - automatic from the GitHub issue user
> authorUrl: https://...
> authorAvatar: https://...
> navigation: header         # or footer - show a link to the page in the navigation
> navigationIndex: 1         # show the link in a specific order after Posts; use a negative index to show before Posts
> tags: tech, dev
> ---
> ```
>
> Author info, avatar and profile link come from the GitHub user who created the issue.
>
> Then apply one of these labels:
>
> - `status: draft` — not published (default)
> - `status: unlisted` — published at its direct URL (e.g. `/about/`) but hidden from the list of posts
> - `status: published` — fully live and appears in sidebar / posts list
>
> Edit the issue + re-apply the status label to update the site.

<!-- Write your post content below this line. The frontmatter block above is optional. -->

# My New Post

Start writing here...
