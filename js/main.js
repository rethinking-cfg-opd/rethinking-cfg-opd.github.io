/* ============================================================
   Project page interactions:
   - builds dense-to-sparse result grids from a manifest
   - builds placeholder grids for figures to be filled later
   - tabs, lightbox, copy-bibtex
   ============================================================ */

/* ---- Dense-to-sparse manifest --------------------------------------------
   Cell image path: assets/figures/d2s/<mod>/<rowkey>_c<col>.webp
   keyframeCols marks the sparse-control columns (skeleton / 4-keyframe input). */
const D2S = {
  pose: {
    cols: ["Keyframe 0", "Frame 10", "Keyframe 20", "Frame 30", "Keyframe 40", "Frame 50", "Keyframe 60"],
    keyframeCols: [0, 2, 4, 6],
    rows: [
      { key: "gt",        label: "Ground Truth" },
      { key: "teacher",   label: "Teacher (dense pose)" },
      { key: "student",   label: "Student (base)" },
      { key: "sft",       label: "SFT" },
      { key: "offpolicy", label: "Off-policy" },
      { key: "naive",     label: "Naive CFG-OPD" },
      { key: "ours",      label: "PDM", ours: true },
    ],
    video: "assets/videos/pose_comparison.mp4",
  },
  depth: {
    cols: ["Frame 0", "Frame 10", "Frame 20", "Frame 30", "Frame 40", "Frame 50", "Frame 60"],
    keyframeCols: [0, 2, 4, 6],
    rows: [
      { key: "control",   label: "Sparse Control (4 KF)" },
      { key: "gt",        label: "Ground Truth" },
      { key: "teacher",   label: "Teacher (dense depth)" },
      { key: "student",   label: "Student (base)" },
      { key: "sft",       label: "SFT" },
      { key: "offpolicy", label: "Off-policy" },
      { key: "naive",     label: "Naive CFG-OPD" },
      { key: "ours",      label: "PDM", ours: true },
    ],
    video: "assets/videos/depth_comparison.mp4",
  },
  scribble: {
    cols: ["Frame 0", "Frame 10", "Frame 20", "Frame 30", "Frame 40", "Frame 50", "Frame 60"],
    keyframeCols: [0, 2, 4, 6],
    rows: [
      { key: "control",   label: "Sparse Control (4 KF)" },
      { key: "gt",        label: "Ground Truth" },
      { key: "teacher",   label: "Teacher (dense scribble)" },
      { key: "student",   label: "Student (base)" },
      { key: "sft",       label: "SFT" },
      { key: "offpolicy", label: "Off-policy" },
      { key: "naive",     label: "Naive CFG-OPD" },
      { key: "ours",      label: "PDM", ours: true },
    ],
    video: "assets/videos/scribble_comparison.mp4",
  },
};

function buildD2SGrid(mod) {
  const cfg = D2S[mod];
  const kf = new Set(cfg.keyframeCols);
  let html = '<div class="grid-scroll"><table class="dgrid"><thead><tr><th class="rowhead"></th>';
  cfg.cols.forEach((c, i) => {
    html += `<th class="colhead${kf.has(i) ? " kf" : ""}">${c}</th>`;
  });
  html += "</tr></thead><tbody>";
  cfg.rows.forEach((r) => {
    html += `<tr class="${r.ours ? "ours" : ""}">`;
    const lbl = r.ours
      ? `<span class="rowlabel-strong">${r.label}<span class="ours-pill">OURS</span></span>`
      : r.label;
    html += `<th class="rowhead">${lbl}</th>`;
    for (let i = 0; i < cfg.cols.length; i++) {
      const src = `assets/figures/d2s/${mod}/${r.key}_c${i}.webp`;
      const alt = `${mod} ${r.label} ${cfg.cols[i]}`;
      html += `<td><div class="cell"><img loading="lazy" decoding="async" src="${src}" alt="${alt}"></div></td>`;
    }
    html += "</tr>";
  });
  html += "</tbody></table></div>";

  // optional video slot (placeholder until the user supplies the clip)
  html += `
    <div class="video-slot" data-video="${cfg.video}">
      <div class="vt">▶ Full-rollout video comparison — placeholder</div>
      <div class="vp">Drop your rendered clip at <code>${cfg.video}</code> (and/or a <code>.webm</code>). It will appear here automatically.</div>
    </div>`;
  return html;
}

