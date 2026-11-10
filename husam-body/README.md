# Husam · Body Atlas

[Open the live atlas](https://husam05.github.io/husam-body-atlas/Husam-3D.html) in a modern browser. For offline use, open **index.html** in Chrome or Edge, or open **Husam-3D.html** in the parent folder. No server, installation, or internet connection is needed to use the atlas. Keep the `assets` folder beside it and the original PDFs in the parent folder for report links.

## Explore the body

- Select a finding once in the organ selector. The viewer shows its label and compact pins for the other findings; **All labels** reveals the remaining annotations.
- Switch among **Whole body**, **Urinary focus**, and **Bladder layers**. Whole body includes natural-color organs, muscles, skeleton, and opaque skin. Selecting a report finding restores the organ presentation.
- Drag to rotate and scroll or pinch to zoom. Camera buttons and keyboard controls provide direct alternatives. Preset and focus changes travel around the body; direct input interrupts a transition.
- Start the seven-step **Guided tour** to connect the earlier bladder CT findings, later tissue result, kidney, liver uncertainty, the chest CT review, the secondary hip observation, and the latest events: the pT1 pathology review and the 6 October re-TURBT.
- Expand the viewer without losing its orientation. Press Escape to exit expanded viewing.
- Read the selected finding beside the viewer on desktop. On smaller screens, use the summary beneath the viewer and open its complete details in a dialog.
- Choose the explanation control for the schematic effect. Motion remains optional; reduced-motion preferences apply immediately, and the renderer settles when the view is idle.
- Use **Reports · 8** for the searchable report library. Filter by study type or organ, read English/Arabic findings, browse the original MRI/chest CT image galleries, the photographed discharge papers and the supplied operative video, and locate the linked organ in the body. Each record preserves its date and evidence type.
- Select **Chest focus** to explore illustrative lungs and central airways linked to the preliminary chest CT review. No lung lesion is drawn.
- Use **CT study** to explore surfaces reconstructed from the actual scan and 12 sampled original axial images.
- Switch between English and Arabic. **Save image** exports a PNG with medical context; the printer button prints the current view.

The full-body model is procedural educational anatomy, not a segmentation of Husam's organs. Skin, muscle, and skeletal layers are schematic general anatomy. The separate CT reconstruction covers the lower chest through the upper thighs only. Its body and dense-tissue surfaces come from density thresholds; they are not clinical organ or tumor segmentations.

The enlarged bladder cutaway uses conceptual wall layers and symbolic growths drawn inside the lumen; it is not a reconstruction of the histology, and it does not draw the lamina propria invasion (pT1) that the 15 September review reports. Select the lining, supporting tissue, or muscle through its label, layer button, or visible model surface.

## Source chronology

| Source | Date | Use |
|---|---|---|
| `Study0908095422986.zip` | CT 2 September 2026 | Actual partial-body CT surfaces and sampled slices; selected series 2, 98 images |
| `report.pdf`, pages 1–2 | Report 3 September 2026 | Two pre-TURBT bladder masses, kidney measurements/excretion, indeterminate small liver findings |
| `حسام صلاح مهدي.pdf`, page 1 | Tissue collected 5 September; report 9 September 2026 | Low-grade inverted urothelial carcinoma, reported pTa / G1; no lamina propria invasion identified; muscle present and tumor-free in examined sample |
| `مراجعة_عربية_لدراسة_البطن_والحوض.pdf`, page 1 | Secondary study review; issue date not documented | Left hip degenerative changes, attributed to the secondary review and requiring specialist confirmation |
| `assets/reports/chest-ct-en-ar.pdf` | CT 13 September; AI review 14 September 2026 | Preliminary chest observations; no confidently identified lung nodule. Does not exclude subtle disease or pulmonary embolism. |
| `assets/reports/liver-mri-en-ar.pdf` | MRI and AI review 14 September 2026 | Tiny unconfirmed right-liver review point; cyst is possible but unconfirmed. No definitive characterization of all previous liver foci. |
| `assets/reports/bladder-pathology-review.pdf` | Received 13 September; review issued 15 September 2026 | Specialist review of the same TURBT tissue: papillary urothelial carcinoma, low grade, invading the lamina propria — **pT1** (AJCC 8th). Muscle present and tumor-free; no lymphovascular or perineural invasion. Revises the 9 September pTa reading. |
| `assets/reports/re-turbt-discharge.pdf` + `re-turbt-discharge-01…04.jpg` | Admission 5 October; surgery and discharge 6 October 2026 | Re-TURBT after the pT1 review. Low-grade urothelial tumor on the discharge summary; unremarkable discharge examination; paracetamol only; follow-up visit 13 October 2026. As of 10 November the family reports the second specimen's result as unchanged (pT1); its written report is pending. |
| `assets/reports/re-turbt-video.mp4` | Supplied with the 6 October records | Phone recording of the endoscopy monitor during a transurethral resection (5 min 25 s). No embedded date or identity; not a complete record of the operation. |
| `assets/reports/bladder-guide-ar-full.pdf` (+ three one-page PDFs) | Prepared 9 October 2026 | AI-assisted Arabic educational guide linking the pT1 review and re-TURBT to EAU/AUA/NCCN/NICE 2026 guidance. Educational only; not a medical recommendation. |

The model's bladder masses show the earlier CT description. These records do not establish whether any tumor remains now, complete removal, microscopic spread, or an overall cancer stage. The liver findings remain indeterminate. Potential symptoms are general educational explanations, not symptoms confirmed in Husam. Kidney, liver, and whole-body efficiency percentages cannot be calculated from these records.

The new reports are preliminary educational AI reviews, not signed radiology reports. Their complete bilingual PDFs and HTML, two overview figures and twelve selected original CT/MRI slices are available in `assets/reports/`. The 3D lungs are generic anatomy, not segmented from these scans. No raw new DICOM study is included.

## Visual and research files

| File | Content |
|---|---|
| `preview-enhanced-desktop.png` | Compact desktop interface and anatomy viewer |
| `preview-enhanced-mobile.png` | Enhanced phone layout |
| `preview-enhanced-arabic.png` | Arabic interface and reading order |
| `preview-enhanced-immersive.png` | Expanded anatomy view |
| `Husam-3D-body.png` | Exported body image with source context |
| `Husam-3D-bladder-layers.png` | Exported conceptual cutaway with specimen limitations |
| `preview-ct.png` | CT reconstruction and sampled image preview |
| `research/design-evidence.pdf` | Cited medical, visualization, interface, and motion rationale |
| `research/index.html` | Linked, readable version of the research |
| `research/before-desktop.png` | Preserved desktop baseline for the research comparison |

The repository includes the current previews. Historical artwork, earlier previews, temporary files, and third-party reference captures remain outside version control.

The visual direction follows [Anatomy 3D Atlas](https://anatomy3datlas.com/) and the public [Mozaweb male human body scene](https://www.mozaweb.com/Extra-3D_scenes-Human_body_male-4022): a light interface, orange selection controls, dark anatomy stage, natural tissue colors, and clearly selectable body layers. The atlas uses its original procedural models. All application fonts and assets are local.

## Rebuild and verification

Node.js 20+ is needed only to edit and rebuild:

```sh
npm ci
npm run build
npm test
```

The browser checks use `/usr/bin/google-chrome` by default; set `CHROME_PATH` to another installed Chrome or Chromium executable if needed. Paths are relative to the checkout. The existing suites cover offline startup, WebGL rendering, separate anatomy/CT views, organ selection, effects, laterality, transparency, image export, source links, Arabic, narrow layouts, the bladder cutaway, and anatomy navigation. Running the checks generates local results in `tests/results.json`, `tests/enhancement-results.json`, and `tests/studio-results.json`; these logs are excluded from version control. The selected `tests/interface-results.json` validation snapshot is included because the research document links to it.

The interface regression suite adds viewer placement, readable text, focus continuity, interrupted camera motion, orbital front/back paths, expanded-view orientation, scene changes, reactive reduced motion, and idle rendering. Its result is `tests/interface-results.json` (15 grouped checks passed for this edition). The previous five-suite `npm test` run passed, including motion unit checks and the existing atlas, cutaway, and anatomy-navigation regressions. Previews illustrate layout; automated checks do not constitute a complete accessibility or medical validation.

Run `npm run research` to rebuild the research HTML and combined Markdown. After the four enhanced previews exist, run `npm run research -- --pdf` to generate the A4 PDF and report preview using local Chrome. The PDF build checks that its comparison images loaded.

To reproduce CT assets, run `python scripts/build_ct_assets.py` from this folder. This requires the original archive in the parent folder and the Python packages listed in the script. The large raw archive is excluded from Git; the generated CT assets are included. Detailed source mapping, physical axes, thresholds, and processing limitations are recorded in `assets/ct/metadata.json`. Both `.glb` meshes are included for reuse.

Medical reference links are available inside **Reports & context**. The offline copy makes no network requests. The hosted version downloads the application and its assets from the website; the viewer does not upload files. Opening an external reference is a separate browser navigation. The public repository and hosted website also include the reports and generated CT assets.

## September 14 report-library update

The standard `npm test` command now includes anatomy-search and report-library integration checks. The added coverage verifies the report files and figures, bilingual search, evidence filters, image enlargement, report-to-body links, and Arabic/English layouts from 320 to 1440 pixels. The [design rationale](research/atlas-design-2026.html) links the public atlas references used for this update.

## November 10 update: pT1 review, re-TURBT and operative video

Three records were added, bringing the library to eight records and nineteen figures:

- **Pathology review (issued 15 September 2026)** — a second specialist reading of the same TURBT tissue at Warith International Cancer Institute: papillary urothelial carcinoma, low grade, invading the lamina propria (**pT1**, AJCC 8th edition). Muscle present and tumor-free; no lymphovascular or perineural invasion. This revises the 9 September pTa reading, and the bladder finding, wall-layer texts, timeline and exported-image captions now follow the review.
- **Re-TURBT surgery and discharge (6 October 2026)** — the photographed four-page hospital discharge summary (also combined into `re-turbt-discharge.pdf`), with the supplied operative video (`re-turbt-video.mp4`, a 5 min 25 s phone recording of the endoscopy monitor), its poster frame and a twelve-frame contact sheet. The next recorded outpatient visit was 13 October 2026.
- **Arabic patient guide (9 October 2026)** — an AI-assisted educational summary in Arabic (full report plus three one-page PDFs) linking the case to EAU, AUA/SUO, NCCN and NICE 2026 guidance. Educational only.

The report library now renders an operative-video section (`video` field) and additional per-record document links (`documents` field). The guided tour gained a seventh step covering the latest events.

**Later the same day**: the family reported the second specimen's pathology as the same classification — **pT1**. The atlas presents this as a reported result, clearly distinguished from the signed documents; the written report of the 6 October resection is the next document to add. In international guidance, invasive tumor still present at a second resection is a higher-risk feature, so the finding and surgery texts note that the risk group and any intravesical therapy are for the treating team to set once the written report is available.
