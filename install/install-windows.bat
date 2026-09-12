@echo off
rem ============================================================
rem  Hyper Suite X - Windows installer (CEP developer install)
rem  This is the Adobe-documented way to install a custom /
rem  self-signed CEP extension. Do NOT double-click the .zxp:
rem  Extension Manager requires a CA-issued certificate and will
rem  refuse self-signed packages.
rem ============================================================
setlocal EnableExtensions
set "SRC=%~dp0..\hyper-suite-x"
set "DEST1=%APPDATA%\Adobe\CEP\extensions\HyperSuiteX"
set "DEST2=%APPDATA%\Adobe\Common\CEP\extensions\HyperSuiteX"

echo.
echo Hyper Suite X v2.1.0 - CEP developer install (Windows)
echo   Source: %SRC%
echo.

if not exist "%SRC%\index.html" (
  echo [ERROR] Source folder not found: %SRC%
  pause
  exit /b 1
)

echo [1/5] Closing After Effects (if running)...
tasklist /FI "IMAGENAME eq AfterFX.exe" 2>NUL | find /I "AfterFX.exe" >NUL
if not errorlevel 1 (
  taskkill /IM AfterFX.exe /F >NUL 2>NUL
  timeout /t 2 /nobreak >NUL
  echo       Closed.
) else (
  echo       Not running - OK.
)

echo [2/5] Removing previous installs (clean slate)...
if exist "%DEST1%" rmdir /s /q "%DEST1%"
if exist "%DEST2%" rmdir /s /q "%DEST2%"
echo       OK

echo [3/5] Copying extension...
xcopy /E /Y /Q /I "%SRC%" "%DEST1%" >NUL || goto :fail
xcopy /E /Y /Q /I "%SRC%" "%DEST2%" >NUL || goto :fail
echo       OK

echo [4/5] Enabling CEP developer mode (all supported AE versions)...
rem  Lets the panel load even though it is not installed via the
rem  Extension Manager. Covers AE 2022 (CSXS.10) through AE 2025
rem  (CSXS.13). Remove later with:
rem    reg delete "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /f
for %%V in (10 11 12 13) do reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_DWORD /d 1 /f >NUL 2>NUL
echo       OK

echo [5/5] Verifying install...
if not exist "%DEST1%\index.html" goto :fail
if not exist "%DEST1%\CSXS\manifest.xml" goto :fail
if not exist "%DEST1%\jsx\main.js" goto :fail
echo       OK

echo.
echo ------------------------------------------------------------
echo  Done. Reopen After Effects, then:
echo    Window  -^>  Extensions  -^>  Hyper Suite X
echo
echo  Note: double-clicking the .zxp won't work - it is
echo  self-signed, and Extension Manager requires a
echo  CA-issued certificate. This installer is the supported
echo  path for custom extensions.
echo ------------------------------------------------------------
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Install failed - see messages above.
pause
exit /b 1
