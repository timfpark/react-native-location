package com.github.reactnativecommunity.location;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.location.Location;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

import java.lang.ref.WeakReference;

public class RNPlayServicesLocationProvider implements RNLocationProvider {
    private static final int REQUEST_CHECK_SETTINGS = 1234;

    private final ReactApplicationContext context;
    private final FusedLocationProviderClient locationProvider;
    private final SettingsClient locationSettingsClient;

    private LocationRequest locationRequest = new LocationRequest();
    private boolean isUpdatingLocation = false;

    private WeakReference<Activity> pendingConfigureActivity = null;
    private ReadableMap pendingConfigureOptions = null;
    private Promise pendingConfigurePromise = null;

    public RNPlayServicesLocationProvider(Activity activity, ReactApplicationContext context) {
        this.context = context;
        if (activity != null) {
            locationProvider = LocationServices.getFusedLocationProviderClient(activity);
            locationSettingsClient = LocationServices.getSettingsClient(activity);
        } else {
            locationProvider = LocationServices.getFusedLocationProviderClient(context);
            locationSettingsClient = LocationServices.getSettingsClient(context);
        }
    }

    // Public interface

    @Override
    public void configure(final Activity activity, final ReadableMap options, final Promise promise) {
        boolean hasChanges = false;

        // Distance filter
        if (options.hasKey("distanceFilter")) {
            if (options.getType("distanceFilter") == ReadableType.Number) {
                Double distanceFilter = options.getDouble("distanceFilter");
                locationRequest.setSmallestDisplacement(distanceFilter.floatValue());
                hasChanges = true;
            } else {
                Utils.emitWarning(context, "distanceFilter must be a number", "401");
            }
        }

        // Priority
        if (options.hasKey("desiredAccuracy")) {
            if (options.getType("desiredAccuracy") == ReadableType.Map) {
                ReadableMap desiredAccuracy = options.getMap("desiredAccuracy");
                if (desiredAccuracy.hasKey("android")) {
                    if (desiredAccuracy.getType("android") == ReadableType.String) {
                        String desiredAccuracyAndroid = desiredAccuracy.getString("android");
                        if (desiredAccuracyAndroid.equals("balancedPowerAccuracy")) {
                            locationRequest.setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);
                            hasChanges = true;
                        } else if (desiredAccuracyAndroid.equals("highAccuracy")) {
                            locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
                            hasChanges = true;
                        } else if (desiredAccuracyAndroid.equals("lowPower")) {
                            locationRequest.setPriority(LocationRequest.PRIORITY_LOW_POWER);
                            hasChanges = true;
                        } else if (desiredAccuracyAndroid.equals("noPower")) {
                            locationRequest.setPriority(LocationRequest.PRIORITY_NO_POWER);
                            hasChanges = true;
                        } else {
                            Utils.emitWarning(context, "desiredAccuracy.android was passed an unknown value: " + desiredAccuracyAndroid, "401");
                        }
                    } else {
                        Utils.emitWarning(context, "desiredAccuracy.android must be a string", "401");
                    }
                }
            } else {
                Utils.emitWarning(context, "desiredAccuracy must be an object", "401");
            }
        }

        // Interval
        if (options.hasKey("interval")) {
            if (options.getType("interval") == ReadableType.Number) {
                Double interval = options.getDouble("interval");
                locationRequest.setInterval(interval.longValue());
                hasChanges = true;
            } else {
                Utils.emitWarning(context, "interval must be a number", "401");
            }
        }

        // Fastest interval
        if (options.hasKey("fastestInterval")) {
            if (options.getType("fastestInterval") == ReadableType.Number) {
                Double fastestInterval = options.getDouble("fastestInterval");
                locationRequest.setFastestInterval(fastestInterval.longValue());
                hasChanges = true;
            } else {
                Utils.emitWarning(context, "fastestInterval must be a number", "401");
            }
        }

