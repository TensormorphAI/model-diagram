import type { AbstractGraph } from '@tensormorph/tensordiagramcore';

/** Anything holding resources outside the graph container: listeners on the document, popups, timers. */
export type Disposable = { destroy(): void } | { onDestroy(): void } | (() => void);

export interface DemoContext {
  /** Where the graph is drawn. Empty, focusable, sized by the layout. */
  container: HTMLElement;
  /** Side panel for a demo's extra UI: an outline, a text area, a legend. Hidden while empty. */
  side: HTMLElement;
  /** Adds a button to the demo toolbar. `action` names it for the end-to-end tests: `data-action="<action>"`. */
  button(label: string, onClick: () => void, action?: string): HTMLButtonElement;
  /** Writes a line to the event log panel. */
  log(message: string): void;
  /** Releases the resource when the user leaves the demo. Returns it, to allow `const x = ctx.dispose(new X())`. */
  dispose<T extends Disposable>(resource: T): T;
  /** Exposes the main graph of the demo to the end-to-end tests, and destroys it when leaving the demo. */
  useGraph<T extends AbstractGraph>(graph: T): T;
}

export interface Demo {
  /** Stable, used in the URL hash: `#/<id>`. */
  id: string;
  title: string;
  group: string;
  description: string;
  /** What to try in the demo, shown as a list above it. */
  hints: string[];
  mount(ctx: DemoContext): void;
}
