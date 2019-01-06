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

  describe("RNLocation.getCurrentPermission", function() {
    describe("iOS", function() {
      before(function() {
        if (jet.rn.Platform.OS !== "ios") {
          this.skip();
        }
      });

      const testLocationPermissions = async function(
        simulatorPermission,
        expectedValue
      ) {
        await device.launchApp({
          newInstance: true,
          permissions: { location: simulatorPermission }
        });

        const result = await jet.module.getCurrentPermission();

        expect(result).to.equal(expectedValue);
      };

      it("should return the correct value when unset", async function() {
        await testLocationPermissions("unset", "notDetermined");
      });

      it("should return the correct value when denied", async function() {
        await testLocationPermissions("never", "denied");
      });

      it("should return the correct value when foreground allowed", async function() {
        await testLocationPermissions("inuse", "authorizedWhenInUse");
      });

      it("should return the correct value when always allowed", async function() {
        await testLocationPermissions("always", "authorizedAlways");
      });
    });
  });
});
