import { ViewportMetrics } from "../types";

export type ScrollHandler = (viewport: ViewportMetrics) => void;

export interface ScrollControlOptions {
  mode: 'debounce' | 'throttle';
  wait: number;
}

export class ScrollControl {
  private timeoutId?: number;
  private lastRun: number = 0;

  constructor(
    private handler: ScrollHandler,
    private options: ScrollControlOptions
  ) {}

  handle = (viewport: ViewportMetrics): void => {
    if (this.options.mode === 'debounce') {
      this.debounce(viewport);
    } else {
      this.throttle(viewport);
    }
  };

  private debounce(viewport: ViewportMetrics): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = window.setTimeout(() => {
      this.handler(viewport);
      this.timeoutId = undefined;
    }, this.options.wait);
  }

  private throttle(viewport: ViewportMetrics): void {
    const now = Date.now();
    
    if (now - this.lastRun >= this.options.wait) {
      this.handler(viewport);
      this.lastRun = now;
    }
  }

  destroy(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
  }
}