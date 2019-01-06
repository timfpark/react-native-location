package com.rnlocationtest;

import android.app.Application;

import io.invertase.jet.JetPackage;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.devsupport.DevInternalSettings;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import com.github.reactnativecommunity.location.RNLocationPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new RNLocationPackage(),
          new JetPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();

    DevInternalSettings settings = (DevInternalSettings) getReactNativeHost().getReactInstanceManager().getDevSupportManager().getDevSettings();
    if (settings != null) {
      settings.setBundleDeltasEnabled(false);
    }

    SoLoader.init(this, /* native exopackage */ false);
  }
}
