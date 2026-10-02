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
  return html;
}

const cell = (src, alt) =>
  `<td><div class="cell"><img loading="lazy" decoding="async" src="${src}" alt="${alt}"></div></td>`;

/* wrap N slides in a left/right carousel (one case at a time) */
function carouselWrap(slidesHtml, n) {
  return `<div class="carousel" data-carousel>
    <div class="carousel-nav">
      <button class="cbtn prev" type="button" aria-label="Previous case">&#8249;</button>
      <span class="ccount"><b>1</b> / ${n}</span>
      <button class="cbtn next" type="button" aria-label="Next case">&#8250;</button>
    </div>
    <div class="carousel-slides">${slidesHtml}</div>
  </div>`;
}

/* ---- Reference-conditioned distillation (paper Fig. 3 / Fig. 5) ------------
   Layout mirrors the paper: leftmost column stacks the reference-style
   exemplars (seen only by the teacher), then Naive / PDM / Teacher rows
   across CFG scales. Cases ordered figurine (dog, cat) first, as in Fig. 3.
   Cell path: assets/figures/refcond/s<N>_<method>_cfg<1|1p5|2|2p5>.webp;
   exemplars: ref<N>.webp. NOTE: raw "base" dir = the NAIVE-matching student. */
const REFCOND = {
  cols: ["CFG = 1", "CFG = 1.5", "CFG = 2", "CFG = 2.5"],
  cfgs: ["cfg1", "cfg1p5", "cfg2", "cfg2p5"],
  dir: "assets/figures/refcond",
  samples: [
    { s: 8, refs: [7, 10, 6] }, // dog figurine
    { s: 9, refs: [7, 10, 6] }, // cat figurine
    { s: 0, refs: [1, 3, 5] },  // girl with bicycle (illustration style)
    { s: 2, refs: [1, 3, 5] },  // billiards player (illustration style)
  ],
  rows: [
    { key: "base",    label: "Naive" },
    { key: "pdm",     label: "PDM", ours: true },
    { key: "teacher", label: "Teacher" },
  ],
};

function refcondSlide(sample) {
  const cfg = REFCOND;
  /* paper layout: Ref-style exemplars are the LEFTMOST column, one per row;
     the Naive/PDM/Teacher labels sit between the refs and the CFG outputs.
     Each ref fills its row height (= generated cell height) via object-fit. */
  let h = '<div class="grid-scroll"><table class="dgrid figgrid figgrid-ref"><thead><tr><th class="colhead kf">Ref style</th><th class="rowhead"></th>';
  cfg.cols.forEach((c) => (h += `<th class="colhead">${c}</th>`));
  h += "</tr></thead><tbody>";
  cfg.rows.forEach((r, ri) => {
    h += `<tr class="${r.ours ? "ours" : ""}">`;
    const refN = sample.refs[ri];
    h += `<td class="refcell"><div class="cell tgt"><img loading="lazy" decoding="async" src="${cfg.dir}/ref${refN}.webp" alt="reference-style exemplar"></div></td>`;
    const lbl = r.ours
      ? `<span class="rowlabel-strong">${r.label}<span class="ours-pill">OURS</span></span>`
      : r.label;
    h += `<th class="rowhead">${lbl}</th>`;
    cfg.cfgs.forEach((c) => (h += cell(`${cfg.dir}/s${sample.s}_${r.key}_${c}.webp`, `${r.label} ${c}`)));
    h += "</tr>";
  });
  h += "</tbody></table></div>";
  return h;
}

