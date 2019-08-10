package com.github.reactnativecommunity.location;

import android.location.Location;
import android.os.Build;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;

public class Utils {
    public static void emitWarning(ReactApplicationContext context, String message, String type) {
        WritableMap error = Arguments.createMap();
        error.putString("message", message);
        error.putString("type", type);

        emitEvent(context, "onWarning", error);
    }

    public static void emitEvent(ReactApplicationContext context, String eventName, @Nullable Object params) {
        context
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }

    public static WritableMap locationToMap(Location location) {
        WritableMap map = Arguments.createMap();

        map.putDouble("latitude", location.getLatitude());
        map.putDouble("longitude", location.getLongitude());
        map.putDouble("accuracy", location.getAccuracy());
        map.putDouble("altitude", location.getAltitude());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            map.putDouble("altitudeAccuracy", location.getVerticalAccuracyMeters());
        } else {
            map.putDouble("altitudeAccuracy", 0.0);
        }
        map.putDouble("course", location.getBearing());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            map.putDouble("courseAccuracy", location.getBearingAccuracyDegrees());
        } else {
            map.putDouble("courseAccuracy", 0.0);
        }
        map.putDouble("speed", location.getSpeed());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            map.putDouble("speedAccuracy", location.getSpeedAccuracyMetersPerSecond());
        } else {
            map.putDouble("speedAccuracy", 0.0);
        }
        map.putDouble("timestamp", location.getTime());
        map.putBoolean("fromMockProvider", location.isFromMockProvider());

        return map;
    }

    public static boolean hasFusedLocationProvider() {
        try {
            Class.forName("com.google.android.gms.location.FusedLocationProviderClient");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
}
