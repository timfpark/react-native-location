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
function loadNativeInterface(os: string, turbo?: Record<string, unknown>) {
  jest.resetModules();
  const rn = require('./mocks/reactNative').getMock();

  rn.Platform.OS = os;
  rn.NativeModules.RNLocation = null;
  rn.TurboModuleRegistry.get.mockReset();
  rn.TurboModuleRegistry.get.mockReturnValue(turbo ?? null);
  rn.NativeEventEmitter.instances = [];

  const module = require('../src/lib/nativeInterface');
  return { rn, get: module.get };
}

function makeTurboModule() {
  return {
    configure: jest.fn(),
    requestWhenInUseAuthorization: jest.fn(),
    requestAlwaysAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    startUpdatingLocation: jest.fn(),
    stopUpdatingLocation: jest.fn(),
  };
}

describe('nativeInterface', () => {
  it('prefers the codegen TurboModule when it exposes configure', () => {
    const turbo = makeTurboModule();
    const { get } = loadNativeInterface('ios', turbo);

    const { nativeInterface } = get();

    expect(nativeInterface).toBe(turbo);
  });

  it('falls back to NativeModules.RNLocation when the TurboModule is unavailable (old architecture)', () => {
    const legacy = { configure: jest.fn() };
    const { rn, get } = loadNativeInterface('ios');
    rn.NativeModules.RNLocation = legacy;
    // NativeRNLocation 已在加载期取到 null，get() 内部回落 NativeModules

    const { nativeInterface } = get();

    expect(nativeInterface).toBe(legacy);
    expect(rn.TurboModuleRegistry.get).toHaveBeenCalledWith('RNLocation');
  });

  it('ignores a TurboModule that does not expose configure and falls back to NativeModules', () => {
    const legacy = { configure: jest.fn() };
    const { rn, get } = loadNativeInterface('ios', { someOtherApi: jest.fn() });
    rn.NativeModules.RNLocation = legacy;

    const { nativeInterface } = get();

    expect(nativeInterface).toBe(legacy);
  });

  it('warns when no native module could be resolved', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { get } = loadNativeInterface('ios');

    get();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Could not find the RNLocation native module')
    );
    warn.mockRestore();
  });

  it('uses DeviceEventEmitter as the event channel on harmony (emitDeviceEvent bridge)', () => {
    const { rn, get } = loadNativeInterface('harmony');

    const { eventEmitter } = get();

    expect(eventEmitter).toBe(rn.DeviceEventEmitter);
  });

  it('creates a NativeEventEmitter bound to the resolved native module on ios', () => {
    const turbo = makeTurboModule();
    const { rn, get } = loadNativeInterface('ios', turbo);

    const { nativeInterface, eventEmitter } = get();

    expect(rn.NativeEventEmitter.instances).toHaveLength(1);
    expect(rn.NativeEventEmitter.instances[0].nativeInterface).toBe(turbo);
    expect(eventEmitter).toBe(rn.NativeEventEmitter.instances[0]);
  });

  it('creates a NativeEventEmitter on android as well', () => {
    const { rn, get } = loadNativeInterface('android');
    const legacy = { configure: jest.fn() };
    // android + 无 TurboModule：回落 NativeModules，事件表绑定其上
    rn.NativeModules.RNLocation = legacy;

    const { eventEmitter, nativeInterface } = get();

    expect(nativeInterface).toBe(legacy);
    expect(rn.NativeEventEmitter.instances).toHaveLength(1);
    expect(eventEmitter).toBe(rn.NativeEventEmitter.instances[0]);
  });
});
