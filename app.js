'use strict';
const panelButtons = [...document.querySelectorAll('[data-panel]')];
panelButtons.forEach(button => button.addEventListener('click', () => {
  panelButtons.forEach(item => {
    const active = item === button;
    item.setAttribute('aria-pressed', String(active));
    document.getElementById(item.dataset.panel).hidden = !active;
  });
}));
const dialog = document.querySelector('#image-dialog');
function showImage(src, caption) {
  const image = document.querySelector('#dialog-image');
  image.src = src;
  image.alt = caption;
  document.querySelector('#dialog-caption').textContent = caption;
  dialog.showModal();
}
const images = Array.isArray(window.VOYAGE_GALLERY) ? window.VOYAGE_GALLERY : [];
const sceneName = item => item.port + ' / ' + item.location;
const grid = document.querySelector('#gallery-grid');
const category = document.querySelector('#category-filter');
const situation = document.querySelector('#situation-filter');
const previous = document.querySelector('#previous-page');
const next = document.querySelector('#next-page');
const pageSize = 8;
let page = 0;
[...new Set(images.map(item => item.kind))].forEach(kind => {
  const group = document.createElement('optgroup'); group.label = kind;
  [...new Set(images.filter(item => item.kind === kind).map(sceneName))].forEach(name => {
    const option = document.createElement('option'); option.value = kind + '|' + name; option.textContent = name; group.append(option);
  });
  category.append(group);
});
function render(reset = false) {
  if (reset) page = 0;
  const items = images.filter(item => (category.value === 'all' || item.kind + '|' + sceneName(item) === category.value) && (situation.value === 'all' || item.mood === situation.value));
  const pages = Math.ceil(items.length / pageSize);
  page = Math.max(0, Math.min(page, pages - 1));
  grid.replaceChildren();
  items.slice(page * pageSize, (page + 1) * pageSize).forEach(item => {
    const caption = sceneName(item) + '\n' + item.mood + ' · ' + item.description;
    const button = document.createElement('button');
    button.className = 'gallery-item';
    button.type = 'button';
    button.setAttribute('aria-label', caption + ' 크게 보기');
    const image = document.createElement('img');
    image.src = item.src;
    image.alt = item.port + ' ' + item.location + ' · ' + item.description;
    image.width = 608;
    image.height = 416;
    image.loading = 'lazy';
    const label = document.createElement('span');
    label.className = 'scene-location'; label.textContent = sceneName(item);
    button.append(image, label);
    button.addEventListener('click', () => showImage(item.src, caption));
    grid.append(button);
  });
  previous.disabled = page === 0;
  next.disabled = page + 1 >= pages;
  document.querySelector('#gallery-count').textContent = '모두 ' + items.length + '장';
  document.querySelector('#page-number').textContent = pages ? (page + 1) + ' / ' + pages + ' 쪽' : '0 / 0 쪽';
  document.querySelector('#empty-gallery').hidden = items.length > 0;
  document.dispatchEvent(new Event('gallery-rendered'));
}
category.addEventListener('change', () => render(true));
situation.addEventListener('change', () => render(true));
previous.addEventListener('click', () => { page--; render(); });
next.addEventListener('click', () => { page++; render(); });
render(true);
if (new URLSearchParams(location.search).get('player') === '1') {
  document.body.classList.add('music-only');
  document.querySelector('[data-panel="music"]').click();
  document.title = '음악실 · 다음 출항은 언제입니까?';
}
