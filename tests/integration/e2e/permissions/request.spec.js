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

  describe("RNLocation.requestPermission", function() {
    describe("iOS", function() {
      before(function() {
        if (jet.rn.Platform.OS !== "ios") {
          this.skip();
        }
      });

      describe("none", function() {
        it("should call neither method when no options are passed", async function() {
          await jet.module.requestPermission({
            // No options
          });

          expect(nativeInterface.requestAlwaysAuthorization).not.to.have.been
            .called;
          expect(nativeInterface.requestWhenInUseAuthorization).not.to.have.been
            .called;
        });

        it("should resolve to false when called with no options", async function() {
          const result = await jet.module.requestPermission({
            // No options
          });

          expect(result).to.be.equal(false);
        });
      });

      describe("always", function() {
        it("should call the correct method when asking for always permission", async function() {
          nativeInterface.requestAlwaysAuthorization.returns(
            Promise.resolve(true)
          );

          await jet.module.requestPermission({
            ios: "always"
          });

          expect(nativeInterface.requestAlwaysAuthorization).to.have.been
            .calledOnce;
          expect(nativeInterface.requestWhenInUseAuthorization).not.to.have.been
            .called;
        });

        it("should resolve to true when the native interface does", async function() {
          nativeInterface.requestAlwaysAuthorization.returns(
            Promise.resolve(true)
          );

          const result = await jet.module.requestPermission({
            ios: "always"
          });

          expect(result).to.be.equal(true);
        });

        it("should resolve to false when the native interface does", async function() {
          nativeInterface.requestAlwaysAuthorization.returns(
            Promise.resolve(false)
          );

          const result = await jet.module.requestPermission({
            ios: "always"
          });

          expect(result).to.be.equal(false);
        });
      });

      describe("whenInUse", function() {
        it("should call the correct method when asking for whenInUse permission", async function() {
          nativeInterface.requestWhenInUseAuthorization.returns(
            Promise.resolve(true)
          );

          await jet.module.requestPermission({
            ios: "whenInUse"
          });

          expect(nativeInterface.requestWhenInUseAuthorization).to.have.been
            .calledOnce;
          expect(nativeInterface.requestAlwaysAuthorization).not.to.have.been
            .called;
        });

        it("should resolve to true when the native interface does", async function() {
          nativeInterface.requestWhenInUseAuthorization.returns(
            Promise.resolve(true)
          );

          const result = await jet.module.requestPermission({
            ios: "whenInUse"
          });

          expect(result).to.be.equal(true);
        });

        it("should resolve to false when the native interface does", async function() {
          nativeInterface.requestWhenInUseAuthorization.returns(
            Promise.resolve(false)
          );

          const result = await jet.module.requestPermission({
            ios: "whenInUse"
          });

          expect(result).to.be.equal(false);
        });
      });
    });
  });
});
