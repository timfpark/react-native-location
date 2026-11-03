
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
function loadModule(
  os: string,
  opts?: { legacy?: boolean; turboOverrides?: Record<string, unknown> }
) {
  jest.resetModules();
  const rn = require('./mocks/reactNative').getMock();

  rn.Platform.OS = os;
  rn.DeviceEventEmitter.__handlers = {};
  rn.TurboModuleRegistry.get.mockReset();

  const legacy = {
    configure: jest.fn(),
    startUpdatingLocation: jest.fn(),
    stopUpdatingLocation: jest.fn(),
    startUpdatingHeading: jest.fn(),
    stopUpdatingHeading: jest.fn(),
    startMonitoringSignificantLocationChanges: jest.fn(),
    stopMonitoringSignificantLocationChanges: jest.fn(),
  };
  const turbo = Object.assign(
    {
      configure: jest.fn(),
      requestWhenInUseAuthorization: jest.fn().mockResolvedValue(true),
      requestAlwaysAuthorization: jest.fn().mockResolvedValue(true),
      getAuthorizationStatus: jest.fn().mockResolvedValue('authorizedFine'),
      startUpdatingLocation: jest.fn(),
      stopUpdatingLocation: jest.fn(),
      startUpdatingHeading: jest.fn(),
      stopUpdatingHeading: jest.fn(),
      startMonitoringSignificantLocationChanges: jest.fn(),
      stopMonitoringSignificantLocationChanges: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    opts?.turboOverrides
  );

  if (opts?.legacy) {
    rn.TurboModuleRegistry.get.mockReturnValue(null);
    rn.NativeModules.RNLocation = legacy;
  } else {
    rn.NativeModules.RNLocation = null;
    rn.TurboModuleRegistry.get.mockReturnValue(turbo);
  }

  const module = require('../src/index');
  return { module, turbo, legacy, rn };
}

describe('RNLocation (index)', () => {
  describe('module surface', () => {
    it('exposes the full public API of the library', () => {
      const { module } = loadModule('harmony');
      const RNLocation = module.default;

      expect(typeof RNLocation.configure).toBe('function');
      expect(typeof RNLocation.requestPermission).toBe('function');
      expect(typeof RNLocation.checkPermission).toBe('function');
      expect(typeof RNLocation.getCurrentPermission).toBe('function');
      expect(typeof RNLocation.subscribeToPermissionUpdates).toBe('function');
      expect(typeof RNLocation.subscribeToLocationUpdates).toBe('function');
      expect(typeof RNLocation.getLatestLocation).toBe('function');
      expect(typeof RNLocation.subscribeToHeadingUpdates).toBe('function');
      expect(typeof RNLocation.subscribeToSignificantLocationUpdates).toBe('function');
      expect(typeof RNLocation._configureHelpers).toBe('function');
    });

    it('exports the named functions bound to the same implementations as the default export', () => {
      const { module } = loadModule('harmony');

      expect(module.configure).toBe(module.default.configure);
      expect(module.getLatestLocation).toBe(module.default.getLatestLocation);
    });
  });

  describe('configure', () => {
    it('passes the options through to the native module', async () => {
      const { module, turbo } = loadModule('harmony');
      const options = { distanceFilter: 5, interval: 1000 };

      await module.default.configure(options);

      expect(turbo.configure).toHaveBeenCalledWith(options);
    });
  });

  describe('requestPermission', () => {
    it('routes to requestWhenInUseAuthorization on harmony for whenInUse', async () => {
      const { module, turbo } = loadModule('harmony');

      const granted = await module.default.requestPermission({ ios: 'whenInUse' });

      expect(turbo.requestWhenInUseAuthorization).toHaveBeenCalledTimes(1);
      expect(granted).toBe(true);
    });
  });

  describe('getCurrentPermission', () => {
    it('returns the mapped native authorization status', async () => {
      const { module, turbo } = loadModule('harmony');
      turbo.getAuthorizationStatus.mockResolvedValue('authorizedCoarse');

      await expect(module.default.getCurrentPermission()).resolves.toBe('authorizedCoarse');
    });
  });

  describe('checkPermission', () => {
    it('delegates the permission check to the permissions helper', async () => {
      const { module, turbo } = loadModule('harmony');
      turbo.getAuthorizationStatus.mockResolvedValue('authorizedFine');

      await expect(
        module.default.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(true);
      expect(turbo.getAuthorizationStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToPermissionUpdates', () => {
    it('subscribes on the platform event channel and unsubscribes via the returned function', () => {
      const { module, rn } = loadModule('harmony');
      const listener = jest.fn();

      const unsubscribe = module.default.subscribeToPermissionUpdates(listener);
      expect(
        rn.DeviceEventEmitter.__handlers['authorizationStatusDidChange']
      ).toContain(listener);

      unsubscribe();
      expect(
        rn.DeviceEventEmitter.__handlers['authorizationStatusDidChange']
      ).not.toContain(listener);
    });
  });

  describe('subscribeToHeadingUpdates', () => {
    it('starts the heading sensor, delivers payloads, and stops on unsubscribe', () => {
      const { module, turbo, rn } = loadModule('harmony');
      const listener = jest.fn();

      const unsubscribe = module.default.subscribeToHeadingUpdates(listener);
      expect(turbo.startUpdatingHeading).toHaveBeenCalledTimes(1);

      rn.DeviceEventEmitter.emit('headingUpdated', { heading: 42 });
      expect(listener).toHaveBeenCalledWith({ heading: 42 });

      unsubscribe();
      expect(turbo.stopUpdatingHeading).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToSignificantLocationUpdates', () => {
    it('starts significant monitoring, delivers payloads, and stops on unsubscribe', () => {
      const { module, turbo, rn } = loadModule('harmony');
      const listener = jest.fn();

      const unsubscribe = module.default.subscribeToSignificantLocationUpdates(listener);
      expect(turbo.startMonitoringSignificantLocationChanges).toHaveBeenCalledTimes(1);

      rn.DeviceEventEmitter.emit('locationUpdated', [{ timestamp: 1, latitude: 1 }]);
      expect(listener).toHaveBeenCalledWith([{ timestamp: 1, latitude: 1 }]);

      unsubscribe();
      expect(turbo.stopMonitoringSignificantLocationChanges).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLatestLocation', () => {
    it('resolves with the most recent location and unsubscribes', async () => {
      // fake timers：避免源码 setTimeout(ms) 的未决句柄阻塞 jest worker 退出
      jest.useFakeTimers();
      const { module, turbo, rn } = loadModule('harmony');

      const promise = module.default.getLatestLocation({ timeout: 5000 });
      const listener = rn.DeviceEventEmitter.__handlers['locationUpdated'][0];
      listener([
        { timestamp: 100, latitude: 1 },
        { timestamp: 300, latitude: 3 },
        { timestamp: 200, latitude: 2 },
      ]);

      await expect(promise).resolves.toEqual({ timestamp: 300, latitude: 3 });
      expect(turbo.startUpdatingLocation).toHaveBeenCalledTimes(1);
      expect(turbo.stopUpdatingLocation).toHaveBeenCalledTimes(1);
    });

    it('keeps waiting when the payload array is empty', async () => {
      jest.useFakeTimers();
      const { module, rn } = loadModule('harmony');

      const promise = module.default.getLatestLocation({ timeout: 1000 });
      const listener = rn.DeviceEventEmitter.__handlers['locationUpdated'][0];
      listener([]);

      const spy = jest.fn();
      promise.then(spy);
      jest.advanceTimersByTime(999);
      expect(spy).not.toHaveBeenCalled();

      listener([{ timestamp: 7, latitude: 7 }]);
      await expect(promise).resolves.toEqual({ timestamp: 7, latitude: 7 });
      jest.useRealTimers();
    });

    it('resolves with null after the default 10s timeout', async () => {
      jest.useFakeTimers();
      const { module } = loadModule('harmony');

      const promise = module.default.getLatestLocation();
      const spy = jest.fn();
      promise.then(spy);
      jest.advanceTimersByTime(10000);

      await promise;
      expect(spy).toHaveBeenCalledWith(null);
      jest.useRealTimers();
    });

    it('never times out with timeout: null and waits for the first location', async () => {
      jest.useFakeTimers();
      const { module, turbo, rn } = loadModule('harmony');

      const promise = module.default.getLatestLocation({ timeout: null });
      const spy = jest.fn();
      promise.then(spy);
      jest.advanceTimersByTime(60000);
      expect(spy).not.toHaveBeenCalled();

      const listener = rn.DeviceEventEmitter.__handlers['locationUpdated'][0];
      listener([{ timestamp: 1, latitude: 1 }]);
      await expect(promise).resolves.toEqual({ timestamp: 1, latitude: 1 });
      expect(turbo.stopUpdatingLocation).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('subscribeToLocationUpdates', () => {
    it('delivers location payloads to the listener through the platform event channel', () => {
      const { module, turbo, rn } = loadModule('harmony');
      const listener = jest.fn();

      const unsubscribe = module.default.subscribeToLocationUpdates(listener);
      const payload = [{ timestamp: 1, latitude: 1 }];
      rn.DeviceEventEmitter.emit('locationUpdated', payload);

      expect(listener).toHaveBeenCalledWith(payload);
      expect(turbo.startUpdatingLocation).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(turbo.stopUpdatingLocation).toHaveBeenCalledTimes(1);
    });
  });

  describe('onWarning wiring', () => {
    it('logs native warnings routed through the platform event channel', () => {
      const { rn } = loadModule('harmony');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      rn.DeviceEventEmitter.emit('onWarning', { message: 'switch off', type: '500' });

      expect(warn).toHaveBeenCalledWith('react-native-location warning:', {
        message: 'switch off',
        type: '500',
      });
      warn.mockRestore();
    });
  });

  describe('legacy architecture fallback', () => {
    it('wires the module to NativeModules.RNLocation when no TurboModule exists', () => {
      const { module, legacy } = loadModule('harmony', { legacy: true });

      module.default.subscribeToLocationUpdates(jest.fn());

      expect(legacy.startUpdatingLocation).toHaveBeenCalledTimes(1);
    });
  });
});
