import { computed, Signal, signal } from '@angular/core';
import { assertUniqueStoreMembers } from './signal-store-assertions';
import { toDeepSignal } from './deep-signal';
import { STATE_SOURCE } from './state-source';
import {
  EmptyFeatureResult,
  InnerSignalStore,
  SignalsDictionary,
  SignalStoreFeature,
  SignalStoreFeatureResult,
} from './signal-store-models';

export function withState<State extends object>(
  stateFactory: () => State
): SignalStoreFeature<
  EmptyFeatureResult,
  { state: State; props: {}; methods: {} }
>;
export function withState<State extends object>(
  state: State
): SignalStoreFeature<
  EmptyFeatureResult,
  { state: State; props: {}; methods: {} }
>;
export function withState<State extends object>(
  stateOrFactory: State | (() => State)
): SignalStoreFeature<
  SignalStoreFeatureResult,
  { state: State; props: {}; methods: {} }
> {
  return (store) => {
    const state =
      typeof stateOrFactory === 'function' ? stateOrFactory() : stateOrFactory;
    const stateKeys = Reflect.ownKeys(state);

    assertUniqueStoreMembers(store, stateKeys);

    const stateAsRecord = state as Record<string | symbol, unknown>;
    const signals = store[STATE_SOURCE] as Record<
      string | symbol,
      Signal<unknown>
    >;
    const stateSignals = {} as SignalsDictionary;
    for (const key of stateKeys) {
      const signalValue = stateAsRecord[key];
      signals[key] = signal(signalValue);
      stateSignals[key] = toDeepSignal(signals[key]);
    }

    return {
      ...store,
      stateSignals: { ...store.stateSignals, ...stateSignals },
    } as InnerSignalStore<State>;
  };
}
