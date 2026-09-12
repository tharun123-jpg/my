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

### Windows (recommended)

1. Close After Effects.
2. Double-click **`dist/HyperSuiteX_v2.0.0.zxp`** (or run `install/install-windows.bat`).
   - The installer copies the extension into
     `%APPDATA%\Adobe\CEP\extensions\HyperSuiteX`
     (and the legacy `Adobe\Common\CEP` location), and enables **CEP developer
     mode** (`HKCU\Software\Adobe\CSXS.11 → PlayerDebugMode = 1`) so the panel
     loads even though it isn't from the Extension Manager.
3. Reopen After Effects → **Window → Extensions → Hyper Suite X**.

To remove developer mode later:
`reg delete "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /f`

### macOS

```sh
./install/install-macos.sh
```
(installs to `~/Library/Application Support/Adobe/CEP/extensions/HyperSuiteX`
and sets `PlayerDebugMode` for CSXS.11)

### Browser preview (no After Effects)

The panel runs standalone in a browser using a built-in **mock After Effects**
(`mock/mock-ae.js`) — open `hyper-suite-x/index.html` (or serve the folder) to
explore the whole UI and try the presets against a simulated comp. A
"MOCK" badge shows when you're in browser mode.

## What's inside

| Tab | What it does |
|---|---|
| **HyperAI Chat** | Credits meter (222 on plan B), model picker (Fast / Pro / custom), command chat: "shake flash this edit", "split at cuts", "render h264"… — 9 whitelisted actions executed in AE, with free-text fallback. Works against **any OpenAI-compatible endpoint** (OpenAI, OpenRouter, Groq, local). Without a key it runs in demo mode. |
| **Library** | 73 presets across 9 categories (CCS 13, MASKS 7, SHAKES 29, SLIDES 16, TEXT 108 slots, TRANSITIONS 58 slots, TWIXTERS 7, ZOOMS 44 slots, OTHER 72 slots) + sound effects (real WAV, synth-generated) + textures. Toggles: *stretch keyframes to layer duration*, *apply at layer start*, *apply to selected layers / whole comp*. |
| **Transitions** | One-click transitions **at the playhead**: Shake flash · Zoom into edit · Smooth parallel · Warp flash · Hyperlapse · Glitch + shake. Each applies a matched-pair (out/in) effect stack to the two clips at the edit, with lock + "Complete" badges. |
| **General** | Arrange (align/distribute selected layers), Audio (duck, normalize, fade), Color (curves/LUT-style ramps, match), Cuts (split at cuts — full on paid plan, free tier limited). |
| **Easing / Graph** | Live bezier editor with draggable handles, overshoot toggle, 12 easing families (Linear → Anticipate, 27 variants) — read selected keyframes, apply ease, or replace positions with sampled ease values. |
| **Effects** | Master toggle (Whole comp / Selected layers, All effects), per-effect toggles for the FX stack the panel manages. |
| **Project** | Render & convert to **H.264 .mp4** via AE's own render queue, save frame as PNG, resize & center selected layers, reframe comp to size, tidy project bin, purge memory & disk cache. |

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

Only 9 tool commands can be triggered from chat (the whitelist), each costs
credits (AI 4 / transition 2 / render 10 / other 1). No key = demo mode with
canned responses.

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

Output: `dist/HyperSuiteX_v2.0.0.zxp`.

## Signature & verification

`META-INF/CERT.RSA` is a CMS/PKCS#7 SignedData over `META-INF/CODE.SF`
(digest of `MANIFEST.MF` + SHA-256 of every file), exactly like Adobe's
`ZXPSignCmd` / Java JAR output:

- signature covers the **full `[0]` signedAttrs TLV** (RFC 5652 §5.3 / JAR spec),
- `messageDigest` (1.2.840.113549.1.9.4) = SHA-256(CODE.SF),
- issuer/serial reference the embedded self-signed cert
  (`CN=Hyper Suite X, O=HyperSuite, C=SG`).

Verified in-repo with `node build/zxp-sign.js` + an independent check:
all 29 file digests, the manifest digest, the RSA signature over signedAttrs,
and the certificate self-signature all verify.

> Note: `openssl smime -verify` on OpenSSL 3.x uses a legacy PKCS7 path that
> re-hashes the signed attributes **without** the `[0]` wrapper (its
> `PKCS7_ATTR_VERIFY` template) and expects the signature as an OCTET STRING,
> so it reports "bad signature" on any spec-compliant JAR file. The file is
> verified instead with the RSA math directly (Node crypto / Java JCE); Adobe's
> CEP runtime verifies with the standard JAR path.

## Troubleshooting

- **Panel not in Window → Extensions?** Make sure AE is fully closed during
  install, and that developer mode is set (the installer does this; or check
  `reg query HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode`). If you use a
  different CEP version (AE 2022 = CSXS.10, AE 2024+ = CSXS.12/13), set the
  same value under that key.
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
  mock/mock-ae.js         simulated AE for browser mode
  CSXS/manifest.xml       CEP 11 manifest (client AEFT, dispatch HSX)
build/
  zxp-sign.js             dependency-free JAR signer (Node)
  signing/                RSA key + self-signed cert (CN=Hyper Suite X)
  build-zxp.bat/.sh       build entry points
install/
  install-windows.bat     copy to CEP folder + dev-mode registry
  install-macos.sh        same for macOS
dist/
  HyperSuiteX_v2.0.0.zxp  the signed installer package
```
