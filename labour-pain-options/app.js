/* ============================================================================
   Labour Pain Options
   Decision-support logic derived from:
   "Pain Management: Options for Labour - Guideline", RWH0192696 v2.2,
   The Royal Women's Hospital, Maternity Services. Last review 02/04/2025.
   This is an independent companion resource, not an official RWH product.

   Where the guideline is ambiguous or inconsistent, this page follows the site
   owner's interpretation — see SOURCE_NOTES (also shown on the page).
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Situation", "Option", "Checks", "Plan"];
  const RESULT = PHASES.length - 1;

  const MORPHINE_WEIGHT_KG = 50;   // SO/14: <50 kg → 7.5 mg, otherwise 10 mg
  const MORPHINE_MAX_12H = 15;     // mg in 12 hours
  const MORPHINE_REPEAT_HOURS = 4; // further dose no earlier than 4 hours

  const PATIENT_INFO = {
    managing: { url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/labour-birth/managing-pain-in-labour", label: "Managing pain in labour — patient information (The Women's)" },
    epidural: { url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Epidural_pain_relief_for_labour_250612.pdf", label: "Epidural pain relief for labour — fact sheet (PDF)" },
    water: { url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Use_of_water_in_labour_and_birth_241205.pdf", label: "The use of water in labour and birth — fact sheet (PDF)" },
    support: { url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Labour_support_person_240814.pdf", label: "Tips for the labour and birth support person — fact sheet (PDF)" }
  };

  const SOURCE_NOTES = [
    "<b>Morphine peak effect:</b> the guideline gives two figures — about 70 minutes (§4.2.2) and about 30–60 minutes (Appendix A). Both are shown; neither drives any logic.",
    "<b>Diagnosis of labour:</b> required before morphine in every setting (diagnosed per the Labour and Birth – Guideline). Outside the Birth Centre / Assessment Centre the additional rules (term, early labour, doctor's order) also apply.",
    "<b>Further morphine dose for women &lt;50 kg</b> (initial 7.5 mg): not stated in the guideline (the ‘further 5 mg’ follows from a 10 mg first dose). Shown as ‘requires a medical order’, within the 15 mg / 12 hours maximum and no earlier than 4 hours.",
    "<b>SO/14 eligibility:</b> the guideline refers to ‘inclusion criteria’ without listing them; this page uses its own description — healthy women, at term, in labour, not considering regional analgesia. Outside these criteria a medical order is required.",
    "<b>Birth imminent:</b> not defined in time; asked as a clinical-judgement question (‘yes’ → do not give morphine).",
    "<b>Nitrous oxide timing:</b> the guideline says analgesia within 20–30 seconds with maximum effect at about 45 seconds, and elsewhere a time lag of approximately 50 seconds. Both are shown.",
    "<b>Formatting:</b> the birthing-ball falls-risk sentence appears in the §4.1.4 heading in the source; it is shown here with positioning and movement."
  ];

  // §4.1 — non-pharmacological methods. exclude(state) returns a reason string when not to use.
  const NON_PHARM = [
    { name: "Continuous support during labour (§4.1.1)", items: [
      "One-to-one coaching and care by a midwife (almost continuous attendance) helps women feel confident and positive about the birth",
      "Continuous support is associated with more spontaneous vaginal births, less pharmacological analgesia and regional analgesia, shorter labours, fewer instrumental and caesarean births, and higher 5-minute Apgar scores",
      "Includes active listening, stroking, massage, encouragement, suggesting position changes and other non-pharmacological methods, and being a constant presence"
    ], info: [PATIENT_INFO.support] },
    { name: "Relaxation, breathing techniques and massage (§4.1.2)", items: [
      "Can allay anxiety, encourage relaxation, distract from pain and tension, and encourage a positive attitude",
      "Be aware that some women do not like to be touched in labour",
      "Some women may have attended self-hypnosis classes (e.g. HypnoBirthing®, Calm Birthing®)"
    ] },
    { name: "Positioning and movement (§4.1.3)", items: [
      "Upright position and mobilising in the first stage can shorten it by approximately one hour",
      "Encourage position changes and any comfortable position during the first stage; women should be free to mobilise",
      "Make aids such as birthing balls available",
      "Consider the woman's falls risk; ensure she is not left unattended whilst using the ball"
    ] },
    { name: "Warm or cold packs (§4.1.4)", items: [
      "Warm packs to the abdomen and back, or to the perineum in the second stage, may relieve the burning sensation of pain; warm packs are highly acceptable to women in the late second stage",
      "For some women extreme cold may be similarly useful",
      "See the Adult Heat Pack and Ice Pack Use Procedure"
    ], exclude: s => s.epidural ? "Warm packs must not be used by women with epidural analgesia (risk of burns due to altered sensation)" : null,
      caution: "Warm packs must not be used by women with epidural analgesia (risk of burns due to altered sensation)" },
    { name: "Water immersion (§4.1.5)", items: [
      "Water immersion in the first stage reduces perception of pain and the use of epidural analgesia",
      "No evidence of increased adverse outcomes for fetus, neonate or woman, but further research is required",
      "Aromatherapy products in the water are not advised; adhere stringently to water quality, temperature and infection control policies",
      "See the Water Immersion for Labour and Birth – Procedure"
    ], info: [PATIENT_INFO.water] },
    { name: "Sterile water injection (§4.1.6)", items: [
      "Little robust evidence of effectiveness for low back or other labour pain; no difference in birth or other maternal or fetal outcomes",
      "See the Intradermal Injections of Sterile Water – Administration of – Procedure"
    ] },
    { name: "TENS (§4.1.7)", items: [
      "Non-invasive, drug-free; seems particularly effective if commenced early in labour; weak evidence that it reduces pain; no impact on other outcomes",
      "Two electrodes vertically over the back, parallel to the spine, between T10 and S4",
      "Low-frequency intermittent or high-frequency continuous current; can be modified during use; practise with the equipment before use",
      "Women should have the choice of using it in labour"
    ], exclude: s => s.water ? "TENS cannot be used in conjunction with water immersion" : s.fse ? "Potential electronic interference with a fetal scalp electrode precludes TENS" : null,
      caution: "Cannot be used with water immersion, or with a fetal scalp electrode during electronic fetal monitoring" },
    { name: "Self-hypnosis (§4.1.8)", items: [
      "Self-hypnosis and post-hypnotic suggestion can be effective for suitable women",
      "Discuss care options with women who have attended HypnoBirthing® or Calm Birth® classes, to determine what care will assist or hinder their technique"
    ] },
    { name: "Music (§4.1.9)", items: [
      "Listening to music may reduce pain intensity and opioid requirements, but the benefit is small and its clinical importance unclear"
    ] }
  ];

  // §4.2.1 — nitrous oxide
  const N2O_CI = [
    { key: "hold", label: "Unable to hold the facemask/mouthpiece by herself" },
    { key: "conscious", label: "Impaired consciousness or intoxication" },
    { key: "oxygenation", label: "Impaired oxygenation", hint: "e.g. upper respiratory tract infection or respiratory disease" },
    { key: "sedation", label: "Has received excessive amounts of IV opioids or benzodiazepines" },
    { key: "b12", label: "Vitamin B12 deficient or using vitamin B12 supplements" },
    { key: "ear", label: "Ear surgery or inner ear obstruction" },
    { key: "fetus", label: "Compromised fetus" },
    { key: "haemo", label: "Haemodynamically unstable" }
  ];

  // Appendix A — morphine
  const MORPH_CI = [
    { key: "allergy", label: "Hypersensitivity or allergy to morphine" },
    { key: "resp", label: "Severe respiratory depression", hint: "e.g. severe acute asthma or COPD" },
    { key: "biliary", label: "Biliary conditions, particularly spasm" },
    { key: "icp", label: "Raised intracranial or cerebrospinal pressure" },
    { key: "cns", label: "Severe CNS depression" },
    { key: "arrhythmia", label: "Cardiac arrhythmias" },
    { key: "gi", label: "GI obstruction" },
    { key: "epilepticus", label: "Status epilepticus" },
    { key: "hepRenal", label: "Severe hepatic or renal disease" },
    { key: "maoi", label: "MAOI (e.g. phenelzine, tranylcypromine) concurrently or within 14 days" },
    { key: "liver", label: "Precaution: liver disease", precaution: true },
    { key: "liverDys", label: "Precaution: liver dysfunction", hint: "Fatty liver, pre-eclampsia with abnormal LFTs", precaution: true }
  ];

  // §4.2.3 — epidural
  const EPI_ABS = [
    { key: "refusal", label: "Maternal refusal" },
    { key: "allergy", label: "Allergy", hint: "True allergy to amide local anaesthetics is rare" },
    { key: "localInf", label: "Local infection" },
    { key: "hypovol", label: "Uncorrected hypovolaemia" },
    { key: "coag", label: "Coagulopathy", hint: "Guidelines suggest neuraxial procedures are safe with platelets >80 × 10⁹/L and INR <1.4, but clinical judgement for each woman is paramount" }
  ];
  const EPI_REL = [
    { key: "haem", label: "Relative: expectation of significant haemorrhage" },
    { key: "sysInf", label: "Relative: untreated systemic infection", hint: "Once treated with antibiotics, the risk of seeding infection into the epidural space is minimal" },
    { key: "cardiac", label: "Precaution: specific cardiac disease", hint: "e.g. severe valvular stenosis, Eisenmenger's syndrome, peripartum cardiomyopathy" },
    { key: "back", label: "Precaution: ‘bad back’ or previous back surgery", hint: "Including metal within the spine" }
  ];

  const EPI_COMPLICATIONS = [
    "Hypotension — 1:20 (common)",
    "Patchy block or block failure requiring resiting — 1:8 (common)",
    "Headache from dural puncture — 1:100 (uncommon)",
    "Nerve damage — less than 1:13,000 (very rare)",
    "Epidural infection / meningitis — 1:100,000 (very rare)",
    "Unexpected anaesthetic spread — 1:100,000 (very rare)",
    "Severe injury, including paralysis — 1:250,000 (extremely rare)"
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

  function ynField(name, key, labelText, hint) {
    const cur = state[key] === undefined ? undefined : (state[key] ? "yes" : "no");
    return `<div class="field"><label>${labelText}</label>${hint ? `<div class="hint">${hint}</div>` : ""}${radio(name, "no", "No", cur)}${radio(name, "yes", "Yes", cur)}</div>`;
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
  function appendCard(name, sections, open, status, infos) {
    const card = document.createElement("div");
    card.className = "modality-card" + (status ? " " + status.cls : "") + (open ? " open" : "");
    card.innerHTML = `<div class="modality-head"><span class="modality-name">${name}</span>${status ? `<span class="badge ${status.cls}">${status.label}</span>` : ""}</div><div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    sections.forEach(([title, items, checkable]) => body.appendChild(detailSection(title, items, checkable)));
    (infos || []).forEach(pi => body.appendChild(patientInfoLink(pi)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
  }

  // Mandatory multi-select with "None of the above". items: [{key, label, hint}].
  function mandatoryMultiSelect(items, onContinue, preset) {
    const prefix = "ms" + (checkIdCounter++) + "_";
    const wrap = document.createElement("div");
    wrap.innerHTML = items.map(it => `
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}${it.key}" data-key="${it.key}"${preset && preset.includes(it.key) ? " checked" : ""}>
        <label for="${prefix}${it.key}"><span class="row-title">${it.label}</span>${it.hint ? `<span class="row-hint">${it.hint}</span>` : ""}</label>
      </div>`).join("") + `
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}none"${preset && preset.length === 0 ? " checked" : ""}>
        <label for="${prefix}none"><span class="row-title">None of the above</span></label>
      </div>`;
    app.appendChild(wrap);

    const findingBoxes = Array.from(wrap.querySelectorAll("input[data-key]"));
    const noneBox = wrap.querySelector("#" + prefix + "none");

    const errorMsg = document.createElement("p");
    errorMsg.className = "field-error";
    errorMsg.style.display = "none";
    errorMsg.textContent = "Please select at least one option, or choose \"None of the above\", to continue.";
    app.appendChild(errorMsg);

    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "btn btn-primary";
    continueBtn.textContent = "Continue";
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "actions-row";
    actionsWrap.appendChild(continueBtn);
    app.appendChild(actionsWrap);

    function anySelected() { return noneBox.checked || findingBoxes.some(cb => cb.checked); }
    function refreshState() {
      continueBtn.disabled = !anySelected();
      if (anySelected()) errorMsg.style.display = "none";
    }
    refreshState();

    noneBox.addEventListener("change", () => {
      if (noneBox.checked) findingBoxes.forEach(cb => { cb.checked = false; });
      refreshState();
    });
    findingBoxes.forEach(cb => cb.addEventListener("change", () => {
      if (cb.checked) noneBox.checked = false;
      refreshState();
    }));

    continueBtn.addEventListener("click", () => {
      if (!anySelected()) { errorMsg.style.display = "block"; return; }
      onContinue(findingBoxes.filter(cb => cb.checked).map(cb => cb.dataset.key));
    });
  }

  function formScreen(phase, title, subtitle, html, onSubmit) {
    screenShell(phase, title, subtitle);
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    const val = n => (wrap.querySelector(`input[name=${n}]:checked`) || {}).value;
    app.appendChild(actionsRow([{ label: "Continue", primary: true, onClick: () => {
      const missing = onSubmit(val, wrap);
      if (missing && missing.length) { err.textContent = "Please answer: " + missing.join(", ") + "."; err.style.display = "block"; }
    } }]));
  }

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  const label = (list, key) => (list.find(x => x.key === key) || {}).label;

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "situation": return screenSituation();
      case "option": return screenOption();
      case "n2oCI": return screenN2oCI();
      case "morphElig": return screenMorphElig();
      case "morphCI": return screenMorphCI();
      case "epiAbs": return screenEpiAbs();
      case "epiRel": return screenEpiRel();
      case "plan": return screenPlan();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "Labour Pain Options", "Non-pharmacological and pharmacological options for labour pain: who can use each, contraindications, dosing, procedure, observations and documentation.");
    app.appendChild(banner("info", "Before you start", [
      "Options for pain relief should ideally be explored and discussed in the antenatal period, with written information for the woman and her family.",
      "Encourage the woman to take an active role in decisions about her labour pain management, with information about all available techniques.",
      "All forms of pharmacological analgesia have benefits and side-effects — discuss them, preferably before or in early labour, so she can make an informed choice.",
      "Where the guideline is ambiguous or inconsistent, this page follows the site owner's interpretation (see ‘Source notes’ on the plan screen)."
    ]));
    app.appendChild(actionsRow([{ label: "Start", primary: true, onClick: () => go("situation") }]));
  }

  function screenSituation() {
    formScreen(0, "Current situation", "Used to flag options that must not be used.",
      ynField("epidural", "epidural", "Epidural analgesia in situ?") +
      ynField("water", "water", "In water, or planning water immersion?") +
      ynField("fse", "fse", "Fetal scalp electrode in use?"),
      (val) => {
        const m = [];
        ["epidural", "water", "fse"].forEach((k, i) => { if (!val(k)) m.push(["epidural", "water immersion", "fetal scalp electrode"][i]); });
        if (m.length) return m;
        state.epidural = val("epidural") === "yes"; state.water = val("water") === "yes"; state.fse = val("fse") === "yes";
        go("option");
      });
  }

  function screenOption() {
    screenShell(1, "Option", "Which option is being considered?");
    const opt = (key, next) => () => { state.option = key; go(next); };
    app.appendChild(optionList([
      { label: "Non-pharmacological methods", hint: "Support, relaxation, positioning, warm/cold packs, water, sterile water, TENS, self-hypnosis, music", onClick: opt("nonpharm", "plan") },
      { label: "Nitrous oxide / oxygen (N₂O/O₂)", hint: "Inhalational analgesia", onClick: opt("n2o", "n2oCI") },
      { label: "Morphine IM", hint: "Standing Order SO/14 (Birth Centre / Assessment Centre)", onClick: opt("morphine", "morphElig") },
      { label: "Epidural (regional analgesia)", onClick: opt("epidural", "epiAbs") },
      { label: "Intravenous PCA (fentanyl)", hint: "May be of use where an epidural is contraindicated", onClick: opt("pca", "plan") }
    ]));
  }

  function screenN2oCI() {
    screenShell(2, "Nitrous oxide — contraindications", "N₂O/O₂ must not be used if the woman has any of the following. (required)");
    mandatoryMultiSelect(N2O_CI, keys => { state.n2oCI = keys; go("plan"); }, state.n2oCI);
  }

  function screenMorphElig() {
    const v = x => (x === undefined || x === null) ? "" : x;
    const setCur = state.setting;
    formScreen(2, "Morphine — eligibility", "Morphine may be given when a woman has been diagnosed in labour (Labour and Birth – Guideline).",
      `<div class="field"><label>Where is she?</label>
        ${radio("setting", "bc", "Birth Centre or Assessment Centre", setCur)}
        ${radio("setting", "other", "Another ward or area", setCur)}</div>` +
      ynField("diag", "diagnosed", "Diagnosed in labour (per the Labour and Birth – Guideline)?") +
      ynField("early", "early", "In early labour?", "Morphine outside the Birth Centre / Assessment Centre is only for women in early labour") +
      ynField("term", "term", "At term?") +
      ynField("healthy", "healthy", "Healthy woman?", "SO/14 applies to healthy women at term") +
      ynField("epi", "consideringEpidural", "Considering regional analgesia (epidural)?") +
      ynField("imminent", "imminent", "Is birth considered imminent?", "Morphine should not be administered if birth is considered imminent") +
      `<div class="field"><label for="weightInput">Weight (kg)</label><div class="hint">Document weight in the EMR before administration</div>
        <input type="number" min="25" max="300" step="0.1" id="weightInput" value="${v(state.weight)}"></div>`,
      (val) => {
        const m = [];
        const fields = [["setting", "setting"], ["diag", "diagnosis of labour"], ["early", "early labour"], ["term", "term"], ["healthy", "healthy"], ["epi", "considering epidural"], ["imminent", "birth imminent"]];
        fields.forEach(([n, l]) => { if (!val(n)) m.push(l); });
        const w = parseFloat(document.getElementById("weightInput").value);
        if (!(w >= 25 && w <= 300)) m.push("weight");
        if (m.length) return m;
        Object.assign(state, { setting: val("setting"), diagnosed: val("diag") === "yes", early: val("early") === "yes", term: val("term") === "yes",
          healthy: val("healthy") === "yes", consideringEpidural: val("epi") === "yes", imminent: val("imminent") === "yes", weight: w });
        go("morphCI");
      });
  }

  function screenMorphCI() {
    screenShell(2, "Morphine — contraindications and precautions (Appendix A)", "Does the woman have any of the following? (required)");
    mandatoryMultiSelect(MORPH_CI, keys => { state.morphCI = keys; go("plan"); }, state.morphCI);
  }

  function screenEpiAbs() {
    screenShell(2, "Epidural — absolute contraindications", "Does the woman have any of the following? (required)");
    mandatoryMultiSelect(EPI_ABS, keys => { state.epiAbs = keys; go(keys.length ? "plan" : "epiRel"); }, state.epiAbs);
  }

  function screenEpiRel() {
    screenShell(2, "Epidural — relative contraindications and precautions", "Do any of the following apply? (required)");
    mandatoryMultiSelect(EPI_REL, keys => { state.epiRel = keys; go("plan"); }, state.epiRel);
  }

  // ---- morphine logic (§4.2.2, Appendix A, owner decisions) ------------------------

  // Returns { verdict: "so14"|"order"|"notPermitted"|"doNotGive", title, reasons[] }
  function morphineVerdict() {
    const ci = (state.morphCI || []).filter(k => !MORPH_CI.find(c => c.key === k).precaution).map(k => label(MORPH_CI, k));
    if (!state.diagnosed) return { verdict: "doNotGive", title: "Do not give morphine — labour not diagnosed",
      reasons: ["Morphine sulfate may be administered when a woman has been diagnosed in labour, in accordance with the Labour and Birth – Guideline (required in all settings)."] };
    if (state.imminent) return { verdict: "doNotGive", title: "Do not give morphine — birth considered imminent",
      reasons: ["Morphine should not be administered if birth is considered imminent."] };
    if (ci.length) return { verdict: "doNotGive", title: "Do not give morphine — contraindicated", reasons: ci };
    if (state.setting === "other") {
      if (!state.term || !state.early) return { verdict: "notPermitted", title: "Morphine not permitted outside the Birth Centre / Assessment Centre",
        reasons: ["Morphine can only be administered outside the Birth Centre / Assessment Centre to women who are term and in early labour, with a doctor's order.",
          !state.term ? "Not at term." : "Not in early labour.", "Take all necessary actions to facilitate admission to the Birth Centre."] };
      return { verdict: "order", title: "Morphine IM — doctor's order required (outside Birth Centre)",
        reasons: ["Term and in early labour, outside the Birth Centre / Assessment Centre — Standing Order SO/14 does not apply; medical staff must be informed and morphine prescribed."] };
    }
    const outside = [];
    if (!state.term) outside.push("not at term");
    if (!state.healthy) outside.push("not a healthy woman");
    if (state.consideringEpidural) outside.push("considering regional analgesia");
    if (outside.length) return { verdict: "order", title: "Morphine IM — outside SO/14 criteria: medical order required",
      reasons: ["SO/14 is for healthy women, at term, in labour, not considering regional analgesia. Here: " + outside.join("; ") + ".", "A medical order is required."] };
    return { verdict: "so14", title: "Morphine IM — may be given under Standing Order SO/14",
      reasons: ["Diagnosed in labour, at term, healthy, not considering regional analgesia, birth not imminent, no contraindications."] };
  }

  // ---- plan screens --------------------------------------------------------------------

  function screenPlan() {
    ({ nonpharm: planNonPharm, n2o: planN2o, morphine: planMorphine, epidural: planEpidural, pca: planPca })[state.option]();
    const refHead = document.createElement("h3");
    refHead.textContent = "Reference";
    app.appendChild(refHead);
    appendCard("Source notes — owner interpretations", [["Where the guideline was ambiguous or inconsistent", SOURCE_NOTES, false]], false);
    const pi = document.createElement("div");
    pi.appendChild(patientInfoLink(PATIENT_INFO.managing));
    app.appendChild(pi);
    finalActions();
  }

  function situationBanner() {
    const s = [];
    if (state.epidural) s.push("Epidural in situ");
    if (state.water) s.push("In water / planning water immersion");
    if (state.fse) s.push("Fetal scalp electrode in use");
    return banner("info", "Current situation", s.length ? s : ["No epidural, not in water, no fetal scalp electrode"]);
  }

  function planNonPharm() {
    screenShell(RESULT, "Non-pharmacological options");
    app.appendChild(situationBanner());
    app.appendChild(banner("info", "About non-pharmacological pain relief (§4.1)", [
      "Concentrates on the physical sensations of pain and on reducing pain perception by enhancing the psycho-emotional and spiritual components of care.",
      "Satisfaction is most influenced by expectations of duration and level of pain, quality of caregiver support, previous experience, and involvement in decision making."
    ]));
    NON_PHARM.forEach(m => {
      const ex = m.exclude ? m.exclude(state) : null;
      const sections = [["Key points", m.items, false]];
      if (m.caution) sections.push(["Caution", [m.caution], false]);
      appendCard(m.name, sections, false, ex ? { cls: "contraindicated", label: "Not suitable now" } : null, m.info);
      if (ex) app.lastChild.querySelector(".modality-body").prepend(banner("bad", "Not suitable in the current situation", [ex]));
    });
  }

  function planN2o() {
    const ci = (state.n2oCI || []).map(k => label(N2O_CI, k));
    if (ci.length) {
      screenShell(RESULT, "Do not use nitrous oxide");
      app.appendChild(banner("bad", "Nitrous oxide/oxygen must not be used", ci));
      app.appendChild(banner("info", "Alternatives", ["Discuss other options with the woman — non-pharmacological methods, morphine IM, epidural or IV PCA, as appropriate."]));
      return;
    }
    screenShell(RESULT, "Nitrous oxide / oxygen — may be used");
    app.appendChild(banner("ok", "About N₂O/O₂ (§4.2.1)", [
      "Eliminated via the lungs: transient, does not accumulate, leaves the maternal system within five minutes; no known side-effects on the fetus or neonate",
      "Can be used safely throughout labour, including the second stage if appropriate",
      "Timing (both as stated in the guideline): analgesia within 20–30 seconds, maximum effect after about 45 seconds; elsewhere, a time lag of approximately 50 seconds, shortened by deep, slow breaths",
      "Indications: active labour; uncomfortable minor assessments or procedures (vaginal examination, perineal repair, insertion of a cervical ripening balloon)"
    ]));
    app.appendChild(actionPanel("info", "Authorisation", [
      "Schedule 4 (prescription only): requires a doctor's order — OR administration by a midwife who has completed the designated education, under standing order, documented on the MAR"
    ]));
    app.appendChild(actionPanel("ok", "Procedure", [
      "Obtain verbal consent and exclude contraindications",
      "Explain the effects, risks, benefits and restrictions to use; coach her on correct use and advise she must self-administer to prevent over-dosage and loss of consciousness",
      "Demonstrate correct use — a good seal around the mouthpiece; inhale and exhale through the mouthpiece; supervise until confident and proficient",
      "Ensure the mouthpiece and circuit are correctly connected and unused",
      "Mid-O-Gas: turn on and commence at 30% N₂O / 70% O₂ — OR cylinder: turn on the gas flow, check there is enough gas, check the Entonox® apparatus works and connect a clean circuit",
      "Instruct her to breathe deeply at a normal rate from the onset of the contraction, continue throughout, stop at the end, and remove the mouthpiece between contractions",
      "Palpate contractions to help her recognise the onset as early as possible",
      "Continuously assess her pain and level of consciousness"
    ]));
    app.appendChild(banner("warn", "Dosing and precautions", [
      "Commence at 30% N₂O : 70% O₂; maintenance 50% : 50% should suffice for most women",
      "70% N₂O : 30% O₂ may depress consciousness and should rarely be necessary — if needed, consider alternative pain management",
      "Opioids before or during use: caution — consciousness is more easily affected",
      "Prolonged inhalation for more than 6 hours can inactivate vitamin B12. Do not use for longer than a total of 24 hours, or more frequently than every 4 days, unless under close medical supervision and haematological monitoring",
      "Side-effects (resolve on breathing room air): light-headedness, nausea/vomiting, dry mouth"
    ]));
    app.appendChild(actionPanel("bad", "Over-dosage", [
      "Observe for drowsiness, disorientation, lack of co-operation or aggressiveness, unconsciousness",
      "If over-dosage occurs: cease administration and protect her airway until she has recovered; N₂O/O₂ may be recommenced at a lower rate"
    ]));
    app.appendChild(actionPanel("info", "Documentation", [
      "Written medical order, or MAR completed if given under standing order",
      "Progress notes: time of commencement, starting dose and times of dose changes",
      "EMR: ongoing pain scores and response to analgesia",
      "Use the formal abbreviation N₂O/O₂"
    ]));
  }

  function planMorphine() {
    const v = morphineVerdict();
    screenShell(RESULT, v.title);
    const kind = { so14: "ok", order: "warn", notPermitted: "bad", doNotGive: "bad" }[v.verdict];
    app.appendChild(banner(kind, "Assessment", v.reasons));
    const prec = (state.morphCI || []).filter(k => MORPH_CI.find(c => c.key === k).precaution).map(k => label(MORPH_CI, k).replace("Precaution: ", ""));
    if (prec.length) app.appendChild(banner("warn", "Precautions (Appendix A)", prec.concat(["For full information see Morphine sulfate (MIMS)."])));
    if (v.verdict === "doNotGive" || v.verdict === "notPermitted") {
      if (v.verdict === "notPermitted") outsideBirthCentre();
      app.appendChild(banner("info", "Alternatives", ["Discuss other options with the woman — non-pharmacological methods, nitrous oxide, epidural or IV PCA, as appropriate."]));
      return;
    }
    const under50 = state.weight < MORPHINE_WEIGHT_KG;
    const dose = under50 ? "7.5 mg" : "10 mg";
    app.appendChild(actionPanel("ok", "Prescribe and give", [
      `<b>Morphine sulfate ${dose} IM, single dose</b> (weight ${state.weight} kg${under50 ? " — under 50 kg" : ""})`,
      v.verdict === "so14" ? "Under Standing Order SO/14 (Birth Centre / Assessment Centre only)" : "Medical order required",
      "Schedule 8: checked and signed by two registered midwives, documented in the EMR",
      "Anti-emetic: metoclopramide 10 mg IM per Standing Order SO/4 (version 3) if no known contraindication; any alternative anti-emetic needs a medical order"
    ]));
    app.appendChild(banner("info", "Further doses", under50
      ? ["A medical order is required for further doses.", "The further dose for women under 50 kg is not specified in the guideline — medical order required.", `Maximum ${MORPHINE_MAX_12H} mg in 12 hours; no earlier than ${MORPHINE_REPEAT_HOURS} hours from the previous dose.`]
      : ["A medical order is required for further doses.", `A further 5 mg IM may be prescribed if needed (maximum ${MORPHINE_MAX_12H} mg in 12 hours), no earlier than ${MORPHINE_REPEAT_HOURS} hours from the previous dose.`]));
    app.appendChild(actionPanel("info", "Before administration", [
      "No known contraindications (Appendix A)",
      "The woman is aware of all alternative pain management options for labour",
      "Full set of maternal observations and awareness of the progress of labour",
      "Dose considered with regard to her weight; weight documented in the EMR",
      "Room adequately stocked for maternal and neonatal oxygen support",
      "Explain anticipated and known side-effects for the woman and fetus, and the need for additional maternal observations",
      "Obtain verbal consent"
    ]));
    app.appendChild(actionPanel("info", "Administration", [
      "Full set of maternal observations (BP, HR, temperature, SpO₂, RR) recorded on the EMR",
      "Hand hygiene; prepare with aseptic technique",
      "Identification and allergy checks at the bedside with a second staff member",
      "Swab the site; IM into a large muscle — vastus lateralis (anterolateral aspect of the middle third of the thigh)",
      "Escalate any concerns or complications to the Midwife in Charge and Obstetric Medical Staff"
    ]));
    app.appendChild(actionPanel("warn", "Observations", [
      "Maternal: sedation score, pulse and respiratory rate half-hourly for the first hour, then hourly for 2 hours",
      "Excessive sedation and difficulty to rouse is a more accurate sign of overdose than a slow respiratory rate",
      "There may be reduced fetal heart rate variability (if CTG in progress)",
      "Neonatal: vital signs hourly for the first 4 hours (term neonate); anticipate resuscitation",
      "Advise the neonatal team of the dose and timing of morphine for all babies"
    ]));
    app.appendChild(actionPanel("bad", "Side-effects and overdose", [
      "Drowsiness: oxygen via face mask at 6 L/min (40%)",
      "Respiratory depression (RR &lt;8/min): advise a medical officer and give naloxone as prescribed",
      "Overdose (Appendix A): maintain ventilation, oxygen, naloxone 0.4–2 mg IV repeated every 2–3 minutes; if no response after 10 mg, question the diagnosis of narcotic overdose",
      "Nausea: anti-emetics. Unrelieved urinary retention: may need an IDC. Constipation: hydration and fibre; laxatives may be required"
    ]));
    app.appendChild(actionPanel("info", "Documentation", [
      v.verdict === "so14" ? "SO/14: MAR, once-only / pre-medication / nurse-initiated medicines section, per the Standing Orders guideline" : "Medical prescription in the MAR once-only section; administering midwife signs per the Medication Management – Guideline",
      "Pain Management section of the Birth Centre flowsheet; dose in the progress notes",
      "Document the administration on the CTG if in progress (potential fetal sedative effects)"
    ]));
    if (state.setting === "other") outsideBirthCentre();
    appendCard("Morphine — educational notes (§4.2.2, Appendix A)", [["Notes", [
      "Onset about 20 minutes; peak effect about 70 minutes (§4.2.2) — Appendix A states 30–60 minutes",
      "Duration of analgesia 2 to 3 hours, but effects may extend up to 24 hours",
      "Rapidly crosses the placenta; the fetus and neonate excrete opioids more slowly",
      "Maternal side-effects: drowsiness, respiratory depression, nausea, dizziness, vomiting, urinary retention, constipation",
      "Neonatal side-effects: respiratory depression, decreased alertness, inhibition of suckling, lower Apgar scores, delay in effective feeding",
      "Preferred to pethidine: less toxic, longer acting, fewer addictive properties relating to staff misuse, as effective with fewer side-effects"
    ], false]], false);
  }

  function outsideBirthCentre() {
    app.appendChild(actionPanel("warn", "Outside the Birth Centre / Assessment Centre", [
      "Take all necessary actions to facilitate admission to the Birth Centre",
      "If she cannot be accommodated: the AUM escalates to the area managers (in hours) or After Hours Manager — advise that the urgency is the need to give morphine outside the Birth Centre (Demand and Escalation Response guideline)",
      "Medical staff must be informed and morphine prescribed — SO/14 does not apply outside the Birth Centre / Assessment Centre",
      "Regular observations as if in labour, whether labour has been diagnosed or not; maternal and fetal observations per the Labour and Birth – Guideline, including CEFM as clinically directed",
      "Neonatal resuscitation equipment must be available in the ward/department",
      "Transfer to the Birth Centre at the first opportunity"
    ]));
  }

  function planEpidural() {
    const abs = (state.epiAbs || []).map(k => label(EPI_ABS, k));
    if (abs.length) {
      screenShell(RESULT, "Epidural contraindicated");
      app.appendChild(banner("bad", "Absolute contraindication", abs));
      app.appendChild(banner("info", "Alternative", ["Intravenous PCA (fentanyl) may be of use where placement of an epidural is contraindicated (§4.2.4)."]));
      pcaDetails();
      return;
    }
    const rel = (state.epiRel || []).map(k => label(EPI_REL, k));
    screenShell(RESULT, rel.some(r => r.startsWith("Relative")) ? "Epidural — relative contraindication present" : "Epidural — no contraindication identified");
    app.appendChild(banner("info", "Indications (§4.2.3)", ["May benefit women having a long or painful labour, may be required on the grounds of fetal benefit, for maternal or obstetric indications, or at maternal request."]));
    if (rel.length) app.appendChild(banner("warn", "Relative contraindications / precautions", rel.map(r => r.replace(/^(Relative|Precaution): /, "")).concat(
      rel.some(r => r.includes("cardiac")) ? ["Cardiac disease: extreme care to avoid rapid changes in blood pressure, preload and afterload; intrathecal opioid without local anaesthetic may be advantageous; epidural may offer better haemodynamic control for some women"] : [],
      rel.some(r => r.includes("back")) ? ["Back surgery does not contraindicate regional analgesia, but scarring may limit effectiveness and increase inadvertent dural puncture; metal in the spine can cause technical difficulties; intrathecal techniques can be expected to work normally"] : [])));
    app.appendChild(actionPanel("ok", "Discuss side-effects with the woman before administration", [
      "More likely to have a longer second stage of labour",
      "Reduced expulsive urge to push",
      "May require oxytocin augmentation if in spontaneous labour",
      "May experience lowered blood pressure when not adequately hydrated",
      "Limited mobility during labour",
      "Itchiness"
    ]));
    app.appendChild(actionPanel("info", "Care", [
      "Reduced motor function and sensation in the legs, and impaired bladder function — an indwelling urinary catheter is recommended",
      "Warm packs must not be used (potential for burns due to altered sensation)",
      "Low-dose (ropivacaine/fentanyl) patient-controlled epidural analgesia (PCEA) is associated with high maternal satisfaction",
      "See the Epidural Management – Guideline"
    ]));
    appendCard("Complications (§4.2.3)", [["Ratio and frequency", EPI_COMPLICATIONS, false]], true, null, [PATIENT_INFO.epidural]);
  }

  function pcaDetails() {
    app.appendChild(actionPanel("info", "Intravenous PCA (§4.2.4)", [
      "Total drug requirement is usually less than with IM narcotics or a continuous IV infusion",
      "Fentanyl (10 microgram/mL) is the medicine of choice",
      "Satisfactory pain scores with 10–20 microgram boluses, lockout interval 3–5 minutes",
      "Other opioids such as morphine may be used by PCA, and can be effective for labour in termination of pregnancy or induction for fetal death in utero",
      "Side-effects are similar to other narcotics",
      "See the Patient Controlled Analgesia (PCA) – Procedure"
    ]));
  }

  function planPca() {
    screenShell(RESULT, "Intravenous PCA (fentanyl)");
    app.appendChild(banner("info", "When", ["May be of use for women where placement of an epidural is contraindicated."]));
    pcaDetails();
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
