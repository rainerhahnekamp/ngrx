import { SignalStoreFeature } from '@ngrx/signals';
import {
  InnerSignalStore,
  SignalStoreFeatureResult,
} from './signal-store-models';
import { signal } from '@angular/core';

interface Person {
  id: number;
  firstname: string;
}

type IsNotOverriding<Store, Extension> = {
  [Property in keyof Extension as Property extends keyof Store
    ? 'overrides'
    : never]: Property;
} extends {
  overrides: infer P;
}
  ? `${string & P}`
  : {};

type NestedProperties<Type> = {
  [Property in keyof Type]: keyof Type[Property];
} extends Record<string, infer P>
  ? `${string & P}`
  : never;

type SameProperties<Store, Extension> = Extract<
  NestedProperties<Store>,
  NestedProperties<Extension>
>;

export type NotOverriding<Store, Extension> = SameProperties<
  Store,
  Extension
> extends never
  ? {}
  : SameProperties<Store, Extension>;

type StoreOverriding<
  Feature1 extends SignalStoreFeatureResult,
  Feature2 extends SignalStoreFeatureResult
> =
  | IsNotOverriding<Feature1['state'], Feature2['state']>
  | IsNotOverriding<Feature1['state'], Feature2['state']>;

type State<Feature extends SignalStoreFeatureResult> = Feature['state'];

function extend<Store extends IsNotOverriding<Store, Extension>, Extension>(
  store: Store,
  extension: Extension
) {}

// type A = StoreOverriding<typeof { state: { ids: [1, 2, 3] }, signals: {}, methods: {} }, typeof { state: { ids: [1, 2, 3] }, signals: {}, methods: {} }>

function extendStore<
  F1 extends SignalStoreFeatureResult & NotOverriding<F1, F2>,
  F2 extends SignalStoreFeatureResult
>(feature1: F1, feature2: F2) {}

const a = {
  state: { ids: [1, 2, 3], data: 5 },
  signals: { a: signal(1) },
  methods: {},
};
type A = typeof a;
const b = { state: { ids: [1, 2, 3] }, signals: { b: signal(1) }, methods: {} };
type B = typeof b;

type A1 = NotOverriding<A, B>;
type A2 = IsNotOverriding<A['state'], B['state']>;
type A3 = NestedProperties<A>;

extend(a.state, b.state);
extendStore(a, b);

type ExtendedProduct = {
  extension: Record<string, unknown>;
  // extension: object
};

type OverlappingExtension<
  Base extends ExtendedProduct,
  Extension extends ExtendedProduct
> = Extract<keyof Base['extension'], keyof Extension['extension']>;
type NoOverlappingExtensions<
  Base extends ExtendedProduct,
  Extension extends ExtendedProduct
> = OverlappingExtension<Base, Extension> extends never
  ? {}
  : OverlappingExtension<Base, Extension>;

export type Product<
  Base extends ExtendedProduct = ExtendedProduct,
  Extension extends ExtendedProduct &
    NoOverlappingExtensions<Base, Extension> = ExtendedProduct
> = Extension & Base;

const product = { extension: { id: 1, name: 'some car' } };
const extension1 = { extension: { engine: 'electric' } };
const extension2 = { extension: { name: 'Hook' } };

type ElectricCar = Product<typeof product, typeof extension1>;
type HookCar = Product<typeof product, typeof extension2>; // doesn't compile
