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

cd local_modules
gtar -cf ../node_modules.tar .
cd -

MD5=`md5sum node_modules.tar | awk '{ print $1 }'`
echo $MD5 > node_modules.md5
