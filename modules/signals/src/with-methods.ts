import { assertUniqueStoreMembers } from './signal-store-assertions';
import {
  EmptyFeatureResult,
  InnerSignalStore,
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
} from './signal-store-models';
import {
  RESOURCE_SOURCE,
  ResourceSource,
  STATE_SOURCE,
  WritableStateSource,
} from './state-source';
import { Prettify } from './ts-helpers';

export function withMethods<
  Input extends SignalStoreFeatureResult,
  Methods extends MethodsDictionary
>(
  methodsFactory: (
    store: Prettify<
      StateSignals<Input['state']> &
        Input['props'] &
        Input['methods'] &
        ResourceSource<Input['resources']> &
        WritableStateSource<Prettify<Input['state']>>
    >
  ) => Methods
): SignalStoreFeature<Input, EmptyFeatureResult & { methods: Methods }> {
  return (store) => {
    const methods = methodsFactory({
      [STATE_SOURCE]: store[STATE_SOURCE],
      ...store.stateSignals,
      ...store.props,
      ...store.methods,
      [RESOURCE_SOURCE]: store[RESOURCE_SOURCE],
    });
    assertUniqueStoreMembers(store, Reflect.ownKeys(methods));

    return {
      ...store,
      methods: { ...store.methods, ...methods },
    } as InnerSignalStore<Record<string, unknown>, SignalsDictionary, Methods>;
  };
}
