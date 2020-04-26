package com.github.reactnativecommunity.location;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import androidx.annotation.NonNull; //<- Add this
import androidx.core.app.ActivityCompat; // <- Add this

public interface RNLocationProvider {
    void configure(final Activity activity, final ReadableMap options, final Promise promise);
    void startUpdatingLocation();
    void stopUpdatingLocation();
}
