import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  linkedSignal,
  signal,
  Type,
  WritableSignal,
} from '@angular/core';
import { STATE_SOURCE, StateSource } from './state-source';
import {
  EmptyFeatureResult,
  InnerSignalStore,
  SignalsDictionary,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
} from './signal-store-models';
import { OmitPrivate, Prettify } from './ts-helpers';
import { toDeepSignal } from './deep-signal';

type LinkedStateFactory<State extends object> = () => State;
type InitialLinkedStateSignal<State extends object> = {
  state: State;
} & EmptyFeatureResult;
type SignalStoreConfig<State extends object = object> = {
  providedIn?: 'root';
  protectedState?: boolean;
  linkedStateFactory?: () => LinkedStateFactory<State>;
};

type SignalStoreMembers<FeatureResult extends SignalStoreFeatureResult> =
  Prettify<
    OmitPrivate<
      StateSignals<FeatureResult['state']> &
        FeatureResult['props'] &
        FeatureResult['methods']
    >
  >;

export function signalStore<
  F1 extends SignalStoreFeatureResult,
  F2 extends SignalStoreFeatureResult,
  R extends SignalStoreFeatureResult = F1 & F2
>(
  config: {
    providedIn?: 'root';
  },
  f1: SignalStoreFeature<EmptyFeatureResult, F1>,
  f2: SignalStoreFeature<F1, F2>
): Type<SignalStoreMembers<R> & StateSource<Prettify<OmitPrivate<R['state']>>>>;

export function signalStore<
  LinkedState extends object,
  F1 extends SignalStoreFeatureResult,
  R extends SignalStoreFeatureResult = InitialLinkedStateSignal<LinkedState> &
    F1
>(
  config: {
    providedIn?: 'root';
    protectedState?: true;
    linkedStateFactory?: () => LinkedState;
  },
  f1: SignalStoreFeature<InitialLinkedStateSignal<LinkedState>, F1>
): Type<SignalStoreMembers<R> & StateSource<Prettify<OmitPrivate<R['state']>>>>;
export function signalStore<
  LinkedState,
  F1 extends SignalStoreFeatureResult,
  F2 extends SignalStoreFeatureResult,
  R extends SignalStoreFeatureResult = F1 & F2 & { state: LinkedState }
>(
  config: {
    providedIn?: 'root';
    protectedState?: true;
    linkedStateFactory?: () => () => LinkedState;
  },
  f1: SignalStoreFeature<EmptyFeatureResult & { state: LinkedState }, F1>,
  f2: SignalStoreFeature<EmptyFeatureResult & { state: LinkedState } & F1, F2>
): Type<SignalStoreMembers<R> & StateSource<Prettify<OmitPrivate<R['state']>>>>;

export function signalStore<LinkedState extends object>(
  ...args:
    | [SignalStoreConfig<LinkedState>, ...SignalStoreFeature[]]
    | SignalStoreFeature[]
): Type<SignalStoreMembers<any>> {
  const signalStoreArgs = [...args];

  const config =
    typeof signalStoreArgs[0] === 'function'
      ? {}
      : (signalStoreArgs.shift() as SignalStoreConfig);
  const features = signalStoreArgs as SignalStoreFeature[];

  @Injectable({ providedIn: config.providedIn || null })
  class SignalStore {
    constructor() {
      const innerStore = features.reduce(
        (store, feature) => feature(store),
        getInitialInnerStore(config.linkedStateFactory)
      );
      const { stateSignals, props, methods, hooks } = innerStore;
      const storeMembers = { ...stateSignals, ...props, ...methods };

      (this as any)[STATE_SOURCE] = innerStore[STATE_SOURCE];

      for (const key in storeMembers) {
        (this as any)[key] = storeMembers[key];
      }

      const { onInit, onDestroy } = hooks;

      if (onInit) {
        onInit();
      }

      if (onDestroy) {
        inject(DestroyRef).onDestroy(onDestroy);
      }
    }
  }

  return SignalStore;
}

export function getInitialInnerStore<State extends object>(
  linkedStateFactory: (() => LinkedStateFactory<State>) | undefined
): InnerSignalStore {
  if (linkedStateFactory) {
    return createLinkedState(linkedStateFactory);
  }
  return {
    [STATE_SOURCE]: signal({}),
    stateSignals: {},
    props: {},
    methods: {},
    hooks: {},
  };
}

function createLinkedState<State extends object>(
  linkedStateFactory: () => LinkedStateFactory<State>
) {
  const stateSource: WritableSignal<State> = linkedSignal({
    source: linkedStateFactory(),
    computation(source, previous) {
      return { ...(previous?.value || {}), ...source };
    },
  });

  const state = stateSource();
  const stateKeys = Object.keys(state);

  return {
    [STATE_SOURCE]: stateSource,
    stateSignals: stateKeys.reduce((acc, key) => {
      const sliceSignal = computed(
        () => (stateSource() as Record<string, unknown>)[key]
      );
      return { ...acc, [key]: toDeepSignal(sliceSignal) };
    }, {} as SignalsDictionary),
    props: {},
    methods: {},
    hooks: {},
  };
}
