import type { CustomComponent } from './types';

export function defineComponent<
  TInit,
  TProps,
  TStore = any
>() {
  return <
    C extends CustomComponent<TStore> & {
      initialState: TInit;
      props: (init: TInit) => TProps;
      mapStateToProps: (storeState: TStore, ownProps: TProps) => TProps;
    }
  >(c: C) => c;
}