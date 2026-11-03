/**
 * This source code is licensed under the MIT license found in the
 * LICENSE-MIT file in the root directory of this source tree.
 */

const {mergeConfig, getDefaultConfig} = require('@react-native/metro-config');

/**
 * 多版本兼容：RNOH harmony 包的安装位置随 package.json 变体而异——
 * - 0.72（本地 tgz + npm 别名）：node_modules/react-native-harmony/
 * - 0.77/0.82/0.84（registry）：node_modules/@react-native-oh/react-native-harmony/
 * 按实际安装位置探测，切换 package.json 变体后无需改本文件。
 */
const harmonyPkgName = (() => {
  try {
    require.resolve('react-native-harmony/package.json');
    return 'react-native-harmony';
  } catch (e) {
    return '@react-native-oh/react-native-harmony';
  }
})();

const {createHarmonyMetroConfig} = require(`${harmonyPkgName}/metro.config`);

/**
 * @type {import("metro-config").ConfigT}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), createHarmonyMetroConfig({
  reactNativeHarmonyPackageName: harmonyPkgName,
}), config);
