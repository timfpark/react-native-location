const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe("Subscriptions", function() {
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

  describe("RNLocation.subscribeToSignificantLocationUpdates", function() {
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
      const unsubscribe = await jet.module.subscribeToSignificantLocationUpdates(
        listener
      );
      expect(unsubscribe).to.be.a("function");
    });

    it("should call addListener when subscribed to", async function() {
      await jet.module.subscribeToSignificantLocationUpdates(listener);
      expect(eventEmitter.addListener).to.have.been.called;
      expect(removeSpy).not.to.have.been.called;
    });

    it("should call to start location updates when subscribed to", async function() {
      await jet.module.subscribeToSignificantLocationUpdates(listener);
      expect(nativeInterface.startMonitoringSignificantLocationChanges).to.have
        .been.calledOnce;
      expect(nativeInterface.stopMonitoringSignificantLocationChanges).not.to
        .have.been.called;
    });

    it("should call remove when the unsubscribe function is called", async function() {
      const unsubscribe = await jet.module.subscribeToSignificantLocationUpdates(
        listener
      );
      unsubscribe();

      expect(removeSpy).to.have.been.called;
    });

    it("should call to stop location updates when the unsubscribe function is called with a single subscriber", async function() {
      const unsubscribe = await jet.module.subscribeToSignificantLocationUpdates(
        listener
      );
      unsubscribe();

      expect(nativeInterface.stopMonitoringSignificantLocationChanges).to.have
        .been.calledOnce;
    });

    it("should not call to stop location updates if there is still another subscriber when an unsubscribe is called", async function() {
      const unsubscribe1 = await jet.module.subscribeToSignificantLocationUpdates(
        listener
      );
      const unsubscribe2 = await jet.module.subscribeToSignificantLocationUpdates(
        listener
      );
      unsubscribe1();

      expect(nativeInterface.stopMonitoringSignificantLocationChanges).not.to
        .have.been.called;

      unsubscribe2();
      expect(nativeInterface.stopMonitoringSignificantLocationChanges).to.have
        .been.calledOnce;
    });

    // TODO: Test calling the listener
  });
});
