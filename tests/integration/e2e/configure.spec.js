const should = require("should");
require("should-sinon");

describe("RNLocation.configure", function() {
  let nativeInterface;
  let eventEmitter;

  beforeEach(async function() {
    nativeInterface = sinon.stub(jet.module.nativeInterface);
    eventEmitter = sinon.stub(new jet.rn.NativeEventEmitter(nativeInterface));
    jet.module.configureHelpers(nativeInterface, eventEmitter);
  });

  it("should correctly pass the options", async function() {
    const options = {
      distsnceFilter: 5.0
    };
    jet.module.configure(options);

    nativeInterface.configure.should.be.calledWith(options);

    return Promise.resolve();
  });
});
