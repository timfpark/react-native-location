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

import Subscriptions from '../src/lib/subscriptions';

function makeNativeInterface() {
  return {
    startUpdatingLocation: jest.fn(),
    stopUpdatingLocation: jest.fn(),
    startUpdatingHeading: jest.fn(),
    stopUpdatingHeading: jest.fn(),
    startMonitoringSignificantLocationChanges: jest.fn(),
    stopMonitoringSignificantLocationChanges: jest.fn(),
  };
}

function makeEventEmitter() {
  return {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  };
}

describe('Subscriptions', () => {
  let nativeInterface: ReturnType<typeof makeNativeInterface>;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;
  let subscriptions: Subscriptions;

  beforeEach(() => {
    nativeInterface = makeNativeInterface();
    eventEmitter = makeEventEmitter();
    subscriptions = new Subscriptions(nativeInterface as any, eventEmitter as any);
  });

  describe('subscribeToLocationUpdates', () => {
    it("registers a listener on the 'locationUpdated' event and starts native updates", () => {
      const listener = jest.fn();
      subscriptions.subscribeToLocationUpdates(listener);

      expect(eventEmitter.addListener).toHaveBeenCalledWith('locationUpdated', listener);
      expect(nativeInterface.startUpdatingLocation).toHaveBeenCalledTimes(1);
    });

    it('stops native updates when the only subscriber unsubscribes', () => {
      const unsubscribe = subscriptions.subscribeToLocationUpdates(jest.fn());
      expect(nativeInterface.stopUpdatingLocation).not.toHaveBeenCalled();

      unsubscribe();

      expect(nativeInterface.stopUpdatingLocation).toHaveBeenCalledTimes(1);
    });

    it('keeps native updates running while at least one subscriber remains', () => {
      const unsubscribe1 = subscriptions.subscribeToLocationUpdates(jest.fn());
      const unsubscribe2 = subscriptions.subscribeToLocationUpdates(jest.fn());

      unsubscribe1();
      expect(nativeInterface.stopUpdatingLocation).not.toHaveBeenCalled();

      unsubscribe2();
      expect(nativeInterface.stopUpdatingLocation).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when unsubscribed twice', () => {
      const unsubscribe = subscriptions.subscribeToLocationUpdates(jest.fn());

      unsubscribe();
      unsubscribe();

      expect(nativeInterface.stopUpdatingLocation).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToHeadingUpdates', () => {
    it("registers a listener on the 'headingUpdated' event and starts the heading sensor", () => {
      const listener = jest.fn();
      subscriptions.subscribeToHeadingUpdates(listener);

      expect(eventEmitter.addListener).toHaveBeenCalledWith('headingUpdated', listener);
      expect(nativeInterface.startUpdatingHeading).toHaveBeenCalledTimes(1);
    });

    it('stops the heading sensor when the last subscriber unsubscribes', () => {
      const unsubscribe = subscriptions.subscribeToHeadingUpdates(jest.fn());

      unsubscribe();

      expect(nativeInterface.stopUpdatingHeading).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToSignificantLocationUpdates', () => {
    it("registers a listener on the 'locationUpdated' event and starts significant monitoring", () => {
      const listener = jest.fn();
      subscriptions.subscribeToSignificantLocationUpdates(listener);

      expect(eventEmitter.addListener).toHaveBeenCalledWith('locationUpdated', listener);
      expect(
        nativeInterface.startMonitoringSignificantLocationChanges
      ).toHaveBeenCalledTimes(1);
    });

    it('stops significant monitoring when the last subscriber unsubscribes', () => {
      const unsubscribe = subscriptions.subscribeToSignificantLocationUpdates(jest.fn());

      unsubscribe();

      expect(
        nativeInterface.stopMonitoringSignificantLocationChanges
      ).toHaveBeenCalledTimes(1);
    });

    it('tracks significant subscribers independently from location subscribers', () => {
      const unsubscribeLocation = subscriptions.subscribeToLocationUpdates(jest.fn());
      const unsubscribeSignificant = subscriptions.subscribeToSignificantLocationUpdates(
        jest.fn()
      );

      unsubscribeLocation();
      expect(
        nativeInterface.stopMonitoringSignificantLocationChanges
      ).not.toHaveBeenCalled();

      unsubscribeSignificant();
      expect(
        nativeInterface.stopMonitoringSignificantLocationChanges
      ).toHaveBeenCalledTimes(1);
    });
  });
});
