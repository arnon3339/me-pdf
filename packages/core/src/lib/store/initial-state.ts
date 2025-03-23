import { Action } from "./types";

export interface CoreState {
  document: {
    content: string | null;
    loading: boolean;
  };
}

export const initialCoreState: CoreState = {
  document: {
    content: null,
    loading: false,
  },
};

// Core actions
export type CoreAction =
  | { type: 'LOAD_DOCUMENT'; payload: string }
  | { type: 'SET_DOCUMENT'; payload: string };