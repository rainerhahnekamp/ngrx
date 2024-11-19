export function capitalize<T extends string>(text: T): Capitalize<T> {
  return (text.charAt(0).toUpperCase() + text.substring(1)) as Capitalize<T>;
}

export function uncapitalize<T extends string>(text: T): Uncapitalize<T> {
  return (text.charAt(0).toLowerCase() + text.substring(1)) as Uncapitalize<T>;
}

export function assertNotUndefined<T>(
  value: T | undefined,
  message = `${value} must not be undefined`
): asserts value is T {
  if (value === undefined) {
    throw new Error(message);
  }
}
