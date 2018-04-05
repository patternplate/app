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

yarn electron-builder

