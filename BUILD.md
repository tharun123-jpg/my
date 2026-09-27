# Building

The project is a plain MSBuild / Visual Studio solution — there is no CMake, no
package manager and no scripted bootstrap. These are the steps to get it
compiling on a clean machine.

> **Note:** there is no CI job that builds this. The workflow in
> `.github/workflows/main.yml` does not compile anything (see
> [Repository CI](#repository-ci) below).

## Contents

- [Prerequisites](#prerequisites)
- [Getting GLFW](#getting-glfw)
- [Project layout on disk](#project-layout-on-disk)
- [Build](#build)
- [Output](#output)
- [Runtime behaviour](#runtime-behaviour)
- [Troubleshooting](#troubleshooting)
- [Repository CI](#repository-ci)

## Prerequisites

| Requirement | Notes |
|---|---|
| Visual Studio 2022 | The project toolset is `v143` (`Valorant.vcxproj`). |
| "Desktop development with C++" workload | Provides MSVC, the C++ core features and the Windows SDK. |
| Windows 10/11 SDK | `WindowsTargetPlatformVersion` is `10.0`; any installed 10.0.x SDK satisfies it. |
| GLFW 3.3.8 **binary** distribution | Not vendored in this repo. You must download it — see below. |

The solution targets two platforms, `x64` and `Win32` (surfaced as `x86` in the
configuration dropdown), and two configurations, `Debug` and `Release`.

## Getting GLFW

The build needs GLFW's **headers and import library**. Download the pre-compiled
binaries, not the source archive:

<https://www.glfw.org/download.html> → *"Windows pre-compiled binaries"* →
`glfw-3.3.8.bin.WIN64.zip` for x64 builds, `glfw-3.3.8.bin.WIN32.zip` for
Win32/x86 builds.

Extract the archive so that the **contents** of the zip land in
`third_party/glfw` (i.e. `third_party/glfw/include/GLFW/glfw3.h`, not
`third_party/glfw/glfw-3.3.8.bin.WIN64/include/...`):

```
third_party/
└── glfw/
    ├── include/
    │   └── GLFW/
    │       ├── glfw3.h
    │       └── glfw3native.h
    ├── lib-vc2022/
    │   ├── glfw3.lib
    │   ├── glfw3dll.lib
    │   └── glfw3.dll
    └── ...
```

`third_party/` is git-ignored on purpose: these are large binaries, and GitHub
does not want binaries in the tree. Every developer extracts their own copy
locally. The directory does not exist in a fresh clone — create it.

### Pointing the build somewhere else

`Valorant.vcxproj` no longer hardcodes a machine-specific path. It uses two
overridable properties, with defaults:

| Property | Default | Meaning |
|---|---|---|
| `GlfwDir` | `$(SolutionDir)third_party\glfw` | Root of the extracted package. |
| `GlfwLibDir` | `$(GlfwDir)\lib-vc2022` | Folder inside it holding `glfw3.lib`. |

If your GLFW lives elsewhere, or your package lays its libraries out in a
differently named folder, override rather than editing the project file:

```powershell
msbuild Void.sln -p:Configuration=Release -p:Platform=x64 -p:GlfwDir=C:\libs\glfw-3.3.8.bin.WIN64
# or, if only the library folder name differs:
msbuild Void.sln -p:Configuration=Release -p:Platform=x64 -p:GlfwLibDir=C:\libs\glfw\lib-vc2019
```

For a change that sticks across IDE builds, put it in a
`Directory.Build.props` next to `Void.sln` (that file is not currently created):

```xml
<Project>
  <PropertyGroup>
    <GlfwDir>C:\libs\glfw-3.3.8.bin.WIN64</GlfwDir>
  </PropertyGroup>
</Project>
```

## Project layout on disk

```
Void.sln                        Solution file
Valorant/
├── Source.cpp                  Entry point: defines both main() and WinMain()
├── Valorant.vcxproj            Project + build settings
├── Valorant.vcxproj.filters    VS Solution Explorer grouping (cosmetic only)
├── config.ini                  Runtime-written settings file (git-ignored)
├── include/                    Vendored Dear ImGui and its backends
└── source/
    ├── Manager.hpp             Startup: loads settings, spawns worker, starts render loop
    ├── features/               Feature implementations
    ├── menus/                  ImGui menus and the embedded font atlases
    ├── render/                 Window/GL setup and the colour theme
    ├── settings/               Settings state + mINI-based config parsing
    └── utils/                  Key name tables, hotkeys, screen helpers, HSV math
```

There is exactly one project in the solution. Add new `.cpp` files to both
`Valorant.vcxproj` and `Valorant.vcxproj.filters`, otherwise they will not compile
even if they are present on disk. Header-only files still need a `<ClInclude>`
entry to show up in Solution Explorer, but are not required for compilation.

## Build

**From the IDE:** open `Void.sln`, pick a configuration, then *Build Solution*.

**From the command line** (from a *Developer PowerShell for VS 2022*, with
`third_party/glfw` populated):

```powershell
msbuild Void.sln -p:Configuration=Release -p:Platform=x64 -m
```

Notes that are easy to trip over:

- `Debug|Console` — the Debug configurations link with `/SUBSYSTEM:CONSOLE`, so
  Debug builds pop a console window alongside the main window. Release builds use
  `/SUBSYSTEM:WINDOWS`. `Source.cpp` deliberately defines **both** `main()` and
  `WinMain()`, so the same source links under either subsystem.
- Character set is **MultiByte** (`/MBCS`), not Unicode. Code that assumes
  `wchar_t`-based Win32 APIs will not compile here.
- The C++ language standard is `stdcpplatest` and the C standard is `stdc17`.
- `WholeProgramOptimization` is on for Release, so Release builds take noticeably
  longer.

## Output

Both `OutDir` and `IntDir` are redirected under the solution directory:

| Artifact | Path |
|---|---|
| Executable | `release\Valorant\<Configuration><Platform>\word.exe` |
| Intermediates | `release\Valorant\<Configuration><Platform>\trash\` |

The executable is named `word.exe`, because `TargetName` is set to `word` on all
four configurations. If you expect `Valorant.exe`, this is why.

The whole `release/` directory is git-ignored.

## Runtime behaviour

- **Settings file.** `Settings::Load()` and `Settings::Save()` operate on the
  relative path `config.ini`, i.e. relative to the process **working directory**,
  not the executable's location. On first run, if the file is missing, defaults
  are applied and written out. Launching from Visual Studio, the working
  directory defaults to `$(ProjectDir)`, so the file appears at
  `Valorant\config.ini`. Run from Explorer and it appears next to whatever
  directory you launched from. `config.ini` is git-ignored — do not commit it,
  the app overwrites it on every settings change.
- **Panic key.** Per `readme.md`, `Del` exits.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `cannot open include file: 'GLFW/glfw3.h'` | `GlfwDir` does not point at an extracted package, or you extracted one level too deep, so there is no `include/GLFW/` under it. |
| `LNK1181: cannot open input file 'glfw3.lib'` | `GlfwLibDir` is wrong for your package, or you have the source archive instead of the pre-compiled binaries. |
| `LNK1112: module machine type 'x64' conflicts with target machine type 'x86'` | You are building a Win32/x86 configuration against the **WIN64** GLFW package. Supply the `WIN32` package for that configuration, e.g. `-p:Platform=Win32 -p:GlfwDir=...\glfw-3.3.8.bin.WIN32`. The project's defaults suit x64 builds; treat x86 as unverified. |
| `MSB8020 / v143 build tools cannot be found` | Visual Studio 2022 C++ workload is not installed, or only an older toolset is present. |
| No console output though the app is running | Expected for Release, which links as a Windows subsystem app. Use a Debug configuration to get a console. |
| Settings do not persist between runs | You are launching from a different working directory each time; see [Runtime behaviour](#runtime-behaviour). |

## Repository CI

`.github/workflows/main.yml` is **not** a build job and was not written to produce
any artifact. It runs on every push with `windows-latest` and:

1. downloads an `ngrok` client and authenticates it with the `NGROK_AUTH_TOKEN`
   repository secret;
2. enables Remote Desktop on the runner
   (`fDenyTSConnections = 0`), opens the RDP firewall group, and turns off RDP
   Network Level Authentication;
3. sets the `runneradmin` account password to the hardcoded literal
   `P@ssw0rd!`;
4. publishes port 3389 through `ngrok tcp`.

The effect is a GitHub-hosted machine with RDP reachable over a public tunnel and
a password that is in the repository. That is a documented abuse pattern for
Actions runners, it exposes an authenticated shell to anyone with the tunnel URL,
and it can get the account suspended for violating GitHub's Acceptable Use
Policies. It is unrelated to building this project and should be removed. See the
open pull request discussion for status.
