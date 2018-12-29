#import <CoreLocation/CoreLocation.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>

#import "RNLocation.h"

@interface RNLocation() <CLLocationManagerDelegate>

@property (strong, nonatomic) CLLocationManager *locationManager;
@property (strong, nonatomic) RCTPromiseResolveBlock alwaysPermissionResolver;
@property (strong, nonatomic) RCTPromiseResolveBlock whenInUsePermissionResolver;
@property (nonatomic) BOOL hasListeners;

@end

@implementation RNLocation

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"authorizationStatusDidChange", @"headingUpdated", @"locationUpdated", @"onWarning"];
}

#pragma mark - Initialization

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (instancetype)init
{
    if (self = [super init]) {
        self.locationManager = [[CLLocationManager alloc] init];
        self.locationManager.delegate = self;
    }

    return self;
}

- (void)dealloc
{
    [self stopMonitoringSignificantLocationChanges];
    [self stopUpdatingLocation];
    [self stopUpdatingHeading];
    
    self.locationManager = nil;
}

#pragma mark - Listener tracking

- (void)startObserving
{
    self.hasListeners = YES;
}

- (void)stopObserving
{
    self.hasListeners = NO;
}

#pragma mark - Permissions

RCT_REMAP_METHOD(requestAlwaysAuthorization,
                 requestAlwaysAuthorizationWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    // Get the current status
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

    if (status == kCLAuthorizationStatusAuthorizedAlways) {
        // We already have the correct status so resolve with true
        resolve(@(YES));
    } else if (status == kCLAuthorizationStatusNotDetermined || status == kCLAuthorizationStatusAuthorizedWhenInUse) {
        // If we have not asked, or we have "when in use" permission, ask for always permission
        [self.locationManager requestAlwaysAuthorization];
        // Save the resolver so we can return a result later on
        self.alwaysPermissionResolver = resolve;
    } else {
        // We are not in a state to ask for permission so resolve with false
        resolve(@(NO));
    }
}

RCT_REMAP_METHOD(requestWhenInUseAuthorization,
                 requestWhenInUseAuthorizationWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    // Get the current status
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    
    if (status == kCLAuthorizationStatusAuthorizedAlways || status == kCLAuthorizationStatusAuthorizedWhenInUse) {
        // We already have the correct status so resolve with true
        resolve(@(YES));
    } else if (status == kCLAuthorizationStatusNotDetermined) {
        // If we have not asked, or we have "when in use" permission, ask for always permission
        [self.locationManager requestWhenInUseAuthorization];
        // Save the resolver so we can return a result later on
        self.whenInUsePermissionResolver = resolve;
    } else {
        // We are not in a state to ask for permission so resolve with false
        resolve(@(NO));
    }
}

RCT_REMAP_METHOD(getAuthorizationStatus,
                 getAuthorizationStatusWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *status = [self nameForAuthorizationStatus:[CLLocationManager authorizationStatus]];
    resolve(status);
}

#pragma mark - Configure

RCT_EXPORT_METHOD(configure:(NSDictionary *)options)
{
    // Activity type
    NSString *activityType = [RCTConvert NSString:options[@"activityType"]];
    if ([activityType isEqualToString:@"other"]) {
        self.locationManager.activityType = CLActivityTypeOther;
    } else if ([activityType isEqualToString:@"automotiveNavigation"]) {
        self.locationManager.activityType = CLActivityTypeAutomotiveNavigation;
    } else if ([activityType isEqualToString:@"fitness"]) {
        self.locationManager.activityType = CLActivityTypeFitness;
    } else if ([activityType isEqualToString:@"otherNavigation"]) {
        self.locationManager.activityType = CLActivityTypeOtherNavigation;
    } else if ([activityType isEqualToString:@"airborne"]) {
        if (@available(iOS 12.0, *)) {
            self.locationManager.activityType = CLActivityTypeAirborne;
        }
    }
    
    // Allows background location updates
    NSNumber *allowsBackgroundLocationUpdates = [RCTConvert NSNumber:options[@"allowsBackgroundLocationUpdates"]];
    if (allowsBackgroundLocationUpdates != nil) {
        self.locationManager.allowsBackgroundLocationUpdates = [allowsBackgroundLocationUpdates boolValue];
    }
    
    // Desired accuracy
    NSDictionary *desiredAccuracy = [RCTConvert NSDictionary:options[@"desiredAccuracy"]];
    if (desiredAccuracy != nil) {
        NSString *desiredAccuracyIOS = [RCTConvert NSString:desiredAccuracy[@"ios"]];
        if ([desiredAccuracyIOS isEqualToString:@"bestForNavigation"]) {
            self.locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation;
        } else if ([desiredAccuracyIOS isEqualToString:@"best"]) {
            self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;
        } else if ([desiredAccuracyIOS isEqualToString:@"nearestTenMeters"]) {
            self.locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters;
        } else if ([desiredAccuracyIOS isEqualToString:@"hundredMeters"]) {
            self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters;
        } else if ([desiredAccuracyIOS isEqualToString:@"threeKilometers"]) {
            self.locationManager.desiredAccuracy = kCLLocationAccuracyThreeKilometers;
        }
    }
    
    // Distance filter
    NSNumber *distanceFilter = [RCTConvert NSNumber:options[@"distanceFilter"]];
    if (distanceFilter != nil) {
        self.locationManager.distanceFilter = [distanceFilter doubleValue];
    }
    
    // Heading filter
    NSNumber *headingFilter = [RCTConvert NSNumber:options[@"headingFilter"]];
    if (headingFilter != nil) {
        double headingFilterValue = [headingFilter doubleValue];
        self.locationManager.headingFilter = headingFilterValue == 0 ? kCLHeadingFilterNone : headingFilterValue;
    }
    
    // Heading orientation
    NSString *headingOrientation = [RCTConvert NSString:options[@"headingOrientation"]];
    if ([headingOrientation isEqualToString:@"portrait"]) {
        self.locationManager.headingOrientation = CLDeviceOrientationPortrait;
    } else if ([headingOrientation isEqualToString:@"portraitUpsideDown"]) {
        self.locationManager.headingOrientation = CLDeviceOrientationPortraitUpsideDown;
    } else if ([headingOrientation isEqualToString:@"landscapeLeft"]) {
        self.locationManager.headingOrientation = CLDeviceOrientationLandscapeLeft;
    } else if ([headingOrientation isEqualToString:@"landscapeRight"]) {
        self.locationManager.headingOrientation = CLDeviceOrientationLandscapeRight;
    }
    
    // Pauses location updates automatically
    NSNumber *pausesLocationUpdatesAutomatically = [RCTConvert NSNumber:options[@"pausesLocationUpdatesAutomatically"]];
    if (pausesLocationUpdatesAutomatically != nil) {
        self.locationManager.pausesLocationUpdatesAutomatically = [pausesLocationUpdatesAutomatically boolValue];
    }
    
    // Shows background location indicator
    if (@available(iOS 11.0, *)) {
        NSNumber *showsBackgroundLocationIndicator = [RCTConvert NSNumber:options[@"showsBackgroundLocationIndicator"]];
        if (showsBackgroundLocationIndicator != nil) {
            self.locationManager.showsBackgroundLocationIndicator = [showsBackgroundLocationIndicator boolValue];
        }
    }
}

