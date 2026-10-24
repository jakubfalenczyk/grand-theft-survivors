import '../../src/theme/index.css';
import './browser.css';
import MarkdownIt from 'markdown-it';

const copy = {
  project: 'Grand Theft Survivors',
  title: 'Planned work',
  game: 'Open game',
  search: 'Search task text',
  navigation: 'Tasks',
  overview: 'Overview and decisions',
  review: 'Design review',
  count: (visible: number, total: number) => `${visible} / ${total} documents`,
  empty: 'No matching documents. Try another search.',
  missing: 'This task does not exist. Choose a document from the list.',
  feedback: 'Your notes or new task idea',
  instructions: 'Copy your notes into the project chat. This page does not save or send them.',
  copy: 'Copy feedback',
  copied: 'Feedback copied. Paste it into the project chat.',
  failed: 'Copy is unavailable. Select and copy the prepared message below.',
  prepared: 'Prepared message',
  source: 'Read Markdown on GitHub',
  skip: 'Skip to document',
  licenses: 'Markdown renderer licenses',
};
const documents = Object.entries(
  import.meta.glob<string>('./*.md', { query: '?raw', import: 'default', eager: true }),
)
  .sort(([a], [b]) => {
    if (a === './README.md') return -1;
    if (b === './README.md') return 1;
    return a.localeCompare(b, 'en', { numeric: true });
  })
  .map(([path, content]) => ({
    key: path.slice(2, -3),
    title: /^# (.+)$/m.exec(content)?.[1] ?? path.slice(2, -3),
    content,
    status: /^> Status: ([^.]+)\./m.exec(content)?.[1] ?? copy.review,
  }));

const markdown = new MarkdownIt({ html: false });
const originalLink = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  const href = token.attrGet('href');
  if (typeof href === 'string' && !/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)) {
    const [file, fragment] = href.split('#');
    const target = documents.find((document) => `${document.key}.md` === file);
    token.attrSet(
      'href',
      target
        ? `#${encodeURIComponent(target.key)}`
        : new URL(
            href,
            'https://github.com/jakubfalenczyk/grand-theft-survivors/blob/main/docs/backlog/',
          ).href,
    );
    // Document links select the whole task; section fragments belong to Markdown sources.
    if (target && fragment) token.attrSet('title', fragment);
  }
  return originalLink
    ? originalLink(tokens, index, options, env, renderer)
    : renderer.renderToken(tokens, index, options);
};

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}
const root = document.querySelector('#backlog');
if (!root) throw new Error('Backlog mount is missing.');
const skip = element('a', copy.skip);
skip.href = '#document';
skip.className = 'skip';
const header = element('header');
header.append(element('p', copy.project), element('h1', copy.title));
const game = element('a', copy.game);
game.href = import.meta.env.BASE_URL;
game.className = 'kb-btn kb-btn--secondary';
header.append(game);
const layout = element('main');
const sidebar = element('aside');
const label = element('label', copy.search);
label.htmlFor = 'search';
const search = element('input');
search.id = 'search';
search.type = 'search';
const count = element('p');
count.setAttribute('role', 'status');
const nav = element('nav');
nav.setAttribute('aria-label', copy.navigation);
sidebar.append(label, search, count, nav);
const panel = element('section');
const article = element('article');
article.id = 'document';
article.tabIndex = -1;
const source = element('a', copy.source);
const feedback = element('section');
feedback.className = 'feedback';
const feedbackLabel = element('label', copy.feedback);
feedbackLabel.htmlFor = 'notes';
const notes = element('textarea');
notes.id = 'notes';
notes.rows = 4;
const button = element('button', copy.copy);
button.className = 'kb-btn';
button.type = 'button';
const status = element('p');
status.setAttribute('role', 'status');
const prepared = element('textarea');
prepared.readOnly = true;
prepared.hidden = true;
prepared.setAttribute('aria-label', copy.prepared);
feedback.append(feedbackLabel, notes, element('p', copy.instructions), button, status, prepared);
panel.append(article, source, feedback);
layout.append(sidebar, panel);
const licenses = element('a', copy.licenses);
licenses.href = `${import.meta.env.BASE_URL}licenses/backlog.txt`;
panel.append(licenses);
root.append(skip, header, layout);
let current: (typeof documents)[number] | undefined;
const drafts = new Map<string, string>();

function renderList() {
  const query = search.value.trim().toLocaleLowerCase('en');
  const visible = documents.filter((entry) =>
    entry.content.toLocaleLowerCase('en').includes(query),
  );
  count.textContent = copy.count(visible.length, documents.length);
  nav.replaceChildren();
  for (const entry of visible) {
    const link = element('a');
    link.href = `#${encodeURIComponent(entry.key)}`;
    link.append(
      element('small', entry.key === 'README' ? copy.overview : entry.status),
      element('span', entry.title),
    );
    if (entry === current) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  if (!visible.length) nav.append(element('p', copy.empty));
}
function showDocument(moveFocus = false) {
  if (current) drafts.set(current.key, notes.value);
  const key = location.hash.slice(1);
  current =
    documents.find((entry) => encodeURIComponent(entry.key) === key) ??
    (!key ? documents[0] : undefined);
  notes.value = current ? (drafts.get(current.key) ?? '') : '';
  article.innerHTML = current ? markdown.render(current.content) : '';
  if (!current) article.append(element('h2', copy.missing));
  document.title = `${current?.title ?? copy.title} | ${copy.project}`;
  source.hidden = !current;
  if (current)
    source.href = `https://github.com/jakubfalenczyk/grand-theft-survivors/blob/main/docs/backlog/${current.key}.md`;
  prepared.hidden = true;
  status.textContent = '';
  renderList();
  if (moveFocus) article.focus();
}
skip.addEventListener('click', (event) => {
  event.preventDefault();
  article.focus();
});
search.addEventListener('input', renderList);
window.addEventListener('hashchange', () => {
  showDocument(true);
});
button.addEventListener('click', async () => {
  prepared.value = `${current?.title ?? copy.title}\n${location.href}\n\n${notes.value.trim()}`;
  try {
    await navigator.clipboard.writeText(prepared.value);
    status.textContent = copy.copied;
  } catch {
    prepared.hidden = false;
    prepared.focus();
    prepared.select();
    status.textContent = copy.failed;
  }
});
showDocument();
