#import <CoreLocation/CoreLocation.h>

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"

#import "RNLocation.h"

@interface RNLocation() <CLLocationManagerDelegate>

@property (strong, nonatomic) CLLocationManager *locationManager;

@end

@implementation RNLocation

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#pragma mark Initialization

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

#pragma mark

RCT_EXPORT_METHOD(requestAlwaysAuthorization)
{
    NSLog(@"react-native-location: requestAlwaysAuthorization");
    [self.locationManager requestAlwaysAuthorization];
}

RCT_EXPORT_METHOD(requestWhenInUseAuthorization)
{
    NSLog(@"react-native-location: requestWhenInUseAuthorization");
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

RCT_EXPORT_METHOD(startMonitoringSignificantLocationChanges)
{
    NSLog(@"react-native-location: startMonitoringSignificantLocationChanges");
    [self.locationManager startMonitoringSignificantLocationChanges];
}

RCT_EXPORT_METHOD(startUpdatingLocation)
{
    [self.locationManager startUpdatingLocation];
}

RCT_EXPORT_METHOD(stopMonitoringSignificantLocationChanges)
{
    [self.locationManager stopMonitoringSignificantLocationChanges];
}

RCT_EXPORT_METHOD(stopUpdatingLocation)
{
    [self.locationManager stopUpdatingLocation];
}

-(NSString *)nameForAuthorizationStatus:(CLAuthorizationStatus)authorizationStatus
{
    switch (authorizationStatus) {
        case kCLAuthorizationStatusAuthorizedAlways:
            NSLog(@"Authorization Status: authorizedAlways");
            return @"authorizedAlways";

        case kCLAuthorizationStatusAuthorizedWhenInUse:
            NSLog(@"Authorization Status: authorizedWhenInUse");
            return @"authorizedWhenInUse";

        case kCLAuthorizationStatusDenied:
            NSLog(@"Authorization Status: denied");
            return @"denied";

        case kCLAuthorizationStatusNotDetermined:
            NSLog(@"Authorization Status: notDetermined");
            return @"notDetermined";

        case kCLAuthorizationStatusRestricted:
            NSLog(@"Authorization Status: restricted");
            return @"restricted";
    }
}

-(void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
    NSString *statusName = [self nameForAuthorizationStatus:status];
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"authorizationStatusDidChange" body:statusName];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    NSLog(@"Location manager failed: %@", error);
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations {
    CLLocation *location = [locations lastObject];
    NSDictionary *locationEvent = @{
        @"coords": @{
            @"latitude": @(location.coordinate.latitude),
            @"longitude": @(location.coordinate.longitude),
            @"altitude": @(location.altitude),
            @"accuracy": @(location.horizontalAccuracy),
            @"altitudeAccuracy": @(location.verticalAccuracy),
            @"heading": @(location.course),
            @"speed": @(location.speed),
        },
        @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000) // in ms
    };

    NSLog(@"%u: lat: %f, long: %f, altitude: %f", location.timestamp, location.coordinate.latitude, location.coordinate.longitude, location.altitude);
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"locationUpdated" body:locationEvent];
}

@end
