/* ============================================================================
   Ectopic Pregnancy Management
   Decision-support logic derived from:
   "Ectopic Pregnancy Management - Guideline", RWH0192462 v4.0, The Royal
   Women's Hospital, Women's Health Services, Early Pregnancy Assessment
   Service (EPAS). Last review 01/05/2026.
   This is an independent companion resource, not an official RWH product.
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Safety checks", "Diagnosis", "Findings", "MTX criteria", "Preference", "Result"];
  const RESULT = PHASES.length - 1;

  // §4.3 thresholds
  const HCG_THRESHOLD = 3500;       // surgical if ≥, medical requires <
  const MASS_THRESHOLD_CM = 3.5;    // surgical if ≥, medical requires <
  const EXPECTANT_HCG = 1000;       // "usually well below 1,000 IU/L"

  const PATIENT_INFO = {
    ectopic: {
      url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/ectopic-pregnancy",
      label: "Ectopic pregnancy — patient information (The Women's)"
    },
    methotrexate: {
      url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Methotrexate-for-ectopic-pregnancy-July2017.pdf",
      label: "Methotrexate for ectopic pregnancy — patient information (PDF)"
    },
    daySurgery: {
      url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Day_surgery_at_the_Women_s_260624.pdf",
      label: "Day surgery at the Women's — patient information (PDF)"
    }
  };

  // §4.6 / Appendix B — methotrexate single-dose regimen
  const MTX_MG_PER_M2 = 50;
  const MTX_STOCKED_MG = [50, 70, 80, 90, 100];
  const MTX_DOSE_TABLE = [[1.3, "70"], [1.4, "70"], [1.5, "80"], [1.6, "80"], [1.7, "*90"], [1.8, "*90"], [1.9, "100"], [2, "100"]];
  const BSA_TABLE_HEIGHTS = [140, 150, 160, 170, 180, 190, 200];
  const BSA_TABLE = [
    [40, [1.24, 1.30, 1.37, 1.43, 1.49, null, null]],
    [50, [1.36, 1.43, 1.50, 1.57, 1.63, 1.70, null]],
    [60, [1.47, 1.55, 1.62, 1.69, 1.77, 1.84, 1.91]],
    [70, [1.57, 1.65, 1.73, 1.81, 1.89, 1.96, 2.04]],
    [80, [null, 1.75, 1.83, 1.92, 2.00, 2.08, 2.15]],
    [90, [null, null, 1.93, 2.01, 2.10, 2.18, 2.27]],
    [100, [null, null, 2.02, 2.11, 2.20, 2.28, 2.37]],
    [110, [null, null, null, 2.19, 2.29, 2.38, 2.47]],
    [120, [null, null, null, 2.28, 2.37, 2.47, 2.56]],
    [130, [null, null, null, 2.35, 2.45, 2.55, 2.65]]
  ];

  // §4.3 medical criteria that are screened as a mandatory multi-select
  const MTX_CRITERIA = [
    { key: "bloods", label: "LFTs, UEC or FBE abnormal", hint: "Liver, renal or bone marrow impairment" },
    { key: "mtxCx", label: "Known contraindication to methotrexate", hint: "e.g. aplastic anaemia, active liver disease. Refer to MIMS if in doubt." },
    { key: "iup", label: "Co-existing intrauterine pregnancy" },
    { key: "breastfeeding", label: "Breastfeeding" },
    { key: "contraception", label: "Will not use reliable contraception for 3 months from the last methotrexate dose" },
    { key: "followUp", label: "Unable or unwilling to attend regular follow-up, or does not clearly understand the risks and indicators for seeking urgent care", hint: "Follow-up is usually 1–2 per week for 3 weeks" },
    { key: "drugs", label: "Currently taking NSAIDs, diuretics, penicillin or tetracycline-group drugs", hint: "Caution — the guideline notes this is not so critical for the single-dose regimen", caution: true }
  ];

  // §4.3 table, verbatim criteria (descriptive)
  const CRITERIA = {
    surgical: [
      "Not haemodynamically stable",
      "Intraperitoneal bleeding on the basis of clinical or ultrasound findings",
      "Fetal heart activity on ultrasound examination",
      "Adnexal mass measuring ≥3.5 cm by ultrasound",
      "β-hCG level ≥3,500 IU/L",
      "Moderate to severe pelvic pain",
      "Any contraindication to medical management"
    ],
    medical: [
      "Haemodynamically stable",
      "No or mild pelvic pain; no significant pelvic tenderness on vaginal examination",
      "β-hCG <3,500 IU/L (note: may bleed or rupture at much lower hCG levels)",
      "Transvaginal ultrasound shows no fetal heart activity, an unruptured ectopic mass <3.5 cm and no significant blood in the peritoneal cavity or pouch of Douglas",
      "Will use reliable contraception for 3 months from the last methotrexate dose",
      "Normal LFTs, UEC and FBE (no liver, renal or bone marrow impairment)",
      "No known contraindications to methotrexate, e.g. aplastic anaemia, active liver disease (refer to MIMS if in doubt)",
      "Not currently taking NSAIDs, diuretics, penicillin or tetracycline-group drugs (not so critical for the single-dose regimen)",
      "No co-existing intrauterine pregnancy",
      "Not breastfeeding",
      "Absence of an intrauterine pregnancy confirmed on an accredited ultrasound (Appendix C)",
      "Woman clearly understands the risks and indicators for seeking urgent care, and is willing to attend regular follow-up (usually 1–2 per week for 3 weeks)"
    ],
    expectant: [
      "Failing pregnancy / tubal miscarriage likely, and the woman is willing to attend follow-up as necessary",
      "No pain or tenderness attributed to the ectopic",
      "Low/falling β-hCG levels (usually well below 1,000 IU/L)",
      "Ultrasound findings inconclusive (i.e. location of the pregnancy may not be established with certainty)"
    ]
  };

  const SIDE_EFFECTS = [
    "Nausea and vomiting",
    "Abdominal cramping and indigestion",
    "Skin rashes and sensitivity to sunlight",
    "Fatigue",
    "Light-headedness/dizziness",
    "Alopecia and mucositis are rare at doses prescribed for ectopic pregnancy"
  ];

  const WEEKEND_RULE = "Where day 4 or 7 falls on a weekend or public holiday, advise the woman to present to WEC for blood tests, and inform the WEC nurse in charge to place her on the <em>expects list</em>";

  const MODALITIES = {
    surgical: {
      name: "Surgical management",
      sections: [
        ["About", false, [
          "Surgery is the default treatment for ectopic pregnancy, because of the risk of intraperitoneal haemorrhage and rupture of untreated ectopic pregnancy, with associated morbidity and mortality."
        ]],
        ["Treatment schedule", true, [
          "Explain treatment to the woman (and partner) and provide the information booklet on ectopic pregnancy",
          "Obtain written informed consent",
          "Arrange date and time for surgery, including booking of Operating Theatre and inpatient bed",
          "Request/arrange pre-treatment bloods (β-hCG, group and hold, FBE)",
          "Prescribe Anti-D for Rhesus negative women according to the Anti-D (RhD) Immunoglobulin Use in Maternity Patients – Guideline"
        ]],
        ["Before proceeding", false, [
          "Confirm the diagnosis on an accredited ultrasound (Appendix C) where possible. When clinical suspicion is high and the woman is haemodynamically unstable, urgent surgery may be indicated without an accredited scan, in discussion with the Gynaecology consultant.",
          "Where there is diagnostic uncertainty, especially if β-hCG is low (<3,500 IU/L), confirm the ectopic pregnancy at the time of surgery before any uterine instrumentation."
        ]],
        ["Surgical method", false, [
          "Haemodynamically stable: a laparoscopic approach is preferable to an open approach",
          "Salpingectomy is often performed, particularly if: the tube is severely damaged; there is uncontrolled bleeding; there is a recurrent ectopic in the same tube; there is a large tubal pregnancy >5 cm; or the woman has completed her family",
          "If the tube presumed to contain the ectopic appears morphologically normal at surgery, it is good practice to seek a second opinion (another gynaecologist or the on-call ultrasound consultant) before proceeding with salpingectomy",
          "Laparoscopic salpingotomy should be considered as the primary treatment if the woman has contralateral tube disease or absence of tube, and desires future fertility"
        ]],
        ["If the family wants to bury the pregnancy tissue at home", true, [
          "Ensure the remains are not placed in formalin",
          "Consult a bereavement worker",
          "Discuss with Anatomical Pathology staff",
          "Refer to the Perinatal Bereavement – Framework"
        ]],
        ["On discharge after surgery", true, [
          "Provide contact numbers / appointments for Women's Social Support Services / Pastoral Care &amp; Spirituality Services, and the information booklet on ectopic pregnancy",
          "Advise her to see her GP in one week for removal of sutures (if required)",
          "Advise her what to expect (pain, bleeding etc.) and to take simple analgesia for pain",
          "Advise her to contact the registrar of the operating unit, or WEC, if concerned about pain or bleeding",
          "Ensure a contraceptive plan is in place",
          "Ensure clinical review is planned to discuss future fertility and pregnancy care, including referral to the gynae post-operative clinic",
          "Complete the discharge summary and ensure the woman's GP is informed"
        ]],
        ["Post-salpingotomy, or if doubt remains about diagnosis or completeness of removal", true, [
          "Refer to EPAS for follow-up plan",
          "Day 3 β-hCG, and clinical review by Gynaecology registrar if symptoms or results indicate",
          "Day 7 β-hCG, and clinical review by Gynaecology registrar if symptoms or results indicate",
          "If β-hCG plateaus or rises, consider medical treatment",
          "Repeat ultrasound only if more than a week post-op, and it must be discussed with the ultrasound consultant"
        ]]
      ],
      patientInfo: [PATIENT_INFO.daySurgery, PATIENT_INFO.ectopic]
    },
    medical: {
      name: "Medical management (single-dose methotrexate)",
      sections: [
        ["About", false, [
          "May be considered if diagnostic parameters indicate haemorrhage and rupture are less likely, and the woman clearly understands the risks and indicators for seeking urgent care and is willing to attend regular follow-up (usually 1–2 per week for 3 weeks)."
        ]],
        ["Before treatment", true, [
          "Confirm an intrauterine pregnancy has been excluded on an accredited ultrasound (Appendix C)",
          "Where there is any diagnostic ambiguity or complexity, or uncertainty about the appropriateness of medical management, discuss with the gynaecology consultant on call",
          "Document discussions with the woman and consultant in the medical record",
          "Complete and document the plan in the EPIC patient file"
        ]],
        ["Treatment schedule", true, [
          "Explain treatment to the woman (and partner); provide the information booklet on ectopic pregnancy and contact details for EPAS and WEC; discuss methotrexate side effects",
          "Collect pre-treatment bloods (β-hCG, UEC, LFTs, FBE)",
          "Prescribe Anti-D for Rhesus negative women according to the Anti-D (RhD) Immunoglobulin Use in Maternity Patients – Guideline",
          "Obtain weight and height and calculate body surface area (Mosteller method) — see calculator below",
          "Obtain verbal informed consent, documented in the medical record",
          "Arrange admission onto ward 5 North for administration of methotrexate",
          "Prescribe a single dose of methotrexate, written up as the total dose in mg: 50 mg/m² BSA, rounded up or down to the nearest 10 mg (usually between 70 and 110 mg). Refer to Appendix B."
        ]],
        ["Dose calculator", "calculator"],
        ["Potential side effects", false, SIDE_EFFECTS],
        ["Discharge arrangements", true, [
          "Arrange follow-up on day 4 and day 7 (methotrexate given on day 1)",
          "Refer to EPAS for planned and documented follow-up",
          WEEKEND_RULE,
          "Provide contact numbers / appointments for Women's Social Support Services / Pastoral Care &amp; Spirituality Services",
          "Complete the discharge summary and notify the woman's GP"
        ]],
        ["Advise the woman", true, [
          "She may experience some pain in the abdomen as the pregnancy resolves",
          "She may take simple analgesia — if ineffective, present to WEC",
          "Avoid vaginal intercourse until the clinician is satisfied there is minimal risk of rupture of the ectopic",
          "Monitoring is needed to assess any changing symptoms and signs, as bleeding or rupture of the ectopic may still occur",
          "Contraception is recommended for 3 months",
          "Avoid alcohol for 7 days",
          "Avoid herbal remedies and vitamin preparations containing folate"
        ]],
        ["Follow-up and monitoring", true, [
          "Day 1: first dose of methotrexate given",
          "Day 4: β-hCG in EPAS (expected to rise). Clinical review by gynaecology registrar (or delegate); discuss with unit consultant gynaecologist if necessary",
          "Day 7: β-hCG in EPAS, plus FBE, UEC and LFTs. Clinical review by gynaecology registrar (or delegate)",
          "Day 14: β-hCG (other tests, e.g. FBE, if clinically indicated); clinical review by gynaecology registrar if indicated by symptoms or blood results",
          "Weekly follow-up until β-hCG is <5 IU/L (can take several weeks to fall); clinical review if indicated by symptoms or blood results"
        ]],
        ["If β-hCG does not fall by >15% between days 4 and 7", true, [
          "Discuss with unit consultant gynaecologist; consider whether surgery is indicated",
          "Consider a second dose of methotrexate on day 7 (required in ~15% of cases)",
          "Be guided by clinical findings such as peritoneal irritation and vital signs together with the β-hCG. Women with evidence of rupture or significant pelvic/abdominal tenderness should be discussed with a consultant gynaecologist and are likely to require surgery.",
          "Repeat ultrasound is usually unhelpful here (the ectopic mass and some free fluid will probably be seen). Some pain is expected and is not in itself an indication for ultrasound; discuss any referral with a consultant ultrasonologist."
        ]],
        ["If a second dose is given", true, [
          "Day 7: confirm normal LFTs. Give the injection in the opposite gluteal muscle from the first injection",
          "Day 11: β-hCG and clinical review by gynaecology registrar",
          "Day 14: FBE, β-hCG, LFTs, UEC and clinical review by gynaecology registrar",
          "Women with evidence of rupture or significant pelvic/abdominal tenderness should be discussed with a consultant gynaecologist and are likely to require surgery"
        ]],
        ["On completion of treatment (EPAS)", true, [
          "Ensure a contraceptive plan is in place",
          "Offer a 6-week clinical phone review with the EPAS registrar or delegate to discuss future fertility and pregnancy care",
          "Send a letter to the woman's GP"
        ]]
      ],
      patientInfo: [PATIENT_INFO.methotrexate, PATIENT_INFO.ectopic]
    },
    expectant: {
      name: "Expectant management",
      sections: [
        ["About", false, [
          "Consider if failing pregnancy / tubal miscarriage is likely and the woman is willing to attend follow-up as necessary."
        ]],
        ["Management plan", true, [
          "Explain the plan to the woman (and partner) and provide written information, including EPAS and WEC contact details",
          "Prescribe Anti-D for Rhesus negative women according to the Anti-D (RhD) Immunoglobulin Use in Maternity Patients – Guideline",
          "Arrange follow-up on day 4 and day 7 (day 1 = day of diagnosis and treatment plan), in conjunction with EPAS. Refer to EPAS with the plan and next follow-up",
          WEEKEND_RULE,
          "Provide contact numbers / appointments for Women's Social Support Services / Pastoral Care &amp; Spirituality Services, as appropriate",
          "Complete the discharge summary and notify the GP"
        ]],
        ["Advise the woman", true, [
          "She may experience some pain in the abdomen as the pregnancy resolves",
          "She may take simple analgesia — if ineffective, present to WEC",
          "Avoid vaginal intercourse until the clinician is satisfied there is minimal risk of rupture of the ectopic",
          "Monitoring is needed to assess any changing symptoms and signs, as bleeding or rupture of the ectopic may still occur"
        ]],
        ["Follow-up and monitoring", true, [
          "Day 1: diagnosis made and follow-up planned",
          "Day 4: clinical review by gynaecology registrar (or delegate), β-hCG; discuss with consultant gynaecologist if necessary",
          "Day 7: clinical review by gynaecology registrar (or delegate), β-hCG",
          "Day 14: β-hCG, and clinical review by gynaecology registrar if indicated by symptoms or blood results",
          "Weekly follow-up until β-hCG is <5 IU/L (can take several weeks to fall); clinical review if indicated by symptoms or blood results",
          "If β-hCG does not fall at each visit, discuss with consultant gynaecologist; consider whether surgery or methotrexate is indicated"
        ]],
        ["On completion of treatment (EPAS)", true, [
          "Offer a 6-week clinical phone review with the EPAS registrar or delegate to discuss future fertility and pregnancy care",
          "Send a letter to the woman's GP"
        ]]
      ],
      patientInfo: [PATIENT_INFO.ectopic]
    }
  };

  // §4.3 registrar responsibilities, escalation, §4.4 bereavement support
  const UNIVERSAL_CHECKLIST = [
    "Clinically assess the woman, including vaginal examination if planning non-surgical treatment",
    "Discuss proposed management with the gynaecology consultant",
    "Advise the woman of safe treatment options, advantages and disadvantages",
    "Ensure the woman participates in selecting the most appropriate treatment",
    "Clearly record plans for management and follow-up in the EPIC patient record",
    "Ectopic diagnosed in EPAS: escalate to the Acute Gynaecology registrar for review and plan (the EPAS HMO/junior registrar may initiate counselling, but all plans are discussed with the Acute Gynaecology registrar or consultant before being actioned)",
    "Anti-D for Rhesus negative women, per the Anti-D (RhD) Immunoglobulin Use in Maternity Patients – Guideline",
    "Where the woman and her partner are particularly distressed, consider referral to a bereavement support worker; provide contact details for Women's Social Support Services or Pastoral Care and Spirituality Services"
  ];

  const BEREAVEMENT_NOTES = [
    "The psychological impact of early pregnancy loss may seriously affect women and their partners",
    "When safe to do so, give time for the woman to make decisions, and make counselling available",
    "There may be little difference in psychological outcomes between surgical and medical management of ectopic pregnancy"
  ];

  const ACCREDITED_PROVIDERS = [
    "Any tertiary women's hospital (e.g. Mercy Hospital for Women, Monash Health – Monash Women's, Western Health – Joan Kirner Hospital)",
    "City Imaging Ultrasound for Women", "Peninsula Imaging Ultrasound for Women", "Camberwell Ultrasound for Women",
    "East Melbourne Ultrasound", "Eastern Ultrasound for Women", "Melbourne Ultrasound for Women", "Siles Health",
    "Monash Ultrasound for Women", "Northern Ultrasound for Women", "Specialist Imaging for Women",
    "Western Imaging for Women", "Women's Ultrasound Malvern", "Women's Imaging Centre", "WUME – Women's Ultrasound Melbourne"
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

  // Mandatory multi-select with "None of the above" (same pattern as
  // pain-bleeding-early-pregnancy/app.js). Calls onContinue(selectedKeys).
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

  function fmtHcg(n) { return n.toLocaleString("en-AU"); }

  // ---- clinical logic (§4.3) ---------------------------------------------------

  // Surgical indications from the findings screens (before the MTX screen).
  function findingIndications() {
    const out = [];
    if (state.fh) out.push("Fetal heart activity on ultrasound");
    if (state.mass !== null && state.mass >= MASS_THRESHOLD_CM) out.push(`Adnexal mass ≥3.5 cm (${state.mass} cm)`);
    if (state.hcg >= HCG_THRESHOLD) out.push(`β-hCG ≥3,500 IU/L (${fmtHcg(state.hcg)} IU/L)`);
    if (state.pain === "modsevere") out.push("Moderate to severe pelvic pain, or significant pelvic tenderness on VE");
    return out;
  }

  function mtxContraindications() {
    return MTX_CRITERIA.filter(c => !c.caution && (state.mtx || []).includes(c.key)).map(c => c.label);
  }

  function surgicalIndications() {
    const out = findingIndications();
    const cx = mtxContraindications();
    if (cx.length) out.push("Contraindication to medical management: " + cx.join("; "));
    return out;
  }

  function expectantUnmet() {
    const out = [];
    if (state.pain !== "none") out.push("Pain or tenderness attributed to the ectopic");
    if (!(state.hcg < EXPECTANT_HCG)) out.push(`β-hCG not below 1,000 IU/L (${fmtHcg(state.hcg)} IU/L)`);
    if (state.hcgTrend !== "falling") out.push(state.hcgTrend === "single" ? "β-hCG trend not yet known (single value only)" : "β-hCG not falling");
    return out;
  }

  // Returns { status, label, reasons } — status maps to shared.css card/badge classes.
  function statusFor(modality) {
    const ind = surgicalIndications();
    if (modality === "surgical") {
      return ind.length
        ? { status: "recommended", label: "Indicated", reasons: ind }
        : { status: "reasonable", label: "Default treatment", reasons: ["No surgical indication identified — surgery remains the default treatment for ectopic pregnancy"] };
    }
    if (modality === "medical") {
      return ind.length
        ? { status: "contraindicated", label: "Not suitable", reasons: ind }
        : { status: "reasonable", label: "May be considered", reasons: ["All screened medical-management criteria met"] };
    }
    // expectant
    if (ind.length) return { status: "not-recommended", label: "Not suitable", reasons: ["Surgical indication present: " + ind.join("; ")] };
    const unmet = expectantUnmet();
    if (unmet.length) return { status: "not-recommended", label: "Criteria not met", reasons: unmet };
    const reasons = ["No pain or tenderness, β-hCG <1,000 IU/L and falling"];
    if (state.diagnosis === "confirmed") reasons.push("Note: expectant management usually applies when ultrasound findings are inconclusive — here the ectopic is confirmed on ultrasound");
    return { status: "reasonable", label: "May be considered", reasons };
  }

  function rank(status) {
    return { recommended: 0, reasonable: 1, "not-recommended": 2, contraindicated: 3 }[status];
  }

  // ---- MTX dose calculator (§4.6 / Appendix B) -----------------------------------

  // Dose rounded to the nearest 10 mg from a BSA rounded to 2 dp (half rounds up,
  // which reproduces the Appendix B dose table).
  function doseFromBsa(bsa) {
    return Math.round(Math.round(bsa * 100) / 20) * 10;
  }

  function doseCalculator() {
    const wrap = document.createElement("div");
    const p = "calc" + (checkIdCounter++);
    wrap.innerHTML = `
      <div class="field">
        <label for="${p}h">Height (cm)</label>
        <input type="number" min="0" step="any" id="${p}h" placeholder="e.g. 165">
      </div>
      <div class="field">
        <label for="${p}w">Weight (kg)</label>
        <input type="number" min="0" step="any" id="${p}w" placeholder="e.g. 68">
      </div>
      <div class="calc-output"></div>`;
    const hIn = wrap.querySelector("#" + p + "h");
    const wIn = wrap.querySelector("#" + p + "w");
    const out = wrap.querySelector(".calc-output");

    function update() {
      const h = parseFloat(hIn.value), w = parseFloat(wIn.value);
      out.innerHTML = "";
      if (!(h > 0) || !(w > 0)) {
        out.appendChild(banner("info", "Enter height and weight to calculate", [
          "BSA (m²) = √(height (cm) × weight (kg) / 3600) — Mosteller method",
          "Dose = BSA × 50 mg/m², rounded up or down to the nearest 10 mg"
        ]));
        return;
      }
      const bsa = Math.sqrt(h * w / 3600);
      const bsa2 = Math.round(bsa * 100) / 100;
      const dose = doseFromBsa(bsa);
      const raw = Math.round(bsa2 * MTX_MG_PER_M2 * 10) / 10;
      out.appendChild(banner("ok", `Methotrexate single dose: ${dose} mg`, [
        `BSA (Mosteller) = √(${h} × ${w} / 3600) = <b>${bsa2.toFixed(2)} m²</b>`,
        `${bsa2.toFixed(2)} m² × 50 mg/m² = ${raw} mg → rounded to the nearest 10 mg = <b>${dose} mg</b>`
      ]));

      const warnings = [];
      // Appendix B BSA table values match the DuBois formula, not Mosteller.
      const dubois = 0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725);
      const duboisDose = doseFromBsa(dubois);
      if (duboisDose !== dose) {
        warnings.push(`The Appendix B BSA table values match the DuBois formula, not Mosteller. By that method BSA = ${(Math.round(dubois * 100) / 100).toFixed(2)} m² → <b>${duboisDose} mg</b>. The guideline is internally inconsistent here — confirm the dose before prescribing.`);
      }
      if (!MTX_STOCKED_MG.includes(dose)) warnings.push(`${dose} mg is not a stocked strength (stocked: 50, 70, 80, 90 and 100 mg).`);
      if (h < 140 || h > 200 || w < 40 || w > 130) warnings.push("Height or weight is outside the range of the Appendix B table (140–200 cm, 40–130 kg).");
      if (warnings.length) out.appendChild(banner("warn", "Check before prescribing", warnings));
      out.appendChild(banner("info", "Verify", [
        "Verify the calculated dose against Appendix B, or the Australian Medicines Handbook body surface area calculator, before prescribing."
      ]));
    }
    hIn.addEventListener("input", update);
    wIn.addEventListener("input", update);
    update();

    // Appendix B tables (reference)
    const ref = document.createElement("div");
    ref.innerHTML = `<h4>Appendix B: dose (mg) by BSA (m²)</h4>`;
    const ul = document.createElement("ul");
    MTX_DOSE_TABLE.forEach(([b, d]) => { const li = document.createElement("li"); li.textContent = `${b} m² → ${d} mg`; ul.appendChild(li); });
    const li = document.createElement("li");
    li.textContent = "* as printed in the guideline (no explanation given). Stocked strengths: 50, 70, 80, 90 and 100 mg.";
    ul.appendChild(li);
    ref.appendChild(ul);

    const h4b = document.createElement("h4");
    h4b.textContent = "Appendix B: body surface area table (m²)";
    ref.appendChild(h4b);
    const scroller = document.createElement("div");
    scroller.style.overflowX = "auto";
    const cell = "padding:0.2rem 0.45rem;text-align:right;border-bottom:1px solid var(--line);";
    scroller.innerHTML = `<table style="border-collapse:collapse;font-size:0.82rem;">
      <thead><tr><th style="${cell}">kg \\ cm</th>${BSA_TABLE_HEIGHTS.map(x => `<th style="${cell}">${x}</th>`).join("")}</tr></thead>
      <tbody>${BSA_TABLE.map(([wt, row]) => `<tr><th style="${cell}">${wt}</th>${row.map(v => `<td style="${cell}">${v === null ? "" : v.toFixed(2)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
    ref.appendChild(scroller);
    wrap.appendChild(ref);
    return wrap;
  }

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "safetyUnstable": return screenSafetyUnstable();
      case "urgentUnstable": return screenUrgentUnstable();
      case "safetyBleeding": return screenSafetyBleeding();
      case "surgeryBleeding": return screenSurgeryBleeding();
      case "diagnosis": return screenDiagnosis();
      case "needsScan": return screenNeedsScan();
      case "outOfScope": return screenOutOfScope();
      case "findings": return screenFindings();
      case "pain": return screenPain();
      case "mtxCriteria": return screenMtxCriteria();
      case "preference": return screenPreference();
      case "result": return screenResult();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "Ectopic Pregnancy Management", "Step-by-step guidance to select surgical, medical (methotrexate) or expectant management for a tubal ectopic pregnancy, based on the RWH EPAS guideline.");
    app.appendChild(banner("info", "Before you start", [
      "For women with an ectopic pregnancy that is diagnosed or considered likely. For assessment and diagnosis, see the Pain and Bleeding in Early Pregnancy guideline.",
      "Covers tubal ectopic pregnancy: surgical, single-dose methotrexate and expectant management, with follow-up.",
      "Does not cover interstitial or non-tubal ectopics (ovarian, cervical, caesarean section scar) — these need individualised management with consultant gynaecological and ultrasonological input.",
      "Ectopic pregnancy occurs in about 1 in 60 pregnancies. Heterotopic pregnancy is rare (~1:40,000 natural pregnancies; substantially more frequent with IVF)."
    ]));
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = "../pain-bleeding-early-pregnancy/index.html";
    a.textContent = "Open Pain and Bleeding in Early Pregnancy →";
    p.appendChild(a);
    app.appendChild(p);
    app.appendChild(actionsRow([{ label: "Start", primary: true, onClick: () => go("safetyUnstable") }]));
  }

  function screenSafetyUnstable() {
    screenShell(0, "Safety check 1 of 2", "Is the woman haemodynamically unstable?");
    app.appendChild(optionList([
      { label: "Yes", hint: "Not haemodynamically stable", onClick: () => go("urgentUnstable"), danger: true },
      { label: "No", onClick: () => go("safetyBleeding") }
    ]));
  }

  function screenUrgentUnstable() {
    screenShell(RESULT, "Urgent: surgical management");
    app.appendChild(actionPanel("bad", "Not haemodynamically stable", [
      "Surgical management should be performed even before blood and fluid losses have been replaced",
      "Resuscitate",
      "Secure immediate IV access",
      "Send blood for FBE and cross-match 4 units of blood",
      "Inform Operating Theatre, anaesthetist and the on-call Gynaecology consultant, stressing the urgency of the situation"
    ]));
    app.appendChild(banner("warn", "Diagnosis", [
      "When clinical suspicion is high and the woman is haemodynamically unstable, urgent surgery may be indicated without an accredited scan, in discussion with the Gynaecology consultant.",
      "Where clinical and ultrasound findings are not conclusive or there is haemodynamic instability, diagnostic laparoscopy may be indicated.",
      "Where there is diagnostic uncertainty, especially if β-hCG is low (<3,500 IU/L), confirm ectopic pregnancy at the time of surgery before any uterine instrumentation."
    ]));
    appendModalityCard("surgical", null, false);
    finalActions();
  }

  function screenSafetyBleeding() {
    screenShell(0, "Safety check 2 of 2", "Is there intraperitoneal bleeding on the basis of clinical or ultrasound findings?");
    app.appendChild(optionList([
      { label: "Yes", hint: "e.g. significant blood in the peritoneal cavity or pouch of Douglas", onClick: () => go("surgeryBleeding"), danger: true },
      { label: "No", onClick: () => go("diagnosis") }
    ]));
  }

  function screenSurgeryBleeding() {
    screenShell(RESULT, "Surgical management indicated");
    app.appendChild(banner("bad", "Intraperitoneal bleeding", [
      "Surgery is indicated if there is intraperitoneal bleeding on the basis of clinical or ultrasound findings.",
      "Medical and expectant management are not appropriate.",
      "If she becomes haemodynamically unstable, follow the urgent pathway (resuscitate, IV access, FBE and cross-match 4 units, inform theatre / anaesthetist / on-call Gynaecology consultant)."
    ]));
    appendModalityCard("surgical", { status: "recommended", label: "Indicated" }, true);
    app.appendChild(universalChecklistBlock());
    finalActions();
  }

  function screenDiagnosis() {
    screenShell(1, "Diagnosis", "What has been established on ultrasound?");
    app.appendChild(optionList([
      { label: "Tubal ectopic pregnancy confirmed on accredited ultrasound", hint: "At the Women's, or an accredited external provider (Appendix C)", onClick: () => { state.diagnosis = "confirmed"; go("findings"); } },
      { label: "Ectopic considered likely — intrauterine pregnancy excluded on accredited ultrasound, location not established", hint: "e.g. empty uterus, raised β-hCG, location uncertain", onClick: () => { state.diagnosis = "likely"; go("findings"); } },
      { label: "Intrauterine pregnancy not excluded on accredited ultrasound, or no accredited scan yet", onClick: () => go("needsScan") },
      { label: "Interstitial or non-tubal ectopic", hint: "Ovarian, cervical or caesarean section scar", onClick: () => go("outOfScope") }
    ]));
  }

  function screenNeedsScan() {
    screenShell(RESULT, "Accredited ultrasound needed first");
    app.appendChild(banner("warn", "Before any active management", [
      "Diagnosis of ectopic pregnancy, and no intrauterine pregnancy, should be confirmed on a formal ultrasound at the Women's before commencing any active management. External scans reported by a COGU or DDU (O&amp;G) certified sonologist are considered equivalent.",
      "Methotrexate must only be given after an intrauterine pregnancy has been excluded on an accredited ultrasound.",
      "Suspected or confirmed ectopic pregnancy presenting to WEC should be discussed with the Acute Gynaecology registrar.",
      "Unsighted pregnancies in women who are haemodynamically stable, with minimal pain and a low β-hCG, are usually appropriate for referral to EPAS for outpatient work-up, as per the Pain and Bleeding in Early Pregnancy guideline."
    ]));
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = "../pain-bleeding-early-pregnancy/index.html";
    a.textContent = "Open Pain and Bleeding in Early Pregnancy →";
    p.appendChild(a);
    app.appendChild(p);
    appendReferenceCard("Accredited ultrasound providers (Appendix C — non-exhaustive)", [["Approved providers", ACCREDITED_PROVIDERS]]);
    app.appendChild(patientInfoLink(PATIENT_INFO.ectopic));
    finalActions();
  }

  function screenOutOfScope() {
    screenShell(RESULT, "Outside guideline scope");
    app.appendChild(banner("warn", "Interstitial and non-tubal ectopic pregnancy", [
      "Treatment of interstitial and non-tubal ectopics (such as ovarian, cervical and caesarean section scar) is not covered by this guideline. It needs to be individualised with consultant gynaecological and ultrasonological input.",
      "Treatment may include intrasac injection and/or multiple-dose methotrexate, or other interventions."
    ]));
    appendReferenceCard("Appendix A: methotrexate multi-dose regimen (if the consultant decides on it)", [
      ["Note", ["There is no authoritative therapeutic guideline for multi-dose regimens, but the following regimen may be suitable if the consultant decides treatment should include a multi-dose regimen."]],
      ["Regimen", [
        "Methotrexate 1 mg/kg IM on alternate days (days 1, 3, 5, 7) — maximum 4 doses, according to hCG levels",
        "Leucovorin calcium 0.1 mg/kg IM on alternate days (days 2, 4, 6, 8)",
        "Continue until β-hCG drops by >15% in 48 hours, OR 4 doses of methotrexate given"
      ]],
      ["Monitoring", [
        "β-hCG weekly until <5 IU/L",
        "Initial blood count, platelets and liver enzymes; repeat day 7"
      ]]
    ]);
    app.appendChild(patientInfoLink(PATIENT_INFO.ectopic));
    finalActions();
  }

  function screenFindings() {
    screenShell(2, "Ultrasound and β-hCG", "Enter the findings.");
    const wrap = document.createElement("div");
    const v = x => (x === undefined || x === null) ? "" : x;
    wrap.innerHTML = `
      <div class="field">
        <label for="hcgInput">β-hCG (IU/L)</label>
        <input type="number" min="0" step="any" id="hcgInput" placeholder="e.g. 1200" value="${v(state.hcg)}">
      </div>
      <div class="field">
        <label>β-hCG trend</label>
        ${radio("trend", "falling", "Falling", state.hcgTrend)}
        ${radio("trend", "rising", "Rising or plateau", state.hcgTrend)}
        ${radio("trend", "single", "Single value only", state.hcgTrend)}
      </div>
      <div class="field">
        <label for="massInput">Adnexal (ectopic) mass on ultrasound, largest dimension (cm)</label>
        <div class="hint">Leave blank if no mass seen</div>
        <input type="number" min="0" step="any" id="massInput" placeholder="e.g. 2.4" value="${v(state.mass)}">
      </div>
      <div class="field">
        <label>Fetal heart activity on ultrasound</label>
        ${radio("fh", "no", "No", state.fh === undefined ? undefined : (state.fh ? "yes" : "no"))}
        ${radio("fh", "yes", "Yes", state.fh === undefined ? undefined : (state.fh ? "yes" : "no"))}
      </div>`;
    app.appendChild(wrap);

    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);

    app.appendChild(actionsRow([{
      label: "Continue", primary: true, onClick: () => {
        const hcg = parseFloat(document.getElementById("hcgInput").value);
        const massRaw = document.getElementById("massInput").value.trim();
        const mass = massRaw === "" ? null : parseFloat(massRaw);
        const trend = (wrap.querySelector("input[name=trend]:checked") || {}).value;
        const fh = (wrap.querySelector("input[name=fh]:checked") || {}).value;
        const missing = [];
        if (isNaN(hcg) || hcg < 0) missing.push("β-hCG");
        if (!trend) missing.push("β-hCG trend");
        if (mass !== null && (isNaN(mass) || mass < 0)) missing.push("a valid mass size (or leave blank)");
        if (!fh) missing.push("fetal heart activity");
        if (missing.length) {
          err.textContent = "Please enter " + missing.join(", ") + " to continue.";
          err.style.display = "block";
          return;
        }
        state.hcg = hcg;
        state.hcgTrend = trend;
        state.mass = mass;
        state.fh = fh === "yes";
        go("pain");
      }
    }]));
  }

  function radio(name, value, label, current) {
    const id = name + "_" + value;
    return `<div class="radio-row"><input type="radio" name="${name}" id="${id}" value="${value}"${current === value ? " checked" : ""}><label for="${id}"><span class="row-title">${label}</span></label></div>`;
  }

  function screenPain() {
    screenShell(2, "Pain and examination", "Pelvic pain, and tenderness on vaginal examination (VE if planning non-surgical treatment)?");
    const next = () => go(findingIndications().length ? "preference" : "mtxCriteria");
    app.appendChild(optionList([
      { label: "No pain or tenderness", onClick: () => { state.pain = "none"; next(); } },
      { label: "Mild pelvic pain, no significant pelvic tenderness on VE", onClick: () => { state.pain = "mild"; next(); } },
      { label: "Moderate to severe pelvic pain, or significant pelvic tenderness on VE", onClick: () => { state.pain = "modsevere"; next(); } }
    ]));
  }

  function screenMtxCriteria() {
    screenShell(3, "Methotrexate criteria", "Do any of the following apply? (required)");
    app.appendChild(banner("info", "Why this is asked", [
      "Medical management requires all criteria to be met. Any contraindication to medical management is an indication for surgery."
    ]));
    mandatoryMultiSelect(MTX_CRITERIA, keys => {
      state.mtx = keys;
      go("preference");
    });
  }

  function screenPreference() {
    screenShell(4, "Woman's preference", "After counselling on safe treatment options, advantages and disadvantages, which approach does she prefer?");
    app.appendChild(optionList([
      { label: "No strong preference / undecided", onClick: () => { state.preference = "none"; go("result"); } },
      { label: "Surgical management", onClick: () => { state.preference = "surgical"; go("result"); } },
      { label: "Medical management (methotrexate)", onClick: () => { state.preference = "medical"; go("result"); } },
      { label: "Expectant management", onClick: () => { state.preference = "expectant"; go("result"); } }
    ]));
  }

  function screenResult() {
    screenShell(RESULT, "Management options");
    const ind = surgicalIndications();
    const summary = [
      `β-hCG ${fmtHcg(state.hcg)} IU/L (${{ falling: "falling", rising: "rising or plateau", single: "single value" }[state.hcgTrend]}); mass ${state.mass === null ? "not seen" : state.mass + " cm"}; fetal heart activity ${state.fh ? "present" : "absent"}; pain: ${{ none: "none", mild: "mild, no significant tenderness", modsevere: "moderate–severe or significant tenderness" }[state.pain]}.`
    ];
    if (ind.length) {
      app.appendChild(banner("warn", "Surgical indication present", ind.concat(summary)));
    } else {
      app.appendChild(banner("info", "No surgical indication identified", [
        "Surgery remains the default treatment. Medical management may be considered as all screened criteria are met (note: an ectopic may bleed or rupture at much lower hCG levels)."
      ].concat(summary)));
    }
    if (state.diagnosis === "likely") {
      app.appendChild(banner("info", "Location not established", [
        "If surgery is chosen: where there is diagnostic uncertainty, especially if β-hCG is low (<3,500 IU/L), confirm ectopic pregnancy at the time of surgery before any uterine instrumentation."
      ]));
    }
    if ((state.mtx || []).includes("drugs") && !ind.length) {
      app.appendChild(banner("warn", "Medication caution", [
        "Currently taking NSAIDs, diuretics, penicillin or tetracycline-group drugs — the guideline notes this is not so critical for the single-dose regimen."
      ]));
    }

    if (state.preference && state.preference !== "none") {
      const s = statusFor(state.preference);
      const name = MODALITIES[state.preference].name;
      if (s.status === "contraindicated" || s.status === "not-recommended") {
        app.appendChild(banner("warn", "Note on stated preference", [
          `The woman's stated preference (${name}) is "${s.label.toLowerCase()}" given the findings entered. Discuss further before proceeding.`
        ]));
      } else {
        app.appendChild(banner("ok", "Matches stated preference", [
          `${name} is "${s.label.toLowerCase()}" and is the woman's preferred option.`
        ]));
      }
    }

    ["surgical", "medical", "expectant"]
      .map((m, i) => ({ m, i, s: statusFor(m) }))
      .sort((a, b) => rank(a.s.status) - rank(b.s.status) || a.i - b.i)
      .forEach(({ m, s }) => appendModalityCard(m, s, s.status === "recommended" || (s.status === "reasonable" && state.preference === m)));

    app.appendChild(universalChecklistBlock());
    finalActions();
  }

  // ---- cards and shared blocks ----------------------------------------------------

  function appendModalityCard(modality, status, open) {
    const m = MODALITIES[modality];
    const card = document.createElement("div");
    card.className = "modality-card" + (status ? " " + status.status : "") + (open ? " open" : "");
    card.innerHTML = `
      <div class="modality-head">
        <span class="modality-name">${m.name}</span>
        ${status ? `<span class="badge ${status.status}">${status.label}</span>` : ""}
      </div>
      <div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    if (status && status.reasons) body.appendChild(detailSection("Why this status", status.reasons, false));
    body.appendChild(detailSection("Clinical criteria (§4.3)", CRITERIA[modality], false));
    m.sections.forEach(([title, checkable, items]) => {
      if (checkable === "calculator") {
        const h4 = document.createElement("h4");
        h4.textContent = title;
        body.appendChild(h4);
        body.appendChild(doseCalculator());
      } else {
        body.appendChild(detailSection(title, items, checkable));
      }
    });
    m.patientInfo.forEach(pi => body.appendChild(patientInfoLink(pi)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
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

  // Collapsible descriptive card — expanded in print view by shared.css.
  function appendReferenceCard(name, sections) {
    const card = document.createElement("div");
    card.className = "modality-card";
    card.innerHTML = `<div class="modality-head"><span class="modality-name">${name}</span></div><div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    sections.forEach(([title, items]) => body.appendChild(detailSection(title, items, false)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
  }

  function universalChecklistBlock() {
    const box = document.createElement("div");
    box.className = "checklist-box";
    box.innerHTML = "<h3>Checklist for every pathway</h3>";
    UNIVERSAL_CHECKLIST.forEach(i => box.appendChild(checkRow(i)));
    const h3 = document.createElement("h3");
    h3.textContent = "Bereavement support (§4.4)";
    h3.style.marginTop = "1rem";
    box.appendChild(h3);
    const ul = document.createElement("ul");
    ul.className = "result-list";
    BEREAVEMENT_NOTES.forEach(i => { const li = document.createElement("li"); li.textContent = "• " + i; ul.appendChild(li); });
    box.appendChild(ul);
    return box;
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
