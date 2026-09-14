# Integrating the anatomical atlas and report library

Reviewed 14 September 2026. These references informed interaction and presentation; the atlas uses its own local code and assets.

The existing full-body viewer uses a dark anatomical stage, amber selection and a pale information panel. The report library extends that visual system with warm paper, a dark teal selected-record header, and restrained typography. Its purpose is to connect each observation to its supplied record and anatomical region.

## Design references

- [BioDigital — 3D embed publishing settings](https://support.biodigital.com/hc/en-us/articles/360043705853-3D-embed-publishing-settings). The documented viewer connects selected anatomical labels to information and supporting media, offers select/hide/fade controls, and adapts its information panel to a bottom drawer at narrower widths. Applied here: selection opens contextual evidence, actions use a consistent vocabulary, and report details remain readable on mobile.
- [Visible Body — Using cross sections and diagnostic images](https://help.cengage.com/visible-body/student/visible-body/atlas-cross-sections-mac.html). Diagnostic images can be viewed beside anatomical cross sections with identifying pins. Applied here: local CT/MRI figures appear directly in the relevant record, with supplied captions and series references. The anatomy map links to records; it does not claim precise patient-specific spatial registration.
- [Zygote Body — Interactive viewer and quick guide](https://www.zygotebody.com/). The public guide describes layer opacity, named selection, zoom-to, visibility controls and resetting the view. Applied here: a “Locate in body” action bridges the report and the corresponding selectable anatomical region.

## Report library decisions

- All supplied records are searchable in English and Arabic. Filters use record modality and the body regions explicitly linked in the catalog.
- Source labels come directly from the catalog. Signed reports, secondary reviews and AI-assisted educational reviews retain their own provenance.
- Dated records are ordered by their documented dates. An undated review stays in a separate group; the date of the scan it discusses is not substituted for its issue date.
- Selected records expose their full summary, observations, local figures, and available PDF/HTML files. Figures can be enlarged without introducing a network dependency.
- Arabic uses RTL layout and the locally supplied Arabic font. Controls are native buttons, inputs and selects, with visible keyboard focus and a keyboard-dismissable image dialog.
- Body navigation is schematic. It does not generate lesion coordinates or imply current disease burden from older records.
