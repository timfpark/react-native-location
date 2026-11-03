import { hilog } from '@kit.PerformanceAnalysisKit';
import { abilityDelegatorRegistry } from '@kit.TestKit';
import TestRunner from '@ohos.application.testRunner';

const TAG = 'testTag';
const DOMAIN = 0x0000;

async function onAbilityCreateCallback(): Promise<void> {
  hilog.info(DOMAIN, TAG, '%{public}s', 'onAbilityCreateCallback');
}

async function addAbilityMonitorCallback(err: object): Promise<void> {
  hilog.info(DOMAIN, TAG, 'addAbilityMonitorCallback: %{public}s', JSON.stringify(err));
}

export default class OpenHarmonyTestRunner implements TestRunner {
  onPrepare(): void {
    hilog.info(DOMAIN, TAG, '%{public}s', 'OpenHarmonyTestRunner onPrepare');
  }

  async onRun(): Promise<void> {
    hilog.info(DOMAIN, TAG, '%{public}s', 'OpenHarmonyTestRunner onRun');
    const abilityDelegatorArguments = abilityDelegatorRegistry.getArguments();
    const abilityDelegator = abilityDelegatorRegistry.getAbilityDelegator();
    const bundleName = abilityDelegatorArguments.bundleName;
    const lMonitor = {
      abilityName: 'TestAbility',
      onAbilityCreate: onAbilityCreateCallback
    };
    abilityDelegator.addAbilityMonitor(lMonitor, addAbilityMonitorCallback);
    let cmd = 'aa start -d 0 -a TestAbility -b ' + bundleName;
    const debug = abilityDelegatorArguments.parameters['-D'];
    if (debug === 'true') {
      cmd += ' -D';
    }
    hilog.info(DOMAIN, TAG, 'cmd: %{public}s', cmd);
    abilityDelegator.executeShellCommand(cmd, (err: object, data: object) => {
      hilog.info(DOMAIN, TAG, 'executeShellCommand err: %{public}s', JSON.stringify(err));
      hilog.info(DOMAIN, TAG, 'executeShellCommand data: %{public}s', JSON.stringify(data));
    });
    hilog.info(DOMAIN, TAG, '%{public}s', 'OpenHarmonyTestRunner onRun end');
  }
}
