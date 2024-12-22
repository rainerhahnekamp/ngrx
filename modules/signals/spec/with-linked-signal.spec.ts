import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '../src/signal-store';
import { withState } from '../src/with-state';
import { withMethods } from '../src/with-methods';
import { getState, patchState } from '../src/state-source';

it('should update a SignalStore synchronously via linkedSignal', () => {
  const UserStore = signalStore(
    { providedIn: 'root' },
    withState({ id: 1, firstname: 'Konrad', name: 'Weber' }),
    withMethods((store) => ({
      increment() {
        patchState(store, ({ id }) => ({ id: id + 1 }));
      },
    }))
  );

  const now = new Date();
  const BasketStore = signalStore(
    {
      providedIn: 'root',
      protectedState: true,
      linkedStateFactory: () => {
        const userStore = inject(UserStore);

        return () => {
          userStore.id();

          return {
            basket: [] as { productId: number; amount: number }[],
            termsAgreed: false,
          };
        };
      },
    },
    withState({ created: now }),
    withMethods((store) => ({
      agreeToTerms() {
        patchState(store, { termsAgreed: true });
      },
      addProduct(productId: number) {
        patchState(store, ({ basket }) => {
          return {
            basket: [...basket, { productId, amount: 1 }],
          };
        });
      },
    }))
  );

  const userStore = TestBed.inject(UserStore);
  const basketStore = TestBed.inject(BasketStore);

  expect(getState(basketStore)).toEqual({
    basket: [],
    termsAgreed: false,
    created: now,
  });
  expect(basketStore.basket()).toEqual([]);
  basketStore.addProduct(5);
  expect(basketStore.termsAgreed()).toBe(false);
  basketStore.agreeToTerms();
  expect(basketStore.termsAgreed()).toBe(true);
  expect(basketStore.basket()).toEqual([{ productId: 5, amount: 1 }]);

  userStore.increment();
  expect(getState(basketStore)).toEqual({
    basket: [],
    termsAgreed: false,
    created: now,
  });
});
