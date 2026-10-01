/* ============================================================================
   Pain and Bleeding in Early Pregnancy
   Decision-support logic derived from:
   "Pain and Bleeding in Early Pregnancy - Guideline", RWH0192464 v3.0, The
   Royal Women's Hospital, Women's Health Services, Early Pregnancy Assessment
   Service (EPAS). Last review 30/03/2023.
   This is an independent companion resource, not an official RWH product.
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Scope", "Initial assessment", "Safety checks", "Assessment", "Outcome"];
  const OUTCOME = PHASES.length - 1;

  // §4.1 algorithm — "Initial assessment" box
  const INITIAL_ASSESSMENT = [
    "Referral information, including previous ultrasounds",
    "Gestation (LMP and pregnancy symptoms)",
    "History of pain and bleeding",
    "Risk factors for ectopic (asked on a later screen)",
    "Vital signs, abdominal examination",
    "Blood for β-hCG, G&amp;H and usually FBE",
    "Urine or cervical swab for chlamydia for all women aged &lt;25, and for query ectopic"
  ];

  // §4.1 algorithm — risk factors for ectopic
  const ECTOPIC_RISK_FACTORS = [
    { key: "prevEctopic", label: "Previous ectopic pregnancy" },
    { key: "iud", label: "IUD in situ" },
    { key: "pid", label: "History of PID" },
    { key: "ivf", label: "IVF" },
    { key: "pop", label: "Use of progesterone-only contraception", hint: "Including emergency contraception" }
  ];

  // §4.1 pain branch (unilateral / severe pain prompt gynae review) and §4.3.3 "clinically likely" signs
  const PAIN_FINDINGS = [
    { key: "unilateral", label: "Unilateral pain", gynaeReview: true },
    { key: "severe", label: "Severe pain", gynaeReview: true, ectopicSign: true },
    { key: "shoulder", label: "Shoulder pain", ectopicSign: true },
    { key: "fainting", label: "Fainting episodes", ectopicSign: true },
    { key: "adnexal", label: "Adnexal mass and/or tenderness on VE", ectopicSign: true },
    { key: "cervExcitation", label: "Cervical excitation on VE", ectopicSign: true }
  ];

  const URGENT_ACTIONS = [
    "Urgent assessment and resuscitation",
    "IV access and fluids",
    "Cross-match blood (2 units)",
    "<strong>Urgent gynaecology review</strong>",
    "May require diagnostic laparoscopy ± prior ultrasound (e.g. ovarian cyst / ectopic / appendicitis). If ultrasound would cause delay, act on clinical grounds.",
    "Would ultrasound change management? Only the gynaecology registrar or consultant should call in the ultrasound consultant after hours, and only after direct assessment by the gynaecology registrar and discussion with the gynaecology consultant."
  ];

  const HEAVY_BLEEDING_ACTIONS = [
    "Prompt speculum examination to view and remove any POC in the cervix (send to pathology)",
    "Swabs for chlamydia (age &lt;25) and M&amp;C if indicated"
  ];

  const PAIN_ACTIONS = [
    "VE for uterine size and signs of ectopic pregnancy, e.g. adnexal mass and/or tenderness, cervical excitation",
    "Analgesia",
    "Consider gynaecology review, particularly if risk factors for ectopic, unilateral pain or severe pain"
  ];

  // §4.6 Out of Hours Ultrasound
  const OUT_OF_HOURS_US = {
    open: "If there is a medium to high level of suspicion of ectopic pregnancy and the ultrasound department is open, discuss referral with the US supervisor.",
    after: [
      "Ultrasound by a credentialed staff member, if available",
      "Refer to next EPAS clinic, if satisfied the risk of acute ectopic complication is low",
      "Admit for observation and departmental ultrasound the following morning, if not convinced discharge is safe",
      "Urgent ultrasound by the ultrasonologist on call — only after review by the gynaecology registrar and if it will change management. The decision for laparoscopy/surgery will usually be determined by clinical findings and may not be affected by ultrasound, which is often difficult in these circumstances and may not be diagnostic anyway."
    ]
  };

  // §4.2 Communication
  const COMMUNICATION = [
    "Inform the woman of the assessment findings and diagnosis, and provide consumer information",
    "Provide reassurance, and be aware of the potential for psychological trauma — allow adequate time for the woman to make decisions",
    "Provide access to formal counselling when necessary",
    "Use \"pregnancy tissue\" rather than \"POC\" with the woman and her family"
  ];

  const PATIENT_INFO = {
    factSheet: {
      url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Pain_bleeding_early_pregnancy_240501.pdf",
      label: "Pain and bleeding in early pregnancy — fact sheet (PDF, May 2024)"
    },
    bleeding: {
      url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/bleeding-in-early-pregnancy",
      label: "Bleeding in early pregnancy — patient information (The Women's)"
    },
    ectopic: {
      url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/ectopic-pregnancy",
      label: "Ectopic pregnancy — patient information (The Women's)"
    },
    miscarriage: {
      url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/miscarriage",
      label: "Miscarriage — patient information (The Women's)"
    },
    mole: {
      url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/hydatidiform-mole",
      label: "Hydatidiform mole — patient information (The Women's)"
    }
  };

  // §4.3 Clinical presentations, §4.5 hCG patterns, Appendix B — reference cards
  const REFERENCE_CARDS = [
    {
      name: "Live intrauterine pregnancy",
      sections: [
        ["Definitive diagnosis", ["Ultrasound demonstrating a live intrauterine embryo — usually seen on transvaginal scan after 6 weeks gestation or with hCG level >10,000 IU/L"]],
        ["Note", ["Consider heterotopic pregnancy if pain persists in the presence of a confirmed live intrauterine pregnancy, especially following ovulation induction or assisted reproduction"]]
      ]
    },
    {
      name: "Miscarriage",
      sections: [
        ["Definitive diagnosis", [
          "Passage of confirmed POC. Fibrous clot/decidual cast can be difficult to differentiate — send suspected POC to pathology for histopathological examination.",
          "Accredited ultrasound report with findings consistent with ASUM guidelines for the diagnosis of miscarriage"
        ]],
        ["Clinically likely (but not diagnostic) if", [
          "Increasing vaginal bleeding with clots and crampy lower abdominal pain",
          "Decrease/disappearance of pregnancy symptoms such as nausea and urinary frequency"
        ]],
        ["Possible", ["Mild bleeding or spotting"]],
        ["Note", ["Hypotension with bradycardia may occur due to vagal stimulation from cervical dilatation on passage of POC. Hypotension may be out of proportion to observed blood loss and is rapidly improved by removing any POC from the cervix (speculum examination)."]],
        ["Management", ["Missed, incomplete and complete miscarriage: see Miscarriage: Management – Guideline"]]
      ],
      patientInfo: PATIENT_INFO.miscarriage
    },
    {
      name: "Ectopic pregnancy",
      sections: [
        ["Definitive diagnosis", ["Surgical", "Live ectopic pregnancy on ultrasound examination"]],
        ["Presumptive diagnosis", ["Ultrasound findings of empty uterus and adnexal mass with elevated hCG"]],
        ["Clinically likely if (in early pregnancy)", ["Shoulder pain", "Fainting episodes", "Severe pain", "Tender adnexum", "Cervical excitation", "Acute abdomen ± shock"]],
        ["Differential diagnosis", ["Early intrauterine pregnancy with bleeding corpus luteum or other pathology"]],
        ["Important", ["Ectopic pregnancy needs to be excluded in all women presenting in early pregnancy with pain and/or bleeding who have not had a previously confirmed intrauterine pregnancy"]],
        ["Management", ["See Ectopic Pregnancy Management – Guideline"]]
      ],
      patientInfo: PATIENT_INFO.ectopic
    },
    {
      name: "Pregnancy of unknown location (PUL)",
      sections: [
        ["Definition", ["Raised hCG without ultrasound evidence of intra- or extra-uterine pregnancy"]],
        ["Differential diagnosis", ["Normal early pregnancy (until around 5 weeks gestation)", "Ectopic pregnancy", "Early failing pregnancy", "Complete miscarriage"]],
        ["Important", [
          "Ectopic pregnancy is not excluded until location is identified or complete miscarriage confirmed",
          "Provide education regarding symptoms of ruptured ectopic, and advise the woman to urgently re-present to emergency"
        ]],
        ["Management", [
          "May include observation, serial serum hCG levels and serial ultrasound examinations",
          "The clinical picture can sometimes indicate treatment, including laparoscopy or methotrexate, without confirming location of pregnancy",
          "Any PUL on an external report should be rescanned in the department (Appendix B)"
        ]]
      ],
      patientInfo: PATIENT_INFO.ectopic
    },
    {
      name: "Hydatidiform mole",
      sections: [
        ["Diagnosis", [
          "Usually diagnosed by typical ultrasound findings or following histological examination of products of conception",
          "May be associated with very high hCG levels and hyperemesis"
        ]],
        ["Important", ["Gynaecology team should refer all confirmed cases to the Gestational Trophoblastic Disease Registry"]]
      ],
      patientInfo: PATIENT_INFO.mole
    },
    {
      name: "hCG patterns in early pregnancy",
      sections: [
        ["Consider together with the clinical picture", [
          "Doubling every 48 hours: normal (does not exclude ectopic or miscarriage)",
          "Sustained fall: suggestive of miscarriage (does not exclude ectopic)",
          "Plateau / slow rise or fall: suggestive of miscarriage or ectopic pregnancy",
          "Fluctuating levels: highly suggestive of ectopic pregnancy"
        ]],
        ["Note", [
          "After approximately 7 weeks gestation, short-term changes in hCG are unlikely to be helpful (except catastrophic falls); hCG peaks in the late first trimester, then plateaus and falls in normal pregnancy",
          "hCG should not routinely be ordered for women who have already had an intrauterine pregnancy confirmed"
        ]]
      ],
      patientInfo: PATIENT_INFO.factSheet
    },
    {
      name: "Accepting external ultrasound reports (Appendix B)",
      sections: [
        ["Minimum requirements", ["Clinician with DDU or COGU qualification"]],
        ["Live pregnancy", ["Presence of fetal heart", "CRL or BPD measurement", "EDD"]],
        ["Failed pregnancy", [
          "Sac dimensions, or at least a mean gestational sac diameter",
          "Comment on presence or absence of yolk sac and/or fetal pole (presence excludes the GS being a pseudosac)",
          "Size of fetal pole (and estimated gestational age)",
          "Absence of fetal cardiac pulsations",
          "2 sequential scans at least 7 days apart if first scan was inconclusive (CRL <7 mm or MGS <25 mm)",
          "If only GS present: comment on free fluid and adnexal masses, and both ovaries visualised"
        ]],
        ["Ectopic pregnancy", ["Absence of intrauterine pregnancy", "Localisation", "Presence/absence of GS, fetal pole, cardiac activity", "Size", "Presence of free fluid or clots"]],
        ["Pregnancy of unknown location", ["Any PUL should be rescanned in the department"]]
      ]
    }
  ];

  const RELATED_GUIDELINES = [
    "Ectopic pregnancy: Ectopic Pregnancy Management – Guideline",
    "Missed, incomplete or complete miscarriage: Miscarriage: Management – Guideline",
    "Anti-D: Anti-D (RhD) Immunoglobulin Use in Maternity Patients – Guideline (Appendix C)"
  ];

  // ---- state machine ----------------------------------------------------------

  let state = {};
  let navStack = []; // { screen, state snapshot }
  let currentScreen = "intro";

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function go(screenName, opts) {
    opts = opts || {};
    if (!opts.isBack) {
      navStack.push({ screen: currentScreen, state: clone(state) });
    }
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

  // Pastel action panel with real, tickable checkboxes — used for any actionable checklist.
  function actionPanel(kind, titleText, items) {
    const div = document.createElement("div");
    div.className = "action-panel " + kind;
    const strong = document.createElement("strong");
    strong.textContent = titleText;
    div.appendChild(strong);
    items.forEach(i => {
      const id = "chk" + (checkIdCounter++);
      const row = document.createElement("div");
      row.className = "action-item";
      row.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${i}</label>`;
      div.appendChild(row);
    });
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
      if (b.disabled) btn.disabled = true;
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

  // Mandatory multi-select with "None of the above" (same behaviour as
  // screenContraindications() in miscarriage-management/app.js).
  // Calls onContinue(selectedKeys) — an empty array means "None of the above".
  function mandatoryMultiSelect(items, onContinue) {
    const prefix = "ms" + (checkIdCounter++) + "_";
    const wrap = document.createElement("div");
    wrap.innerHTML = items.map(it => `
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}${it.key}" data-key="${it.key}">
        <label for="${prefix}${it.key}"><span class="row-title">${it.label}</span>${it.hint ? `<span class="row-hint">${it.hint}</span>` : ""}</label>
      </div>`).join("") + `
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}none">
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
    continueBtn.disabled = true;
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "actions-row";
    actionsWrap.appendChild(continueBtn);
    app.appendChild(actionsWrap);

    function anySelected() { return noneBox.checked || findingBoxes.some(cb => cb.checked); }
    function refreshState() {
      continueBtn.disabled = !anySelected();
      if (anySelected()) errorMsg.style.display = "none";
    }

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

  function labelsFor(list, keys) {
    return list.filter(it => keys.includes(it.key)).map(it => it.label);
  }

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "gestation": return screenGestation();
      case "symptoms": return screenSymptoms();
      case "outOfScope": return screenOutOfScope();
      case "initialAssessment": return screenInitialAssessment();
      case "safetyUnstable": return screenSafetyUnstable();
      case "urgentUnstable": return screenUrgentUnstable();
      case "safetyBleeding": return screenSafetyBleeding();
      case "heavyBleeding": return screenHeavyBleeding();
      case "pocFound": return screenPocFound();
      case "pocNotFound": return screenPocNotFound();
      case "riskFactors": return screenRiskFactors();
      case "priorIup": return screenPriorIup();
      case "painQ": return screenPainQ();
      case "painAssessment": return screenPainAssessment();
      case "suspicion": return screenSuspicion();
      case "epasDischarge": return screenEpasDischarge();
      case "admit": return screenAdmit();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "Pain and Bleeding in Early Pregnancy", "Step-by-step initial assessment, investigation and referral for women with pain and/or bleeding in early pregnancy, following the §4.1 assessment algorithm.");
    app.appendChild(banner("info", "Before you start", [
      "Early pregnancy means all gestations up to 13 weeks + 6 days.",
      "The conditions to be distinguished are ectopic pregnancy, pregnancy of unknown location, miscarriage, hydatidiform mole and live intrauterine pregnancy.",
      "Covers initial assessment, red flags, triage and referral (WEC / gynaecology / EPAS / discharge).",
      "Does not cover treatment of a confirmed diagnosis — see the Ectopic Pregnancy Management and Miscarriage: Management guidelines.",
      "EPAS does not conduct dating scans or manage hyperemesis."
    ]));
    app.appendChild(actionsRow([
      { label: "Start", primary: true, onClick: () => go("gestation") }
    ]));
  }

  function screenGestation() {
    screenShell(0, "Gestation", "Is the woman in early pregnancy (up to 13 weeks + 6 days)?");
    app.appendChild(optionList([
      { label: "Yes — up to 13 weeks + 6 days", onClick: () => { state.inScope = true; go("symptoms"); } },
      { label: "No — 14 weeks or more", hint: "Outside guideline scope", onClick: () => { state.scopeReason = "gestation"; go("outOfScope"); } }
    ]));
  }

  function screenSymptoms() {
    screenShell(0, "Presenting symptoms", "Is she presenting with pain and/or vaginal bleeding?");
    app.appendChild(optionList([
      { label: "Yes — pain and/or vaginal bleeding", onClick: () => go("initialAssessment") },
      { label: "No", hint: "e.g. dating scan request or hyperemesis only", onClick: () => { state.scopeReason = "symptoms"; go("outOfScope"); } }
    ]));
  }

  function screenOutOfScope() {
    screenShell(OUTCOME, "Outside guideline scope");
    const items = state.scopeReason === "gestation"
      ? ["This guideline covers early pregnancy only: all gestations up to 13 weeks + 6 days.",
         "Assess and manage according to the appropriate later-pregnancy pathway."]
      : ["This guideline covers women with pain and/or vaginal bleeding in early pregnancy.",
         "EPAS does not conduct dating scans or manage hyperemesis — refer via the appropriate service."];
    app.appendChild(banner("warn", "This presentation is not covered", items));
    app.appendChild(actionsRow([{ label: "Restart", primary: true, onClick: restart }]));
  }

  function screenInitialAssessment() {
    screenShell(1, "Initial assessment", "Complete the initial assessment (§4.1 algorithm).");
    app.appendChild(actionPanel("info", "Initial assessment", INITIAL_ASSESSMENT));
    app.appendChild(actionsRow([
      { label: "Continue", primary: true, onClick: () => go("safetyUnstable") }
    ]));
    app.appendChild(optionList([
      { label: "She is unstable or has an acute abdomen — go to urgent actions now", onClick: () => go("urgentUnstable"), danger: true }
    ]));
  }

  function screenSafetyUnstable() {
    screenShell(2, "Safety check 1 of 2", "Is the woman haemodynamically unstable, or does she have an acute abdomen?");
    app.appendChild(optionList([
      { label: "Yes", hint: "Haemodynamically unstable and/or acute abdomen", onClick: () => go("urgentUnstable"), danger: true },
      { label: "No", onClick: () => go("safetyBleeding") }
    ]));
  }

  function screenUrgentUnstable() {
    screenShell(OUTCOME, "Urgent: haemodynamic instability / acute abdomen");
    app.appendChild(actionPanel("bad", "Assess in Women's Emergency Care (WEC) — urgent care", URGENT_ACTIONS));
    app.appendChild(banner("info", "Consider vagal hypotension", [
      "Hypotension with bradycardia may occur due to vagal stimulation from cervical dilatation on passage of POC. It may be out of proportion to observed blood loss and is rapidly improved by removing any POC from the cervix (speculum examination)."
    ]));
    finalActions();
  }

  function screenSafetyBleeding() {
    screenShell(2, "Safety check 2 of 2", "Is there current heavy vaginal bleeding — more than 2 soaked pads per hour?");
    app.appendChild(optionList([
      { label: "Yes — more than 2 soaked pads per hour", onClick: () => go("heavyBleeding"), danger: true },
      { label: "No", onClick: () => go("riskFactors") }
    ]));
  }

  function screenHeavyBleeding() {
    screenShell(3, "Heavy vaginal bleeding", "More than 2 soaked pads per hour.");
    app.appendChild(actionPanel("warn", "Actions", HEAVY_BLEEDING_ACTIONS));
    const q = document.createElement("p");
    q.className = "screen-subtitle";
    q.innerHTML = "<strong>Were POC found at speculum examination?</strong>";
    app.appendChild(q);
    app.appendChild(optionList([
      { label: "Yes — POC found", onClick: () => { state.pathway = "pocFound"; go("pocFound"); } },
      { label: "No POC found", onClick: () => { state.pathway = "pocNotFound"; go("pocNotFound"); } }
    ]));
  }

  function screenPocFound() {
    screenShell(OUTCOME, "Outcome: treat as miscarriage");
    app.appendChild(actionPanel("ok", "POC found at speculum examination", [
      "Treat as miscarriage — refer to the Miscarriage: Management – Guideline",
      "Send POC to pathology for histopathological examination"
    ]));
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = "../miscarriage-management/index.html";
    a.textContent = "Open Miscarriage Management →";
    p.appendChild(a);
    app.appendChild(p);
    outcomeBlock([PATIENT_INFO.miscarriage, PATIENT_INFO.bleeding]);
    finalActions();
  }

  function screenPocNotFound() {
    screenShell(OUTCOME, "Outcome: gynaecology review");
    app.appendChild(actionPanel("warn", "No POC found at speculum examination", [
      "Gynaecology review regarding urgency of ultrasound / admission"
    ]));
    outcomeBlock([PATIENT_INFO.bleeding, PATIENT_INFO.ectopic]);
    finalActions();
  }

  function screenRiskFactors() {
    screenShell(3, "Risk factors for ectopic", "Does the woman have any of the following? (required)");
    mandatoryMultiSelect(ECTOPIC_RISK_FACTORS, keys => {
      state.riskFactors = keys;
      go("priorIup");
    });
  }

  function screenPriorIup() {
    screenShell(3, "Previous ultrasound", "Has an intrauterine pregnancy already been confirmed on ultrasound in this pregnancy?");
    app.appendChild(optionList([
      { label: "Yes — intrauterine pregnancy previously confirmed", onClick: () => { state.priorIup = true; go("painQ"); } },
      { label: "No / not yet confirmed / unsure", hint: "Ectopic pregnancy needs to be excluded", onClick: () => { state.priorIup = false; go("painQ"); } }
    ]));
  }

  function screenPainQ() {
    screenShell(3, "Pain", "Is the woman experiencing pain?");
    app.appendChild(optionList([
      { label: "Yes", onClick: () => { state.pain = true; go("painAssessment"); } },
      { label: "No", hint: "Refer to EPAS", onClick: () => { state.pain = false; state.pathway = "epas"; go("epasDischarge"); } }
    ]));
  }

  function screenPainAssessment() {
    screenShell(3, "Pain assessment", "Complete the assessment, then record the findings below.");
    app.appendChild(actionPanel("info", "Actions", PAIN_ACTIONS));
    app.appendChild(banner("info", "If prompt ultrasound is not available", [
      "Vaginal examination to determine the level of suspicion of ectopic pregnancy, and therefore the urgency of further assessment, should be considered."
    ]));
    if (state.priorIup) app.appendChild(heterotopicBanner());
    const q = document.createElement("p");
    q.className = "screen-subtitle";
    q.innerHTML = "<strong>Which of the following are present? (required)</strong>";
    app.appendChild(q);
    mandatoryMultiSelect(PAIN_FINDINGS, keys => {
      state.painFindings = keys;
      go("suspicion");
    });
  }

  function screenSuspicion() {
    screenShell(3, "Clinical suspicion of ectopic", "Based on your assessment, what is the clinical suspicion of ectopic pregnancy?");
    const risks = labelsFor(ECTOPIC_RISK_FACTORS, state.riskFactors || []);
    const findings = state.painFindings || [];
    const reviewTriggers = risks.concat(labelsFor(PAIN_FINDINGS.filter(f => f.gynaeReview), findings));
    const signs = labelsFor(PAIN_FINDINGS.filter(f => f.ectopicSign), findings);

    if (reviewTriggers.length) {
      app.appendChild(banner("warn", "Consider gynaecology review", [
        "The algorithm advises considering gynaecology review particularly with risk factors for ectopic, unilateral pain or severe pain. Present: " + reviewTriggers.join(", ") + "."
      ]));
    }
    if (findings.includes("severe")) {
      app.appendChild(banner("warn", "Severe pain", [
        "Any woman with severe pain, heavy vaginal bleeding and/or haemodynamic instability should be assessed in the Women's Emergency Care (WEC) for urgent care (§1)."
      ]));
    }
    if (signs.length) {
      app.appendChild(banner("info", "Features that make ectopic clinically likely (§4.3.3)", [
        "Present: " + signs.join(", ") + "."
      ]));
    }
    if (!state.priorIup) {
      app.appendChild(banner("info", "No confirmed intrauterine pregnancy", [
        "Ectopic pregnancy needs to be excluded in all women presenting with pain and/or bleeding who have not had a previously confirmed intrauterine pregnancy."
      ]));
    }

    app.appendChild(optionList([
      { label: "Low clinical suspicion of ectopic", hint: "Refer to EPAS", onClick: () => { state.suspicion = "low"; state.pathway = "epas"; go("epasDischarge"); } },
      { label: "Moderate or high clinical suspicion of ectopic", hint: "Admit for observation until ultrasound", onClick: () => { state.suspicion = "modHigh"; state.pathway = "admit"; go("admit"); }, danger: true }
    ]));
  }

  function screenEpasDischarge() {
    screenShell(OUTCOME, "Outcome: refer to EPAS and discharge");
    const reason = state.pain ? "Pain with low clinical suspicion of ectopic." : "No heavy bleeding, no pain, stable.";
    app.appendChild(banner("info", reason));
    app.appendChild(actionPanel("ok", "Plan", [
      "Refer to EPAS for ongoing outpatient management (weekday morning clinic within WEC)",
      "Discharge the woman home",
      "Advise her to re-present for emergency care if she develops worsening pain or heavy PV bleeding"
    ]));
    if (state.pain) {
      app.appendChild(banner("info", "Out of hours (§4.6)", [
        "Refer to the next EPAS clinic if satisfied the risk of acute ectopic complication is low.",
        "Admit for observation and departmental ultrasound the following morning if not convinced discharge is safe."
      ]));
    }
    const info = [PATIENT_INFO.bleeding];
    if (!state.priorIup) info.push(PATIENT_INFO.ectopic);
    outcomeBlock(info);
    finalActions();
  }

  function screenAdmit() {
    screenShell(OUTCOME, "Outcome: admit for observation");
    app.appendChild(actionPanel("bad", "Moderate or high clinical suspicion of ectopic", [
      "Admit for observation / clinical management until ultrasound examination can be arranged"
    ]));
    app.appendChild(actionPanel("warn", "Arranging ultrasound (§4.6)", [
      "Ultrasound department open: " + OUT_OF_HOURS_US.open
    ]));
    app.appendChild(banner("warn", "After ultrasound department hours — options depend on the clinical situation", OUT_OF_HOURS_US.after));
    outcomeBlock([PATIENT_INFO.ectopic, PATIENT_INFO.bleeding]);
    finalActions();
  }

  // ---- shared outcome blocks ------------------------------------------------------

  function heterotopicBanner() {
    return banner("info", "Intrauterine pregnancy previously confirmed", [
      "Consider heterotopic pregnancy if pain persists in the presence of a confirmed live intrauterine pregnancy, especially following ovulation induction or assisted reproduction.",
      "hCG should not routinely be ordered for women who have already had an intrauterine pregnancy confirmed."
    ]);
  }

  function outcomeBlock(patientInfos) {
    if (state.priorIup === true) {
      app.appendChild(heterotopicBanner());
    } else {
      app.appendChild(banner("info", "Ectopic not yet excluded", [
        "Ectopic pregnancy needs to be excluded in all women presenting in early pregnancy with pain and/or bleeding who have not had a previously confirmed intrauterine pregnancy.",
        "Ectopic pregnancy is not excluded until location is identified or complete miscarriage confirmed."
      ]));
    }

    const box = document.createElement("div");
    box.className = "checklist-box";
    box.innerHTML = "<h3>Communication</h3>";
    COMMUNICATION.forEach(i => box.appendChild(checkRow(i)));

    const h3b = document.createElement("h3");
    h3b.textContent = "Safety-net advice";
    h3b.style.marginTop = "1rem";
    box.appendChild(h3b);
    box.appendChild(checkRow("Advise to re-present for emergency care if she develops worsening pain or heavy PV bleeding"));
    if (state.priorIup !== true) {
      box.appendChild(checkRow("Educate regarding symptoms of ruptured ectopic and advise her to urgently re-present to emergency — e.g. shoulder pain, fainting episodes, severe pain (§4.3.3)"));
    }
    app.appendChild(box);

    const infoWrap = document.createElement("div");
    [PATIENT_INFO.factSheet].concat(patientInfos).forEach(pi => infoWrap.appendChild(patientInfoLink(pi)));
    app.appendChild(infoWrap);

    const refHead = document.createElement("h3");
    refHead.textContent = "Reference";
    app.appendChild(refHead);
    REFERENCE_CARDS.forEach(appendReferenceCard);

    app.appendChild(banner("info", "Related RWH guidelines", RELATED_GUIDELINES));
  }

  function checkRow(text) {
    const id = "chk" + (checkIdCounter++);
    const row = document.createElement("div");
    row.className = "action-item";
    row.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${text}</label>`;
    return row;
  }

  // Collapsible descriptive card (plain bullets) — expanded in print view by shared.css.
  function appendReferenceCard(ref) {
    const card = document.createElement("div");
    card.className = "modality-card";
    card.innerHTML = `
      <div class="modality-head"><span class="modality-name">${ref.name}</span></div>
      <div class="modality-body"></div>
    `;
    const body = card.querySelector(".modality-body");
    ref.sections.forEach(([title, items]) => {
      const h4 = document.createElement("h4");
      h4.textContent = title;
      body.appendChild(h4);
      const ul = document.createElement("ul");
      items.forEach(i => { const li = document.createElement("li"); li.textContent = i; ul.appendChild(li); });
      body.appendChild(ul);
    });
    if (ref.patientInfo) body.appendChild(patientInfoLink(ref.patientInfo));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
  }

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
