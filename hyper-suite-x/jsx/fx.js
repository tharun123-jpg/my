/* ============================================================
   fx.js — FX toggles + color looks (ES3)
   ============================================================ */
HSX_CMD.fx = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var target = args.target || "comp";
  var i;

  var FX = {
    glow:     ["ADBE Glow", { "-0001": 12, "-0002": 0.6, "-0003": 60 }],
    rays:     ["ADBE Light Rays", { "-0001": 40, "-0002": 0.15 }],
    warp:     ["ADBE Turbulent Displace", { "-0001": 18, "-0002": 60 }],
    grain:    ["ADBE Fractal Noise", { "-0002": 100, "-0003": -40, "-0004": 0.5 }],
    blur:     ["ADBE Fast Box Blur 2", { "-0001": 12 }],
    gauss:    ["ADBE Gaussian Blur 2", { "-0001": 10 }],
    sharpen:  ["ADBE Sharpen", { "-0001": 40 }],
    chroma:   ["ADBE Channel Offset", { "-0001": 7, "-0002": [2.2, 0], "-0004": [-2.2, 0] }],
    vignette: ["ADBE Vignette", { "-0002": 2.4, "-0004": 90 }],
    tint:     ["ADBE Tint", { "-0001": [0.1, 0.05, 0], "-0002": [1, 0.85, 0.7] }],
    bw:       ["ADBE Monochrome", { "-0001": 50 }],
    exposure: ["ADBE Exposure", { "-0001": 0.8 }]
  };

  function targets() {
    if (target === "layers") {
      var sel = HSX.sel();
      if (!sel.length) return null;
      return sel;
    }
    return [HSX.fxMaster(comp, true)];
  }

  function toggle(id, on) {
    var spec = FX[id];
    if (!spec) return false;
    var list = targets();
    if (!list) return false;
    var i2;
    for (i2 = 0; i2 < list.length; i2++) {
      var L = list[i2];
      if (on) HSX.addFx(L, spec[0], null, spec[1]);
      else HSX.removeFx(L, spec[0]);
    }
    return true;
  }

  if (args.all != null) {
    var ids = [];
    for (var k in FX) ids.push(k);
    var n = 0;
    for (i = 0; i < ids.length; i++) if (toggle(ids[i], args.all)) n++;
    return { msg: n + " FX " + (args.all ? "on" : "off") };
  }
  if (args.id) {
    if (!toggle(args.id, !!args.on)) {
      return { error: target === "layers" ? "Select layers first." : "Unknown FX." };
    }
    return { msg: args.id + (args.on ? " on" : " off") };
  }
  return { error: "No FX id given." };
};

HSX_CMD.fx_state = function (args) {
  var comp = HSX.comp();
  var states = {};
  if (!comp) return { states: states };
  var FX = {
    glow: "ADBE Glow", rays: "ADBE Light Rays", warp: "ADBE Turbulent Displace",
    grain: "ADBE Fractal Noise", blur: "ADBE Fast Box Blur 2", gauss: "ADBE Gaussian Blur 2",
    sharpen: "ADBE Sharpen", chroma: "ADBE Channel Offset", vignette: "ADBE Vignette",
    tint: "ADBE Tint", bw: "ADBE Monochrome", exposure: "ADBE Exposure"
  };
  var i, k;
  if (args.target === "layers") {
    var sel = HSX.sel();
    for (k in FX) {
      states[k] = false;
      for (i = 0; i < sel.length; i++) {
        if (HSX.findFx(sel[i], FX[k])) { states[k] = true; break; }
      }
    }
  } else {
    var master = HSX.fxMaster(comp, false);
    for (k in FX) states[k] = !!(master && HSX.findFx(master, FX[k]));
  }
  return { states: states };
};

HSX_CMD.look = function (args) {
  return HSX_CMD.preset({
    preset: { kind: "look", params: { look: args.id }, dur: 0 }
  });
};
