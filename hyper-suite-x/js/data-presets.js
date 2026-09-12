/* ============================================================
   data-presets.js — the whole catalog: library presets,
   one-click transitions, FX toggles, color looks, ease curves.
   Preset "kind" + params are interpreted by the JSX animator
   (jsx/library.js) so new presets can be added without JSX changes.
   ============================================================ */
window.HSX_DATA = (function () {
  "use strict";

  /* ------------------------------------------------ presets */
  var PRESETS = [
    /* SHAKES */
    { id: "sh_handheld", cat: "shakes", name: "Handheld",   desc: "Organic camera shake, like a real operator", kind: "shake", params: { amp: 9, n: 26, style: "smooth", axis: "xy" }, dur: 1.6, thumb: "shake" },
    { id: "sh_vlog",     cat: "shakes", name: "Vlog Shake", desc: "Bouncy gimbal-free phone energy",           kind: "shake", params: { amp: 13, n: 30, style: "smooth", axis: "xy" }, dur: 1.2, thumb: "shake" },
    { id: "sh_earthq",   cat: "shakes", name: "Earthquake", desc: "Hard wide shake, disaster scenes",           kind: "shake", params: { amp: 24, n: 40, style: "hard", axis: "xy" }, dur: 2.0, thumb: "shake" },
    { id: "sh_glitch",   cat: "shakes", name: "Glitch Shake", desc: "Sticky, digital stutter shake",            kind: "shake", params: { amp: 11, n: 22, style: "hard", axis: "xy" }, dur: 1.0, thumb: "glitchshake" },
    { id: "sh_drift",    cat: "shakes", name: "Subtle Drift", desc: "Almost invisible breathing",               kind: "shake", params: { amp: 3.5, n: 20, style: "smooth", axis: "xy" }, dur: 2.2, thumb: "drift" },
    { id: "sh_punch",    cat: "shakes", name: "Punch-in Shake", desc: "Quick lurch forward on impact",          kind: "shake", params: { amp: 16, n: 14, style: "hard", axis: "x" }, dur: 0.7, thumb: "shake" },
    { id: "sh_jolt",     cat: "shakes", name: "Camera Jolt", desc: "One violent bump then settle",              kind: "shake", params: { amp: 20, n: 10, style: "hard", axis: "y" }, dur: 0.6, thumb: "shake" },
    { id: "sh_orbit",    cat: "shakes", name: "Orbit Wobble", desc: "Circular sway, handheld orbit feel",       kind: "shake", params: { amp: 12, n: 24, style: "smooth", axis: "orbit" }, dur: 2.0, thumb: "orbit" },

    /* ZOOMS */
    { id: "zm_push",    cat: "zooms", name: "Slow Push In",   desc: "Classic cinematic dolly in",        kind: "zoom", params: { from: 100, to: 112 }, dur: 4.0, thumb: "zoomin" },
    { id: "zm_pull",    cat: "zooms", name: "Slow Pull Out",  desc: "Reveal the wider scene",            kind: "zoom", params: { from: 112, to: 100 }, dur: 4.0, thumb: "zoomout" },
    { id: "zm_punch",   cat: "zooms", name: "Punch In",       desc: "Fast snap-zoom for emphasis",       kind: "zoom", params: { from: 100, to: 124 }, dur: 0.4, thumb: "zoomin" },
    { id: "zm_puncho",  cat: "zooms", name: "Punch Out",      desc: "Snap back after a punch in",        kind: "zoom", params: { from: 124, to: 100 }, dur: 0.4, thumb: "zoomout" },
    { id: "zm_hold",    cat: "zooms", name: "Dolly In Hold",  desc: "Push in, hold, return",             kind: "ramp", params: { inTo: 114, inFrac: 0.3, outFrac: 0.8 }, dur: 5.0, thumb: "ramp" },
    { id: "zm_dollexit",cat: "zooms", name: "Dolly Out Exit", desc: "Hold, then glide away",             kind: "ramp", params: { outTo: 116, inFrac: 0.55 }, dur: 5.0, thumb: "ramp" },
    { id: "zm_inout",   cat: "zooms", name: "Punch In-Out",   desc: "Snap in, hold, snap out",           kind: "ramp", params: { inTo: 122, inFrac: 0.2, outFrac: 0.8, outTo: 100 }, dur: 3.5, thumb: "ramp" },
    { id: "zm_ramp",    cat: "zooms", name: "Ramping Zoom",   desc: "Slow start, fast finish",           kind: "zoomEase", params: { from: 100, to: 130, ease: "expoOut" }, dur: 3.0, thumb: "ramp" },

    /* SLIDES */
    { id: "sl_left",  cat: "slides", name: "Slide From Left",  desc: "Enter from off-screen left",      kind: "slide", params: { dx: -1.1, dy: 0, fade: 0 }, dur: 0.7, thumb: "slleft" },
    { id: "sl_right", cat: "slides", name: "Slide From Right", desc: "Enter from off-screen right",     kind: "slide", params: { dx: 1.1, dy: 0, fade: 0 }, dur: 0.7, thumb: "slright" },
    { id: "sl_up",    cat: "slides", name: "Slide From Bottom",desc: "Rise up into place",              kind: "slide", params: { dx: 0, dy: 1.1, fade: 0.5 }, dur: 0.7, thumb: "slup" },
    { id: "sl_down",  cat: "slides", name: "Slide From Top",   desc: "Drop down into frame",            kind: "slide", params: { dx: 0, dy: -1.1, fade: 0.5 }, dur: 0.7, thumb: "sldown" },
    { id: "sl_diag",  cat: "slides", name: "Diagonal In",      desc: "Corner-to-corner entrance",       kind: "slide", params: { dx: -0.9, dy: 0.9, fade: 0.6 }, dur: 0.8, thumb: "sldiag" },
    { id: "sl_bounce",cat: "slides", name: "Slide Bounce",     desc: "Overshoots the mark, settles",    kind: "slide", params: { dx: -1.2, dy: 0, fade: 0, overshoot: 1.12 }, dur: 0.9, thumb: "slbounce" },
    { id: "sl_whip",  cat: "slides", name: "Whip Slide",       desc: "Fast expo entry, no fade",        kind: "slide", params: { dx: -1.4, dy: 0, fade: 0, ease: "expoOut" }, dur: 0.45, thumb: "slwhip" },
    { id: "sl_exit",  cat: "slides", name: "Slide Exit",       desc: "Leave right, for endings",        kind: "slide", params: { dx: 1.2, dy: 0, fade: 0.8, from: 0 }, dur: 0.6, thumb: "slwhip" },

    /* TEXT */
    { id: "tx_pop",     cat: "text", name: "Pop In",          desc: "Scale 0 → 110 → 100 with fade",  kind: "text", params: { anim: "pop" },     dur: 0.5, thumb: "txpop" },
    { id: "tx_fade",    cat: "text", name: "Fade In",         desc: "Clean 0 → 100 opacity",          kind: "text", params: { anim: "fade" },    dur: 0.8, thumb: "txfade" },
    { id: "tx_type",    cat: "text", name: "Typewriter",      desc: "Characters appear one by one",   kind: "text", params: { anim: "type" },    dur: 1.4, thumb: "txtype" },
    { id: "tx_glow",    cat: "text", name: "Glow Pulse",      desc: "Neon glow breathing",            kind: "text", params: { anim: "glow" },    dur: 2.0, thumb: "txglow" },
    { id: "tx_track",   cat: "text", name: "Track In",        desc: "Letter spacing closes to zero",  kind: "text", params: { anim: "track" }, dur: 0.9, thumb: "txtrack" },
    { id: "tx_slide",   cat: "text", name: "Slide Up In",     desc: "Rises from below the line",      kind: "text", params: { anim: "slide" }, dur: 0.6, thumb: "txslide" },
    { id: "tx_bounce",  cat: "text", name: "Bounce In",       desc: "Elastic drop from above",        kind: "text", params: { anim: "bounce" },dur: 0.8, thumb: "txbounce" },
    { id: "tx_glitch",  cat: "text", name: "Glitch In",       desc: "Stutters into place",            kind: "text", params: { anim: "glitch" },dur: 0.6, thumb: "txglitch" },
    { id: "tx_strobe",  cat: "text", name: "Strobe In",       desc: "Blinks on, 3 flashes",           kind: "text", params: { anim: "strobe" },dur: 0.7, thumb: "txstrobe" },
    { id: "tx_wipe",    cat: "text", name: "Wipe Reveal",     desc: "Left-to-right mask reveal",      kind: "text", params: { anim: "wipe" },    dur: 0.8, thumb: "txwipe" },

    /* MASKS */
    { id: "ms_lr",   cat: "masks", name: "Circle Wipe R",  desc: "Growing circle from the left",      kind: "mask", params: { shape: "ellipse", from: 0.03, to: 2.4, cx: 0.15, cy: 0.5 }, dur: 0.9, thumb: "mask" },
    { id: "ms_rl",   cat: "masks", name: "Circle Wipe L",  desc: "Growing circle from the right",     kind: "mask", params: { shape: "ellipse", from: 0.03, to: 2.4, cx: 0.85, cy: 0.5 }, dur: 0.9, thumb: "mask" },
    { id: "ms_ud",   cat: "masks", name: "Circle Wipe U/D",desc: "Iris up or down from center",       kind: "mask", params: { shape: "ellipse", from: 0.03, to: 2.4, cx: 0.5, cy: 1.05 }, dur: 0.9, thumb: "mask" },
    { id: "ms_iris", cat: "masks", name: "Iris Expand",    desc: "Classic centered iris open",        kind: "mask", params: { shape: "ellipse", from: 0.0, to: 2.2, cx: 0.5, cy: 0.5 }, dur: 1.0, thumb: "iris" },
    { id: "ms_bar",  cat: "masks", name: "Bar Wipe",       desc: "Wide bar sweep across the frame",   kind: "mask", params: { shape: "rect", from: 0.02, to: 2.4, cx: 0.1, cy: 0.5, wide: true }, dur: 0.9, thumb: "maskbar" },
    { id: "ms_corner",cat:"masks", name: "Corner Reveal",  desc: "Reveals from a corner diagonally",  kind: "mask", params: { shape: "rect", from: 0.02, to: 2.6, cx: 0.12, cy: 0.88 }, dur: 1.0, thumb: "mask" },

    /* TRANSITIONS (library copies of the one-click set) */
    { id: "tr_flash",   cat: "tr", name: "Flash Cut",      desc: "White flash on the cut",            kind: "transition", params: { t: "flash" },       dur: 0.4, thumb: "trflash" },
    { id: "tr_shakefl", cat: "tr", name: "Shake Flash",    desc: "Flash + handheld shake",            kind: "transition", params: { t: "shakeflash" }, dur: 0.5, thumb: "trshake" },
    { id: "tr_zoomcut", cat: "tr", name: "Zoom into Edit", desc: "Scale out old, in on new",          kind: "transition", params: { t: "zoomcut" },     dur: 0.4, thumb: "trzoom" },
    { id: "tr_parallel",cat: "tr", name: "Smooth Parallel",desc: "Directional slide across the cut",  kind: "transition", params: { t: "parallel" },  dur: 0.5, thumb: "trparallel" },
    { id: "tr_whip",    cat: "tr", name: "Whip Pan",       desc: "Fast horizontal blur sweep",        kind: "transition", params: { t: "whip" },        dur: 0.4, thumb: "trwhip" },
    { id: "tr_warp",    cat: "tr", name: "Warp Flash",     desc: "Turbulent warp pulse + flash",      kind: "transition", params: { t: "warp" },        dur: 0.5, thumb: "trwarp" },
    { id: "tr_glitch",  cat: "tr", name: "Glitch + Shake", desc: "RGB split stutter + jolt",          kind: "transition", params: { t: "glitch" },      dur: 0.5, thumb: "trglitch" },
    { id: "tr_pixel",   cat: "tr", name: "Pixel Dissolve", desc: "Blocky pixelate in and out",        kind: "transition", params: { t: "pixel" },       dur: 0.6, thumb: "trpixel" },
    { id: "tr_iris",    cat: "tr", name: "Iris Cut",       desc: "Circle closes, opens on next",      kind: "transition", params: { t: "iris" },        dur: 0.7, thumb: "triris" },
    { id: "tr_hyper",   cat: "tr", name: "Hyperlapse",     desc: "Speed-ramp burst around the cut",   kind: "transition", params: { t: "hyper" },       dur: 1.5, thumb: "trhyper" },

    /* SOUND */
    { id: "sfx_impact", cat: "sfx", name: "Impact",   desc: "Punchy hit for hard cuts",  kind: "sfx", params: { sfx: "impact" }, dur: 0.5, thumb: "sfx" },
    { id: "sfx_boom",   cat: "sfx", name: "Boom",     desc: "Deep cinematic thud",       kind: "sfx", params: { sfx: "boom" },   dur: 0.9, thumb: "sfx" },
    { id: "sfx_whoosh", cat: "sfx", name: "Whoosh",   desc: "Fast transition sweep",     kind: "sfx", params: { sfx: "whoosh" }, dur: 0.7, thumb: "sfx" },
    { id: "sfx_riser",  cat: "sfx", name: "Riser",    desc: "Build-up tension sweep",    kind: "sfx", params: { sfx: "riser" },  dur: 1.3, thumb: "sfx" },
    { id: "sfx_tick",   cat: "sfx", name: "Tick",     desc: "UI / editing tick",         kind: "sfx", params: { sfx: "tick" },   dur: 0.1, thumb: "sfx" },
    { id: "sfx_click",  cat: "sfx", name: "Click",    desc: "Light interface click",     kind: "sfx", params: { sfx: "click" },  dur: 0.15, thumb: "sfx" },

    /* TEXTURES (solid + effect recipes) */
    { id: "tx_grain",  cat: "texture", name: "Film Grain",   desc: "Animated fractal grain overlay",     kind: "texture", params: { recipe: "grain" },  dur: 0, thumb: "texture" },
    { id: "tx_dust",   cat: "texture", name: "Dust",         desc: "Floating dust motes",                kind: "texture", params: { recipe: "dust" },   dur: 0, thumb: "texture" },
    { id: "tx_paper",  cat: "texture", name: "Paper",        desc: "Static fine texture plate",          kind: "texture", params: { recipe: "paper" },  dur: 0, thumb: "texture" },
    { id: "tx_vig",    cat: "texture", name: "Vignette",     desc: "Soft dark frame edges",              kind: "texture", params: { recipe: "vignette" }, dur: 0, thumb: "vignette" },

    /* COLOR looks */
    { id: "cl_clean",  cat: "color", name: "Clean",       desc: "Crisp, balanced, broadcast safe",   kind: "look", params: { look: "clean" },  dur: 0, thumb: "color", sw: "linear-gradient(135deg,#8fa3b8,#41505e)" },
    { id: "cl_moody",  cat: "color", name: "Moody",       desc: "Lifted blacks, teal shadows",       kind: "look", params: { look: "moody" },  dur: 0, thumb: "color", sw: "linear-gradient(135deg,#3c545e,#141c22)" },
    { id: "cl_vintage",cat: "color", name: "Vintage",     desc: "Warm sepia, grain, soft edges",     kind: "look", params: { look: "vintage" },dur: 0, thumb: "color", sw: "linear-gradient(135deg,#c9a06a,#5a3d28)" },
    { id: "cl_teo",    cat: "color", name: "Teal & Orange",desc: "Hollywood contrast grade",          kind: "look", params: { look: "teo" },    dur: 0, thumb: "color", sw: "linear-gradient(135deg,#e08a4c,#1d4e5e)" },
    { id: "cl_bw",     cat: "color", name: "B&W",         desc: "High-contrast monochrome",          kind: "look", params: { look: "bw" },     dur: 0, thumb: "color", sw: "linear-gradient(135deg,#f0f0f0,#1a1a1a)" },
    { id: "cl_pastel", cat: "color", name: "Pastel",      desc: "Soft, faded, dreamy",               kind: "look", params: { look: "pastel" }, dur: 0, thumb: "color", sw: "linear-gradient(135deg,#e8c9cf,#b8c9e0)" },
    { id: "cl_punch",  cat: "color", name: "Punch",       desc: "Saturation + contrast boost",       kind: "look", params: { look: "punch" },  dur: 0, thumb: "color", sw: "linear-gradient(135deg,#ff7847,#7828ff)" },
    { id: "cl_cold",   cat: "color", name: "Cold",        desc: "Blue winter grade",                 kind: "look", params: { look: "cold" },   dur: 0, thumb: "color", sw: "linear-gradient(135deg,#9fc4e8,#24344a)" },

    /* OTHER */
    { id: "ot_dup",     cat: "other", name: "Duplicate Stack",  desc: "Clone the selection 3×, offset",   kind: "other", params: { op: "dup", n: 3 },       dur: 0, thumb: "other" },
    { id: "ot_freeze",  cat: "other", name: "Freeze Frame",     desc: "Freeze the selection at playhead", kind: "other", params: { op: "freeze" },   dur: 0, thumb: "other" },
    { id: "ot_solid",   cat: "other", name: "Color Solid",      desc: "Add a full-comp solid layer",      kind: "other", params: { op: "solid" },      dur: 0, thumb: "other" },
    { id: "ot_null",    cat: "other", name: "Control Null",     desc: "Null at center for rigging",       kind: "other", params: { op: "null" },       dur: 0, thumb: "other" },
    { id: "ot_adjust",  cat: "other", name: "Adjustment Layer", desc: "Blank adjustment layer on top",    kind: "other", params: { op: "adjust" },     dur: 0, thumb: "other" }
  ];

  var CATEGORIES = [
    { id: "shakes",    name: "SHAKES" },
    { id: "zooms",     name: "ZOOMS" },
    { id: "slides",    name: "SLIDES" },
    { id: "text",      name: "TEXT" },
    { id: "masks",     name: "MASKS" },
    { id: "tr",        name: "TRANSITIONS" },
    { id: "sfx",       name: "SOUND" },
    { id: "texture",   name: "TEXTURES" },
    { id: "color",     name: "COLOR" },
    { id: "other",     name: "OTHER" }
  ];

  /* ------------------------------------------------ one-click transitions */
  var TRANSITIONS = [
    { id: "flash",    name: "Flash Cut",       locked: false },
    { id: "shakeflash", name: "Shake Flash",   locked: false },
    { id: "zoomcut",  name: "Zoom into Edit",  locked: false },
    { id: "parallel", name: "Smooth Parallel", locked: false },
    { id: "whip",     name: "Whip Pan",        locked: false },
    { id: "warp",     name: "Warp Flash",      locked: true },
    { id: "glitch",   name: "Glitch + Shake",  locked: true },
    { id: "pixel",    name: "Pixel Dissolve",  locked: true },
    { id: "iris",     name: "Iris Cut",        locked: false },
    { id: "hyper",    name: "Hyperlapse",      locked: true }
  ];

  /* ------------------------------------------------ FX toggles */
  var FX = [
    { id: "glow",     name: "Glow",              desc: "Soft luminous bloom",        eff: "ADBE Glow",
      params: { "-0001": 12, "-0002": 0.6, "-0003": 60 } },
    { id: "rays",     name: "Light Rays",        desc: "Anamorphic streaks",         eff: "ADBE Light Rays",
      params: { "-0001": 40, "-0002": 0.15, "-0003": 0 } },
    { id: "warp",     name: "Warp",              desc: "Turbulent displacement",     eff: "ADBE Turbulent Displace",
      params: { "-0001": 18, "-0002": 60 } },
    { id: "grain",    name: "Film Grain",        desc: "Animated fractal noise",     eff: "ADBE Fractal Noise",
      params: { "-0002": 100, "-0003": -40, "-0004": 0.5 } },
    { id: "blur",     name: "Box Blur",          desc: "Fast soft focus",            eff: "ADBE Fast Box Blur 2",
      params: { "-0001": 12 } },
    { id: "gauss",    name: "Gaussian Blur",     desc: "Optical blur",               eff: "ADBE Gaussian Blur 2",
      params: { "-0001": 10 } },
    { id: "sharpen",  name: "Sharpen",           desc: "Detail enhancement",         eff: "ADBE Sharpen",
      params: { "-0001": 40 } },
    { id: "chroma",   name: "Chromatic Aberr.",  desc: "Lens RGB split",             eff: "ADBE Channel Offset",
      params: { "-0002": [2.2, 0], "-0004": [-2.2, 0] } },
    { id: "vignette", name: "Vignette",          desc: "Darken the corners",         eff: "ADBE Vignette",
      params: { "-0002": 2.4, "-0004": 90 } },
    { id: "tint",     name: "Warm Tint",         desc: "Golden color wash",          eff: "ADBE Tint",
      params: { "-0001": [0.1, 0.05, 0], "-0002": [1, 0.85, 0.7] } },
    { id: "bw",       name: "Black & White",     desc: "Desaturate",                 eff: "ADBE Monochrome",
      params: { "-0001": 50 } },
    { id: "exposure", name: "Exposure Boost",    desc: "Brighter highlights",        eff: "ADBE Exposure",
      params: { "-0001": 0.8 } }
  ];

  /* ------------------------------------------------ color looks */
  var LOOKS = {
    clean:    { name: "Clean",
      steps: [ { eff: "ADBE Exposure", params: { "-0001": 0.35 } },
               { eff: "ADBE HUE SATURATION-0001", params: { "-0002": 8 } },
               { eff: "ADBE Levelsss", params: { "-0001": 12, "-0002": 235 } } ] },
    moody:    { name: "Moody",
      steps: [ { eff: "ADBE Tint", params: { "-0001": [0.05, 0.12, 0.13], "-0002": [0.75, 0.82, 0.85] } },
               { eff: "ADBE Levelsss", params: { "-0001": 30, "-0003": 8 } },
               { eff: "ADBE HUE SATURATION-0001", params: { "-0002": -12 } } ] },
    vintage:  { name: "Vintage",
      steps: [ { eff: "ADBE Tint", params: { "-0001": [0.25, 0.16, 0.05], "-0002": [0.95, 0.82, 0.6] } },
               { eff: "ADBE Levelsss", params: { "-0001": 25, "-0002": 220, "-0003": 10 } },
               { eff: "ADBE Fractal Noise", params: { "-0002": 100, "-0003": -60, "-0004": 0.3 } },
               { eff: "ADBE Vignette", params: { "-0002": 1.8, "-0004": 80 } } ] },
    teo:      { name: "Teal & Orange",
      steps: [ { eff: "ADBE Tint", params: { "-0001": [0.03, 0.14, 0.16], "-0002": [0.9, 0.55, 0.3] } },
               { eff: "ADBE Levelsss", params: { "-0001": 15, "-0002": 240 } },
               { eff: "ADBE HUE SATURATION-0001", params: { "-0002": 14 } } ] },
    bw:       { name: "B&W",
      steps: [ { eff: "ADBE Monochrome", params: { "-0001": 50 } },
               { eff: "ADBE Levelsss", params: { "-0001": 8, "-0002": 245 } } ] },
    pastel:   { name: "Pastel",
      steps: [ { eff: "ADBE HUE SATURATION-0001", params: { "-0002": -22 } },
               { eff: "ADBE Levelsss", params: { "-0001": 45, "-0003": 18 } },
               { eff: "ADBE Exposure", params: { "-0001": 0.4 } } ] },
    punch:    { name: "Punch",
      steps: [ { eff: "ADBE HUE SATURATION-0001", params: { "-0002": 22 } },
               { eff: "ADBE Levelsss", params: { "-0001": 10, "-0002": 242 } },
               { eff: "ADBE Exposure", params: { "-0001": 0.5 } } ] },
    cold:     { name: "Cold",
      steps: [ { eff: "ADBE Tint", params: { "-0001": [0, 0.06, 0.18], "-0002": [0.7, 0.82, 1] } },
               { eff: "ADBE HUE SATURATION-0001", params: { "-0002": -6 } } ] }
  };

  /* ------------------------------------------------ easing curves */
  // type "bez" = cubic bezier (x1,y1,x2,y2); type "kf" = keyframe list [tFrac, vFrac, vel]
  //   vel: "0" = zero slope, "h" = high (3x), "a" = auto (linear)
  var EASES = [
    { id: "linear",      name: "Linear",      type: "bez", bez: [0, 0, 1, 1] },
    { id: "ease",        name: "Easy Ease",   type: "bez", bez: [0.25, 0.1, 0.25, 1] },
    { id: "smooth",      name: "Smooth",      type: "bez", bez: [0.45, 0, 0.55, 1] },
    { id: "easeOut",     name: "Ease Out",    type: "bez", bez: [0, 0, 0.58, 1] },
    { id: "easeIn",      name: "Ease In",     type: "bez", bez: [0.42, 0, 1, 1] },
    { id: "quad",        name: "Quart",       type: "bez", bez: [0.455, 0.03, 0.515, 0.955] },
    { id: "expoOut",     name: "Expo Out",    type: "bez", bez: [0.19, 1, 0.22, 1] },
    { id: "sine",        name: "Sine",        type: "bez", bez: [0.445, 0.05, 0.55, 0.95] },
    { id: "backOut",     name: "Back Out",    type: "bez", bez: [0.34, 1.56, 0.64, 1] },
    { id: "anticipate",  name: "Anticipate",  type: "kf",  kf: [[0, 0, "0"], [0.3, -0.12, "a"], [1, 1, "0"]] },
    { id: "sineIn",      name: "Sine In",     type: "bez", bez: [0.47, 0, 0.745, 0.715] },
    { id: "sineOut",     name: "Sine Out",    type: "bez", bez: [0.255, 0.135, 0.23, 1] },
    { id: "quadIn",      name: "Quad In",     type: "bez", bez: [0.55, 0.085, 0.68, 0.53] },
    { id: "quadOut",     name: "Quad Out",    type: "bez", bez: [0.25, 0.46, 0.45, 0.94] },
    { id: "cubicIn",     name: "Cubic In",    type: "bez", bez: [0.645, 0.045, 0.785, 0.135] },
    { id: "cubicOut",    name: "Cubic Out",   type: "bez", bez: [0.215, 0.61, 0.355, 1] },
    { id: "cubicInOut",  name: "Cubic In Out",type: "bez", bez: [0.645, 0.045, 0.355, 1] },
    { id: "quartIn",     name: "Quart In",    type: "bez", bez: [0.755, 0.05, 0.855, 0.06] },
    { id: "quartOut",    name: "Quart Out",   type: "bez", bez: [0.23, 1, 0.32, 1] },
    { id: "quintIn",     name: "Quint In",    type: "bez", bez: [0.83, 0, 0.905, 0.05] },
    { id: "quintOut",    name: "Quint Out",   type: "bez", bez: [0.165, 0.84, 0.44, 1] },
    { id: "quintInOut",  name: "Quint In Out",type: "bez", bez: [0.83, 0, 0.17, 1] },
    { id: "expoIn",      name: "Expo In",     type: "bez", bez: [0.95, 0.05, 0.795, 0.035] },
    { id: "expoInOut",   name: "Expo In Out", type: "bez", bez: [1, 0, 0, 1] },
    { id: "circIn",      name: "Circ In",     type: "bez", bez: [0.6, 0.04, 0.98, 0.335] },
    { id: "circOut",     name: "Circ Out",    type: "bez", bez: [0.075, 0.82, 0.165, 1] },
    { id: "circInOut",   name: "Circ In Out", type: "bez", bez: [0.785, 0.135, 0.15, 0.86] }
  ];

  /* ------------------------------------------------ helpers */
  function findPreset(id) {
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }
  function byCat(cat) {
    var out = [];
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].cat === cat) out.push(PRESETS[i]);
    return out;
  }
  function findEase(id) {
    for (var i = 0; i < EASES.length; i++) if (EASES[i].id === id) return EASES[i];
    return null;
  }

  // cubic bezier y(t)
  function bezY(p, t) {
    var x1 = p[0], y1 = p[1], x2 = p[2], y2 = p[3];
    // solve x(u)=t for u, then y(u)
    var u = t, i, x;
    for (i = 0; i < 8; i++) {
      x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
      var dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
      if (u < 0) u = 0; if (u > 1) u = 1;
    }
    var v = 1 - u;
    return 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u;
  }

  // convert any ease def into sampled keyframes: [{t, v, vel}] t,v in 0..1 space
  function sampleEase(def, n) {
    n = n || 16;
    if (def.type === "kf") {
      var kf = def.kf.slice();
      // densify linearly between kf points (last segment includes its endpoint)
      var out = [];
      for (var s = 0; s < kf.length - 1; s++) {
        var a = kf[s], b = kf[s + 1];
        var span = b[0] - a[0];
        var sub = Math.max(2, Math.round(n * span));
        var lastSeg = (s === kf.length - 2);
        var steps = lastSeg ? sub : sub - 1;
        for (var k = 0; k <= steps; k++) {
          var f = k / sub;
          out.push({ t: a[0] + span * f, v: a[1] + (b[1] - a[1]) * f, vel: "a" });
        }
      }
      // mark endpoint velocities
      out[0].vel = kf[0][2];
      out[out.length - 1].vel = kf[kf.length - 1][2];
      return out;
    }
    // bezier
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var y = bezY(def.bez, t);
      pts.push({ t: t, v: y, vel: i === 0 || i === n ? "0" : "a" });
    }
    return pts;
  }

  return {
    PRESETS: PRESETS, CATEGORIES: CATEGORIES, TRANSITIONS: TRANSITIONS,
    FX: FX, LOOKS: LOOKS, EASES: EASES,
    findPreset: findPreset, byCat: byCat, findEase: findEase,
    bezY: bezY, sampleEase: sampleEase
  };
})();
