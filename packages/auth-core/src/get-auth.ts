export function createCachedAsyncFactory<T>(factory: () => Promise<T>) {
  let cachedPromise: Promise<T> | null = null;

  return async function getCached(): Promise<T> {
    if (!cachedPromise) {
      cachedPromise = factory();
    }
    return cachedPromise;
  };
}
