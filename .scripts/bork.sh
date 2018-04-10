#!/bin/bash
set -e
set -u

function bork() {
  CMD=$(which $1);
  DIRNAME=$(dirname $CMD)
  BASENAME=$(basename $CMD)

  if [[ $BASENAME == _* ]]; then
    echo "Not borking $BASENAME, already borked."
  else
    mv "$CMD" "${DIRNAME}/_${BASENAME}"
  fi
}

bork "node"
bork "npm"
bork "yarn"
