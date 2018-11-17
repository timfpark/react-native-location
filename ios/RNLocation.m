#import <CoreLocation/CoreLocation.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>

#import "RNLocation.h"

@interface RNLocation() <CLLocationManagerDelegate>

@property (strong, nonatomic) CLLocationManager *locationManager;
@property (nonatomic) BOOL hasListeners;

@end

@implementation RNLocation

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"authorizationStatusDidChange", @"headingUpdated", @"locationUpdated"];
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

        self.locationManager.distanceFilter = kCLDistanceFilterNone;
        self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;

        self.locationManager.pausesLocationUpdatesAutomatically = NO;
    }

    return self;
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

#pragma mark - React methods

RCT_EXPORT_METHOD(requestAlwaysAuthorization)
{
    [self.locationManager requestAlwaysAuthorization];
}

RCT_EXPORT_METHOD(requestWhenInUseAuthorization)
{
    [self.locationManager requestWhenInUseAuthorization];
}

RCT_EXPORT_METHOD(getAuthorizationStatus:(RCTResponseSenderBlock)callback)
{
    callback(@[[self nameForAuthorizationStatus:[CLLocationManager authorizationStatus]]]);
}

RCT_EXPORT_METHOD(setDesiredAccuracy:(double) accuracy)
{
    self.locationManager.desiredAccuracy = accuracy;
}

RCT_EXPORT_METHOD(setDistanceFilter:(double) distance)
{
    self.locationManager.distanceFilter = distance;
}

RCT_EXPORT_METHOD(setAllowsBackgroundLocationUpdates:(BOOL) enabled)
{
    self.locationManager.allowsBackgroundLocationUpdates = enabled;
}

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
    if (!self.hasListeners) {
        return;
    }
    
    NSString *statusName = [self nameForAuthorizationStatus:status];
    [self sendEventWithName:@"authorizationStatusDidChange" body:statusName];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
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
    
    CLLocation *location = [locations lastObject];
    NSDictionary *locationEvent = @{
        @"coords": @{
            @"latitude": @(location.coordinate.latitude),
            @"longitude": @(location.coordinate.longitude),
            @"altitude": @(location.altitude),
            @"accuracy": @(location.horizontalAccuracy),
            @"altitudeAccuracy": @(location.verticalAccuracy),
            @"course": @(location.course),
            @"speed": @(location.speed),
            @"floor": @(location.floor.level),
        },
        @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000) // in ms
    };

    [self sendEventWithName:@"locationUpdated" body:locationEvent];
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
