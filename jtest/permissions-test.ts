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

import Permissions from '../src/lib/permissions';
import { getMock } from './mocks/reactNative';

const rn = getMock();

function makeNativeInterface() {
  return {
    requestWhenInUseAuthorization: jest.fn(),
    requestAlwaysAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
  };
}

function makePermissions() {
  const nativeInterface = makeNativeInterface();
  const emitter = {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  };
  return {
    nativeInterface,
    emitter,
    permissions: new Permissions(nativeInterface as any, emitter as any),
  };
}

describe('Permissions', () => {
  let harness: ReturnType<typeof makePermissions>;

  beforeEach(() => {
    harness = makePermissions();
    harness.nativeInterface.requestWhenInUseAuthorization.mockResolvedValue(true);
    harness.nativeInterface.requestAlwaysAuthorization.mockResolvedValue(true);
    harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedFine');
  });

  afterEach(() => {
    rn.Platform.OS = 'ios';
  });

  describe('requestPermission on ios', () => {
    beforeEach(() => {
      rn.Platform.OS = 'ios';
    });

    it('delegates to requestAlwaysAuthorization for ios: always', async () => {
      const result = await harness.permissions.requestPermission({ ios: 'always' });

      expect(harness.nativeInterface.requestAlwaysAuthorization).toHaveBeenCalledTimes(1);
      expect(harness.nativeInterface.requestWhenInUseAuthorization).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('delegates to requestWhenInUseAuthorization for ios: whenInUse', async () => {
      await harness.permissions.requestPermission({ ios: 'whenInUse' });

      expect(harness.nativeInterface.requestWhenInUseAuthorization).toHaveBeenCalledTimes(1);
      expect(harness.nativeInterface.requestAlwaysAuthorization).not.toHaveBeenCalled();
    });

    it('returns false for an unknown ios option', async () => {
      const result = await harness.permissions.requestPermission({ ios: 'ignore' as any });

      expect(result).toBe(false);
      expect(harness.nativeInterface.requestAlwaysAuthorization).not.toHaveBeenCalled();
      expect(harness.nativeInterface.requestWhenInUseAuthorization).not.toHaveBeenCalled();
    });
  });

  describe('requestPermission on android', () => {
    beforeEach(() => {
      rn.Platform.OS = 'android';
    });

    it('requests ACCESS_FINE_LOCATION for detail: fine and resolves true when granted', async () => {
      rn.PermissionsAndroid.request.mockResolvedValue('granted');

      const result = await harness.permissions.requestPermission({
        android: { detail: 'fine' },
      });

      expect(rn.PermissionsAndroid.request).toHaveBeenCalledWith(
        'android.permission.ACCESS_FINE_LOCATION',
        undefined
      );
      expect(result).toBe(true);
    });

    it('requests ACCESS_COARSE_LOCATION for detail: coarse and passes the rationale through', async () => {
      rn.PermissionsAndroid.request.mockResolvedValue('granted');
      const rationale = { title: 't', message: 'm', buttonPositive: 'ok', buttonNegative: 'no' };

      await harness.permissions.requestPermission({
        android: { detail: 'coarse', rationale },
      });

      expect(rn.PermissionsAndroid.request).toHaveBeenCalledWith(
        'android.permission.ACCESS_COARSE_LOCATION',
        rationale
      );
    });

    it('resolves false when the user denies the request', async () => {
      rn.PermissionsAndroid.request.mockResolvedValue('never_ask_again');

      const result = await harness.permissions.requestPermission({
        android: { detail: 'fine' },
      });

      expect(result).toBe(false);
    });

    it('returns false when no android options are given', async () => {
      const result = await harness.permissions.requestPermission({});

      expect(rn.PermissionsAndroid.request).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('requestPermission on harmony', () => {
    beforeEach(() => {
      rn.Platform.OS = 'harmony';
    });

    it('maps ios: always to the native always request (foreground + background)', async () => {
      await harness.permissions.requestPermission({ ios: 'always' });

      expect(harness.nativeInterface.requestAlwaysAuthorization).toHaveBeenCalledTimes(1);
    });

    it('maps ios: whenInUse to the native foreground request', async () => {
      await harness.permissions.requestPermission({ ios: 'whenInUse' });

      expect(harness.nativeInterface.requestWhenInUseAuthorization).toHaveBeenCalledTimes(1);
    });

    it('maps android: detail fine/coarse to the native foreground request', async () => {
      await harness.permissions.requestPermission({ android: { detail: 'coarse' } });

      expect(harness.nativeInterface.requestWhenInUseAuthorization).toHaveBeenCalledTimes(1);
      expect(harness.nativeInterface.requestAlwaysAuthorization).not.toHaveBeenCalled();
    });

    it('returns false when neither an ios nor an android option is given', async () => {
      const result = await harness.permissions.requestPermission({});

      expect(result).toBe(false);
      expect(harness.nativeInterface.requestWhenInUseAuthorization).not.toHaveBeenCalled();
    });
  });

  describe('requestPermission on an unsupported platform', () => {
    it('returns false without touching native modules', async () => {
      rn.Platform.OS = 'windows';

      const result = await harness.permissions.requestPermission({ ios: 'always' });

      expect(result).toBe(false);
      expect(harness.nativeInterface.requestAlwaysAuthorization).not.toHaveBeenCalled();
    });
  });

  describe('checkPermission on an unsupported platform', () => {
    it('returns false without touching native modules', async () => {
      rn.Platform.OS = 'windows';

      await expect(
        harness.permissions.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(false);
      expect(harness.nativeInterface.getAuthorizationStatus).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentPermission', () => {
    it('delegates to the native authorization status on ios', async () => {
      rn.Platform.OS = 'ios';
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedAlways');

      await expect(harness.permissions.getCurrentPermission()).resolves.toBe('authorizedAlways');
    });

    it('returns authorizedFine when only the fine permission is granted on android', async () => {
      rn.Platform.OS = 'android';
      rn.PermissionsAndroid.check.mockImplementation(
        (permission: string) => permission === 'android.permission.ACCESS_FINE_LOCATION'
      );

      await expect(harness.permissions.getCurrentPermission()).resolves.toBe('authorizedFine');
    });

    it('returns authorizedCoarse when only the coarse permission is granted on android', async () => {
      rn.Platform.OS = 'android';
      rn.PermissionsAndroid.check.mockImplementation(
        (permission: string) => permission === 'android.permission.ACCESS_COARSE_LOCATION'
      );

      await expect(harness.permissions.getCurrentPermission()).resolves.toBe('authorizedCoarse');
    });

    it('returns notDetermined when no permission is granted on android', async () => {
      rn.Platform.OS = 'android';
      rn.PermissionsAndroid.check.mockResolvedValue(false);

      await expect(harness.permissions.getCurrentPermission()).resolves.toBe('notDetermined');
    });

    it('delegates to the native authorization status on harmony', async () => {
      rn.Platform.OS = 'harmony';
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedCoarse');

      await expect(harness.permissions.getCurrentPermission()).resolves.toBe('authorizedCoarse');
    });

    it('returns restricted on an unsupported platform', async () => {
      rn.Platform.OS = 'windows';

      await expect(harness.permissions.getCurrentPermission()).resolves.toBe('restricted');
    });
  });

  describe('checkPermission on ios', () => {
    beforeEach(() => {
      rn.Platform.OS = 'ios';
    });

    it('returns false when no ios option is given', async () => {
      await expect(harness.permissions.checkPermission({})).resolves.toBe(false);
    });

    it('returns false for an unknown ios option value', async () => {
      // 注意：ios 分支先查询状态再判档位，未知档位最终走 fall-through return false
      await expect(
        harness.permissions.checkPermission({ ios: 'ignore' as any })
      ).resolves.toBe(false);
    });

    it('only passes the always check for authorizedAlways', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedAlways');

      await expect(
        harness.permissions.checkPermission({ ios: 'always' })
      ).resolves.toBe(true);
    });

    it('fails the always check for authorizedWhenInUse', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedWhenInUse');

      await expect(
        harness.permissions.checkPermission({ ios: 'always' })
      ).resolves.toBe(false);
    });

    it('passes the whenInUse check for both authorized states', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedWhenInUse');
      await expect(
        harness.permissions.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(true);

      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedAlways');
      await expect(
        harness.permissions.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(true);
    });

    it('fails the whenInUse check for denied', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('denied');

      await expect(
        harness.permissions.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(false);
    });
  });

  describe('checkPermission on android', () => {
    beforeEach(() => {
      rn.Platform.OS = 'android';
    });

    it('returns false when no android option is given', async () => {
      await expect(harness.permissions.checkPermission({})).resolves.toBe(false);
    });

    it('passes the fine check only for authorizedFine', async () => {
      // android 分支经 getCurrentPermission → PermissionsAndroid.check 判定状态
      rn.PermissionsAndroid.check.mockImplementation(
        (permission: string) => permission === 'android.permission.ACCESS_FINE_LOCATION'
      );
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'fine' } })
      ).resolves.toBe(true);

      rn.PermissionsAndroid.check.mockImplementation(() => false);
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'fine' } })
      ).resolves.toBe(false);
    });

    it('passes the coarse check for authorizedFine or authorizedCoarse', async () => {
      rn.PermissionsAndroid.check.mockImplementation(
        (permission: string) => permission === 'android.permission.ACCESS_FINE_LOCATION'
      );
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'coarse' } })
      ).resolves.toBe(true);

      rn.PermissionsAndroid.check.mockImplementation(
        (permission: string) => permission === 'android.permission.ACCESS_COARSE_LOCATION'
      );
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'coarse' } })
      ).resolves.toBe(true);
    });

    it('returns false for an unknown detail value', async () => {
      await expect(
        harness.permissions.checkPermission({
          android: { detail: 'bogus' } as any,
        })
      ).resolves.toBe(false);
    });
  });

  describe('checkPermission on harmony', () => {
    beforeEach(() => {
      rn.Platform.OS = 'harmony';
    });

    it('passes the always check only for authorizedAlways', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedAlways');
      await expect(
        harness.permissions.checkPermission({ ios: 'always' })
      ).resolves.toBe(true);

      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedFine');
      await expect(
        harness.permissions.checkPermission({ ios: 'always' })
      ).resolves.toBe(false);
    });

    it('passes the fine checks for authorizedFine', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedFine');
      await expect(
        harness.permissions.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(true);
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'fine' } })
      ).resolves.toBe(true);
    });

    it('passes the coarse check for authorizedFine or authorizedCoarse', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedCoarse');
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'coarse' } })
      ).resolves.toBe(true);

      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedFine');
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'coarse' } })
      ).resolves.toBe(true);
    });

    it('fails the fine check for authorizedCoarse', async () => {
      harness.nativeInterface.getAuthorizationStatus.mockResolvedValue('authorizedCoarse');
      await expect(
        harness.permissions.checkPermission({ ios: 'whenInUse' })
      ).resolves.toBe(false);
      await expect(
        harness.permissions.checkPermission({ android: { detail: 'fine' } })
      ).resolves.toBe(false);
    });

    it('returns false when no matching option is given', async () => {
      await expect(harness.permissions.checkPermission({})).resolves.toBe(false);
    });
  });

  describe('subscribeToPermissionUpdates', () => {
    it("registers the listener on the 'authorizationStatusDidChange' event", () => {
      const listener = jest.fn();
      const unsubscribe = harness.permissions.subscribeToPermissionUpdates(listener);

      expect(harness.emitter.addListener).toHaveBeenCalledWith(
        'authorizationStatusDidChange',
        listener
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('removes the emitter subscription when unsubscribed', () => {
      const remove = jest.fn();
      harness.emitter.addListener.mockReturnValueOnce({ remove });
      const unsubscribe = harness.permissions.subscribeToPermissionUpdates(jest.fn());

      unsubscribe();

      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});
