#!/bin/bash
set -e
set -u

yarn electron-webpack prod

./.scripts/copy-module.js \
  --bin npm \
  --bin yarn \
  --bin patternplate \
  --bin get-port \
  --out local_modules

travis-wait "CSC_IDENTITY_AUTO_DISCOVERY=false yarn electron-builder --dir"
