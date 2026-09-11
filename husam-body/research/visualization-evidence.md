# Evidence for a credible, accessible 3D health atlas

A stronger atlas should make anatomy easier to explore while making the origin, date, and limits of each statement easier to recognize. Its principal improvement should be a clear connection between an organ, a written finding, and its source. More realistic lighting can improve appearance; it does not establish that a displayed lesion was segmented from this patient’s images.

The existing local assets support two complementary experiences: a complete schematic human body and a CT-derived reconstruction of the scanned region. The reconstruction uses 98 axial images, 0.7265625 mm in-plane spacing, 5 mm between slice centers, and 485 mm between the first and last image centers. Twelve JPEG previews sample that series. These are properties of the supplied assets, not measures of organ performance.[^1]

## 1. Make evidence visible at the point of interpretation

**Priority: immediate.** Give each finding a persistent text badge identifying its basis: “Pathology report,” “CT report,” or “Secondary review.” Add the document date and a short statement of what remains unresolved. Pair each badge with a distinct shape or icon. The recommended vocabulary is an editorial design judgment; the requirement to communicate meaningful distinctions through more than color is supported by WCAG 2.2.[^2]

Keep evidence source and certainty as separate fields. A pathology result describes examined tissue; a CT description describes an imaging observation; a secondary review has a different provenance. Collapsing these categories into an unlabeled green-to-red scale would hide those differences. “Not established from these records” should appear as ordinary readable content where needed. Do not invent confidence percentages or body-efficiency gauges.

Place the study timeline beside the findings. Use explicit dated statements when earlier imaging and later tissue findings coexist. Selecting a timeline event may highlight its associated text, but should not morph a tumor into a smaller or absent tumor unless a source establishes that change. Label schematic markers as schematic in the viewer itself. A source drawer should show filename, relevant page or section, and whether the statement is quoted, summarized, or explanatory.

## 2. Preserve the boundary between surface extraction and anatomy

**Priority: immediate.** Retain the label “Dense tissue surface” for the CT layer extracted above 300 HU. In 3D Slicer, thresholding selects voxels by intensity; other editing tools refine regions. Its documentation explains that smoothing can remove details, fill gaps, or shrink a segment. Consequently, the present threshold, component filtering, filling, smoothing, and mesh reduction should remain visible in provenance. They do not establish a clinician-reviewed segmentation of bone, organs, or tumors.[^3]

DICOM represents segmentation as derived data and provides attributes describing the segment and the algorithm used to generate it. This is a useful model for the atlas’s provenance record, although the current GLB files are not DICOM segmentation objects. Do not describe them as DICOM SEG exports or imply clinical validation from their file format.[^4]

Show a short CT summary directly beneath the viewer: selected series, acquisition date, image count, slice interval, coverage, and surface method. Keep the detailed metadata link for technical inspection. A coverage indicator on the schematic body may identify the approximate scanned region, provided it is explicitly an overview and does not suggest exact registration between the two models.

## 3. Make orientation and slice correspondence dependable

**Priority: immediate.** DICOM defines image position, orientation, and pixel spacing in patient coordinates. For a human, increasing coordinates point toward patient left, posterior, and head. Slice thickness and spacing between image centers are distinct attributes. Series names and instance numbers are insufficient substitutes for these geometric fields.[^5]

The assets already record a centered coordinate transform with positive X toward patient left, positive Y toward the head, and positive Z toward the front. Preserve that transform when adding camera presets, clipping, or slice markers. Show a camera-linked orientation indicator rather than fixed screen-edge letters that become misleading after arbitrary rotation.

Add previous/next preview buttons and an explicit “sample 7 of 12” indicator. Keep the source instance and window settings nearby. The linked plane should reflect the preview’s stored physical position. A future full slice browser should use the source pixels; changing the brightness of an already windowed JPEG cannot recover clipped source values. DICOM defines the stored-pixel rescale operation separately from subsequent display transformations.[^6]

## 4. Improve legibility before adding visual complexity

The color ratios in this section describe the original stylesheet audit. They identify earlier design weaknesses and are not measurements of the enhanced interface. The interface section above describes the current reading-size and layout decisions.

**Priority: immediate.** WCAG requires at least 4.5:1 contrast for ordinary text and 3:1 for qualifying large text. The original palette includes muted text at approximately 3.71:1 on the paper background, metric labels at 3.10:1 on white, and function notes at 3.02:1 on their light background. These computed CSS pairs identify specific colors to darken; they are not a complete accessibility audit.[^7]

Use approximately 16 px for explanatory paragraphs and 13–14 px for essential metadata as a product recommendation, not a WCAG minimum font size. Keep lengthy explanations outside the canvas. Essential labels should remain readable when the model rotates behind them. Increase paragraph spacing and reserve strong accent color for selection or meaningful status.

Required controls and graphical distinctions generally need 3:1 contrast against adjacent colors. The original focus outline is about 2.33:1 against white, so a darker outline is advisable. Check it on both light panels and the dark viewer. A soft border may remain decorative, but the selected organ, keyboard focus, and control boundaries must be discoverable.[^8]

## 5. Provide complete alternatives to dragging and animation

