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

  describe("RNLocation.checkPermission", function() {
    describe("iOS", function() {
      before(function() {
        if (jet.rn.Platform.OS !== "ios") {
          this.skip();
        }
      });

      const testLocationPermissions = async function(
        simulatorPermission,
        checkPermission,
        expectedValue
      ) {
        await device.launchApp({
          newInstance: true,
          permissions: { location: simulatorPermission }
        });

        const result = await jet.module.checkPermission(checkPermission);

        expect(result).to.equal(expectedValue);
      };

      describe("nothing", function() {
        it("should return the correct value when unset", async function() {
          await testLocationPermissions("unset", {}, false);
        });

        it("should return the correct value when denied", async function() {
          await testLocationPermissions("never", {}, false);
        });

        it("should return the correct value when foreground allowed", async function() {
          await testLocationPermissions("inuse", {}, false);
        });

        it("should return the correct value when always allowed", async function() {
          await testLocationPermissions("always", {}, false);
        });
      });

      describe("whenInUse", function() {
        it("should return the correct value when unset", async function() {
          await testLocationPermissions("unset", { ios: "whenInUse" }, false);
        });

        it("should return the correct value when denied", async function() {
          await testLocationPermissions("never", { ios: "whenInUse" }, false);
        });

        it("should return the correct value when foreground allowed", async function() {
          await testLocationPermissions("inuse", { ios: "whenInUse" }, true);
        });

        it("should return the correct value when always allowed", async function() {
          await testLocationPermissions("always", { ios: "whenInUse" }, true);
        });
      });

      describe("always", function() {
        it("should return the correct value when unset", async function() {
          await testLocationPermissions("unset", { ios: "always" }, false);
        });

        it("should return the correct value when denied", async function() {
          await testLocationPermissions("never", { ios: "always" }, false);
        });

        it("should return the correct value when foreground allowed", async function() {
          await testLocationPermissions("inuse", { ios: "always" }, false);
        });

        it("should return the correct value when always allowed", async function() {
          await testLocationPermissions("always", { ios: "always" }, true);
        });
      });
    });
  });
});
