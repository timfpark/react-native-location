/**
 * MIT License
 *
 * Copyright (C) 2026 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { promiseTimeoutResolveNull } from '../src/utils';

describe('promiseTimeoutResolveNull', () => {
  beforeEach(() => {
    // 统一使用假定时器，避免未决 setTimeout 句柄导致 jest worker 无法退出
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('resolves with the wrapped value when the promise settles before the timeout', async () => {
    jest.useFakeTimers();
    await expect(promiseTimeoutResolveNull(1000, Promise.resolve('value'))).resolves.toBe('value');
  });

  it('resolves with the object value before the timeout fires', async () => {
    jest.useFakeTimers();
    const value = { timestamp: 1 };
    await expect(promiseTimeoutResolveNull(1000, Promise.resolve(value))).resolves.toBe(value);
  });

  it('resolves with null after the timeout when the promise never settles', async () => {
    jest.useFakeTimers();
    const result = promiseTimeoutResolveNull(1000, new Promise<never>(() => {}));
    const spy = jest.fn();
    result.then(spy);
    jest.advanceTimersByTime(999);
    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await result;
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('keeps the promise value even when the timeout fires later (race semantics)', async () => {
    jest.useFakeTimers();
    const settled = { timestamp: 42 };
    const result = await promiseTimeoutResolveNull(1000, Promise.resolve(settled));
    jest.advanceTimersByTime(5000);
    expect(result).toBe(settled);
  });

  it('resolves with null immediately for a zero timeout', async () => {
    jest.useFakeTimers();
    const result = promiseTimeoutResolveNull(0, new Promise<never>(() => {}));
    const spy = jest.fn();
    result.then(spy);
    jest.advanceTimersByTime(0);
    await result;
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('passes through the rejection of the wrapped promise', async () => {
    await expect(
      promiseTimeoutResolveNull(1000, Promise.reject(new Error('boom')))
    ).rejects.toThrow('boom');
  });
});
