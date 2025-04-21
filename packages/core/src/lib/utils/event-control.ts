export type EventHandler<T> = (data: T) => void;

export interface EventControlOptions {
  mode: 'debounce' | 'throttle';
  wait: number;
}

export class EventControl<T> {
  private timeoutId?: number;
  private lastRun: number = 0;

  constructor(
    private handler: EventHandler<T>,
    private options: EventControlOptions
  ) {}

  handle = (data: T): void => {
    if (this.options.mode === 'debounce') {
      this.debounce(data);
    } else {
      this.throttle(data);
    }
  };

  private debounce(data: T): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = window.setTimeout(() => {
      this.handler(data);
      this.timeoutId = undefined;
    }, this.options.wait);
  }

  private throttle(data: T): void {
    const now = Date.now();
    
    if (now - this.lastRun >= this.options.wait) {
      this.handler(data);
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
        this.handler(data);
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