function buildRefcondGrid() {
  const slides = REFCOND.samples.map((sm) => `<div class="cslide">${refcondSlide(sm)}</div>`).join("");
  return carouselWrap(slides, REFCOND.samples.length);
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

/* one clip's grid: GT + PDM/Naive at γ=1,3,5 over keyframes */
function poseSlide(cfg, clip) {
  let h = '<div class="grid-scroll"><table class="dgrid figgrid"><thead><tr><th class="rowhead"></th>';
  cfg.cols.forEach((c) => (h += `<th class="colhead kf">${c}</th>`));
  h += "</tr></thead><tbody>";
  cfg.rows.forEach((r) => {
    h += `<tr class="${r.ours ? "ours" : ""}">`;
    const inner = r.ours
      ? `<span class="rowlabel-strong">${r.label}<span class="ours-pill">OURS</span></span>`
      : r.label;
    h += `<th class="rowhead">${inner}</th>`;
    for (let i = 0; i < cfg.cols.length; i++) {
      h += cell(`${cfg.dir}/${clip}_${r.key}_kf${i}.webp`, `${r.label} kf${i}`);
    }
    h += "</tr>";
  });
  h += "</tbody></table></div>";
  return h;
}

function buildNbaPoseGrid() {
  const cfg = NBA_POSE;
  const slides = cfg.clips.map((clip) => `<div class="cslide">${poseSlide(cfg, clip)}</div>`).join("");
  return carouselWrap(slides, cfg.clips.length);
}

/* ---- Carousels (one case at a time, left/right nav) ----------------------- */
function initCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((car) => {
    const slides = [...car.querySelectorAll(".cslide")];
    if (!slides.length) return;
    let idx = 0;
    const countEl = car.querySelector(".ccount b");
    const show = (i) => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle("active", j === idx));
      if (countEl) countEl.textContent = idx + 1;
    };
    car.querySelector(".cbtn.prev").addEventListener("click", () => show(idx - 1));
    car.querySelector(".cbtn.next").addEventListener("click", () => show(idx + 1));
    show(0);
  });
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

/* ---- Interactive branch-error curves (wandb-style hover) -------------------
   Data: window.CURVES[setting][method] = { pos: [...], neg: [...] } (index = step),
   loaded from js/curves-data.js. Two synced panels (e+ / e-), setting tabs,
   toggleable series, log-scale toggle, crosshair + value tooltip on hover. */
