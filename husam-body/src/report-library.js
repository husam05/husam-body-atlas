import { reportCatalog } from './report-catalog.js';

const organs = {
  bladder: ['Bladder', 'المثانة'], kidney: ['Left kidney', 'الكلية اليسرى'],
  liver: ['Liver', 'الكبد'], hip: ['Left hip', 'الورك الأيسر'], chest: ['Chest & lungs', 'الصدر والرئتان'],
};
const words = {
  en: {
    eyebrow: 'THE SUPPORTING RECORD', title: 'Reports & imaging',
    intro: 'Explore the supplied records, compare their observations, and find each region in the body.',
    records: 'supplied records', search: 'Search the records', placeholder: 'Try liver, CT, or الكبد',
    all: 'All records', organ: 'Body region', allOrgans: 'All regions', chronology: 'Dated records',
    undated: 'Review date not stated', empty: 'No matching records',
    emptyHint: 'Try another search or clear the filters to see all supplied records.', reset: 'Clear filters',
    result: count => `${count} ${count === 1 ? 'record' : 'records'} shown`,
    overview: 'Summary', observations: 'Reported observations', images: 'Supporting images',
    locate: 'Locate in body', pdf: 'Open PDF', html: 'Read HTML report', source: 'Evidence source',
    original: 'Open the full record', enlarge: 'Enlarge image', close: 'Close image',
    selected: 'Selected record', figure: n => `Figure ${n}`, sequence: 'Browse the record',
    context: 'Read each record in its own context. A signed report and an AI-assisted review provide different kinds of evidence.',
    mapNote: 'The body map shows anatomical location. It does not establish a lesion’s exact position or current disease status.',
    missingImage: 'The image could not be loaded. Use the complete report to view its figures.',
    reviewDate: 'Date not stated',
  },
  ar: {
    eyebrow: 'السجل الداعم للأطلس', title: 'التقارير وصور الفحوصات',
    intro: 'استعرض السجلات المرفقة، وقارن ملاحظاتها، وحدّد كل منطقة في خريطة الجسم.',
    records: 'سجلات مرفقة', search: 'ابحث في السجلات', placeholder: 'مثلاً: الكبد أو CT أو liver',
    all: 'جميع السجلات', organ: 'منطقة الجسم', allOrgans: 'جميع المناطق', chronology: 'السجلات المؤرخة',
    undated: 'تاريخ المراجعة غير مذكور', empty: 'لا توجد سجلات مطابقة',
    emptyHint: 'جرّب كلمات أخرى أو امسح عوامل التصفية لعرض جميع السجلات المرفقة.', reset: 'مسح التصفية',
    result: count => `عدد السجلات المعروضة: ${count}`,
    overview: 'الخلاصة', observations: 'الملاحظات الواردة', images: 'الصور الداعمة',
    locate: 'حدّد الموقع في الجسم', pdf: 'فتح ملف PDF', html: 'قراءة تقرير HTML', source: 'مصدر الدليل',
    original: 'فتح السجل الكامل', enlarge: 'تكبير الصورة', close: 'إغلاق الصورة',
    selected: 'السجل المحدد', figure: n => `الصورة ${n}`, sequence: 'تصفّح السجل',
    context: 'اقرأ كل سجل في سياقه. يقدّم التقرير الموقّع والمراجعة بمساعدة الذكاء الاصطناعي نوعين مختلفين من الأدلة.',
    mapNote: 'تُظهر خريطة الجسم الموقع التشريحي؛ ولا تثبت الموضع الدقيق لأي آفة أو الحالة الحالية للمرض.',
    missingImage: 'تعذّر تحميل الصورة. يمكن الاطلاع على صورها في التقرير الكامل.',
    reviewDate: 'التاريخ غير مذكور',
  },
};
const modalityNames = {
  ct: ['CT', 'تصوير مقطعي'], mri: ['MRI', 'رنين مغناطيسي'],
  pathology: ['Pathology', 'فحص الأنسجة'], review: ['Secondary review', 'مراجعة ثانوية'],
};
const icons = {
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
};
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalize = value => String(value ?? '').normalize('NFKD').toLowerCase()
  .replace(/\p{M}/gu, '').replace(/\u0640/g, '').replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
const category = report => {
  const type = normalize(report.modality);
  if (/path|hist|tissue|انسج/.test(type)) return 'pathology';
  if (/secondary|review|مراجعة/.test(type)) return 'review';
  if (/mri|magnetic|رنين/.test(type)) return 'mri';
  if (/\bct\b|computed|مقطعي/.test(type)) return 'ct';
  return type;
};
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
let instanceCount = 0;

