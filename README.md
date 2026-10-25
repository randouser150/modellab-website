# Modellab website

Static website for Modellab, the computational chemistry group of Assoc. Prof. Abdulkadir Koçak in the Department of Chemistry, Gebze Technical University.

Plain HTML and CSS with no build step. A little JavaScript draws the 3D protein on the home page and renders Markdown tutorials.

## Pages

| File | Content |
| --- | --- |
| `index.html` | Home: About, Members, Research & publications, Contact |
| `publications.html` | Full publication list with search and topic filter (from Google Scholar, October 2026) |
| `software.html` | Open-source tools that accompany the papers |
| `tutorials.html` | List of tutorials |
| `tutorial.html` | Shows one tutorial, rendered from a Markdown file in `tutorials/` |
| `tutorials/*.md` | Tutorial texts, written in Markdown |
| `css/tokens.css` | Colours, fonts and spacing (change the look here) |
| `css/site.css` | Layout and components |
| `assets/people/` | Member portraits (crop to roughly 4:5, max ~800 px) |
| `assets/figures/` | Figures from the lab’s open-access papers (CC BY 4.0) |

## Preview locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Common edits

- **Add a member:** copy one `<li class="member">…</li>` block into the right group in `index.html` (PhD, MSc or undergraduate students), then change the photo, name and role. Update the small count next to the group title.
- **Graduates and former members:** in the *Graduated* and *Former lab members* tables, copy the example row from the HTML comment once per person and delete the “To be added” row.
- **PI portrait:** put a photo at `assets/people/kocak.jpg` and replace the `AK` initials in `index.html` with `<img src="assets/people/kocak.jpg" alt="Abdulkadir Koçak">`.
- **Add a publication:** copy one `<li class="pub">…</li>` block to the top of the list in `publications.html`, set `data-year`, link the title to `https://doi.org/<DOI>`, and set `data-topics` to one or more of `ml free model mof spec` (these drive the topic filter). Update the three selected papers on the home page if needed.
- **Add software:** copy one `<li class="tool-entry">…</li>` block in `software.html`. Use `tool-entry tool-entry--plain` when there is no figure.
- **Research figures:** the four focus areas on the home page show figures from the lab’s open-access papers. They are CC BY 4.0, so each caption must keep the credit and the licence link. To change one, put the new image in `assets/figures/` and update the `<img>` and caption in the matching `<article class="focus-card">`. Figures from paywalled papers need the publisher’s permission (authors usually get it for their own site).

## Writing tutorials in Markdown

Tutorials are plain Markdown files, so nobody needs to touch HTML to write one. `tutorial.html` reads the file and turns it into a page in the browser, with a contents list built from the `##` headings and a Copy button on every code block.

1. Create a file in `tutorials/`, for example `tutorials/amber-free-energy.md`. Use lowercase letters, digits and hyphens in the file name.
2. Start it with a short header between `---` lines:

   ~~~markdown
   ---
   title: Free energy calculation
   tool: Amber
   level: Intermediate
   time: About 3 hours
   updated: November 2026
   ---

   Intro paragraph…

   ## 1. First step

   ```bash
   tleap -f leap.in
   ```
   ~~~

   Only `title` is required. Every `##` heading appears in the “On this page” list.
3. Add it to `tutorials.html`: copy the GROMACS `<li class="tutorial">…</li>` block and point the link at `tutorial.html?t=amber-free-energy`, the file name without `.md`.
4. Preview it with `python3 -m http.server 8000`. Opening the HTML file directly (`file://`) won’t work, because the browser blocks reading the `.md` file that way.

Everything standard in Markdown works: headings, lists, links, **bold**, `inline code`, fenced code blocks, tables, `> notes` and images (put them in `tutorials/img/` and write `![caption](tutorials/img/figure.png)`).

`tutorials/gromacs-protein-simulation.md` is a complete example to copy from.

## Publish with GitHub Pages

> **Preview mode.** Right now every page has `<meta name="robots" content="noindex, nofollow">` and `robots.txt` blocks all crawlers, so the preview at `randouser150.github.io/modellab-website` stays out of search engines. **Before the real launch, delete that meta line from each HTML file and delete `robots.txt`.**


Settings → Pages → Source: *Deploy from a branch* → `main` / root. To use `modellab.org`, add a `CNAME` file containing `modellab.org` and point the domain's DNS at GitHub Pages.
