# jtest — react-native-location JS/TS 白盒单元测试套件

独立可执行的 Jest 测试工程，覆盖 `src/` 全部 JS/TS 逻辑层（不依赖鸿蒙设备，纯 Node 环境运行）。

## 执行命令

在本目录（`jtest/`）下执行，或在仓库根用 `npm test --prefix jtest`：

| 命令 | 说明 |
|---|---|
| `npm test` | 运行全部测试 |
| `npm run test:coverage` | 运行全部测试 + 覆盖率报告（输出到 `<仓库根>/coverage/`） |
| `npm run test:watch` | 监听模式，源码/测试变更后自动重跑 |
| `npm run test:utils` | 仅 utils.ts 套件（promiseTimeoutResolveNull） |
| `npm run test:subscriptions` | 仅 lib/subscriptions.ts 套件（订阅引用计数） |
| `npm run test:permissions` | 仅 lib/permissions.ts 套件（权限四平台分发） |
| `npm run test:nativeInterface` | 仅 lib/nativeInterface.ts 套件（原生接口解析与事件通道） |
| `npm run test:index` | 仅 index.ts 套件（模块装配 / getLatestLocation / onWarning） |

等价 Jest 原生命令：`npx jest --config jtest/jest.config.js --coverage`（在仓库根执行）。

## 环境要求

- Node >= 18
- 依赖自包含：本工程自带 `package.json`（`jest` / `ts-jest` / `@types/jest` / `typescript`），
  首次使用在本目录执行一次 `npm install` 即可，**不依赖仓库根 `node_modules`**
  （仓库根可为空，transform 以本目录内 ts-jest 绝对路径解析）。

## 目录结构

```
jtest/
├── package.json             # 执行命令（npm scripts）与依赖声明
├── jest.config.js           # Jest 配置（rootDir 指向仓库根，isolatedModules 转译）
├── tsconfig.test.json       # 测试专用 tsconfig（独立于根 tsconfig，避免 customConditions 冲突）
├── README.md
├── utils-test.ts            # src/utils.ts：promiseTimeoutResolveNull 竞速/超时（6 例）
├── subscriptions-test.ts    # src/lib/subscriptions.ts：订阅引用计数与原生启停（10 例）
├── permissions-test.ts      # src/lib/permissions.ts：ios/android/harmony/不支持平台权限分发（29 例）
├── nativeInterface-test.ts  # src/lib/nativeInterface.ts：TurboModule 回落与事件通道路由（7 例）
├── index-test.ts            # src/index.ts：模块装配 / getLatestLocation 超时形态 / onWarning（15 例）
└── mocks/
    └── reactNative.ts       # 'react-native' 运行时替身（官方 0.72.5 无 EventEmitter、
                             #  Platform 无 'harmony'，测试必须 mock）
```

## 当前基线

- 测试：**5 套件 / 74 用例全部通过**
- 覆盖率：语句 / 分支 / 函数 / 行 **全部 100%**
  （index.ts、utils.ts、lib/permissions.ts、lib/subscriptions.ts、lib/nativeInterface.ts）

## 实现约定（新增用例前必读）

1. **不得修改 `src/` 生产源码**——mock、fixture 一律放在 `jtest/` 内（对齐 RNOH 白盒测试铁律）。
2. **`react-native` 由 `jest.config.js` 的 `moduleNameMapper` 全局映射到
   `mocks/reactNative.ts`**（该模块同时提供 react-native 风格命名导出）。
   测试文件**不要**再写 `jest.mock('react-native', ...)`——映射目标与工厂指向同一文件会
   形成无限递归（Maximum call stack size exceeded）。
3. **凡涉及 `src/index.ts` 或 `src/lib/nativeInterface.ts` 的用例必须逐用例
   `jest.resetModules()` 后动态 `require`**：`src/specs/v1/NativeRNLocation.ts`
   在模块加载期即调用 `TurboModuleRegistry.get('RNLocation')` 并缓存结果，
   静态 import 会拿到过期装配。
4. **凡调用 `getLatestLocation` / `promiseTimeoutResolveNull` 的用例开启
   `jest.useFakeTimers()`**：源码内部的 `setTimeout` 会形成未决句柄，
   导致 jest worker 无法优雅退出。
5. **类型检查不在测试内做**：ts-jest 走 `isolatedModules` 转译；
   类型由仓库根 `npm run prepare`（tsc）负责，其 tsconfig 已排除 `*.test.*`。
6. **源码为 default 导出**（`Subscriptions`、`Permissions`），测试用
   `import Subscriptions from ...` 而非命名导入。
7. **依赖自包含**：transform 中 ts-jest 使用配置目录内 `node_modules` 的绝对路径，
   仓库根 `node_modules` 是否安装不影响本工程运行；换机器克隆后在本目录
   `npm install` 一次即可。
