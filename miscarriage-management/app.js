/* ============================================================================
   Miscarriage Management
   Decision-support logic derived from:
   "Miscarriage: Management - Guideline", RWH0193330 v4.0, The Royal Women's
   Hospital, Early Pregnancy Assessment Service (EPAS). Last review 15/07/2025.
   This is an independent companion resource, not an official RWH product.
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Gestation", "Safety check", "Classification", "Details", "Preferences", "Result"];

  const SAFETY_NET = [
    "Soaking through a pad every hour for 2+ hours, or passing clots larger than a golf ball",
    "Severe or worsening abdominal pain not controlled with analgesia",
    "Fever, chills, or offensive vaginal discharge",
    "Feeling faint, dizzy, or short of breath"
  ];

  const UNIVERSAL_CHECKLIST = [
    "Check Rh(D) status — give Anti-D if indicated (see Anti-D (RhD) Immunoglobulin Use in Maternity Patients guideline)",
    "Discuss contraception and future pregnancy plans",
    "Send passed pregnancy tissue for histopathology where applicable",
    "Provide EPAS / after-hours emergency contact details and a clear plan for emergency care",
    "Provide a medical certificate if required",
    "Recommend follow-up with local GP in 4–6 weeks, or sooner if concerns",
    "Give written safety-net advice (see red-flag symptoms below)"
  ];

  const MODALITIES = {
    expectant: {
      name: "Expectant management",
      blurb: "Awaiting spontaneous passage of pregnancy tissue, without medication or surgery.",
      advantages: [
        "Allows spontaneous passage of pregnancy tissue",
        "Avoids potential surgical and anaesthetic risks"
      ],
      disadvantages: [
        "Unpredictable time frame and result — allow up to 2–3 weeks for spontaneous resolution",
        "Expect ongoing pain and bleeding during this time",
        "Potential need for later emergency suction curettage"
      ],
      preconditions: [
        "No significant bleeding or infection",
        "No bleeding diathesis, including anticoagulant therapy",
        "Woman's preference",
        "Aware of risks of pain/bleeding at home and the uncertain time frame",
        "Has emergency contact details and a plan for emergency care",
        "Support at home, and access to phone and medical care",
        "Willing to attend follow-up at 1 and 2 weeks"
      ],
      regimen: [
        "Prescribe take-home analgesia and anti-emetics (e.g. metoclopramide, NSAIDs, paracetamol ± codeine) based on patient needs and allergies",
        "Allow to eat and drink as normal",
        "Anti-D as indicated"
      ],
      followUp: [
        "Review at 1 week (face-to-face or telephone) and again at 2 weeks",
        "If tissue not passed, consider ultrasound and discuss medical or surgical options",
        "If tissue passed (or very likely on history), follow up regarding symptoms at 1–2 weeks",
        "If pregnancy was confirmed intrauterine on ultrasound and the woman is asymptomatic, no further ultrasound is needed",
        "If intrauterine location was never confirmed, arrange serial serum β-hCG surveillance to ensure appropriate decline"
      ],
      patientInfo: {
        url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/treating-miscarriage",
        label: "Treating miscarriage — patient information (The Women's)"
      }
    },
    medical: {
      name: "Medical management",
      blurb: "Misoprostol ± mifepristone used to induce expulsion of pregnancy tissue.",
      advantages: [
        "Avoids potential surgical and anaesthetic risks",
        "Option for treatment at home if desired and suitable"
      ],
      disadvantages: [
        "Unpredictable time frame and result (allow up to 2–3 weeks)",
        "Ongoing pain and bleeding expected at time of tissue passage",
        "~5% chance of still needing suction curettage",
        "Side effects in up to ~40%: nausea, vomiting, diarrhoea"
      ],
      preconditions: [
        "No significant bleeding or infection",
        "No contraindication to prostaglandins (e.g. allergy, severe uncontrolled asthma)",
        "No anticoagulant therapy / bleeding disorder / severe anaemia",
        "Woman's preference, and understanding of expected pain/bleeding",
        "Has emergency contact details and a plan for emergency care",
        "Support at home, and access to phone and medical care",
        "Willing to attend follow-up at 1 and 2 weeks"
      ],
      regimenMissed: [
        "MS-2-Step (off-label): Mifepristone 200 mg orally Day 1",
        "Then Misoprostol 800 mcg (2 × 400 mcg) buccal 24–48 hours later",
        "Then a further Misoprostol 400 mcg (2 × 200 mcg) buccal 4 hours after that",
        "Take analgesia/anti-emetic 30 minutes before the first misoprostol dose",
        "Anti-D as indicated"
      ],
      regimenIncomplete: [
        "Misoprostol 800 mcg (4 × 200 mcg) buccal",
        "Followed by a repeat dose of 400 mcg (2 × 200 mcg) buccal 4 hours later, as prescribed",
        "Take analgesia/anti-emetic 30 minutes before the first misoprostol dose",
        "Anti-D as indicated"
      ],
      followUp: [
        "Ensure the woman knows how to seek urgent advice for side effects or allergic reaction",
        "If tissue not passed within 1 week, consider ultrasound and repeat medical or surgical management",
        "Any admission should be discussed with the Acute Gynaecology consultant on call"
      ],
      patientInfo: {
        url: "https://www.thewomens.org.au/health-information/pregnancy-and-birth/pregnancy-problems/early-pregnancy-problems/treating-miscarriage",
        label: "Treating miscarriage — patient information (The Women's)"
      }
    },
    surgical: {
      name: "Surgical management (suction curettage)",
      blurb: "Day-admission procedure for planned uterine evacuation.",
      advantages: [
        "Planned procedure with a predictable time frame",
        "Immediate relief from symptoms",
        "Less blood loss and shorter duration of bleeding than expectant/medical management",
        "Almost 100% success rate"
      ],
      disadvantages: [
        "Risks of surgery",
        "Risks of anaesthesia"
      ],
      preconditions: [
        "Meets clinical indication, or is the woman's informed preference",
        "Written informed consent obtained"
      ],
      regimen: [
        "Book via gynaecology registrar; discuss with consultant as appropriate",
        "Test for chlamydia and bacterial vaginosis if symptomatic (unless recently done); self-collect acceptable",
        "Consider cervical priming: misoprostol 400 mcg (2 × 200 mcg) PV or buccal ~90 minutes pre-op",
        "Discuss contraception — LARC (IUCD/Implanon) can be inserted at time of procedure if desired",
        "Anti-D as indicated",
        "Single dose paracetamol 1 g + ibuprofen 400 mg orally may be given with the misoprostol"
      ],
      followUp: [
        "Advise GP review in 4–6 weeks",
        "Histology results reviewed by treating team",
        "Ensure infection screen results are followed up and treated if positive"
      ],
      patientInfo: {
        url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Day_surgery_at_the_Women_s_260624.pdf",
        label: "Day surgery at the Women's — patient information (PDF)"
      }
    }
  };

  // Size-band based recommendations -------------------------------------------

  function classifyMissed(gs, crl) {
    const hasCRL = typeof crl === "number" && !isNaN(crl) && crl > 0;
    if ((hasCRL && crl > 25) || (typeof gs === "number" && gs > 35)) return "large";
    if (typeof gs === "number" && gs < 15) return "small";
    return "medium";
  }

  function classifyIncomplete(rpoc) {
    if (rpoc < 15) return "small";
    if (rpoc <= 35) return "medium";
    return "large";
  }

  const MISSED_BANDS = {
    small: {
      label: "Small (GS < 15–20mm, ~<7 weeks equivalent)",
      recommended: ["expectant", "medical"],
      reasonable: ["surgical"],
      note: "Expectant or medical management is generally preferable at this size. Surgery is usually discouraged unless the woman is symptomatic or has a strong preference for a planned procedure."
    },
    medium: {
      label: "Medium (GS 15–35mm, CRL < 25mm, ~7–9 weeks equivalent)",
      recommended: [],
      reasonable: ["expectant", "medical", "surgical"],
      note: "All three management options are reasonable at this size — the choice should be guided mainly by the woman's preference."
    },
    large: {
      label: "Large (GS > 30–35mm and/or CRL > ~25mm, ~≥9 weeks equivalent)",
      recommended: ["surgical"],
      reasonable: ["medical", "expectant"],
      note: "Pain and bleeding with passage of tissue are likely to be more significant at this size, so surgery is recommended. Expectant or medical management may still be considered as an informed choice."
    }
  };

  const INCOMPLETE_BANDS = {
    small: {
      label: "Small (retained tissue < 15mm, AP diameter)",
      recommended: ["expectant"],
      reasonable: ["medical"],
      note: "High likelihood of spontaneous expulsion without intervention. Surgery should generally only be considered if there is a specific indication."
    },
    medium: {
      label: "Medium (retained tissue 15–35mm, AP diameter)",
      recommended: [],
      reasonable: ["expectant", "medical"],
      note: "Medical or expectant management are both reasonable. Surgery should generally only be considered if there is a specific indication."
    },
    large: {
      label: "Large (retained tissue > 35–50mm, AP diameter)",
      recommended: ["surgical"],
      reasonable: ["medical"],
      note: "With increasing volumes of retained tissue, surgical management is usual. If a medical path is chosen: consider admission to observe for a few hours until most tissue has passed and bleeding has settled; remaining tissue usually passes within 24 hours but can take longer. If there is no resolution with misoprostol, surgery is indicated — perform a speculum exam first, as tissue may already be sitting in the vagina."
    }
  };

  // ---- state machine ----------------------------------------------------------

  let state = {};
  let navStack = []; // { screen, state snapshot }
  let currentScreen = "intro";
  let stepCounter = 0;

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

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

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

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "gestation": return screenGestation();
      case "outOfScope": return screenOutOfScope();
      case "fdiuConfirm": return screenFdiuConfirm();
      case "fdiuScar": return screenFdiuScar();
      case "fdiuResult": return screenFdiuResult();
      case "safetyUnstable": return screenSafetyUnstable();
      case "safetyInfection": return screenSafetyInfection();
      case "safetyMole": return screenSafetyMole();
      case "urgentUnstable": return screenUrgentUnstable();
      case "urgentInfection": return screenUrgentInfection();
      case "urgentMole": return screenUrgentMole();
      case "activeSymptoms": return screenActiveSymptoms();
      case "cervicalTissue": return screenCervicalTissue();
      case "surgeryWarranted": return screenSurgeryWarranted();
      case "typeClassification": return screenTypeClassification();
      case "missedSizing": return screenMissedSizing();
      case "incompleteSizing": return screenIncompleteSizing();
      case "completeQ1": return screenCompleteQ1();
      case "completeQ2": return screenCompleteQ2();
      case "completeResolved": return screenCompleteResolved();
      case "completeReview": return screenCompleteReview();
      case "ectopicCaution": return screenEctopicCaution();
      case "contraindications": return screenContraindications();
      case "preference": return screenPreference();
      case "finalResult": return screenFinalResult();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "Miscarriage Management", "Step-by-step guidance to select an appropriate management pathway for a confirmed miscarriage, based on the RWH EPAS guideline.");
    app.appendChild(banner("info", "Before you start", [
      "Assumes a diagnosis of miscarriage has already been made (see the RWH \"Pain and Bleeding in Early Pregnancy\" guideline for assessment/diagnosis).",
      "Covers expectant, medical and surgical management for early pregnancy loss, plus the extended fetal-death-in-utero (FDIU) pathway for 13–23+6 weeks.",
      "Does not cover ectopic pregnancy, ongoing viable pregnancy, or pregnancy ≥24 weeks."
    ]));
    app.appendChild(actionsRow([
      { label: "Start", primary: true, onClick: () => go("gestation") }
    ]));
  }

  function screenGestation() {
    screenShell(0, "Gestation", "What is the gestational age?");
    app.appendChild(optionList([
      { label: "Less than 14 weeks", hint: "Early pregnancy loss — standard expectant/medical/surgical pathway", onClick: () => { state.gestation = "early"; go("safetyUnstable"); } },
      { label: "13 to 23 weeks + 6 days, confirmed fetal death in utero (FDIU)", hint: "Extended miscarriage / late first or second trimester — inpatient pathway", onClick: () => { state.gestation = "fdiu"; go("fdiuConfirm"); } },
      { label: "24 weeks or more", hint: "Outside the scope of this guideline", onClick: () => { state.gestation = "late"; go("outOfScope"); } }
    ]));
  }

  function screenOutOfScope() {
    screenShell(0, "Outside guideline scope");
    app.appendChild(banner("warn", "Refer to the obstetric team", [
      "This guideline covers early pregnancy loss up to 13+6 weeks, plus the confirmed FDIU pathway to 23+6 weeks.",
      "Pregnancy loss at ≥24 weeks should be managed under obstetric / perinatal loss pathways, outside this guideline."
    ]));
    app.appendChild(actionsRow([{ label: "Restart", primary: true, onClick: restart }]));
  }

  function screenFdiuConfirm() {
    screenShell(1, "Confirm FDIU pathway", "This pathway is for confirmed fetal death in utero at 13–23+6 weeks, managed as an inpatient.");
    app.appendChild(banner("info", "This is an inpatient pathway", [
      "Any admission and regimen should be discussed with the Acute Gynaecology consultant on call ± liaison with obstetrics."
    ]));
    app.appendChild(optionList([
      { label: "Continue — this is a confirmed FDIU, 13–23+6 weeks", onClick: () => go("fdiuScar") },
      { label: "Actually, this is a different scenario", hint: "Go back and re-select gestation", onClick: () => go("gestation") }
    ]));
  }

  function screenFdiuScar() {
    screenShell(1, "Uterine scar history", "How many previous caesarean sections (or other uterine scars) does the woman have?");
    app.appendChild(optionList([
      { label: "None", onClick: () => { state.scarCount = "0"; go("fdiuResult"); } },
      { label: "One previous CS / uterine scar", onClick: () => { state.scarCount = "1"; go("fdiuResult"); } },
      { label: "Two or more previous CS", onClick: () => { state.scarCount = "2+"; go("fdiuResult"); } }
    ]));
  }

  function screenFdiuResult() {
    screenShell(5, "Recommended pathway: Inpatient medical management (FDIU 13–23+6 weeks)");
    app.appendChild(actionPanel("info", "Admission required", [
      "Admit under Acute Gynaecology after discussion with the consultant on call ± obstetrics liaison.",
      "EPAS registrar/resident to make the admission booking.",
      "Anti-D as indicated.",
      "Provide a medical certificate as required."
    ]));

    let regimen;
    if (state.scarCount === "0") {
      regimen = [
        "Mifepristone 200 mg orally",
        "36–48 hours later: Misoprostol 800 mcg vaginally",
        "Then Misoprostol 400 mcg buccally, 3-hourly, to a maximum of 4 further doses — then discuss with consultant"
      ];
    } else if (state.scarCount === "1") {
      regimen = [
        "Mifepristone 200 mg orally",
        "36–48 hours later: Misoprostol 400 mcg vaginally",
        "Then Misoprostol 200 mcg buccally, 3-hourly, to a maximum of 4 further doses — then discuss with consultant"
      ];
    } else {
      regimen = [
        "Individualised regimen — plan in direct consultation with the consultant given ≥2 prior caesarean sections / uterine scars"
      ];
    }
    app.appendChild(actionPanel("ok", "Regimen (" + (state.scarCount === "2+" ? "≥2 previous CS" : state.scarCount === "1" ? "1 previous CS/scar" : "no previous CS/scar") + ")", regimen));

    app.appendChild(actionPanel("info", "Follow-up", [
      "Ensure infection screen checked and treated as required",
      "Ensure contraception / future pregnancy plans discussed",
      "Arrange a minimum of 2 EPAS support phone calls — the first within 48 hours of misoprostol ± mifepristone administration, the second after assessment of the woman's needs; add earlier/extra calls as clinically appropriate",
      "If tissue not passed within 1 week, consider ultrasound (per symptoms) and repeat medical or surgical management",
      "Recommend GP follow-up in 4–6 weeks, or sooner if needed"
    ]));
    finalActions();
  }

  function screenSafetyUnstable() {
    screenShell(1, "Safety check 1 of 3", "Is the woman haemodynamically unstable, or is there unacceptably heavy bleeding right now?");
    app.appendChild(optionList([
      { label: "Yes", hint: "Tachycardic, hypotensive, or heavy uncontrolled bleeding", onClick: () => go("urgentUnstable"), danger: true },
      { label: "No", onClick: () => go("safetyInfection") }
    ]));
  }

  function screenUrgentUnstable() {
    screenShell(5, "Urgent: haemodynamic instability / heavy bleeding");
    app.appendChild(actionPanel("bad", "Recommended action", [
      "Surgical management is indicated regardless of miscarriage type.",
      "Escalate immediately for resuscitation and urgent gynaecology review — do not proceed through the routine pathway below.",
      "Arrange IV access, bloods (FBE, group & hold ± crossmatch), and involve senior clinicians as per local emergency protocols."
    ]));
    finalActions();
  }

  function screenSafetyInfection() {
    screenShell(1, "Safety check 2 of 3", "Are there signs of intrauterine infection (fever, uterine tenderness, purulent/offensive discharge) — i.e. suspected septic miscarriage?");
    app.appendChild(optionList([
      { label: "Yes", onClick: () => go("urgentInfection"), danger: true },
      { label: "No", onClick: () => go("safetyMole") }
    ]));
  }

  function screenUrgentInfection() {
    screenShell(5, "Urgent: suspected septic miscarriage");
    app.appendChild(actionPanel("bad", "Recommended action", [
      "Any type of miscarriage with evidence of intrauterine infection requires urgent treatment.",
      "Prompt evacuation of the uterus is indicated — usually surgical, with antibiotic cover.",
      "Escalate per local sepsis pathway and involve gynaecology urgently."
    ]));
    finalActions();
  }

  function screenSafetyMole() {
    screenShell(1, "Safety check 3 of 3", "Is a hydatidiform mole suspected (e.g. very high β-hCG, characteristic ultrasound appearance, or clinical history)?");
    app.appendChild(optionList([
      { label: "Yes", onClick: () => go("urgentMole"), danger: true },
      { label: "No", onClick: () => go("activeSymptoms") }
    ]));
  }

  function screenUrgentMole() {
    screenShell(5, "Urgent: suspected molar pregnancy");
    app.appendChild(actionPanel("bad", "Recommended action", [
      "Do not proceed with expectant or medical management.",
      "Manage under the gynaecology team.",
      "Requires suction curettage with a histopathology specimen.",
      "Arrange consultation with the oncology team regarding follow-up."
    ]));
    finalActions();
  }

  function screenActiveSymptoms() {
    screenShell(2, "Current symptoms", "Is the woman currently experiencing significant active pain and/or heavy bleeding?");
    app.appendChild(optionList([
      { label: "Yes", onClick: () => go("cervicalTissue") },
      { label: "No / symptoms are mild or settled", onClick: () => go("typeClassification") }
    ]));
  }

  function screenCervicalTissue() {
    screenShell(2, "Tissue at the cervical os", "Is pregnancy tissue visible / removable from the cervical os on speculum examination, with resolution of symptoms expected once it is removed?");
    app.appendChild(optionList([
      { label: "Yes — tissue removed at speculum, symptoms resolving", hint: "Miscarriage in progress; may continue with routine assessment", onClick: () => go("typeClassification") },
      { label: "No — pain/bleeding persists", onClick: () => go("surgeryWarranted") }
    ]));
  }

  function screenSurgeryWarranted() {
    screenShell(5, "Recommendation: Surgical management warranted");
    app.appendChild(banner("warn", "Why", [
      "Active pain and/or bleeding usually warrants surgery regardless of miscarriage type, unless tissue at the cervical os can be removed with resolution of symptoms.",
      "Increasing bleeding or pain, or concerns during expectant/medical management, are also reasons to move to surgery."
    ]));
    renderModalityDetail("surgical", "missed");
    app.appendChild(universalChecklistBlock());
    finalActions();
  }

  function screenTypeClassification() {
    screenShell(2, "Type of miscarriage", "What type of miscarriage has been diagnosed?");
    app.appendChild(optionList([
      { label: "Missed miscarriage", hint: "Confirmed on ultrasound, intact gestational sac, no tissue passed (includes early fetal demise & anembryonic pregnancy)", onClick: () => { state.type = "missed"; go("missedSizing"); } },
      { label: "Incomplete miscarriage", hint: "Some tissue passed, some retained pregnancy tissue remains", onClick: () => { state.type = "incomplete"; go("incompleteSizing"); } },
      { label: "Complete miscarriage", hint: "Previously sited intrauterine pregnancy, now appears fully evacuated", onClick: () => { state.type = "complete"; go("completeQ1"); } },
      { label: "Uncertain / pregnancy of unknown location", hint: "Location never confirmed on ultrasound, or possible ectopic", onClick: () => go("ectopicCaution") }
    ]));
  }

  function screenMissedSizing() {
    screenShell(3, "Missed miscarriage — ultrasound size", "Enter the ultrasound measurements (AP plane).");
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="field">
        <label for="gsInput">Gestational sac (mean sac diameter), mm</label>
        <div class="hint">Leave blank if not measured / not applicable</div>
        <input type="number" min="0" id="gsInput" placeholder="e.g. 22">
      </div>
      <div class="field">
        <label for="crlInput">Crown–rump length (fetal pole), mm</label>
        <div class="hint">Leave blank if no fetal pole seen (anembryonic pregnancy)</div>
        <input type="number" min="0" id="crlInput" placeholder="e.g. 14">
      </div>
    `;
    app.appendChild(wrap);
    app.appendChild(actionsRow([
      {
        label: "Continue", primary: true, onClick: () => {
          const gs = parseFloat(document.getElementById("gsInput").value);
          const crl = parseFloat(document.getElementById("crlInput").value);
          state.gs = isNaN(gs) ? null : gs;
          state.crl = isNaN(crl) ? null : crl;
          if (state.gs === null && state.crl === null) {
            alert("Please enter at least one measurement (gestational sac or CRL) to continue.");
            return;
          }
          state.band = classifyMissed(state.gs, state.crl);
          go("contraindications");
        }
      }
    ]));
  }

  function screenIncompleteSizing() {
    screenShell(3, "Incomplete miscarriage — retained tissue size", "Enter the ultrasound (or clinical estimate) of retained pregnancy tissue.");
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="field">
        <label for="rpocInput">Retained pregnancy tissue, AP diameter (mm)</label>
        <div class="hint">Use the largest AP measurement of retained tissue on ultrasound</div>
        <input type="number" min="0" id="rpocInput" placeholder="e.g. 20">
      </div>
    `;
    app.appendChild(wrap);
    app.appendChild(actionsRow([
      {
        label: "Continue", primary: true, onClick: () => {
          const rpoc = parseFloat(document.getElementById("rpocInput").value);
          if (isNaN(rpoc)) { alert("Please enter a measurement to continue."); return; }
          state.rpoc = rpoc;
          state.band = classifyIncomplete(rpoc);
          go("contraindications");
        }
      }
    ]));
  }

  function screenCompleteQ1() {
    screenShell(3, "Complete miscarriage", "Was an intrauterine pregnancy previously confirmed on ultrasound (before the tissue was passed)?");
    app.appendChild(optionList([
      { label: "Yes, intrauterine location was confirmed", onClick: () => { state.iutConfirmed = true; go("completeQ2"); } },
      { label: "No, or there is doubt about the tissue passed / pregnancy location", onClick: () => go("ectopicCaution") }
    ]));
  }

  function screenCompleteQ2() {
    screenShell(3, "Complete miscarriage — current symptoms", "Is the woman currently asymptomatic (no persistent bleeding, no ongoing pain), with no further tissue seen on speculum?");
    app.appendChild(optionList([
      { label: "Yes, asymptomatic", onClick: () => go("completeResolved") },
      { label: "No — persistent bleeding, ongoing pain, or non-resolving β-hCG", onClick: () => go("completeReview") }
    ]));
  }

  function screenCompleteResolved() {
    screenShell(5, "Recommendation: No further intervention needed");
    app.appendChild(actionPanel("ok", "Complete miscarriage — expectant approach confirmed", [
      "Surgical and medical uterine evacuation are contraindicated once a complete miscarriage is certain.",
      "Routine ultrasound is not needed.",
      "Ensure histology is arranged/followed up if tissue is available, to help exclude ectopic pregnancy.",
      "Serial β-hCG is only needed if there remains any doubt about resolution."
    ]));
    app.appendChild(universalChecklistBlock());
    finalActions();
  }

  function screenCompleteReview() {
    screenShell(5, "Recommendation: Further review needed before confirming complete miscarriage");
    app.appendChild(banner("warn", "Why", [
      "Persistent bleeding without further tissue seen on speculum, or a non-resolving β-hCG, means an ultrasound may be prudent.",
      "Well-developed decidua or fibrous clot can resemble pregnancy tissue — if there is any doubt, ensure histology is performed and followed up to exclude ectopic pregnancy.",
      "Serial β-hCG is recommended to confirm resolution."
    ]));
    app.appendChild(universalChecklistBlock());
    finalActions();
  }

  function screenEctopicCaution() {
    screenShell(5, "Caution: exclude ectopic pregnancy first");
    app.appendChild(banner("bad", "This guideline does not cover ectopic pregnancy", [
      "When the pregnancy location has not been confirmed intrauterine, or there is doubt about the nature of any tissue passed, arrange serial serum β-hCG levels and gynaecology review to exclude ectopic pregnancy before assuming miscarriage is complete.",
      "Refer to the RWH \"Pain and Bleeding in Early Pregnancy\" guideline and your local ectopic pregnancy pathway for assessment."
    ]));
    finalActions();
  }

  function screenContraindications() {
    screenShell(4, "Contraindications", "Does the woman have any of the following? (required)");
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="checkbox-row">
        <input type="checkbox" id="cx1">
        <label for="cx1"><span class="row-title">Bleeding disorder, anticoagulant therapy, or severe anaemia</span><span class="row-hint">Contraindicates both expectant and medical management</span></label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="cx2">
        <label for="cx2"><span class="row-title">Allergy to prostaglandins, or severe uncontrolled asthma</span><span class="row-hint">Contraindicates medical management (misoprostol)</span></label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="cx3">
        <label for="cx3"><span class="row-title">Significant active bleeding or signs of infection</span><span class="row-hint">Contraindicates expectant and medical management — surgery indicated</span></label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="cx4">
        <label for="cx4"><span class="row-title">None of the above</span></label>
      </div>
    `;
    app.appendChild(wrap);

    const cx1 = wrap.querySelector("#cx1");
    const cx2 = wrap.querySelector("#cx2");
    const cx3 = wrap.querySelector("#cx3");
    const cx4 = wrap.querySelector("#cx4");
    const findingBoxes = [cx1, cx2, cx3];

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

    function refreshState() {
      const anySelected = cx1.checked || cx2.checked || cx3.checked || cx4.checked;
      continueBtn.disabled = !anySelected;
      if (anySelected) errorMsg.style.display = "none";
    }

    cx4.addEventListener("change", () => {
      if (cx4.checked) findingBoxes.forEach(cb => { cb.checked = false; });
      refreshState();
    });
    findingBoxes.forEach(cb => cb.addEventListener("change", () => {
      if (cb.checked) cx4.checked = false;
      refreshState();
    }));

    continueBtn.addEventListener("click", () => {
      const anySelected = cx1.checked || cx2.checked || cx3.checked || cx4.checked;
      if (!anySelected) { errorMsg.style.display = "block"; return; }
      state.cxBleedingDisorder = cx1.checked;
      state.cxProstaglandin = cx2.checked;
      state.cxActive = cx3.checked;
      go("preference");
    });
  }

  function screenPreference() {
    screenShell(4, "Woman's preference", "After counselling on the suitable options, which management approach does she prefer?");
    app.appendChild(optionList([
      { label: "No strong preference / undecided", onClick: () => { state.preference = "none"; go("finalResult"); } },
      { label: "Expectant management", hint: "Wants to avoid surgery and medicine; comfortable with a longer, uncertain timeline", onClick: () => { state.preference = "expectant"; go("finalResult"); } },
      { label: "Medical management", hint: "Wants to avoid surgery; accepts expected pain/bleeding and some uncertainty", onClick: () => { state.preference = "medical"; go("finalResult"); } },
      { label: "Surgical management", hint: "Wants a planned procedure; accepts surgical/anaesthetic risk", onClick: () => { state.preference = "surgical"; go("finalResult"); } }
    ]));
  }

  // ---- final result -------------------------------------------------------------

  function statusFor(modality) {
    const band = state.type === "missed" ? MISSED_BANDS[state.band] : INCOMPLETE_BANDS[state.band];
    const cxOut =
      (modality === "expectant" && (state.cxBleedingDisorder || state.cxActive)) ||
      (modality === "medical" && (state.cxBleedingDisorder || state.cxProstaglandin || state.cxActive));
    if (cxOut) return "contraindicated";
    if (band.recommended.includes(modality)) return "recommended";
    if (band.reasonable.includes(modality)) return "reasonable";
    return "not-recommended";
  }

  function statusLabel(s) {
    return { recommended: "Recommended", reasonable: "Reasonable option", "not-recommended": "Not generally recommended", contraindicated: "Contraindicated" }[s];
  }

  function renderModalityDetail(modality, type) {
    const m = MODALITIES[modality];
    const card = document.createElement("div");
    card.className = "modality-card open";
    card.innerHTML = `
      <div class="modality-head"><span class="modality-name">${m.name}</span></div>
      <div class="modality-body"></div>
    `;
    const body = card.querySelector(".modality-body");
    fillModalityBody(body, m, modality, type || "missed");
    app.appendChild(card);
  }

  // Populates a modality-body element with the standard set of sections.
  // "About"/"Advantages"/"Disadvantages" are descriptive (plain bullets);
  // "Preconditions"/"Regimen"/"Follow-up" are actionable (tickable checkboxes).
  function fillModalityBody(body, m, modality, type) {
    body.appendChild(detailSection("About", [m.blurb], false));
    body.appendChild(detailSection("Advantages", m.advantages, false));
    body.appendChild(detailSection("Disadvantages", m.disadvantages, false));
    if (m.preconditions) body.appendChild(detailSection("Preconditions", m.preconditions, true));
    if (modality === "medical") {
      body.appendChild(detailSection("Regimen", type === "incomplete" ? m.regimenIncomplete : m.regimenMissed, true));
    } else if (m.regimen) {
      body.appendChild(detailSection("Regimen", m.regimen, true));
    }
    if (m.followUp) body.appendChild(detailSection("Follow-up", m.followUp, true));
    if (m.patientInfo) {
      const a = document.createElement("a");
      a.className = "patient-info-link";
      a.href = m.patientInfo.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "📄 " + m.patientInfo.label;
      body.appendChild(a);
    }
  }

  function detailSection(title, items, checkable) {
    const wrap = document.createElement("div");
    const h4 = document.createElement("h4");
    h4.textContent = title;
    wrap.appendChild(h4);
    if (checkable) {
      items.forEach(i => {
        const id = "chk" + (checkIdCounter++);
        const row = document.createElement("div");
        row.className = "action-item";
        row.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${i}</label>`;
        wrap.appendChild(row);
      });
    } else {
      const ul = document.createElement("ul");
      items.forEach(i => { const li = document.createElement("li"); li.textContent = i; ul.appendChild(li); });
      wrap.appendChild(ul);
    }
    return wrap;
  }

  function universalChecklistBlock() {
    const box = document.createElement("div");
    box.className = "checklist-box";
    box.innerHTML = "<h3>Standard checklist for all pathways</h3>";
    UNIVERSAL_CHECKLIST.forEach(i => {
      const id = "chk" + (checkIdCounter++);
      const row = document.createElement("div");
      row.className = "action-item";
      row.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${i}</label>`;
      box.appendChild(row);
    });
    const h3b = document.createElement("h3");
    h3b.textContent = "Safety-net advice — seek urgent review for:";
    h3b.style.marginTop = "1rem";
    box.appendChild(h3b);
    const ul2 = document.createElement("ul");
    ul2.className = "result-list";
    SAFETY_NET.forEach(i => { const li = document.createElement("li"); li.textContent = "• " + i; ul2.appendChild(li); });
    box.appendChild(ul2);
    return box;
  }

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  function screenFinalResult() {
    const band = state.type === "missed" ? MISSED_BANDS[state.band] : INCOMPLETE_BANDS[state.band];
    screenShell(5, "Recommended management options");

    app.appendChild(banner("info", (state.type === "missed" ? "Missed" : "Incomplete") + " miscarriage — " + band.label, [band.note]));

    if (state.preference && state.preference !== "none") {
      const chosenStatus = statusFor(state.preference);
      if (chosenStatus === "contraindicated" || chosenStatus === "not-recommended") {
        app.appendChild(banner("warn", "Note on stated preference", [
          `The woman's stated preference (${MODALITIES[state.preference].name}) is ${statusLabel(chosenStatus).toLowerCase()} given the clinical findings entered. Discuss further before proceeding.`
        ]));
      } else {
        app.appendChild(banner("ok", "Matches stated preference", [
          `${MODALITIES[state.preference].name} is both clinically ${statusLabel(chosenStatus).toLowerCase()} and the woman's preferred option.`
        ]));
      }
    }

    ["surgical", "medical", "expectant"].sort((a, b) => rank(statusFor(a)) - rank(statusFor(b))).forEach(modality => {
      appendCollapsibleModality(modality, statusFor(modality));
    });

    app.appendChild(universalChecklistBlock());
    finalActions();
  }

  function rank(status) {
    return { recommended: 0, reasonable: 1, "not-recommended": 2, contraindicated: 3 }[status];
  }

  function appendCollapsibleModality(modality, status) {
    const m = MODALITIES[modality];
    const card = document.createElement("div");
    card.className = "modality-card " + status + (status === "recommended" ? " open" : "");
    card.innerHTML = `
      <div class="modality-head">
        <span class="modality-name">${m.name}</span>
        <span class="badge ${status}">${statusLabel(status)}</span>
      </div>
      <div class="modality-body"></div>
    `;
    const head = card.querySelector(".modality-head");
    const body = card.querySelector(".modality-body");
    fillModalityBody(body, m, modality, state.type);

    head.addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
