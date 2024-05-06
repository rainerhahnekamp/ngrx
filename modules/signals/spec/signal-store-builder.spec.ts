import { computed } from '@angular/core';
import { signalStoreBuilder } from '../src/signal-store-builder';
import {
  patchState,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { expect } from '@jest/globals';

describe('Signal Store Builder', () => {
  it('should use the generic and method', () => {
    const Store = signalStoreBuilder()
      .add(withState({ counter: 1 }))
      .add(
        withMethods((store) => {
          return {
            increment() {
              patchState(store, ({ counter }) => ({ counter: counter + 1 }));
            },
          };
        })
      )
      .add(
        withComputed((state) => {
          return {
            double: computed(() => state.counter() * 2),
          };
        })
      )
      .build();

    const store = new Store();
    expect(store.counter()).toBe(1);
    store.increment();
    expect(store.double()).toBe(4);
  });
  it('should instantiate a basic store', () => {
    const Store = signalStoreBuilder()
      .addState({ counter: 1 })
      .addMethods((store) => {
        return {
          increment() {
            patchState(store, (value) => ({ counter: value.counter + 1 }));
          },
        };
      })
      .addComputed((state) => ({
        double: computed(() => state.counter() * 2),
      }))
      .build();
    const store = new Store();
    expect(store.counter()).toBe(1);
    store.increment();
    expect(store.double()).toBe(4);
  });

  it('should allow a state with a lot of features', () => {
    const LargeStore = signalStoreBuilder()
      .addState({ id1: 1 })
      .addState({ id2: 2 })
      .addState({ id3: 3 })
      .addState({ id4: 4 })
      .addState({ id5: 5 })
      .addState({ id6: 6 })
      .addState({ id7: 7 })
      .addState({ id8: 8 })
      .addState({ id9: 9 })
      .addState({ id10: 10 })
      .addState({ id11: 11 })
      .addState({ id12: 12 })
      .addState({ id13: 13 })
      .addState({ id14: 14 })
      .addState({ id15: 15 })
      .build();

    const largeStore = new LargeStore();
    expect(typeof largeStore.id11() === 'number').toBe(true);
  });
});