/* ---- Real image grids: VKD (Fig 2a) & concept identity (Fig 4) -------------
   Columns g1/g1p5/g2p5 -> CFG 1/2/3 (+ Target). Cell path:
   assets/figures/<fig>/s<NN>_<ours|naive>_<cfg1|cfg2|cfg3>.webp, s<NN>_target.webp */
const FIGS = {
  vkd: {
    cols: ["CFG = 1", "CFG = 2", "CFG = 3", "Target"],
    dir: "assets/figures/vkd",
    samples: [0, 1, 3, 6, 7, 9, 10, 14, 20],
  },
  identity: {
    cols: ["CFG = 1", "CFG = 2", "CFG = 3", "Target"],
    dir: "assets/figures/identity",
    samples: [0, 1, 2, 3],
  },
};

const pad2 = (n) => String(n).padStart(2, "0");

function buildFigGrid(id) {
  const cfg = FIGS[id];
  const cols = ["cfg1", "cfg2", "cfg3"];
  let html = '<div class="grid-scroll"><table class="dgrid figgrid"><thead><tr><th class="rowhead"></th>';
  cfg.cols.forEach((c) => (html += `<th class="colhead">${c}</th>`));
  html += "</tr></thead><tbody>";
  cfg.samples.forEach((sn, si) => {
    const s = pad2(sn);
    const sep = si > 0 ? " sample-sep" : "";
    const cell = (src, alt) =>
      `<td><div class="cell"><img loading="lazy" decoding="async" src="${src}" alt="${alt}"></div></td>`;
    // Ours (PDM) row — highlighted; Target spans both rows
    html += `<tr class="ours${sep}">`;
    html += `<th class="rowhead"><span class="rowlabel-strong">PDM<span class="ours-pill">OURS</span></span></th>`;
    cols.forEach((c) => (html += cell(`${cfg.dir}/s${s}_ours_${c}.webp`, `${id} sample ${s} PDM ${c}`)));
    html += `<td rowspan="2"><div class="cell tgt"><img loading="lazy" decoding="async" src="${cfg.dir}/s${s}_target.webp" alt="target ${s}"></div></td>`;
    html += "</tr>";
    // Naive row
    html += `<tr>`;
    html += `<th class="rowhead">Naive</th>`;
    cols.forEach((c) => (html += cell(`${cfg.dir}/s${s}_naive_${c}.webp`, `${id} sample ${s} naive ${c}`)));
    html += "</tr>";
  });
  html += "</tbody></table></div>";
  return html;
}

/* ---- Fig 2b: pose-control NBA across guidance scales ----------------------
   Per clip: GT (skeleton overlay) + PDM / Naive at γ=1 and γ=3, over 4 keyframes.
   Cell path: assets/figures/nba_pose/<clip>_<rowkey>_kf<0-3>.webp
   All 5 clips are on disk; edit `clips` to show more/fewer. */
const NBA_POSE = {
  cols: ["Keyframe 0", "Keyframe 20", "Keyframe 40", "Keyframe 60"],
  dir: "assets/figures/nba_pose",
  clips: ["0014", "0216", "0591"], // available: 0014, 0028, 0216, 0571, 0591
  rows: [
    { key: "gt", label: "Ground Truth (pose)" },
    { key: "pdm_g1", label: "PDM · γ = 1", ours: true },
    { key: "naive_g1", label: "Naive · γ = 1" },
    { key: "pdm_g3", label: "PDM · γ = 3", ours: true },
    { key: "naive_g3", label: "Naive · γ = 3" },
    { key: "pdm_g5", label: "PDM · γ = 5", ours: true },
    { key: "naive_g5", label: "Naive · γ = 5" },
  ],
};

