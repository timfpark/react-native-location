import { EventEmitter } from "react-native";
import configure from './configure';
import permission from './permission';

export default (nativeInterface: any, eventEmitter: EventEmitter) => {
  return {
    ...configure(nativeInterface),
    ...permission(nativeInterface, eventEmitter),
  }
}
