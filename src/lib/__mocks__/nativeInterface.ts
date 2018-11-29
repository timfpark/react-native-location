export const nativeInterface = {
  configure: jest.fn()
};
export const eventEmitter = null;

export const get = (): any => {
  return { nativeInterface, eventEmitter };
};

export default {
  get,
  nativeInterface,
  eventEmitter
};
