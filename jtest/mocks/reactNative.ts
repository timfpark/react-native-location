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

export type AnyListener = (payload?: any) => void;

export interface FakeEmitter {
  __handlers: Record<string, AnyListener[]>;
  addListener: jest.Mock;
  emit(eventType: string, payload?: any): void;
}

export function makeEmitter(): FakeEmitter {
  const emitter: any = {
    __handlers: {} as Record<string, AnyListener[]>,
  };
  emitter.addListener = jest.fn((eventType: string, listener: AnyListener) => {
    (emitter.__handlers[eventType] = emitter.__handlers[eventType] || []).push(listener);
    return {
      remove: jest.fn(() => {
        const arr: AnyListener[] = emitter.__handlers[eventType] || [];
        const index = arr.indexOf(listener);
        if (index >= 0) {
          arr.splice(index, 1);
        }
      }),
    };
  });
  emitter.emit = (eventType: string, payload?: any): void => {
    (emitter.__handlers[eventType] || []).slice().forEach(fn => fn(payload));
  };
  return emitter as FakeEmitter;
}

export class NativeEventEmitter {
  static instances: NativeEventEmitter[] = [];
  readonly emitter: FakeEmitter = makeEmitter();

  constructor(public nativeInterface: unknown) {
    NativeEventEmitter.instances.push(this);
  }

  addListener(eventType: string, listener: AnyListener) {
    return this.emitter.addListener(eventType, listener);
  }

  removeListeners(_count: number): void {}
}

const makeMock = () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((specifics: Record<string, unknown>) => specifics.default),
  },
  NativeModules: {
    RNLocation: null as unknown,
  },
  TurboModuleRegistry: {
    get: jest.fn((): unknown => null),
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
    request: jest.fn(),
    check: jest.fn(),
  },
  DeviceEventEmitter: makeEmitter(),
  NativeEventEmitter,
});

export const mock = makeMock();

// —— react-native 风格命名导出 ——
// jest.config.js 的 moduleNameMapper 把 'react-native' 直接映射到本模块，
// 源码中的 import { Platform } from 'react-native' 等由此提供（无需 jest.mock）。
export const Platform = mock.Platform;
export const NativeModules = mock.NativeModules;
export const TurboModuleRegistry = mock.TurboModuleRegistry;
export const PermissionsAndroid = mock.PermissionsAndroid;
export const DeviceEventEmitter = mock.DeviceEventEmitter;

export function getMock() {
  return mock;
}

export function resetMock(os: string): void {
  mock.Platform.OS = os;
  mock.NativeModules.RNLocation = null;
  mock.TurboModuleRegistry.get.mockReset();
  mock.TurboModuleRegistry.get.mockReturnValue(null);
  mock.PermissionsAndroid.request.mockReset();
  mock.PermissionsAndroid.check.mockReset();
  mock.DeviceEventEmitter.__handlers = {};
  NativeEventEmitter.instances = [];
}
