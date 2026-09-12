@echo off
rem ============================================================
rem  Hyper Suite X - install diagnostic (Windows, read-only)
rem  Runs a check-up and tells you EXACTLY why the panel is
rem  (or isn't) showing up in After Effects. Changes nothing.
rem ============================================================
setlocal EnableExtensions
title Hyper Suite X - install diagnostic

echo ============================================================
echo  Hyper Suite X - install diagnostic (Windows)
echo  Read-only: this script does NOT change anything.
echo ============================================================
echo.

set "DEST1=%APPDATA%\Adobe\CEP\extensions\HyperSuiteX"
set "DEST2=%APPDATA%\Adobe\Common\CEP\extensions\HyperSuiteX"

echo [1] Extension files
set "FOUND=0"
if exist "%DEST1%\index.html" (
  echo   [OK] Found: %DEST1%
  set "FOUND=1"
) else (
  echo   [--] Not found: %DEST1%
)
if exist "%DEST1%\CSXS\manifest.xml" (echo   [OK] CSXS\manifest.xml present) else (echo   [!!] CSXS\manifest.xml MISSING)
if exist "%DEST1%\jsx\main.js" (echo   [OK] jsx\main.js present) else (echo   [!!] jsx\main.js MISSING)
if exist "%DEST1%\HyperSuiteX\index.html" echo   [!!] DOUBLE-NESTED folder detected - re-run the installer
if "%FOUND%"=="0" (
  if exist "%DEST2%\index.html" (
    echo   [OK] Found in legacy location: %DEST2%
    set "FOUND=1"
  ) else (
    echo   [!!] EXTENSION NOT INSTALLED - run install-windows.bat first
  )
)
echo.

echo [2] CEP developer mode (PlayerDebugMode) per AE version
set "SEENKEY=0"
for /L %%V in (8,1,14) do (
  reg query "HKCU\Software\Adobe\CSXS.%%V" >nul 2>&1
  if errorlevel 1 (
    echo   [--] CSXS.%%V  ^(key absent - that AE version never ran here^)
  ) else (
    set "SEENKEY=1"
    reg query "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode >nul 2>&1
    if errorlevel 1 (
      echo   [!!] CSXS.%%V  - PlayerDebugMode NOT SET   [^<^<^< LIKELY CAUSE]
    ) else (
      for /f "tokens=3" %%a in ('reg query "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode 2^>nul') do (
        if "%%a"=="0x1" (echo   [OK] CSXS.%%V  PlayerDebugMode = 1) else (echo   [!!] CSXS.%%V  PlayerDebugMode = %%a ^(should be 1^)  [^<^<^< LIKELY CAUSE])
      )
    )
  )
)
if "%SEENKEY%"=="0" echo   [!!] No CSXS.* registry keys at all - it looks like After Effects has never run under THIS Windows user account.
echo.

echo [3] Is After Effects running right now?
tasklist /FI "IMAGENAME eq AfterFX.exe" 2>NUL | find /I "AfterFX.exe" >NUL
if not errorlevel 1 (
  echo   [!!] After Effects IS RUNNING. The panel list is only
  echo        rebuilt on a FULL restart. Quit AE completely
  echo        (check the system tray), then reopen it.
) else (
  echo   [OK] After Effects is not running - good.
)
echo.

echo [4] Installed After Effects versions
set "AES=0"
for /d %%D in ("C:\Program Files\Adobe\Adobe After Effects*") do (echo   - %%~nxD & set "AES=1")
for /d %%D in ("C:\Program Files (x86)\Adobe\Adobe After Effects*") do (echo   - %%~nxD & set "AES=1")
if "%AES%"=="0" echo   [--] No "Adobe After Effects*" folder found under Program Files.
echo.

echo ============================================================
echo  HOW TO READ THIS:
echo.
echo  * Any [!!] line = the problem is right there. The fix is:
echo      1. Quit After Effects completely.
echo      2. Run  install\install-windows.bat   (it wipes the old
echo         copy, sets developer mode for ALL AE versions, and
echo         verifies the copy).
echo      3. Reopen After Effects -^> Window -^> Extensions -^>
echo         Hyper Suite X
echo
echo  * Everything [OK]? Then also check:
echo      - Creative Cloud desktop app -^> look for "Hyper Suite
echo        X" under your extensions and make sure it is ENABLED.
echo      - Some machines only pick up custom extensions from an
echo        elevated session: try running After Effects once AS
echo        ADMINISTRATOR.
echo      - A second copy of AE (2024 + 2025 installed side by
echo        side) uses different CSXS keys - the installer sets
echo        them all, so re-run it once and restart each one.
echo ============================================================
echo.
pause
