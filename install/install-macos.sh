#!/bin/bash
# ============================================================
#  Hyper Suite X - macOS installer (CEP extension)
# ============================================================
set -e
SRC="$(cd "$(dirname "$0")/../hyper-suite-x" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/HyperSuiteX"

if [ ! -f "$SRC/index.html" ]; then
  echo "[ERROR] Source folder not found: $SRC"
  exit 1
fi

echo "Hyper Suite X v2.0.0 - installing..."
echo "  Source: $SRC"
mkdir -p "$DEST"
rm -rf "$DEST"/*
cp -R "$SRC"/. "$DEST"/
echo "  Installed to: $DEST"
echo "[2/2] Enabling CEP developer mode (PlayerDebugMode)..."
defaults write com.adobe.CSXS.11 PlayerDebugMode 1 2>/dev/null || true
echo "       OK"
echo ""
echo "------------------------------------------------------------"
echo " Next steps:"
echo "   1. Fully quit After Effects (it must be closed)."
echo "   2. Reopen After Effects."
echo "   3. Window  ->  Extensions  ->  Hyper Suite X"
echo "------------------------------------------------------------"
