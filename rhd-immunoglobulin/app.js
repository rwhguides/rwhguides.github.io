/* ============================================================================
   RhD Immunoglobulin (Anti-D)
   Decision-support logic derived from:
   "RhD Immunoglobulin (Anti D) Use in Maternity - Guideline", RWH0191940
   v3.0, The Royal Women's Hospital, Maternity Services. Last review 14/09/2026.
   This is an independent companion resource, not an official RWH product.
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- shared content blocks -------------------------------------------------

  const PHASES = ["Blood group", "Antibodies", "Indication", "Fetal RhD", "Details", "Result"];
  const RESULT = PHASES.length - 1;

  const VF = "Rh(D) Immunoglobulin-VF";
  const RHOPHYLAC = "Rhophylac® 1500 IU";

  // Thresholds stated in the guideline
  const FIRST_TRIMESTER_WEEKS = 13;   // §4.5.2 "<13 weeks gestation"
  const FMH_FROM_WEEKS = 20;          // §4.5.2/4.5.3 FMH not required for the first 20 weeks
  const FMH_COVERED_ML = 6;           // §4.5.3 625 IU covers up to 6 mL RhD positive red cells
  const IU_PER_EXTRA_ML = 100;        // §4.5.3 minimum 100 IU per mL over 6 mL
  const FMH_LARGE_BIRTH_ML = 12;      // §4.5.4 large FMH >12 mL → Rhophylac IV
  const HOURS_STANDARD = 72;          // §4.5 within 72 hours
  const HOURS_MAX = 240;              // §4.5 some protection up to 10 days

  const PATIENT_INFO = {
    nipt: {
      url: "https://www.thewomens.org.au/images/uploads/fact-sheets/Fetal_blood_group_testing_RHD_NIPT_260907.pdf",
      label: "Fetal blood group testing (RHD NIPT) — fact sheet (PDF)"
    }
  };

  // §4.5.2 First trimester (<13 weeks) sensitising events
  const EVENTS_FIRST = [
    { key: "cvs1", label: "Chorionic villus sampling" },
    { key: "ectopic1", label: "Ectopic pregnancy (medical or surgical management)" },
    { key: "molar1", label: "Molar pregnancy" },
    { key: "miscarriage1", label: "Miscarriage" },
    { key: "top1", label: "Termination of pregnancy after 10 weeks gestation" },
    { key: "bleed1", label: "Uterine bleeding which is heavy, repeated and/or associated with pain", bleeding: true },
    { key: "topEarly", label: "Termination of pregnancy at 10 weeks or less", notListed: true },
    { key: "bleedLight", label: "Uterine bleeding that is light, isolated and painless", notListed: true }
  ];

  // §4.5.3 Second and third trimester sensitising events
  const EVENTS_LATER = [
    { key: "invasive", label: "Amniocentesis, chorionic villus sampling or cordocentesis" },
    { key: "aph", label: "Antepartum haemorrhage / uterine (PV) bleeding", bleeding: true },
    { key: "miscarriage2", label: "Miscarriage / threatened miscarriage", bleeding: true },
    { key: "trauma", label: "Abdominal trauma (sharp/blunt, open/closed)" },
    { key: "ecv", label: "External cephalic version" },
    { key: "ectopic2", label: "Ectopic pregnancy" },
    { key: "molar2", label: "Evacuation of molar pregnancy" },
    { key: "iufd", label: "Intrauterine death or stillbirth" },
    { key: "inutero", label: "In-utero therapeutic intervention (transfusion, surgery, insertion of shunts, laser)" },
    { key: "top2", label: "Therapeutic termination of pregnancy" }
  ];

  const IM_CONTRAINDICATIONS = "severe thrombocytopenia, therapeutic anticoagulation, hereditary bleeding disorder";

  // §4.7 Consent
  const CONSENT = [
    "Obtain informed verbal consent before administration (RhD-Ig is a blood product derived from human plasma); offer an interpreter if the woman/family is not fluent in English",
    "Discuss the reason for RhD-Ig",
    "Discuss the route, timing and dose for antenatal and postnatal administration, and for sensitising events",
    "Discuss the risks and benefits of RhD-Ig, and the risks of not receiving it",
    "Provide consumer information: ‘You and Your Baby’ (Laboratory Services Blood Transfusion intranet page)",
    "Provide an opportunity to ask questions",
    "Document consent in the EMR RhD Immunoglobulin Order Panel (confirm prior to administration via the MAR)",
    "Document in EMR patient notes: “discussed anti-D prophylaxis, patient consents”"
  ];

  const COUNSELLING_BENEFITS = [
    "RhD-Ig reduces the risk of an RhD negative woman developing immune anti-D after exposure to RhD positive fetal red cells",
    "Given in accordance with this guideline, the risk of RhD alloimmunisation is reduced to 0.2%, compared with approximately 13% without prophylaxis",
    "By preventing maternal alloimmunisation, RhD-Ig reduces the risk of HDFN due to anti-D in current and subsequent pregnancies"
  ];

  const COUNSELLING_RISKS = [
    "Plasma-derived human immunoglobulin. Donor screening and viral inactivation/removal minimise the risk of viral transmission; the risk cannot be completely eliminated, but there have been no confirmed cases of HIV, HBV or HCV transmission from immunoglobulin products in Australia",
    "Generally well tolerated. Mild local injection-site reactions (pain, tenderness, redness, swelling or stiffness) may occur. Occasional systemic reactions include fever, malaise, headache, dizziness, nausea and rash. Severe allergic reactions are rare"
  ];

  // §4.8 Obtaining RhD-Ig
  const ORDERING = [
    "Order via the MAR using the appropriate Order Panel, detailing gestation and clinical circumstance — all fields must be completed to enable signing",
    "Print a Blood Bank Release form from the MAR once the order is placed",
    "Check the form includes: full name, date of birth, MRN, hospital location, blood group (ABO and Rh), testing provider, previous dates of RhD-Ig, indication, product and dose required (missing blood group or previous anti-D history will delay issue)",
    "Requesting staff print their name and date on the form; if the PTS is used (WEC, Outpatients), complete the PTS location or number",
    "Downtime: use the paper RhD Immunoglobulin request card from the EMR Downtime boxes"
  ];

  // §4.9.1 Prescription
  const PRESCRIPTION = [
    "Order using the MAR RhD-Ig order panel and sign electronically (downtime: Medicines Chart MR/190, Once Only, Pre-Medication &amp; Nurse Initiated Medicines section)",
    "Dose, date and time",
    "Route",
    "Indication",
    "Gestation",
    "Patient's blood group / location of testing / date of test / test provider",
    "Consent obtained",
    "Signature and printed name of the prescriber (if on paper)"
  ];

  // §4.9.2 Administration — before and pre-administration check
  const PRE_ADMIN = [
    "Confirm the maternal blood group and fetal RHD NIPT result (if available) from Results Review and/or the original laboratory report in the Media tab — the source of truth. Do not rely solely on the Results Console (transcription error risk)",
    "Postnatal: confirm the cord blood group (and fetal RHD NIPT if available) to determine if RhD-Ig is required",
    "Confirm consent has been given",
    "Two authorised staff (RM, RN Division 1 or MO) check the product",
    "Positive patient identification: the woman STATES her FULL name and date of birth (where able); compare identifiers including URN with the wristband (inpatient), Epic Story Board (paper prescription in downtime) and the compatibility label on the product",
    "Confirm product, dose and route are correct for the indication",
    "Inpatient: open the MAR activity and scan the product box barcode. Outpatient: open the MAR activity and click the Anti-D order timeline",
    "Type the batch number and expiry date into the administration window before dual signing",
    "Downtime: complete the Blood Product Transfusion Record (patient/product details, batch number, both signatures) and retain it for scanning into the EMR"
  ];

  const ADMIN_VF = [
    "Bring to room temperature before use. Do not use if turbid or containing sediment — return to the transfusion laboratory",
    "No antimicrobial preservative — use immediately after opening",
    "Slow deep intramuscular injection into the deltoid muscle. Avoid the gluteal region (potential delayed absorption)",
    "BMI >30: consider injection site and needle length to ensure adequate IM administration",
    "If the dose volume exceeds 5 mL, divide it between separate IM injection sites"
  ];

  const ADMIN_RHOPHYLAC = [
    "Usually given IV; may be given by slow deep IM injection into the deltoid. Avoid gluteal administration",
    "Bring to room temperature. Solution should be clear or slightly opalescent — do not use if cloudy or containing deposits; return to the transfusion laboratory",
    "No antimicrobial preservative — use immediately after opening",
    "IV: 2 mL (1500 IU) over 15 to 60 seconds",
    "Multiple vials: maximum infusion rate 2 mL (1500 IU) over 60 seconds",
    "Obtain haematologist advice regarding dosing and administration"
  ];

  // §4.10.1
  const ADVERSE = [
    "Reactions are not common: pain, redness and stiffness at the injection site; occasionally mild fever, chills, drowsiness and urticaria. Serious reactions are rare",
    "Report any suspected adverse reaction to the transfusion laboratory (they assist with reporting to the manufacturer)",
    "Create an FYI alert when a reaction to RhD-Ig is identified",
    "Enter any clinical incident (administration, storage/waste, omission) into VHIMS for follow-up by the treating team and the Transfusion CNC"
  ];

  // Reference cards (descriptive)
  const REFERENCE_CARDS = [
    ["Dose tables (§4.5.1–4.5.4)", [
      ["Routine antenatal prophylaxis", ["28 weeks: 625 IU " + VF, "34 weeks: 625 IU " + VF]],
      ["First trimester (<13 weeks) sensitising events — 250 IU " + VF, EVENTS_FIRST.filter(e => !e.notListed).map(e => e.label).concat(["Multiple pregnancy: 625 IU " + VF, "FMH testing is not required for the first 20 weeks"])],
      ["Second and third trimester sensitising events — 625 IU " + VF, EVENTS_LATER.map(e => e.label)],
      ["Birth", [
        "Birth (normal, instrumental or caesarean section): 625 IU " + VF,
        "IM contraindicated (" + IM_CONTRAINDICATIONS + "): 1500 IU Rhophylac IV",
        "Large FMH on FMH testing (>12 mL): 1500 IU Rhophylac IV, number of vials determined by FMH test result",
        "Intra-operative cell salvage used and cord group RhD positive: 1500 IU Rhophylac IV",
        "FMH test indicates a second dose is required and BMI >30: 1500 IU Rhophylac IV"
      ]]
    ]],
    ["Products (§4.4)", [
      [VF, ["Manufactured locally by CSL Behring from Australian volunteer donor plasma", "250 IU (first trimester use) and 625 IU", "Intramuscular use only (deltoid)"]],
      ["Rhophylac®", ["Manufactured overseas by CSL Behring from US donor plasma (TGA and FDA approved centres)", "1500 IU (2 mL)", "Intravenous or intramuscular (deltoid)"]]
    ]],
    ["RHD NIPT (§4.3, Appendices A and B)", [
      ["About", ["Screening test analysing fetal DNA in a maternal blood sample to predict fetal RhD group; used for targeted RhD-Ig prophylaxis", "Medicare-funded. Only suitable for non-alloimmunised RhD negative women with a singleton pregnancy"]],
      ["Timing", ["From 15 weeks via Lifeblood; Melbourne Pathology and Dorevitch recommend after 18 weeks (a negative result before this needs re-testing)", "May still be considered up to 32 weeks (RhD-Ig would then not be required at 34 weeks or for sensitising events if the fetus is predicted RhD negative)", "Melbourne Pathology requires testing by 29 weeks"]],
      ["Ordering and results", ["Eligible women are referred to their GP for testing; results are communicated at the initial antenatal appointment", "Upload the pathology report to the EMR Media tab — it is the source of truth before RhD-Ig administration"]],
      ["Benefits", ["Avoids unnecessary exposure to a human blood product when the fetus is RhD negative", "Fewer appointments for RhD-Ig", "Preserves RhD-Ig supply", "Reduces anxiety about unnecessary RhD-Ig and the management of sensitising events"]],
      ["Risks", [
        "Inconclusive result (variant maternal RhD, poor specimen, insufficient fetal DNA): manage as standard care, presuming the fetus is RhD positive",
        "False positive: RhD-Ig given unnecessarily (risk equivalent to standard care); cord blood confirms at birth",
        "False negative (~0.5–1.0%): antenatal RhD-Ig not given, creating a risk of alloimmunisation. Overall risk remains low (0.8–1.5%) if postnatal RhD-Ig is given after an RhD positive birth. Women should be told of this risk before testing and given the option of continuing antenatal prophylaxis",
        "With full antenatal and postnatal prophylaxis there remains a ~0.2% (1 in 500) risk of alloimmunisation",
        "If a woman declines RHD NIPT, offer standard RhD-Ig prophylaxis"
      ]]
    ]],
    ["Testing during pregnancy (§4.2)", [
      ["Blood group and antibody screen", [
        "All women: in early pregnancy or at the first antenatal visit (ABO and RhD group; red cell antibodies)",
        "If no antibodies: repeat at the beginning of the third trimester (~26 weeks)",
        "Every request must include a clinical note with the date and dose of any RhD-Ig given, and any history of red cell antibodies or HDFN",
        "Passive anti-D may be detected for up to 12 weeks after RhD-Ig. See the Red Cell Antibody Testing – Procedure"
      ]]
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
  function appendCard(name, sections, open) {
    const card = document.createElement("div");
    card.className = "modality-card" + (open ? " open" : "");
    card.innerHTML = `<div class="modality-head"><span class="modality-name">${name}</span></div><div class="modality-body"></div>`;
    const body = card.querySelector(".modality-body");
    sections.forEach(([title, items, checkable]) => body.appendChild(detailSection(title, items, checkable)));
    card.querySelector(".modality-head").addEventListener("click", () => card.classList.toggle("open"));
    app.appendChild(card);
  }

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  function fmtGestation() { return `${state.weeks}+${state.days} weeks`; }
  function gestationDecimal() { return state.weeks + state.days / 7; }

  // ---- screens ------------------------------------------------------------------

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "bloodGroup": return screenBloodGroup();
      case "stopRhdPositive": return screenStop("rhdPositive");
      case "stopVariant": return screenStop("variant");
      case "stopUnknown": return screenStop("unknown");
      case "antibodies": return screenAntibodies();
      case "stopAntiDUnexplained": return screenStop("antiDUnexplained");
      case "stopAlloimmunised": return screenStop("alloimmunised");
      case "indication": return screenIndication();
      case "fetalStatus": return screenFetalStatus();
      case "routineDose": return screenRoutineDose();
      case "eventGestation": return screenEventGestation();
      case "eventType": return screenEventType();
      case "eventDetails": return screenEventDetails();
      case "cordStatus": return screenCordStatus();
      case "birthDetails": return screenBirthDetails();
      case "result": return screenResult();
      default: return screenIntro();
    }
  }

  function screenIntro() {
    screenShell(0, "RhD Immunoglobulin (Anti-D)", "Step-by-step guidance on whether RhD-Ig is indicated, and the dose, product, route and checks, for routine antenatal prophylaxis, sensitising events and birth.");
    app.appendChild(banner("info", "Before you start", [
      "For pregnant women, and women who have just given birth, at the Royal Women's Hospital.",
      "RhD-Ig is offered to RhD negative women without preformed (immune) anti-D when fetal RhD status is unknown, predicted positive or inconclusive on RHD NIPT, or confirmed positive after birth.",
      "Have to hand: the maternal blood group and antibody screen, any RHD NIPT report (EMR Media tab), and dates/doses of any RhD-Ig already given.",
      "Midwives may consent, prescribe (Standing Order 16) and administer routine antenatal prophylaxis in RWH outpatients. Sensitising events, including term birth, must be prescribed by medical staff."
    ]));
    app.appendChild(actionsRow([{ label: "Start", primary: true, onClick: () => go("bloodGroup") }]));
  }

  function screenBloodGroup() {
    screenShell(0, "Maternal blood group", "What is the woman's RhD group (from Results Review or the original laboratory report)?");
    app.appendChild(optionList([
      { label: "RhD negative", onClick: () => go("antibodies") },
      { label: "RhD positive", hint: "No RhD-Ig prophylaxis required", onClick: () => go("stopRhdPositive") },
      { label: "Variant D (weak D or partial D)", onClick: () => go("stopVariant") },
      { label: "Not yet known", onClick: () => go("stopUnknown") }
    ]));
  }

  const STOPS = {
    rhdPositive: ["ok", "No RhD-Ig prophylaxis required", "Maternal blood group is RhD positive", [
      "RhD-Ig prophylaxis is for RhD negative women (Appendix A)."
    ]],
    variant: ["warn", "Refer to haematologist", "Variant D (weak D or partial D)", [
      "For variant D (weak D or partial D), refer to a haematologist (Appendix A)."
    ]],
    unknown: ["warn", "Blood group and antibody screen needed first", "Maternal blood group not known", [
      "All pregnant women have a blood group and antibody screen in early pregnancy or at the first antenatal visit (ABO and RhD group; red cell antibodies).",
      "The request must include a clinical note with the date and dose of any RhD-Ig given, and any relevant history of red cell antibodies or HDFN.",
      "Before any administration, confirm the maternal blood group from Results Review and/or the original laboratory report — not the Results Console alone."
    ]],
    antiDUnexplained: ["bad", "Do not give yet — await laboratory haematologist and MFM advice", "Anti-D detected, origin uncertain", [
      "Anti-D has been detected but there is no record of a negative antibody screen in this pregnancy, or no confirmed RhD-Ig within the last 12 weeks.",
      "The laboratory cannot tell whether this is early alloimmunisation. It will report the antibody as anti-D, perform a titre, and refer to the laboratory haematologist and Maternal Fetal Medicine (MFM) consultant.",
      "Refer to the Red Cell Antibody Testing – Procedure."
    ]],
    alloimmunised: ["bad", "Do not give RhD-Ig", "Active RhD alloimmunisation", [
      "Anti-D antibodies with a titre of 16 or greater are due to active alloimmunisation — injections of RhD-Ig should not be given.",
      "Manage the pregnancy in consultation with an MFM specialist and haematologist.",
      "RHD NIPT is not suitable; Appendix A directs alloimmunised women to specialised NIPA.",
      "Refer to the Red Cell Antibody Testing – Procedure."
    ]]
  };

  function screenStop(key) {
    const [kind, title, heading, items] = STOPS[key];
    screenShell(RESULT, title);
    app.appendChild(banner(kind, heading, items));
    REFERENCE_CARDS.forEach(([name, sections]) => appendCard(name, sections.map(([t, i]) => [t, i, false]), false));
    finalActions();
  }

  function screenAntibodies() {
    screenShell(1, "Antibody screen", "What does the most recent antibody screen show?");
    app.appendChild(optionList([
      { label: "No red cell antibodies detected", onClick: () => { state.antibodies = "none"; go("indication"); } },
      { label: "Anti-D detected — remnant passive anti-D", hint: "Negative antibody screen earlier this pregnancy AND confirmed RhD-Ig within the last 12 weeks", onClick: () => { state.antibodies = "passive"; go("indication"); } },
      { label: "Anti-D detected — no negative screen this pregnancy, or no confirmed RhD-Ig within 12 weeks", onClick: () => go("stopAntiDUnexplained"), danger: true },
      { label: "Anti-D titre ≥16, or known RhD alloimmunisation", onClick: () => go("stopAlloimmunised"), danger: true },
      { label: "Other clinically significant red cell antibodies (not anti-D)", hint: "e.g. c, e, C, E, Fya, K", onClick: () => { state.antibodies = "other"; go("indication"); } }
    ]));
  }

  function screenIndication() {
    screenShell(2, "Indication", "Why is RhD-Ig being considered?");
    app.appendChild(optionList([
      { label: "Routine antenatal prophylaxis", hint: "28 or 34 weeks", onClick: () => { state.indication = "routine"; go("fetalStatus"); } },
      { label: "Sensitising event", hint: "e.g. bleeding, miscarriage, ectopic, invasive procedure, trauma, ECV", onClick: () => { state.indication = "event"; go("fetalStatus"); } },
      { label: "Birth", hint: "Normal, instrumental or caesarean section", onClick: () => { state.indication = "birth"; go("cordStatus"); } }
    ]));
  }

  function screenFetalStatus() {
    screenShell(3, "Fetal RhD status", "What is known about the fetal RhD status?");
    const next = s => () => {
      state.fetal = s;
      if (s === "multiple") state.multiple = true;
      if (s === "negative") return go("result");
      go(state.indication === "routine" ? "routineDose" : "eventGestation");
    };
    app.appendChild(optionList([
      { label: "Unknown — RHD NIPT not done", onClick: next("unknown") },
      { label: "RHD NIPT: fetus predicted RhD positive", onClick: next("positive") },
      { label: "RHD NIPT: inconclusive / indeterminate", onClick: next("inconclusive") },
      { label: "RHD NIPT: specimen rejected", onClick: next("rejected") },
      { label: "Woman declined RHD NIPT", onClick: next("declined") },
      { label: "Multiple pregnancy", hint: "RHD NIPT is not suitable (singleton only)", onClick: next("multiple") },
      { label: "RHD NIPT: fetus predicted RhD negative", onClick: next("negative") }
    ]));
  }

  function screenRoutineDose() {
    screenShell(4, "Routine antenatal dose", "Which dose is due?");
    app.appendChild(optionList([
      { label: "28-week dose", onClick: () => { state.routineDose = "28"; go("result"); } },
      { label: "34-week dose", onClick: () => { state.routineDose = "34"; go("result"); } }
    ]));
  }

  function screenEventGestation() {
    screenShell(4, "Gestation", "Gestation at the time of the sensitising event.");
    const wrap = document.createElement("div");
    const v = x => (x === undefined || x === null) ? "" : x;
    wrap.innerHTML = `
      <div class="field">
        <label for="weeksInput">Weeks</label>
        <input type="number" min="0" max="45" step="1" id="weeksInput" placeholder="e.g. 11" value="${v(state.weeks)}">
      </div>
      <div class="field">
        <label for="daysInput">Days</label>
        <input type="number" min="0" max="6" step="1" id="daysInput" placeholder="0–6" value="${v(state.days)}">
      </div>
      ${state.fetal === "multiple" ? "" : `<div class="field">
        <label>Multiple pregnancy?</label>
        ${radio("multiple", "no", "No — singleton", state.multiple === undefined ? undefined : (state.multiple ? "yes" : "no"))}
        ${radio("multiple", "yes", "Yes", state.multiple === undefined ? undefined : (state.multiple ? "yes" : "no"))}
      </div>`}`;
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
        const m = state.fetal === "multiple" ? "yes" : (wrap.querySelector("input[name=multiple]:checked") || {}).value;
        const missing = [];
        if (isNaN(w) || w < 0 || w > 45) missing.push("gestation in weeks (0–45)");
        if (isNaN(d) || d < 0 || d > 6) missing.push("days (0–6)");
        if (!m) missing.push("whether this is a multiple pregnancy");
        if (missing.length) { err.textContent = "Please enter " + missing.join(", ") + " to continue."; err.style.display = "block"; return; }
        state.weeks = w; state.days = d; state.multiple = m === "yes";
        go("eventType");
      }
    }]));
  }

  function screenEventType() {
    const first = state.weeks < FIRST_TRIMESTER_WEEKS;
    screenShell(4, "Sensitising event", first
      ? `First trimester (<13 weeks) — ${fmtGestation()}. Which event?`
      : `Second/third trimester — ${fmtGestation()}. Which event?`);
    const list = first ? EVENTS_FIRST : EVENTS_LATER;
    app.appendChild(optionList(list.map(e => ({
      label: e.label,
      hint: e.notListed ? "Not listed as an indication in this guideline" : "",
      onClick: () => { state.event = e.key; go(e.notListed ? "result" : "eventDetails"); }
    }))));
  }

  function screenEventDetails() {
    const fmhApplies = gestationDecimal() >= FMH_FROM_WEEKS;
    screenShell(4, "Event details", `${eventLabel()} at ${fmtGestation()}.`);
    const wrap = document.createElement("div");
    const v = x => (x === undefined || x === null) ? "" : x;
    wrap.innerHTML = `
      <div class="field">
        <label for="hoursInput">Hours since the sensitising event</label>
        <div class="hint">RhD-Ig should be given within 72 hours</div>
        <input type="number" min="0" step="any" id="hoursInput" placeholder="e.g. 6" value="${v(state.hours)}">
      </div>
      <div class="field">
        <label>Is intramuscular injection contraindicated?</label>
        <div class="hint">Severe thrombocytopenia, therapeutic anticoagulation or hereditary bleeding disorder</div>
        ${radio("im", "no", "No", state.imCx === undefined ? undefined : (state.imCx ? "yes" : "no"))}
        ${radio("im", "yes", "Yes", state.imCx === undefined ? undefined : (state.imCx ? "yes" : "no"))}
      </div>
      ${fmhApplies ? `<div class="field">
        <label for="fmhInput">FMH test result (mL fetal blood)</label>
        <div class="hint">≥20 weeks: collect the FMH specimen before giving RhD-Ig. Leave blank if pending.</div>
        <input type="number" min="0" step="any" id="fmhInput" placeholder="e.g. 2" value="${v(state.fmh)}">
      </div>` : ""}`;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([{
      label: "Continue", primary: true, onClick: () => {
        const h = parseFloat(document.getElementById("hoursInput").value);
        const im = (wrap.querySelector("input[name=im]:checked") || {}).value;
        const fmhEl = document.getElementById("fmhInput");
        const fmhRaw = fmhEl ? fmhEl.value.trim() : "";
        const fmh = fmhRaw === "" ? null : parseFloat(fmhRaw);
        const missing = [];
        if (isNaN(h) || h < 0) missing.push("hours since the event");
        if (!im) missing.push("whether IM is contraindicated");
        if (fmh !== null && (isNaN(fmh) || fmh < 0)) missing.push("a valid FMH result (or leave blank)");
        if (missing.length) { err.textContent = "Please enter " + missing.join(", ") + " to continue."; err.style.display = "block"; return; }
        state.hours = h; state.imCx = im === "yes"; state.fmh = fmh;
        go("result");
      }
    }]));
  }

  function screenCordStatus() {
    screenShell(3, "Baby's RhD group", "What is the cord blood / infant RhD group?");
    const set = s => () => { state.cord = s; go("birthDetails"); };
    app.appendChild(optionList([
      { label: "RhD positive", onClick: set("positive") },
      { label: "RhD negative", onClick: set("negative") },
      { label: "Blood group cannot be obtained", onClick: set("unobtainable") }
    ]));
  }

  function screenBirthDetails() {
    screenShell(4, "Birth details", "Complete the details below.");
    const wrap = document.createElement("div");
    const v = x => (x === undefined || x === null) ? "" : x;
    const yn = (name, key) => `${radio(name, "no", "No", state[key] === undefined ? undefined : (state[key] ? "yes" : "no"))}${radio(name, "yes", "Yes", state[key] === undefined ? undefined : (state[key] ? "yes" : "no"))}`;
    const needsDose = state.cord !== "negative";
    wrap.innerHTML = `
      <div class="field">
        <label>Antenatal RHD NIPT result</label>
        ${radio("nipt", "none", "Not done / not available", state.nipt)}
        ${radio("nipt", "positive", "Predicted RhD positive", state.nipt)}
        ${radio("nipt", "negative", "Predicted RhD negative", state.nipt)}
        ${radio("nipt", "inconclusive", "Inconclusive", state.nipt)}
      </div>
      ${needsDose ? `
      <div class="field">
        <label>Is intramuscular injection contraindicated?</label>
        <div class="hint">Severe thrombocytopenia, therapeutic anticoagulation or hereditary bleeding disorder</div>
        ${yn("im", "imCx")}
      </div>
      <div class="field">
        <label>Was intra-operative cell salvage used?</label>
        ${yn("salvage", "salvage")}
      </div>
      <div class="field">
        <label>BMI greater than 30?</label>
        ${yn("bmi", "bmi30")}
      </div>
      <div class="field">
        <label for="fmhInput">FMH test result (mL fetal blood)</label>
        <div class="hint">Collect before giving RhD-Ig. If RhD-Ig is indicated by the infant's group it can be given before the FMH result is finalised — leave blank if pending.</div>
        <input type="number" min="0" step="any" id="fmhInput" placeholder="e.g. 2" value="${v(state.fmh)}">
      </div>` : ""}`;
    app.appendChild(wrap);
    const err = document.createElement("p");
    err.className = "field-error";
    err.style.display = "none";
    app.appendChild(err);
    app.appendChild(actionsRow([{
      label: "Continue", primary: true, onClick: () => {
        const val = n => (wrap.querySelector(`input[name=${n}]:checked`) || {}).value;
        const missing = [];
        const nipt = val("nipt");
        if (!nipt) missing.push("the RHD NIPT result");
        let fmh = null;
        if (needsDose) {
          ["im", "salvage", "bmi"].forEach((n, i) => { if (!val(n)) missing.push(["whether IM is contraindicated", "whether cell salvage was used", "BMI"][i]); });
          const raw = document.getElementById("fmhInput").value.trim();
          fmh = raw === "" ? null : parseFloat(raw);
          if (fmh !== null && (isNaN(fmh) || fmh < 0)) missing.push("a valid FMH result (or leave blank)");
        }
        if (missing.length) { err.textContent = "Please enter " + missing.join(", ") + " to continue."; err.style.display = "block"; return; }
        state.nipt = nipt;
        if (needsDose) { state.imCx = val("im") === "yes"; state.salvage = val("salvage") === "yes"; state.bmi30 = val("bmi") === "yes"; state.fmh = fmh; }
        go("result");
      }
    }]));
  }

  // ---- result logic (§4.5) ---------------------------------------------------------

  function eventLabel() {
    const e = EVENTS_FIRST.concat(EVENTS_LATER).find(x => x.key === state.event);
    return e ? e.label : "";
  }

  // Additional dose for FMH >6 mL (§4.5.3): minimum 100 IU per mL over 6 mL.
  function extraDoseIU(fmh) {
    // round to 3 dp first so floating-point noise (e.g. 30.0000001) can't round up
    return Math.ceil(Math.round((fmh - FMH_COVERED_ML) * IU_PER_EXTRA_ML * 1000) / 1000);
  }

  // Returns { verdict: "give"|"notRequired"|"notListed"|"advice", title, doses[], banners[], rhophylac, prescriber }
  function computeResult() {
    const r = { verdict: "give", doses: [], banners: [], rhophylac: false, vf: true, prescriber: "medical" };

    if (state.antibodies === "passive") r.banners.push(["info", "Remnant passive anti-D", ["Anti-D consistent with RhD-Ig given within 12 weeks, with a negative screen earlier this pregnancy — continue to give RhD-Ig in accordance with the guideline (§4.6)."]]);
    if (state.antibodies === "other") r.banners.push(["warn", "Other clinically significant red cell antibodies", ["Closer monitoring of the woman and pregnancy may be required. Refer to the Red Cell Antibody Testing – Procedure.", "Appendix A directs women with clinically significant antibodies to specialised NIPA rather than RHD NIPT."]]);

    // --- antenatal / event, fetus predicted RhD negative
    if (state.indication !== "birth" && state.fetal === "negative") {
      r.verdict = "notRequired";
      r.title = "RhD-Ig not required — fetus predicted RhD negative";
      r.banners.push(["ok", "RHD NIPT predicts an RhD negative fetus", [
        "RhD-Ig is not required for routine antenatal prophylaxis or sensitising events when the fetus is predicted RhD negative (§4.3, Appendix A).",
        "Confirm the result from the RHD NIPT report in the EMR Media tab (source of truth).",
        "The woman should have been told of the ~0.5–1% false-negative risk before testing, and may choose to continue antenatal RhD-Ig prophylaxis (Appendix B).",
        "Newborn (cord blood) RhD typing is still required at birth."
      ]]);
      return r;
    }

    if (state.indication === "routine") {
      r.title = `Give 625 IU ${VF} IM — ${state.routineDose}-week dose`;
      r.prescriber = "midwife";
      r.doses.push(`625 IU ${VF}, slow deep IM injection into the deltoid`);
      const checks = [
        "May be given within 2 weeks before or after the recommended 28 / 34 weeks, per the pregnancy care schedule and clinical discretion"
      ];
      if (state.routineDose === "28") checks.unshift("<b>Collect the third-trimester blood group and antibody screen before giving the 28-week dose</b>");
      if (state.routineDose === "34") checks.push("If the 34-week dose is given early and the pregnancy goes beyond the due date, the risk of inadequate RhD-Ig cover at birth increases");
      r.banners.push(["info", "Routine antenatal prophylaxis (§4.5.1)", checks]);
      r.banners.push(["info", "If intramuscular injection is contraindicated", ["Not addressed for routine antenatal prophylaxis in this guideline — seek haematology advice."]]);
      return r;
    }

    if (state.indication === "event") {
      const first = state.weeks < FIRST_TRIMESTER_WEEKS;
      const e = (first ? EVENTS_FIRST : EVENTS_LATER).find(x => x.key === state.event);
      if (e.notListed) {
        r.verdict = "notListed";
        r.title = "Not listed as an indication in this guideline";
        r.banners.push(["warn", e.label + " — " + fmtGestation(), [
          e.key === "topEarly"
            ? "The first-trimester table lists \"Termination of pregnancy after 10 weeks gestation\" only. This guideline makes no recommendation for termination at 10 weeks or less — see the RWH Abortion: Medical Management to 9 Weeks of Pregnancy guideline, and use clinical judgement."
            : "Before 13 weeks, the table lists uterine bleeding that is heavy, repeated and/or associated with pain. Light, isolated, painless bleeding is not listed — reassess if bleeding becomes heavy, repeated or painful.",
          "If the woman's situation changes, return and re-select the event."
        ]]);
        return r;
      }

      // Dose
      let dose;
      if (first) dose = state.multiple ? 625 : 250; else dose = 625;
      const route = "slow deep IM injection into the deltoid";
      if (state.imCx && first) {
        r.verdict = "advice";
        r.title = "Seek haematology advice — IM contraindicated";
        r.banners.push(["warn", "IM contraindicated in the first trimester", [
          `The guideline indicates ${dose} IU ${VF} (IM only) for this event, but does not address the case where IM injection is contraindicated before 13 weeks. Seek haematology advice.`,
          "Give within 72 hours of the event."
        ]]);
      } else if (state.imCx) {
        r.title = `Give ${RHOPHYLAC} IV`;
        r.vf = false; r.rhophylac = true;
        r.doses.push(`${RHOPHYLAC} IV (IM contraindicated) — obtain haematologist advice regarding dosing and administration`);
      } else {
        r.title = `Give ${dose} IU ${VF} IM`;
        r.doses.push(`${dose} IU ${VF}, ${route}` + (first && state.multiple ? " (625 IU in multiple pregnancy)" : ""));
      }
      r.banners.unshift(["info", `${e.label} — ${fmtGestation()}`, [
        first ? "First trimester (<13 weeks) sensitising event (§4.5.2)." : "Second or third trimester sensitising event (§4.5.3).",
        "Must be prescribed by medical staff."
      ]]);

      timingBanner(r);

      // FMH (≥20 weeks)
      if (gestationDecimal() >= FMH_FROM_WEEKS) {
        fmhBanner(r, false);
      } else {
        r.banners.push(["info", "FMH test", ["FMH testing is not required for the first 20 weeks."]]);
      }

      // Repeat dosing for bleeding
      if (e.bleeding || state.weeks >= 12) {
        const rep = [];
        if (first && e.bleeding) rep.push("A repeat 250 IU dose may be appropriate after 6 weeks.");
        if (state.weeks >= 12 && e.bleeding) rep.push("Women with continued PV bleeding beyond 12 weeks should be offered RhD-Ig at 6-weekly intervals.");
        if (rep.length) r.banners.push(["info", "Ongoing bleeding", rep]);
      }
      return r;
    }

    // --- birth
    const discordantNeg = state.nipt === "negative" && state.cord === "positive";
    const discordantPos = state.nipt === "positive" && state.cord === "negative";
    if (state.cord === "negative") {
      r.verdict = "notRequired";
      r.title = "RhD-Ig not required — infant RhD negative";
      r.banners.push(["ok", "Infant blood group RhD negative", ["If the infant blood group is RhD negative, RhD-Ig is not required (§4.5.4)."]]);
      if (discordantPos) r.banners.push(["warn", "Discordant result: RHD NIPT predicted RhD positive (false positive)", [
        "Inform the woman of the discordant result. Antenatal RhD-Ig was given unnecessarily, but this does not increase her risk of alloimmunisation beyond standard care.",
        "No postnatal RhD-Ig is required.",
        "Report the discordant result to the testing laboratory and through VHIMS, and document the disclosure in the EMR."
      ]]);
      return r;
    }

    r.title = `Give 625 IU ${VF} IM within 72 hours of birth`;
    r.doses.push(`625 IU ${VF}, slow deep IM injection into the deltoid, within 72 hours of birth`);
    if (state.cord === "unobtainable") r.banners.push(["warn", "Infant blood group cannot be obtained", ["RhD-Ig should be offered when a blood group cannot be obtained (§4.5.4)."]]);
    if (discordantNeg) r.banners.push(["bad", "Discordant result: RHD NIPT predicted RhD negative, infant RhD positive (possible false negative)", [
      "Collect a repeat capillary blood specimen from the newborn to confirm the RhD group.",
      "If confirmed RhD positive: give RhD-Ig within 72 hours of birth, and repeat the maternal blood group and antibody screen, along with FMH.",
      "Inform the woman of the discordant result, the implications for this pregnancy and any impact on future pregnancies. Seek haematology advice.",
      "Report to the testing laboratory and through VHIMS; document the disclosure in the EMR."
    ]]);

    const rhoReasons = [];
    if (state.imCx) rhoReasons.push("IM injection contraindicated");
    if (state.salvage && state.cord === "positive") rhoReasons.push("intra-operative cell salvage used and cord group RhD positive");
    if (state.salvage && state.cord === "unobtainable") r.banners.push(["warn", "Cell salvage with unknown cord group", ["The guideline specifies 1500 IU Rhophylac IV after cell salvage when the cord group is RhD positive. With no cord group available, seek haematology advice."]]);
    if (rhoReasons.length) {
      r.title = `Give ${RHOPHYLAC} IV within 72 hours of birth`;
      r.vf = false; r.rhophylac = true;
      r.doses = [`${RHOPHYLAC} IV (${rhoReasons.join("; ")}) — obtain haematologist advice regarding dosing and administration`];
    }
    fmhBanner(r, true);
    r.banners.push(["info", "Newborn testing", ["Perform a blood group and direct antiglobulin test (DAT) on a neonatal specimen (cord blood, venepuncture or heel lance) — including when RHD NIPT predicted an RhD negative fetus."]]);
    return r;
  }

  function timingBanner(r) {
    const h = state.hours;
    if (h <= HOURS_STANDARD) {
      r.banners.push(["ok", `Timing: ${h} hours since the event`, ["Give within 72 hours of the event."]]);
    } else if (h <= HOURS_MAX) {
      r.banners.push(["warn", `Timing: ${h} hours since the event (beyond 72 hours)`, ["If administration is delayed beyond 72 hours, some protection may be offered if RhD-Ig is given up to 10 days after the event, but it may have lower efficacy. Give as soon as possible."]]);
    } else {
      r.banners.push(["bad", `Timing: ${h} hours since the event (beyond 10 days)`, ["This is beyond the window described in the guideline (up to 10 days). Seek haematology advice."]]);
    }
  }

  function fmhBanner(r, birth) {
    const fmh = state.fmh;
    const items = [birth
      ? "All RhD negative women should have an FMH test after birth and before RhD-Ig. If RhD-Ig is indicated by the infant's group, it can be given before the FMH result is finalised."
      : "Beyond 20 weeks, perform an FMH test to determine whether additional doses are required. Collect the specimen <b>before</b> giving RhD-Ig."];
    let kind = "info";
    if (fmh === null || fmh === undefined) {
      items.push("FMH result pending — review when available. A 625 IU dose covers an FMH of up to 6 mL.");
    } else if (fmh <= FMH_COVERED_ML) {
      kind = "ok";
      items.push(`FMH ${fmh} mL — covered by the 625 IU dose (up to 6 mL). No additional dose required.`);
    } else {
      kind = "warn";
      const extra = extraDoseIU(fmh);
      items.push(`FMH ${fmh} mL is greater than 6 mL — <b>additional RhD-Ig must be given</b>: minimum ${IU_PER_EXTRA_ML} IU per mL over 6 mL = <b>at least ${extra} IU</b> in addition to the initial dose.`);
      items.push("Number of injections/vials: confirm with the blood bank / haematologist.");
      items.push("For large FMH volumes requiring more than two injections, Rhophylac 1500 IU IV is recommended — obtain haematologist advice regarding dosing and administration.");
      if (birth && fmh > FMH_LARGE_BIRTH_ML) {
        items.push(`FMH >12 mL at birth: <b>1500 IU Rhophylac IV</b>, number of vials determined by the FMH test result.`);
        r.doses.push("Large FMH (>12 mL): 1500 IU Rhophylac IV — number of vials determined by the FMH test result; obtain haematologist advice");
        r.rhophylac = true;
      }
      if (birth && state.bmi30) {
        items.push("FMH indicates a second dose is required and BMI >30: <b>1500 IU Rhophylac IV</b>. Consider consultation with a Consultant Haematologist to determine dosing and administration.");
        if (!(fmh > FMH_LARGE_BIRTH_ML)) r.doses.push("Second dose required with BMI >30: 1500 IU Rhophylac IV — consider Consultant Haematologist consultation");
        r.rhophylac = true;
      }
    }
    r.banners.push([kind, "FMH test", items]);
  }

  function screenResult() {
    const r = computeResult();
    screenShell(RESULT, r.title);
    const kind = { give: "ok", notRequired: "ok", notListed: "warn", advice: "warn" }[r.verdict];

    if (r.verdict === "give") {
      app.appendChild(actionPanel(kind, "Prescribe and give", r.doses.concat([
        r.prescriber === "midwife"
          ? "Prescriber: midwife may initiate in the RWH outpatient setting (Standing Order 16), or medical staff"
          : "Prescriber: must be prescribed by medical staff"
      ])));
    }
    r.banners.forEach(([k, t, items]) => app.appendChild(banner(k, t, items)));

    if (r.verdict === "give" || r.verdict === "advice") {
      const box = document.createElement("div");
      box.className = "checklist-box";
      box.innerHTML = "<h3>Consent (§4.7)</h3>";
      CONSENT.forEach(i => box.appendChild(checkRow(i)));
      const h3 = document.createElement("h3");
      h3.textContent = "If the woman declines";
      h3.style.marginTop = "1rem";
      box.appendChild(h3);
      box.appendChild(checkRow("Document the discussion in the EMR and follow the Blood Refusal – Management of Patient (Adults) – Guideline (§4.7.1)"));
      app.appendChild(box);

      appendCard("Counselling: benefits and risks (§4.7)", [["Benefits", COUNSELLING_BENEFITS, false], ["Risks", COUNSELLING_RISKS, false]], false);
      appendCard("Ordering and prescription (§4.8, §4.9.1)", [["Obtaining RhD-Ig", ORDERING, true], ["The order must contain", PRESCRIPTION, true]], false);
      const adminSections = [["Before and during the two-person check (§4.9.2)", PRE_ADMIN, true]];
      if (r.vf) adminSections.push([VF, ADMIN_VF, true]);
      if (r.rhophylac) adminSections.push(["Rhophylac®", ADMIN_RHOPHYLAC, true]);
      adminSections.push(["Documentation", ["The staff member administering must check and dual sign via the MAR (or date, time and dual sign on the Medicines Chart and transfusion record, if used)"], true]);
      appendCard("Administration (§4.9.2)", adminSections, false);
      appendCard("Adverse events (§4.10.1)", [["Reaction to RhD-Ig", ADVERSE, true]], false);
    }

    const p = document.createElement("div");
    p.appendChild(patientInfoLink(PATIENT_INFO.nipt));
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
