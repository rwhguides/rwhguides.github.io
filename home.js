(function () {
  "use strict";

  const STATUS_LABEL = { live: "Live", draft: "Draft", planned: "Coming soon" };
  const grid = document.getElementById("tool-grid");

  window.TOOLS.forEach(tool => {
    const isLive = tool.status === "live";
    const card = document.createElement(isLive ? "a" : "div");
    card.className = "card tool-card" + (isLive ? "" : " disabled");
    if (isLive) card.href = tool.path;

    card.innerHTML = `
      <div class="tool-card-top">
        <h2>${tool.title}</h2>
        <span class="badge tool-status-${tool.status}">${STATUS_LABEL[tool.status] || tool.status}</span>
      </div>
      <p class="tool-desc">${tool.description}</p>
      <p class="tool-meta">${tool.guidelineTitle} — ${tool.guidelineRef}<br>Last updated ${tool.lastUpdated} · ${tool.department}</p>
    `;
    grid.appendChild(card);
  });
})();
