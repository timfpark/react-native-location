/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const JSON5 = require('json5');
const path = require('path');

const templatePath = path.join(
  __dirname,
  '..',
  'harmony',
  'build-profile.template.json5',
);
const existingProfilePath = path.join(
  __dirname,
  '..',
  'harmony',
  'build-profile.json5',
);

if (fs.existsSync(existingProfilePath)) {
  let existingProfile = JSON5.parse(
    fs.readFileSync(existingProfilePath, 'utf-8'),
  );
  let template = JSON5.parse(fs.readFileSync(templatePath, 'utf-8'));
  let signingConfigs =
    existingProfile.app && existingProfile.app.signingConfigs;

  const previousProducts =
    existingProfile.app && existingProfile.app.products;

  existingProfile = {...template};

  if (signingConfigs) {
    existingProfile.app.signingConfigs = signingConfigs;
  }

  // Preserve per-product signingConfig references (e.g. set by DevEco
  // auto-signing) across regenerations, matched by product name.
  if (previousProducts && existingProfile.app) {
    existingProfile.app.products = template.app.products.map(product => {
      const previous = previousProducts.find(
        existing => existing.name === product.name,
      );
      return previous && previous.signingConfig
        ? {...product, signingConfig: previous.signingConfig}
        : product;
    });
  }

  fs.writeFileSync(
    existingProfilePath,
    JSON5.stringify(existingProfile, null, 2),
  );
} else {
  fs.copyFileSync(templatePath, existingProfilePath);
}
