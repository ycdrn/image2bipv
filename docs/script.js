const comparison = document.getElementById('comparison');
const reveal = document.getElementById('reveal');
function setReveal(value) {
  const percentage = Math.max(0, Math.min(100, value));
  reveal.value = percentage;
  comparison.style.setProperty('--reveal', `${percentage}%`);
}
reveal.addEventListener('input', () => setReveal(Number(reveal.value)));

// Capture the pointer so dragging continues even outside the image.
let dragPointer = null;
function revealAtPointer(event) {
  const bounds = comparison.getBoundingClientRect();
  if (bounds.width) setReveal((event.clientX - bounds.left) / bounds.width * 100);
}
comparison.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  dragPointer = event.pointerId;
  comparison.setPointerCapture(event.pointerId);
  revealAtPointer(event);
});
comparison.addEventListener('pointermove', event => {
  if (event.pointerId === dragPointer) revealAtPointer(event);
});
function endComparisonDrag(event) {
  if (event.pointerId !== dragPointer) return;
  dragPointer = null;
  if (comparison.hasPointerCapture(event.pointerId)) comparison.releasePointerCapture(event.pointerId);
}
comparison.addEventListener('pointerup', endComparisonDrag);
comparison.addEventListener('pointercancel', endComparisonDrag);
comparison.addEventListener('lostpointercapture', () => { dragPointer = null; });
const copy = document.getElementById('copy');
copy.addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(document.getElementById('bibtex').textContent);
    status.textContent = 'BibTeX copied to clipboard.';
    copy.textContent = 'Copied ✓';
    setTimeout(() => { copy.textContent = 'Copy BibTeX ⧉'; }, 2500);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('bibtex'));
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
  }
});

// Facade gallery: keep every image paired with its category, facade, and view.
const categorySelect = document.getElementById('building-category');
const coverageSelect = document.getElementById('coverage-option');
const viewSelect = document.getElementById('facade-view');
const gallery = document.getElementById('facade-gallery');
const categoryLabels = { '1110': 'Single-family house', '1121': 'Detached house', '1122': 'Multi-family house', '12xx': 'Office/Public' };
const coverageLabels = { full: 'Full coverage', automatic: 'Automatic layout', low: 'Low coverage' };

function galleryFigure(path, caption, alt, isOriginal = false) {
  const figure = document.createElement('figure');
  const frame = document.createElement('div');
  frame.className = 'facade-image-frame';
  if (path) {
    const link = document.createElement('a');
    link.href = path;
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = 'Open full-size image';
    const img = document.createElement('img');
    img.src = path;
    img.alt = alt;
    img.loading = 'lazy';
    if (isOriginal) img.classList.add('original-facade');
    img.addEventListener('error', () => {
      frame.replaceChildren();
      const error = document.createElement('p');
      error.className = 'facade-unavailable';
      error.textContent = 'This image could not be loaded.';
      frame.append(error);
    }, { once: true });
    link.append(img);
    frame.append(link);
  } else {
    const message = document.createElement('p');
    message.className = 'facade-unavailable';
    message.textContent = 'This view is not available for this example.';
    frame.append(message);
  }
  const label = document.createElement('figcaption');
  label.textContent = caption;
  figure.append(frame, label);
  return figure;
}

// One curated facade per category; source images for other examples are retained.
const selectedExamples = { '1122': '2', '1121': '2', '1110': '1', '12xx': '1' };

function renderGallery() {
  const category = categorySelect.value;
  const coverage = coverageSelect.value;
  const view = viewSelect.value;
  const examples = window.facadeExamples.filter(example => example.category === category && example.example === selectedExamples[category]);
  const fragment = document.createDocumentFragment();
  for (const example of examples) {
    const card = document.createElement('article');
    card.className = 'facade-example';
    const heading = document.createElement('h3');
    heading.textContent = categoryLabels[category];
    const identifier = document.createElement('p');
    identifier.className = 'facade-id';
    identifier.textContent = example.id;
    const pair = document.createElement('div');
    pair.className = 'facade-pair';
    const viewLabel = view === 'rectified' ? 'Rectified' : 'Perspective';
    pair.append(
      galleryFigure(example.original[view], `Original · ${viewLabel}`, `Original facade ${example.id}, ${viewLabel.toLowerCase()} view`, true),
      galleryFigure(example.coverage[coverage][view], `${coverageLabels[coverage]} · ${viewLabel}`, `${coverageLabels[coverage]} retrofit of facade ${example.id}, ${viewLabel.toLowerCase()} view`)
    );
    card.append(heading, identifier, pair);
    fragment.append(card);
  }
  gallery.replaceChildren(fragment);
  document.getElementById('gallery-summary').textContent =
    `${categoryLabels[category]} · ${coverageLabels[coverage]} · ${view === 'rectified' ? 'Rectified' : 'Perspective'} view. Select an image to open it full size.`;
}
// The first comparison uses facade 151359_0_v1, independently of the gallery.
const heroCoverageButtons = document.querySelectorAll('[data-hero-coverage]');
const heroExample = window.facadeExamples.find(example => example.id === '151359_0_v1');
function updateHeroCoverage(coverage) {
  const image = document.getElementById('hero-retrofit');
  image.src = heroExample.coverage[coverage].perspective;
  image.alt = `${coverageLabels[coverage]} retrofit of facade ${heroExample.id}`;
  document.getElementById('hero-retrofit-label').textContent = coverageLabels[coverage];
  for (const button of heroCoverageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.heroCoverage === coverage));
  }
}
if (heroExample) {
  for (const button of heroCoverageButtons) {
    button.addEventListener('click', () => updateHeroCoverage(button.dataset.heroCoverage));
  }
  updateHeroCoverage('automatic');
}

if (categorySelect && coverageSelect && viewSelect && window.facadeExamples) {
  for (const select of [categorySelect, coverageSelect, viewSelect]) select.addEventListener('change', renderGallery);
  renderGallery();
}
