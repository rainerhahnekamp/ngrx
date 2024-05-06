import {
  EmptyFeatureResult,
  MergeFeatureResults,
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  SignalStoreSlices,
} from './signal-store-models';
import {
  signalStore,
  StateSignal,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed, Input } from '@angular/core';
import { build } from 'ng-packagr';
import { Prettify } from './ts-helpers';

declare function feature<F1 extends SignalStoreFeatureResult>(
  f1: SignalStoreFeature<EmptyFeatureResult, F1>
): SignalStoreFeature<EmptyFeatureResult, F1>;

interface Builder<Feature extends SignalStoreFeatureResult> {
  and<NewFeature extends SignalStoreFeatureResult>(
    f1: SignalStoreFeature<Feature, NewFeature>
  ): Builder<MergeFeatureResults<[Feature, NewFeature]>>;

  andState<State extends object>(
    stateOrFactory: State | (() => State)
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { state: State }]>
  >;

  andComputed<
    Signals extends SignalsDictionary,
    Input extends SignalStoreFeatureResult
  >(
    signalsFactory: (
      store: Prettify<SignalStoreSlices<Input['state']> & Input['signals']>
    ) => Signals
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { signals: Signals }]>
  >;

  andMethods<
    Input extends SignalStoreFeatureResult,
    Methods extends MethodsDictionary
  >(
    methodsFactory: (
      store: Prettify<
        SignalStoreSlices<Input['state']> &
          Input['signals'] &
          Input['methods'] &
          StateSignal<Prettify<Input['state']>>
      >
    ) => Methods
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { methods: Methods }]>
  >;

  build(): SignalStoreFeature<EmptyFeatureResult, Feature>;
}

declare function builder(): Builder<EmptyFeatureResult>;

export function signalStoreBuilder(
  builderFn: (
    builder: () => Builder<EmptyFeatureResult>
  ) => Builder<SignalStoreFeatureResult>
) {
  return signalStore(builderFn(builder).build());
}

const LargeStore = signalStore(
  builder()
    .andState({ id: 1 })
    .andMethods(() => ({
      load(id: number) {
        return true;
      },
    }))
    .andComputed((state) => ({
      prettyId: computed(() => state.id()),
    }))
    .andState({ name: 'Rainer' })
    .andComputed((state) => ({
      prettyName: computed(() => state.name()),
    }))
    .build()
);
const largeStore = new LargeStore();
const id = largeStore.id;
