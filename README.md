# Hyper Suite X

**The most advanced AlvarSuite-style toolkit for After Effects.**
One dark + gold panel with everything: AI chat, a 73-preset library, one-click
transitions on the playhead, easing / graph editor, effect toggles, cuts,
color, arrange, audio and render tools — driven by real ExtendScript (JSX)
automation, no manual keyframing.

```
┌────────────────────────────────────────────────────────────┐
│  Hyper Suite X          [222 credits]        [Menu]        │
├────────────────────────────────────────────────────────────┤
│  AI CHAT        LIBRARY       TRANSITIONS    GENERAL       │
│  EASING         EFFECTS       PROJECT                    │
└────────────────────────────────────────────────────────────┘
```

---

## Requirements

- **After Effects 2023 or newer** (Windows or macOS) — CEP 11 runtime
- Windows: nothing else. (Optional: Node.js if you want to rebuild the .zxp yourself)
- The panel talks to AE through the `HSX` CEP bridge (`jsx/main.js` + `CScriptDispatchInfo`),
  so all commands run inside your real comp — layers, keyframes, effects, renders.

## Install

> **Don't double-click the .zxp.** Extension Manager (and the CC "UPIA"
> installer behind it) verifies the package with `ZXPSignLib`, which requires
> a **CA-issued certificate chain**. This build is **self-signed**, so the
> dialog *"HyperSuiteX_v2.1.0 was not installed"* is expected — it is an
> Adobe policy limit, not a corrupt file. The supported install path for
> custom extensions is the **CEP developer install** below (Adobe's own
> documented workflow for self-signed CEP extensions).

### Windows

1. Run **`install\install-windows.bat`** (double-click is fine — it closes
   After Effects if it's running, wipes any previous version, copies the
   extension to
   `%APPDATA%\Adobe\CEP\extensions\HyperSuiteX`
   and the legacy `Adobe\Common\CEP` location, enables **CEP developer mode**
   for CSXS.10–13 — AE 2022 through 2025 — and verifies the copy).
2. Reopen After Effects → **Window → Extensions → Hyper Suite X**.

To remove developer mode later:
`reg delete "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /f`

### macOS

1. Quit After Effects.
2. Run:

```sh
./install/install-macos.sh
```

   (installs to `~/Library/Application Support/Adobe/CEP/extensions/HyperSuiteX`
   and sets `PlayerDebugMode` for CSXS.10–13)
3. Open After Effects → **Window → Extensions → Hyper Suite X**.

### Browser preview (no After Effects)

The panel runs standalone in a browser using a built-in **mock After Effects**
(`mock/mock-ae.js`) — open `hyper-suite-x/index.html` (or serve the folder) to
explore the whole UI and try the presets against a simulated comp. A
"MOCK" badge shows when you're in browser mode.

## What's new in 2.1

- **Ctrl+K command palette** — fuzzy-jump to any action (presets, transitions,
  looks, scans, snapshots, motion, navigation). Subsequence matching, ↑/↓ + Enter.
- **Snapshots (undo points)** — Project tab: save the state of your selection or
  the whole comp (keyframes for position/scale/rotation/opacity + layer timing),
  restore it any time this session. 12-slot session ring.
- **Batch queue** — queue actions (e.g. "queue all transitions", "full polish")
  and watch per-item status in the **⚙ header chip**; an activity drawer
  (header pulse button) also shows a live operation log.
- **Project health scan** — detects duplicate layer names, invisible layers,
  disabled layers, effect-heavy layers, oversized comps and solids; one-click
  "fix quick wins".
- **Playhead edit inspector** — Transitions tab shows the two clips bracketing
  the playhead (names, in/out, duration) with an edit-state badge.
- **Motion pack** — Slow-mo beat (time-remap ramp), Whip pan (position + motion
  blur), Stutter, Overshoot — on the selection, single click.
- **Library multi-select** — Ctrl/Shift-click several presets, then **⚡ Queue N
  selected** for a batch apply.
- **Settings export/import** — Profile tab: export or import credits, plan,
  favorites and AI settings as JSON.
- **Chat error cards** — failed AI commands show an inline ⚠ card with a
  **↻ Retry** button; chat also drives snapshots, scans and the motion pack.
- **Performance** — debounced library search, lazy canvas thumbnails
  (IntersectionObserver), rAF-throttled graph dragging, CSS containment on card
  grids, `prefers-reduced-motion` support.
- **Stability** — unified `B.hsx()` call wrapper (structured errors, one
  toast path), JSX guards (`requireComp`/`requireSel`/`clampNum`), clean
  one-line error messages from ExtendScript, browser mock parity for every
  new command.

## What's inside

