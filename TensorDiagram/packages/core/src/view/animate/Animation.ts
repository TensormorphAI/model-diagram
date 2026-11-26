/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import EventSource from '../event/EventSource.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';

/**
 * Implements a basic animation in JavaScript.
 *
 * @category Animation
 */
class Animation extends EventSource {
  constructor(delay = 20) {
    super();
    this.delay = delay;
  }

  /**
   * Specifies the delay between the animation steps.
   * @default 20ms
   */
  delay: number;

  /**
   * Reference to the thread while the animation is running.
   */
  thread: number | null = null;

  /**
   * Returns true if the animation is running.
   */
  isRunning(): boolean {
    return this.thread != null;
  }

  /**
   * Starts the animation by repeatedly invoking updateAnimation.
   */
  startAnimation(): void {
    if (this.thread == null) {
      this.thread = window.setInterval(this.updateAnimation.bind(this), this.delay);
    }
  }

  /**
   * Hook for subclassers to implement the animation. Invoke stopAnimation
   * when finished, startAnimation to resume. This is called whenever the
   * timer fires and fires an mxEvent.EXECUTE event with no properties.
   */
  updateAnimation(): void {
    this.fireEvent(new EventObject(InternalEvent.EXECUTE));
  }

  /**
   * Stops the animation by deleting the timer and fires an {@link Event#DONE}.
   */
  stopAnimation(): void {
    if (this.thread != null) {
      window.clearInterval(this.thread);
      this.thread = null;
      this.fireEvent(new EventObject(InternalEvent.DONE));
    }
  }
}

export default Animation;
