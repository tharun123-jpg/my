#!/bin/sh
# ============================================================
#  Hyper Suite X - build a signed .zxp (Linux / macOS)
#  Needs only Node.js; the signer (build/zxp-sign.js) is bundled.
# ============================================================
cd "$(dirname "$0")/.." || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is required. Install it from https://nodejs.org"
  exit 1
fi

echo "Building HyperSuiteX_v2.1.0.zxp ..."
node build/zxp-sign.js || { echo "[ERROR] Signing build failed."; exit 1; }

echo
echo "Done - look for the .zxp in the dist/ folder."
