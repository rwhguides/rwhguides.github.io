# RWH Clinical Guidelines

A personal hub of independent, interactive, step-by-step companion tools that
turn Royal Women's Hospital clinical guidelines into point-of-care decision
support, published as a static site via GitHub Pages.

## Structure

```
/                       homepage (lists every tool)
  index.html
  styles.css            homepage-only layout (tool grid/cards)
  tools-manifest.js      the list of tools shown on the homepage
  home.js               renders tools-manifest.js into the homepage grid

assets/
  shared.css            shared design system used by the homepage and
                         every tool (colours, header, cards, option buttons,
                         checkboxes, banners, action panels, badges, etc.)

miscarriage-management/        RWH "Miscarriage: Management" guideline
pain-bleeding-early-pregnancy/  RWH "Pain and Bleeding in Early Pregnancy" guideline
ectopic-pregnancy-management/   RWH "Ectopic Pregnancy Management" guideline
rhd-immunoglobulin/             RWH "RhD Immunoglobulin (Anti D) Use in Maternity" guideline
  index.html
  app.js

_template/               starting point for building the next tool
  index.html
  styles.css
  app.js
  README.md              step-by-step guide to building a new tool
```

Each tool is a self-contained folder with its own `index.html` and `app.js`,
sharing only `assets/shared.css` for a consistent look. A tool can be deleted
or moved without affecting any other tool.

## Adding a new tool

For the full project context, history, conventions and build process (written
so it can be handed to Claude), see [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).

See [`_template/README.md`](_template/README.md) for the full walkthrough.
Short version: copy `_template/` to a new folder, build out its guideline
logic in `app.js`, then add an entry to `tools-manifest.js` so it shows up on
the homepage.

## Local testing

From the repo root:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000/` for the homepage, or
`http://localhost:8000/miscarriage-management/` for a specific tool.

(The homepage reads `tools-manifest.js` as a plain script, not via `fetch`,
so it also works if you just open `index.html` directly in a browser —
no server required for the homepage itself. A local server is still the
most reliable way to test everything together.)

## Deploying to GitHub Pages

Live site: **https://rwhguides.github.io/** (repo `rwhguides/rwhguides.github.io`,
served from the `main` branch, root folder).

To publish changes: commit and `git push`. Pages redeploys in a minute or two.

Source guideline PDFs are deliberately **not** in the repo (`*.pdf` is
gitignored; they are RWH copyright). Keep them locally, e.g. in `guidelines/`.

All asset references are relative, so this works regardless of the repo name
or whether it's served from a root domain or a `/repo-name/` subpath.

## Disclaimer

These are unofficial, independently built companion resources and are **not
endorsed by or affiliated with The Royal Women's Hospital**. Each tool must
be validated against its current source guideline before clinical use, and
re-checked whenever the source guideline is updated.
