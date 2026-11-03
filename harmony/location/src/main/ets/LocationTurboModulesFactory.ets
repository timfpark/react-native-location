/**
 * MIT License
 *
 * Copyright (C) 2026 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * Location RNPackage：注册 RNLocation TurboModule。
 *
 * 模块名 TM.RNLocation.NAME === 'RNLocation'，与 JS 侧
 * TurboModuleRegistry.get('RNLocation') 严格一致（RNOH 按名字桥接）。
 * 经 ohos/package.json 的 harmony.autolinking（etsPackageClassName:
 * LocationPackage）由 hvigor autolink 注入 example 的
 * RNOHPackagesFactory（返回非空数组）。
 *
 * 导入走主入口（index.ets → ets.ets/ts.ts）：RNOHPackage 仅在 /ets（主）入口
 * 导出，/ts 入口只导出 RNPackage（0.72.139 源码核实）。
 */

import {
  RNOHPackage,
  UITurboModule,
  UITurboModuleContext,
} from '@rnoh/react-native-openharmony';
import { TM } from './generated/ts';
import { RNLocationTurboModule } from './RNLocationTurboModule';

export class LocationPackage extends RNOHPackage {
  override getUITurboModuleFactoryByNameMap(): Map<string, (ctx: UITurboModuleContext) => UITurboModule | null> {
    const map = new Map<string, (ctx: UITurboModuleContext) => UITurboModule | null>();
    map.set(TM.RNLocation.NAME, (ctx: UITurboModuleContext) => new RNLocationTurboModule(ctx));
    return map;
  }

  override async createEagerUITurboModuleByNameMap(ctx: UITurboModuleContext): Promise<Map<string, UITurboModule>> {
    const module = new RNLocationTurboModule(ctx);
    return new Map<string, UITurboModule>().set(TM.RNLocation.NAME, module);
  }
}