**Priority: immediate.** Front, back, side, reset, and zoom buttons are a useful foundation. Add rotate-left/right and tilt-up/down buttons to reach intermediate views without dragging. Add pan alternatives if unrestricted panning remains available. WCAG’s dragging criterion requires a single-pointer alternative; keyboard access is a separate requirement, so arrow-key support alone does not settle both.[^9][^10]

Use native buttons with accessible names, clear pressed states, and visible focus. Give important controls approximately 44 px activation areas where space permits. WCAG 2.2’s AA minimum is 24 by 24 CSS pixels, with defined exceptions; 44 px is the atlas’s usability target.[^11]

Keep auto-rotation off initially. Provide one obvious pause control for all explanatory motion. Honor reduced-motion preferences in every camera transition, including focus-on-organ, and in flow effects. WCAG requires pause, stop, or hide controls for qualifying automatically starting movement lasting more than five seconds. The broader recommendation to minimize optional movement also addresses reading comfort.[^12]

The HTML finding panel should contain the useful meaning conveyed by the model. A canvas label alone is insufficient as an equivalent to a complex visualization; readers need the selected anatomy, findings, provenance, and limits in text. Announce deliberate selection and slice changes briefly without announcing every animation frame.[^13]

## 6. Support Arabic and small screens as complete experiences

**Priority: immediate.** Arabic should use semantic `lang` and `dir` attributes on the document or appropriate structural containers. W3C advises using HTML directionality instead of relying on CSS direction alone. Isolate left-to-right medical abbreviations, dates, and measurements when necessary; ensure punctuation stays attached to the intended phrase.[^14]

Interface direction must not mirror patient anatomy or reverse the meaning of left and right. Localize the explanatory labels while preserving the CT coordinate transform. On narrow screens, stack the viewer, controls, and findings in a meaningful order. WCAG reflow guidance supports readable content at a width equivalent to 320 CSS pixels, with exceptions for content requiring a two-dimensional layout. Such an exception for a visualization does not excuse clipped surrounding text or inaccessible controls.[^15]

## 7. Use advanced rendering selectively

**Priority: subsequent enhancement.** Organ isolation, a restrained cutaway, and stable camera presets are practical improvements for this educational atlas. Multiple transparent shells can produce misleading overlaps: Three.js documents that object sorting cannot resolve every transparency case. Test front, back, oblique, and interior views, and favor simple visibility controls where translucent layers obscure the selected anatomy.[^16]

True volume rendering is a distinct future capability. 3D Slicer describes it as mapping voxel intensities to color and opacity without requiring segmentation. Transfer functions, cropping, interpolation, lighting, and sampling quality affect what appears visible. GPU capacity and rendering quality also constrain interaction. Therefore, a polished volume view would still require explanatory labels and access to source slices; it would not automatically reveal a verified lesion boundary.[^17]

Retain the lightweight mesh mode for the default offline experience. If a volume mode is later added, make it optional, show its display preset, and document resampling and coverage. More elaborate rendering should be accepted only when it improves a concrete task such as locating an organ or understanding a spatial relationship.

## Delivery priorities

| Order | Improvement | Review criterion |
|---|---|---|
| 1 | Evidence, date, and uncertainty labels | Every finding exposes its source and temporal context. |
| 2 | Readability and interaction | Text contrast, focus, keyboard, tap-only operation, Arabic, and narrow-screen layouts are checked. |
| 3 | Spatial clarity | Orientation stays correct after rotation; preview markers match stored slice positions. |
| 4 | Additional rendering | Isolation or cutaway improves explanation without implying new patient-specific evidence. |

## Sources

Primary web sources were checked on 11 September 2026. DICOM pages identify the 2026c edition; Slicer and Three.js references are current rolling documentation.

[^1]: Local assets: [CT metadata](../assets/ct/metadata.json) and [reconstruction script](../scripts/build_ct_assets.py), derived locally from `Study0908095422986.zip`; no external upload.
[^2]: W3C WAI, [Understanding SC 1.4.1: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
[^3]: 3D Slicer, [Segment Editor: thresholding, smoothing, resolution, and surface artifacts](https://slicer.readthedocs.io/en/latest/user_guide/modules/segmenteditor.html).
[^4]: NEMA, DICOM PS3.3 2026c, [C.8.20.2 Segmentation Image Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.8.20.2.html).
[^5]: NEMA, DICOM PS3.3 2026c, [C.7.6.2 Image Plane Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html).
[^6]: NEMA, DICOM PS3.3 2026c, [C.11.1 Modality LUT Module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.11.html).
[^7]: W3C WAI, [Understanding SC 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Baseline colors from the original atlas stylesheet; ratios calculated using WCAG relative luminance.
[^8]: W3C WAI, [Understanding SC 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
[^9]: W3C WAI, [Understanding SC 2.5.7: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
[^10]: W3C WAI, [Understanding SC 2.1.1: Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).
[^11]: W3C WAI, [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
[^12]: W3C WAI, [Understanding SC 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
[^13]: W3C WAI, [Understanding SC 1.1.1: Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html).
[^14]: W3C Internationalization, [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir).
[^15]: W3C WAI, [Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
[^16]: Three.js, [WebGLRenderer: sortObjects](https://threejs.org/docs/pages/WebGLRenderer.html#sortObjects).
[^17]: 3D Slicer, [Volume rendering](https://slicer.readthedocs.io/en/latest/user_guide/modules/volumerendering.html).
