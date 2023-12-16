import { Type, computed, Signal } from '@angular/core';
import { NoOverride } from '../overrding';
import {
  EmptyFeatureResult,
  MergeFeatureResults,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  SignalStoreProps,
} from '../signal-store-models';
import { StateSignal } from '../state-signal';
import { withState } from '../with-state';
import { withComputed } from '../with-computed';
import { withMethods } from '@ngrx/signals';

declare function signalStore<
  F1 extends SignalStoreFeatureResult,
  F2 extends SignalStoreFeatureResult,
  R extends SignalStoreFeatureResult = MergeFeatureResults<[F1, F2]>
>(
  f1: SignalStoreFeature<EmptyFeatureResult, F1>,
  f2: SignalStoreFeature<{} & F1, F2> & NoOverride<{} & F1, F2>
): Type<SignalStoreProps<R> & StateSignal<R['state']>>;

declare function signalStore<
  F1 extends SignalStoreFeatureResult,
  F2 extends SignalStoreFeatureResult,
  F3 extends SignalStoreFeatureResult,
  R extends SignalStoreFeatureResult = MergeFeatureResults<[F1, F2, F3]>
>(
  f1: SignalStoreFeature<EmptyFeatureResult, F1>,
  f2: SignalStoreFeature<{} & F1, F2> & NoOverride<{} & F1, F2>,
  f3: SignalStoreFeature & NoOverride<MergeFeatureResults<[F1, F2]>, F3>
): Type<SignalStoreProps<R> & StateSignal<R['state']>>;

type Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
type Assert<T extends true> = T;

describe('store with 2 features', () => {
  describe('overrides should fail to compile', () => {
    test('state and computed', () => {
      signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        // @ts-expect-error other
        withComputed((store) => {
          return {
            other: computed(() => store.name()), // FIXME: store.name with unknown type
          };
        })
      );
    });

    test('2 states', () => {
      signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        // @ts-expect-error overrides id and other
        withState({ id: 2, other: 'not allowed' })
      );
    });

    test('state and method', () => {
      const Overriding1c = signalStore(
        withState({ id: 1, name: 'hallo', prettyName: 'hi' }),
        // @ts-expect-error overrides prettyName
        withMethods((store) => {
          return {
            prettyName() {
              `${store.id()}: ${store.name()}`;
            },
          };
        })
      );
    });
  });

  describe('no overrides', () => {
    test('state and computed', () => {
      const NonOverriding1a = signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        withComputed((store) => {
          return {
            prettyName: computed(() => store.name()), //FIXME: loosing type here
          };
        })
      );

      const store = new NonOverriding1a();
      type A1 = Assert<Equals<typeof store.id, Signal<number>>>;
      type A2 = Assert<Equals<typeof store.name, Signal<string>>>;
      type A3 = Assert<Equals<typeof store.prettyName, Signal<string>>>; //FIXME
    });
  });
});

describe('store with 3 features', () => {
  describe('overrides should fail to compile', () => {
    test('state, computed and methods', () => {
      signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        withComputed((store) => {
          return {
            prettyName: computed(() => store.name()),
          };
        }),
        // @ts-expect-error overrides prettyName
        withMethods((store) => {
          return {
            prettyName() {
              `${store.id()}: ${store.name()}`;
            },
          };
        })
      );
    });

    test('three states', () => {
      signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        withState({ key: '1' }),
        // @ts-expect-error overrides prettyName
        withState({ other: '1' })
      );
    });

    test('state, methods and computed', () => {
      signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        withMethods((store) => {
          return {
            prettyName() {
              `${store.id()}: ${store.name()}`;
            },
          };
        }),
        // @ts-expect-error overrides prettyName
        withComputed((store) => {
          return {
            prettyName: computed(() => store.name()),
          };
        })
      );
    });
  });

  describe('no overrides', () => {
    test('state, computed, methods', () => {
      const Store = signalStore(
        withState({ id: 1, name: 'hallo', other: 'hi' }),
        withComputed((store) => {
          return {
            prettyName: computed(() => store.name()),
          };
        }),
        withMethods((store) => {
          return {
            log() {
              console.log(store.prettyName());
            },
          };
        })
      );

      const store = new Store();

      type A1 = Assert<Equals<typeof store.id, Signal<number>>>;
      type A2 = Assert<Equals<typeof store.name, Signal<string>>>;
      type A3 = Assert<Equals<typeof store.prettyName, Signal<string>>>; //FIXME
    });

    test('triple state', () => {
      const Store = signalStore(
        withState({ id: 1, name: 'hallo' }),
        withState({ key: '1' }),
        withState({ entities: [1] })
      );

      const store = new Store();

      type A1 = Assert<Equals<typeof store.id, Signal<number>>>;
      type A2 = Assert<Equals<typeof store.name, Signal<string>>>;
      type A3 = Assert<Equals<typeof store.key, Signal<string>>>;
      type A4 = Assert<Equals<typeof store.entities, Signal<number[]>>>;
    });
  });
});
