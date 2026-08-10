const els = {
  statReports: document.querySelector("#statReports"),
  statPapers: document.querySelector("#statPapers"),
  statHigh: document.querySelector("#statHigh"),
  statWatch: document.querySelector("#statWatch"),
  searchInput: document.querySelector("#searchInput"),
  priorityFilter: document.querySelector("#priorityFilter"),
  areaFilter: document.querySelector("#areaFilter"),
  watchFilter: document.querySelector("#watchFilter"),
  reportList: document.querySelector("#reportList"),
  emptyState: document.querySelector("#emptyState"),
  reportDetail: document.querySelector("#reportDetail"),
  reportDate: document.querySelector("#reportDate"),
  reportTitle: document.querySelector("#reportTitle"),
  markdownLink: document.querySelector("#markdownLink"),
  reportSummary: document.querySelector("#reportSummary"),
  watchlistSummary: document.querySelector("#watchlistSummary"),
  watchlistHits: document.querySelector("#watchlistHits"),
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
  watch: "all",
};

const watchGroups = [
  {
    id: "kaiming-he",
    name: "Kaiming He",
    shortName: "Kaiming He",
    needles: ["kaiming he", "何恺明", "何凯明"],
  },
  {
    id: "anpei-chen",
    name: "Anpei Chen",
    shortName: "Anpei Chen",
    needles: ["anpei chen", "陈安培"],
  },
  {
    id: "shangzhe-wu",
    name: "Shangzhe Wu",
    shortName: "Shangzhe Wu",
    needles: ["shangzhe wu", "吴尚哲"],
  },
  {
    id: "qianqian-wang",
    name: "Qianqian Wang",
    shortName: "Qianqian Wang",
    needles: ["qianqian wang", "王倩倩"],
  },
  {
    id: "saining-xie",
    name: "Saining Xie",
    shortName: "Saining Xie",
    needles: ["saining xie", "谢赛宁"],
  },
  {
    id: "oxford-vgg",
    name: "Oxford Visual Geometry Group (VGG)",
    shortName: "Oxford VGG",
    needles: ["visual geometry group", "oxford vgg", "oxford university visual geometry"],
  },
];

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
  if (text !== undefined) el.textContent = Array.isArray(text) ? text.join(", ") : text;
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
    paper.affiliations,
    paper.affiliation,
    paper.institutions,
    paper.labs,
    paper.groups,
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function paperWatchText(paper) {
  return [
    paper.authors,
    paper.affiliations,
    paper.affiliation,
    paper.institutions,
    paper.labs,
    paper.groups,
    paper.projectUrl,
    paper.codeUrl,
    paper.datasetUrl,
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPaperWatchHits(paper) {
  const text = paperWatchText(paper);
  const declared = Array.isArray(paper.watchGroups) ? paper.watchGroups.map(String) : [];
  return watchGroups.filter(
    (group) =>
      declared.includes(group.id) ||
      declared.some((item) => item.toLowerCase() === group.name.toLowerCase()) ||
      group.needles.some((needle) => text.includes(needle)),
  );
}

function paperMatches(paper) {
  const text = paperSearchText(paper);
  const queryOk = !state.search || text.includes(state.search.toLowerCase());
  const priorityOk = state.priority === "all" || paper.priority === state.priority;
  const areaOk =
    state.area === "all" || areaNeedles[state.area].some((needle) => text.includes(needle));
  const watchOk =
    state.watch === "all" || getPaperWatchHits(paper).some((group) => group.id === state.watch);
  return queryOk && priorityOk && areaOk && watchOk;
}

function reportPapers(report) {
  return (report.papers || []).filter(paperMatches);
}

function renderStats() {
  const papers = getAllPapers();
  els.statReports.textContent = state.reports.length;
  els.statPapers.textContent = papers.length;
  els.statHigh.textContent = papers.filter((paper) => paper.priority === "高").length;
  els.statWatch.textContent = papers.filter((paper) => getPaperWatchHits(paper).length).length;
}

function populateWatchFilter() {
  const current = state.watch;
  els.watchFilter.replaceChildren(createEl("option", "", "All groups"));
  els.watchFilter.firstElementChild.value = "all";

  watchGroups.forEach((group) => {
    const option = createEl("option", "", group.name);
    option.value = group.id;
    els.watchFilter.append(option);
  });

  els.watchFilter.value = watchGroups.some((group) => group.id === current) ? current : "all";
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
    els.topPicks.append(createEl("p", "empty-copy", "No top picks yet"));
    return;
  }

  picks.forEach((pick, index) => {
    const item = createEl("div", "top-pick");
    item.append(createEl("span", "top-pick-index", String(index + 1)), createEl("span", "", pick));
    els.topPicks.append(item);
  });
}

function renderTrends(report) {
  els.trendRow.replaceChildren();
  const trends = report.trends || [];

  if (!trends.length) {
    els.trendRow.append(createEl("p", "empty-copy", "Trend pending"));
    return;
  }

  trends.forEach((trend) => els.trendRow.append(createEl("p", "trend-item", trend)));
}

function renderWatchlist(report) {
  const papers = report.papers || [];
  const matches = papers.flatMap((paper) =>
    getPaperWatchHits(paper).map((group) => ({ group, paper })),
  );
  const groupCounts = new Map(watchGroups.map((group) => [group.id, 0]));
  matches.forEach(({ group }) => groupCounts.set(group.id, groupCounts.get(group.id) + 1));

  els.watchlistHits.replaceChildren();
  const activeGroups = watchGroups.filter((group) => groupCounts.get(group.id));

  if (!activeGroups.length) {
    els.watchlistSummary.textContent = "本日报暂无重点组命中；后续会继续扫描作者、机构和项目页信息。";
  } else {
    els.watchlistSummary.textContent = `本日报命中 ${matches.length} 条重点组关联，共 ${activeGroups.length} 个监测对象。`;
  }

  watchGroups.forEach((group) => {
    const count = groupCounts.get(group.id);
    const button = createEl("button", "watch-chip", count ? `${group.shortName} · ${count}` : group.shortName);
    button.type = "button";
    button.disabled = !count;
    button.title = count ? `筛选 ${group.name}` : `${group.name} · 本日报未命中`;
    button.classList.toggle("is-active", state.watch === group.id);
    button.classList.toggle("is-muted", !count);
    button.addEventListener("click", () => {
      state.watch = state.watch === group.id ? "all" : group.id;
      els.watchFilter.value = state.watch;
      renderReportDetail();
    });
    els.watchlistHits.append(button);
  });
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

function getPaperFacts(paper) {
  const facts = [];
  const published = String(paper.published || "").trim();

  if (published.includes(";")) {
    published.split(";").forEach((part) => {
      const [rawLabel, ...rawValue] = part.split(":");
      const value = rawValue.join(":").trim();
      if (!value) return;

      const labelText = rawLabel.trim();
      let label = labelText;
      if (/published/i.test(labelText)) label = "Published";
      if (/updated/i.test(labelText)) label = "Updated";
      if (labelText.includes("公告")) label = "Batch";
      if (labelText.includes("分类")) label = "Categories";

      facts.push([label, value]);
    });
  } else if (published) {
    facts.push(["Published", published]);
  }

  if (paper.categories && !facts.some(([label]) => label === "Categories")) {
    facts.push(["Categories", paper.categories]);
  }

  return facts;
}

function renderPaperFacts(paper) {
  const facts = getPaperFacts(paper);
  if (!facts.length) return null;

  const list = createEl("dl", "paper-facts");
  facts.forEach(([label, value]) => {
    const item = createEl("div", "paper-fact");
    item.append(createEl("dt", "", label), createEl("dd", "", value));
    list.append(item);
  });

  return list;
}

function renderPaper(paper, index) {
  const card = createEl("article", "paper-card");
  const meta = createEl("div", "paper-meta");
  const watchHits = getPaperWatchHits(paper);
  meta.append(
    renderPill(`#${index + 1}`),
    renderPill(paper.priority || "低", priorityClass(paper.priority)),
  );
  watchHits.forEach((group) => meta.append(renderPill(`重点组 · ${group.shortName}`, "watch-pill")));
  card.classList.toggle("has-watch-match", watchHits.length > 0);

  const title = createEl("h4", "", paper.title || "Untitled paper");
  const authors = createEl("p", "authors", paper.authors || "Authors unavailable");
  const facts = renderPaperFacts(paper);
  const summary = createEl("p", "", paper.summary || "No summary available.");

  card.append(meta, title, authors);
  if (facts) card.append(facts);
  card.append(summary);

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
  renderWatchlist(report);

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

  populateWatchFilter();
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

els.watchFilter.addEventListener("change", (event) => {
  state.watch = event.target.value;
  renderReportDetail();
});

loadReports();
