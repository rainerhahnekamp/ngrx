import { ResourceRef, Signal } from '@angular/core';
import { DeepSignal } from './deep-signal';
import { ResourceSource, WritableStateSource } from './state-source';
import { IsKnownRecord, Prettify } from './ts-helpers';

export type StateSignals<State> = IsKnownRecord<Prettify<State>> extends true
  ? {
      [Key in keyof State]: IsKnownRecord<State[Key]> extends true
        ? DeepSignal<State[Key]>
        : Signal<State[Key]>;
    }
  : {};

export type SignalsDictionary = Record<string | symbol, Signal<unknown>>;

export type MethodsDictionary = Record<string, Function>;

export type SignalStoreHooks = {
  onInit?: () => void;
  onDestroy?: () => void;
};

export type ResourceDictionary = Record<string, ResourceRef<unknown>>;

export type InnerSignalStore<
  State extends object = object,
  Props extends object = object,
  Methods extends MethodsDictionary = MethodsDictionary,
  Resources extends ResourceDictionary = ResourceDictionary
> = {
  stateSignals: StateSignals<State>;
  props: Props;
  methods: Methods;
  hooks: SignalStoreHooks;
} & WritableStateSource<State> &
  ResourceSource<Resources>;

export type SignalStoreFeatureResult = {
  state: object;
  props: object;
  methods: MethodsDictionary;
  resources: ResourceDictionary;
};

export type EmptyFeatureResult = {
  state: {};
  props: {};
  methods: {};
  resources: {};
};

export type SignalStoreFeature<
  Input extends SignalStoreFeatureResult = SignalStoreFeatureResult,
  Output extends SignalStoreFeatureResult = SignalStoreFeatureResult
> = (
  store: InnerSignalStore<
    Input['state'],
    Input['props'],
    Input['methods'],
    Input['resources']
  >
) => InnerSignalStore<
  Output['state'],
  Output['props'],
  Output['methods'],
  Output['resources']
>;
