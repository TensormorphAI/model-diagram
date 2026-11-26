import '@tensormorph/tensordiagramcore/css/common.css';
import {
  constants,
  InternalEvent,
  type AbstractGraph,
} from '@tensormorph/tensordiagramcore';
import './style.css';
import { demos } from './demos/index.js';
import { loadTranslations, resetGlobalState } from './reset.js';
import type { Demo, DemoContext, Disposable } from './types.js';

/** Read by the end-to-end tests, see e2e/smoke.mjs. */
interface ShowcaseHook {
  version: string;
  demoIds: string[];
  currentDemoId?: string;
  graph?: AbstractGraph;
  /** Error thrown by the mount function of the current demo, if any. */
  mountError?: string;
}
declare global {
  interface Window {
    __showcase: ShowcaseHook;
  }
}

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const nav = byId<HTMLElement>('nav');
const title = byId<HTMLElement>('demo-title');
const description = byId<HTMLElement>('demo-description');
const hints = byId<HTMLUListElement>('demo-hints');
const toolbar = byId<HTMLElement>('demo-toolbar');
const stage = byId<HTMLElement>('stage');
const side = byId<HTMLElement>('side');
const logList = byId<HTMLOListElement>('log');

const hook: ShowcaseHook = (window.__showcase = {
  version: constants.VERSION,
  demoIds: demos.map((demo) => demo.id),
});
byId('version').textContent = `v${constants.VERSION}`;

const log = (message: string): void => {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString()}  ${message}`;
  logList.prepend(item);
  // keep the panel bounded, a demo logging on mouse moves would grow it forever
  while (logList.childElementCount > 200) logList.lastElementChild?.remove();
};
byId('clear-log').addEventListener('click', () => logList.replaceChildren());

// Navigation, grouped in the order of the demos
const groups = new Map<string, Demo[]>();
for (const demo of demos)
  groups.set(demo.group, [...(groups.get(demo.group) ?? []), demo]);
for (const [group, groupDemos] of groups) {
  const heading = document.createElement('h2');
  heading.textContent = group;
  const list = document.createElement('ul');
  for (const demo of groupDemos) {
    const link = document.createElement('a');
    link.href = `#/${demo.id}`;
    link.textContent = demo.title;
    link.dataset.demo = demo.id;
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  nav.append(heading, list);
}

let disposables: Disposable[] = [];

const disposeAll = (): void => {
  // reverse order: a resource may depend on one created before it, typically anything built on the graph
  for (const resource of disposables.reverse()) {
    try {
      if (typeof resource === 'function') resource();
      else if ('destroy' in resource) resource.destroy();
      else resource.onDestroy();
    } catch (error) {
      reportError(error); // keep releasing the others
    }
  }
  disposables = [];
  hook.graph = undefined;
};

const mount = (demo: Demo): void => {
  disposeAll();
  resetGlobalState();

  // A new container per demo: handlers of the previous graph may still reference the old one
  const container = document.createElement('div');
  container.className = 'graph-container';
  // Focusable, so that a KeyHandler bound to the document only acts once the user clicked into the diagram
  container.tabIndex = 0;
  container.addEventListener('click', () => {
    // keep the focus on the in-place label editor, which lives inside the container
    if (!container.contains(document.activeElement)) container.focus();
  });
  InternalEvent.disableContextMenu(container);
  stage.replaceChildren(container);
  side.replaceChildren();
  toolbar.replaceChildren();

  title.textContent = demo.title;
  description.textContent = demo.description;
  hints.replaceChildren(
    ...demo.hints.map((hint) => {
      const item = document.createElement('li');
      item.textContent = hint;
      return item;
    })
  );
  for (const link of nav.querySelectorAll<HTMLAnchorElement>('a')) {
    link.toggleAttribute('aria-current', link.dataset.demo === demo.id);
  }
  document.title = `${demo.title} · TensorDiagram showcase`;

  const ctx: DemoContext = {
    container,
    side,
    button(label, onClick, action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      if (action) button.dataset.action = action;
      button.addEventListener('click', () => {
        try {
          onClick();
        } catch (error) {
          log(`Error in "${label}": ${String(error)}`);
          reportError(error);
        }
      });
      toolbar.append(button);
      return button;
    },
    log,
    dispose(resource) {
      disposables.push(resource);
      return resource;
    },
    useGraph(graph) {
      disposables.push(graph);
      hook.graph = graph;
      return graph;
    },
  };

  hook.currentDemoId = demo.id;
  hook.mountError = undefined;
  try {
    demo.mount(ctx);
    log(`Demo "${demo.title}" loaded`);
  } catch (error) {
    hook.mountError = String(error);
    const message = document.createElement('pre');
    message.className = 'mount-error';
    message.textContent = `This demo failed to load:\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}`;
    stage.replaceChildren(message);
    reportError(error);
  }
};

const route = (): void => {
  const id = location.hash.replace(/^#\/?/, '');
  const demo = demos.find((candidate) => candidate.id === id);
  if (demo) mount(demo);
  else location.replace(`#/${demos[0].id}`); // fires hashchange, which mounts the first demo
};

// Not awaited: a demo works without them, only some messages stay untranslated until they arrive
void loadTranslations();
window.addEventListener('hashchange', route);
route();
