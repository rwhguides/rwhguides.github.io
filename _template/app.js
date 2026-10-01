/* ============================================================================
   [Guideline Title] — template
   Starting point for a new RWH guideline companion tool. The engine below
   (state machine + DOM helpers) is generic and copied from the pattern used
   by every tool in this repo — you shouldn't need to change it. Replace the
   PHASES list and the example screens further down with your own guideline's
   questions and logic.

   See _template/README.md for a step-by-step guide to building a new tool.
   ============================================================================ */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const backBtn = document.getElementById("backBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ---- customise this for your guideline's flow -------------------------------
  // Each phase is one breadcrumb step. Keep it short — 4-6 phases is typical.
  const PHASES = ["Start", "Questions", "Details", "Result"];

  // ---- state machine ----------------------------------------------------------

  let state = {};
  let navStack = []; // stack of { screen, state snapshot } for the Back button
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

  // ---- DOM helpers (generic — reuse as-is) -------------------------------------

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

  // Informational panel (not actionable) — use for rationale/explanatory text.
  function banner(kind, titleText, items) {
    const div = document.createElement("div");
    div.className = "banner " + kind;
    let html = `<strong>${titleText}</strong>`;
    if (items && items.length) html += "<ul>" + items.map(i => `<li>${i}</li>`).join("") + "</ul>";
    div.innerHTML = html;
    return div;
  }

  let checkIdCounter = 0;

  // Actionable checklist panel with real, tickable checkboxes.
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

  function finalActions() {
    app.appendChild(actionsRow([
      { label: "Print / save summary", onClick: () => window.print() },
      { label: "Start over", primary: true, onClick: restart }
    ]));
  }

  // ---- screens ------------------------------------------------------------------
  // Add one case per screen you create, matching the id you pass to go("...").

  function render() {
    switch (currentScreen) {
      case "intro": return screenIntro();
      case "exampleQuestion": return screenExampleQuestion();
      case "exampleResult": return screenExampleResult();
      default: return screenIntro();
    }
  }

  // --- Example flow — delete once you've built your own screens ---

  function screenIntro() {
    screenShell(0, "[Guideline Title]", "Step-by-step guidance based on the [Guideline Title] guideline.");
    app.appendChild(banner("info", "Before you start", [
      "Describe any assumptions this tool makes (e.g. a diagnosis already confirmed).",
      "Describe what it covers.",
      "Describe what it explicitly does not cover."
    ]));
    app.appendChild(actionsRow([
      { label: "Start", primary: true, onClick: () => go("exampleQuestion") }
    ]));
  }

  function screenExampleQuestion() {
    screenShell(1, "Example question", "Replace this with your guideline's first decision point.");
    app.appendChild(optionList([
      { label: "Option A", hint: "Short clarifying hint", onClick: () => { state.choice = "A"; go("exampleResult"); } },
      { label: "Option B", hint: "Short clarifying hint", onClick: () => { state.choice = "B"; go("exampleResult"); } }
    ]));
  }

  function screenExampleResult() {
    screenShell(3, "Recommendation");
    app.appendChild(banner("info", "You chose: " + state.choice, [
      "Replace this screen with your guideline's actual recommendation logic."
    ]));
    app.appendChild(actionPanel("ok", "Standard checklist example", [
      "Example actionable item one",
      "Example actionable item two"
    ]));
    finalActions();
  }

  // ---- boot -----------------------------------------------------------------
  render();
})();
