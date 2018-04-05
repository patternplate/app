#!/bin/bash
set -e
set -u

if [ "$TRAVIS_SECURE_ENV_VARS" != "true" ]; then
  echo "Skipping publish, secure env vars not available";
  exit 0;
fi

echo "Publish not implemented yet."
