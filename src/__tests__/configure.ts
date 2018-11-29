jest.mock("../lib/nativeInterface");
import RNLocation = require("../");

/// @ts-ignore
const mock = jest.requireMock("../lib/nativeInterface");

describe("configure", function() {
  afterEach(async function() {
    jest.resetAllMocks();
  });

  it("should correctly pass the options", async function() {
    const options = {
      distanceFilter: 5.0
    };
    RNLocation.configure(options);

    expect(mock.nativeInterface.configure).toHaveBeenCalledWith(options);

    return Promise.resolve();
  });
});
