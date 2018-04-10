#!/bin/bash
set -e
set -u

function unbork() {
  CMD=$(which "_${1}");
  DIRNAME=$(dirname $CMD);
  BASENAME=$(basename $CMD);
  mv "$CMD" "${DIRNAME}/${BASENAME:1:${#BASENAME}-1}"
}

unbork "node"
unbork "npm"
unbork "yarn"
