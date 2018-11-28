import { EventEmitter } from "react-native";
import configure from "./configure";
import permission from "./permission";
import subscriptions from "./subscriptions";

export default (nativeInterface: any, eventEmitter: EventEmitter) => {
  return {
    ...configure(nativeInterface),
    ...permission(nativeInterface, eventEmitter),
    ...subscriptions(nativeInterface, eventEmitter)
  };
};
