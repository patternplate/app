#!/bin/bash
set -e
set -u

rm -rf local_modules
./.scripts/copy-module.js \
  --bin npm \
  --bin yarn \
  --bin patternplate \
  --bin rimraf \
  --bin node \
  --out local_modules \
  --mod puppeteer \
  --mod express \
  --mod get-port \
  --mod @marionebl/sander \
  --ignore electron

(cd local_modules && gtar -cf ../node_modules.tar .)

shasum -a 256 node_modules.tar > node_modules.sha256
