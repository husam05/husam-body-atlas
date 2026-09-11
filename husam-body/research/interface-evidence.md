## Interface and motion design

The visual direction gives the human body the largest and earliest useful area of the screen. Anatomy 3D Atlas provides a relevant interaction reference: rotation, zoom, selection, isolation, pins, layers, centering, and transparency all support deliberate inspection of anatomy. Its light page surroundings and dark anatomical imagery inform the atlas’s white, gray, charcoal, and orange palette.[^d1] The Mozaweb male-body scene contributes a clear separation of skin, skeletal muscles, skeleton, and organ systems.[^d2] These are references for presentation and navigation; the local atlas retains its own schematic geometry and clinical annotations.

### Layout and readable evidence

The principal layout decision is a compact patient header followed by one finding selector and the viewer. A 320 px finding panel accompanies the viewer at widths of 1100 px and above. Smaller layouts place a concise finding summary beneath the viewer, with complete detail available in a dialog. The summary retains the selected organ, evidence category, source, and relevant uncertainty so the shorter layout does not remove the context needed to interpret the anatomy.

Scene controls belong above the canvas; camera manipulation belongs below it. General body layers appear only in Whole body mode. The selected finding receives a full annotation while other findings use compact selectable pins. An explicit option reveals all labels. This makes the initial view quieter while preserving access to the same information. Pin positions remain attached to their anatomical anchors; visual spacing must not change a finding’s implied location.

The chosen reading sizes are 16 px for English clinical text and 18 px for Arabic clinical text. Important controls have a 44 px activation target. These are product decisions, not claimed WCAG font-size requirements or a statement of full conformance. Arabic changes document language, reading order, and control alignment without reflecting the anatomical model. Latin classifications and measurements need isolated left-to-right spans. W3C distinguishes language from direction and recommends declaring direction in HTML.[^d3]

### Controlled movement

Camera presets and organ focus use a 600 ms transition around the target. An orbital route between front and back maintains an exterior view; straight interpolation across opposite camera positions can cross the body. Button zoom uses 180 ms. Finding-panel changes use 180 ms, and scene crossfades use 220 ms. These durations are implementation choices for a brief, legible response; the sources do not establish them as medically or experimentally optimal.

A new selection replaces an unfinished transition. Direct dragging and keyboard movement interrupt camera animation. Expanding the viewer preserves its orientation. During a scene crossfade, labels wait until the new scene is available, preventing a caption for one view from appearing over another. The canvas remains mounted during selections and keyboard focus stays with the active control. These behaviors protect continuity when someone explores several findings quickly.

Reduced-motion preferences apply immediately, including when the operating-system preference changes while the atlas is open. Active transitions finish, automatic movement stops, and static explanatory content remains accessible. Manual camera controls continue to work. W3C’s Animation from Interactions criterion addresses disabling nonessential interaction-triggered motion; its discussion describes potential discomfort from movement. This is a rationale for offering a stable view, not a claim that the full application has undergone a conformance assessment.[^d4]

### Rendering and interpretive limits

The renderer requests frames when state, camera position, layout, or visible effects change, and continues while damping or a deliberate animation requires them. It stops when the view settles. Three.js documents this event-driven approach and the need to coalesce requests when controls with damping produce further change events.[^d5] The practical aim is to avoid unnecessary work while a person reads a stationary finding. No battery-life or hardware-performance improvement is quantified here.

Shell opacity changes are separate from presentation selection; annotation measurements are cached between relevant layout changes. Together with a persistent canvas, these decisions reduce repeated work during ordinary navigation. They do not increase the resolution, accuracy, or clinical validation of the underlying anatomy or CT surfaces.

All transitions represent interface navigation. They do not portray tumor shrinkage, progression, postoperative clearance, measured urine flow, or changes in organ efficiency. Natural tissue colors and additional body layers remain educational context. The dated evidence and specimen qualifiers described below remain the basis for the clinical text.

### Before and after

The earlier desktop preview shows the larger introductory region and repeated navigation that competed with the anatomy. The enhanced previews document the compact header, viewer emphasis, mobile summary, and Arabic reading order. These screenshots are local interface records, not new medical evidence.[^d6]