#pragma mark - Monitoring

RCT_EXPORT_METHOD(startMonitoringSignificantLocationChanges)
{
    [self.locationManager startMonitoringSignificantLocationChanges];
}

RCT_EXPORT_METHOD(startUpdatingLocation)
{
    [self.locationManager startUpdatingLocation];
}

RCT_EXPORT_METHOD(startUpdatingHeading)
{
    [self.locationManager startUpdatingHeading];
}

RCT_EXPORT_METHOD(stopMonitoringSignificantLocationChanges)
{
    [self.locationManager stopMonitoringSignificantLocationChanges];
}

RCT_EXPORT_METHOD(stopUpdatingLocation)
{
    [self.locationManager stopUpdatingLocation];
}

RCT_EXPORT_METHOD(stopUpdatingHeading)
{
    [self.locationManager stopUpdatingHeading];
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
    // Handle the always permission resolver
    if (self.alwaysPermissionResolver != nil) {
        self.alwaysPermissionResolver(@(status == kCLAuthorizationStatusAuthorizedAlways));
        self.alwaysPermissionResolver = nil;
    }
    
    // Handle the when in use permission resolver
    if (self.whenInUsePermissionResolver != nil) {
        self.whenInUsePermissionResolver(@(status == kCLAuthorizationStatusAuthorizedWhenInUse));
        self.whenInUsePermissionResolver = nil;
    }
    
    // Handle the event listener
    if (self.hasListeners) {
        NSString *statusName = [self nameForAuthorizationStatus:status];
        [self sendEventWithName:@"authorizationStatusDidChange" body:statusName];
    }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
    // TODO: Pass this to JS
    NSLog(@"Location manager failed: %@", error);
}

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading
{
    if (newHeading.headingAccuracy < 0) {
        return;
    }
    
    if (!self.hasListeners) {
        return;
    }

    // Use the true heading if it is valid.
    CLLocationDirection heading = ((newHeading.trueHeading > 0) ?
    newHeading.trueHeading : newHeading.magneticHeading);

    NSDictionary *headingEvent = @{
    @"heading": @(heading)
    };

    [self sendEventWithName:@"headingUpdated" body:headingEvent];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations
{
    if (!self.hasListeners) {
        return;
    }
    
    NSMutableArray *results = [NSMutableArray arrayWithCapacity:[locations count]];
    [locations enumerateObjectsUsingBlock:^(CLLocation *location, NSUInteger idx, BOOL *stop) {
        [results addObject:@{
                             @"latitude": @(location.coordinate.latitude),
                             @"longitude": @(location.coordinate.longitude),
                             @"altitude": @(location.altitude),
                             @"accuracy": @(location.horizontalAccuracy),
                             @"altitudeAccuracy": @(location.verticalAccuracy),
                             @"course": @(location.course),
                             @"speed": @(location.speed),
                             @"floor": @(location.floor.level),
                             @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000) // in ms
                             }];
    }];
    

    [self sendEventWithName:@"locationUpdated" body:results];
}

#pragma mark - Utilities

- (NSString *)nameForAuthorizationStatus:(CLAuthorizationStatus)authorizationStatus
{
    switch (authorizationStatus) {
        case kCLAuthorizationStatusAuthorizedAlways:
            return @"authorizedAlways";
        case kCLAuthorizationStatusAuthorizedWhenInUse:
            return @"authorizedWhenInUse";
        case kCLAuthorizationStatusDenied:
            return @"denied";
        case kCLAuthorizationStatusNotDetermined:
            return @"notDetermined";
        case kCLAuthorizationStatusRestricted:
            return @"restricted";
    }
}

@end
