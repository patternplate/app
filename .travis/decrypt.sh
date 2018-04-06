#!/bin/bash
set -e
set -u

if [ "$TRAVIS_SECURE_ENV_VARS" != "true" ]; then
    echo "Skipping decryption, secure env vars not available";
    exit 0;
fi

openssl aes-256-cbc \
  -K $encrypted_862569413036_key \
  -iv $encrypted_862569413036_iv \
  -in patternplate-publish.key.enc \
  -out patternplate-publish.key -d

