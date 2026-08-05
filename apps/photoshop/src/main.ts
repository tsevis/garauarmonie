/**
 * Garau Transparency — Photoshop UXP panel.
 *
 * Two tabs, both thin clients of the shared engine packages: **Composer**
 * (Metelli's four-zone tool, `@garau/engine`) and **Library** (the open
 * Augusto swatch system, `@garau/swatches`) — the same two the user's Rule
 * #2 asked this plugin to grow into, beyond the original forward/inverse
 * calculator.
 */
import { el } from './dom';
import { renderComposer } from './composer';
import { renderLibrary } from './library';

type Tab = 'composer' | 'library';

const tabs: { id: Tab; label: string; render: (root: HTMLElement) => void | Promise<void> }[] = [
  { id: 'composer', label: 'Composer', render: renderComposer },
  { id: 'library', label: 'Library', render: renderLibrary },
];

let activeTab: Tab = 'composer';

function build() {
  const root = document.getElementById('root')!;
  root.textContent = '';

  root.appendChild(el('h1', {}, 'Garau Transparency'));

  const tabBar = el('div', { class: 'toggle' });
  const content = el('div', {});

  const activate = (tab: Tab) => {
    activeTab = tab;
    for (const child of Array.from(tabBar.children)) {
      child.classList.toggle('on', child.getAttribute('data-tab') === tab);
    }
    void tabs.find((t) => t.id === tab)!.render(content);
  };

  for (const tab of tabs) {
    const button = el('button', { class: tab.id === activeTab ? 'on' : '', 'data-tab': tab.id }, tab.label);
    button.addEventListener('click', () => activate(tab.id));
    tabBar.appendChild(button);
  }
  root.appendChild(tabBar);
  root.appendChild(content);

  activate(activeTab);
}

build();