function initCurveLab() {
  const lab = document.getElementById("curvelab");
  if (!lab || !window.CURVES) return;

  const SERIES = [
    { key: "naive",         label: "Naive OPD",             color: "#d1495b" },
    { key: "positive_only", label: "Positive-only (ℓ₊)", color: "#e8930c" },
    { key: "pdm",           label: "PDM (Ours)",            color: "#14a06e" },
  ];
  const SETTINGS = [
    {
      key: "text_rendering", label: "Text rendering · shared negatives",
      note: "The benign regime: with shared negative conditioning, every objective reduces both branch errors jointly — positive-branch updates also improve the negative branch, and naive composed matching remains effective.",
    },
    {
      key: "reference_conditioned", label: "Reference-conditioned · privileged negatives", default: true,
      note: "The NBA regime: positive-only training reduces the positive error but substantially increases the negative error — positive-branch updates no longer help the negative branch. Naive matching follows the same antagonistic pattern. PDM reduces the positive error while preventing sustained negative-error growth: the optimization signature of NBA.",
    },
  ];

  const W = 560, H = 300, ML = 56, MR = 12, MT = 12, MB = 30;
  const IW = W - ML - MR, IH = H - MT - MB;
  const defaultSetting = SETTINGS.find((s) => s.default) || SETTINGS[0];
  const state = { setting: defaultSetting.key, on: { naive: true, positive_only: true, pdm: true }, log: false };

  /* controls */
  const tabsEl = document.getElementById("clab-settings");
  SETTINGS.forEach((s) => {
    const b = document.createElement("button");
    b.className = "tab" + (s === defaultSetting ? " active" : "");
    b.type = "button";
    b.textContent = s.label;
    b.addEventListener("click", () => {
      tabsEl.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      state.setting = s.key;
      render();
    });
    tabsEl.appendChild(b);
  });
  const chipsEl = document.getElementById("clab-chips");
  SERIES.forEach((s) => {
    const b = document.createElement("button");
    b.className = "clab-chip on";
    b.type = "button";
    b.innerHTML = `<span class="csw" style="background:${s.color}"></span>${s.label}`;
    b.addEventListener("click", () => {
      state.on[s.key] = !state.on[s.key];
      b.classList.toggle("on", state.on[s.key]);
      render();
    });
    chipsEl.appendChild(b);
  });
  const noteEl = document.getElementById("clab-note");
  document.getElementById("clab-log").addEventListener("change", (e) => {
    state.log = e.target.checked;
    render();
  });

  const fmt = (v) =>
    v >= 100 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v >= 0.0095 ? v.toFixed(3) : v.toPrecision(2);

  function niceTicks(lo, hi, count) {
    const span = hi - lo;
    if (!(span > 0)) return [lo];
    const step0 = Math.pow(10, Math.floor(Math.log10(span / count)));
    const err = span / count / step0;
    const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
    const out = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-6; t += step) out.push(t);
    return out;
  }
  function logTicks(lo, hi) {
    let out = [];
    for (let e = Math.floor(lo) - 1; e <= Math.ceil(hi); e++)
      [1, 2, 5].forEach((m) => {
        const t = e + Math.log10(m);
        if (t >= lo - 1e-9 && t <= hi + 1e-9) out.push(t);
      });
    if (out.length > 7) out = out.filter((t) => Math.abs(t - Math.round(t)) < 1e-9 || Math.abs(t - Math.round(t) - Math.log10(5) + 1) < 1e-9);
    if (out.length > 7) out = out.filter((t) => Math.abs(t - Math.round(t)) < 1e-9);
    return out;
  }

  /* panels */
  const panels = [...lab.querySelectorAll(".clab-chart")].map((el) => {
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"></svg><div class="clab-tip" hidden></div>`;
    return { el, branch: el.dataset.branch, svg: el.querySelector("svg"), tip: el.querySelector(".clab-tip"), active: [], n: 0, lo: 0, hi: 1 };
  });

  const tf = (v) => (state.log ? Math.log10(v) : v);
  const px = (i, n) => ML + (IW * i) / Math.max(1, n - 1);
  const py = (v, p) => MT + IH * (1 - (tf(v) - p.lo) / (p.hi - p.lo || 1));

  function render() {
    const data = window.CURVES[state.setting];
    const setting = SETTINGS.find((s) => s.key === state.setting);
    noteEl.textContent = setting.note;
    panels.forEach((p) => {
      const active = SERIES.filter((s) => state.on[s.key] && data[s.key]);
      p.active = active;
      const n = active.length ? Math.max(...active.map((s) => data[s.key][p.branch].length)) : 0;
      p.n = n;
      let lo = Infinity, hi = -Infinity;
      active.forEach((s) =>
        data[s.key][p.branch].forEach((v) => {
          const t = tf(v);
          if (t < lo) lo = t;
          if (t > hi) hi = t;
        })
      );
      if (!active.length) { lo = 0; hi = 1; }
      const pad = (hi - lo || 1) * 0.05;
      p.lo = lo - pad;
      p.hi = hi + pad;

      let g = "";
      /* y grid + labels */
      let yt = state.log ? logTicks(p.lo, p.hi) : niceTicks(p.lo, p.hi, 5);
      if (state.log && yt.length < 3)
        /* narrow log range with no 1/2/5 decade tick inside — use nice linear values at log positions */
        yt = niceTicks(Math.pow(10, p.lo), Math.pow(10, p.hi), 5).filter((v) => v > 0).map(Math.log10);
      yt.forEach((t) => {
        const y = MT + IH * (1 - (t - p.lo) / (p.hi - p.lo || 1));
        const label = fmt(state.log ? Math.pow(10, t) : t);
        g += `<line x1="${ML}" y1="${y.toFixed(1)}" x2="${W - MR}" y2="${y.toFixed(1)}" class="cl-grid"/>`;
        g += `<text x="${ML - 7}" y="${(y + 3).toFixed(1)}" class="cl-ylab">${label}</text>`;
      });
      /* x ticks */
      niceTicks(0, Math.max(1, n - 1), 6).forEach((t) => {
        const x = px(t, n);
        g += `<text x="${x.toFixed(1)}" y="${H - 8}" class="cl-xlab">${Math.round(t)}</text>`;
      });
      g += `<line x1="${ML}" y1="${MT + IH}" x2="${W - MR}" y2="${MT + IH}" class="cl-axis"/>`;
      /* series paths (downsampled for path length, full data kept for hover) */
      active.forEach((s) => {
        const arr = data[s.key][p.branch];
        const stride = Math.max(1, Math.floor(arr.length / 700));
        let d = "";
        for (let i = 0; i < arr.length; i += stride)
          d += `${d ? "L" : "M"}${px(i, n).toFixed(1)} ${py(arr[i], p).toFixed(1)}`;
        const last = arr.length - 1;
        if (last % stride !== 0) d += `L${px(last, n).toFixed(1)} ${py(arr[last], p).toFixed(1)}`;
        g += `<path class="cl-serie" pathLength="1" d="${d}" stroke="${s.color}"/>`;
      });
      /* hover layer */
      g += `<g class="cl-hover" hidden><line y1="${MT}" y2="${MT + IH}" class="cl-cross"/>`;
      active.forEach((s) => (g += `<circle r="3.5" fill="${s.color}" data-k="${s.key}" class="cl-dot"/>`));
      g += `</g>`;
      p.svg.innerHTML = g;
      p.hover = p.svg.querySelector(".cl-hover");
      p.cross = p.svg.querySelector(".cl-cross");
      p.dots = [...p.svg.querySelectorAll(".cl-dot")];
      p.tip.hidden = true;
    });
  }

  /* wandb-style synced crosshair + tooltip */
  let hoverRaf = false, hoverEvt = null, hoverPanel = null;
  function updateHover() {
    hoverRaf = false;
    const data = window.CURVES[state.setting];
    const p0 = hoverPanel;
    if (!p0 || !p0.n) return;
    const rect = p0.el.getBoundingClientRect();
    const sx = W / rect.width;
    const xpx = (hoverEvt.clientX - rect.left) * sx;
    const idx = Math.max(0, Math.min(p0.n - 1, Math.round(((xpx - ML) / IW) * (p0.n - 1))));
    panels.forEach((p) => {
      if (!p.active.length) return;
      const x = px(idx, p.n);
      p.hover.hidden = false;
      p.cross.setAttribute("x1", x.toFixed(1));
      p.cross.setAttribute("x2", x.toFixed(1));
      p.dots.forEach((dot) => {
        const arr = data[dot.dataset.k][p.branch];
        const i = Math.min(idx, arr.length - 1);
        dot.setAttribute("cx", x.toFixed(1));
        dot.setAttribute("cy", py(arr[i], p).toFixed(1));
      });
    });
    /* tooltip only in the hovered panel, listing that panel's values */
    const rows = p0.active
      .map((s) => ({ s, v: data[s.key][p0.branch][Math.min(idx, data[s.key][p0.branch].length - 1)] }))
      .sort((a, b) => b.v - a.v)
      .map(({ s, v }) => `<div class="row"><span class="csw" style="background:${s.color}"></span><span class="lab">${s.label}</span><b>${fmt(v)}</b></div>`)
      .join("");
    p0.tip.innerHTML = `<div class="step">step ${idx}</div>${rows}`;
    p0.tip.hidden = false;
    const tw = p0.tip.offsetWidth;
    let left = hoverEvt.clientX - rect.left + 16;
    if (left + tw > rect.width - 6) left = hoverEvt.clientX - rect.left - tw - 16;
    p0.tip.style.left = Math.max(6, left) + "px";
    p0.tip.style.top = Math.max(6, hoverEvt.clientY - rect.top - 14) + "px";
    panels.forEach((p) => { if (p !== p0) p.tip.hidden = true; });
  }
  panels.forEach((p) => {
    p.el.addEventListener("pointermove", (e) => {
      hoverEvt = e;
      hoverPanel = p;
      if (!hoverRaf) { hoverRaf = true; requestAnimationFrame(updateHover); }
    });
    p.el.addEventListener("pointerleave", () => {
      hoverPanel = null;
      panels.forEach((q) => { if (q.hover) q.hover.hidden = true; q.tip.hidden = true; });
    });
  });

  render();
}

