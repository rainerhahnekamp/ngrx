import {
  getState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';

const person = {
  id: 1,
  name: 'John',
  age: 30,
  a: {
    b: { c: true },
  },
  address: {
    street: '123 Main St',
    city: 'New York',
    door: 4,
  },
};

signalStore(
  withState(person),

  withComputed((state) => ({
    byId: computed(() => state.id()),
  })),

  withMethods((store) => {
    const state = getState(store);
  })
);

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

export type Leaves<T> = T extends object
  ? {
      [K in keyof T]-?: Join<K, Leaves<T[K]>>;
    }[keyof T]
  : '';

type ResourceKey = Leaves<typeof person>;
type FirstLevel = keyof typeof person;

function t<Type>(object: Type, key: Leaves<Type>) {
  // ...
}

t(person, 'address.street');
