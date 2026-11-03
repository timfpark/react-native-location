/**
 * This source code is licensed under the MIT license found in the
 * LICENSE-MIT file in the root directory of this source tree.
 */

import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { createRNOHPackages as createRNOHPackagesAutolinking } from './RNOHPackagesFactory';

// 手动注册导入示例（不支持autolink的插件）:
// import { YourPackage } from '@oh-rn/your-package/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    // autolink支持（RNOHPackagesFactory.ets 为模板 stub，build hap 时 hvigor 覆盖）
    ...createRNOHPackagesAutolinking(ctx),

    // 手动注册示例（不支持autolink的插件）:
    // new YourPackage(ctx),
  ];
}
