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
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  rootDir: path.join(__dirname, '..'),
  transform: {
    '^.+\\.tsx?$': [
      // 显式指向本工程 node_modules 内的 ts-jest：
      // rootDir 是仓库根（其 node_modules 可能为空/不存在），
      // jest 以 rootDir 解析 transform 模块，必须给绝对路径才能自包含运行
      path.join(__dirname, 'node_modules', 'ts-jest'),
      {
        // transpile 模式（不跑类型检查；类型检查由 `npm run prepare` 的 tsc 负责）
        isolatedModules: true,
        tsconfig: path.join(__dirname, 'tsconfig.test.json'),
      },
    ],
  },
  testMatch: ['<rootDir>/jtest/**/*-test.ts'],
  // 'react-native' 全局映射到本工程的 mock 模块：
  // 仓库根可能没有安装 react-native（独立运行场景），jest.mock 也需要先能解析模块名，
  // 映射后源码与测试中的 'react-native' 一律落到 mocks/reactNative.ts（同时提供命名导出）
  moduleNameMapper: {
    '^react-native$': path.join(__dirname, 'mocks', 'reactNative.ts'),
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/index.ts',
    'src/utils.ts',
    'src/lib/**/*.ts',
    '!src/types.ts',
    '!src/specs/**',
    '!jtest/**',
  ],
};
