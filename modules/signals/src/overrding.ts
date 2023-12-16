import { SignalStoreFeature } from '@ngrx/signals';
import { SignalStoreFeatureResult } from './signal-store-models';

export type NestedProperties<Type> = {
  [Property in keyof Type]: keyof Type[Property];
} extends Record<string, infer P>
  ? `${string & P}`
  : never;

type SameProperties<Store, Extension> = Extract<
  NestedProperties<Store>,
  NestedProperties<Extension>
>;

export type NoOverride<
  Store extends SignalStoreFeatureResult,
  Extension extends SignalStoreFeatureResult
> = SameProperties<Store, Extension> extends never
  ? SignalStoreFeature<Store, Extension>
  : SameProperties<Store, Extension>;
