export class Singleton<T, V> {
  private map: Map<T, V> = new Map();

  public get(t: T, fn: () => V): V {
    const v = this.map.has(t)
      ? this.map.get(t)
      : fn();

    this.map.set(t, v);
    return v;
  }
}
