const allowedTags = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DIV',
  'EM',
  'H1',
  'H2',
  'H3',
  'I',
  'LI',
  'OL',
  'P',
  'PRE',
  'S',
  'SPAN',
  'STRIKE',
  'STRONG',
  'U',
  'UL',
]);

function sanitizeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
  if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

  const source = node;
  if (!allowedTags.has(source.tagName)) {
    const fragment = document.createDocumentFragment();
    source.childNodes.forEach((child) => fragment.append(sanitizeNode(child)));
    return fragment;
  }

  const element = document.createElement(source.tagName.toLowerCase());
  if (source.tagName === 'A') {
    const href = source.getAttribute('href') || '';
    if (/^(https?:|mailto:)/i.test(href)) element.setAttribute('href', href);
  }

  const style = source.getAttribute('style') || '';
  const textAlign = style.match(/(?:^|;)\s*text-align:\s*(left|center|right|justify)\s*(?:;|$)/i);
  if (textAlign) element.style.textAlign = textAlign[1].toLowerCase();

  for (const property of ['color', 'background-color']) {
    const declaration = style
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.toLowerCase().startsWith(`${property}:`));
    const value = declaration?.slice(declaration.indexOf(':') + 1).trim();
    if (value && /^(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\))$/i.test(value)) {
      element.style.setProperty(property, value);
    }
  }

  source.childNodes.forEach((child) => element.append(sanitizeNode(child)));
  return element;
}

export function sanitizeRichText(value = '') {
  const source = String(value);
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  const hasMarkup = /<\/?[a-z][^>]*>/i.test(source);
  const root = document.createElement('div');

  if (!hasMarkup) {
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index > 0) root.append(document.createElement('br'));
      root.append(document.createTextNode(line));
    });
  } else {
    parsed.body.childNodes.forEach((node) => root.append(sanitizeNode(node)));
  }

  return root.innerHTML;
}

export function getRichTextPlainText(value = '') {
  const parsed = new DOMParser().parseFromString(String(value), 'text/html');
  return (parsed.body.textContent || '').replace(/\u00a0/g, ' ').trim();
}
