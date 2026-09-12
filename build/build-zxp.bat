@echo off
rem ============================================================
rem  Hyper Suite X - build a signed .zxp installer package.
rem  Needs only Node.js (https://nodejs.org) - the JAR-style
rem  signer (build\zxp-sign.js) is bundled, no npm packages.
rem ============================================================
setlocal
set "ROOT=%~dp0.."
cd /d "%ROOT%"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is required. Install it from https://nodejs.org and run this again.
  pause
  exit /b 1
)

echo Building HyperSuiteX_v2.1.0.zxp ...
node build\zxp-sign.js
if errorlevel 1 (
  echo [ERROR] Signing build failed.
  pause
  exit /b 1
)

echo.
echo Done - look for the .zxp in the dist\ folder.
echo Double-click it to install, or run install\install-windows.bat.
pause
