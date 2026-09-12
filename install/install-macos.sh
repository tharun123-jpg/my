#!/bin/bash
# ============================================================
#  Hyper Suite X - macOS installer (CEP developer install)
#  Adobe-documented way to install a custom / self-signed CEP
#  extension. Do NOT double-click the .zxp: Extension Manager
#  requires a CA-issued certificate.
# ============================================================
set -e
SRC="$(cd "$(dirname "$0")/../hyper-suite-x" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/HyperSuiteX"

if [ ! -f "$SRC/index.html" ]; then
  echo "[ERROR] Source folder not found: $SRC"
  exit 1
fi

echo ""
echo "Hyper Suite X v2.1.0 - CEP developer install (macOS)"
echo "  Source: $SRC"
echo ""

echo "[1/4] After Effects must be quit before installing."
if pgrep -x "AfterFX" >/dev/null 2>&1 || pgrep -f "Adobe After Effects" >/dev/null 2>&1; then
  echo "       After Effects is running - please quit it, then re-run this script."
  exit 1
fi
echo "       OK"

echo "[2/4] Removing previous install (clean slate)..."
rm -rf "$DEST"
echo "      OK"

echo "[3/4] Copying extension to $DEST ..."
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
echo "      OK"

echo "[4/4] Enabling CEP developer mode (all supported AE versions)..."
# AE 2022 (CSXS.10) through AE 2025 (CSXS.13). Remove later with:
#   defaults delete com.adobe.CSXS.11 PlayerDebugMode
for v in 10 11 12 13; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
done
echo "      OK"

# verify
for f in index.html CSXS/manifest.xml jsx/main.js; do
  if [ ! -f "$DEST/$f" ]; then
    echo "[ERROR] Verify failed: $DEST/$f missing"
    exit 1
  fi
done

echo ""
echo "------------------------------------------------------------"
echo " Done. Open After Effects, then:"
echo "   Window  ->  Extensions  ->  Hyper Suite X"
echo ""
echo " Note: double-clicking the .zxp won't work - it is"
echo " self-signed, and Extension Manager requires a"
echo " CA-issued certificate. This script is the supported"
echo " path for custom extensions."
echo "------------------------------------------------------------"
