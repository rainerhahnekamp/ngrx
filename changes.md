This commit splits the single signal which contained the state in the `SignalStore` but also `signalState` into multiple Signals. That is necessary in order to introduce specific properties of the state which could made up of a `linkedSignal`.

An example. Given the following type:

```typescript
type User = {
  firstname: string;
  lastname: string;
};
```

Before, `STATE_SOURCE` would have been the following type:

```typescript
WritableSignal<User>;
```

With this change, it is:

```typescript
{
  firstname: WritableSignal<string>;
  lastname: Writable<string>;
}
```

Most changes affect the tests which focus on the `STATE_SOURCE`. Except one test in `signal-state.spec.ts`, all test could be modified to assert the behavior.

## Breaking Changes

Except for code which directly accesses the private `STATE_SOURCE`, are an absolute minimum.

## different object reference for state of `stateSource`

`stateSource` does not keep the object reference of the initial state upon initialization.

```typescript
const initialObject = {
  ngrx: 'rocks',
};
const state = signalState(initialObject);

// before
state() === initialObject; // ✅

// after
state() === initialObject; // ❌
```

## throws an error on optional properties

## no Signal change on empty patched state

`patchState` created a clone of the state and applied the patches to the clone. That meant, if nothing was changed, the Signal still fired because of the shallow clone. Since the state Signal doesn't exist anymore, there will be no change in this case.

```typescript
const state = signalState({ ngrx: 'rocks' });

let changeCount = 0;
effect(() => {
  changeCount++;
});

TestBed.flushEffects();
expect(changeCount).toBe(1);

patchState(state, {});

// before
expect(changeCount).toBe(2); // ✅

// after
expect(changeCount).toBe(2); // ❌ changeCount is still 1
```

# Refactoring

`signalStoreFeature` had to be refactored because of typing issues with the change to `WritableStateSource`.

`patchState` required to use `NoInfer` for `updaters` argument. Otherwise, with multiple updaters, the former updater would have defined the `State` for the next updater.