/* ---- Interactive teaser: branch-level under-identification -----------------
   Paper terms throughout: positive / negative branch predictions v+ and v-,
   their CFG composition vt = gamma*v+ + (1-gamma)*v-, the conditional
   direction d = v+ - v- (Eq. 9) and the branch discrepancies e+ , e- (Eq. 4).
   Rewriting the composition as vt = v- + gamma*d puts all three on one axis,
   so the composed discrepancy
     e_cfg = gamma*e+ - (gamma-1)*e-
   can be read off directly. It vanishes along a whole line of non-zero
   (e+, e-) -- Eq. 7 -- which is what leaves composed matching
   under-identified at the branch level. */
function initNbaDemo() {
  const root = document.getElementById("nbademo");
  const svg = document.getElementById("nbasvg");
  if (!root || !svg) return;

  const VBW = 920, X0 = 252, D = 90, YT = 96, YS = 206, LIM = 34;
  const st = { ep: 0, en: 0, g: 5, obj: "naive" };

  const starPts = (x, y, r) => {
    let p = "";
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      p += `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)} `;
    }
    return p.trim();
  };

  /* ---- static scaffold: built once, then only attributes change ---------- */
  let grid = "", ticks = "";
  for (let k = 0; k <= 5; k++) {
    const x = X0 + k * D;
    grid += `<line class="nd-grid" x1="${x}" y1="58" x2="${x}" y2="250"/>`;
    ticks += `<text class="nd-tick" x="${x}" y="48">${k === 0 ? "0" : k === 1 ? "d" : k + "d"}</text>`;
  }
  const row = (id, y, label, drag) => `
    <text class="nd-rowlab" x="128" y="${y + 5}">${label}</text>
    <line class="nd-base" x1="${X0 - 40}" y1="${y}" x2="${VBW - 40}" y2="${y}"/>
    <line class="nd-halo-d" id="${id}-halod" y1="${y}" y2="${y}"/>
    <line class="nd-dir" id="${id}-dir" y1="${y}" y2="${y}"/>
    <line class="nd-reach" id="${id}-reach" y1="${y}" y2="${y}"/>
    <text class="nd-dlab" id="${id}-dlab" y="${y - 13}"></text>
    <circle class="nd-halo-pt" id="${id}-halopos" cy="${y}" r="15"/>
    <circle class="nd-halo-pt" id="${id}-halostar" cy="${y}" r="18"/>
    <polygon class="nd-star" id="${id}-star" points=""/>
    <circle class="nd-neg" id="${id}-neg" cy="${y}" r="7.5"/>
    <circle class="nd-pos" id="${id}-pos" cy="${y}" r="7.5"/>
    <text class="nd-ptlab nd-ptneg" id="${id}-neglab" y="${y + 26}"></text>
    <text class="nd-ptlab nd-ptpos" id="${id}-poslab" y="${y + 26}"></text>
    <text class="nd-ptlab nd-ptstar" id="${id}-starlab" y="${y + 27}"></text>
    ${drag ? `<circle class="nd-hit" id="${id}-neghit" cy="${y}" r="17" tabindex="0" role="slider"
                aria-label="student negative branch prediction" aria-valuemin="-34" aria-valuemax="34" aria-valuenow="0"/>
              <circle class="nd-hit" id="${id}-poshit" cy="${y}" r="17" tabindex="0" role="slider"
                aria-label="student positive branch prediction" aria-valuemin="-34" aria-valuemax="34" aria-valuenow="0"/>` : ""}`;

  svg.innerHTML = `
    <text class="nd-axislab" x="${X0 - 48}" y="48" text-anchor="end">from v&#8315;</text>
    ${grid}${ticks}
    <line class="nd-guide" id="nd-gneg" y1="${YT}" y2="${YS}"/>
    <line class="nd-guide" id="nd-gpos" y1="${YT}" y2="${YS}"/>
    <line class="nd-guide" id="nd-gstar" y1="${YT}" y2="${YS + 30}"/>
    ${row("t", YT, "Teacher", false)}
    ${row("s", YS, "Student", true)}
    <line class="nd-err nd-err-neg" id="nd-eneg" y1="${YS}" y2="${YS}"/>
    <line class="nd-err nd-err-pos" id="nd-epos" y1="${YS}" y2="${YS}"/>
    <text class="nd-errlab nd-ptneg" id="nd-eneglab" y="${YS - 34}"></text>
    <text class="nd-errlab nd-ptpos" id="nd-eposlab" y="${YS - 34}"></text>
    <line class="nd-err nd-err-cfg" id="nd-ecfg" y1="${YS + 30}" y2="${YS + 30}"/>
    <text class="nd-errlab nd-ptstar" id="nd-ecfglab" y="${YS + 46}"></text>
    <rect class="nd-bar nd-bar-pos" id="nd-barpos" y="272" height="14" rx="3"/>
    <rect class="nd-bar nd-bar-neg" id="nd-barneg" y="296" height="14" rx="3"/>
    <text class="nd-bartx" id="nd-barpostx" y="279"></text>
    <text class="nd-bartx" id="nd-barnegtx" y="303"></text>
    <text class="nd-barlab" x="128" y="286" text-anchor="end">composed discrepancy</text>
    <text class="nd-cancel" id="nd-cancel" y="330" text-anchor="middle"></text>`;

  const $ = (id) => svg.querySelector("#" + id);
  const el = {};
  ["t-dir","t-reach","t-star","t-neg","t-pos","t-dlab","t-neglab","t-poslab","t-starlab",
   "t-halod","t-halopos","t-halostar",
   "s-dir","s-reach","s-star","s-neg","s-pos","s-dlab","s-neglab","s-poslab","s-starlab",
   "s-halod","s-halopos","s-halostar","s-neghit","s-poshit",
   "nd-gneg","nd-gpos","nd-gstar","nd-eneg","nd-epos","nd-eneglab","nd-eposlab",
   "nd-ecfg","nd-ecfglab","nd-barpos","nd-barneg","nd-barpostx","nd-barnegtx","nd-cancel"
  ].forEach((k) => (el[k] = $(k)));

  const readout = document.getElementById("nbareadout");
  const status = document.getElementById("nbastatus");
  const objNote = document.getElementById("nbaobjnote");
  const gIn = document.getElementById("nbagamma");
  const gOut = document.getElementById("nbagammaout");
  const fmt = (v) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));
  const setLine = (n, x1, x2) => { n.setAttribute("x1", x1); n.setAttribute("x2", x2); };

  function render() {
    const g = st.g;
    /* teacher is the reference; the student's branches carry the discrepancies.
       e+ = v_T+ - v_S+, so a positive e+ puts the student's v+ to the LEFT. */
    const tNeg = X0, tPos = X0 + D, tStar = X0 + g * D;
    const sNeg = tNeg - st.en, sPos = tPos - st.ep;
    const sStar = sNeg + g * (sPos - sNeg);

    [["t", tNeg, tPos, tStar], ["s", sNeg, sPos, sStar]].forEach(([k, neg, pos, star]) => {
      el[k + "-neg"].setAttribute("cx", neg);
      el[k + "-pos"].setAttribute("cx", pos);
      setLine(el[k + "-dir"], neg, pos);
      setLine(el[k + "-reach"], pos, star);
      el[k + "-star"].setAttribute("points", starPts(star, k === "t" ? YT : YS, 11));
      el[k + "-dlab"].setAttribute("x", (neg + pos) / 2);
      el[k + "-dlab"].textContent = "d";
      el[k + "-neglab"].setAttribute("x", neg); el[k + "-neglab"].textContent = "v⁻";
      el[k + "-poslab"].setAttribute("x", pos); el[k + "-poslab"].textContent = "v⁺";
      el[k + "-starlab"].setAttribute("x", star); el[k + "-starlab"].textContent = "ṽ";
    });
    el["s-neghit"].setAttribute("cx", sNeg);
    el["s-poshit"].setAttribute("cx", sPos);
    el["s-neghit"].setAttribute("aria-valuenow", st.en.toFixed(0));
    el["s-poshit"].setAttribute("aria-valuenow", st.ep.toFixed(0));

    /* guides drop from the teacher's branches so the discrepancies are visible */
    setLine(el["nd-gneg"], tNeg, tNeg);
    setLine(el["nd-gpos"], tPos, tPos);
    setLine(el["nd-gstar"], tStar, tStar);

    /* e+ , e- and the composed discrepancy, drawn on the student's axis */
    const show = (line, lab, a, b, text) => {
      setLine(line, a, b);
      const on = Math.abs(b - a) > 1.5;
      line.classList.toggle("on", on);
      lab.setAttribute("x", (a + b) / 2);
      lab.textContent = on ? text : "";
    };
    show(el["nd-eneg"], el["nd-eneglab"], tNeg, sNeg, `e₋ = ${fmt(Math.abs(st.en) / D)}`);
    show(el["nd-epos"], el["nd-eposlab"], tPos, sPos, `e₊ = ${fmt(Math.abs(st.ep) / D)}`);
    const miss = sStar - tStar;
    show(el["nd-ecfg"], el["nd-ecfglab"], tStar, sStar,
         `composed discrepancy = ${fmt(Math.abs(miss) / D)}`);
    el["s-star"].classList.toggle("bad", Math.abs(miss) > 1.5);

    /* the composed discrepancy decomposed: gamma*e+ against (gamma-1)*e- */
    const ep = st.ep / D, en = st.en / D;
    const push = -ep * D * g, pull = en * D * (g - 1);
    const bar = (r, t, len, label) => {
      r.setAttribute("x", len >= 0 ? tStar : tStar + len);
      r.setAttribute("width", Math.max(Math.abs(len), 0.5));
      const end = tStar + len;
      t.setAttribute("x", len >= 0 ? end + 8 : end - 8);
      t.setAttribute("text-anchor", len >= 0 ? "start" : "end");
      t.textContent = Math.abs(len) < 1 ? "" : label;
    };
    bar(el["nd-barpos"], el["nd-barpostx"], push, `γ·e₊ = ${fmt(Math.abs(g * ep))}`);
    bar(el["nd-barneg"], el["nd-barnegtx"], pull, `(γ−1)·e₋ = ${fmt(Math.abs((g - 1) * en))}`);
    const cancelling = Math.abs(push) > 6 && Math.abs(miss) <= 1.5;
    el["nd-cancel"].setAttribute("x", tStar);
    el["nd-cancel"].textContent = cancelling ? "equal and opposite → they cancel" : "";

    /* what the selected objective actually constrains */
    const pdm = st.obj === "pdm";
    el["s-halostar"].setAttribute("cx", sStar);
    el["s-halopos"].setAttribute("cx", sPos);
    setLine(el["s-halod"], sNeg, sPos);
    el["s-halostar"].classList.toggle("on", !pdm);
    el["s-halopos"].classList.toggle("on", pdm);
    el["s-halod"].classList.toggle("on", pdm);
    el["t-halostar"].setAttribute("cx", tStar);
    el["t-halostar"].classList.remove("on");
    el["t-halopos"].setAttribute("cx", tPos);
    el["t-halopos"].classList.toggle("on", pdm);
    setLine(el["t-halod"], tNeg, tPos);
    el["t-halod"].classList.toggle("on", pdm);
    objNote.innerHTML = pdm
      ? "the positive prediction v<sup>+</sup> <i>and</i> the conditional direction d — separately"
      : "the CFG-composed prediction ṽ only";

    /* losses, in units of d */
    const naiveL = Math.pow(g * ep - (g - 1) * en, 2);
    const pdmL = ep * ep + Math.pow(ep - en, 2);
    const wrong = Math.abs(ep) > 0.02 || Math.abs(en) > 0.02;
    const card = (lab, val, cls, active) =>
      `<div class="nd-stat ${cls}${active ? " active" : ""}"><span>${lab}</span><b>${fmt(val)}</b></div>`;
    readout.innerHTML =
      card("branch discrepancy e&#8330;", Math.abs(ep), "e-pos", false) +
      card("branch discrepancy e&#8331;", Math.abs(en), "e-neg", false) +
      card("naive loss &#8467;<sub>naive</sub>", naiveL, naiveL < 0.0025 ? "zero" : "nonzero", !pdm) +
      card("PDM loss &#8467;<sub>PDM</sub> (&lambda;=1)", pdmL, pdmL < 0.0025 ? "zero" : "nonzero", pdm);

    let cls = "ok", msg = "";
    if (!wrong) {
      msg = "<b>Both branches match.</b> Every objective is at zero — nothing to tell apart.";
    } else if (naiveL < 0.0025) {
      cls = "bad";
      msg = "<b>Both branch predictions are wrong, yet &#8467;<sub>naive</sub> is 0.</b> " +
            "γ·e₊ and (γ−1)·e₋ are equal and opposite, so they cancel in the " +
            "composition — this is the line of solutions in Eq.&nbsp;7, and it is why composed matching is " +
            "under-identified at the branch level. &#8467;<sub>PDM</sub> stays positive. Move γ and the " +
            "weights change, so the cancellation breaks.";
    } else {
      cls = "warn";
      msg = `<b>The composed prediction misses.</b> &#8467;<sub>naive</sub> = ${fmt(naiveL)} — but it is one ` +
            "scalar constraint on two unknowns, so another (e₊, e₋) pair would drive it back to 0.";
    }
    status.className = "tdemo-status " + cls;
    status.innerHTML = msg;
  }

  /* ---- interaction ------------------------------------------------------- */
  const clamp = (v) => Math.max(-LIM, Math.min(LIM, v));
  let raf = false;
  const draw = () => { if (!raf) { raf = true; requestAnimationFrame(() => { raf = false; render(); }); } };

  function attach(hit, key) {
    hit.addEventListener("pointerdown", (e) => {
      hit.setPointerCapture(e.pointerId);
      const scale = VBW / svg.getBoundingClientRect().width;
      const x0 = e.clientX, v0 = st[key];
      root.classList.add("dragging");
      const move = (ev) => { st[key] = clamp(v0 - (ev.clientX - x0) * scale); draw(); };
      const up = (ev) => {
        hit.releasePointerCapture(ev.pointerId);
        hit.removeEventListener("pointermove", move);
        hit.removeEventListener("pointerup", up);
        hit.removeEventListener("pointercancel", up);
        root.classList.remove("dragging");
      };
      hit.addEventListener("pointermove", move);
      hit.addEventListener("pointerup", up);
      hit.addEventListener("pointercancel", up);
      e.preventDefault();
    });
    hit.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 8 : 2;
      if (e.key === "ArrowLeft") st[key] = clamp(st[key] + step);
      else if (e.key === "ArrowRight") st[key] = clamp(st[key] - step);
      else if (e.key === "Home") st[key] = 0;
      else return;
      e.preventDefault();
      draw();
    });
  }
  attach(el["s-poshit"], "ep");
  attach(el["s-neghit"], "en");

  gIn.addEventListener("input", () => { st.g = parseFloat(gIn.value); gOut.textContent = gIn.value; draw(); });

  document.getElementById("nbaobj").querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      st.obj = b.dataset.obj;
      b.parentElement.querySelectorAll("button").forEach((o) => o.classList.toggle("on", o === b));
      draw();
    });
  });

  root.querySelectorAll(".tdemo-presets button").forEach((b) => {
    b.addEventListener("click", () => {
      const p = b.dataset.preset;
      if (p === "perfect") { st.ep = 0; st.en = 0; }
      else if (p === "pos") { st.ep = 24; st.en = 0; }
      else if (p === "cancel") {
        /* Eq. 7: e+ = ((gamma-1)/gamma) * e- . At gamma = 1 the composition is
           v+ itself, so e- is unconstrained outright -- show that instead. */
        if (st.g <= 1) { st.ep = 0; st.en = 30; }
        else { st.en = clamp(30); st.ep = (st.en * (st.g - 1)) / st.g; }
      }
      root.querySelectorAll(".tdemo-presets button").forEach((o) => o.classList.toggle("on", o === b));
      draw();
    });
  });

  render();
}

