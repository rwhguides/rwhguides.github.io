/* ============================================================================
   Safe Timing of Birth
   Decision-support logic derived from:
   "Safe Timing of Birth - Guideline", RWH0211246 v2.0, The Royal Women's
   Hospital, Maternity Services. Last review 02/02/2026.
   This is an independent companion resource, not an official RWH product.

   The §4 table is reproduced in CONDITIONS below so it can be checked row by
   row. Where the table is ambiguous, this page follows the site owner's
   interpretation — see SOURCE_NOTES (also shown on the page).
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Conditions", "Details", "Proposed timing", "Result"];
  const RESULT = PHASES.length - 1;

  const ELECTIVE_FROM = 39; // purpose: minimise births before 39 weeks without a medical indication
  const ga = (w, d) => w + (d || 0) / 7;
  const fmtGa = x => { const w = Math.floor(x + 1e-9); const d = Math.round((x - w) * 7); return `${w}+${d}`; };

  const PATIENT_INFO = [
    { url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/labour-birth/induction-of-labour", label: "Induction of labour — patient information (The Women's)" },
    { url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/labour-birth/caesarean-birth", label: "Caesarean birth — patient information (The Women's)" }
  ];

  const SOURCE_NOTES = [
    "<b>Several conditions:</b> the guideline does not say how to combine conditions. This page lists every applicable window, sorted earliest first, and highlights the earliest — the decision remains individualised and shared with the woman.",
    "<b>Cholestasis:</b> peak bile acids of exactly 100 micromol/L are treated as severe (≥100), matching the guideline's note that stillbirth risk increases ‘once bile acids are 100 micromol/L or more’ (the table says &gt;100).",
    "<b>PPROM with signs of maternal or fetal compromise:</b> the table's ‘&lt;34+0 weeks’ is shown as ‘birth indicated, including before 34+0 weeks’.",
    "<b>Alloimmunisation:</b> a titre of exactly 1:32 is treated with &gt;1:32 (decision made with the MFM service).",
    "<b>Gestational diabetes:</b> exactly 100 units/day of insulin is treated with &gt;100 units/day (38+0–39+0).",
    "<b>Obesity:</b> BMI ≥40 → offer 39+0–40+0; BMI ≥50 → recommend 38+0–39+0 (the table says &gt;40 and &gt;50). The guideline also notes a lack of high-level evidence for BMI 30–49 and that management needs to be individualised.",
    "<b>Table layout readings:</b> in the caesarean row, previous classical → 38 weeks onwards and ≥3 prior caesareans → 39 weeks onwards (previous myomectomy has its own row: 39 weeks onwards). In the pre-eclampsia row, features of severe disease → individualised; asymptomatic with good control → 37+0–38+0.",
    "<b>Proposed gestation check:</b> flags only when the proposed gestation is earlier than a window's earliest gestation, or later than a ‘no later than’ limit. Upper ends of ranges are not used to flag."
  ];

  // window types: onwards / range / at (from); by (no later than: to); urgent; individual; mfm; usual; notRoutine; tba; clinical
  const W = {
    onwards: (from, text) => ({ type: "onwards", from, text: text || `${fmtGa(from)} onwards` }),
    range: (from, text) => ({ type: "range", from, text }),
    at: (from, text) => ({ type: "at", from, text }),
    by: (to, text) => ({ type: "by", to, text: text || `No later than ${fmtGa(to)} weeks` }),
    other: (type, text) => ({ type, text })
  };

  const CONDITIONS = [
    { key: "ama", label: "Advanced maternal age (40 or over)", window: W.onwards(39, "39+0 onwards"),
      note: "Initiate shared decision-making regarding birth from 39+0 weeks in the absence of an indication for an earlier birth.", related: "No specific CPG" },
    { key: "allo", label: "Alloimmunisation", related: "Red Cell Antibody Testing – Procedure; Intrauterine Transfusion Guideline", options: [
      { key: "stable", label: "Titres of HDFN-causing antibodies (other than Kell) stable at <1:32", window: W.onwards(38, "38+0 onwards") },
      { key: "high", label: "Antibody (HDFN) titre ≥1:32, OR anti-Kell", window: W.other("mfm", "Decision made with the MFM service") }
    ] },
    { key: "anomaly", label: "Fetal anomalies", window: W.onwards(39, "39+0 onwards"), note: "Individualise based on the presence of other risk factors." },
    { key: "icp", label: "Cholestasis (intrahepatic cholestasis of pregnancy)", related: "Intrahepatic Cholestasis of Pregnancy – Guideline; Obstetric Cholestasis (RANZCOG)", options: [
      { key: "mild", label: "Peak bile acids 19–39 micromol/L (mild) and no other risk factors", window: W.range(39, "39–40 weeks"),
        note: "Advise that the risk of stillbirth is similar to the background risk. For isolated ICP in a singleton pregnancy, stillbirth risk only increases above the population rate once bile acids are 100 micromol/L or more." },
      { key: "moderate", label: "Peak bile acids 40–99 micromol/L (moderate) and no other risk factors", window: W.range(37, "37–38+6 weeks"),
        note: "Advise that the known risk of stillbirth is similar to the background risk until 38–39 weeks." },
      { key: "severe", label: "Peak bile acids ≥100 micromol/L (severe)", window: W.range(34, "34–36 weeks"),
        note: "Advise that the risk of stillbirth is higher than the background risk." }
    ] },
    { key: "cs", label: "Previous caesarean section", options: [
      { key: "classical", label: "Previous classical caesarean", window: W.onwards(38, "38 weeks onwards") },
      { key: "three", label: "≥3 prior caesarean births", window: W.onwards(39, "39 weeks onwards") }
    ] },
    { key: "dehiscence", label: "Uterine dehiscence, without full-thickness rupture", window: W.range(37, "37–38 weeks") },
    { key: "predm", label: "Diabetes — pre-existing", related: "Diabetes Mellitus: Management of Pre-Existing Diabetes Mellitus in Pregnancy – Guideline",
      note: "There will be occasions on which earlier birth is indicated, e.g. particularly poor control with fetal macrosomia, or complications such as pre-eclampsia.", options: [
      { key: "optimal", label: "Optimal glycaemic control, no macrosomia", window: W.onwards(38, "38+0 onwards") },
      { key: "suboptimal", label: "Suboptimal glycaemic control, significantly unstable BSLs, or FGR", window: W.onwards(37, "37+0 onwards") }
    ] },
    { key: "gdm", label: "Diabetes — gestational", related: "Diabetes Mellitus: Management of Gestational Diabetes – Guideline", options: [
      { key: "diet", label: "Diet-controlled and no other perinatal concerns", window: W.other("usual", "Usual maternity care as for women without diabetes") },
      { key: "insulinLow", label: "Insulin-treated, total dose <100 units/day, good glycaemic control and fetal growth", window: W.onwards(39, "39+0 onwards") },
      { key: "insulinHigh", label: "Insulin-treated, requiring ≥100 units/day", window: W.range(38, "38+0–39+0") },
      { key: "suboptimal", label: "Suboptimal control, significant decrease in insulin requirement, FGR or macrosomia on ultrasound", window: W.at(38, "Aim 38+0 weeks, with earlier birth if clinically indicated") }
    ] },
    { key: "fgr", label: "Fetal growth restriction / SGA", related: "Fetal Growth Restriction Management – Guideline",
      note: "Seek multidisciplinary input and arrange a prenatal consultation with neonatal medical staff if preterm delivery is anticipated. At very preterm gestations, make a careful decision regarding viability together with the parents.", options: [
      { key: "good", label: "Good interval growth, normal amniotic fluid and Doppler parameters", window: W.range(38, "38–40 weeks") },
      { key: "pi", label: "Increased UA PI with positive end-diastolic flow", window: W.at(37, "Delivery should be considered at 37 weeks") },
      { key: "aedf", label: "UA absent end-diastolic flow (AEDF)", window: W.by(34, "Delivery no later than 34 weeks") },
      { key: "redf", label: "UA reversed end-diastolic flow (REDF)", window: W.by(30, "Delivery no later than 30 weeks") }
    ] },
    { key: "htn", label: "Hypertension — isolated (pre-existing or gestational)", related: "Hypertensive Disorders in Pregnancy – Guideline", options: [
      { key: "controlled", label: "Medicated, well controlled, stable, uncomplicated", window: W.onwards(39, "39+ weeks") },
      { key: "suboptimal", label: "Suboptimal blood pressure control or other complications", window: W.other("clinical", "As clinically indicated") }
    ] },
    { key: "ivf", label: "IVF pregnancy", window: W.onwards(39, "39+0 weeks onwards"),
      note: "In the absence of an indication for an earlier birth, the earliest gestation at which elective birth should be considered is 39+0 weeks.", related: "No specific CPG" },
    { key: "macro", label: "Suspected fetal macrosomia", window: W.onwards(39, "39+0 onwards"),
      note: "IOL is generally not recommended. The evidence base is limited and heterogeneous, and antenatal ultrasound predicts neonatal macrosomia poorly — individualise with shared decision-making that incorporates other risk factors (e.g. clinically large fetus, increased maternal BMI).",
      related: "Induction of Labour (IOL) – Parkville Campus – Procedure; Induction of labour (Safer Care Victoria)" },
    { key: "mental", label: "Maternal mental health", window: W.onwards(39, "39+0 onwards"),
      note: "Individualise based on impact on the mother; the decision on timing of birth is documented by the mental health provider.", related: "Mental Health Issues Recognition, Response and Referral Procedure" },
    { key: "multiple", label: "Multiple pregnancy", note: "Individualise care based on risk factors.",
      related: "Monochorionic Monoamniotic Multiple Pregnancy – Management – Guideline; Multiple Pregnancy – Planned Vaginal Birth and Intrapartum Management of Twins – Procedure", options: [
      { key: "mcma", label: "Monochorionic monoamniotic (MCMA)", window: W.at(32, "32 weeks") },
      { key: "mcda", label: "Monochorionic diamniotic (MCDA)", window: W.at(36, "36 weeks") },
      { key: "dcda", label: "Dichorionic diamniotic (DCDA)", window: W.at(37, "37 weeks") },
      { key: "higher", label: "Higher-order multiples", window: W.other("tba", "TBA") }
    ] },
    { key: "myomectomy", label: "Previous myomectomy", window: W.onwards(39, "39 weeks onwards") },
    { key: "obesity", label: "Maternal obesity", note: "Lesser degrees of obesity carry a less pronounced increase in stillbirth risk. There is a lack of high-level evidence for BMI 30–49 kg/m², and management needs to be individualised.", options: [
      { key: "50", label: "BMI ≥50", window: W.range(38, "Recommend 38+0–39+0 weeks") },
      { key: "40", label: "BMI 40 to under 50", window: W.range(39, "Offer 39+0–40+0 weeks") },
      { key: "under40", label: "BMI under 40", window: W.other("notRoutine", "In the absence of other risk factors, induction is not routinely indicated") }
    ] },
    { key: "pad", label: "Placental adhesive disorders", related: "Placental Adhesive Disorders – Guideline", options: [
      { key: "praevia", label: "Placenta praevia — asymptomatic", window: W.onwards(38, "38+0 onwards") },
      { key: "accreta", label: "Placenta accreta spectrum", window: W.onwards(35, "35+0 onwards") }
    ] },
    { key: "postdates", label: "Post dates", window: W.onwards(ga(41, 3), "41+3 onwards"), note: "Confirm EDD accuracy.",
      related: "Induction of Labour (IOL) – Parkville Campus – Procedure; Standard Antenatal Check – Guideline" },
    { key: "pet", label: "Pre-eclampsia", related: "Hypertensive Disorders in Pregnancy – Guideline", options: [
      { key: "severe", label: "Any features of severe disease", window: W.other("individual", "Care individualised based on severity of disease and impact on mother and/or fetus") },
      { key: "mild", label: "Asymptomatic, good blood pressure control, no features of severe disease", window: W.range(37, "37+0–38+0") }
    ] },
    { key: "pprom", label: "Preterm prelabour rupture of membranes (PPROM)", note: "Low threshold for birth if there is evidence of chorioamnionitis or fetal compromise.",
      related: "Rupture of the Membranes – Preterm Premature (PPROM) – Guideline", options: [
      { key: "compromise", label: "Any signs of maternal or fetal compromise", window: W.other("urgent", "Birth indicated — including before 34+0 weeks") },
      { key: "stable", label: "No signs of chorioamnionitis, on antibiotic therapy (regardless of GBS status)", window: W.at(37, "37+0 weeks") }
    ] },
    { key: "vasa", label: "Vasa praevia — asymptomatic", window: W.onwards(36, "36+0 onwards"), related: "Vasa praevia (RANZCOG)" }
  ];

  // ---- state machine ----------------------------------------------------------

  let state = {};
  let navStack = [];
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

  function detailSection(title, items) {
    const wrap = document.createElement("div");
    const h4 = document.createElement("h4");
    h4.textContent = title;
    wrap.appendChild(h4);
    const ul = document.createElement("ul");
    items.forEach(i => { const li = document.createElement("li"); li.innerHTML = i; ul.appendChild(li); });
    wrap.appendChild(ul);
    return wrap;
  }

  function appendCard(name, sections, open, status) {
    const card = document.createElement("div");
    card.className = "modality-card" + (status ? " " + status.cls : "") + (open ? " open" : "");
    card.innerHTML = `<div class="modality-head"><span class="modality-name">${name}</span>${status ? `<span class="badge ${status.cls}">${status.label}</span>` : ""}</div><div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    sections.forEach(([title, items]) => body.appendChild(detailSection(title, items)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
    return card;
  }

  function mandatoryMultiSelect(items, onContinue, preset) {
    const prefix = "ms" + (checkIdCounter++) + "_";
    const wrap = document.createElement("div");
    wrap.innerHTML = items.map(it => `
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}${it.key}" data-key="${it.key}"${preset && preset.includes(it.key) ? " checked" : ""}>
        <label for="${prefix}${it.key}"><span class="row-title">${it.label}</span></label>
      </div>`).join("") + `
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}none"${preset && preset.length === 0 ? " checked" : ""}>
        <label for="${prefix}none"><span class="row-title">None of these conditions</span></label>
      </div>`;
    app.appendChild(wrap);
    const findingBoxes = Array.from(wrap.querySelectorAll("input[data-key]"));
    const noneBox = wrap.querySelector("#" + prefix + "none");
    const errorMsg = document.createElement("p");
    errorMsg.className = "field-error";
    errorMsg.style.display = "none";
    errorMsg.textContent = "Please select at least one condition, or choose \"None of these conditions\", to continue.";
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
    function refreshState() { continueBtn.disabled = !anySelected(); if (anySelected()) errorMsg.style.display = "none"; }
    refreshState();
    noneBox.addEventListener("change", () => { if (noneBox.checked) findingBoxes.forEach(cb => { cb.checked = false; }); refreshState(); });
    findingBoxes.forEach(cb => cb.addEventListener("change", () => { if (cb.checked) noneBox.checked = false; refreshState(); }));
    continueBtn.addEventListener("click", () => {
      if (!anySelected()) { errorMsg.style.display = "block"; return; }
      onContinue(findingBoxes.filter(cb => cb.checked).map(cb => cb.dataset.key));
    });
  }

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  const condition = key => CONDITIONS.find(c => c.key === key);

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "conditions": return screenConditions();
      case "details": return screenDetails();
      case "proposed": return screenProposed();
      case "result": return screenResult();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "Safe Timing of Birth", "Recommended gestation for planned birth (induction of labour or planned caesarean) for common pregnancy conditions.");
    app.appendChild(banner("info", "Before you start", [
      "Aim: minimise births following induction of labour or planned caesarean before 39 weeks without a medical indication. Being born too early remains the leading cause of death and disability in children up to five years of age in the developed world.",
      "Decisions on timing of birth in the presence of complications cannot be exact. Consider the overall clinical scenario and other available evidence, and use shared decision-making with the woman and her family.",
      "The table is not exhaustive, and does not cover other aspects of managing these conditions — consult the relevant condition-specific guideline.",
      "Obstetricians make timing decisions by booking induction of labour or planned caesarean; midwives provide care and education."
    ]));
    app.appendChild(actionsRow([{ label: "Start", primary: true, onClick: () => go("conditions") }]));
  }

  function screenConditions() {
    screenShell(0, "Conditions", "Which of the following apply? Tick all that apply. (required)");
    mandatoryMultiSelect(CONDITIONS.map(c => ({ key: c.key, label: c.label })), keys => {
      state.conditions = keys;
      state.choices = state.choices || {};
      go(keys.some(k => condition(k).options) ? "details" : "proposed");
    }, state.conditions);
  }

  function screenDetails() {
    screenShell(1, "Details", "Choose the description that applies for each condition.");
    const wrap = document.createElement("div");
    const withOpts = state.conditions.map(condition).filter(c => c.options);
    wrap.innerHTML = withOpts.map(c => `
      <div class="field"><label>${c.label}</label>
        ${c.options.map(o => radio("opt_" + c.key, o.key, o.label, (state.choices || {})[c.key])).join("")}
      </div>`).join("");
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([{ label: "Continue", primary: true, onClick: () => {
      const missing = [];
      const choices = {};
      withOpts.forEach(c => {
        const v = (wrap.querySelector(`input[name=opt_${c.key}]:checked`) || {}).value;
        if (!v) missing.push(c.label); else choices[c.key] = v;
      });
      if (missing.length) { err.textContent = "Please choose an option for: " + missing.join("; ") + "."; err.style.display = "block"; return; }
      state.choices = choices;
      go("proposed");
    } }]));
  }

  function screenProposed() {
    screenShell(2, "Proposed timing (optional)", "Enter a proposed gestation for planned birth to check it against the recommended windows, or skip.");
    const v = x => (x === undefined || x === null) ? "" : x;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="field"><label for="pwInput">Weeks</label><input type="number" min="20" max="43" step="1" id="pwInput" value="${v(state.pw)}"></div>
      <div class="field"><label for="pdInput">Days</label><input type="number" min="0" max="6" step="1" id="pdInput" placeholder="0–6" value="${v(state.pd)}"></div>`;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([
      { label: "Skip", onClick: () => { state.pw = null; state.pd = null; go("result"); } },
      { label: "Check", primary: true, onClick: () => {
        const w = parseInt(document.getElementById("pwInput").value, 10);
        const dRaw = document.getElementById("pdInput").value.trim();
        const d = dRaw === "" ? 0 : parseInt(dRaw, 10);
        if (isNaN(w) || w < 20 || w > 43 || isNaN(d) || d < 0 || d > 6) { err.textContent = "Please enter weeks (20–43) and days (0–6), or choose Skip."; err.style.display = "block"; return; }
        state.pw = w; state.pd = d;
        go("result");
      } }
    ]));
  }

  // ---- result logic -----------------------------------------------------------------

  // Resolve each ticked condition to { cond, option, window }
  function applicable() {
    return (state.conditions || []).map(k => {
      const c = condition(k);
      const o = c.options ? c.options.find(x => x.key === state.choices[k]) : null;
      return { cond: c, option: o, window: o ? o.window : c.window, note: (o && o.note) || null };
    });
  }

  const numericStart = w => w.type === "onwards" || w.type === "range" || w.type === "at" ? w.from : w.type === "by" ? w.to : null;

  function check(w, p) {
    if (p === null) return null;
    if (w.type === "by") return p > w.to + 1e-9 ? { cls: "contraindicated", label: "Later than limit" } : { cls: "recommended", label: "Within limit" };
    if (w.type === "usual" || w.type === "notRoutine") return { cls: "reasonable", label: "No earlier window" };
    if (w.type === "urgent") return { cls: "contraindicated", label: "Birth indicated" };
    if (w.from === undefined) return { cls: "not-recommended", label: "Individualised" };
    return p < w.from - 1e-9 ? { cls: "contraindicated", label: "Earlier than window" } : { cls: "recommended", label: "At or after earliest" };
  }

  function screenResult() {
    const items = applicable();
    const p = (state.pw === null || state.pw === undefined) ? null : ga(state.pw, state.pd);
    screenShell(RESULT, items.length ? "Recommended timing of birth" : "No listed condition");

    if (!items.length) {
      app.appendChild(banner("info", "No condition from the table selected", [
        "The guideline aims to minimise births following induction of labour or planned caesarean before 39 weeks without a medical indication.",
        "Post dates: confirm EDD accuracy — 41+3 onwards.",
        "The table is not exhaustive; consult the relevant guideline for any other condition."
      ]));
      if (p !== null && p < ELECTIVE_FROM) app.appendChild(banner("bad", `Proposed ${fmtGa(p)} weeks — before 39+0 with no listed medical indication`, [
        "Planned birth before 39 weeks without a medical indication should be avoided. Review the indication and use shared decision-making."
      ]));
      else if (p !== null) app.appendChild(banner("ok", `Proposed ${fmtGa(p)} weeks`, ["At or after 39+0 weeks."]));
    } else {
      const urgent = items.filter(i => i.window.type === "urgent");
      const special = items.filter(i => ["mfm", "individual", "clinical", "tba"].includes(i.window.type));
      const numeric = items.filter(i => numericStart(i.window) !== null).sort((a, b) => numericStart(a.window) - numericStart(b.window));
      if (urgent.length) app.appendChild(banner("bad", "Birth indicated", urgent.map(i => `<b>${i.cond.label}</b> — ${i.option ? i.option.label : ""}: ${i.window.text}`)));
      if (special.length) app.appendChild(banner("warn", "Timing individualised or specialist decision", special.map(i => `<b>${i.cond.label}</b>${i.option ? " — " + i.option.label : ""}: ${i.window.text}`)));
      if (numeric.length) {
        const e = numeric[0];
        app.appendChild(banner("info", "Earliest recommended window", [
          `<b>${e.window.text}</b> — ${e.cond.label}${e.option ? " (" + e.option.label + ")" : ""}`,
          items.length > 1 ? "The guideline does not specify how to combine several conditions; timing remains individualised, using shared decision-making with the woman and her family." : "Use shared decision-making with the woman and her family."
        ]));
      }
      const other = items.filter(i => ["usual", "notRoutine"].includes(i.window.type));
      if (other.length) app.appendChild(banner("ok", "No earlier birth indicated by these conditions", other.map(i => `<b>${i.cond.label}</b>${i.option ? " — " + i.option.label : ""}: ${i.window.text}`)));

      if (p !== null) {
        const flags = items.map(i => ({ i, c: check(i.window, p) })).filter(x => x.c);
        const early = flags.filter(x => x.c.label === "Earlier than window");
        const late = flags.filter(x => x.c.label === "Later than limit");
        const lines = [];
        early.forEach(x => lines.push(`Earlier than the window for <b>${x.i.cond.label}</b> (${x.i.window.text})`));
        late.forEach(x => lines.push(`Later than the limit for <b>${x.i.cond.label}</b> (${x.i.window.text})`));
        const anyNumeric = items.some(i => numericStart(i.window) !== null || i.window.type === "urgent");
        if (!anyNumeric && p < ELECTIVE_FROM) lines.push("No condition selected sets an earlier window — planned birth before 39+0 without a medical indication should be avoided");
        const allEarly = numeric.length && numeric.every(i => check(i.window, p).label === "Earlier than window") && !urgent.length && !special.length;
        const kind = late.length || allEarly ? "bad" : lines.length ? "warn" : "ok";
        app.appendChild(banner(kind, `Proposed ${fmtGa(p)} weeks`, lines.length ? lines.concat(allEarly ? ["Earlier than every applicable window — review the indication."] : []) : ["Within (at or after the earliest gestation of) every applicable window."]));
      }

      const h3 = document.createElement("h3");
      h3.textContent = "By condition";
      app.appendChild(h3);
      const order = urgent.concat(special, numeric, other);
      order.forEach(i => {
        const sections = [["Gestation for birth", [i.window.text]]];
        if (i.option) sections.unshift(["Guidance on timing", [i.option.label]]);
        const notes = [i.note, i.cond.note].filter(Boolean);
        if (notes.length) sections.push(["Notes", notes]);
        if (i.cond.related) sections.push(["Relevant procedure / guideline", [i.cond.related]]);
        appendCard(i.cond.label, sections, true, p !== null ? check(i.window, p) : null);
      });
    }

    app.appendChild(actionPanel("info", "Shared decision-making", [
      "Discuss the benefits, risks and uncertainties of the timing options with the woman and her family, bringing together her values, goals and preferences with the best available evidence",
      "Consider the overall clinical scenario and the relevant condition-specific guideline",
      "Decision-making on timing of birth is by the obstetrician, through booking induction of labour or planned caesarean"
    ]));

    const pi = document.createElement("div");
    PATIENT_INFO.forEach(i => pi.appendChild(patientInfoLink(i)));
    app.appendChild(pi);

    const refHead = document.createElement("h3");
    refHead.textContent = "Reference";
    app.appendChild(refHead);
    appendCard("Definitions (§3)", [["Terms", [
      "Early term: gestations between 37 and 39 completed weeks",
      "Iatrogenic birth: birth as a direct result of induction of labour or planned caesarean section"
    ]]], false);
    appendCard("Source notes — owner interpretations", [["Where the table was ambiguous", SOURCE_NOTES]], false);
    finalActions();
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
