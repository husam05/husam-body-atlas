/** Search only the selectable anatomy supplied by the atlas. No patient text is indexed. */
export function normalizeAnatomyQuery(value) {
  return String(value).normalize('NFKD').toLowerCase()
    .replace(/\p{M}/gu, '').replace(/\u0640/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .trim().replace(/\s+/g, ' ');
}

export function searchAnatomy(entries, query) {
  const words = normalizeAnatomyQuery(query).split(' ').filter(Boolean);
  return entries.filter(entry => {
    const names = normalizeAnatomyQuery([...entry.label, ...(entry.short || [])].join(' '));
    return words.every(word => names.includes(word));
  });
}

const copy = {
  en: {
    label: 'Find anatomy', placeholder: 'English / العربية',
    hint: 'Search the four selectable structures. Use arrow keys to browse, Enter to select, and Escape to close.',
    empty: 'No matching structures', results: 'Matching structures',
    count: count => `${count} matching ${count === 1 ? 'structure' : 'structures'}`,
  },
  ar: {
    label: 'ابحث عن عضو', placeholder: 'العربية / English',
    hint: 'ابحث ضمن الأعضاء الأربعة المتاحة. استخدم الأسهم للتنقل، وزر الإدخال للاختيار، وزر الهروب للإغلاق.',
    empty: 'لا توجد أعضاء مطابقة', results: 'الأعضاء المطابقة',
    count: count => `عدد الأعضاء المطابقة: ${count}`,
  },
};

/**
 * Mount once into a persistent host outside any patchHTML-managed subtree.
 * entries: [{ id, label: [English, Arabic], short?: [English, Arabic] }]
 * lang: 'en' | 'ar'; selectedId: current organ; onSelect(id): atlas navigation.
 * The caller owns ending tours and focusing the selected organ control.
 * update({ lang, selectedId }) preserves the input node, query and text selection.
 */
export function createAnatomySearch({ host, entries, lang = 'en', selectedId, onSelect }) {
  if (!host?.id) throw new Error('Anatomy search needs a persistent host with a unique id.');
  const doc = host.ownerDocument;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const prefix = `${host.id}-search`;
  const element = (tag, className, attributes = {}) => {
    const node = doc.createElement(tag);
    node.className = className;
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  };
  const root = element('div', 'anatomy-search');
  const label = element('label', 'anatomy-search-label', { for: `${prefix}-input` });
  const field = element('div', 'anatomy-search-field');
  const input = element('input', 'anatomy-search-input', {
    id: `${prefix}-input`, type: 'text', role: 'combobox', autocomplete: 'off',
    spellcheck: 'false', dir: 'auto', 'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox', 'aria-expanded': 'false',
    'aria-controls': `${prefix}-results`, 'aria-describedby': `${prefix}-hint`,
  });
  const popup = element('div', 'anatomy-search-popup');
  const list = element('ul', 'anatomy-search-results', { id: `${prefix}-results`, role: 'listbox' });
  const empty = element('p', 'anatomy-search-empty');
  const hint = element('p', 'anatomy-search-sr', { id: `${prefix}-hint` });
  const status = element('p', 'anatomy-search-sr', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  popup.hidden = true;
  popup.append(list, empty);
  field.append(input, popup);
  root.append(label, field, hint, status);
  host.append(root);

  let language = lang === 'ar' ? 'ar' : 'en';
  let selected = selectedId;
  let matches = [], active = -1, open = false;

  function activeOption(index, scroll = false) {
    active = index;
    [...list.children].forEach((option, i) => {
      option.classList.toggle('is-active', i === active);
      option.setAttribute('aria-selected', String(i === active));
    });
    if (open && list.children[active]) {
      input.setAttribute('aria-activedescendant', list.children[active].id);
      if (scroll) list.children[active].scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } else input.removeAttribute('aria-activedescendant');
  }

  function renderResults() {
    const previousId = matches[active]?.id;
    matches = searchAnatomy(entries, input.value);
    list.replaceChildren(...matches.map((entry, index) => {
      const option = element('li', 'anatomy-search-option', {
        id: `${prefix}-option-${index}`, role: 'option', 'data-search-index': String(index),
      });
      const name = element('bdi', 'anatomy-search-name', { dir: language === 'ar' ? 'rtl' : 'ltr' });
      name.textContent = entry.label[language === 'ar' ? 1 : 0];
      option.append(name);
      option.classList.toggle('is-current', entry.id === selected);
      return option;
    }));
    empty.hidden = matches.length > 0;
    const kept = matches.findIndex(entry => entry.id === previousId);
    activeOption(kept >= 0 ? kept : -1);
    if (open) status.textContent = matches.length ? copy[language].count(matches.length) : copy[language].empty;
  }

  function show() {
    open = true;
    popup.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    renderResults();
  }

  function close() {
    open = false;
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    activeOption(-1);
    status.textContent = '';
  }

  function choose(index) {
    const entry = matches[index];
    if (!entry) return;
    selected = entry.id;
    close();
    onSelect(entry.id);
  }

  function update({ lang: nextLang = language, selectedId: nextSelected = selected } = {}) {
    language = nextLang === 'ar' ? 'ar' : 'en';
    selected = nextSelected;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    const text = copy[language];
    label.textContent = text.label;
    input.placeholder = text.placeholder;
    hint.textContent = text.hint;
    list.setAttribute('aria-label', text.results);
    empty.textContent = text.empty;
    renderResults();
  }

  input.addEventListener('focus', show, options);
  input.addEventListener('click', () => { if (!open) show(); }, options);
  input.addEventListener('input', () => { active = -1; show(); }, options);
  input.addEventListener('keydown', event => {
    // Let IME candidate selection finish without selecting anatomy or moving the camera.
    if (event.isComposing || event.keyCode === 229) { event.stopPropagation(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!open) show();
      if (matches.length) activeOption(event.key === 'ArrowDown'
        ? (active + 1) % matches.length : (active < 0 ? matches.length - 1 : (active - 1 + matches.length) % matches.length), true);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      event.stopPropagation();
      // A single filtered result can be chosen directly; multiple results require navigation.
      choose(active >= 0 ? active : matches.length === 1 ? 0 : -1);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') close();
  }, options);
  // Keep focus on the combobox during pointer selection, as required by aria-activedescendant.
  list.addEventListener('mousedown', event => event.preventDefault(), options);
  list.addEventListener('click', event => {
    const option = event.target.closest('[data-search-index]');
    if (option && list.contains(option)) choose(Number(option.dataset.searchIndex));
  }, options);
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) close();
  }, options);
  doc.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); }, options);
  update();

  return {
    update,
    close,
    destroy() { controller.abort(); root.remove(); },
  };
}
