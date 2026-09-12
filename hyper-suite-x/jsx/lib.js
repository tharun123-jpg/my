/* ============================================================
   lib.js — shared helpers for the HSX JSX modules (ES3)
   ============================================================ */
HSX.comp = function () {
  try { return app.project.activeComp; } catch (e) { return null; }
};

/* ---------- stability guards ---------- */
// coerce a number with bounds; def is used when v is NaN/missing
HSX.clampNum = function (v, lo, hi, def) {
  var n = Number(v);
  if (isNaN(n)) n = (def == null ? 0 : Number(def));
  if (n < lo) n = lo;
  if (n > hi) n = hi;
  return n;
};
// active comp or throw a clean, user-readable error
HSX.requireComp = function () {
  var comp = HSX.comp();
  if (!comp) throw new Error("No composition is open in After Effects.");
  return comp;
};
// current selection (throws if fewer than min layers)
HSX.requireSel = function (min) {
  var sel = HSX.sel();
  var need = (min == null ? 1 : min);
  if (sel.length < need) throw new Error("Select at least " + need + " layer(s) in After Effects first.");
  return sel;
};
// true if layer is visible & enabled & has positive duration
HSX.isLiveLayer = function (l) {
  try {
    if (!l.enabled) return false;
    if (l.inPoint >= l.outPoint) return false;
    return true;
  } catch (e) { return false; }
};

HSX.timecode = function (t, fr) {
  var totalFrames = Math.floor(t * fr);
  var f = totalFrames % Math.floor(fr);
  var totalSec = Math.floor(totalFrames / Math.floor(fr));
  var s = totalSec % 60;
  var m = Math.floor(totalSec / 60) % 60;
  var h = Math.floor(totalSec / 3600);
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  return p2(h) + ":" + p2(m) + ":" + p2(s) + ";" + p2(f);
};

HSX.sel = function () {
  var comp = HSX.comp();
  if (!comp) return [];
  try {
    var sel = comp.selectedLayers;
    if (sel && sel.length) return sel;
  } catch (e) { }
  return [];
};

HSX.playhead = function () {
  var comp = HSX.comp();
  if (!comp) return 0;
  try { return comp.displayedFrameTime; } catch (e) { try { return comp.time; } catch (e2) { return 0; } }
};

HSX.tg = function (layer) { return layer.property("ADBE Transform Group"); };
HSX.propPos = function (layer) { return HSX.tg(layer).property("ADBE Position"); };
HSX.propScale = function (layer) { return HSX.tg(layer).property("ADBE Scale"); };
HSX.propOpacity = function (layer) { return HSX.tg(layer).property("ADBE Opacity"); };
HSX.propRot = function (layer) { return HSX.tg(layer).property("ADBE Rotate"); };

HSX.center = function (comp) { return [comp.width / 2, comp.height / 2]; };

HSX.solid = function (comp, color, name, w, h, ms) {
  return comp.layers.addSolid(color, name, w, h, ms, 100000);
};

HSX.adjustment = function (comp, name, ms) {
  var l = comp.layers.addSolid(null, name, comp.width, comp.height, ms, 100000);
  try { l.adjustmentLayer = true; } catch (e) { }
  return l;
};

HSX.fxParade = function (layer) {
  return layer.property("ADBE Effect Parade");
};

HSX.findFx = function (layer, mnemonics) {
  var parade = HSX.fxParade(layer);
  if (!parade) return null;
  var i, p;
  try {
    for (i = 1; i <= parade.numProperties; i++) {
      p = parade.property(i);
      if (p.matchName === mnemonics) return p;
    }
  } catch (e) { }
  return null;
};

HSX.removeFx = function (layer, mnemonics) {
  var p = HSX.findFx(layer, mnemonics);
  if (p) { try { p.remove(); } catch (e) { } }
};

// add an effect and set params { "-0001": value, ... }
HSX.addFx = function (layer, mnemonics, name, params) {
  var parade = HSX.fxParade(layer);
  var existing = HSX.findFx(layer, mnemonics);
  if (existing) {
    if (params) HSX.setFxParams(existing, params);
    return existing;
  }
  var eff;
  if (name) eff = parade.addProperty(mnemonics, name);
  else eff = parade.addProperty(mnemonics);
  if (params) HSX.setFxParams(eff, params);
  return eff;
};

