@echo off
rem ============================================================
rem  Hyper Suite X - "not showing" fixer (Windows)
rem
rem  Symptom: install-windows.bat ran fine, but After Effects
rem  (Window > Extensions) does not list "Hyper Suite X".
rem
rem  Root cause: the manifest.xml shipped in v2.0.0/v2.1.0 was not
rem  a valid CEP ExtensionManifest (root element was
rem  <Extension ModuleVersion="2.0"> with <ShellExtension> /
rem  <CScriptDispatchInfo>), so CEP never registered the bundle.
rem  The fixed manifest (this branch: hyper-suite-x/CSXS/manifest.xml,
rem  embedded below as base64) uses the real CEP schema with
rem  <ExtensionManifest> root + <Host Name="AEFT"> + <UI><Menu>.
rem
rem  What this does:
rem    1. Overwrites CSXS\manifest.xml in both install locations
rem       (prefers the repo copy next to this script if present,
rem       otherwise decodes the embedded fixed manifest).
rem    2. Re-asserts CEP developer mode (PlayerDebugMode) for
rem       CSXS.8-14 (AE 2020-2025+; AE 2023 = CSXS.12).
rem    3. Closes After Effects so the next start re-reads manifests.
rem ============================================================
setlocal EnableExtensions
set "REPO_MAN=%~dp0..\hyper-suite-x\CSXS\manifest.xml"
set "D1=%APPDATA%\Adobe\CEP\extensions\HyperSuiteX"
set "D2=%APPDATA%\Adobe\Common\CEP\extensions\HyperSuiteX"

echo.
echo Hyper Suite X - manifest fixer
echo.

set FOUND=0
if exist "%D1%\index.html" set FOUND=1
if exist "%D2%\index.html" set FOUND=1
if "%FOUND%"=="0" (
  echo [ERROR] No Hyper Suite X install found at:
  echo           %D1%
  echo           %D2%
  echo         Run install\install-windows.bat first, then re-run this fixer.
  pause
  exit /b 1
)

