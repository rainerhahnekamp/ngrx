import {
  EmptyFeatureResult,
  MergeFeatureResults,
  MethodsDictionary,
  SignalsDictionary,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  SignalStoreProps,
  SignalStoreSlices,
} from './signal-store-models';
import {
  signalStore,
  StateSignal,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Type } from '@angular/core';
import { Prettify } from './ts-helpers';

interface Builder<Feature extends SignalStoreFeatureResult> {
  add<NewFeature extends SignalStoreFeatureResult>(
    f1: SignalStoreFeature<Feature, NewFeature>
  ): Builder<MergeFeatureResults<[Feature, NewFeature]>>;

  addState<State extends object>(
    stateOrFactory: State | (() => State)
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { state: State }]>
  >;

  addComputed<Signals extends SignalsDictionary>(
    signalsFactory: (
      store: Prettify<SignalStoreSlices<Feature['state']> & Feature['signals']>
    ) => Signals
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { signals: Signals }]>
  >;

  addMethods<Methods extends MethodsDictionary>(
    methodsFactory: (
      store: Prettify<
        SignalStoreSlices<Feature['state']> &
          Feature['signals'] &
          Feature['methods'] &
          StateSignal<Prettify<Feature['state']>>
      >
    ) => Methods
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { methods: Methods }]>
  >;

  build(): Type<
    SignalStoreProps<Feature> & StateSignal<Prettify<Feature['state']>>
  >;
}

class BuilderImpl<Feature extends SignalStoreFeatureResult>
  implements Builder<Feature>
{
  features = new Array<SignalStoreFeature>();

  add<NewFeature extends SignalStoreFeatureResult>(
    f1: SignalStoreFeature<Feature, NewFeature>
  ): Builder<MergeFeatureResults<[Feature, NewFeature]>> {
    this.features.push(f1 as SignalStoreFeature);
    return this;
  }

  addState<State extends object>(
    stateOrFactory: State | (() => State)
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { state: State }]>
  > {
    this.features.push(withState(stateOrFactory));
    return this as any;
  }

  addComputed<Signals extends SignalsDictionary>(
    signalsFactory: (
      store: Prettify<SignalStoreSlices<Feature['state']> & Feature['signals']>
    ) => Signals
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { signals: Signals }]>
  > {
    return this.add(withComputed(signalsFactory));
  }

  addMethods<Methods extends MethodsDictionary>(
    methodsFactory: (
      store: Prettify<
        SignalStoreSlices<Feature['state']> &
          Feature['signals'] &
          Feature['methods'] &
          StateSignal<Prettify<Feature['state']>>
      >
    ) => Methods
  ): Builder<
    MergeFeatureResults<[Feature, EmptyFeatureResult & { methods: Methods }]>
  > {
    return this.add(withMethods(methodsFactory));
  }

  build(): Type<
    SignalStoreProps<Feature> & StateSignal<Prettify<Feature['state']>>
  > {
    return (signalStore as (...features: SignalStoreFeature[]) => unknown)(
      ...this.features
    ) as any;
  }
}

export function signalStoreBuilder(): Builder<EmptyFeatureResult> {
  return new BuilderImpl<EmptyFeatureResult>();
}
