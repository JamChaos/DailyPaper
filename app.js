const els = {
  statReports: document.querySelector("#statReports"),
  statPapers: document.querySelector("#statPapers"),
  statHigh: document.querySelector("#statHigh"),
  searchInput: document.querySelector("#searchInput"),
  priorityFilter: document.querySelector("#priorityFilter"),
  areaFilter: document.querySelector("#areaFilter"),
  reportList: document.querySelector("#reportList"),
  emptyState: document.querySelector("#emptyState"),
  reportDetail: document.querySelector("#reportDetail"),
  reportDate: document.querySelector("#reportDate"),
  reportTitle: document.querySelector("#reportTitle"),
  markdownLink: document.querySelector("#markdownLink"),
  reportSummary: document.querySelector("#reportSummary"),
  trendRow: document.querySelector("#trendRow"),
  topPicks: document.querySelector("#topPicks"),
  paperList: document.querySelector("#paperList"),
};

const state = {
  reports: [],
  selectedDate: "",
  search: "",
  priority: "all",
  area: "all",
};

const areaNeedles = {
  "3d": ["3d", "三维", "重建", "生成", "渲染", "gaussian", "splatting", "nerf"],
  world: ["world", "世界模型", "world model", "simulation", "仿真"],
  robot: ["robot", "机器人", "manipulation", "grasp", "embodied"],
  physical: ["physical", "physics", "物理", "physics-aware", "physical ai"],
  hoi: ["hoi", "human-object", "human object", "hand-object", "hand object", "人-物", "人与物", "交互", "affordance", "grasp"],
};

function byDateDesc(a, b) {
  return String(b.date || "").localeCompare(String(a.date || ""));
}

function priorityClass(priority) {
  if (priority === "高") return "priority-high";
  if (priority === "中") return "priority-medium";
  return "priority-low";
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function getAllPapers() {
  return state.reports.flatMap((report) =>
    (report.papers || []).map((paper) => ({ ...paper, reportDate: report.date })),
  );
}

function paperSearchText(paper) {
  return [
    paper.title,
    paper.authors,
    paper.summary,
    paper.methodHighlights,
    paper.categories,
    paper.priority,
    paper.areaTags,
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function paperMatches(paper) {
  const text = paperSearchText(paper);
  const queryOk = !state.search || text.includes(state.search.toLowerCase());
  const priorityOk = state.priority === "all" || paper.priority === state.priority;
  const areaOk =
    state.area === "all" || areaNeedles[state.area].some((needle) => text.includes(needle));
  return queryOk && priorityOk && areaOk;
}

function reportPapers(report) {
  return (report.papers || []).filter(paperMatches);
}

function renderStats() {
  const papers = getAllPapers();
  els.statReports.textContent = state.reports.length;
  els.statPapers.textContent = papers.length;
  els.statHigh.textContent = papers.filter((paper) => paper.priority === "高").length;
}

function renderArchive() {
  els.reportList.replaceChildren();

  state.reports.forEach((report) => {
    const button = createEl("button", "report-button");
    button.type = "button";
    button.classList.toggle("is-active", report.date === state.selectedDate);

    const count = (report.papers || []).length;
    button.append(
      createEl("strong", "", report.date || "Unknown date"),
      createEl("span", "", `${count} papers · ${report.shortTitle || report.title || "Daily Report"}`),
    );

    button.addEventListener("click", () => {
      state.selectedDate = report.date;
      render();
    });

    els.reportList.append(button);
  });
}

function renderPill(text, className = "") {
  return createEl("span", `pill ${className}`.trim(), text);
}

function renderTopPicks(report) {
  els.topPicks.replaceChildren();
  const picks = report.topPapers || [];

  if (!picks.length) {
    els.topPicks.append(renderPill("No top picks yet"));
    return;
  }

  picks.forEach((pick) => els.topPicks.append(renderPill(pick)));
}

function renderTrends(report) {
  els.trendRow.replaceChildren();
  const trends = report.trends || [];

  if (!trends.length) {
    els.trendRow.append(renderPill("Trend pending"));
    return;
  }

  trends.forEach((trend) => els.trendRow.append(renderPill(trend)));
}

function renderResources(paper) {
  const row = createEl("div", "resource-row");
  const resources = [
    ["arXiv", paper.arxivUrl],
    ["Project", paper.projectUrl],
    ["Code", paper.codeUrl],
    ["Dataset", paper.datasetUrl],
  ];

  resources
    .filter(([, href]) => Boolean(href))
    .forEach(([label, href]) => {
      const link = createEl("a", "resource-link", label);
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      row.append(link);
    });

  if (!row.children.length) {
    row.append(renderPill("No external resources"));
  }

  return row;
}

function renderPaper(paper, index) {
  const card = createEl("article", "paper-card");
  const meta = createEl("div", "paper-meta");
  meta.append(
    renderPill(`#${index + 1}`),
    renderPill(paper.priority || "低", priorityClass(paper.priority)),
  );

  if (paper.published) meta.append(renderPill(paper.published));
  if (paper.categories) meta.append(renderPill(paper.categories));

  const title = createEl("h4", "", paper.title || "Untitled paper");
  const authors = createEl("p", "authors", paper.authors || "Authors unavailable");
  const summary = createEl("p", "", paper.summary || "No summary available.");

  card.append(meta, title, authors, summary);

  const methods = paper.methodHighlights || [];
  if (methods.length) {
    const list = createEl("ul", "method-list");
    methods.forEach((item) => list.append(createEl("li", "", item)));
    card.append(list);
  }

  card.append(renderResources(paper));
  return card;
}

function renderReportDetail() {
  const report = state.reports.find((item) => item.date === state.selectedDate) || state.reports[0];

  if (!report) {
    els.emptyState.hidden = false;
    els.reportDetail.hidden = true;
    return;
  }

  els.emptyState.hidden = true;
  els.reportDetail.hidden = false;

  els.reportDate.textContent = report.date || "Latest";
  els.reportTitle.textContent = report.title || "Daily Report";
  els.reportSummary.textContent = report.summary || "";
  els.markdownLink.href = report.markdownPath || `reports/arxiv/${report.date}.md`;

  renderTrends(report);
  renderTopPicks(report);

  els.paperList.replaceChildren();
  const papers = reportPapers(report);

  if (!papers.length) {
    els.paperList.append(createEl("p", "authors", "No papers match the current filters."));
    return;
  }

  papers.forEach((paper, index) => els.paperList.append(renderPaper(paper, index)));
}

function render() {
  renderStats();
  renderArchive();
  renderReportDetail();
}

async function loadReports() {
  try {
    const response = await fetch("data/reports.json", { cache: "no-store" });
    const data = await response.json();
    state.reports = Array.isArray(data.reports) ? data.reports.sort(byDateDesc) : [];
    state.selectedDate = state.reports[0]?.date || "";
  } catch (error) {
    console.error(error);
    state.reports = [];
  }

  render();
}

els.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderReportDetail();
});

els.priorityFilter.addEventListener("change", (event) => {
  state.priority = event.target.value;
  renderReportDetail();
});

els.areaFilter.addEventListener("change", (event) => {
  state.area = event.target.value;
  renderReportDetail();
});

loadReports();
