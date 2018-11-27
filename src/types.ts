export type AuthorizationStatus =
  | "authorizedAlways"
  | "authorizedWhenInUse"
  | "denied"
  | "restricted"
  | "notDetermined"
export type AuthorizationStatusCallback = (authorizationStatus: AuthorizationStatus) => void