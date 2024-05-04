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

type ValidObjectPath<
  NestedObject extends Record<string, unknown>,
  Key extends string
> = Key extends `${infer Property}.${infer Rest}`
  ? NestedObject[Property] extends Record<string, unknown>
    ? ValidObjectPath<NestedObject[Property], Rest>
    : never
  : Key extends keyof NestedObject
  ? NestedObject[Key]
  : never;

type IsValidObjectPath<
  NestedObject extends Record<string, unknown>,
  Key extends string
> = ValidObjectPath<NestedObject, Key> extends never ? never : Key;

type ValidObjectPaths<Type extends Record<string, unknown>> = Keys;

function nestedProperty<
  NestedObject extends Record<string, unknown>,
  Path extends string
>(nestedObject: NestedObject, key: Path): ValidObjectPath<NestedObject, Path> {
  return nestedObject as any;
}

type Id = ValidObjectPath<typeof person, 'address.street'>;
type T1 = IsValidObjectPath<typeof person, 'name'>;

const value = nestedProperty(person, 'address');
