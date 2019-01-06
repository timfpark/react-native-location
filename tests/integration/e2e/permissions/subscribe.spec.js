const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe("Permissions", function() {
  let nativeInterface;
  let eventEmitter;

  beforeEach(function beforeEach() {
    nativeInterface = sandbox.stub(jet.module._nativeInterface);
    eventEmitter = sandbox.stub(new jet.rn.NativeEventEmitter(nativeInterface));
    jet.module._configureHelpers(nativeInterface, eventEmitter);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe("RNLocation.subscribeToPermissionUpdates", function() {
    let listener;
    let removeSpy;

    beforeEach(function() {
      listener = sandbox.spy();
      removeSpy = sandbox.spy();

      eventEmitter.addListener.returns({
        remove: removeSpy
      });
    });

    it("should return a function to unsubscribe with", async function() {
      const unsubscribe = await jet.module.subscribeToPermissionUpdates(
        listener
      );
      expect(unsubscribe).to.be.a("function");
    });

    it("should call addListener when subscribed to", async function() {
      await jet.module.subscribeToPermissionUpdates(listener);
      expect(eventEmitter.addListener).to.have.been.called;
      expect(removeSpy).not.to.have.been.called;
    });

    it("should call remove when the unsubscribe function is called", async function() {
      const unsubscribe = await jet.module.subscribeToPermissionUpdates(
        listener
      );
      unsubscribe();

      expect(removeSpy).to.have.been.called;
    });

    // TODO: Test calling the listener
  });
});
