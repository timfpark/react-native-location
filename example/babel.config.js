/**
 * 多分支兼容(0.72 / 0.77 / 0.82 / 0.84):
 * RN 0.75 起 babel 预设从独立的 metro-react-native-babel-preset
 * 迁移为 @react-native/babel-preset。这里按 node_modules 里实际安装的
 * react-native 版本自动选择,切换 package_XX 配置时无需再手动改本文件。
 */
let preset = 'module:metro-react-native-babel-preset'; // RN 0.72 及以下
try {
  const rnVersion = require('./node_modules/react-native/package.json').version;
  const rnMinor = parseInt(rnVersion.split('.')[1], 10);
  if (rnMinor >= 75) {
    preset = 'module:@react-native/babel-preset'; // RN 0.75+
  }
} catch (e) {
  // react-native 尚未安装时保持默认(0.72 预设)
}

module.exports = {
  presets: [preset],
};
