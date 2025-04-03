/** Represents an action with a type and optional payload */
export interface Action {
  type: string;
  payload?: any;
}

/** A reducer function that updates a specific state based on an action */
export type Reducer<State, Action> = (state: State, action: Action) => State;

/** Represents the overall store state, with a typed core and plugin states */
export interface StoreState<CoreState> {
  core: CoreState;
  plugins: Record<string, any>; // Plugin states indexed by plugin ID
}