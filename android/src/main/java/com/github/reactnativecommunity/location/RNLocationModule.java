package com.github.reactnativecommunity.location;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.util.Map;
import java.util.HashMap;

public class RNLocationModule extends ReactContextBaseJavaModule {
    private RNFusedLocationProvider fusedLocationProvider;

    public RNLocationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    public String getName() {
        return "RNLocation";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        return constants;
    }

    @ReactMethod
    public void configure(ReadableMap options, final Promise promise) {
        getFusedLocationProvider().configure(getCurrentActivity(), options, promise);
    }

    @ReactMethod
    public void startUpdatingLocation() {
        getFusedLocationProvider().startUpdatingLocation();
    }

    @ReactMethod
    public void stopUpdatingLocation() {
        getFusedLocationProvider().stopUpdatingLocation();
    }

    private ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            getFusedLocationProvider().onActivityResult(requestCode, resultCode, data);
        }
    };

    private RNFusedLocationProvider getFusedLocationProvider() {
        if (fusedLocationProvider == null) {
            fusedLocationProvider = new RNFusedLocationProvider(getCurrentActivity(), getReactApplicationContext());
        }

        return fusedLocationProvider;
    }
}
