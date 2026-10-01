/* ============================================================================
   Nausea and Vomiting in Pregnancy
   Decision-support logic derived from:
   "Nausea and Vomiting in Pregnancy - Guideline", RWH0191867 v3.0, The Royal
   Women's Hospital, Maternity Services. Last review 02/09/2024.
   This is an independent companion resource, not an official RWH product.

   The guideline's body text and its Appendix A algorithm differ in places.
   Where they do, this page follows the source chosen by the site owner — see
   SOURCE_NOTES (also shown on the page).
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Scope", "Assessment", "Hydration", "Treatment step", "Plan"];
  const RESULT = PHASES.length - 1;

  // Owner decision: "after the first trimester" = from 14+0 weeks
  const STEROID_FROM_WEEKS = 14;

  const PATIENT_INFO = {
    url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Nausea_vomiting_hyperemesis_in_pregnancy_260721.pdf",
    label: "Nausea, vomiting and hyperemesis in pregnancy — fact sheet (PDF)"
  };

  // Where body text (§4) and Appendix A differ: the source used, by owner decision.
  const SOURCE_NOTES = [
    "<b>Pyridoxine dose:</b> Appendix A used (12.5 mg morning and midday, 25 mg at night). The body text gives 25 mg morning, midday and night. The body-text note that pyridoxine is optional is kept.",
    "<b>Ranitidine:</b> included as in Appendix A (consider 300 mg daily with prednisolone). Not mentioned in the body text.",
    "<b>Prochlorperazine (parenteral):</b> body text used (12.5 mg IM/slow IV every 8 hours). Appendix A gives IM only.",
    "<b>Corticosteroids:</b> body text used — after the first trimester only, if maternal benefits outweigh risks to the fetus. Appendix A gives no gestation limit. ‘After the first trimester’ is taken as from 14+0 weeks.",
    "<b>Home pathway:</b> Appendix A used — ‘RWH @ Home Acute Shared Care pathway’, Medicare eligible and easy to cannulate, refer back to PDCC/WEC. The intake line and EMR order keep the body-text names (‘RMH@Home Acute’) as they are system names.",
    "<b>Prednisolone taper:</b> the guideline's wording (‘50 mg daily for 3 days, then reduce to 25 mg at 3 days then reduce by 5 mg as tolerated’) is ambiguous; it is shown here as interpreted: 50 mg daily for 3 days, then 25 mg daily for 3 days, then reduce by 5 mg as tolerated until resolved."
  ];

  // §4.1.1
  const DIFFERENTIALS = [
    "Gestational trophoblastic disease",
    "Multiple pregnancy",
    "Gastrointestinal causes (peptic ulcer disease, GI obstruction, hepatitis, pancreatitis)",
    "Genitourinary causes",
    "Central nervous system causes",
    "Toxic / metabolic causes (thyroid disease, adrenocortical insufficiency)"
  ];

  const INVESTIGATIONS = [
    "Urinalysis &amp; MSU",
    "Electrolytes (consider calcium), LFTs, plasma glucose",
    "TSH once (beware interpretation of TFTs in early pregnancy)",
    "Early pregnancy ultrasound"
  ];

  // §4.1.2
  const LIFESTYLE = [
    "Advise on appropriate foods and fluids to prevent dehydration and minimise aggravation of symptoms",
    "Small amounts of fluid and food throughout the day rather than fewer, larger meals; foods rich in carbohydrate and low in fat and acid",
    "Adequate oral fluid intake to prevent dehydration",
    "Suitable multivitamin supplement if poor oral intake persists",
    "Dietitian referral",
    "PC6 (Nei Guan) acupressure — wristbands e.g. SeaBand® (some evidence of efficacy)",
    "Ginger: short-term use (&lt;1000 mg daily) has not been associated with an increased risk of congenital malformations or adverse pregnancy outcomes",
    "Sleep requirement increases in early pregnancy and fatigue exacerbates symptoms — a liberal attitude to leave from work should ultimately shorten days lost"
  ];

  // §4.2 / Appendix A — treatment ladder (sources per SOURCE_NOTES)
  const STEPS = [
    {
      name: "Step 1 — Pyridoxine and doxylamine",
      group: "Mild or moderate symptoms (oral)",
      items: [
        "Pyridoxine 12.5 mg orally in the morning and at midday, and 25 mg at night",
        "Add doxylamine (Restavit®) 25 mg orally at night. Increase as tolerated to 12.5 mg in the morning and at midday, and 25 mg at night",
        "Note: due to the relative lack of evidence, use of pyridoxine is optional"
      ]
    },
    {
      name: "Step 2 — Add metoclopramide OR prochlorperazine",
      group: "Mild or moderate symptoms (oral)",
      items: [
        "Add either of the following if not improving:",
        "Metoclopramide (Maxolon®, Pramin®) 10 mg orally three times a day for up to 5 days only, to minimise the risk of neurological and other adverse effects — <b>OR</b>",
        "Prochlorperazine (Stemetil®) 5 to 10 mg orally two to three times a day"
      ]
    },
    {
      name: "Step 3 — Add promethazine",
      group: "Mild or moderate symptoms (oral)",
      items: [
        "Add another sedating antihistamine: promethazine (Phenergan®) 10 to 25 mg orally three to four times a day"
      ]
    },
    {
      name: "Step 4 — Ondansetron (Head of Unit approval)",
      group: "Mild or moderate symptoms (oral)",
      items: [
        "Ondansetron (Zofran®) 4 mg to 8 mg orally (tablet or wafer) two or three times a day",
        "<b>Must be approved by Head of Unit</b>",
        "Consider the RWH @ Home Acute Shared Care pathway (see below)"
      ]
    },
    {
      name: "Step 5 — Change to a parenteral regimen",
      group: "Severe, persistent or resistant nausea and vomiting",
      items: [
        "If not relieved by the above measures, consider changing the regimen to any of the following:",
        "Metoclopramide 10 mg IV/IM every 8 hours when required, for a maximum of 5 days, maximum 30 mg/day — <b>OR</b>",
        "Prochlorperazine 12.5 mg IM/slow IV every 8 hours — <b>OR</b>",
        "Ondansetron 4 mg IV/IM every 8 to 12 hours — <b>OR</b>",
        "Promethazine 12.5 to 25 mg IM 4 to 6 hourly — <b>OR</b>",
        "Chlorpromazine 10 to 25 mg IV/IM every 4 to 6 hours"
      ]
    },
    {
      name: "Step 6 — Corticosteroids (after the first trimester)",
      group: "If symptoms persist",
      steroid: true,
      items: [
        "Can be considered after the first trimester (from 14+0 weeks). Use only if maternal benefits outweigh risks to the fetus",
        "Hydrocortisone 100 mg IV every 12 hours; once clinical improvement occurs, convert to oral prednisolone",
        "Prednisolone 50 mg orally daily for 3 days, then 25 mg daily for 3 days, then reduce by 5 mg as tolerated until resolved (taper wording interpreted — see Source notes)",
        "Monitor blood glucose levels",
        "Consider prophylaxis with ranitidine 300 mg daily to prevent GI upset"
      ],
      caution: "Early reports suggested an association between corticosteroid use and an increased risk of cleft lip and palate; more recent data have shown no increased risk of orofacial clefts or preterm delivery."
    },
    {
      name: "Step 7 — Seek specialist advice",
      group: "If symptoms unresolved",
      items: [
        "Seek specialist advice",
        "Women who fail to respond to the above management should be assessed for enteral feeding — refer to a Dietitian at Parkville for consultation",
        "In severe or complex cases with ongoing weight loss, support with enteral or parenteral nutrition. Enteral nutrition provides more relief from nausea and vomiting than parenteral",
        "TPN only as a last resort when all other treatments have failed (no supporting evidence; risk of thrombosis, metabolic disturbance and infection)"
      ]
    }
  ];

  // §4.2.3
  const ADMISSION = [
    "Admit for IV fluid resuscitation and electrolyte restoration with sodium chloride 0.9% — IV fluid volume as per clinical assessment",
    "If hypokalaemic: potassium supplementation may be required (oral route preferred)",
    "Add a water-soluble vitamin B complex (IV B Dose® — thiamine 10 mg, riboflavine 5 mg, nicotinamide 100 mg, dexpanthenol 20 mg, pyridoxine 50 mg) to IV fluids: 1 vial in the ‘stat’ litre or the second (2-hourly) litre",
    "Consider thiamine (Betamin®) 100 mg orally daily to prevent Wernicke's encephalopathy",
    "Thiamine 100 mg to 200 mg IV daily for 2 to 3 days only if there is an established risk of thiamine deficiency (Special Access Scheme — contact Pharmacy for supply)",
    "Antacids or a proton pump inhibitor (omeprazole) if gastritis develops",
    "If adequate oral intake cannot be maintained: regular IV hydration (e.g. 2 to 3 times per week) to prevent dehydration — can be given in PDCC during normal working hours"
  ];

  // §4.3 / Appendix A — home pathway (naming per SOURCE_NOTES)
  const HOME = {
    criteria: [
      "Mild to moderate hyperemesis gravidarum — may benefit for fluid rehydration and management, with weekly PDCC medical review, rehydration supplementation and bloods; dietetic review as required",
      "Must be Medicare eligible",
      "Must be easy to cannulate"
    ],
    referral: [
      "Phone the RMH@Home Acute (HITH) Intake Coordinator: 0466 868 986 (Monday–Sunday 0800–1600) — they will advise acceptance of the referral",
      "As part of the Clinical Encounter, place an EMR order for ‘RMH@Home Acute – Admission’"
    ],
    journey: [
      "Day 1: Women's PDCC — bloods, IV therapy, obstetric review, referral to RMH HITH",
      "Day 3: admit RMH HITH — insert cannula, 1 L normal saline (may include checking ketones, bloods, metoclopramide and/or ondansetron)",
      "Day 4: RMH HITH — 1 L normal saline (may include checking ketones, bloods, metoclopramide and/or ondansetron)",
      "Day 5: RMH HITH — 1 L normal saline, remove cannula, discharge RMH HITH",
      "Day 7: Women's PDCC — check symptoms and repeat referral if suitable"
    ],
    escalation: [
      "Weekly review in PDCC for ongoing management unless resolved",
      "May be referred back to PDCC/WEC at any time if more complex or any concerns",
      "Escalate to PDCC within business hours, or the receiving Gynaecology Registrar after hours"
    ]
  };

  const REFERENCE_CARDS = [
    ["About nausea and vomiting of pregnancy (§1, §3)", [
      ["Course", [
        "Usually begins at 6–7 weeks, peaks around 9 weeks and resolves in most cases by 12–14 weeks; up to 20% continue beyond 20 weeks",
        "Affects up to 90% of women; not confined to the morning",
        "May be classified as mild, moderate or severe, although this may not correlate with the distress caused"
      ]],
      ["Hyperemesis gravidarum", [
        "Persistent vomiting leading to weight loss of more than 5% of pre-pregnancy weight (1% of pregnancies), associated with electrolyte abnormalities and dehydration",
        "Definitions table: a severe form with excessive pregnancy-related nausea and/or vomiting that prevents adequate intake of food and fluids"
      ]],
      ["Responsibilities", [
        "Medical staff: investigations, medications and IV fluid replacement",
        "Nursing/midwifery: care and observation during admission",
        "Dietitian: diet and nutrition advice",
        "Pharmacist: information, counselling and supply of medicines"
      ]]
    ]],
    ["Source notes — where this page follows one source over another", [
      ["Owner decisions", SOURCE_NOTES]
    ]]
  ];

  // ---- state machine ----------------------------------------------------------

  let state = {};
  let navStack = []; // { screen, state snapshot }
  let currentScreen = "intro";

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function go(screenName) {
    navStack.push({ screen: currentScreen, state: clone(state) });
    currentScreen = screenName;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (navStack.length === 0) return;
    const prev = navStack.pop();
    currentScreen = prev.screen;
    state = prev.state;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    state = {};
    navStack = [];
    currentScreen = "intro";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  backBtn.addEventListener("click", back);
  restartBtn.addEventListener("click", restart);

  // ---- small DOM helpers -------------------------------------------------------

  function setBreadcrumb(phaseIndex) {
    breadcrumbEl.innerHTML = "";
    PHASES.forEach((p, i) => {
      const span = document.createElement("span");
      span.className = "crumb" + (i === phaseIndex ? " active" : i < phaseIndex ? " done" : "");
      span.textContent = p;
      breadcrumbEl.appendChild(span);
    });
  }

  function screenShell(phaseIndex, title, subtitle) {
    app.innerHTML = "";
    setBreadcrumb(phaseIndex);
    backBtn.style.visibility = navStack.length ? "visible" : "hidden";
    const h = document.createElement("h2");
    h.className = "screen-title";
    h.textContent = title;
    app.appendChild(h);
    if (subtitle) {
      const p = document.createElement("p");
      p.className = "screen-subtitle";
      p.textContent = subtitle;
      app.appendChild(p);
    }
  }

  function optionButton(label, hint, onClick, danger) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn" + (danger ? " danger" : "");
    btn.innerHTML = `<span class="opt-label">${label}</span>` + (hint ? `<span class="opt-hint">${hint}</span>` : "");
    btn.addEventListener("click", onClick);
    return btn;
  }

  function optionList(options) {
    const wrap = document.createElement("div");
    wrap.className = "option-list";
    options.forEach(o => wrap.appendChild(optionButton(o.label, o.hint, o.onClick, o.danger)));
    return wrap;
  }

  // Note: `.banner strong` is display:block in shared.css — use <b> for inline emphasis in items.
  function banner(kind, titleText, items) {
    const div = document.createElement("div");
    div.className = "banner " + kind;
    let html = `<strong>${titleText}</strong>`;
    if (items && items.length) {
      html += "<ul>" + items.map(i => `<li>${i}</li>`).join("") + "</ul>";
    }
    div.innerHTML = html;
    return div;
  }

  let checkIdCounter = 0;

  function checkRow(text) {
    const id = "chk" + (checkIdCounter++);
    const row = document.createElement("div");
    row.className = "action-item";
    row.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${text}</label>`;
    return row;
  }

  // Pastel action panel with real, tickable checkboxes — used for any actionable checklist.
  function actionPanel(kind, titleText, items) {
    const div = document.createElement("div");
    div.className = "action-panel " + kind;
    const strong = document.createElement("strong");
    strong.textContent = titleText;
    div.appendChild(strong);
    items.forEach(i => div.appendChild(checkRow(i)));
    return div;
  }

  function actionsRow(buttons) {
    const wrap = document.createElement("div");
    wrap.className = "actions-row";
    buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn " + (b.primary ? "btn-primary" : "btn-ghost");
      btn.textContent = b.label;
      btn.addEventListener("click", b.onClick);
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function patientInfoLink(info) {
    const a = document.createElement("a");
    a.className = "patient-info-link";
    a.href = info.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "📄 " + info.label;
    return a;
  }

  function radio(name, value, label, current) {
    const id = name + "_" + value;
    return `<div class="radio-row"><input type="radio" name="${name}" id="${id}" value="${value}"${current === value ? " checked" : ""}><label for="${id}"><span class="row-title">${label}</span></label></div>`;
  }

  function detailSection(title, items, checkable) {
    const wrap = document.createElement("div");
    const h4 = document.createElement("h4");
    h4.textContent = title;
    wrap.appendChild(h4);
    if (checkable) {
      items.forEach(i => wrap.appendChild(checkRow(i)));
    } else {
      const ul = document.createElement("ul");
      items.forEach(i => { const li = document.createElement("li"); li.innerHTML = i; ul.appendChild(li); });
      wrap.appendChild(ul);
    }
    return wrap;
  }

  // Collapsible card — expanded in print view by shared.css. sections: [[title, items, checkable]]
  function appendCard(name, sections, open, status) {
    const card = document.createElement("div");
    card.className = "modality-card" + (status ? " " + status.cls : "") + (open ? " open" : "");
    card.innerHTML = `<div class="modality-head"><span class="modality-name">${name}</span>${status ? `<span class="badge ${status.cls}">${status.label}</span>` : ""}</div><div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    sections.forEach(([title, items, checkable]) => body.appendChild(detailSection(title, items, checkable)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
    return card;
  }

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  function fmtGestation() { return `${state.weeks}+${state.days} weeks`; }
  function steroidEligible() { return state.weeks >= STEROID_FROM_WEEKS; }

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "scope": return screenScope();
      case "assessment": return screenAssessment();
      case "hydration": return screenHydration();
      case "step": return screenStep();
      case "plan": return screenPlan();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "Nausea and Vomiting in Pregnancy", "Step-by-step assessment, rehydration and the medication ladder for nausea and vomiting of pregnancy and hyperemesis gravidarum, based on the RWH guideline.");
    app.appendChild(banner("info", "Before you start", [
      "For pregnant women with nausea and vomiting at the Women's.",
      "Idiopathic nausea and vomiting of pregnancy must be distinguished from other causes — the next screens prompt this.",
      "Treatment follows a ladder: if the woman's condition does not improve, go to the next step. Admit for IV fluids if dehydrated.",
      "Where the guideline text and its Appendix A algorithm differ, this page follows the source chosen by the site owner (see ‘Source notes’ on the plan screen)."
    ]));
    app.appendChild(actionsRow([{ label: "Start", primary: true, onClick: () => go("scope") }]));
  }

  function screenScope() {
    screenShell(0, "Gestation", "Current gestation (used for the corticosteroid step, which is only offered after the first trimester).");
    const wrap = document.createElement("div");
    const v = x => (x === undefined || x === null) ? "" : x;
    wrap.innerHTML = `
      <div class="field">
        <label for="weeksInput">Weeks</label>
        <input type="number" min="0" max="45" step="1" id="weeksInput" placeholder="e.g. 9" value="${v(state.weeks)}">
      </div>
      <div class="field">
        <label for="daysInput">Days</label>
        <input type="number" min="0" max="6" step="1" id="daysInput" placeholder="0–6" value="${v(state.days)}">
      </div>`;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([{
      label: "Continue", primary: true, onClick: () => {
        const w = parseInt(document.getElementById("weeksInput").value, 10);
        const dRaw = document.getElementById("daysInput").value.trim();
        const d = dRaw === "" ? 0 : parseInt(dRaw, 10);
        const missing = [];
        if (isNaN(w) || w < 0 || w > 45) missing.push("gestation in weeks (0–45)");
        if (isNaN(d) || d < 0 || d > 6) missing.push("days (0–6)");
        if (missing.length) { err.textContent = "Please enter " + missing.join(", ") + " to continue."; err.style.display = "block"; return; }
        state.weeks = w; state.days = d;
        go("assessment");
      }
    }]));
  }

  function screenAssessment() {
    screenShell(1, "History and examination", "Distinguish idiopathic nausea and vomiting of pregnancy from other causes (§4.1.1).");
    app.appendChild(actionPanel("info", "Consider and exclude", DIFFERENTIALS));
    app.appendChild(actionPanel("info", "Investigations", INVESTIGATIONS));
    const wrap = document.createElement("div");
    const cur = state.previousSevere === undefined ? undefined : (state.previousSevere ? "yes" : "no");
    wrap.innerHTML = `
      <div class="field">
        <label>Previous severe nausea and vomiting of pregnancy or hyperemesis gravidarum?</label>
        ${radio("prev", "no", "No", cur)}
        ${radio("prev", "yes", "Yes", cur)}
      </div>`;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([{
      label: "Continue", primary: true, onClick: () => {
        const v = (wrap.querySelector("input[name=prev]:checked") || {}).value;
        if (!v) { err.textContent = "Please answer the previous-pregnancy question to continue."; err.style.display = "block"; return; }
        state.previousSevere = v === "yes";
        go("hydration");
      }
    }]));
  }

  function screenHydration() {
    screenShell(2, "Hydration", "Is the woman dehydrated (± ketotic)?");
    app.appendChild(optionList([
      { label: "Yes — dehydrated ± ketotic", hint: "Admit for IV fluids", onClick: () => { state.dehydrated = true; go("step"); }, danger: true },
      { label: "No", onClick: () => { state.dehydrated = false; go("step"); } }
    ]));
  }

  function screenStep() {
    screenShell(3, "Treatment so far", "Which step has she already tried without improvement?");
    const opts = [{ label: "No medication yet", hint: "Start at Step 1", onClick: () => { state.tried = 0; go("plan"); } }];
    STEPS.slice(0, 6).forEach((s, i) => opts.push({
      label: s.name.replace(/^Step (\d) — /, "Step $1 tried: "),
      hint: "Not improving → " + (STEPS[i + 1].steroid && !steroidEligible()
        ? "Seek specialist advice (corticosteroids only from 14+0 weeks)"
        : STEPS[i + 1].name.replace(/ \(.*\)$/, "")),
      onClick: () => { state.tried = i + 1; go("plan"); }
    }));
    app.appendChild(optionList(opts));
  }

  function screenPlan() {
    let next = state.tried; // index into STEPS of the recommended next step
    const blockedSteroid = STEPS[next] && STEPS[next].steroid && !steroidEligible();
    screenShell(RESULT, blockedSteroid ? "Next: seek specialist advice" : "Next: " + STEPS[next].name);

    // Context banners
    const ctx = [`Gestation ${fmtGestation()}.`];
    if (state.tried === 0) ctx.push("No medication tried yet — start the ladder at Step 1, alongside dietary and lifestyle measures.");
    else ctx.push(`${STEPS[state.tried - 1].name} tried without improvement.`);
    app.appendChild(banner("info", "Where she is on the ladder", ctx));

    if (state.previousSevere) app.appendChild(banner("warn", "Previous severe nausea and vomiting or hyperemesis gravidarum", [
      "Pre-emptive therapy is recommended (§4.2.1). The guideline does not specify a pre-emptive regimen."
    ]));

    if (blockedSteroid) {
      app.appendChild(banner("warn", `Corticosteroids not offered before 14+0 weeks (currently ${fmtGestation()})`, [
        "Corticosteroids can be considered only after the first trimester (taken as from 14+0 weeks), and only if maternal benefits outweigh risks to the fetus.",
        "The next step after corticosteroids in the algorithm is to seek specialist advice."
      ]));
      next = STEPS.length - 1;
    }

    // Admission
    if (state.dehydrated) app.appendChild(actionPanel("bad", "Admit for intravenous fluids (§4.2.3)", ADMISSION));

    // Recommended next step
    const ns = STEPS[next];
    app.appendChild(actionPanel(ns.steroid ? "warn" : "ok", ns.name + " — " + ns.group, ns.items));
    if (ns.steroid) app.appendChild(banner("info", "Corticosteroids and the fetus", [ns.caution]));
    if (next <= 3) app.appendChild(banner("info", "Progress through the list", ["Progress through the list of medicines until symptoms are controlled. If the woman's condition does not improve, go to the next step."]));

    // Full ladder
    const h3 = document.createElement("h3");
    h3.textContent = "Full treatment ladder";
    app.appendChild(h3);
    STEPS.forEach((s, i) => {
      let status = null;
      if (i < state.tried) status = { cls: "not-recommended", label: "Tried" };
      else if (i === next) status = { cls: "recommended", label: "Next" };
      else if (s.steroid && !steroidEligible()) status = { cls: "contraindicated", label: "From 14+0 weeks" };
      const sections = [[s.group, s.items, false]];
      if (s.caution) sections.push(["Note", [s.caution], false]);
      appendCard(s.name, sections, false, status);
    });

    // Lifestyle
    app.appendChild(actionPanel("info", "Dietary and lifestyle measures (§4.1.2)", LIFESTYLE));

    // Home pathway
    const homeOpen = state.dehydrated || state.tried >= 3;
    appendCard("RWH @ Home Acute Shared Care pathway (§4.3, Appendix A)", [
      ["Criteria", HOME.criteria, true],
      ["Referral", HOME.referral, true],
      ["Patient journey", HOME.journey, false],
      ["Review and escalation", HOME.escalation, false]
    ], homeOpen);

    app.appendChild(banner("info", "Ongoing review and escalation", HOME.escalation));

    const p = document.createElement("div");
    p.appendChild(patientInfoLink(PATIENT_INFO));
    app.appendChild(p);

    const refHead = document.createElement("h3");
    refHead.textContent = "Reference";
    app.appendChild(refHead);
    REFERENCE_CARDS.forEach(([name, sections]) => appendCard(name, sections.map(([t, i]) => [t, i, false]), false));
    finalActions();
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