| Aspect | Earlier interface | Enhanced interface |
|---|---|---|
| First anatomy view | Viewer began about 383 px from the top at 1440 × 900 and 457 px at 320 × 900. | Viewer begins at 202.8 px at 1440 px width and 242.8 px at 320 px width, both in English. |
| Navigation | Finding selection repeated in separate regions. | One finding selector; full detail beside the viewer or in a dialog. |
| Readability | Some compact mobile labels were below 10 px. | Clinical text at 16 px English / 18 px Arabic; essential context remains readable. |
| Camera continuity | Opposite presets could interpolate across the body. | Exterior orbital route with immediate interruption. |
| Static viewing | Frames continued while the image was idle. | Rendering settles when no visible change is needed. |
| Keyboard continuity | Replacing the interface could discard focused controls. | Canvas and control focus survive selection updates. |

The English 390 px layout begins the viewer at 235.2 px; the Arabic 320 px and 390 px layouts begin it at 250.2 px. All nine recorded layouts have no page overflow and no tested primary controls below the 44 px target. These are local CSS-pixel measurements at specified viewport sizes, not cross-device performance measurements.

The [interface regression results](../tests/interface-results.json) record 15 passed groups covering focus continuity, orbital camera travel and interruption, stable scene changes, expanded-view orientation, idle rendering, dynamic reduced motion, mobile detail access, printing, and offline operation without browser errors or remote requests. The paired previews document appearance; these targeted checks do not establish full accessibility conformance or clinical validation.

<figure class="comparison"><div class="comparison-pair"><div><img src="before-desktop.png" alt="Earlier atlas desktop interface with a large introductory region and anatomy viewer lower on the page"><p>Earlier desktop interface</p></div><div><img src="../preview-enhanced-desktop.png" alt="Enhanced desktop atlas with compact header, prominent anatomy viewer, and adjacent finding details"><p>Enhanced desktop interface</p></div></div><figcaption>Figure 1. Local interface comparison. Both views use illustrative anatomy; neither is an organ segmentation.</figcaption></figure>

The [phone preview](../preview-enhanced-mobile.png), [Arabic preview](../preview-enhanced-arabic.png), and [expanded-view preview](../preview-enhanced-immersive.png) provide full-size records of the corresponding layouts.

## Interface sources

The public sources below describe visual references or general implementation and accessibility principles. They do not supply patient-specific diagnoses. Accessed 11 September 2026.

1. Catfish Animation Studio. [Anatomy 3D Atlas](https://anatomy3datlas.com/). Public home page and feature descriptions. Undated.
2. Mozaik Education. [Human body (male) — 3D scene](https://www.mozaweb.com/Extra-3D_scenes-Human_body_male-4022). Public scene listing and layer descriptions. Undated.
3. W3C Internationalization. [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir). Current guidance.
4. W3C WAI. [Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). WCAG 2.2 explanatory guidance.
5. Three.js. [Rendering on Demand](https://threejs.org/manual/en/rendering-on-demand.html). Current manual.
6. Local interface records. [Earlier desktop](before-desktop.png), [enhanced desktop](../preview-enhanced-desktop.png), [phone](../preview-enhanced-mobile.png), [Arabic](../preview-enhanced-arabic.png), and [expanded view](../preview-enhanced-immersive.png). Private project files.

[^d1]: Catfish Animation Studio, [Anatomy 3D Atlas](https://anatomy3datlas.com/), public home page and feature descriptions, undated.
[^d2]: Mozaik Education, [Human body (male) — 3D scene](https://www.mozaweb.com/Extra-3D_scenes-Human_body_male-4022), public scene listing and layer descriptions, undated.
[^d3]: W3C Internationalization, [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir), current guidance.
[^d4]: W3C WAI, [Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), WCAG 2.2 explanatory guidance.
[^d5]: Three.js, [Rendering on Demand](https://threejs.org/manual/en/rendering-on-demand.html), current manual.
[^d6]: Local interface records: [earlier desktop](before-desktop.png), [enhanced desktop](../preview-enhanced-desktop.png), [enhanced phone](../preview-enhanced-mobile.png), [enhanced Arabic](../preview-enhanced-arabic.png), and [enhanced expanded view](../preview-enhanced-immersive.png). Kept within the local project; no private report or CT upload is needed.
