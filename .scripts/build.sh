#!/bin/bash
set -e
set -u

yarn electron-webpack prod --env.minify=false

./.scripts/copy-module.js \
  --bin npm \
  --bin yarn \
  --bin patternplate \
  --bin get-port \
  --out local_modules \
  --mod electron-screenshot-service \
  --ignore electron

cd local_modules
gtar -cf ../local_modules.tar .
cd -

CSC_IDENTITY_AUTO_DISCOVERY=false yarn electron-builder --dir
