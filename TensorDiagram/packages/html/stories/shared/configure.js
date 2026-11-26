/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

/**
 * @param args {Record<string, string>}
 * @param [options] {{captureKeystrokes?: boolean}} `captureKeystrokes`: make the container focusable and focus it on click.
 * Storybook captures the keystrokes while the focus is outside the story, so a `KeyHandler` only receives them once the
 * container has the focus. Defaults to `false`.
 * @return {HTMLDivElement}
 */
export const createGraphContainer = (args, options = {}) => {
  const container = document.createElement('div');
  const style = container.style;
  style.position = 'relative';
  style.overflow = 'hidden';
  style.width = `${args.width}px`;
  style.height = `${args.height}px`;
  style.background = 'url(./images/grid.gif)';
  style.cursor = 'default';

  if (options.captureKeystrokes) {
    container.setAttribute('tabindex', '0');
    container.addEventListener('click', () => {
      // Keep the focus on the label editor, which is inside the container
      if (!container.contains(document.activeElement)) {
        container.focus();
      }
    });
  }
  return container;
};

/**
 * Create a main div including a div with the description.
 *
 * @param htmlDescription {string} the description to be displayed in the main div
 * @returns {HTMLDivElement} the main div including a div with the description
 */
export function createMainDiv(htmlDescription) {
  const mainDiv = document.createElement('div');
  const divMessage = document.createElement('div');
  mainDiv.appendChild(divMessage);

  divMessage.innerHTML = htmlDescription;
  divMessage.style.fontFamily = 'Arial,Helvetica,sans-serif';
  divMessage.style.marginBottom = '1rem';

  return mainDiv;
}
