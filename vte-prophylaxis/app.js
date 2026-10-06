/* ============================================================================
   VTE Prophylaxis
   Decision-support logic derived from:
   "Venous Thromboembolism (VTE) Prophylaxis Guideline", RWH0191933 v2.0,
   The Royal Women's Hospital, Allied Health and Clinical Support Services /
   Laboratory Services. Last review 22/10/2024.
   This is an independent companion resource, not an official RWH product.

   Where the guideline is ambiguous or inconsistent, this page follows the site
   owner's interpretation — see SOURCE_NOTES (also shown on the page).
   All rules live in computePlan() so they can be checked line by line.
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Patient group", "Details", "Risk factors", "Contraindications", "Plan"];
  const RESULT = PHASES.length - 1;

  // Thresholds (with owner decisions where the guideline was inconsistent)
  const BMI_OBESE = 30;           // owner: obesity risk factor = BMI ≥30 (all groups)
  const BMI_INTERMEDIATE_PN = 40; // App A postnatal intermediate: BMI ≥40
  const AGE_RISK = 35;            // risk factor: age >35; owner: exemption = age ≤35
  const PARITY_RISK = 3;          // risk factor: parity ≥3; exemption: parity <3
  const LOW_RISK_COUNT = 4;       // App A: four or more risk factors
  const EM_CS_EXTRA = 2;          // App A: emergency CS + 2 or more risk factors

  const OM_ADVICE = "seek expert opinion from Obstetric Medicine";

  const PATIENT_INFO = {
    general: {
      url: "https://www.thewomens.org.au/images/uploads/fact-sheets/VTE_blood_clots_and_how_to_prevent_them_260629.pdf",
      label: "VTE: blood clots and how to prevent them — fact sheet (PDF)"
    },
    lmwh: {
      url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Venous_thromboembolism_(VTE)_How_to_prevent_a_blood_clot_using_LMWH_260302.pdf",
      label: "VTE: how to prevent a blood clot using LMWH — fact sheet (PDF)"
    }
  };

  const SOURCE_NOTES = [
    "<b>Footer:</b> the Appendix A page is footed ‘Page 8 of 7’; confirmed as a footer error (no missing page).",
    "<b>Age:</b> exemption (§4.1) taken as age ≤35 (the guideline says &lt;35); the Appendix A risk factor remains age &gt;35, so there is no gap at 35.",
    "<b>BMI:</b> obesity counts as a risk factor at BMI ≥30 for all groups (Appendix A says &gt;30; gynaecology §4.3 says ≥30). A woman with BMI exactly 30 therefore has a risk factor and is not exempt.",
    "<b>Exemption:</b> the §4.1 midwifery-led exemption applies only if she has none of the other Appendix A risk factors; otherwise the full Appendix A assessment is used (antenatal ‘hospital admission’ makes her intermediate risk).",
    "<b>Transient antenatal risk factors</b> (dehydration/hyperemesis, current systemic infection incl. COVID+ve up to day 7, long-distance travel ≥4 hours) count towards the ‘four or more’.",
    "<b>Gynaecology/oncology (non-surgical):</b> one §4.3 risk factor = high risk → prophylaxis for the inpatient stay if no contraindication.",
    "<b>Renal function and dose changes:</b> where the guideline says ‘consider dose reduction when CrCl ≤30 mL/min’ (no reduced dose given), seek expert opinion from Obstetric Medicine. The same applies to any change from the standard dose table.",
    "<b>Weight bands:</b> the table gives ‘50 to 120’ then ‘121–200’; this page uses ≤120 kg → 40 mg / 5000 units and &gt;120 kg (to 200) → 60 mg / 7500 units. Obstetric doses use booking weight (Appendix A); gynaecology doses use current weight (not specified in the guideline)."
  ];

  // Appendix A — antenatal (items not computed from the details screen)
  const AN_FACTORS = [
    { key: "unprovokedVTE", label: "Previous unprovoked VTE", tier: "high" },
    { key: "provokedVTE", label: "Previous provoked VTE", tier: "intermediate" },
    { key: "highThromb", label: "High-risk thrombophilia or APLS, with no previous VTE", hint: "Antithrombin deficiency, protein C or S deficiency, compound or homozygous for low-risk thrombophilia", tier: "intermediate" },
    { key: "comorbidity", label: "Active medical comorbidity", hint: "e.g. cancer, heart failure, active SLE, IBD or inflammatory polyarthropathy, nephrotic syndrome, type 1 DM with nephropathy, sickle cell disease, current IVDU", tier: "intermediate" },
    { key: "surgery", label: "Surgical procedure in pregnancy", hint: "e.g. appendicectomy", tier: "intermediate" },
    { key: "fhx", label: "Family history of unprovoked or oestrogen-provoked VTE", tier: "low" },
    { key: "lowThromb", label: "Low-risk thrombophilia", hint: "Heterozygous for factor V Leiden or prothrombin G20210A", tier: "low" },
    { key: "immobility", label: "Immobility (≥3 days)", tier: "low" },
    { key: "varicose", label: "Gross varicose veins (symptomatic)", tier: "low" },
    { key: "preeclampsia", label: "Current pre-eclampsia", tier: "low" },
    { key: "multiple", label: "Multiple pregnancy", tier: "low" },
    { key: "ivf", label: "IVF", tier: "low" },
    { key: "dehydration", label: "Transient: dehydration / hyperemesis", tier: "low" },
    { key: "infection", label: "Transient: current systemic infection", hint: "Including COVID-positive up to day 7", tier: "low" },
    { key: "travel", label: "Transient: long-distance travel ≥4 hours", tier: "low" }
  ];

  // Appendix A — postnatal
  const PN_FACTORS = [
    { key: "anyVTE", label: "Previous VTE (provoked or unprovoked)", tier: "high" },
    { key: "antenatalLMWH", label: "Required antenatal LMWH in this pregnancy", tier: "high" },
    { key: "highThromb", label: "High-risk thrombophilia or APLS", hint: "Antithrombin deficiency, protein C or S deficiency, compound or homozygous for low-risk thrombophilia", tier: "high" },
    { key: "comorbidity", label: "Active medical comorbidity", hint: "e.g. cancer, heart failure, active SLE, IBD or inflammatory polyarthropathy, nephrotic syndrome, type 1 DM with nephropathy, sickle cell disease, current IVDU", tier: "intermediate" },
    { key: "puerperalSurgery", label: "Any surgical procedure in the puerperium", hint: "Except immediate repair of the perineum", tier: "intermediate" },
    { key: "immobility", label: "Immobility or prolonged hospital admission (≥3 days)", tier: "intermediate" },
    { key: "fhx", label: "Family history of VTE", tier: "low" },
    { key: "lowThromb", label: "Low-risk thrombophilia", hint: "Heterozygous for factor V Leiden or prothrombin G20210A", tier: "low" },
    { key: "varicose", label: "Gross varicose veins (symptomatic)", tier: "low" },
    { key: "infection", label: "Current systemic infection", hint: "Including COVID-positive up to day 7", tier: "low" },
    { key: "preeclampsia", label: "Current pre-eclampsia", tier: "low" },
    { key: "multiple", label: "Multiple pregnancy", tier: "low" },
    { key: "preterm", label: "Preterm delivery in this pregnancy (<37 weeks)", tier: "low" },
    { key: "stillbirth", label: "Stillbirth in this pregnancy", tier: "low" },
    { key: "prolongedLabour", label: "Prolonged labour (>24 hours)", tier: "low" },
    { key: "pph", label: "PPH >1 litre or blood transfusion", tier: "low" }
  ];

  // §4.3 — gynaecology/oncology risk factors
  const GYN_FACTORS = [
    { key: "cancer", label: "Active cancer or cancer treatment" },
    { key: "vte", label: "Prior VTE (excluding superficial vein thrombosis) or first-degree relative with VTE" },
    { key: "mobility", label: "Reduced mobility (for at least 3 days)" },
    { key: "thromb", label: "Thrombophilia" },
    { key: "trauma", label: "Recent trauma and/or surgery (within 1 month)" },
    { key: "age60", label: "Age >60" },
    { key: "comorbidity", label: "One or more significant medical comorbidities", hint: "e.g. heart disease; metabolic, endocrine or respiratory pathology; acute infection; rheumatologic/inflammatory disorder" },
    { key: "obesity", label: "Obesity (BMI ≥30)" },
    { key: "dehydration", label: "Dehydration" },
    { key: "hormonal", label: "Ongoing hormonal treatment", hint: "e.g. oestrogen-containing preparations" }
  ];

  // §4.3 — contraindications to pharmacological prophylaxis
  const PHARM_CI = [
    { key: "anticoag", label: "On current therapeutic anticoagulation" },
    { key: "bleeding", label: "Active bleeding" },
    { key: "bleedDisorder", label: "Known bleeding disorder", hint: "e.g. haemophilia, von Willebrand's disease or acquired coagulopathy" },
    { key: "coag", label: "Severe coagulation disorder or haemorrhaging of a major organ" },
    { key: "majorHaem", label: "Increased risk of major haemorrhage", hint: "e.g. placenta praevia" },
    { key: "plt", label: "Thrombocytopenia (platelet count <50 × 10⁹/L)" },
    { key: "adverse", label: "Adverse reaction to LMWH", hint: "e.g. rash, heparin-induced thrombocytopenia" },
    { key: "organ", label: "Severe hepatic failure or renal failure" },
    { key: "stroke", label: "Acute stroke in the previous 4 weeks (haemorrhagic or ischaemic)" },
    { key: "deliver", label: "Likely to deliver within 24 hours", antenatalOnly: true }
  ];

  // §4.2 — contraindications to mechanical prophylaxis
  const MECH_CI = [
    { key: "pvd", label: "Severe peripheral vascular disease" },
    { key: "neuropathy", label: "Severe peripheral neuropathy" },
    { key: "oedema", label: "Severe lower limb oedema" },
    { key: "deformity", label: "Extreme leg deformity" },
    { key: "inflam", label: "Inflammatory condition of the lower leg", hint: "e.g. ulcer" },
    { key: "fit", label: "Morbid obesity where correct fitting of GCS cannot be achieved" }
  ];

  const MECHANICAL_ACTIONS = [
    "Prescribe or initiate mechanical prophylaxis on the medicines chart",
    "Graduated compression stockings (GCS): measure and fit for each woman; wear continuously",
    "Intermittent pneumatic compression (IPC): ideally begin at induction of anaesthesia and continue post-operatively unless contraindicated",
    "Adequate hydration and early mobilisation"
  ];

  const REGIONAL = [
    "Regional anaesthesia (spinal/epidural) at least 12 hours AFTER the last dose of VTE prophylaxis",
    "VTE prophylaxis no earlier than 6 hours after regional anaesthesia; subsequent doses daily",
    "Remove epidural catheters at least 12 hours after a dose of VTE prophylaxis",
    "After epidural catheter removal, VTE prophylaxis no earlier than 6 hours after removal; subsequent doses daily",
    "Timing in surgical patients is guided by the responsible surgical unit and/or anaesthetist (these timings apply unless the surgical unit specifies otherwise)",
    "Antiplatelet/anticoagulant cessation before surgery: see the Perioperative Management of Antiplatelet and Anticoagulation in Elective Surgery – Guideline"
  ];

  const FOLLOW_UP = [
    "Discuss the VTE risk assessment result and the prevention plan with the woman — including bleeding risk, needle-phobia, or personal/religious beliefs that may influence the choice of prophylaxis (§4.4)",
    "Reassess VTE and bleeding risk at intervals no longer than every 7 days, whenever the clinical condition or goals of care change, and on discharge (§4.5)",
    "At each reassessment, review any VTE-related complications (clot or bleed) and problems with the prophylaxis medicines",
    "Do not monitor anti-Xa levels for prophylaxis (no improvement in outcomes; not recommended)",
    "Discharge: reassess risk and ongoing need; if continuing, assess ability to self-administer, educate on monitoring and follow-up, and give the woman and her ongoing provider a clear plan (dose, prescription, duration, safe disposal of sharps) (§4.6)"
  ];

  const PRESCRIBER = {
    antenatal: "Obstetric team has overall responsibility for the risk assessment and prescribing (midwives complete the EMR assessment for women under Midwifery Led Care).",
    postnatalCS: "Caesarean section: VTE prophylaxis is prescribed by the anaesthetic team.",
    postnatal: "Vaginal birth: obstetric team has overall responsibility for the risk assessment and prescribing (midwives complete the EMR assessment for women under Midwifery Led Care).",
    gyn: "Gynaecology/oncology: VTE prophylaxis is prescribed by the surgical team. Surgeons and anaesthetists share responsibility to consider VTE prophylaxis."
  };

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
  function appendCard(name, sections, open) {
    const card = document.createElement("div");
    card.className = "modality-card" + (open ? " open" : "");
    card.innerHTML = `<div class="modality-head"><span class="modality-name">${name}</span></div><div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    sections.forEach(([title, items, checkable]) => body.appendChild(detailSection(title, items, checkable)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
  }

  // Mandatory multi-select with "None of the above". items: [{key, label, hint}].
  // Calls onContinue(keys); preset restores previous answers on Back.
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

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  const obstetric = () => state.group === "antenatal" || state.group === "postnatal";
  const isCS = () => state.birth === "electiveCS" || state.birth === "emergencyCS";

  // ---- LMWH dose (§4.3 table / Appendix A) ---------------------------------------

  function doseFor(weight) {
    if (weight < 50) return ["enoxaparin 20 mg", "dalteparin 2500 units"];
    if (weight <= 120) return ["enoxaparin 40 mg", "dalteparin 5000 units"];
    if (weight <= 200) return ["enoxaparin 60 mg", "dalteparin 7500 units"];
    return ["enoxaparin 80 mg", "dalteparin 10,000 units"];
  }

  // ---- clinical logic ---------------------------------------------------------------

  // Risk factors derived from the details screen (obstetric)
  function derivedObstetricFactors() {
    const f = [];
    if (state.bmi >= BMI_OBESE) f.push(`Obesity (BMI ${state.bmi} — ≥30)`);
    if (state.age > AGE_RISK) f.push(`Age >35 (${state.age})`);
    if (state.parity >= PARITY_RISK) f.push(`Parity ≥3 (${state.parity})`);
    if (state.smoker) f.push("Smoker");
    if (state.group === "postnatal" && state.birth === "electiveCS") f.push("Elective caesarean section");
    if (state.group === "postnatal" && state.birth === "operative") f.push("Operative delivery (forceps/vacuum)");
    return f;
  }

  const label = (list, key) => (list.find(x => x.key === key) || {}).label;

  // Returns { tier, headline, kind, lmwh: "indicated"|"consider"|null, duration, reasons[], mechanical, notes[] }
  function computePlan() {
    const p = { reasons: [], notes: [], lmwh: null, mechanical: false, duration: null };

    if (state.group === "day") {
      return Object.assign(p, { tier: "exempt", kind: "ok", headline: "Exempt from pharmacological prophylaxis", reasons: ["Day medical or surgical patient (§4.1)"] });
    }

    if (state.group === "ohss") {
      return Object.assign(p, {
        tier: "high", kind: "warn", headline: "Severe OHSS — prescribe VTE prophylaxis", lmwh: "indicated",
        duration: "For the inpatient stay, and consider continuing at least until the end of the first trimester. Base the duration on individual risk factors and whether or not pregnancy occurs.",
        reasons: ["Severe ovarian hyperstimulation syndrome (§4.3)"],
        notes: ["Discussion with a haematologist is recommended."]
      });
    }

    if (state.group === "gynSurgical") {
      const s = state.surgery;
      Object.assign(p, { tier: "high", kind: "warn", lmwh: "indicated" });
      if (s === "major") {
        p.headline = "Major gynaecological surgery — LMWH plus mechanical prophylaxis";
        p.duration = "Commence LMWH post procedure for up to 7 days or until fully mobile, plus GCS or other mechanical prophylaxis.";
        p.mechanical = true;
        p.reasons.push("Major gynaecological surgery (§4.3)");
      } else if (s === "cancer") {
        p.headline = "Major abdominal or pelvic surgery for cancer — consider extended LMWH";
        p.duration = "Prescribe post-surgery during the inpatient stay, and consider 3–4 weeks of thromboprophylaxis with LMWH. Add GCS or other mechanical prophylaxis.";
        p.mechanical = true;
        p.reasons.push("Major abdominal or pelvic surgery for cancer (§4.3)");
      } else {
        p.headline = "Post-surgery inpatient — prescribe VTE prophylaxis";
        p.duration = "During the inpatient stay, prescribe VTE prophylaxis post-surgery if no contraindications.";
        p.reasons.push("Surgical inpatient (§4.3: prophylaxis should be prescribed post-surgery)");
      }
      const gf = (state.gynFactors || []).map(k => label(GYN_FACTORS, k));
      if (gf.length) p.notes.push("Additional §4.3 risk factors: " + gf.join("; ") + ".");
      return p;
    }

    if (state.group === "gynMedical") {
      const gf = (state.gynFactors || []).map(k => label(GYN_FACTORS, k));
      if (gf.length) {
        return Object.assign(p, {
          tier: "high", kind: "warn", lmwh: "indicated", headline: "High risk — prescribe VTE prophylaxis for the inpatient stay",
          duration: "For the inpatient stay, if no contraindications.", reasons: gf
        });
      }
      return Object.assign(p, { tier: "none", kind: "ok", headline: "No §4.3 risk factors identified", reasons: ["Adequate hydration and early mobilisation; reassess if the clinical condition changes."] });
    }

    // ---- obstetric (Appendix A) ----
    const derived = derivedObstetricFactors();
    const ticked = state.obsFactors || [];
    const list = state.group === "antenatal" ? AN_FACTORS : PN_FACTORS;
    const tickedOf = tier => ticked.filter(k => (list.find(x => x.key === k) || {}).tier === tier).map(k => label(list, k));
    const lowFactors = derived.concat(tickedOf("low"));

    // §4.1 exemption: midwifery-led + BMI <30, non-smoker, parity <3, age ≤35 (all in `derived`)
    // + no other Appendix A factors. Antenatal hospital admission is not counted here (owner decision).
    const otherFactors = derived.length + ticked.length + (state.group === "postnatal" && state.birth === "emergencyCS" ? 1 : 0);
    if (state.midwiferyLed && otherFactors === 0) {
      return Object.assign(p, {
        tier: "exempt", kind: "ok", headline: "Exempt from pharmacological prophylaxis",
        reasons: ["Midwifery-led care with BMI <30, non-smoker, parity <3, age ≤35, and no other Appendix A risk factors (§4.1)"],
        notes: ["Midwife: tick ‘exempt’ in the EMR VTE risk assessment while she remains on Midwifery Led Care and meets the exemption criteria; otherwise refer to medical staff."]
      });
    }

    if (state.group === "antenatal") {
      const high = tickedOf("high");
      const inter = tickedOf("intermediate");
      if (state.admitted) inter.push("Hospital admission");
      if (high.length) {
        return Object.assign(p, { tier: "high", kind: "bad", lmwh: "indicated", headline: "High risk — antenatal prophylaxis with LMWH",
          duration: "Antenatal prophylaxis with LMWH (and prescribe for the inpatient stay if admitted, §4.3).",
          reasons: high.concat(inter, lowFactors) });
      }
      if (inter.length) {
        return Object.assign(p, { tier: "intermediate", kind: "warn", lmwh: "consider", headline: "Intermediate risk — consider antenatal prophylaxis with LMWH",
          duration: "Consider antenatal prophylaxis with LMWH; refer to a haematologist.", reasons: inter.concat(lowFactors) });
      }
      if (lowFactors.length >= LOW_RISK_COUNT) {
        return Object.assign(p, { tier: "low4", kind: "warn", lmwh: "consider", headline: `Low risk with ${lowFactors.length} risk factors — consider prophylaxis from 28 weeks`,
          duration: "Four or more risk factors: consider prophylaxis from 28 weeks; refer to a haematologist.", reasons: lowFactors });
      }
      if (lowFactors.length) {
        return Object.assign(p, { tier: "low", kind: "info", mechanical: true, headline: `Low risk (${lowFactors.length} risk factor${lowFactors.length > 1 ? "s" : ""}) — mechanical prophylaxis`,
          reasons: lowFactors, notes: ["Fewer than four risk factors: pharmacological prophylaxis is not indicated by Appendix A. Mechanical prophylaxis is recommended for low-risk women with at least 1 risk factor (§4.2)."] });
      }
      return Object.assign(p, { tier: "none", kind: "ok", headline: "No Appendix A risk factors identified", reasons: ["Adequate hydration and early mobilisation; reassess if the clinical condition changes."] });
    }

    // postnatal
    const high = tickedOf("high");
    const inter = tickedOf("intermediate");
    if (state.bmi >= BMI_INTERMEDIATE_PN) inter.push(`BMI ≥40 (${state.bmi})`);
    if (ticked.includes("lowThromb") && ticked.includes("fhx")) inter.push("Low-risk thrombophilia + family history");
    if (state.birth === "emergencyCS" && lowFactors.length >= EM_CS_EXTRA) inter.push(`Emergency caesarean section + ${lowFactors.length} risk factors`);
    if (high.length) {
      return Object.assign(p, { tier: "high", kind: "bad", lmwh: "indicated", headline: "High risk — postnatal prophylactic LMWH for at least 6 weeks",
        duration: "Postnatal prophylactic LMWH for at least 6 weeks.", reasons: high.concat(inter, lowFactors) });
    }
    if (inter.length) {
      return Object.assign(p, { tier: "intermediate", kind: "warn", lmwh: "consider", headline: "Intermediate risk — consider postnatal prophylactic LMWH for 6 weeks",
        duration: "Consider postnatal prophylactic LMWH for 6 weeks.", reasons: inter.concat(lowFactors) });
    }
    if (lowFactors.length >= LOW_RISK_COUNT) {
      return Object.assign(p, { tier: "low4", kind: "warn", lmwh: "consider", headline: `Low risk with ${lowFactors.length} risk factors — consider postnatal LMWH for 6 weeks`,
        duration: "Four or more risk factors: consider postnatal prophylactic LMWH for 6 weeks.", reasons: lowFactors });
    }
    if (isCS()) {
      return Object.assign(p, { tier: "cs", kind: "warn", lmwh: "indicated", headline: "Caesarean section — postnatal prophylactic LMWH for the inpatient stay",
        duration: "Postnatal prophylactic LMWH for the inpatient stay only.",
        reasons: [(state.birth === "electiveCS" ? "Elective" : "Emergency") + " caesarean section, not in the high, intermediate or low (four or more) risk groups"].concat(lowFactors) });
    }
    if (lowFactors.length) {
      return Object.assign(p, { tier: "low", kind: "info", mechanical: true, headline: `Low risk (${lowFactors.length} risk factor${lowFactors.length > 1 ? "s" : ""}) — mechanical prophylaxis`,
        reasons: lowFactors, notes: ["Fewer than four risk factors: pharmacological prophylaxis is not indicated by Appendix A. Mechanical prophylaxis is recommended for low-risk women with at least 1 risk factor (§4.2)."] });
    }
    return Object.assign(p, { tier: "none", kind: "ok", headline: "No Appendix A risk factors identified", reasons: ["Adequate hydration and early mobilisation; reassess if the clinical condition changes."] });
  }

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "group": return screenGroup();
      case "obsDetails": return screenObsDetails();
      case "obsRisks": return screenObsRisks();
      case "gynSurgery": return screenGynSurgery();
      case "gynRisks": return screenGynRisks();
      case "pharmCI": return screenPharmCI();
      case "mechCI": return screenMechCI();
      case "plan": return screenPlan();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "VTE Prophylaxis", "Risk assessment and recommended VTE prophylaxis — LMWH dose, mechanical prophylaxis, regional anaesthesia timing and follow-up — for adult inpatients.");
    app.appendChild(banner("info", "Before you start", [
      "All adult inpatients should be assessed for VTE risk in EPIC as soon as practical on admission.",
      "Covers antenatal and postnatal women (Appendix A), gynaecology/oncology surgical and non-surgical inpatients, and severe OHSS.",
      "LMWH is preferred for VTE prophylaxis in pregnant women. Aspirin is not first-line therapy for prophylaxis.",
      "Where the guideline is ambiguous or inconsistent, this page follows the site owner's interpretation (see ‘Source notes’ on the plan screen)."
    ]));
    app.appendChild(actionsRow([{ label: "Start", primary: true, onClick: () => go("group") }]));
  }

  function screenGroup() {
    screenShell(0, "Patient group", "Which group is the woman in?");
    const set = (g, next) => () => { state = { group: g }; go(next); };
    app.appendChild(optionList([
      { label: "Antenatal (pregnant)", hint: "Appendix A antenatal risk assessment", onClick: set("antenatal", "obsDetails") },
      { label: "Postnatal (after birth)", hint: "Appendix A postnatal risk assessment", onClick: set("postnatal", "obsDetails") },
      { label: "Gynaecology / oncology — surgical inpatient", onClick: set("gynSurgical", "gynSurgery") },
      { label: "Gynaecology / oncology — non-surgical inpatient", onClick: set("gynMedical", "gynRisks") },
      { label: "Severe ovarian hyperstimulation syndrome (OHSS)", onClick: set("ohss", "pharmCI") },
      { label: "Day medical or surgical patient", hint: "Meets exemption criteria for pharmacological prophylaxis", onClick: set("day", "plan") }
    ]));
  }

  function screenObsDetails() {
    const an = state.group === "antenatal";
    screenShell(1, an ? "Antenatal details" : "Postnatal details", "Weight is based on booking weight (Appendix A).");
    const wrap = document.createElement("div");
    const v = x => (x === undefined || x === null) ? "" : x;
    const yn = (name, key) => {
      const cur = state[key] === undefined ? undefined : (state[key] ? "yes" : "no");
      return radio(name, "no", "No", cur) + radio(name, "yes", "Yes", cur);
    };
    wrap.innerHTML = `
      <div class="field"><label for="ageInput">Age (years)</label><input type="number" min="12" max="70" step="1" id="ageInput" value="${v(state.age)}"></div>
      <div class="field"><label for="bmiInput">BMI (kg/m²)</label><input type="number" min="10" max="90" step="0.1" id="bmiInput" value="${v(state.bmi)}"></div>
      <div class="field"><label for="parityInput">Parity</label><input type="number" min="0" max="20" step="1" id="parityInput" value="${v(state.parity)}"></div>
      <div class="field"><label for="weightInput">Booking weight (kg)</label><div class="hint">Used for the LMWH dose</div><input type="number" min="20" max="350" step="0.1" id="weightInput" value="${v(state.weight)}"></div>
      <div class="field"><label>Smoker?</label>${yn("smoker", "smoker")}</div>
      <div class="field"><label>Under Midwifery Led Care?</label>${yn("mlc", "midwiferyLed")}</div>
      ${an ? `<div class="field"><label>Currently admitted to hospital?</label><div class="hint">Hospital admission is an intermediate-risk factor antenatally</div>${yn("admitted", "admitted")}</div>` : `
      <div class="field"><label>Mode of birth</label>
        ${radio("birth", "svd", "Vaginal birth (spontaneous)", state.birth)}
        ${radio("birth", "operative", "Operative vaginal birth (forceps / vacuum)", state.birth)}
        ${radio("birth", "electiveCS", "Elective caesarean section", state.birth)}
        ${radio("birth", "emergencyCS", "Emergency caesarean section", state.birth)}
      </div>`}`;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([{
      label: "Continue", primary: true, onClick: () => {
        const num = id => parseFloat(document.getElementById(id).value);
        const val = n => (wrap.querySelector(`input[name=${n}]:checked`) || {}).value;
        const age = num("ageInput"), bmi = num("bmiInput"), parity = parseInt(document.getElementById("parityInput").value, 10), weight = num("weightInput");
        const missing = [];
        if (!(age >= 12 && age <= 70)) missing.push("age");
        if (!(bmi >= 10 && bmi <= 90)) missing.push("BMI");
        if (isNaN(parity) || parity < 0 || parity > 20) missing.push("parity");
        if (!(weight >= 20 && weight <= 350)) missing.push("booking weight");
        if (!val("smoker")) missing.push("smoking status");
        if (!val("mlc")) missing.push("Midwifery Led Care");
        if (an && !val("admitted")) missing.push("whether she is admitted");
        if (!an && !val("birth")) missing.push("mode of birth");
        if (missing.length) { err.textContent = "Please enter " + missing.join(", ") + " to continue."; err.style.display = "block"; return; }
        Object.assign(state, { age, bmi: Math.round(bmi * 10) / 10, parity, weight, smoker: val("smoker") === "yes", midwiferyLed: val("mlc") === "yes" });
        if (an) state.admitted = val("admitted") === "yes"; else state.birth = val("birth");
        go("obsRisks");
      }
    }]));
  }

  function screenObsRisks() {
    const an = state.group === "antenatal";
    screenShell(2, an ? "Antenatal risk factors (Appendix A)" : "Postnatal risk factors (Appendix A)", "Do any of the following apply? (required)");
    const derived = derivedObstetricFactors();
    if (derived.length || state.admitted) app.appendChild(banner("info", "Already counted from the details screen", derived.concat(state.admitted ? ["Hospital admission"] : [])));
    mandatoryMultiSelect(an ? AN_FACTORS : PN_FACTORS, keys => {
      state.obsFactors = keys;
      routeAfterRisk();
    }, state.obsFactors);
  }

  function screenGynSurgery() {
    screenShell(1, "Surgery", "What surgery has she had (or is planned)?");
    app.appendChild(optionList([
      { label: "Major gynaecological surgery", onClick: () => { state.surgery = "major"; go("gynRisks"); } },
      { label: "Major abdominal or pelvic surgery for cancer", onClick: () => { state.surgery = "cancer"; go("gynRisks"); } },
      { label: "Other inpatient surgery", onClick: () => { state.surgery = "other"; go("gynRisks"); } }
    ]));
  }

  function screenGynRisks() {
    screenShell(2, "Risk factors (§4.3)", "Risk factors requiring consideration for VTE prophylaxis in hospital. Do any apply? (required)");
    mandatoryMultiSelect(GYN_FACTORS, keys => {
      state.gynFactors = keys;
      routeAfterRisk();
    }, state.gynFactors);
  }

  function routeAfterRisk() {
    const p = computePlan();
    if (p.lmwh) go("pharmCI");
    else if (p.mechanical) go("mechCI");
    else go("plan");
  }

  function screenPharmCI() {
    screenShell(3, "Contraindications to LMWH", "Does the woman have any of the following? (required)");
    const items = PHARM_CI.filter(c => !c.antenatalOnly || state.group === "antenatal");
    mandatoryMultiSelect(items, keys => {
      state.pharmCI = keys;
      const p = computePlan();
      if (keys.length || p.mechanical) go("mechCI");
      else go("plan");
    }, state.pharmCI);
  }

  function screenMechCI() {
    screenShell(3, "Contraindications to mechanical prophylaxis", "Does the woman have any of the following? (required)");
    mandatoryMultiSelect(MECH_CI, keys => {
      state.mechCI = keys;
      go("plan");
    }, state.mechCI);
  }

  function screenPlan() {
    const p = computePlan();
    const pharmCI = (state.pharmCI || []).map(k => label(PHARM_CI, k));
    const mechCI = (state.mechCI || []).map(k => label(MECH_CI, k));
    const lmwhBlocked = !!p.lmwh && pharmCI.length > 0;
    const needMech = p.mechanical || lmwhBlocked;

    screenShell(RESULT, p.headline);
    app.appendChild(banner(p.kind, "Risk assessment", p.reasons));
    p.notes.forEach(n => app.appendChild(banner("info", "Note", [n])));

    // Pharmacological
    if (p.lmwh && !lmwhBlocked) {
      const items = [];
      if (p.duration) items.push(p.duration);
      if (obstetric()) {
        const [enox, dalt] = doseFor(state.weight);
        items.push(`<b>${enox} OR ${dalt}</b> subcutaneously, daily (booking weight ${state.weight} kg)`);
      }
      items.push(`CrCl ≤30 mL/min, or any change from the standard dose: ${OM_ADVICE}`);
      app.appendChild(actionPanel(p.lmwh === "indicated" ? "ok" : "warn", p.lmwh === "indicated" ? "Pharmacological prophylaxis (LMWH)" : "Consider pharmacological prophylaxis (LMWH)", items));
      if (!obstetric()) app.appendChild(weightBox());
    }
    if (lmwhBlocked) {
      app.appendChild(banner("bad", "LMWH contraindicated", pharmCI.concat(["These women require compression stockings and/or sequential compression devices (§4.3)."])));
    }

    // Mechanical
    if (needMech) {
      if (mechCI.length) {
        app.appendChild(banner("bad", "Mechanical prophylaxis contraindicated", mechCI.concat([lmwhBlocked
          ? "Both pharmacological and mechanical prophylaxis are contraindicated — the guideline does not address this; discuss with the treating team. Ensure adequate hydration and early mobilisation."
          : "Ensure adequate hydration and early mobilisation."])));
      } else {
        app.appendChild(actionPanel("info", lmwhBlocked ? "Mechanical prophylaxis (instead of LMWH)" : "Mechanical prophylaxis", MECHANICAL_ACTIONS));
      }
    } else if (p.lmwh && p.tier === "high") {
      app.appendChild(banner("info", "Mechanical prophylaxis", ["May be used as an adjunct in women at high risk of VTE (§4.2)."]));
    }
    if (p.tier === "none" || p.tier === "exempt") {
      app.appendChild(actionPanel("info", "General measures", ["Adequate hydration and early mobilisation", "Reassess if the clinical condition changes, at least every 7 days, and on discharge"]));
    }

    // Prescriber
    const presc = state.group === "antenatal" ? PRESCRIBER.antenatal
      : state.group === "postnatal" ? (isCS() ? PRESCRIBER.postnatalCS : PRESCRIBER.postnatal)
      : state.group === "day" ? null : PRESCRIBER.gyn;
    if (presc) app.appendChild(banner("info", "Who prescribes (§2)", [presc]));

    if (p.lmwh && !lmwhBlocked) appendCard("Regional anaesthesia and epidural timing (§4.3)", [["Unless specified by the surgical treating unit", REGIONAL, true]], state.group === "gynSurgical" || isCS());

    app.appendChild(actionPanel("info", "Discuss, reassess and plan discharge (§4.4–4.6)", FOLLOW_UP));

    const pi = document.createElement("div");
    pi.appendChild(patientInfoLink(PATIENT_INFO.general));
    if (p.lmwh && !lmwhBlocked) pi.appendChild(patientInfoLink(PATIENT_INFO.lmwh));
    app.appendChild(pi);

    const refHead = document.createElement("h3");
    refHead.textContent = "Reference";
    app.appendChild(refHead);
    appendCard("LMWH prophylactic dose table (§4.3, Appendix A)", [["Daily dose by weight", [
      "&lt;50 kg: enoxaparin 20 mg or dalteparin 2500 units",
      "50 to 120 kg: enoxaparin 40 mg or dalteparin 5000 units",
      "121–200 kg: enoxaparin 60 mg or dalteparin 7500 units",
      "&gt;200 kg: enoxaparin 80 mg or dalteparin 10,000 units",
      "Consider dose reduction when CrCl ≤30 mL/min — " + OM_ADVICE,
      "Obstetric: weight is based on booking weight"
    ], false]], false);
    appendCard("Thrombophilia definitions (Appendix A)", [["Definitions", [
      "High-risk thrombophilia: antithrombin deficiency, protein C or S deficiency, compound or homozygous for low-risk thrombophilia",
      "Low-risk thrombophilia: heterozygous for factor V Leiden or prothrombin G20210A mutations"
    ], false]], false);
    appendCard("Source notes — owner interpretations", [["Where the guideline was ambiguous or inconsistent", SOURCE_NOTES, false]], false);
    finalActions();
  }

  // Gynaecology / OHSS: current weight for the dose (entered on the plan screen)
  function weightBox() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="field">
        <label for="gynWeightInput">Current weight (kg) — for the LMWH dose</label>
        <input type="number" min="20" max="350" step="0.1" id="gynWeightInput" placeholder="e.g. 72">
      </div>`;
    const out = document.createElement("div");
    wrap.appendChild(out);
    const inp = wrap.querySelector("#gynWeightInput");
    inp.addEventListener("input", () => {
      const w = parseFloat(inp.value);
      out.innerHTML = "";
      if (w >= 20 && w <= 350) {
        const [enox, dalt] = doseFor(w);
        out.appendChild(banner("ok", `Dose for ${w} kg: ${enox} OR ${dalt}, daily`, ["Subcutaneously, once daily.", `CrCl ≤30 mL/min, or any change from the standard dose: ${OM_ADVICE}.`]));
      }
    });
    return wrap;
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
