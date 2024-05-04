import {
  EmptyFeatureResult,
  MergeFeatureResults,
  SignalStoreFeature,
  SignalStoreFeatureResult,
} from './signal-store-models';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';

declare function feature<F1 extends SignalStoreFeatureResult>(
  f1: SignalStoreFeature<EmptyFeatureResult, F1>
): SignalStoreFeature<EmptyFeatureResult, F1>;

interface Builder<Feature extends SignalStoreFeatureResult> {
  and<NewFeature extends SignalStoreFeatureResult>(
    f1: SignalStoreFeature<Feature, NewFeature>
  ): Builder<MergeFeatureResults<[Feature, NewFeature]>>;

  build(): SignalStoreFeature<EmptyFeatureResult, Feature>;
}

declare function builder(): Builder<EmptyFeatureResult>;

const LargeStore = signalStore(
  builder()
    .and(withState({ id: 1 }))
    .and(
      withMethods((store) => ({
        load(id: number) {
          return true;
        },
      }))
    )
    .and(
      withComputed((state) => ({
        prettyId: computed(() => state.id()),
      }))
    )
    .and(withState({ name: 'Rainer' }))
    .and(
      withComputed((state) => ({
        prettyName: computed(() => state.name()),
      }))
    )
    .build()
);

const largeStore = new LargeStore();
