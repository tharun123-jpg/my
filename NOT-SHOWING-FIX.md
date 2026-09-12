# "Hyper Suite X not showing" — root cause & fix

**Symptom (AE 2023, Windows):** `install\install-windows.bat` reports success,
files exist in `%APPDATA%\Adobe\CEP\extensions\HyperSuiteX`, PlayerDebugMode is
set — but **Window ▸ Extensions** lists only EasyCurve / EDIT-GPT /
Magic Bullet Colorista V. No "Hyper Suite X".

## Root cause

The `CSXS/manifest.xml` shipped in PR #1 (`arena/01a0937d-my`, v2.0.0/v2.1.0)
is **not a CEP manifest**. It used:

```xml
<Extension ModuleVersion="2.0" ...>          ← wrong root element
    <Extension ... Client="AEFT"/>           ← hosts don't go here
    <ShellExtension>...                      ← not a CEP element
    <CScriptDispatchInfo object="true">...   ← not a CEP element
```

The CEP loader in After Effects only registers bundles whose manifest has an
`<ExtensionManifest>` root with `HostList` / `RequiredRuntimeList` and a
per-extension `DispatchInfo` (`Resources/MainPath` + `UI/Menu`). With the old
file the bundle is silently skipped — no menu entry, no error dialog. The
`<Menu>` element is what creates the Window ▸ Extensions item; the old file
had none.

(Everything else on the machine was fine: per-user CEP folder is correct, and
the installer's PlayerDebugMode for CSXS.8–14 covers AE 2023 = CSXS.12.)

## The fix (this branch, `arena/01a094e7-my`)

- `hyper-suite-x/CSXS/manifest.xml` — rewritten to the real CEP schema
  (`ExtensionManifest` 7.0, `Host Name="AEFT" Version="[17.0,99.9]"`,
  `MainPath ./index.html`, `ScriptPath ./jsx/main.js`,
  `UI/Type Panel` + `UI/Menu "Hyper Suite X"`).
- `install/fix-not-showing-windows.bat` — repair tool for a machine that
  already ran the old installer: overwrites `CSXS\manifest.xml` in both install
  locations (repo copy if present next to the script, otherwise an embedded
  base64 copy), re-asserts PlayerDebugMode, closes After Effects.
- `install/verify-manifest.py` — parses the manifest and asserts every
  structural fact the CEP loader needs (run:
  `python3 install/verify-manifest.py hyper-suite-x/CSXS/manifest.xml <extension-root>`).

## Apply on the Windows machine (RDP box)

Option A — download and double-click the fixer:
`https://raw.githubusercontent.com/tharun123-jpg/my/arena/01a094e7-my/install/fix-not-showing-windows.bat`

Option B — paste into PowerShell on the box:

```powershell
$m = @'
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="7.0" ExtensionBundleId="com.hyper.suite-x" ExtensionBundleVersion="2.1.0" ExtensionBundleName="Hyper Suite X">
    <ExtensionList><Extension Id="com.hyper.suite-x" Version="2.1.0" /></ExtensionList>
    <ExecutionEnvironment>
        <HostList><Host Name="AEFT" Version="[17.0,99.9]" /></HostList>
        <LocaleList><Locale Code="All" /></LocaleList>
        <RequiredRuntimeList><RequiredRuntime Name="CSXS" Version="9.0" /></RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="com.hyper.suite-x">
            <DispatchInfo>
                <Resources><MainPath>./index.html</MainPath><ScriptPath>./jsx/main.js</ScriptPath></Resources>
                <Lifecycle><AutoVisible>true</AutoVisible></Lifecycle>
                <UI><Type>Panel</Type><Menu>Hyper Suite X</Menu>
                    <Geometry><Size><Height>560</Height><Width>420</Width></Size>
                    <MinSize><Height>400</Height><Width>320</Width></MinSize></Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
'@
foreach ($d in @("$env:APPDATA\Adobe\CEP\extensions\HyperSuiteX",
                 "$env:APPDATA\Adobe\Common\CEP\extensions\HyperSuiteX")) {
  if (Test-Path $d) { [IO.File]::WriteAllText("$d\CSXS\manifest.xml", $m); Write-Host "patched $d" }
}
Stop-Process -Name AfterFX -Force -ErrorAction SilentlyContinue
Write-Host "Reopen AE -> Window -> Extensions -> Hyper Suite X"
```

Then reopen After Effects → **Window ▸ Extensions ▸ Hyper Suite X**.

macOS: replace `~/Library/Application Support/Adobe/CEP/extensions/HyperSuiteX/CSXS/manifest.xml`
with the same file and relaunch AE.

## Verification status

`verify-manifest.py` passes all 12 checks over the fixed manifest laid on top
of the real extension tree (root schema, AEFT host range covering 23.x,
MainPath/ScriptPath files exist, Menu present, bat payload byte-identical).
After Effects itself cannot be launched in this Linux sandbox, so the final
"it appears in the menu" confirmation has to happen on the Windows box after
running the fixer.