echo [1/3] Replacing CSXS\manifest.xml with the fixed CEP manifest...
if exist "%REPO_MAN%" (
  if exist "%D1%" ( copy /Y "%REPO_MAN%" "%D1%\CSXS\manifest.xml" >NUL && echo       patched %D1% )
  if exist "%D2%" ( copy /Y "%REPO_MAN%" "%D2%\CSXS\manifest.xml" >NUL && echo       patched %D2% )
) else (
  powershell -NoProfile -Command "$m=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KICAgICBIeXBlciBTdWl0ZSBYIC0gQ0VQIHBhbmVsIG1hbmlmZXN0IChmaXhlZCkuCgogICAgIFRoZSBtYW5pZmVzdCBzaGlwcGVkIGluIFBSICMxIChhcmVuYS8wMWEwOTM3ZC1teSkgdXNlZCBhCiAgICAgbm9uLUNFUCBzY2hlbWE6IHJvb3QgZWxlbWVudCA8RXh0ZW5zaW9uIE1vZHVsZVZlcnNpb249IjIuMCI+LAogICAgIDxTaGVsbEV4dGVuc2lvbj4sIDxDU2NyaXB0RGlzcGF0Y2hJbmZvPiwgQ2xpZW50PSJBRUZUIi4KICAgICBOb25lIG9mIHRob3NlIGFyZSBwYXJ0IG9mIHRoZSBDRVAgRXh0ZW5zaW9uTWFuaWZlc3Qgc2NoZW1hLCBzbwogICAgIEFmdGVyIEVmZmVjdHMnIENFUCBsb2FkZXIgbmV2ZXIgcmVnaXN0ZXJlZCB0aGUgYnVuZGxlIGFuZAogICAgICJIeXBlciBTdWl0ZSBYIiBuZXZlciBhcHBlYXJlZCB1bmRlciBXaW5kb3cgPiBFeHRlbnNpb25zLgoKICAgICBUaGlzIGlzIHRoZSBjb3JyZWN0IHNjaGVtYTogPEV4dGVuc2lvbk1hbmlmZXN0PiByb290LCBIb3N0TGlzdAogICAgIChBRUZUKSwgUmVxdWlyZWRSdW50aW1lIChDU1hTKSwgYW5kIHBlci1leHRlbnNpb24gRGlzcGF0Y2hJbmZvCiAgICAgd2l0aCBSZXNvdXJjZXMvTWFpblBhdGggKyBVSS9NZW51LiBUaGUgPE1lbnU+IGVsZW1lbnQgaXMgd2hhdAogICAgIGNyZWF0ZXMgdGhlIFdpbmRvdyA+IEV4dGVuc2lvbnMgZW50cnkuCiAgICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPgo8RXh0ZW5zaW9uTWFuaWZlc3QgVmVyc2lvbj0iNy4wIgogICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uQnVuZGxlSWQ9ImNvbS5oeXBlci5zdWl0ZS14IgogICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uQnVuZGxlVmVyc2lvbj0iMi4xLjAiCiAgICAgICAgICAgICAgICAgICBFeHRlbnNpb25CdW5kbGVOYW1lPSJIeXBlciBTdWl0ZSBYIj4KICAgIDxFeHRlbnNpb25MaXN0PgogICAgICAgIDxFeHRlbnNpb24gSWQ9ImNvbS5oeXBlci5zdWl0ZS14IiBWZXJzaW9uPSIyLjEuMCIgLz4KICAgIDwvRXh0ZW5zaW9uTGlzdD4KICAgIDxFeGVjdXRpb25FbnZpcm9ubWVudD4KICAgICAgICA8SG9zdExpc3Q+CiAgICAgICAgICAgIDwhLS0gQUVGVCA9IEFmdGVyIEVmZmVjdHMuIDE3LjAgPSBBRSAyMDIwIC4uLiA5OS45IGNvdmVycyAyMDIzICgyMy54KSB0aHJvdWdoIDIwMjUrIC0tPgogICAgICAgICAgICA8SG9zdCBOYW1lPSJBRUZUIiBWZXJzaW9uPSJbMTcuMCw5OS45XSIgLz4KICAgICAgICA8L0hvc3RMaXN0PgogICAgICAgIDxMb2NhbGVMaXN0PgogICAgICAgICAgICA8TG9jYWxlIENvZGU9IkFsbCIgLz4KICAgICAgICA8L0xvY2FsZUxpc3Q+CiAgICAgICAgPFJlcXVpcmVkUnVudGltZUxpc3Q+CiAgICAgICAgICAgIDxSZXF1aXJlZFJ1bnRpbWUgTmFtZT0iQ1NYUyIgVmVyc2lvbj0iOS4wIiAvPgogICAgICAgIDwvUmVxdWlyZWRSdW50aW1lTGlzdD4KICAgIDwvRXhlY3V0aW9uRW52aXJvbm1lbnQ+CiAgICA8RGlzcGF0Y2hJbmZvTGlzdD4KICAgICAgICA8RXh0ZW5zaW9uIElkPSJjb20uaHlwZXIuc3VpdGUteCI+CiAgICAgICAgICAgIDxEaXNwYXRjaEluZm8+CiAgICAgICAgICAgICAgICA8UmVzb3VyY2VzPgogICAgICAgICAgICAgICAgICAgIDxNYWluUGF0aD4uL2luZGV4Lmh0bWw8L01haW5QYXRoPgogICAgICAgICAgICAgICAgICAgIDxTY3JpcHRQYXRoPi4vanN4L21haW4uanM8L1NjcmlwdFBhdGg+CiAgICAgICAgICAgICAgICA8L1Jlc291cmNlcz4KICAgICAgICAgICAgICAgIDxMaWZlY3ljbGU+CiAgICAgICAgICAgICAgICAgICAgPEF1dG9WaXNpYmxlPnRydWU8L0F1dG9WaXNpYmxlPgogICAgICAgICAgICAgICAgPC9MaWZlY3ljbGU+CiAgICAgICAgICAgICAgICA8VUk+CiAgICAgICAgICAgICAgICAgICAgPFR5cGU+UGFuZWw8L1R5cGU+CiAgICAgICAgICAgICAgICAgICAgPE1lbnU+SHlwZXIgU3VpdGUgWDwvTWVudT4KICAgICAgICAgICAgICAgICAgICA8R2VvbWV0cnk+CiAgICAgICAgICAgICAgICAgICAgICAgIDxTaXplPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPEhlaWdodD41NjA8L0hlaWdodD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxXaWR0aD40MjA8L1dpZHRoPgogICAgICAgICAgICAgICAgICAgICAgICA8L1NpemU+CiAgICAgICAgICAgICAgICAgICAgICAgIDxNaW5TaXplPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgPEhlaWdodD40MDA8L0hlaWdodD4KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxXaWR0aD4zMjA8L1dpZHRoPgogICAgICAgICAgICAgICAgICAgICAgICA8L01pblNpemU+CiAgICAgICAgICAgICAgICAgICAgPC9HZW9tZXRyeT4KICAgICAgICAgICAgICAgIDwvVUk+CiAgICAgICAgICAgIDwvRGlzcGF0Y2hJbmZvPgogICAgICAgIDwvRXh0ZW5zaW9uPgogICAgPC9EaXNwYXRjaEluZm9MaXN0Pgo8L0V4dGVuc2lvbk1hbmlmZXN0Pgo=')); foreach($d in @($env:APPDATA+'\Adobe\CEP\extensions\HyperSuiteX',$env:APPDATA+'\Adobe\Common\CEP\extensions\HyperSuiteX')){ if(Test-Path $d){ New-Item -ItemType Directory -Force -Path ($d+'\CSXS') | Out-Null; [IO.File]::WriteAllText(($d+'\CSXS\manifest.xml'),$m); Write-Host ('      patched '+$d) } }"
)

echo [2/3] Re-asserting CEP developer mode (CSXS.8-14)...
for %%V in (8 9 10 11 12 13 14) do reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_DWORD /d 1 /f >NUL 2>NUL
echo       OK

echo [3/3] Closing After Effects (manifests are read at startup)...
tasklist /FI "IMAGENAME eq AfterFX.exe" 2>NUL | find /I "AfterFX.exe" >NUL
if not errorlevel 1 (
  taskkill /IM AfterFX.exe /F >NUL 2>NUL
  timeout /t 2 /nobreak >NUL
  echo       Closed.
) else (
  echo       Not running - OK.
)

echo.
echo ------------------------------------------------------------
echo  Done. Reopen After Effects, then:
echo    Window  -^>  Extensions  -^>  Hyper Suite X
echo  It must now appear between the other CEP extensions.
echo ------------------------------------------------------------
echo.
pause
exit /b 0
