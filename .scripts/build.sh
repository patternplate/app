#!/bin/bash
set -e
set -u

yarn electron-webpack prod --env.minify=false

rm -rf local_modules
./.scripts/copy-module.js \
  --bin npm \
  --bin yarn \
  --bin patternplate \
  --bin rimraf \
  --out local_modules \
  --mod electron-screenshot-service \
  --mod express \
  --mod get-port \
  --mod @marionebl/sander \
  --ignore electron

cd local_modules
gtar -cf ../node_modules.tar .
cd -

CSC_IDENTITY_AUTO_DISCOVERY=false yarn electron-builder
