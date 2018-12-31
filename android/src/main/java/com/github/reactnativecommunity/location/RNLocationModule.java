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

import javax.annotation.Nonnull;

public class RNLocationModule extends ReactContextBaseJavaModule {
    private @Nonnull RNLocationProvider locationProvider;

    public RNLocationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
        locationProvider = createDefaultLocationProvider();
    }

    @Override
    public String getName() {
        return "RNLocation";
    }

    // React interface

    @ReactMethod
    @SuppressWarnings("unused")
    public void configure(ReadableMap options, final Promise promise) {
        // Update the location provider if we are given one
        if (options.hasKey("androidProvider")) {
            String providerName = options.getString("androidProvider");
            switch (providerName) {
                case "auto":
                    locationProvider = createDefaultLocationProvider();
                    break;
                case "playServices":
                    locationProvider = createPlayServicesLocationProvider();
                    break;
                case "standard":
                    locationProvider = createStandardLocationProvider();
                    break;
                default:
                    Utils.emitWarning(getReactApplicationContext(), "androidProvider was passed an unknown value: " + providerName, "401");
            }
        }

        // Pass the options to the location provider
        locationProvider.configure(getCurrentActivity(), options, promise);
    }

    @ReactMethod
    @SuppressWarnings("unused")
    public void startUpdatingLocation() {
        locationProvider.startUpdatingLocation();
    }

    @ReactMethod
    @SuppressWarnings("unused")
    public void stopUpdatingLocation() {
        locationProvider.stopUpdatingLocation();
    }

    // Helpers

    private ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (locationProvider instanceof RNPlayServicesLocationProvider) {
                ((RNPlayServicesLocationProvider) locationProvider).onActivityResult(requestCode, resultCode, data);
            }
        }
    };

    private RNLocationProvider createDefaultLocationProvider() {
        // If we have the correct classes for the fused location provider, we default to that. Otherwise, we default to the built-in methods
        if (Utils.hasFusedLocationProvider()) {
            return createPlayServicesLocationProvider();
        } else {
            return createStandardLocationProvider();
        }
    }

    private RNPlayServicesLocationProvider createPlayServicesLocationProvider() {
        return new RNPlayServicesLocationProvider(getCurrentActivity(), getReactApplicationContext());
    }

    private RNStandardLocationProvider createStandardLocationProvider() {
        return new RNStandardLocationProvider(getReactApplicationContext());
    }
}
