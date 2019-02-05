/* eslint-disable valid-jsdoc */

/**
 * Wraps a promise with a timeout which resolves to `null` after a given delay.
 * @ignore
 */
export const promiseTimeoutResolveNull = <T>(
  ms: number,
  promise: Promise<T>
): Promise<T | null> => {
  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise<null>(resolve => {
    let id = setTimeout(() => {
      clearTimeout(id);
      resolve(null);
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
};
