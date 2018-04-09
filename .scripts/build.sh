#!/bin/bash
set -e
set -u

yarn electron-webpack prod --env.minify=false

./.scripts/modules.sh

CSC_IDENTITY_AUTO_DISCOVERY=false yarn electron-builder