| Tab | What it does |
|---|---|
| **HyperAI Chat** | Credits meter (222 on plan B), model picker (Fast / Pro / custom), command chat: "shake flash this edit", "split at cuts", "render h264"… — 13 whitelisted actions executed in AE, with free-text fallback. Works against **any OpenAI-compatible endpoint** (OpenAI, OpenRouter, Groq, local). Without a key it runs in demo mode. Failed actions get an inline error card with retry. |
| **Library** | 73 presets across 9 categories (CCS 13, MASKS 7, SHAKES 29, SLIDES 16, TEXT 108 slots, TRANSITIONS 58 slots, TWIXTERS 7, ZOOMS 44 slots, OTHER 72 slots) + sound effects (real WAV, synth-generated) + textures. Toggles: *stretch keyframes to layer duration*, *apply at layer start*, *apply to selected layers / whole comp*. **Ctrl/Shift-click to multi-select, then batch-queue them.** |
| **Transitions** | One-click transitions **at the playhead**: Shake flash · Zoom into edit · Smooth parallel · Warp flash · Hyperlapse · Glitch + shake. Each applies a matched-pair (out/in) effect stack to the two clips at the edit, with lock + "Complete" badges. Plus a **playhead edit inspector** (the two clips at your cut) and the **motion pack** (slow-mo beat / whip / stutter / overshoot). |
| **General** | Arrange (align/distribute selected layers), Audio (duck, normalize, fade), Color (curves/LUT-style ramps, match), Cuts (split at cuts — full on paid plan, free tier limited). |
| **Easing / Graph** | Live bezier editor with draggable handles, overshoot toggle, 12 easing families (Linear → Anticipate, 27 variants) — read selected keyframes, apply ease, or replace positions with sampled ease values. |
| **Effects** | Master toggle (Whole comp / Selected layers, All effects), per-effect toggles for the FX stack the panel manages. |
| **Project** | Render & convert to **H.264 .mp4** via AE's own render queue, save frame as PNG, resize & center selected layers, reframe comp to size, tidy project bin, purge memory & disk cache. **Snapshots** (save / restore / delete undo points), **health scan** with one-click fixes, and a **full-polish** batch. |

Every action is real JSX: `jsx/transitions.js`, `jsx/library.js`, `jsx/graph.js`,
`jsx/fx.js`, `jsx/general.js`, `jsx/project.js`, `jsx/audio.js` (bridge: `jsx/main.js`).

## HyperAI setup (optional)

**Profile tab → AI**: pick a provider (OpenAI / OpenRouter / Groq / custom
OpenAI-compatible base URL), paste an API key, optionally set a custom model
name. The key is stored locally in the panel (localStorage).

```
POST {baseUrl}/chat/completions
{ "model": "...", "messages": [...], "stream": true }
```

Only 13 tool commands can be triggered from chat (the whitelist), each costs
credits (AI 4 / transition 2 / motion 2 / render 10 / other 1). No key = demo
mode with canned responses.

## Rebuilding the .zxp

The signed package is built by a **bundled, dependency-free Node signer**
(JAR-format `MANIFEST.MF` + `CODE.SF` + `CERT.RSA`, SHA-256, RSA-2048, self-signed
cert valid 10 years):

```bat
build\build-zxp.bat     :: Windows
```
```sh
./build/build-zxp.sh    :: macOS / Linux
```

Output: `dist/HyperSuiteX_v2.1.0.zxp`.

## Signature & verification

`META-INF/CERT.RSA` is a CMS/PKCS#7 SignedData over `META-INF/CODE.SF`
(digest of `MANIFEST.MF` + SHA-256 of every file), exactly like Adobe's
`ZXPSignCmd` / Java JAR output:

- signature covers the **full `[0]` signedAttrs TLV** (RFC 5652 §5.3 / JAR spec),
- `messageDigest` (1.2.840.113549.1.9.4) = SHA-256(CODE.SF),
- issuer/serial reference the embedded self-signed cert
  (`CN=Hyper Suite X, O=HyperSuite, C=SG`).

Verified in-repo with `node build/zxp-sign.js` + an independent check:
every file digest, the manifest digest, the RSA signature over signedAttrs,
and the certificate self-signature all verify.

> Note: `openssl smime -verify` on OpenSSL 3.x uses a legacy PKCS7 path that
> re-hashes the signed attributes **without** the `[0]` wrapper (its
> `PKCS7_ATTR_VERIFY` template) and expects the signature as an OCTET STRING,
> so it reports "bad signature" on any spec-compliant JAR file. The file is
> verified instead with the RSA math directly (Node crypto / Java JCE); Adobe's
> CEP runtime verifies with the standard JAR path.

## Troubleshooting

- **Extension Manager says "… was not installed"** (double-clicking the .zxp):
  expected — the package is self-signed and Extension Manager / UPIA require
  a CA-issued certificate. Install with `install\install-windows.bat`
  (Windows) or `./install/install-macos.sh` (macOS) instead. If you have a
  commercial code-signing certificate, sign with `ZXPSignCmd` and the ZXP
  will install via the Extension Manager.
- **Panel not in Window → Extensions?** Make sure AE is fully closed during
  install, and that developer mode is set (the installer does this for
  CSXS.10–13; or check
  `reg query HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode`).
- **"No AI key — demo mode"**: go to Profile and add an API key, or ignore it
  — everything else works without AI.
- **Credits hit 0**: the meter is local (plan B, 222). Reset it from the
  Profile tab (dev reset) or edit `STATE` in `js/app.js`.
- **Windows SmartScreen / "unknown publisher"**: the .zxp is self-signed;
  right-click → properties → unblock, then run.

## Layout

```
hyper-suite-x/            the extension (what gets installed)
  index.html              panel shell (dark + gold UI)
  css/styles.css
  js/                     UI logic: views per tab, bridge, presets, sfx
  jsx/                    ExtendScript side: real AE automation
    snapshots.js          v2.1 session undo-points
  mock/mock-ae.js         simulated AE for browser mode (full command parity)
  CSXS/manifest.xml       CEP 11 manifest (client AEFT, dispatch HSX)
build/
  zxp-sign.js             dependency-free JAR signer (Node)
  signing/                RSA key + self-signed cert (CN=Hyper Suite X)
  build-zxp.bat/.sh       build entry points
install/
  install-windows.bat     copy to CEP folder + dev-mode registry
  install-macos.sh        same for macOS
dist/
  HyperSuiteX_v2.1.0.zxp  the signed installer package
```
