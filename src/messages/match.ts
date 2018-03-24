interface Isable {
  is(input: any): boolean;
}

export function match(message: any): <T extends Isable>(t: T, fn: (m: T) => void) => void {
  return <T extends Isable>(thing: T, fn: (message: T) => void) => {
    if (thing.is(message)) {
      fn(message);
    }
  };
}
