package com.github.reactnativecommunity.location;

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

    public static void emitEvent(ReactApplicationContext context, String eventName, @Nullable WritableMap params) {
        context
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }
}
