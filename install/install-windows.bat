@echo off
rem ============================================================
rem  Hyper Suite X - Windows installer (CEP extension)
rem  Copies the extension into After Effects' CEP folder.
rem ============================================================
setlocal
set "SRC=%~dp0..\hyper-suite-x"
set "DEST1=%APPDATA%\Adobe\CEP\extensions\HyperSuiteX"
set "DEST2=%APPDATA%\Adobe\Common\CEP\extensions\HyperSuiteX"

echo.
echo Hyper Suite X v2.0.0 - installing...
echo   Source: %SRC%
echo.

if not exist "%SRC%\index.html" (
  echo [ERROR] Source folder not found: %SRC%
  pause
  exit /b 1
)

echo [1/3] Installing to: %DEST1%
mkdir "%DEST1%" 2>nul
xcopy /E /Y /Q "%SRC%\*" "%DEST1%\" >nul
echo       OK

echo [2/3] Installing to: %DEST2%
mkdir "%DEST2%" 2>nul
xcopy /E /Y /Q "%SRC%\*" "%DEST2%\" >nul
echo       OK

echo [3/4] Enabling CEP developer mode (registry)...
rem  Lets the panel load even though it is not installed via the
rem  Extension Manager. Undoes to:
rem    reg delete "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /f
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_DWORD /d 1 /f >nul 2>nul
echo       OK

echo [4/4] Done.
echo.
echo ------------------------------------------------------------
echo  Next steps:
echo   1. Fully quit After Effects (it must be closed).
echo   2. Reopen After Effects.
echo   3. Window  -^>  Extensions  -^>  Hyper Suite X
echo ------------------------------------------------------------
echo.
pause