        // Max wait time
        if (options.hasKey("maxWaitTime")) {
            if (options.getType("maxWaitTime") == ReadableType.Number) {
                Double maxWaitTime = options.getDouble("maxWaitTime");
                locationRequest.setMaxWaitTime(maxWaitTime.longValue());
                hasChanges = true;
            } else {
                Utils.emitWarning(context, "maxWaitTime must be a number", "401");
            }
        }

        // Return early if no changes were made
        if (!hasChanges) {
            promise.resolve(null);
            return;
        }

        // Make the request to change the configuration
        LocationSettingsRequest locationSettingsRequest = new LocationSettingsRequest.Builder()
                .addLocationRequest(locationRequest)
                .build();

        // Handle the success case
        Task<LocationSettingsResponse> task = locationSettingsClient.checkLocationSettings(locationSettingsRequest);
        task.addOnSuccessListener(new OnSuccessListener<LocationSettingsResponse>() {
            @Override
            public void onSuccess(LocationSettingsResponse locationSettingsResponse) {
                reSetUpLocationListeners();
                promise.resolve(null);
            }
        });

        // On failure, attempt to recover. If we can't then reject the promise
        task.addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {
                if (e instanceof ResolvableApiException) {
                    // Location settings are not satisfied, but this can be fixed
                    // by showing the user a dialog.
                    try {
                        // Save the settings we're currently trying to use along with the promise
                        pendingConfigureActivity = new WeakReference<>(activity);
                        pendingConfigureOptions = options;
                        pendingConfigurePromise = promise;
                        // Show the dialog by calling startResolutionForResult(),
                        // and check the result in onActivityResult().
                        ResolvableApiException resolvable = (ResolvableApiException) e;
                        resolvable.startResolutionForResult(activity, REQUEST_CHECK_SETTINGS);
                    } catch (IntentSender.SendIntentException sendEx) {
                        // Ignore the error.
                    }
                } else {
                    // Reject the promise with an error
                    promise.reject("500", "Error configuring react-native-location", e);
                }
            }
        });
    }

    @Override
    public void startUpdatingLocation() {
        isUpdatingLocation = true;
        reSetUpLocationListeners();
    }

    @Override
    public void stopUpdatingLocation() {
        isUpdatingLocation = false;
        reSetUpLocationListeners();
    }

    // Callbacks

    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_CHECK_SETTINGS) return;

        if (resultCode == Activity.RESULT_OK
                && pendingConfigureActivity != null
                && pendingConfigureActivity.get() != null
                && pendingConfigureOptions != null
                && pendingConfigurePromise != null)
        {
            // If the resolution was ok, try to configure again
            configure(pendingConfigureActivity.get(), pendingConfigureOptions, pendingConfigurePromise);
        } else if (pendingConfigurePromise != null) {
            // If not, we reject the promise
            pendingConfigurePromise.reject("500", "Error configuring react-native-location");
        }

        // Cleanup our stored state
        pendingConfigureActivity = null;
        pendingConfigureOptions = null;
        pendingConfigurePromise = null;
    }

    // Helper methods

    private void reSetUpLocationListeners() {
        if (isUpdatingLocation) {
            int finePermission = ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION);
            int coarsePermission = ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION);
            if (finePermission != PackageManager.PERMISSION_GRANTED && coarsePermission != PackageManager.PERMISSION_GRANTED) {
                Utils.emitWarning(context, "Attempted to start updating the location without location permissions", "403");
                return;
            }
            locationProvider.requestLocationUpdates(locationRequest, locationCallback, null);
        } else {
            locationProvider.removeLocationUpdates(locationCallback);
        }
    }

    private LocationCallback locationCallback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult locationResult) {
            if (locationResult == null || !isUpdatingLocation) {
                return;
            }

            // Map the locations to maps
            WritableArray results = Arguments.createArray();
            for (Location location : locationResult.getLocations()) {
                results.pushMap(Utils.locationToMap(location));
            }

            // Emit the event
            Utils.emitEvent(context, "locationUpdated", results);
        }
    };

}
