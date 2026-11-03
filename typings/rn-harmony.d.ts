/**
 * react-native 类型补充（鸿蒙 RNOH 适配）
 *
 * tsconfig.json 中通过 paths 将裸模块名 "react-native" 重定向到本文件
 * （精确匹配，仅影响类型检查，不影响 metro 运行时解析）。
 * 子路径导入（react-native/Libraries/...、react-native/types/...）不走该
 * 映射，仍解析到 node_modules 中真实的 react-native 类型。
 *
 * 补充两处 RNOH 适配所需的类型：
 * 1. EventEmitter：RN 0.65+ 起不再从公共入口导出（types/index.d.ts 仅导出
 *    EmitterSubscription/EventSubscription），本库内部以类型形式使用，从
 *    内部模块补出。
 * 2. Platform.OS 增加 'harmony'：鸿蒙平台由 RNOH 运行时扩展，官方类型
 *    （PlatformOSType = ios/android/macos/windows/web/native）不认识。
 */

/* 全量透传 RN 0.72 公共类型（子路径不经过 paths 精确匹配） */
export * from 'react-native/types/index';

/* 补充导出 EventEmitter 类（仅类型用途，运行时仍由原生侧事件器提供） */
export { default as EventEmitter } from 'react-native/Libraries/vendor/emitter/EventEmitter';

import type {
  PlatformAndroidStatic,
  PlatformIOSStatic,
  PlatformMacOSStatic,
  PlatformWebStatic,
  PlatformWindowsOSStatic,
} from 'react-native/Libraries/Utilities/Platform';

/** RNOH 扩展出的鸿蒙平台静态类型（OS 固定为 'harmony'） */
interface PlatformHarmonyStatic extends PlatformStatic {
  OS: 'harmony';
}

/**
 * 显式导出的 Platform 覆盖 export * 中的同名导出：
 * 在官方平台联合类型基础上追加鸿蒙分支，
 * 使 Platform.OS 的类型包含 'harmony'，switch/case 与比较不再报无重叠。
 */
export type Platform =
  | PlatformIOSStatic
  | PlatformAndroidStatic
  | PlatformWindowsOSStatic
  | PlatformMacOSStatic
  | PlatformWebStatic
  | PlatformHarmonyStatic;

export declare const Platform: Platform;
