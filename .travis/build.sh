#!/bin/bash
set -e
set -u

yarn electron-webpack prod

./.scripts/copy-module.js \
  --bin npm \
  --bin yarn \
  --bin patternplate \
  --bin get-port \
  --out local_modules \
  --mod electron-screenshot-service \
  --ignore electron

yarn electron-builder

