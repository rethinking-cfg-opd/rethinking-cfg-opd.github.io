# Rethinking Classifier-Free Guidance in On-Policy Diffusion Distillation — Project Page

Static project homepage (HTML/CSS/JS, no build step). Deployable as-is to GitHub Pages.

## Structure

```
index.html                 # the page
css/style.css              # styles
js/main.js                 # builds result grids, tabs, lightbox, copy-BibTeX
assets/
  paper.pdf                # web-optimized paper (3 MB; original archived in source/)
  figures/
    teaser.webp            # Fig. 1 teaser  (replace with your own PNG anytime)
    d2s/                   # dense-to-sparse cells extracted from the Keynotes
      pose/  depth/  scribble/   # <rowkey>_c<col>.webp  (method × frame)
source/                    # NON-deployed: original 55 MB PDF, extraction scripts,
                           # unzipped cells. Git-ignored — keep out of the repo.
```

## What is real vs. placeholder

| Section | State |
|---|---|
| Hero, abstract, key idea, quantitative tables | ✅ Final (numbers from Table 1 of the paper) |
| Teaser (Fig. 1) | ✅ Hand-built HTML/SVG diagram (no image) — edit in `index.html` teaser section |
| Dense-to-sparse grids (pose / depth / scribble) | ✅ Real frames, reconstructed cell-by-cell from the Keynote source |
| VKD (Concept identity + Rendering style) | ✅ **Tabbed carousels**, one case at a time. Columns are the real CFG scales g1/g1p5/g2 → **1 / 1.5 / 2** (+ Target); cells `s<NN>_<ours|naive>_<cfg1\|cfg1p5\|cfg2>.webp`. Cases: `FIGS.*.samples` in `js/main.js`. Tab labels: `<button data-target>` text in `index.html` |
| Pose NBA (video) | ✅ Carousel of clips — GT (skeleton) + PDM/Naive at γ=1, 3, 5 over 4 keyframes. Shown clips: `NBA_POSE.clips` in `js/main.js` (all 5 on disk: 0014, 0028, 0216, 0571, 0591) |

Header buttons are **arXiv · Code · Hugging Face · BibTeX** (all `disabled`/placeholder except BibTeX);
add real URLs in `index.html` and remove the `disabled` class + `(soon)` tag.
`assets/figures/teaser.webp` is kept only as the social-share `og:image`.

## Filling in the placeholders

**Teaser** — it's now a live HTML/SVG diagram in the `<!-- TEASER -->` section of `index.html`
(edit text/vectors there). If you'd rather use your `assets/ori_figures/teaser.pdf` export instead,
replace that whole `<div class="teaser">…</div>` with `<img src="assets/figures/teaser.webp">`.

**Result grids** — all real. Each grid is data-driven from `js/main.js`
(`D2S`, `FIGS`, `NBA_POSE`): edit the `samples` / `clips` arrays to add or drop
cases, or the `cols` / `rows` to change labels. Cell images live under `assets/figures/`.


## Deploy to GitHub Pages

```bash
cd OPD_website
git init && git add . && git commit -m "Project page"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```
Then in the repo: **Settings → Pages → Build and deployment → Source: Deploy from a
branch → `main` / `root`**. The site appears at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so folders like `assets/figures/d2s` are served untouched.

## Regenerating the dense-to-sparse cells

Scripts live in `source/` (needs `imagemagick`, `cwebp`, and the `.key` files unzipped
under `/tmp/kd`):
```bash
python3 source/extract_cells.py         # copies cells -> source/cells/<mod>/
# then convert to webp (see the loop used in setup)
```
