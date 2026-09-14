// Dates describe the document/review; studyDate and specimenDate preserve the
// separate clinical events. A missing issue date is deliberately null.
// Local report contents support the observations below. External guidance in
// the linked AI reviews explains limitations and does not diagnose this patient.
export const reportCatalog = [
  {
    id: 'abdomen-pelvis-ct',
    title: ['Abdomen & pelvis CT — original report', 'تصوير البطن والحوض — التقرير الأصلي'],
    modality: 'CT',
    date: '2026-09-03',
    studyDate: '2026-09-02',
    dateLabel: ['CT 2 September 2026 · report 3 September', 'الفحص 2 سبتمبر 2026 · التقرير 3 سبتمبر'],
    evidence: ['Original radiologist’s report', 'تقرير اختصاصي الأشعة الأصلي'],
    organs: ['bladder', 'kidney', 'liver'],
    summary: [
      'The CT before tissue collection describes two bladder masses, a smaller left kidney and tiny liver findings that remain uncharacterized.',
      'يصف التصوير السابق لأخذ العينة كتلتين بالمثانة، وكلية يسرى أصغر حجماً، وبؤراً كبدية صغيرة جداً لم تُحسم طبيعتها.'
    ],
    observations: [
      ['Two enhancing bladder masses near the ureteric entrances: left approximately 18 × 10 mm; right 13 × 8 mm.', 'كتلتان متعززتان بالصبغة في المثانة قرب فتحتي الحالبين: اليسرى نحو 18 × 10 مم واليمنى 13 × 8 مم.'],
      ['No associated collecting-system or ureter dilatation, obvious ureteric extension or CT evidence of extension outside the bladder was reported.', 'لم يصف التقرير توسعاً بالجهاز الجامع أو الحالبين، أو امتداداً واضحاً للحالبين، أو دليلاً بالتصوير على امتداد خارج المثانة.'],
      ['The left kidney is approximately 9.0 cm long, with mild parenchymal thinning and a lobulated contour; the right is 11.8 cm. Both excreted contrast normally.', 'طول الكلية اليسرى نحو 9.0 سم مع ترقق نسيجي خفيف وسطح مفصص، واليمنى 11.8 سم. وُصف إطراح طبيعي للصبغة من الكليتين.'],
      ['A few liver foci, largest approximately 7.7 mm, were too small to characterize. Small cysts were considered, but metastases could not be confidently excluded on that CT.', 'بؤر كبدية قليلة، أكبرها نحو 7.7 مم، أصغر من أن تُحدد طبيعتها بثقة. ذُكرت الأكياس الصغيرة كاحتمال، لكن لم يمكن استبعاد النقائل بثقة بهذا التصوير.'],
      ['The report recommended tissue assessment of the bladder masses and consideration of liver MRI or imaging follow-up. Later pathology and MRI records are available separately.', 'أوصى التقرير بفحص نسيجي لكتل المثانة والنظر في رنين للكبد أو متابعة تصويرية. تتوفر وثيقتا الأنسجة والرنين اللاحقتان بصورة منفصلة.']
    ],
    pdf: 'assets/reports/abdomen-pelvis-ct.pdf',
    figures: []
  },
  {
    id: 'bladder-pathology',
    title: ['Bladder tissue — pathology report', 'عينة المثانة — تقرير الأنسجة'],
    modality: 'Pathology',
    date: '2026-09-09',
    specimenDate: '2026-09-05',
    dateLabel: ['Specimen 5 September 2026 · report 9 September', 'أخذ العينة 5 سبتمبر 2026 · التقرير 9 سبتمبر'],
    evidence: ['Signed pathology report · examined TURBT tissue', 'تقرير أنسجة موقّع · عينة الاستئصال المفحوصة'],
    organs: ['bladder'],
    summary: [
      'The submitted bladder tissue is reported as low-grade inverted urothelial carcinoma, pTa / G1 as recorded by the pathologist.',
      'وُصفت عينة المثانة بأنها سرطان ظهارة بولية مقلوب منخفض الدرجة، بتصنيف pTa / G1 كما سجله اختصاصي الأنسجة.'
    ],
    observations: [
      ['The specimen was collected on 5 September 2026, after the 2 September CT, and reported on 9 September.', 'أُخذت العينة في 5 سبتمبر 2026، بعد تصوير 2 سبتمبر، وصدر تقريرها في 9 سبتمبر.'],
      ['The report describes predominantly inverted/endophytic growth and identifies no lamina propria invasion in the examined sample.', 'يصف التقرير نمواً مقلوباً إلى الداخل في الغالب، دون غزو للصفيحة الخاصة في العينة المفحوصة.'],
      ['Detrusor muscle is present and tumor-free in the submitted sample.', 'عضلة المثانة موجودة وخالية من الورم في العينة المرسلة.'],
      ['The notation pTa / G1 is reproduced as reported; this catalog does not assign an overall cancer stage.', 'نُقل التصنيف pTa / G1 كما ورد؛ ولا يحدد هذا العرض مرحلة إجمالية للسرطان.'],
      ['The tissue report does not establish complete removal, current residual tumor or the identity of the liver findings.', 'لا يثبت تقرير العينة اكتمال الإزالة أو وجود ورم متبقٍ حالياً، ولا يحدد طبيعة البؤر الكبدية.']
    ],
    pdf: 'assets/reports/bladder-pathology.pdf',
    figures: []
  },
  {
    id: 'abdomen-pelvis-secondary-review',
    title: ['Abdomen & pelvis — secondary Arabic review', 'البطن والحوض — مراجعة عربية ثانوية'],
    modality: 'CT review',
    date: null,
    studyDate: '2026-09-02',
    dateLabel: ['CT study 2 September 2026 · review date not stated', 'دراسة التصوير 2 سبتمبر 2026 · تاريخ المراجعة غير مذكور'],
    evidence: ['Secondary image review · requires specialist confirmation', 'مراجعة ثانوية للصور · تحتاج إلى تأكيد الاختصاصي'],
    organs: ['bladder', 'kidney', 'liver', 'hip'],
    summary: [
      'The secondary review broadly agrees with the bladder and kidney descriptions and adds a left-hip degenerative observation absent from the original CT report.',
      'تتوافق المراجعة الثانوية إجمالاً مع وصف المثانة والكلية، وتضيف ملاحظة تنكسية بالورك الأيسر غير واردة في تقرير التصوير الأصلي.'
    ],
    observations: [
      ['This document reviews the 2 September CT. Its own issue date is not established, so it has no assigned position among the later dated reports.', 'تراجع الوثيقة تصوير 2 سبتمبر. لم يُحدد تاريخ إصدارها، لذلك لا تُنسب إلى ترتيب زمني مفترض بين التقارير اللاحقة.'],
      ['It describes moderate-to-severe chronic left-hip degeneration, including joint-space narrowing, sclerosis, subchondral cysts, osteophytes and mild remodeling.', 'تصف تغيرات تنكسية مزمنة متوسطة إلى شديدة بالورك الأيسر، تشمل تضيق المسافة المفصلية والتصلب والكيسات تحت الغضروفية والنابتات العظمية وإعادة التشكل الخفيفة.'],
      ['The hip observation is from a secondary review and needs specialist confirmation; it is not presented as confirmed tumor spread.', 'ملاحظة الورك مستمدة من مراجعة ثانوية وتحتاج إلى تأكيد الاختصاصي؛ ولا تُعرض بوصفها انتشاراً ورمياً مؤكداً.'],
      ['The review retains uncertainty about the tiny liver foci and notes that the early contrast phase does not cover the liver.', 'تُبقي المراجعة طبيعة البؤر الكبدية الصغيرة غير محسومة، وتذكر أن مرحلة الصبغة المبكرة لا تشمل الكبد.'],
      ['It does not establish the cause of the smaller left kidney or quantify kidney function, hip symptoms or walking ability.', 'لا تحسم سبب صغر الكلية اليسرى، ولا تقيس وظيفة الكلية أو أعراض الورك أو القدرة على المشي.']
    ],
    pdf: 'assets/reports/abdomen-pelvis-secondary-review.pdf',
    figures: []
  },
  {
    id: 'liver-mri',
    title: ['Liver MRI — preliminary AI review', 'رنين الكبد — مراجعة أولية بالذكاء الاصطناعي'],
    modality: 'MRI',
    date: '2026-09-14',
    studyDate: '2026-09-14',
    dateLabel: ['MRI and preliminary review · 14 September 2026', 'الرنين والمراجعة الأولية · 14 سبتمبر 2026'],
    evidence: ['Preliminary AI image review · not a signed radiology report', 'مراجعة أولية للصور بالذكاء الاصطناعي · ليست تقرير أشعة موقّعاً'],
    organs: ['liver'],
    summary: [
      'MRI has now been reviewed preliminarily. A tiny posterior right-liver focus may contain fluid, but remains incompletely characterized; a cyst is a possibility, not a confirmed diagnosis.',
      'أُنجزت مراجعة أولية للرنين. قد تحتوي بؤرة صغيرة جداً في الجزء الخلفي من الفص الأيمن للكبد على سائل، لكن طبيعتها ما زالت غير محسومة؛ والكيس احتمال وليس تشخيصاً مؤكداً.'
    ],
    observations: [
      ['The source study contains 636 DICOM images in 12 series, with T2, T1, diffusion/ADC and multiple contrast-labelled phases.', 'تضم الدراسة 636 صورة DICOM ضمن 12 سلسلة، تشمل T2 وT1 والانتشار وخرائط ADC ومراحل متعددة موسومة بالصبغة.'],
      ['The review target appears bright on T2 (S3/I8–9) and dark relative to enhanced liver on venous-labelled T1 (S10/I41–42) and delayed-labelled T1 (S12/I41–42).', 'يبدو موضع المراجعة مرتفع الإشارة على T2 في S3/I8–9، ومنخفضاً بالنسبة للكبد المعزز في السلسلة الموسومة بالوريدية S10/I41–42 والمتأخرة S12/I41–42.'],
      ['The focus appears smaller than 1 cm. Exact size, Couinaud segment, enhancement and diffusion restriction were not reliably established.', 'يبدو حجم البؤرة أقل من 1 سم. لم يُحسم قياسها الدقيق أو قطعتها وفق كوينو أو تعززها أو تقييد الانتشار فيها بصورة موثوقة.'],
      ['No obvious large liver mass was apparent in the reviewed images. This does not establish or exclude cancer, confirm a cyst or determine the total number of lesions.', 'لم تبدُ كتلة كبدية كبيرة واضحة في الصور المراجعة. لا يثبت ذلك السرطان أو ينفيه، ولا يؤكد كيساً أو يحدد العدد الكلي للآفات.'],
      ['MRCP appears in the study label, but a dedicated duct acquisition was not identified in the export. A complete bile-duct examination cannot be assumed.', 'ترد عبارة MRCP في وصف الدراسة، لكن لم تُحدد صور مخصصة للقنوات ضمن الملفات. لا يمكن افتراض توفر فحص كامل للقنوات الصفراوية.'],
      ['Compare the full MRI with the earlier CT and obtain the radiologist’s signed interpretation. This review does not prove that every earlier CT focus has been matched or characterized.', 'ينبغي مقارنة الرنين الكامل بالتصوير السابق والحصول على تفسير اختصاصي الأشعة الموقّع. لا تثبت هذه المراجعة مطابقة كل بؤر التصوير السابق أو تحديد طبيعتها.']
    ],
    pdf: 'assets/reports/liver-mri-en-ar.pdf',
    html: 'assets/reports/liver-mri-en-ar.html',
    figures: [
    {
        "src": "assets/reports/liver-mri-overview.jpg",
        "caption": [
            "Report figure: one unconfirmed tiny right-liver review point compared across T2 and later T1 sequences.",
            "شكل التقرير: مقارنة نقطة مراجعة صغيرة غير مؤكدة في الكبد الأيمن عبر تسلسلات T2 وT1 اللاحقة."
        ],
        "seriesReferences": [
            "S3 / I8",
            "S10 / I41",
            "S12 / I41"
        ]
    },
    {
        "src": "assets/reports/liver-mri-slice-01.jpg",
        "caption": [
            "Axial T2: tiny bright right-liver review point; its nature is unconfirmed.",
            "مقطع محوري T2: نقطة مراجعة صغيرة ساطعة في الكبد الأيمن؛ طبيعتها غير مؤكدة."
        ],
        "seriesReferences": [
            "S3 / I8"
        ],
        "window": {
            "center": 357.0,
            "width": 794.0,
            "units": "display intensity"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/liver-mri-slice-02.jpg",
        "caption": [
            "Adjacent axial T2 slice for comparison with the same unconfirmed review point.",
            "مقطع محوري T2 مجاور للمقارنة مع نقطة المراجعة نفسها غير المؤكدة."
        ],
        "seriesReferences": [
            "S3 / I9"
        ],
        "window": {
            "center": 357.0,
            "width": 794.0,
            "units": "display intensity"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/liver-mri-slice-03.jpg",
        "caption": [
            "Axial T2 overview of the liver and gallbladder; selected for anatomical context.",
            "نظرة عامة محورية T2 للكبد والمرارة؛ اختيرت لتوضيح السياق التشريحي."
        ],
        "seriesReferences": [
            "S3 / I14"
        ],
        "window": {
            "center": 357.0,
            "width": 794.0,
            "units": "display intensity"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/liver-mri-slice-04.jpg",
        "caption": [
            "Coronal T2 overview; a selected anatomical reference, not a complete study review.",
            "نظرة عامة إكليلية T2؛ مرجع تشريحي مختار وليس مراجعة كاملة للفحص."
        ],
        "seriesReferences": [
            "S4 / I21"
        ],
        "window": {
            "center": 607.0,
            "width": 1154.0,
            "units": "display intensity"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/liver-mri-slice-05.jpg",
        "caption": [
            "Venous-labelled T1 image used to compare the tiny unconfirmed right-liver focus.",
            "صورة T1 الموسومة بالطور الوريدي لمقارنة البؤرة الصغيرة غير المؤكدة في الكبد الأيمن."
        ],
        "seriesReferences": [
            "S10 / I41"
        ],
        "window": {
            "center": 275.0,
            "width": 599.0,
            "units": "display intensity"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/liver-mri-slice-06.jpg",
        "caption": [
            "Delayed-labelled T1 image used for comparison; no definitive diagnosis from this panel.",
            "صورة T1 الموسومة بالطور المتأخر للمقارنة؛ لا تعطي هذه اللوحة تشخيصاً نهائياً."
        ],
        "seriesReferences": [
            "S12 / I41"
        ],
        "window": {
            "center": 258.0,
            "width": 561.0,
            "units": "display intensity"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    }
]
  },
  {
    id: 'chest-ct',
    title: ['Chest CT — preliminary AI review', 'تصوير الصدر — مراجعة أولية بالذكاء الاصطناعي'],
    modality: 'CT',
    date: '2026-09-14',
    studyDate: '2026-09-13',
    dateLabel: ['CT 13 September 2026 · preliminary review 14 September', 'الفحص 13 سبتمبر 2026 · المراجعة الأولية 14 سبتمبر'],
    evidence: ['Preliminary AI image review · not a signed radiology report', 'مراجعة أولية للصور بالذكاء الاصطناعي · ليست تقرير أشعة موقّعاً'],
    organs: ['chest', 'liver'],
    summary: [
      'No obvious lung mass, focal consolidation, pleural fluid or pneumothorax was identified in the limited review. These preliminary observations need radiologist confirmation.',
      'لم تُلاحظ كتلة رئوية واضحة أو منطقة تكثف بؤري أو سائل جنبي أو استرواح صدر بالمراجعة المحدودة. تحتاج هذه الملاحظات الأولية إلى تأكيد اختصاصي الأشعة.'
    ],
    observations: [
      ['The study contains 1,403 DICOM objects across 12 series, including images before and after IV contrast and thin lung reconstructions.', 'تضم الدراسة 1403 ملفات DICOM ضمن 12 سلسلة، بينها صور قبل الصبغة الوريدية وبعدها وإعادات بناء رئوية رقيقة.'],
      ['No convincing separate pulmonary nodule was identified to measure. Small or subtle abnormalities cannot be reliably excluded by this review.', 'لم تُحدد عقدة رئوية مستقلة واضحة بما يكفي لتأكيد وجودها وقياسها. لا يمكن استبعاد التغيرات الصغيرة أو الدقيقة بشكل موثوق بهذه المراجعة.'],
      ['The central airways appeared open; no obvious bulky lymph nodes, gross cardiac enlargement or large pericardial effusion was apparent.', 'بدت المجاري الهوائية المركزية سالكة، دون تضخم كبير وواضح بالعقد اللمفاوية أو القلب أو انصباب تاموري كبير.'],
      ['Tiny low-attenuation liver foci are incompletely characterized on the included upper-abdominal images (including S7/I51). They are not confirmed cysts or metastases.', 'بؤر كبدية صغيرة جداً منخفضة الكثافة غير مكتملة التوصيف في صور أعلى البطن، ومنها S7/I51. ليست أكياساً مؤكدة أو نقائل مؤكدة.'],
      ['Contrast images are present, but this is not documented as a dedicated CT pulmonary angiogram. Pulmonary embolism cannot be reliably excluded by this review.', 'توجد صور بالصبغة، لكن الفحص غير موثق بوصفه تصويراً وعائياً مقطعياً مخصصاً للشرايين الرئوية. لا يمكن استبعاد الانصمام الرئوي بشكل موثوق بهذه المراجعة.'],
      ['No lung-nodule surveillance schedule is assigned without a confirmed nodule and clinical risk assessment. The images do not measure lung function or establish that symptoms are harmless.', 'لم يُحدد جدول متابعة لعقدة رئوية دون تأكيد وجودها وتقييم عوامل الخطورة. لا تقيس الصور وظيفة الرئة ولا تثبت أن الأعراض غير خطرة.']
    ],
    pdf: 'assets/reports/chest-ct-en-ar.pdf',
    html: 'assets/reports/chest-ct-en-ar.html',
    figures: [
    {
        "src": "assets/reports/chest-ct-overview.jpg",
        "caption": [
            "Representative upper, middle and lower chest panels plus included upper abdomen; no lesion annotation.",
            "مقاطع تمثيلية لأعلى الصدر ووسطه وأسفله والجزء المشمول من أعلى البطن؛ دون تحديد آفة."
        ],
        "seriesReferences": [
            "S6 / I65",
            "S6 / I130",
            "S6 / I225",
            "S7 / I51"
        ]
    },
    {
        "src": "assets/reports/chest-ct-slice-01.jpg",
        "caption": [
            "Upper chest in a lung window; representative anatomy, with no lesion marker.",
            "أعلى الصدر بنافذة الرئة؛ تشريح تمثيلي دون علامة على آفة."
        ],
        "seriesReferences": [
            "S6 / I65"
        ],
        "window": {
            "center": -600,
            "width": 1500,
            "units": "HU"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/chest-ct-slice-02.jpg",
        "caption": [
            "Mid-chest in a lung window; vessels appear as lines or dots across slices.",
            "منتصف الصدر بنافذة الرئة؛ تظهر الأوعية كخطوط أو نقاط عبر المقاطع."
        ],
        "seriesReferences": [
            "S6 / I130"
        ],
        "window": {
            "center": -600,
            "width": 1500,
            "units": "HU"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/chest-ct-slice-03.jpg",
        "caption": [
            "Lower chest and liver dome in a lung window; the selected panel is not a diagnostic exclusion.",
            "أسفل الصدر وقبة الكبد بنافذة الرئة؛ لا يستبعد المقطع المختار وجود مرض بشكل تشخيصي."
        ],
        "seriesReferences": [
            "S6 / I185"
        ],
        "window": {
            "center": -600,
            "width": 1500,
            "units": "HU"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/chest-ct-slice-04.jpg",
        "caption": [
            "Lung bases in a lung window; selected anatomical context without a lesion marker.",
            "قاعدتا الرئتين بنافذة الرئة؛ سياق تشريحي مختار دون علامة على آفة."
        ],
        "seriesReferences": [
            "S6 / I225"
        ],
        "window": {
            "center": -600,
            "width": 1500,
            "units": "HU"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/chest-ct-slice-05.jpg",
        "caption": [
            "Contrast-labelled chest series in a soft-tissue window, showing mediastinal anatomy.",
            "سلسلة الصدر الموسومة بالمادة الظليلة بنافذة الأنسجة الرخوة لإظهار تشريح المنصف."
        ],
        "seriesReferences": [
            "S7 / I25"
        ],
        "window": {
            "center": 40,
            "width": 400,
            "units": "HU"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    },
    {
        "src": "assets/reports/chest-ct-slice-06.jpg",
        "caption": [
            "Included upper abdomen in a soft-tissue window; chest CT does not replace dedicated liver MRI.",
            "الجزء المشمول من أعلى البطن بنافذة الأنسجة الرخوة؛ لا يحل تصوير الصدر محل رنين مخصص للكبد."
        ],
        "seriesReferences": [
            "S7 / I51"
        ],
        "window": {
            "center": 40,
            "width": 400,
            "units": "HU"
        },
        "rendering": [
            "Original image pixels; display window and proportional resizing only. Patient metadata and DICOM overlays are not rendered.",
            "بكسلات الصورة الأصلية؛ تغيير نافذة العرض والحجم بشكل متناسب فقط. لا تُعرض بيانات المريض أو طبقات DICOM."
        ]
    }
]
  }
];
