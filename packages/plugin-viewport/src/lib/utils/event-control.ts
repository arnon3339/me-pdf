import { ViewportMetrics } from "../types";

export type EventHandler = (viewport: ViewportMetrics) => void;

export interface EventControlOptions {
  mode: 'debounce' | 'throttle';
  wait: number;
}

export class EventControl {
  private timeoutId?: number;
  private lastRun: number = 0;

  constructor(
    private handler: EventHandler,
    private options: EventControlOptions
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
      
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = undefined;
      }
    } else {
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
      }
      
      this.timeoutId = window.setTimeout(() => {
        this.handler(viewport);
        this.lastRun = Date.now();
        this.timeoutId = undefined;
      }, this.options.wait - (now - this.lastRun));
    }
  }

  destroy(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
  }
}