package com.github.reactnativecommunity.location;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
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

public class RNFusedLocationProvider {
    private static final int REQUEST_CHECK_SETTINGS = 12341234;

    private final ReactApplicationContext context;
    private final FusedLocationProviderClient locationProvider;
    private final SettingsClient locationSettingsClient;

    private LocationRequest locationRequest = new LocationRequest();
    private boolean isUpdatingLocation = false;

    private WeakReference<Activity> pendingConfigureActivity = null;
    private ReadableMap pendingConfigureOptions = null;
    private Promise pendingConfigurePromise = null;

    public RNFusedLocationProvider(Activity activity, ReactApplicationContext context) {
        this.context = context;
        locationProvider = LocationServices.getFusedLocationProviderClient(activity);
        locationSettingsClient = LocationServices.getSettingsClient(activity);
    }

    // Public interface

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

    public void startUpdatingLocation() {
        isUpdatingLocation = true;
        reSetUpLocationListeners();
    }

    public void stopUpdatingLocation() {
        isUpdatingLocation = false;
        reSetUpLocationListeners();
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

            // Get the last location
            Location location = locationResult.getLastLocation();

            // Create the coordinate map
            WritableMap coordsMap = Arguments.createMap();
            coordsMap.putDouble("latitude", location.getLatitude());
            coordsMap.putDouble("longitude", location.getLongitude());
            coordsMap.putDouble("altitude", location.getAltitude());
            coordsMap.putDouble("accuracy", location.getAccuracy());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                coordsMap.putDouble("altitudeAccuracy", location.getVerticalAccuracyMeters());
            } else {
                coordsMap.putDouble("altitudeAccuracy", 0.0);
            }
            coordsMap.putDouble("course", location.getBearing());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                coordsMap.putDouble("courseAccuracy", location.getBearingAccuracyDegrees());
            } else {
                coordsMap.putDouble("courseAccuracy", 0.0);
            }
            coordsMap.putDouble("speed", location.getSpeed());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                coordsMap.putDouble("speedAccuracy", location.getSpeedAccuracyMetersPerSecond());
            } else {
                coordsMap.putDouble("speedAccuracy", 0.0);
            }

            // Create the container map
            WritableMap map = Arguments.createMap();
            map.putDouble("timestamp", location.getTime());
            map.putMap("coords", coordsMap);

            // Emit the event
            Utils.emitEvent(context, "locationUpdated", map);
        };
    };

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
}