/* ---- Scroll progress bar (rAF-throttled) ---------------------------------- */
function initProgress() {
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

/* ---- Floating dot navigation ---------------------------------------------- */
function initDotNav() {
  const secs = [...document.querySelectorAll("section")].filter((s) => s.querySelector("h2.sec"));
  if (secs.length < 3 || !("IntersectionObserver" in window)) return;
  const nav = document.createElement("nav");
  nav.className = "dotnav";
  nav.setAttribute("aria-label", "Section navigation");
  secs.forEach((s, i) => {
    if (!s.id) s.id = "sec-" + i;
    const label = s.querySelector("h2.sec").textContent.trim();
    const a = document.createElement("a");
    a.className = "dot";
    a.href = "#" + s.id;
    a.setAttribute("aria-label", label);
    a.innerHTML = `<span class="dot-label">${label}</span>`;
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
  const dots = [...nav.querySelectorAll(".dot")];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const href = "#" + e.target.id;
        dots.forEach((d) => d.classList.toggle("active", d.getAttribute("href") === href));
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );
  secs.forEach((s) => io.observe(s));
}

/* ---- Scroll-reveal sections (progressive enhancement) --------------------- */
function initReveal() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("has-reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll("section").forEach((s) => io.observe(s));
}

document.addEventListener("DOMContentLoaded", () => {
  Object.keys(D2S).forEach((mod) => {
    const el = document.getElementById(`grid-${mod}`);
    if (el) el.innerHTML = buildD2SGrid(mod);
  });
  const nbaEl = document.getElementById("fig-nba_pose");
  if (nbaEl) nbaEl.innerHTML = buildNbaPoseGrid();
  const rcEl = document.getElementById("fig-refcond");
  if (rcEl) rcEl.innerHTML = buildRefcondGrid();
  initCurveLab();
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
  initNbaDemo();
  initCarousels();
  initTabs();
  initLightbox();
  initCopy();
  initProgress();
  initReveal();
  initDotNav();
});
