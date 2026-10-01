# Australian Guidelines in ObGyn: Project Context & Build Guide

> **For Claude:** This is the full context for this project. Read all of it before
> building or changing a tool. It covers what the project is, how it got here,
> what the owner wants, how the code is built, and the step-by-step process for
> turning a new guideline into a tool. If this file and the code disagree, the
> code is the source of truth. Point out the mismatch and offer to update this file.
>
> Last updated: 01/10/2026 (after tool #4, rhd-immunoglobulin)

---

## 1. What this project is

**Australian Guidelines in ObGyn** (formerly "RWH Clinical Guidelines") is a personal project by a clinician (Dr Gabriel
Jones). It turns Royal Women's Hospital (RWH, "The Women's", Melbourne)
clinical guidelines into **interactive, step-by-step, point-of-care
decision-support tools**. Each tool:

- walks a clinician through a guideline one question at a time (eligibility,
  scope, red flags, inclusion/exclusion criteria, contraindications,
  classification, patient preference), then
- shows the appropriate management options, with the guideline's own detail:
  regimens, preconditions, follow-up, checklists, safety-net advice, and links
  to the matching patient information sheets.

Everything is a **static website** (plain HTML, CSS and JavaScript, with no build step,
framework, dependencies, backend, analytics or cookies), hosted on
**GitHub Pages**. One repo holds one Pages site. The **homepage is a hub** that lists
every tool, and each tool lives in its own subfolder.

### Goals

1. **Faithful to the guideline.** Every question, threshold, regimen and
   recommendation must trace back to the source PDF. Don't invent clinical
   content, and don't "improve" on the guideline with outside knowledge.
2. **Fast and usable at the bedside** on phones, tablets and desktops. Tap
   targets should be big, wording short, and there should be one decision per screen.
3. **Safe.** Red flags and urgent pathways come first, and out-of-scope cases are
   caught and redirected. Every tool is clearly labelled as unofficial decision
   support, not a replacement for clinical judgement.
4. **Consistent across tools.** Each tool should look and behave the same way,
   so a clinician who has used one already knows how to use the next.
5. **Easy to extend.** Adding a tool means copying a template, writing the
   decision tree, and adding one manifest entry.

---

## 2. History

Built in Claude Code sessions on 30/09/2026 to 01/10/2026.

1. **First tool built:** `miscarriage-management/`, from the RWH guideline
   *Miscarriage: Management – Guideline* (RWH0193330 v4.0, last updated
   15/07/2025, owner Jane Lynch, Early Pregnancy Assessment Service (EPAS)).
   The original brief: *"a simple one page click through tool that renders on
   computers and phones, tablets, etc. It should ask step by step questions to
   assess the most appropriate management, ask inclusion/exclusion criteria,
   etc. and then display the management options."* It was tested locally
   first, before any GitHub work.
2. **Owner feedback round 1** (these are now standing rules, see §4):
   - Replace "Source guideline: guideline.pdf" with the guideline's **actual
     title and last-updated date**, with **no hyperlink** to the PDF.
   - Make **every checklist a real, tickable checkbox**.
   - Use a **pastel, ColorBrewer-style palette**.
   - For each management pathway, **link the accepted patient information
     sheet** (e.g. surgical →
     `https://www.thewomens.org.au/images/uploads/fact-sheets/Day_surgery_at_the_Women_s_260624.pdf`).
3. **Contraindications made mandatory:** add a **"None of the above"** option,
   and block Continue until something is selected.
4. **Colour scheme lightened, several times.** The owner found the first
   palette too deep and dark (especially a purple "info" colour). One fix
   changed only the header, and the owner called that out: *"You need to update
   all the colors."* The final direction was *"Much lighter color scheme
   throughout, e.g. #fff7f3"*. Info panels now reuse the pale brand pink
   instead of a separate purple.
5. **Wording de-"tooled":** wording should name the **guideline**, not the tool.
   "Miscarriage Management Tool" became "Miscarriage Management", "Outside
   this tool's scope" became "Outside guideline scope", and verbose titles like
   "Miscarriage Management Decision Support" were cut.
6. **Restructured into a multi-tool hub** for GitHub Pages. The owner chose:
   **one repo, one Pages site**, titled **"RWH Clinical Guidelines"**. This
   produced the root homepage, `tools-manifest.js`, `assets/shared.css` (the
   original tool's stylesheet, which was already fully generic and became the
   shared design system), and the `_template/` scaffold.
7. **Second tool built (01/10/2026):** `pain-bleeding-early-pregnancy/`, from
   *Pain and Bleeding in Early Pregnancy – Guideline* (RWH0192464 v3.0, last
   review 30/03/2023, owner Carmen Barry, Women's Health Services / EPAS).
   This is an **assessment/triage** guideline (the §4.1 algorithm), not a
   treatment-choice one, so outcomes are triage endpoints (urgent, heavy
   bleeding ± POC, admit, EPAS referral + discharge) rather than ranked
   modality cards. Outline approved by the owner before build. Owner decisions:
   - **Severe pain follows the algorithm's routing** (into the pain branch, not
     a third safety check). The §1 "severe pain → WEC" statement shows as a banner.
   - Clinical suspicion of ectopic (low vs moderate/high) is the **clinician's
     call**. The guideline doesn't define it, so the page prompts with risk factors
     and "clinically likely" signs but never auto-classifies.
   - Appendix A (WEC ultrasound machine credentialing) left out as operational.
   - Patient info: the owner confirmed
     `…/early-pregnancy-problems/bleeding-in-early-pregnancy` as the web page.
     Later, the official PDF fact sheet *Pain and bleeding in early pregnancy*
     (May 2024, `/images/uploads/fact-sheets/Pain_bleeding_early_pregnancy_240501.pdf`,
     with Arabic/Chinese/Somali/Turkish/Urdu/Vietnamese versions) was found. On
     the owner's instruction it now leads every outcome's patient-info links and
     replaces the web page on the hCG card. It covers hCG/ultrasound results, so it
     stands in for the guideline's "understanding your results" sheet, which has
     no separate page.
8. **Third tool built (01/10/2026):** `ectopic-pregnancy-management/`, from
   *Ectopic Pregnancy Management – Guideline* (RWH0192462 v4.0, last review
   01/05/2026, owner Jane Lynch, Women's Health Services / EPAS). It's a
   treatment-choice guideline like miscarriage (surgical / single-dose
   methotrexate / expectant). The outline was approved before build. Owner decisions:
   - **Safety checks come before the diagnosis question** (instability → urgent
     surgery screen; intraperitoneal bleeding → surgery indicated), because the
     guideline allows surgery without an accredited scan when the woman is unstable.
   - **Any surgical indication marks both alternatives "Not suitable"**, including any
     MTX contraindication, which the §4.3 table lists as a surgical indication.
     This is conservative: e.g. a breastfeeding woman who otherwise meets the
     expectant criteria is routed to surgery.
   - **Expectant = β-hCG <1,000 AND falling AND no pain/tenderness.** The
     guideline says "low/falling … usually well below 1,000". If the ectopic is
     *confirmed* on US, expectant still shows "May be considered" with a note
     (the guideline's third criterion is inconclusive US).
   - **NSAIDs/diuretics/penicillin/tetracyclines = caution, not exclusion**
     (the guideline says "not so critical for the single dose regimen").
   - **MTX dose calculator included, using Mosteller + a DuBois cross-check warning.** The
     guideline text says Mosteller (and prints the formula), but **all 53
     Appendix B BSA table values match DuBois** (0.007184 × W^0.425 × H^0.725).
     The doses differ by 10 mg in 12/53 cells. The owner chose: calculate with
     Mosteller, and show an amber warning with the DuBois dose when it would
     round differently. Also flagged as not stocked (stocked: 50/70/80/90/100 mg),
     and outside the table range (140–200 cm, 40–130 kg).
   - Unresolved guideline gaps, shown as printed and not filled in: no route stated
     for the single MTX dose (only "opposite gluteal muscle" for the second);
     unexplained asterisks on the 1.7 and 1.8 m² doses; the methotrexate
     patient sheet dates from July 2017, older than the guideline.
   - Interstitial/non-tubal ectopics → "Outside guideline scope", with Appendix A
     (multi-dose MTX + leucovorin) shown as reference only.
9. **Fourth tool built and published (01/10/2026):** `rhd-immunoglobulin/`, from
   *RhD Immunoglobulin (Anti D) Use in Maternity – Guideline* (RWH0191940 v3.0,
   last review 14/09/2026, owner Sophie Cameron, Maternity Services / Maternity).
   It has a new shape: an **indication + dose lookup** ("give / not required / not
   listed / seek advice"), not a treatment choice. It covers routine antenatal
   prophylaxis, sensitising events (<13 weeks and ≥13 weeks tables) and birth, with
   gates for maternal group (RhD+, variant D, unknown) and antibodies (remnant
   passive anti-D continues; unexplained anti-D or titre ≥16 → do not give). Owner
   decisions:
   - **TOP ≤10 weeks** and **light/isolated/painless bleeding <13 weeks** show
     "Not listed as an indication in this guideline", with no recommendation either way.
   - **FMH >6 mL:** show only the **minimum** extra dose (100 IU per mL over 6 mL,
     rounded up to a whole IU), plus "number of injections/vials: confirm with blood
     bank / haematologist". Never convert this to a vial count.
   - **IM contraindicated** → Rhophylac 1500 IU IV only where the guideline says so
     (≥13-week events, birth). For first-trimester events and routine doses →
     "seek haematology advice".
   - Coded conservatively: the multiple-pregnancy 625 IU applies to all
     first-trimester events (the asterisk has no anchor in the table); the 6-weekly
     repeat note shows from 12 weeks; FMH is required from 20+0 weeks.
   - Patient info: *Fetal blood group testing (RHD NIPT)* PDF (Aug 2026). The "You and
     Your Baby" brochure is intranet-only, so it's named but not linked.
   - Afterwards (owner approved): every "Anti-D" mention in the three
     early-pregnancy tools now links to this guideline via `antiDLink()`. This
     added a site-wide in-content link style in `shared.css` (see §5).
10. **CTG guideline built, then withdrawn (01/10/2026).** A tool was built
    locally from *Cardiotocograph (CTG) Interpretation and Response – Guideline*
    (RWH0192241 v2.1, last review 13/11/2023, owner Trish Ryan). It was a feature
    classifier: the clinician entered baseline, variability, decelerations and
    accelerations, and it gave the Appendix A category, the Appendix E escalation
    tier and the response steps, plus an Appendix C "is CTG indicated?" checker.
    After review, **the owner judged it unreliable and asked for it to be removed
    entirely.** The folder and manifest entry were deleted before any commit, so it
    was never published or in git history. The owner didn't give a specific reason.
    Known facts about the source, recorded for context (not as the owner's reason):
    - Appendices A (algorithm), B (definitions) and E (escalation pathway) **disagree**
      on several features. Examples: reduced variability 3–5 bpm (B: "unlikely"; A:
      "may" if >40 min); prolonged deceleration (A/B: "may"; E: immediate Pink Alert);
      baseline >170 (A: "likely"; E: lowest escalation tier as ">160"); typical
      variable decelerations and absent accelerations ("unlikely" in A/B but escalated
      in E). The build reconciled these by taking the more urgent source. That
      reconciliation was the tool's own interpretation, not the guideline's.
    - The guideline was last reviewed in 2023, and the Appendix A/E content is images.
    - The source PDF stays in `guidelines/` (owner's file, kept local).
11. **Rebranded away from RWH (01/10/2026), at the owner's request,** so the site
    doesn't look directly associated with RWH:
    - Site name: "RWH Clinical Guidelines" → **"Australian Guidelines in ObGyn"**
      (homepage `<title>`/`<h1>`, every tab title suffix `— Australian Guidelines in
      ObGyn`).
    - Subtitle: **"Interactive, step-by-step tools for obstetrics and gynaecology,
      based on Australian clinical guidelines"**.
    - **The pink header circle (`.brand-dot`) was removed everywhere**, because it
      mimicked the RWH logo. The CSS rule is deleted, and it's gone from `_template/` too.
    - Back-link: "← All RWH guideline tools" → **"← All guidelines"**.
    - Homepage disclaimer: "not endorsed by or affiliated with The Royal Women's
      Hospital or any other health service".
    - **Kept on purpose:** each page's citation of its source RWH guideline (title,
      doc number, version, review date, owner) and the non-affiliation statements.
      Those are attribution, not branding.
    - Not changed (owner not yet asked): the pink colour palette, the GitHub
      account/repo name `rwhguides` (it's in the URL), and the RWH document numbers
      shown on homepage cards.
12. **Fifth tool built and published (01/10/2026):** `nausea-vomiting-pregnancy/`, from
    *Nausea and Vomiting in Pregnancy – Guideline* (RWH0191867 v3.0, last review
    02/09/2024, owner Jenny Ryan, Maternity Services). This was the first guideline
    checked under the "contradictions before building" rule (§4 Process). The body
    text and the Appendix A algorithm disagreed, and **the owner chose the source for
    each conflict, one by one**:
    - Pyridoxine: **Appendix A** (12.5 mg morning and midday, 25 mg night), keeping
      the body note "use of pyridoxine is optional".
    - Ranitidine 300 mg daily with prednisolone: **included** (Appendix A only). Claude
      flagged that ranitidine was, to its knowledge, withdrawn in Australia around 2020.
      The owner kept it.
    - Prochlorperazine parenteral: **body text** (12.5 mg IM/slow IV every 8 h).
    - Corticosteroids: **body text** (after the first trimester, benefit > fetal risk),
      with "after the first trimester" = **from 14+0 weeks** (owner decision).
    - Home pathway: **Appendix A** ("RWH @ Home Acute Shared Care", Medicare eligible
      **and** easy to cannulate, refer back to PDCC/WEC). The intake line and EMR order
      keep their literal body-text names ("RMH@Home Acute …").
    - Prednisolone taper: the owner chose to **interpret** the ambiguous wording as "50 mg
      daily ×3 days, then 25 mg daily ×3 days, then reduce by 5 mg as tolerated".
    - All six choices are shown on the page in a **"Source notes"** reference card,
      and the disclaimer bar points to it.
    - Shape: an escalation ladder. Gestation → differentials and investigations →
      previous severe NVP (pre-emptive banner; no regimen given) → dehydrated
      (admit) → "which step tried?" → next step, the full ladder with
      Tried/Next/"From 14+0 weeks" badges, lifestyle, home pathway, and the patient
      sheet *Nausea, vomiting and hyperemesis in pregnancy* (PDF, July 2026).

### Current status (01/10/2026)

- Five live tools: `miscarriage-management/`,
  `pain-bleeding-early-pregnancy/`, `ectopic-pregnancy-management/` (the EPAS
  early-pregnancy set, which link to each other with relative links),
  `rhd-immunoglobulin/` and `nausea-vomiting-pregnancy/` (Maternity).
- Withdrawn and never published: the CTG Interpretation and Response tool (§2, item 10).
- No further PDFs are waiting in `guidelines/`.
- **Published on GitHub Pages (01/10/2026)** at **https://rwhguides.github.io/**
  from the public repo `rwhguides/rwhguides.github.io` (`main` branch, root).
  See §8.
- **PDFs are never published (owner decision):** `.gitignore` has `*.pdf`. Source
  PDFs stay local only (`miscarriage-management/guideline.pdf` and
  `guidelines/*.pdf`). Never force-add a PDF.
- Local test server convention: `python3 -m http.server 8791` from the repo
  root (any free port works).

---

## 3. Repository layout

```
Tools/                          ← repo root = GitHub Pages site root
├── PROJECT_CONTEXT.md          ← this file
├── README.md                   ← human-facing overview + deploy steps
├── .gitignore                  ← .DS_Store, .claude/, *.pdf
├── .nojekyll                   ← tells Pages to serve files as-is (no Jekyll processing)
├── index.html                  ← hub homepage
├── styles.css                  ← homepage-only styles (tool grid/cards/status badges)
├── tools-manifest.js           ← window.TOOLS = [...] — the list of tools on the homepage
├── home.js                     ← renders TOOLS into cards
├── assets/
│   └── shared.css              ← THE design system, used by homepage + every tool
├── guidelines/                 ← source PDFs awaiting/used for tools (reference only)
├── miscarriage-management/     ← tool #1 (reference implementation: treatment choice)
│   ├── index.html
│   ├── app.js                  ← ~900 lines: content data + engine + screens
│   └── guideline.pdf           ← source, reference only
├── pain-bleeding-early-pregnancy/ ← tool #2 (reference implementation: triage/assessment)
│   ├── index.html
│   └── app.js                  ← ~750 lines; no styles.css
├── ectopic-pregnancy-management/ ← tool #3 (treatment choice + dose calculator)
│   ├── index.html
│   └── app.js                  ← ~1000 lines; no styles.css
├── rhd-immunoglobulin/         ← tool #4 (indication + dose lookup)
│   ├── index.html
│   └── app.js                  ← ~900 lines; no styles.css
└── _template/                  ← copy this to start a new tool
    ├── README.md               ← short human walkthrough
    ├── index.html              ← placeholder shell ([Guideline Title], RWH-XXXXXXX, etc.)
    ├── styles.css              ← empty override file
    └── app.js                  ← generic engine + 3 example screens
```

Architectural decisions (keep to these unless the owner asks otherwise):

- **CSS is shared and JS is copied.** Every page links `assets/shared.css`
  (tools use `../assets/shared.css`). Each tool has its **own independent
  `app.js`** with its own copy of the engine, so a change in one tool can never break
  another. Don't create a shared JS library without asking.
- **The manifest is a plain `<script>`, not a fetched JSON file**, so the homepage works from
  `file://` without a server.
- **All paths are relative**, so the site works under `username.github.io/<repo>/`
  or a custom domain.
- **Cache-busting query strings:** `app.js?v=N`, `shared.css?v=N`. Bump `N`
  when you change a file, so browsers (and the owner testing locally) don't
  serve stale copies. Current versions: pain-bleeding `app.js?v=4`, ectopic `app.js?v=3`, RhD `app.js?v=1`,
  NVP `app.js?v=1`, miscarriage `app.js?v=6`, homepage `tools-manifest.js?v=7`, and
  `shared.css?v=3` on every page (bump it on **all** `index.html` files, including
  `_template/`, whenever `shared.css` changes). **Bump the
  homepage's `tools-manifest.js?v=` whenever you edit the manifest.**
- **Folder name = URL slug** = manifest `slug`/`path`, in kebab-case (e.g.
  `postpartum-haemorrhage/`).

---

## 4. Owner's standing preferences (follow these without being asked)

### Wording
- Name the **guideline**, never "the tool", "this app" or "decision support
  tool", in titles, headings and scope messages.
  - Title: just the guideline topic, e.g. "Miscarriage Management".
  - Scope exit screen: **"Outside guideline scope"**.
- Keep titles short. Don't use verbose compounds like "X Management Decision Support".
- Follow the guideline's own terminology and patient language (the RWH guidelines
  say "the woman", so do the same).
- Use **Australian/British spelling and conventions**: haemorrhage, anaemia,
  paediatric, β-hCG, dates as DD/MM/YYYY, mcg/mg units as written in the
  guideline.

### Citation
- Cite the guideline by **full title, RWH document number, version, and
  last-updated date**, plus document owner and section/department in the footer.
  Take these from the PDF's header/footer.
- **Never hyperlink the guideline PDF** (not "Source: guideline.pdf", and no link to an
  uploaded or external copy).

### Checklists and questions
- **Any checklist the clinician acts on gets real, tickable checkboxes**
  (`actionPanel`, or `detailSection(..., true)`). This covers preconditions,
  regimens, follow-up steps, universal checklists and urgent actions.
  Plain bullets are only for descriptive content (about, advantages,
  disadvantages, rationale).
- **Any multi-select screening question (contraindications, exclusions, risk
  factors) is mandatory and must include a "None of the above" option.**
  Continue stays disabled until at least one box is ticked. Ticking "None"
  clears the others, and ticking any finding clears "None". Copy
  `screenContraindications()` in `miscarriage-management/app.js`.

### Patient information
- Each management pathway or outcome should link the **accepted RWH patient
  information sheet** where one exists, preferably from
  `https://www.thewomens.org.au/health-information/...` or
  `https://www.thewomens.org.au/images/uploads/fact-sheets/...`. Use the
  `patientInfo: { url, label }` field on the modality object, which renders as a
  "📄 …" pill link opening in a new tab.
- **Check that every URL resolves** (e.g. with `curl -sI`) before using it. If you
  can't find a suitable official sheet, say so instead of guessing a URL.

### Visual design
- **Very light, pastel, ColorBrewer-derived palette.** Page background is
  `#fff7f3`. The owner **does not like deep or saturated colours** and has pushed
  back on this several times. When in doubt, go lighter.
- Use the existing tokens in `assets/shared.css` (`--ok-*`, `--warn-*`,
  `--bad-*`, `--info-*`, `--neutral-*`, `--pink-*`). Don't hard-code colours
  in tool files. Any palette change goes in `shared.css` and applies
  everywhere. Make it everywhere, not just in the header.
- Brand accent is pink (`--pink: #d6006d`), used sparingly for small accents
  (active crumb, checkbox accent, link hover). Panels and buttons use the
  pale/mid pinks.
- **Don't mimic RWH branding** (no logo-like marks, no "RWH" in the site name
  or tab titles). Cite the source guideline in each page's subtitle and footer, and
  keep the non-affiliation disclaimer. Site name: **"Australian Guidelines in ObGyn"**.

### Process
- **Test locally first**, then go to GitHub.
- The owner sometimes asks a question with "don't change anything now". In that
  case answer only and don't edit.
- Show the owner the result in the browser (`open http://localhost:PORT/...`)
  after significant changes.
- **Do not rebuild the CTG Interpretation and Response guideline** (or any CTG
  trace-classification tool) unless the owner explicitly asks. It was withdrawn as
  unreliable (§2, item 10). If a future guideline's appendices or tables contradict each
  other on classification or escalation, raise it with the owner **before building**,
  and treat it as a possible reason not to build that tool at all, rather than
  reconciling it in code.

---

## 5. How a tool works (the engine)

Each tool's `index.html` is a fixed shell: a header (with the
`← All guidelines` back-link to `../index.html`), a disclaimer bar, a
`#breadcrumb` nav, a `#app` card, Back/Restart buttons, and a citation footer.
`app.js` is one IIFE that renders screens into `#app`.

### State machine
- `state` is a plain object holding the answers so far (e.g. `state.type`,
  `state.band`, `state.cxProstaglandin`).
- `go("screenId")` pushes `{screen, deep-cloned state}` onto `navStack`, then
  renders. **Back** pops the stack and restores both the screen and the state,
  so answers given on later screens are undone. `restart()` clears everything.
- `render()` is a `switch (currentScreen)` that maps screen IDs to
  `screenXxx()` functions. **Every new screen must be registered there**, or
  it silently falls back to the intro.

### Helpers (in `_template/app.js`)
| Helper | Purpose |
|---|---|
| `screenShell(phaseIndex, title, subtitle)` | Clears `#app`, sets breadcrumb, renders heading. Call first in every screen. |
| `optionList([{label, hint, onClick, danger}])` | Big tappable single-choice buttons. Most questions use this. `danger: true` gives a red outline for "Yes" answers that lead to urgent pathways. |
| `banner(kind, title, items)` | Read-only info panel. `kind`: `info` / `ok` / `warn` / `bad`. |
| `actionPanel(kind, title, items)` | Same look, but each item is a tickable checkbox. |
| `actionsRow([{label, primary, disabled, onClick}])` | Button row (Start / Continue). |
| `finalActions()` | "Print / save summary" + "Start over". Put at the end of every terminal screen. |

### Additional patterns in `miscarriage-management/app.js` (copy as needed)
The template has the generic engine only. The reference tool also has:

- **Content-as-data at the top of the file:** `PHASES`, `SAFETY_NET`,
  `UNIVERSAL_CHECKLIST`, and a `MODALITIES` object (one entry per management
  option, with `name`, `blurb`, `advantages`, `disadvantages`,
  `preconditions`, `regimen` (or regimen variants), `followUp`, and `patientInfo`).
  Keep the clinical content in these data blocks, separate from screen logic, so it
  can be checked line-by-line against the PDF.
- **Threshold classifiers + band tables:** `classifyMissed()` /
  `classifyIncomplete()` map measurements to a band, and `MISSED_BANDS` /
  `INCOMPLETE_BANDS` list which options are `recommended` vs `reasonable`
  for each band, plus a `note`.
- **Status ranking:** `statusFor(modality)` combines the band table with
  contraindication flags into `recommended` / `reasonable` /
  `not-recommended` / `contraindicated`. The final screen sorts the options
  by that rank.
- **Modality cards:** `appendCollapsibleModality()` gives a collapsible card
  with a status badge, auto-expanded when recommended.
  `renderModalityDetail()` gives a single expanded card for forced pathways.
  `fillModalityBody()` + `detailSection(title, items, checkable)` build the
  About / Advantages / Disadvantages (bullets) and Preconditions / Regimen /
  Follow-up (checkboxes) sections, plus the patient info link.
- **Preference reconciliation:** after counselling, the woman's stated
  preference is compared with the clinical status. A green banner shows if it matches, and
  an amber "discuss further" banner shows if her choice is not recommended or
  contraindicated.
- **`universalChecklistBlock()`:** a checklist for every pathway (Anti-D,
  contraception, histopathology, contacts, GP follow-up), followed by
  safety-net red-flag symptoms.
- **Numeric input screens:** `.field` + `<input type="number">`, parsed with
  `parseFloat`, where blank means `null`. (`screenMissedSizing` uses `alert()`
  for validation. New tools should use the inline `.field-error` pattern from
  `screenContraindications` instead, because alerts are clunky on mobile.)

### Additional patterns in `pain-bleeding-early-pregnancy/app.js` (copy as needed)
Use this one as the model for **assessment/triage** guidelines:

- **`mandatoryMultiSelect(items, onContinue)`:** a generic, data-driven
  version of `screenContraindications()`. Pass `[{key, label, hint}]`. It adds
  "None of the above", keeps Continue disabled until something is ticked,
  enforces None-exclusivity, and calls `onContinue(selectedKeys)` (empty
  array = None). **Prefer this over hand-writing checkbox HTML.**
- **Flagged findings drive banners, not routing:** items in `PAIN_FINDINGS`
  carry flags (`gynaeReview`, `ectopicSign`). The next screen shows the matching
  banners, listing what was ticked, while the clinician makes the routing
  decision. Use this when the guideline gives prompts but no hard threshold.
- **"Skip to urgent" shortcut:** a `danger` option on a non-urgent checklist
  screen (initial assessment) that jumps straight to the urgent screen, so a
  checklist never delays escalation.
- **Question + actions on one screen:** e.g. heavy bleeding shows the
  speculum actions, then "POC found?" as an `optionList` below, which saves a
  screen.
- **`outcomeBlock(patientInfos)`:** shared footer for every outcome screen. It
  contains a conditional banner (IUP confirmed → heterotopic caveat; otherwise →
  "ectopic not yet excluded"), a communication checklist, safety-net checkboxes,
  patient info pills, collapsible reference cards, and related guidelines.
- **`REFERENCE_CARDS` + `appendReferenceCard()`:** collapsible
  `.modality-card`s without a status class, holding descriptive bullets
  (diagnostic criteria, hCG patterns, appendix requirements), each with an optional
  `patientInfo`. They are collapsed on screen and expanded in print.
- **`PATIENT_INFO` map:** define each sheet once and reference it from outcomes
  and cards.
- **Linking sibling tools** with a relative link (e.g.
  `../miscarriage-management/index.html`) is fine. That's not a PDF link.
  **Links inside a pathway open in a new tab** (`target="_blank" rel="noopener"`),
  because state is in memory only and following a link in the same tab would lose the
  clinician's place. The `antiDLink(text)` helper (defined right after the DOM
  constants, *before* the data blocks, to avoid a `const` temporal dead zone) is the
  model: it's used inside data strings that render via `innerHTML`. A link inside a
  checkbox `<label>` follows the link without ticking the box. In-content links
  are styled by `.app-shell .card a:not(.patient-info-link)` in `shared.css`
  (`--pink-dark`, underlined), never browser blue.

### Additional patterns in `ectopic-pregnancy-management/app.js` (copy as needed)
The newest treatment-choice build. Prefer it over the miscarriage file as a model:

- **`MODALITIES[x].sections`** is a list of `[title, checkable, items]`, so cards are
  fully data-driven (no per-modality `fillModalityBody` branches). Use
  `checkable === "calculator"` to drop a widget into a section. `patientInfo`
  is an array, so a card can carry several sheets.
- **`CRITERIA`** holds the guideline's criteria table verbatim and is shown in every
  card as "Clinical criteria (§x)". `statusFor()` returns
  `{status, label, reasons}`, and each card opens with a **"Why this status"** list,
  so the clinician sees exactly which inputs drove the badge.
- **Badge labels decoupled from CSS classes:** e.g. `reasonable` + "Default
  treatment", `contraindicated` + "Not suitable", `not-recommended` + "Criteria
  not met". Ties in rank keep the guideline's order (surgery first, as the
  default).
- **Skip a screen when its answer can't change the result:** the MTX criteria
  screen is skipped if findings already give a surgical indication.
- **Findings form:** number inputs plus `.radio-row` radios (the `radio()` helper),
  with one inline `.field-error` listing every missing field. Inputs are pre-filled from
  `state`, so Back keeps what was entered.
- **Calculator pattern (`doseCalculator()`):** recalculates live on `input`, shows
  the working (formula → BSA → raw dose → rounded dose), adds amber "Check before
  prescribing" warnings (method mismatch, not stocked, outside table range),
  always ends with a "Verify against the source" line, and reproduces the source
  tables underneath for print. **For any calculator, cross-check it against the
  guideline's own tables in `node` before building**, which is how the
  Mosteller/DuBois mismatch was found.

### Additional patterns in `rhd-immunoglobulin/app.js` (copy as needed)
Model for **"is it indicated, and at what dose?"** lookup guidelines:

- **`computeResult()`** returns one object, `{verdict, title, doses[], banners[],
  vf, rhophylac, prescriber}`, built from `state`. `screenResult()` only renders it.
  Keep all the rules in that one function so they can be checked line by line
  against the guideline. Verdicts: `give` / `notRequired` / `notListed` / `advice`.
- **The title is the answer:** e.g. "Give 625 IU Rh(D) Immunoglobulin-VF IM". The
  green "Prescribe and give" `actionPanel` lists each dose line, plus who may prescribe.
- **Data-driven stop screens:** a `STOPS` map of `[kind, title, heading, items]`
  rendered by a single `screenStop(key)`, used for gates that end the pathway.
- **Event lists as data with flags** (`bleeding`, `notListed`), and the list shown
  depends on gestation (<13 weeks vs ≥13 weeks). Options a guideline does *not*
  list are offered explicitly and lead to a "Not listed" result, so the clinician
  isn't left guessing.
- **Thresholds as named constants** at the top (`FMH_COVERED_ML`,
  `HOURS_STANDARD`, etc.), each with a § comment.
- **Fields that only show when relevant** (e.g. the FMH input from 20 weeks; dose
  questions hidden when the infant is RhD negative). Validation only covers fields
  that are shown.
- **Floating-point care in dose maths:** round to 3 dp before `Math.ceil`.

### Typical flow shape (copy this for new guidelines)
1. **Intro:** a "Before you start" banner listing assumptions (e.g. diagnosis
   already made, with a pointer to the guideline that covers it), what's
   covered, and what's explicitly **not** covered.
2. **Scope gate** (gestation, population, setting). Out-of-scope answers go to
   an "Outside guideline scope" screen that says where to go instead.
3. **Safety checks first** ("Safety check 1 of N"): instability, sepsis, and
   any guideline-specific red flag. A "Yes" (`danger: true`) jumps straight to
   an **urgent screen** with a `bad` actionPanel of escalation steps, then
   `finalActions()`. Don't continue the routine pathway after a red flag.
4. **Classification:** type/category questions that branch the tree.
5. **Details:** measurements, mandatory contraindication screen.
6. **Preferences:** the woman's informed choice, where the guideline allows one.
7. **Result:** a banner with the band/rationale, a preference reconciliation,
   ranked option cards, the universal checklist and safety net, then `finalActions()`.

Map the breadcrumb to these (4–6 short `PHASES`). Terminal urgent screens
use the last phase index.

### Shared CSS components (`assets/shared.css`)
`.site-header`, `.back-link`, `.brand`, `.disclaimer-bar`, `.app-shell`,
`.breadcrumb/.crumb(.active/.done)`, `.card`, `.screen-title`,
`.screen-subtitle`, `.option-list/.option-btn(.danger)`, `.checkbox-row`,
`.radio-row`, `.row-title/.row-hint`, `.field`, `.field-error`, `.btn`,
`.btn-primary`, `.btn-ghost`, `.actions-row`, `.nav-buttons`,
`.banner.{info,ok,warn,bad}`, `.action-panel.{…}`, `.action-item`,
`.result-list`, `.modality-card.{recommended,reasonable,not-recommended,contraindicated}(.open)`,
`.modality-head/.modality-body`, `.badge.{…}`, `.checklist-box`,
`.patient-info-link`. Print styles expand all cards and hide the navigation, and a
≤480px breakpoint handles phones. A new tool should need **no CSS at all**.
Only use its own `styles.css` for something truly tool-specific.

---

## 6. Building a new tool: step by step

### Step 0: Get the inputs
- The owner puts the guideline PDF somewhere, currently usually
  `Tools/guidelines/<Original Name>.pdf`. Ask for it if it's missing.
- **Reading PDFs on the owner's Mac:** `pdftotext`/`pdftoppm` (poppler) and
  `pypdf` are **not installed**. Reading the PDF file directly with the Read
  tool (no `pages` argument) works for short PDFs and returns the text plus
  page images, including flowcharts. Reading in page ranges (`pages`)
  needs poppler, so for long PDFs ask the owner to `brew install poppler` first.
- **Read the whole PDF**, including flowcharts, tables, appendices and footnotes.
  For long PDFs, read in page ranges. Note the exact title, document number,
  version, last-updated/review date, owner and section from the header/footer.

### Step 1: Map the decision tree before writing code
Extract from the guideline:
- scope (population, gestation, setting) and explicit exclusions
- red flags and urgent escalation criteria
- classification branches and the questions that tell them apart
- numeric thresholds (with units and the measuring plane/method)
- management options, each with indications, contraindications, preconditions,
  regimens (exact drug, dose, route, timing), follow-up and advantages/disadvantages
- universal actions (things done for every patient)
- safety-net advice for the patient
- related guidelines it refers to (mention them by name; don't link PDFs)

Where the guideline is **ambiguous, contradictory or gives overlapping
ranges** (e.g. the miscarriage guideline gives "GS < 15–20mm" and
"> 30–35mm"), pick a clear, conservative coding, show the guideline's own
wording in the band label, and **tell the owner which interpretation you chose**.

For anything non-trivial, give the owner a short outline of the proposed flow
(screens and branches) and confirm it before building. The owner is a clinician
and will spot clinical misreadings faster than any test.

### Step 2: Scaffold
```bash
cp -R _template <slug>
```
- `index.html`: fill every `[placeholder]`: `<title>` ("<Topic> — RWH
  Guideline"), meta description, `<h1>` (short topic name), subtitle
  (guideline title, doc number, version, reviewed date), disclaimer bar (name
  the right specialist team to escalate to), footer citation.
- If the tool needs no custom CSS, delete `styles.css` and its `<link>` (as
  the miscarriage tool does).

### Step 3: Build `app.js`
- Update the header comment with the source guideline citation.
- Put all clinical content in data blocks at the top (see §5), with wording kept
  close to the guideline's.
- Set `PHASES`, write the screens, and register each one in `render()`.
- Copy the helpers you need (modality cards, `detailSection`, mandatory
  checkbox screen, universal checklist) from `miscarriage-management/app.js`.
- Delete the template's example screens.
- Find and verify the patient information sheet URLs for each pathway (§4).
  `thewomens.org.au` returns a small JavaScript shell to `curl`, so a 200 alone
  doesn't confirm the content. Check each page's title/heading in the browser.
  The site's early-pregnancy index page
  (`…/pregnancy-problems/early-pregnancy-problems`) lists the real page slugs,
  so use it rather than guessing.
  **To find PDF fact sheets:** from a browser tab on thewomens.org.au, `fetch()`
  `/health-information/fact-sheets` and regex the `href="…pdf"` links (~1,200
  PDFs; this is how the methotrexate and pain-and-bleeding sheets were found).
  Then check each candidate with a `HEAD` request (`content-type: application/pdf`)
  and read it to confirm the content. PDF links return real files to `curl`;
  only the HTML pages are JavaScript shells.

### Step 4: Register on the homepage
Add an entry to `window.TOOLS` in `tools-manifest.js`:
```js
{
  slug: "postpartum-haemorrhage",
  title: "Postpartum Haemorrhage",                 // short, no "tool"
  description: "One sentence: what it helps decide.",
  guidelineTitle: "Postpartum Haemorrhage – Guideline",
  guidelineRef: "RWH0XXXXXX vX.X",
  lastUpdated: "DD/MM/YYYY",
  department: "Owning department/service",
  status: "live",                                  // "live" | "draft" | "planned"
  path: "postpartum-haemorrhage/"
}
```
Use `draft`/`planned` to show a non-clickable card before the tool is ready.

### Step 5: Test
- `node --check <slug>/app.js` (syntax).
- Serve from the repo root (`python3 -m http.server 8791`) and check that
  `curl` returns 200 for the homepage, `assets/shared.css`, and the tool's
  `index.html`/`app.js`.
- **Walk every branch**, including each red flag, each out-of-scope exit, each
  band/classification, each contraindication combination, Back after
  several steps (state should restore), and Restart.
- Check that mandatory screens block Continue, that checkboxes tick (with strike-through),
  that patient info links open, and that the print view expands everything.
- Check it at phone width (≤480px) as well as desktop. The owner's Chrome
  window doesn't resize via automation (the viewport stays ~1728px), so load the tool in
  a 375px same-origin `<iframe>` and drive it from there. To check print
  without a print dialog, copy the `@media print` rules into a screen `<style>`
  in the iframe.
- Browser-automation gotchas: a `javascript_tool` result containing lots of
  `key=value` text can come back as `[BLOCKED: Cookie/query string data]`, so
  return plain `a :: b` strings instead. Text inside collapsed cards is invisible to
  `innerText`, so test it with `textContent`.
- CSS gotcha: `.banner strong { display:block }` in `shared.css` applies to
  **every** `<strong>` inside a banner, so use `<b>` for inline emphasis in banner
  list items.
- Check the wording: no "tool", correct citation, Australian spelling.
- `open` the homepage and the tool in the browser so the owner can review them.

### Step 6: Report back
Summarise the flow and list any **interpretation decisions** and any
guideline content left out (and why). Ask the owner to clinically validate it
before marking it `live` or publishing.

---

## 7. Clinical safety rules (non-negotiable)

- **No clinical content that isn't in the source guideline.** If something seems
  missing (e.g. a dose not stated), leave it out and flag it. Don't fill it from
  general knowledge.
- **Copy drug regimens exactly:** drug, dose, route, interval, number of
  doses, and "off-label" notes.
- **Red flags short-circuit the pathway** to an urgent screen with escalation
  actions.
- **Out-of-scope cases are always caught** and redirected, never pushed
  through.
- Every page keeps the **disclaimer bar** and the footer statement: *unofficial,
  independently built, not endorsed by or affiliated with The Royal Women's
  Hospital; validate against the current guideline before clinical use;
  re-check whenever the source document is updated.*
- **No patient data is collected, stored or sent.** All state is in memory
  and lost on refresh. Keep it that way: no localStorage of answers, no
  analytics, no external scripts.
- When a source guideline is revised, update the tool's content, citation,
  footer, manifest `guidelineRef`/`lastUpdated`, and bump the `?v=` cache-busters.

---

## 8. Deployment (live since 01/10/2026)

- **GitHub account:** `rwhguides`. **Repo:** `rwhguides/rwhguides.github.io`
  (public; free-plan Pages requires public). **Site:** https://rwhguides.github.io/,
  tools at `https://rwhguides.github.io/<slug>/`.
- Pages serves from `main` / root (GitHub enabled this automatically for the
  `<user>.github.io` repo). Each push redeploys in about 1–2 minutes. Check with
  `gh api repos/rwhguides/rwhguides.github.io/pages --jq .status` (wait for `built`).
- `gh` is installed (Homebrew) and authenticated as `rwhguides` (HTTPS).
- **Credential gotcha:** the Mac keychain also holds a login for a *different*
  GitHub account (`geedigit`), and plain `git push` picked that one and got 403.
  Fixed with a **repo-local** credential helper, so this repo pushes as `rwhguides`
  and nothing global changed:
  `git config --local credential.https://github.com.helper ""` then
  `git config --local --add credential.https://github.com.helper '!gh auth git-credential'`.
  Don't run `gh auth setup-git` globally: that would switch the owner's other
  projects to `rwhguides` too.
- **Commit identity (repo-local config):** `rwhguides
  <336302104+rwhguides@users.noreply.github.com>`. The owner chose this so their work
  email (the global git identity) never appears in public history. Don't change it,
  and don't commit from another clone without setting it the same way.
- **To publish a change:** test locally first, bump `?v=` cache-busters, then
  `git add -A && git commit && git push`, then check the live URL returns 200.
- Commit and push only when the owner asks. `.claude/` is gitignored on purpose
  (it holds local Claude Code settings). `PROJECT_CONTEXT.md`,
  `NEW_TOOL_PROMPT.txt` and `README.md` are public by owner decision. Keep
  secrets and personal contact details out of them.
- All paths are relative, so moving to a custom domain or a `/repo/` subpath
  would need no code changes.

---

## 9. Quick checklist for a new tool

- [ ] Whole PDF read; citation details captured
- [ ] Flow outline confirmed with owner (for non-trivial guidelines)
- [ ] `_template/` copied to `<slug>/`; all placeholders replaced
- [ ] Scope gate → safety checks → classification → details → preference → result
- [ ] Red flags go to urgent screens; out-of-scope goes to "Outside guideline scope"
- [ ] Clinical content in data blocks, matching the guideline exactly
- [ ] All actionable checklists are tickable checkboxes
- [ ] Multi-select screens are mandatory, with "None of the above"
- [ ] Patient info sheet per pathway, URL verified
- [ ] No "tool" wording; Australian spelling; no PDF hyperlink
- [ ] No new colours; shared.css tokens only; stays light/pastel
- [ ] Entry added to `tools-manifest.js`
- [ ] `node --check`, all branches walked, mobile + print checked
- [ ] Interpretation decisions reported to the owner
