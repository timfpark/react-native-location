const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe("RNLocation.configure", function() {
  let nativeInterface;
  let eventEmitter;

  beforeEach(async function() {
    nativeInterface = sandbox.stub(jet.module._nativeInterface);
    eventEmitter = sandbox.stub(new jet.rn.NativeEventEmitter(nativeInterface));
    jet.module._configureHelpers(nativeInterface, eventEmitter);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it("should correctly pass the options", async function() {
    const options = {
      distanceFilter: 5.0
    };
    jet.module.configure(options);

    expect(nativeInterface.configure).to.have.been.calledWith(options);

    return Promise.resolve();
  });
});
