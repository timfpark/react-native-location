package com.github.reactnativecommunity.location;

import android.app.Activity;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;

import javax.annotation.Nullable;

public class RNStandardLocationProvider implements RNLocationProvider {
    private final ReactApplicationContext context;
    private LocationOptions options = new LocationOptions();
    private @Nullable String watchedProvider;

    public RNStandardLocationProvider(ReactApplicationContext context) {
        this.context = context;
    }

    @Override
    public void configure(Activity activity, ReadableMap map, Promise promise) {
        options = LocationOptions.fromReactMap(context, map);

        if (watchedProvider != null) {
            setupListening();
        }
        promise.resolve(null);
    }

    @Override
    public void startUpdatingLocation() {
        setupListening();
    }

    @Override
    public void stopUpdatingLocation() {
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) {
            return;
        }
        locationManager.removeUpdates(locationListener);
        watchedProvider = null;
    }

    // Listener

    private final LocationListener locationListener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            processLocation(location);

        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
            if (status == LocationProvider.OUT_OF_SERVICE) {
                Utils.emitWarning(context, "Provider " + provider + " is out of service.", "500");
            } else if (status == LocationProvider.TEMPORARILY_UNAVAILABLE) {
                Utils.emitWarning(context, "Provider " + provider + " is temporarily unavailable.", "501");
            }
        }

        @Override
        public void onProviderEnabled(String provider) {}

        @Override
        public void onProviderDisabled(String provider) {}
    };


    // Private helpers
    private void setupListening() {
        try {
            LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) {
                Utils.emitWarning(context, "No location manager is available.", "502");
                return;
            }
            String provider = getProvider(locationManager, options.highAccuracy);
            if (provider == null) {
                Utils.emitWarning(context, "There is no valid location provider available.", "503");
                return;
            }
            if (!provider.equals(watchedProvider)) {
                // Setup the listener
                locationManager.removeUpdates(locationListener);
                locationManager.requestLocationUpdates(provider, 1000, options.distanceFilter, locationListener);

                // Get the last known location
                Location lastLocation = locationManager.getLastKnownLocation(provider);
                if (lastLocation != null) {
                    processLocation(lastLocation);
                }
            }
            watchedProvider = provider;
        } catch (SecurityException e) {
            Utils.emitWarning(context, "Attempted to start updating the location without location permissions. Detail: " + e.getLocalizedMessage(), "403");
        }
    }

    @Nullable
    private String getProvider(LocationManager locationManager, boolean highAccuracy) {
        String provider =
                highAccuracy ? LocationManager.GPS_PROVIDER : LocationManager.NETWORK_PROVIDER;
        if (!locationManager.isProviderEnabled(provider)) {
            provider = provider.equals(LocationManager.GPS_PROVIDER)
                    ? LocationManager.NETWORK_PROVIDER
                    : LocationManager.GPS_PROVIDER;
            if (!locationManager.isProviderEnabled(provider)) {
                return null;
            }
        }
        return provider;
    }

    private void processLocation(Location location) {
        // Convert the location to a map and wrap it in an array
        WritableArray results = Arguments.createArray();
        results.pushMap(Utils.locationToMap(location));

        // Emit the event
        Utils.emitEvent(context, "locationUpdated", results);
    }

    private static class LocationOptions {
        private static final float RCT_DEFAULT_LOCATION_ACCURACY = 100;

        private final boolean highAccuracy;
        private final float distanceFilter;

        private LocationOptions() {
            this.highAccuracy = false;
            this.distanceFilter = RCT_DEFAULT_LOCATION_ACCURACY;
        }

        private LocationOptions(boolean highAccuracy, float distanceFilter) {
            this.highAccuracy = highAccuracy;
            this.distanceFilter = distanceFilter;
        }

        private static LocationOptions fromReactMap(ReactApplicationContext context, ReadableMap map) {
            boolean highAccuracy = false;
            float distanceFilter = RCT_DEFAULT_LOCATION_ACCURACY;

            // Priority (accuracy)
            if (map.hasKey("desiredAccuracy")) {
                if (map.getType("desiredAccuracy") == ReadableType.Map) {
                    ReadableMap desiredAccuracy = map.getMap("desiredAccuracy");
                    if (desiredAccuracy.hasKey("android")) {
                        if (desiredAccuracy.getType("android") == ReadableType.String) {
                            String desiredAccuracyAndroid = desiredAccuracy.getString("android");
                            switch (desiredAccuracyAndroid) {
                                case "highAccuracy":
                                    highAccuracy = true;
                                    break;
                                case "balancedPowerAccuracy":
                                case "lowPower":
                                case "noPower":
                                    highAccuracy = false;
                                    break;
                                default:
                                    Utils.emitWarning(context, "desiredAccuracy.android was passed an unknown value: " + desiredAccuracyAndroid, "401");
                                    break;
                            }
                        } else {
                            Utils.emitWarning(context, "desiredAccuracy.android must be a string", "401");
                        }
                    }
                } else {
                    Utils.emitWarning(context, "desiredAccuracy must be an object", "401");
                }
            }

            // Distance filter
            if (map.hasKey("distanceFilter")) {
                if (map.getType("distanceFilter") == ReadableType.Number) {
                    distanceFilter = (float) map.getDouble("distanceFilter");

                } else {
                    Utils.emitWarning(context, "distanceFilter must be a number", "401");
                }
            }

            return new LocationOptions(highAccuracy, distanceFilter);
        }
    }
}
