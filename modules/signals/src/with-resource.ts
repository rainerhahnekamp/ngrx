import {
  Resource,
  ResourceRef,
  ResourceStatus,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import { WritableStateSource } from '@ngrx/signals';
import {
  EmptyFeatureResult,
  SignalsDictionary,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
} from './signal-store-models';
import { STATE_SOURCE } from './state-source';
import { throwIfNull } from './ts-helpers';

export const RESOURCE = Symbol('RESOURCE');
export const RESOURCES = Symbol('RESOURCES');

type ResourceFeature<T> = EmptyFeatureResult & {
  props: {
    value: Signal<T>;
    status: Signal<ResourceStatus>;
    error: Signal<unknown>;
    isLoading: Signal<boolean>;
  };
  methods: {
    hasValue(): this is Resource<NonNullable<T>>;
    reload(): boolean;
  };
  state: {
    [RESOURCE]: ResourceRef<T>;
  };
};

type NamedResourceFeature<
  Name extends string,
  ResourceValue
> = EmptyFeatureResult & {
  state: {
    [RESOURCES]: { [Key in Name]: ResourceRef<ResourceValue> };
  };
  props: {
    [Key in Name]: Resource<ResourceValue>;
  };
};

type ResourceStore<T> = WritableStateSource<{
  [RESOURCE]: ResourceRef<T>;
}>;

type NamedResourceStore<Name extends string, Value> = WritableStateSource<{
  [RESOURCES]: Record<Name, ResourceRef<Value>>;
}>;

type StoreForResource<Input extends SignalStoreFeatureResult> = StateSignals<
  Input['state']
> &
  Input['props'] &
  Input['methods'];

/**
 * Integrates a resource into the SignalStore, making the instance type-compatible
 * with a readonly `Resource`.
 *
 * It makes the SignalStore full compatible with Angular APIs that expect
 * a `Resource`, while preserving full SignalStore capabilities.
 *
 * ## Basic Usage
 * ```ts
 * const Store = signalStore(
 *   withResource(() => httpResource<Product[]>(
 *     () => `/product`,
 *     { defaultValue: [] }
 *   ))
 * );
 *
 * const store = inject(Store) // 👈 is of type Resource<Product[]>
 * ```
 *
 * Like `withMethods`, `withResource` feature has access to
 * state, props, and methods of the SignalStore which can
 * be used as input for the resource:
 *
 * ```ts
 * const Store = signalStore(
 *  withState({ selectedId: 0 }),
 *  withResource(store => httpResource<Product[]>(
 *    () => `/product/${store.selectedId()}`,
 *    { defaultValue: [] }
 *  ))
 * );
 * ```
 */
export function withResource<Input extends SignalStoreFeatureResult, Value>(
  resourceFactory: (store: StoreForResource<Input>) => ResourceRef<Value>
): SignalStoreFeature<Input, ResourceFeature<Value>>;

/**
 * The named resource version creates resources at a property of the resourceName.
 *
 * The functions `reloadResource` and `setResource` also accept a name.
 *
 * Setting the resource as property is required to be able to provide
 * multiple `ResourceRef` types.
 *
 * Example:
 * ```ts
 * const ProductStore = signalStore(
 *   withState({ selectedId: 0 }),
 *   withResource('products', store => httpResource<Product[]>(
 *     () => `/product`),
 *     { defaultValue: [] }
 *   )),
 *   withResource('selectedProduct', ({ selectedId }) => httpResource<ProductDetail>(
 *     () => selectedId() ? `/product/${store.selectedId()}` : undefined
 *   )
 * );
 *
 * const store = inject(Store);
 *
 * const products = store.products; // 👈 is of type Resource<Product[]>
 * const selectedProduct = store.selectedProduct; // 👈 is of type Resource<ProductDetail>
 * ```
 * @param name name of the property where the resource is stored
 * @param resourceFactory function generating the actual resource
 */
export function withResource<
  Input extends SignalStoreFeatureResult,
  ResourceValue,
  Name extends string
>(
  name: Name,
  resourceFactory: (
    store: StoreForResource<Input>
  ) => ResourceRef<ResourceValue>
): SignalStoreFeature<Input, NamedResourceFeature<Name, ResourceValue>>;

export function withResource<Input extends SignalStoreFeatureResult, Value>(
  nameOrResourceFactory:
    | ((store: StoreForResource<Input>) => ResourceRef<Value>)
    | string,
  resourceFactory?: (store: StoreForResource<Input>) => ResourceRef<Value>
): SignalStoreFeature<Input> {
  if (typeof nameOrResourceFactory === 'string') {
    return createNamedResourceFeature(
      nameOrResourceFactory,
      throwIfNull(resourceFactory)
    );
  }

  return createResourceFeature(nameOrResourceFactory);
}

function createResourceFeature<Input extends SignalStoreFeatureResult, Value>(
  resourceFactory: (store: StoreForResource<Input>) => ResourceRef<Value>
): SignalStoreFeature {
  return (store) => {
    const stateSource = store[STATE_SOURCE] as SignalsDictionary;
    if (RESOURCE in stateSource) {
      throw new Error(
        'You can only have one unnamed resource in a SignalStore. Use withResource(name, factory) to create named resources.'
      );
    }

    const storeForResourceFactory = {
      ...store['stateSignals'],
      ...store['props'],
      ...store['methods'],
    } as StoreForResource<Input>;

    const resource = resourceFactory(storeForResourceFactory);
    stateSource[RESOURCE] = signal(resource);

    return {
      ...store,
      props: {
        ...store.props,
        value: resource.value,
        status: resource.status,
        error: resource.error,
        isLoading: resource.isLoading,
      },
      methods: {
        ...store.methods,
        hasValue: (): this is Resource<NonNullable<Value>> => {
          return resource.hasValue();
        },
        reload: (): boolean => {
          throw new Error('not implemented');
        },
      },
    };
  };
}

function createNamedResourceFeature<
  Input extends SignalStoreFeatureResult,
  ResourceValue,
  Name extends string
>(
  name: Name,
  resourceFactory: (
    store: StoreForResource<Input>
  ) => ResourceRef<ResourceValue>
): SignalStoreFeature {
  return (store) => {
    if (name in store.props) {
      throw new Error(
        `Resource with "name" ${name} already exists. Please choose a different name.`
      );
    }

    const storeForResourceFactory = {
      ...store['stateSignals'],
      ...store['props'],
      ...store['methods'],
    } as StoreForResource<Input>;

    const resource = resourceFactory(storeForResourceFactory);
    const readonlyResource = resource.asReadonly();

    const storeWithResources = store as NamedResourceStore<Name, ResourceValue>;

    if (!storeWithResources[STATE_SOURCE][RESOURCES]) {
      storeWithResources[STATE_SOURCE][RESOURCES] = signal(
        {} as Record<Name, ResourceRef<ResourceValue>>
      );
    }

    storeWithResources[STATE_SOURCE][RESOURCES].update((value) => ({
      ...value,
      [name]: resource,
    }));

    return {
      ...store,
      props: {
        ...store.props,
        [name]: readonlyResource,
      },
    };
  };
}

export function setResource<Value>(
  value: NoInfer<Value>
): (state: { [RESOURCE]: ResourceRef<Value> }) => Record<string, never>;

// TODO: This is not type-safe
export function setResource<Name extends string, Value>(
  name: Name,
  value: NoInfer<Value>
): (state: {
  [RESOURCES]: Record<NoInfer<Name>, ResourceRef<Value>>;
}) => Record<string, never>;

export function setResource<Name extends string, Value>(
  nameOrValue: Name | Value,
  value?: Value
) {
  if (value) {
    const name = nameOrValue as Name;
    return (state: { [RESOURCES]: Record<Name, ResourceRef<Value>> }) => {
      // TODO: We could delegate this to `patchState` which knows symbol RESOURCES
      state[RESOURCES][name].set(value);
      return {};
    };
  } else {
    const resourceValue = nameOrValue as Value;
    return (state: { [RESOURCE]: ResourceRef<Value> }) => {
      // TODO: We could delegate this to `patchState` which knows symbol RESOURCES
      state[RESOURCE].set(resourceValue);
      return {};
    };
  }
}

/**
 * Triggers the `reload` method on the internal resource.
 * @param store
 */
export function reloadResource(store: ResourceStore<unknown>): void;
/**
 * Triggers the `reload` method on the internal resource.
 * @param store
 * @param name name of the resource to reload
 */
export function reloadResource<Name extends string>(
  store: NamedResourceStore<Name, unknown>,
  name: Name
): void;

export function reloadResource<Name extends string>(
  store: ResourceStore<unknown> | NamedResourceStore<Name, unknown>,
  name?: Name
) {
  untracked(() => {
    if (name) {
      const stateSource = (store as NamedResourceStore<Name, unknown>)[
        STATE_SOURCE
      ];
      stateSource[RESOURCES]()[name].reload();
    } else {
      const stateSource = (store as ResourceStore<unknown>)[STATE_SOURCE];
      stateSource[RESOURCE]().reload();
    }
  });
}