HSX.setFxParams = function (eff, params) {
  var key, sub, i, n;
  for (key in params) {
    try {
      var v = params[key];
      if (typeof v === "object" && v.length == 2 && Array(v) === v) {
        // 2D value
        eff.property(key).setValue([v[0], v[1]]);
      } else if (typeof v === "object" && v.length == 3) {
        // color
        eff.property(key).setValue([v[0], v[1], v[2]]);
      } else {
        eff.property(key).setValue(v);
      }
    } catch (e) { /* optional param — skip */ }
  }
};

// first scalar dimension of a value (for reading single-axis anims)
HSX.scalar = function (v) {
  if (typeof v === "number") return v;
  if (v && v.length) return v[0];
  return 0;
};

// value at time (fall back to current value)
HSX.valAt = function (prop, t) {
  try {
    if (prop.numKeys > 0) return prop.valueAtTime(t);
  } catch (e) { }
  try { return prop.value; } catch (e2) { return 0; }
};

// clear all keys on a property
HSX.clearKeys = function (prop) {
  var i;
  for (i = prop.numKeys; i >= 1; i--) {
    try { prop.removeKey(i); } catch (e) { }
  }
};

// random with stable-ish jitter
HSX.jitter = function (amp, style) {
  return (Math.random() * 2 - 1) * amp;
};

// add position jitter keys between t0..t1
HSX.shakeKeys = function (layer, t0, t1, amp, style, axis) {
  var prop = HSX.propPos(layer);
  var base = HSX.valAt(prop, t0);
  var bx = 0, by = 0;
  if (base && base.length >= 2) { bx = base[0]; by = base[1]; }
  else if (typeof base === "number") bx = base;
  var n = 16;
  var i, t, x, y, o;
  if (style === "orbit") {
    var phase = Math.random() * 6.28;
    for (i = 0; i <= n; i++) {
      t = t0 + (t1 - t0) * (i / n);
      o = amp * (0.6 + 0.4 * Math.sin(i * 1.3));
      x = bx + Math.cos(phase + (i / n) * 6.283 * 2) * o;
      y = by + Math.sin(phase + (i / n) * 6.283 * 2) * o;
      prop.setValueAtTime(t, [x, y]);
    }
    try { prop.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e) { }
    return;
  }
  for (i = 0; i <= n; i++) {
    t = t0 + (t1 - t0) * (i / n);
    x = bx; y = by;
    if (axis === "xy" || axis === "x" || !axis) x += HSX.jitter(amp, style);
    if (axis === "xy" || axis === "y") y += HSX.jitter(amp, style);
    prop.setValueAtTime(t, [x, y]);
  }
  try {
    prop.interpolationType = (style === "hard") ? KeyframeInterpolationType.ROBOTIC : KeyframeInterpolationType.LINEAR;
    if (style !== "hard") {
      // smooth random-ish velocities for handheld feel
      for (i = 1; i <= prop.numKeys; i++) {
        try {
          var kve = new KeyframeEase(1, HSX.jitter(amp * 3, "smooth"));
          prop.easeOut(i, kve);
          prop.easeIn(i, new KeyframeEase(1, HSX.jitter(amp * 3, "smooth")));
        } catch (e2) { }
      }
    }
  } catch (e3) { }
};

// flash solid over a time window
HSX.flash = function (comp, t0, t1, peak) {
  var f = HSX.solid(comp, [1, 1, 1], HSX_LAYER_PREFIX + " Flash", comp.width, comp.height, Math.max(1, (t1 - t0) * 1000));
  try { f.inPoint = t0; f.outPoint = t1; f.startTime = t0; } catch (e) { }
  var op = HSX.propOpacity(f);
  op.setValueAtTime(t0, 0);
  op.setValueAtTime(t0 + (t1 - t0) * 0.18, peak == null ? 100 : peak);
  op.setValueAtTime(t1, 0);
  try { f.blendMode = "ADD"; } catch (e2) { }
  return f;
};

// find or create the comp-wide FX master adjustment layer
HSX.fxMaster = function (comp, create) {
  var i, l;
  for (i = 1; i <= comp.numLayers; i++) {
    l = comp.layer(i);
    if (l.name === HSX_LAYER_PREFIX + " FX Master") return l;
  }
  if (!create) return null;
  var m = HSX.adjustment(comp, HSX_LAYER_PREFIX + " FX Master", (comp.outPoint || 1) * 1000);
  // move to top
  try { m.moveToEndOfStack(1); } catch (e) { }
  return m;
};

HSX_LAYER_PREFIX = "[HSX]";
HSX_FX_PREFIX = "HSX_";
