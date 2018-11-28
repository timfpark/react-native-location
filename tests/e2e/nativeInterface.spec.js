const should = require("should");
require("should-sinon");

describe("Native interface", () => {
  let nativeInterface;
  let eventEmitter;

  beforeEach(async function beforeEach() {
    nativeInterface = sinon.stub(jet.module.nativeInterface);
    eventEmitter = sinon.stub(new jet.rn.NativeEventEmitter(nativeInterface));
    jet.module.configureHelpers(nativeInterface, eventEmitter);
  });

  it("configure", async () => {
    const options = {
      distsnceFilter: 5.0
    };
    jet.module.configure(options);

    nativeInterface.configure.should.be.calledWith(options);

    return Promise.resolve();
  });
});
