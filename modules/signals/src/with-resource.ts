import {
  Resource,
  ResourceRef,
  ResourceStatus,
  Signal,
  untracked,
} from '@angular/core';
import {
  EmptyFeatureResult,
  SignalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
} from './signal-store-models';
import { RESOURCE_SOURCE, ResourceSource } from './state-source';
import { throwIfNull } from './ts-helpers';

export const DEFAULT_RESOURCE = Symbol('DEFAULT_RESOURCE');

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
  resources: {
    [DEFAULT_RESOURCE]: ResourceRef<T>;
  };
};

type NamedResourceFeature<
  Name extends string,
  ResourceValue
> = EmptyFeatureResult & {
  resources: {
    [Key in Name]: ResourceRef<ResourceValue>;
  };
  props: {
    [Key in Name]: Resource<ResourceValue>;
  };
};

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
    if (DEFAULT_RESOURCE in store[RESOURCE_SOURCE]) {
      throw new Error(
        `Resource already exists. You can only have one single resource.`
      );
    }

    const storeForResourceFactory = {
      ...store['stateSignals'],
      ...store['props'],
      ...store['methods'],
    } as StoreForResource<Input>;

    const resource = resourceFactory(storeForResourceFactory);

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
      [RESOURCE_SOURCE]: {
        ...store[RESOURCE_SOURCE],
        [DEFAULT_RESOURCE]: resource,
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
    if (name in store[RESOURCE_SOURCE]) {
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

    return {
      ...store,
      props: {
        ...store.props,
        [name]: readonlyResource,
      },
      [RESOURCE_SOURCE]: {
        ...store[RESOURCE_SOURCE],
        [name]: resource,
      },
    };
  };
}

// TODO: This is not type-safe
export function setResource<Value>(value: NoInfer<Value>): (
  state: {}
  // state: ResourceSource<{ [DEFAULT_RESOURCE]: ResourceRef<Value> }>
) => Record<string, never>;

// TODO: This is not type-safe
export function setResource<Name extends string, Value>(
  name: Name,
  value: Value
): (
  state: {}
  // state: ResourceSource<{ [Key in Name]: ResourceRef<Value> }>
) => Record<string, never>;

export function setResource<Name extends string, Value>(
  nameOrValue: Name | Value,
  value?: Value
) {
  if (value) {
    const name = nameOrValue as Name;
    return (store: ResourceSource<{ [Key in Name]: ResourceRef<Value> }>) => {
      store[RESOURCE_SOURCE][name].set(value);
      return {};
    };
  } else {
    return (
      store: ResourceSource<{ [DEFAULT_RESOURCE]: ResourceRef<Value> }>
    ) => {
      const value = nameOrValue as Value;
      store[RESOURCE_SOURCE][DEFAULT_RESOURCE].set(value);
      return {};
    };
  }
}

/**
 * Triggers the `reload` method on the internal resource.
 * @param store
 */
export function reloadResource(
  store: ResourceSource<{ [DEFAULT_RESOURCE]: ResourceRef<unknown> }>
): void;
/**
 * Triggers the `reload` method on the internal resource.
 * @param store
 * @param name name of the resource to reload
 */
export function reloadResource<Name extends string>(
  store: ResourceSource<Record<Name, ResourceRef<unknown>>>,
  name: Name
): void;

export function reloadResource<Name extends string>(
  store: ResourceSource<
    Record<Name | typeof DEFAULT_RESOURCE, ResourceRef<unknown>>
  >,
  name?: Name
) {
  untracked(() => {
    if (name) {
      store[RESOURCE_SOURCE][name].reload();
    } else {
      store[RESOURCE_SOURCE][DEFAULT_RESOURCE].reload();
    }
  });
}
