const should = require("should");
require("should-sinon");

describe("Permissions", function() {
  let nativeInterface;
  let eventEmitter;

  beforeEach(async function beforeEach() {
    nativeInterface = sinon.stub(jet.module.nativeInterface);
    eventEmitter = sinon.stub(new jet.rn.NativeEventEmitter(nativeInterface));
    jet.module.configureHelpers(nativeInterface, eventEmitter);
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

          nativeInterface.requestAlwaysAuthorization.should.not.be.called();
          nativeInterface.requestWhenInUseAuthorization.should.not.be.called();
        });

        it("should resolve to false when called with no options", async function() {
          const result = await jet.module.requestPermission({
            // No options
          });

          should(result).be.false();
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

          nativeInterface.requestAlwaysAuthorization.should.be.calledOnce();
          nativeInterface.requestWhenInUseAuthorization.should.not.be.called();
        });

        it("should resolve to true when the native interface does", async function() {
          nativeInterface.requestAlwaysAuthorization.returns(
            Promise.resolve(true)
          );

          const result = await jet.module.requestPermission({
            ios: "always"
          });

          should(result).be.true();
        });

        it("should resolve to false when the native interface does", async function() {
          nativeInterface.requestAlwaysAuthorization.returns(
            Promise.resolve(false)
          );

          const result = await jet.module.requestPermission({
            ios: "always"
          });

          should(result).be.false();
        });
      });

      describe("whenInUse", function() {
        it("should call the correct method when asking for whenInUse permission", async function() {
          nativeInterface.requestAlwaysAuthorization.returns(
            Promise.resolve(true)
          );

          await jet.module.requestPermission({
            ios: "whenInUse"
          });

          nativeInterface.requestAlwaysAuthorization.should.not.be.called();
          nativeInterface.requestWhenInUseAuthorization.should.be.calledOnce();
        });

        it("should resolve to true when the native interface does", async function() {
          nativeInterface.requestWhenInUseAuthorization.returns(
            Promise.resolve(true)
          );

          const result = await jet.module.requestPermission({
            ios: "whenInUse"
          });

          should(result).be.true();
        });

        it("should resolve to false when the native interface does", async function() {
          nativeInterface.requestWhenInUseAuthorization.returns(
            Promise.resolve(false)
          );

          const result = await jet.module.requestPermission({
            ios: "whenInUse"
          });

          should(result).be.false();
        });
      });
    });
  });
});
