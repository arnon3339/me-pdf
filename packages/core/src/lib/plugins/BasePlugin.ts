import { IPlugin } from '../types/plugin';
import { IPDFCore } from '../types/core';

type StateCallback<T> = (state: T) => void;

export abstract class BasePlugin<TState extends Record<string, any> = Record<string, any>> implements IPlugin {
  abstract readonly name: string;
  abstract readonly version: string;
  
  protected core?: IPDFCore;
  protected state: TState;
  private subscribers: Set<StateCallback<TState>> = new Set();

  constructor(initialState: TState = {} as TState) {
    this.state = initialState;
  }

  async initialize(core: IPDFCore): Promise<void> {
    this.core = core;
  }

  async destroy(): Promise<void> {
    this.subscribers.clear();
    this.core = undefined;
  }

  getState(): TState {
    return { ...this.state };
  }

  setState(newState: Partial<TState>): void {
    Object.assign(this.state, newState);
    this.notifySubscribers();
    this.core?.emit(`${this.name}:stateChange`, this.state);
  }

  subscribe(callback: StateCallback<TState>): () => void {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.getState());
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const currentState = this.getState();
    this.subscribers.forEach(callback => callback(currentState));
  }
} 