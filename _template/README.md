# Tool template

Starting point for a new RWH guideline companion tool, following the same
pattern as `miscarriage-management/`.

## Steps

1. **Copy this folder.** Duplicate `_template/` to a new folder at the repo
   root, named after your tool in kebab-case — this becomes the URL path
   (e.g. `postpartum-haemorrhage/`).

2. **Add your source guideline PDF** to the new folder as `guideline.pdf`
   (used as your own reference while building — it isn't linked from the UI,
   since external/uploaded PDF links tend to rot; cite the guideline by name
   and version in text instead, as the existing tools do).

3. **Update `index.html`:**
   - `<title>` and meta description
   - Header `<h1>` and subtitle (guideline name, doc number, version, review date)
   - Footer citation (guideline title, RWH doc number, version, last updated,
     document owner, section/department)

4. **Build your decision tree in `app.js`:**
   - Set `PHASES` to the breadcrumb steps of your flow (4–6 short labels).
   - Write one `screenXxx()` function per step, using the provided helpers:
     - `screenShell(phaseIndex, title, subtitle)` — sets the screen heading
     - `optionList([{ label, hint, onClick, danger }])` — tappable choice buttons
     - `banner(kind, title, items)` — informational panel (kind: `info` | `ok` | `warn` | `bad`)
     - `actionPanel(kind, title, items)` — same panel style, but with real
       tickable checkboxes, for actionable checklists (preconditions, regimens,
       follow-up steps)
     - `actionsRow([{ label, primary, onClick }])` — Continue/Start-style buttons
     - `go("screenId")` / `back()` / `restart()` — navigation
   - Register each screen in the `switch` inside `render()`.
   - Delete the example `screenIntro` / `screenExampleQuestion` /
     `screenExampleResult` once your real flow is in place (or just keep
     building on top of `screenIntro`).

5. **Register the tool on the homepage.** Add an entry to `tools-manifest.js`
   at the repo root (there's a commented-out example in that file showing the
   shape). Set `status` to `"live"` once it's ready, or `"planned"`/`"draft"`
   to show it on the homepage ahead of time as not-yet-available.

6. **Test locally.** From the repo root:
   ```
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000/your-tool-slug/`, and
   `http://localhost:8000/` to confirm it appears correctly on the homepage.

7. **Styling.** You shouldn't need to touch CSS at all — `../assets/shared.css`
   already covers every component used by the step-wizard pattern (header,
   cards, option buttons, checkboxes, number inputs, banners, action panels,
   modality-style result cards, badges, breadcrumb). Only add to this folder's
   own `styles.css` for something genuinely specific to your tool. If you
   improve something in `assets/shared.css`, every tool in the repo picks it
   up automatically.