/** Mount the local report catalog. Destroy before remounting or changing language. */
export function createReportLibrary({ host, lang = 'en', onSelectOrgan, initialReportId }) {
  if (!host?.ownerDocument) throw new TypeError('Report library requires a host element.');
  const doc = host.ownerDocument;
  const language = lang === 'ar' || lang === 1 ? 'ar' : 'en';
  const index = language === 'ar' ? 1 : 0;
  const direction = index ? 'rtl' : 'ltr';
  const t = words[language];
  const L = value => Array.isArray(value) ? String(value[index] || value[0] || '') : String(value ?? '');
  const organName = key => L(organs[key] || [key, key]);
  const prefix = `report-library-${++instanceCount}`;
  const controller = new AbortController();
  const events = { signal: controller.signal };
  const records = [...reportCatalog].sort((a, b) => {
    const aDated = validDate(a.date), bDated = validDate(b.date);
    if (aDated !== bDated) return aDated ? -1 : 1;
    return aDated ? a.date.localeCompare(b.date) : 0;
  });
  const modalities = [...new Set(records.map(category))];
  const availableOrgans = [...new Set(records.flatMap(report => report.organs || []))];
  const localUrl = value => {
    const path = String(value || '').trim();
    // Keep this offline-capable library restricted to catalog-provided local assets.
    return path && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path) ? path : '';
  };
  const modalityLabel = key => L(modalityNames[key] || [key.toUpperCase(), key.toUpperCase()]);
  const dateText = report => {
    if (report.dateLabel) return L(report.dateLabel);
    if (!validDate(report.date)) return t.reviewDate;
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${report.date}T12:00:00Z`));
  };
  const safeId = value => String(value).replace(/[^a-z\d_-]/gi, '-');
  const element = (tag, className) => {
    const node = doc.createElement(tag);
    node.className = className;
    return node;
  };
  const root = element('section', 'report-library');
  root.lang = language;
  root.dir = direction;
  root.setAttribute('aria-labelledby', `${prefix}-title`);
  root.innerHTML = `
    <header class="rl-intro">
      <div class="rl-intro-copy"><p class="rl-eyebrow">${t.eyebrow}</p><h2 id="${prefix}-title">${t.title}</h2><p class="rl-lead">${t.intro}</p></div>
      <div class="rl-total"><span>${String(records.length).padStart(2, '0')}</span><p>${t.records}</p></div>
    </header>
    <div class="rl-toolbar">
      <div class="rl-search"><label for="report-query">${t.search}</label><div>${svg('search')}<input id="report-query" type="search" placeholder="${t.placeholder}" autocomplete="off" spellcheck="false" dir="auto"></div></div>
      <div class="rl-region"><label for="${prefix}-region">${t.organ}</label><select id="${prefix}-region"><option value="all">${t.allOrgans}</option>${availableOrgans.map(key => `<option value="${escape(key)}">${escape(organName(key))}</option>`).join('')}</select></div>
    </div>
    <div class="rl-filterline"><div class="rl-filters" role="group" aria-label="${escape(index ? 'نوع السجل' : 'Record type')}">
      <button type="button" class="rl-filter is-active" data-rl-filter="all" aria-pressed="true">${t.all}</button>
      ${modalities.map(key => `<button type="button" class="rl-filter" data-rl-filter="${escape(key)}" aria-pressed="false">${escape(modalityLabel(key))}</button>`).join('')}
    </div><p class="rl-results-count" role="status" aria-live="polite" aria-atomic="true"></p></div>
    <div class="rl-workspace"><nav class="rl-records" aria-label="${t.sequence}"></nav><article class="rl-detail report-detail" id="${prefix}-detail"></article></div>
    <div class="rl-empty" hidden>${svg('search')}<h3>${t.empty}</h3><p>${t.emptyHint}</p><button type="button" class="rl-button" data-rl-reset>${t.reset}</button></div>
    <footer class="rl-context">${svg('file')}<p>${t.context}</p></footer>
    <dialog class="rl-lightbox" aria-labelledby="${prefix}-image-caption"><div class="rl-lightbox-bar"><span>${t.images}</span><button type="button" data-rl-close aria-label="${t.close}">${svg('close')}</button></div><img alt=""><p id="${prefix}-image-caption"></p></dialog>`;
  host.replaceChildren(root);
  const search = root.querySelector('input');
  const region = root.querySelector('select');
  const recordList = root.querySelector('.rl-records');
  const detail = root.querySelector('.rl-detail');
  const workspace = root.querySelector('.rl-workspace');
  const empty = root.querySelector('.rl-empty');
  const count = root.querySelector('.rl-results-count');
  const lightbox = root.querySelector('dialog');
  let query = '', filter = 'all', selectedOrgan = 'all';
  let selectedId = records.some(report => report.id === initialReportId) ? initialReportId : (records.findLast(report => validDate(report.date))?.id || records[0]?.id);
  let shown = [], returnFocus = null, destroyed = false;

  function matchingRecords() {
    const terms = normalize(query).split(' ').filter(Boolean);
    return records.filter(report => {
      if (filter !== 'all' && category(report) !== filter) return false;
      if (selectedOrgan !== 'all' && !report.organs?.includes(selectedOrgan)) return false;
      const text = normalize([
        ...(report.title || []), ...(report.summary || []), ...(report.evidence || []),
        report.modality, ...(modalityNames[category(report)] || []),
        ...(report.organs || []).flatMap(key => organs[key] || [key]),
        ...(report.observations || []).flat(), ...(report.dateLabel || []),
      ].join(' '));
      return terms.every(term => text.includes(term));
    });
  }

  function card(report) {
    const active = report.id === selectedId;
    const dated = validDate(report.date);
    const date = dated ? `<time datetime="${report.date}">${escape(dateText(report))}</time>` : `<span>${escape(dateText(report))}</span>`;
    return `<li class="rl-record-item"><button type="button" class="rl-record report-card ${active ? 'is-selected' : ''}" data-rl-report="${escape(report.id)}" data-report-id="${escape(report.id)}" aria-pressed="${active}" aria-controls="${prefix}-detail" id="${prefix}-record-${safeId(report.id)}">
      <span class="rl-record-meta"><span class="rl-modality">${escape(modalityLabel(category(report)))}</span><span class="rl-record-arrow">${svg('arrow')}</span></span>
      <span class="rl-record-title">${escape(L(report.title))}</span>
      <span class="rl-record-date">${date}</span>
      <span class="rl-record-evidence">${escape(L(report.evidence))}</span>
      <span class="rl-record-organs">${escape((report.organs || []).map(organName).join(index ? ' · ' : ' / '))}</span>
    </button></li>`;
  }

  function renderList() {
    const dated = shown.filter(report => validDate(report.date));
    const undated = shown.filter(report => !validDate(report.date));
    recordList.innerHTML = `${dated.length ? `<h3 class="rl-list-heading">${t.chronology}</h3><ol class="rl-record-list">${dated.map(card).join('')}</ol>` : ''}
      ${undated.length ? `<div class="rl-undated"><h3 class="rl-list-heading">${t.undated}</h3><ol class="rl-record-list">${undated.map(card).join('')}</ol></div>` : ''}`;
  }

  function renderDetail() {
    const report = shown.find(item => item.id === selectedId);
    if (!report) { detail.replaceChildren(); return; }
    const pdf = localUrl(report.pdf), html = localUrl(report.html);
    const links = `${pdf ? `<a class="rl-button rl-button-primary" href="${escape(pdf)}" target="_blank" rel="noopener">${svg('file')}${t.pdf}${svg('arrow')}</a>` : ''}${html ? `<a class="rl-button" href="${escape(html)}" target="_blank" rel="noopener">${t.html}${svg('arrow')}</a>` : ''}`;
    const figures = (report.figures || []).filter(figure => localUrl(figure.src));
    const locatePrimary = typeof onSelectOrgan === 'function' && report.organs?.length ? `<button type="button" class="rl-button" data-rl-organ="${escape(report.organs[0])}">${svg('target')}${t.locate}</button>` : '';
    const titleId = `${prefix}-detail-title`;
    detail.setAttribute('aria-labelledby', titleId);
    detail.innerHTML = `<header class="rl-detail-header"><div class="rl-detail-top"><span class="rl-eyebrow">${t.selected}</span><span class="rl-modality">${escape(modalityLabel(category(report)))}</span></div>
      <h3 id="${titleId}" tabindex="-1">${escape(L(report.title))}</h3>
      <p class="rl-detail-date">${escape(dateText(report))}</p>
      <div class="rl-provenance"><span>${t.source}</span><strong>${escape(L(report.evidence))}</strong></div>
      ${links ? `<div class="rl-document-links" aria-label="${t.original}">${links}${locatePrimary}</div>` : ''}</header>
      <div class="rl-detail-body"><section class="rl-summary"><h4>${t.overview}</h4><p>${escape(L(report.summary))}</p></section>
      ${report.observations?.length ? `<section class="rl-observations"><h4>${t.observations}</h4><ol>${report.observations.map((observation, i) => `<li><span class="rl-observation-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><p>${escape(L(observation))}</p></li>`).join('')}</ol></section>` : ''}
      ${figures.length ? `<section class="rl-figures"><h4>${t.images}</h4>${figures.map((figure, i) => `<figure><button type="button" class="rl-figure-button" data-rl-figure="${i}" aria-label="${escape(`${t.enlarge}: ${L(figure.caption) || t.figure(i + 1)}`)}"><img src="${escape(localUrl(figure.src))}" alt="${escape(L(figure.caption) || t.figure(i + 1))}" loading="lazy" decoding="async"><span class="rl-figure-expand">${svg('expand')}${t.enlarge}</span></button><figcaption><span class="rl-figure-number">${t.figure(i + 1)}</span>${escape(L(figure.caption))}${figure.seriesReferences?.length ? `<small dir="auto">${escape(figure.seriesReferences.filter(ref => typeof ref === 'string').join(' · '))}</small>` : ''}</figcaption></figure>`).join('')}</section>` : ''}
      <section class="rl-locate"><div><h4>${t.locate}</h4><p>${t.mapNote}</p></div><div class="rl-locate-actions">${(report.organs || []).map(key => `<button type="button" class="rl-button" data-rl-organ="${escape(key)}" ${typeof onSelectOrgan === 'function' ? '' : 'disabled'}>${svg('target')}${escape(organName(key))}</button>`).join('')}</div></section></div>`;
    detail.querySelectorAll('.rl-figure-button img').forEach(img => img.addEventListener('error', () => {
      const button = img.closest('button');
      button.disabled = true;
      button.classList.add('has-image-error');
      img.hidden = true;
      const notice = element('span', 'rl-image-error');
      notice.textContent = t.missingImage;
      button.append(notice);
    }, { once: true, signal: controller.signal }));
  }

  function applyFilters() {
    shown = matchingRecords();
    if (!shown.some(report => report.id === selectedId)) selectedId = shown[0]?.id;
    count.textContent = t.result(shown.length);
    empty.hidden = shown.length > 0;
    workspace.hidden = shown.length === 0;
    renderList();
    renderDetail();
  }

  function selectReport(id, focusDetail = true) {
    if (!shown.some(report => report.id === id)) return false;
    selectedId = id;
    recordList.querySelectorAll('[data-rl-report]').forEach(button => {
      const active = button.dataset.rlReport === id;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderDetail();
    if (focusDetail) {
      detail.querySelector('h3').focus({ preventScroll: true });
      // Keep the chosen record visible next to its detail on wide screens.
      if (doc.defaultView.matchMedia('(max-width: 780px)').matches) detail.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    return true;
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-rl-report')) selectReport(button.dataset.rlReport);
    else if (button.hasAttribute('data-rl-filter')) {
      filter = button.dataset.rlFilter;
      root.querySelectorAll('[data-rl-filter]').forEach(item => {
        const active = item.dataset.rlFilter === filter;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    } else if (button.hasAttribute('data-rl-reset')) {
      query = ''; filter = 'all'; selectedOrgan = 'all'; search.value = ''; region.value = 'all';
      root.querySelectorAll('[data-rl-filter]').forEach(item => {
        const active = item.dataset.rlFilter === 'all';
        item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active));
      });
      applyFilters(); search.focus();
    } else if (button.hasAttribute('data-rl-organ')) {
      onSelectOrgan?.(button.dataset.rlOrgan);
    } else if (button.hasAttribute('data-rl-figure')) {
      const report = shown.find(item => item.id === selectedId);
      const figures = (report?.figures || []).filter(figure => localUrl(figure.src));
      const figure = figures[Number(button.dataset.rlFigure)];
      if (!figure) return;
      returnFocus = button;
      const img = lightbox.querySelector('img');
      img.src = localUrl(figure.src); img.alt = L(figure.caption);
      lightbox.querySelector('p').textContent = L(figure.caption);
      lightbox.showModal();
      lightbox.querySelector('button').focus();
    } else if (button.hasAttribute('data-rl-close')) lightbox.close();
  }, events);
  search.addEventListener('input', () => { query = search.value; applyFilters(); }, events);
  region.addEventListener('change', () => { selectedOrgan = region.value; applyFilters(); }, events);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      const rect = lightbox.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
    }
  }, events);
  lightbox.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); }, events);
  applyFilters();
  return {
    get selectedReportId() { return selectedId; },
    selectReport(id) {
      if (destroyed || !records.some(report => report.id === id)) return false;
      if (!shown.some(report => report.id === id)) {
        query = ''; filter = 'all'; selectedOrgan = 'all'; search.value = ''; region.value = 'all';
        root.querySelectorAll('[data-rl-filter]').forEach(item => {
          const active = item.dataset.rlFilter === 'all';
          item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active));
        });
        selectedId = id;
        applyFilters();
      }
      return selectReport(id);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (lightbox.open) lightbox.close();
      controller.abort();
      root.remove();
    },
  };
}