function buildNbaPoseGrid() {
  const cfg = NBA_POSE;
  let html = '<div class="grid-scroll"><table class="dgrid figgrid"><thead><tr><th class="rowhead"></th>';
  cfg.cols.forEach((c) => (html += `<th class="colhead kf">${c}</th>`));
  html += "</tr></thead><tbody>";
  cfg.clips.forEach((clip, ci) => {
    cfg.rows.forEach((r, ri) => {
      const sep = ri === 0 && ci > 0 ? " sample-sep" : "";
      html += `<tr class="${r.ours ? "ours" : ""}${sep}">`;
      const lbl = r.label;
      const inner = r.ours
        ? `<span class="rowlabel-strong">${lbl}<span class="ours-pill">OURS</span></span>`
        : lbl;
      html += `<th class="rowhead">${inner}</th>`;
      for (let i = 0; i < cfg.cols.length; i++) {
        const src = `${cfg.dir}/${clip}_${r.key}_kf${i}.webp`;
        html += `<td><div class="cell"><img loading="lazy" decoding="async" src="${src}" alt="clip ${clip} ${r.label} kf${i}"></div></td>`;
      }
      html += "</tr>";
    });
  });
  html += "</tbody></table></div>";
  return html;
}

/* ---- Tabs ----------------------------------------------------------------- */
function initTabs() {
  document.querySelectorAll("[data-tabs]").forEach((group) => {
    const tabs = group.querySelectorAll(".tab");
    const panes = group.querySelectorAll(".tabpane");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        panes.forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        const pane = group.querySelector(`#${tab.dataset.target}`);
        if (pane) pane.classList.add("active");
      });
    });
  });
}

/* ---- Lightbox ------------------------------------------------------------- */
function initLightbox() {
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = '<img alt="expanded figure">';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector("img");
  document.body.addEventListener("click", (e) => {
    const img = e.target.closest("figure.fig img, table.dgrid td .cell img");
    if (img) {
      lbImg.src = img.currentSrc || img.src;
      lb.classList.add("open");
    }
  });
  lb.addEventListener("click", () => lb.classList.remove("open"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });
}

/* ---- Copy BibTeX ---------------------------------------------------------- */
function initCopy() {
  document.querySelectorAll(".bibtex .copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.parentElement.querySelector("pre").innerText;
      navigator.clipboard.writeText(code).then(() => {
        const t = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = t), 1500);
      });
    });
  });
}

/* ---- Try to load real videos if present ----------------------------------- */
function initVideoSlots() {
  document.querySelectorAll(".video-slot").forEach((slot) => {
    const src = slot.dataset.video;
    if (!src) return;
    const test = document.createElement("video");
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) return;
        const base = src.replace(/\.mp4$/, "");
        slot.style.border = "none";
        slot.style.background = "none";
        slot.style.padding = "0";
        slot.innerHTML =
          `<video controls muted loop playsinline preload="metadata">` +
          `<source src="${base}.webm" type="video/webm">` +
          `<source src="${src}" type="video/mp4"></video>`;
      })
      .catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Object.keys(D2S).forEach((mod) => {
    const el = document.getElementById(`grid-${mod}`);
    if (el) el.innerHTML = buildD2SGrid(mod);
  });
  Object.keys(FIGS).forEach((id) => {
    const el = document.getElementById(`fig-${id}`);
    if (el) el.innerHTML = buildFigGrid(id);
  });
  const nbaEl = document.getElementById("fig-nba_pose");
  if (nbaEl) nbaEl.innerHTML = buildNbaPoseGrid();
  // typeset math (KaTeX auto-render loaded via deferred <script> before this)
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }
  initTabs();
  initLightbox();
  initCopy();
  initVideoSlots();
});
