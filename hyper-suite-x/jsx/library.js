/* ============================================================
   library.js — preset animators (ES3)
   Interprets {kind, params} from the JS-side catalog.
   ============================================================ */

HSX_CMD.preset = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var p = args.preset;
  if (!p) return { error: "No preset data." };
  var kind = p.kind, params = p.params || {};
  var sel = HSX.sel();
  var i;

  switch (kind) {
    case "sfx":
      return args.b64 ? HSX_CMD.sfx({ id: params.sfx, b64: args.b64 }) : { error: "Audio data missing." };

    case "texture":
      return HSX_TEXTURE.apply(comp, params.recipe);

    case "look": {
      var done = 0;
      if (sel.length) {
        for (i = 0; i < sel.length; i++) {
          try { HSX_LOOK.apply(sel[i], params.look); done++; } catch (el) { }
        }
      } else {
        var tgt = null;
        for (i = 1; i <= comp.numLayers; i++) {
          if (comp.layer(i).name === HSX_LAYER_PREFIX + " LOOK " + (params.look || "")) { tgt = comp.layer(i); break; }
        }
        if (!tgt) tgt = HSX.adjustment(comp, HSX_LAYER_PREFIX + " LOOK " + (params.look || ""), comp.duration * 1000);
        HSX_LOOK.apply(tgt, params.look);
        done = 1;
      }
      return { msg: "look applied", layers: done };
    }

    case "other":
      return HSX_OTHER.apply(comp, sel, params);

    default: {
      // animation presets need target layers
      if (!sel.length) return { error: "Select at least one layer in the timeline first." };
      var applied = 0;
      for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        var dur = args.stretch && L.duration > 0.2 ? L.duration : (p.dur || 1);
        var t0 = args.atStart ? L.inPoint : HSX.playhead();
        if (args.atStart && L.inPoint + dur > L.outPoint) dur = Math.max(0.2, L.outPoint - L.inPoint);
        HSX_ANIM.run(L, comp, kind, params, t0, dur);
        applied++;
      }
      return { layers: applied };
    }
  }
};

/* ------------------------------------------------ animators */
HSX_ANIM = {
  run: function (L, comp, kind, params, t0, dur) {
    switch (kind) {
      case "shake":
        HSX.shakeKeys(L, t0, t0 + dur, params.amp || 10, params.style || "smooth", params.axis || "xy");
        break;
      case "slide":
        HSX_ANIM.slide(L, comp, params, t0, dur);
        break;
      case "zoom":
        HSX_ANIM.zoom(L, params, t0, dur, null);
        break;
      case "zoomEase":
        HSX_ANIM.zoom(L, params, t0, dur, params.ease);
        break;
      case "ramp":
        HSX_ANIM.ramp(L, params, t0, dur);
        break;
      case "pop":
        HSX_ANIM.pop(L, params, t0, dur);
        break;
      case "text":
        HSX_ANIM.text(L, comp, params.anim, t0, dur);
        break;
      case "mask":
        HSX_ANIM.mask(L, comp, params, t0, dur);
        break;
      case "transition":
        HSX_TRANSITION.run(L, comp, params.t, HSX.playhead(), dur);
        break;
      default:
        HSX_ANIM.zoom(L, params, t0, dur, null);
    }
  },

  slide: function (L, comp, p, t0, dur) {
    var pos = HSX.propPos(L);
    var base = HSX.valAt(pos, t0);
    var bx = (base && base.length >= 2) ? base[0] : comp.width / 2;
    var by = (base && base.length >= 2) ? base[1] : comp.height / 2;
    var from = p.from || 1; // 1 = animate INTO place; 0 = animate OUT
    var sx = bx + (p.dx || 0) * comp.width * from;
    var sy = by + (p.dy || 0) * comp.height * from;
    var ex = bx + (p.dx || 0) * comp.width * (1 - from);
    var ey = by + (p.dy || 0) * comp.height * (1 - from);

    HSX.clearKeys(pos);
    pos.setValueAtTime(t0, [sx, sy]);
    if (p.overshoot) {
      var ov = 1 + (p.overshoot - 1) * 0.5;
      pos.setValueAtTime(t0 + dur * 0.7, [bx + (ex - bx) * ov, by + (ey - by) * ov]);
    }
    pos.setValueAtTime(t0 + dur, [ex, ey]);
    try { pos.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e) { }
    if (p.ease === "expoOut") {
      try {
        for (var i = 1; i <= pos.numKeys; i++) {
          var v = (ex - sx) / Math.max(0.05, dur);
          pos.easeOut(i, new KeyframeEase(1, v * 2.2));
          pos.easeIn(i, new KeyframeEase(1, v * 0.1));
        }
      } catch (e2) { }
    }
    if (p.fade && p.fade > 0) {
      var op = HSX.propOpacity(L);
      HSX.clearKeys(op);
      op.setValueAtTime(t0, 100 - 100 * p.fade * from);
      op.setValueAtTime(t0 + dur, 100 - 100 * p.fade * (1 - from));
      try { op.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e3) { }
    }
  },

  zoom: function (L, p, t0, dur, ease) {
    var sc = HSX.propScale(L);
    var s0 = p.from == null ? 100 : p.from;
    var s1 = p.to == null ? 110 : p.to;
    HSX.clearKeys(sc);
    sc.setValueAtTime(t0, [s0, s0]);
    sc.setValueAtTime(t0 + dur, [s1, s1]);
    try {
      if (ease === "expoOut") {
        sc.interpolationType = KeyframeInterpolationType.BEZIER;
        sc.easeOut(1, new KeyframeEase(1, (s1 - s0) / Math.max(0.05, dur) * 3));
        sc.easeIn(2, new KeyframeEase(1, 0));
      } else {
        sc.interpolationType = KeyframeInterpolationType.AUTO_BEZIER;
      }
    } catch (e) { }
  },

  ramp: function (L, p, t0, dur) {
    var sc = HSX.propScale(L);
    var inTo = p.inTo || 114;
    var outTo = p.outTo == null ? (p.inTo ? 100 : 116) : 116;
    var inF = p.inFrac == null ? 0.3 : p.inFrac;
    var outF = p.outFrac == null ? 0.8 : p.outFrac;
    HSX.clearKeys(sc);
    sc.setValueAtTime(t0, [100, 100]);
    if (inTo !== 100) sc.setValueAtTime(t0 + dur * inF, [inTo, inTo]);
    sc.setValueAtTime(t0 + dur * Math.max(outF, inF), [inTo !== 100 ? inTo : 100, inTo !== 100 ? inTo : 100]);
    sc.setValueAtTime(t0 + dur, [outTo, outTo]);
    try { sc.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e) { }
  },

  pop: function (L, p, t0, dur) {
    var sc = HSX.propScale(L);
    var op = HSX.propOpacity(L);
    var base = HSX.valAt(op, t0);
    var b0 = typeof base === "number" ? base : 100;
    HSX.clearKeys(sc); HSX.clearKeys(op);
    sc.setValueAtTime(t0, [0, 0]);
    sc.setValueAtTime(t0 + dur * 0.6, [112, 112]);
    sc.setValueAtTime(t0 + dur, [100, 100]);
    op.setValueAtTime(t0, 0);
    op.setValueAtTime(t0 + dur * 0.3, b0);
    try {
      sc.interpolationType = KeyframeInterpolationType.AUTO_BEZIER;
      op.interpolationType = KeyframeInterpolationType.LINEAR;
    } catch (e) { }
  },

  /* ---------- text ---------- */
  textLayer: function (comp, text) {
    var sel = HSX.sel();
    if (sel.length) {
      for (var i = 0; i < sel.length; i++) {
        try { if (sel[i].property("ADBE Text Document")) return sel[i]; } catch (e) { }
      }
    }
    var L = comp.layers.addText(text || "Your text here");
    var c = HSX.center(comp);
    try {
      HSX.propPos(L).setValue([c[0], c[1]]);
      var tp = L.property("ADBE Text Properties");
      try { tp.property("ADBE Text Properties-0005").setValue("Arial"); } catch (e1) { }
      try { tp.property("ADBE Text Properties-0006").setValue(Math.round(comp.height * 0.09)); } catch (e2) { }
    } catch (e3) { }
    HSX.addFx(L, "ADBE Fill", "Fill", { "-0001": [1, 1, 1], "-0002": 100 });
    return L;
  },

  text: function (L, comp, anim, t0, dur) {
    var doc = L.property("ADBE Text Document");
    var full = "";
    try { full = String(doc.value); } catch (e) { }
    if (!full) full = "Your text here";
    var i;
    switch (anim) {
      case "pop":
        HSX_ANIM.pop(L, null, t0, dur);
        break;
      case "fade":
        var op = HSX.propOpacity(L);
        HSX.clearKeys(op);
        op.setValueAtTime(t0, 0);
        op.setValueAtTime(t0 + dur, 100);
        try { op.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e1) { }
        break;
      case "type": {
        var n = Math.min(full.length, 40);
        for (i = 0; i <= n; i++) {
          doc.setValueAtTime(t0 + dur * (i / n), full.substring(0, i));
        }
        break;
      }
      case "glow": {
        var glow = HSX.addFx(L, "ADBE Glow", "Glow", { "-0001": 18, "-0002": 0.8, "-0003": 40 });
        var gI = glow.property("-0002");
        gI.setValueAtTime(t0, 0.2);
        gI.setValueAtTime(t0 + dur * 0.5, 1.4);
        gI.setValueAtTime(t0 + dur, 0.6);
        try { gI.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e2) { }
        break;
      }
      case "track": {
        var tp = L.property("ADBE Text Properties");
        var track = tp.property("ADBE Text Properties-0017");
        HSX.clearKeys(track);
        track.setValueAtTime(t0, 220);
        track.setValueAtTime(t0 + dur, 0);
        try { track.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e3) { }
        var op2 = HSX.propOpacity(L);
        HSX.clearKeys(op2);
        op2.setValueAtTime(t0, 0);
        op2.setValueAtTime(t0 + dur * 0.4, 100);
        break;
      }
      case "slide": {
        var pos = HSX.propPos(L);
        var base = HSX.valAt(pos, t0);
        var bx = (base && base.length >= 2) ? base[0] : comp.width / 2;
        var by = (base && base.length >= 2) ? base[1] : comp.height / 2;
        HSX.clearKeys(pos);
        pos.setValueAtTime(t0, [bx, by + comp.height * 0.12]);
        pos.setValueAtTime(t0 + dur, [bx, by]);
        try { pos.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e4) { }
        var op3 = HSX.propOpacity(L);
        HSX.clearKeys(op3);
        op3.setValueAtTime(t0, 0);
        op3.setValueAtTime(t0 + dur * 0.6, 100);
        break;
      }
      case "bounce": {
        var sc = HSX.propScale(L);
        HSX.clearKeys(sc);
        sc.setValueAtTime(t0, [0, 0]);
        sc.setValueAtTime(t0 + dur * 0.55, [115, 115]);
        sc.setValueAtTime(t0 + dur * 0.8, [92, 92]);
        sc.setValueAtTime(t0 + dur, [100, 100]);
        try { sc.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e5) { }
        break;
      }
      case "glitch": {
        var pos2 = HSX.propPos(L);
        var base2 = HSX.valAt(pos2, t0);
        var bx2 = (base2 && base2.length >= 2) ? base2[0] : comp.width / 2;
        var by2 = (base2 && base2.length >= 2) ? base2[1] : comp.height / 2;
        HSX.clearKeys(pos2);
        var offs = [[0, 0], [8, -4], [-7, 3], [4, 5], [-3, -2], [0, 0]];
        for (i = 0; i < offs.length; i++) {
          pos2.setValueAtTime(t0 + dur * (i / (offs.length - 1)), [bx2 + offs[i][0], by2 + offs[i][1]]);
        }
        try { pos2.interpolationType = KeyframeInterpolationType.ROBOTIC; } catch (e6) { }
        var op4 = HSX.propOpacity(L);
        HSX.clearKeys(op4);
        var flick = [0, 100, 30, 100, 10, 100];
        for (i = 0; i < flick.length; i++) {
          op4.setValueAtTime(t0 + dur * (i / (flick.length - 1)), flick[i]);
        }
        try { pos2.interpolationType = KeyframeInterpolationType.ROBOTIC; op4.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e7) { }
        break;
      }
      case "strobe": {
        var op5 = HSX.propOpacity(L);
        HSX.clearKeys(op5);
        var st = [0, 100, 0, 100, 0, 100, 0, 100];
        for (i = 0; i < st.length; i++) {
          op5.setValueAtTime(t0 + dur * (i / (st.length - 1)), st[i]);
        }
        try { op5.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e8) { }
        break;
      }
      case "wipe": {
        var ramp = HSX.addFx(L, "ADBE Ramp", "HSX Reveal", null);
        var st = ramp.property("-0001");
        var en = ramp.property("-0002");
        st.setValueAtTime(t0, [-comp.width * 0.1, comp.height / 2]);
        st.setValueAtTime(t0 + dur, [comp.width * 0.15, comp.height / 2]);
        en.setValueAtTime(t0, [-comp.width * 0.05, comp.height / 2]);
        en.setValueAtTime(t0 + dur, [comp.width * 0.85, comp.height / 2]);
        break;
      }
    }
  },

  /* ---------- masks ---------- */
  addMask: function (L, cx, cy, w, h, feather) {
    var ml = L.masks;
    var m = ml.addProperty("ADBE Mask Parade");
    var path = new Path();
    var xs = [cx - w / 2, cx + w / 2, cx + w / 2, cx - w / 2];
    var ys = [cy - h / 2, cy - h / 2, cy + h / 2, cy + h / 2];
    var i;
    for (i = 0; i < 4; i++) path.addPoint([xs[i], ys[i]], null, null);
    path.closed = true;
    var shp = new Shape();
    shp.paths = [path];
    m.property("ADBE Mask Parade-0003").setValue(shp);
    try { m.property("ADBE Mask Parade-0005").setValue(feather || 40); } catch (e) { }
    return m;
  },

  mask: function (L, comp, p, t0, dur) {
    var cx = (p.cx == null ? 0.5 : p.cx) * comp.width;
    var cy = (p.cy == null ? 0.5 : p.cy) * comp.height;
    var big = Math.max(comp.width, comp.height) * (p.to || 2.2);
    try {
      var m = HSX_ANIM.addMask(L, cx, cy, 12, 12, p.wide ? 2 : 80);
      var exp = m.property("ADBE Mask Parade-0004");
      exp.setValueAtTime(t0, (p.from || 0) * big * 0.1);
      exp.setValueAtTime(t0 + dur, big);
      try { exp.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e1) { }
    } catch (e2) {
      // fallback: linear ramp bar wipe
      var ramp = HSX.addFx(L, "ADBE Ramp", "HSX Reveal", null);
      var st = ramp.property("-0001");
      var en = ramp.property("-0002");
      st.setValueAtTime(t0, [-comp.width * 0.2, comp.height / 2]);
      st.setValueAtTime(t0 + dur, [comp.width * 0.2, comp.height / 2]);
      en.setValueAtTime(t0, [-comp.width * 0.05, comp.height / 2]);
      en.setValueAtTime(t0 + dur, [comp.width * 0.9, comp.height / 2]);
    }
  }
};

/* ------------------------------------------------ textures */
HSX_TEXTURE = {
  apply: function (comp, recipe) {
    var name = HSX_LAYER_PREFIX + " " + recipe;
    var i, l;
    for (i = 1; i <= comp.numLayers; i++) {
      l = comp.layer(i);
      if (l.name === name) { l.removeFromStack(); continue; }
    }
    var dur = Math.max(1, comp.outPoint || 1);
    var L, i2;
    switch (recipe) {
      case "grain":
        L = HSX.adjustment(comp, name, dur * 1000);
        var fn = HSX.addFx(L, "ADBE Fractal Noise", "Grain", {
          "-0002": 160, "-0003": -65, "-0004": 0.4, "-0005": 12
        });
        try {
          fn.property("-0006").setValue([comp.width / 2, comp.height / 2]);
        } catch (e) { }
        try { L.blendMode = "OVERLAY"; } catch (e1) { }
        try { HSX.propOpacity(L).setValue(45); } catch (e2) { }
        break;
      case "dust":
        L = HSX.solid(comp, [0, 0, 0], name, comp.width, comp.height, dur * 1000);
        HSX.addFx(L, "ADBE Fractal Noise", "Dust", {
          "-0001": 5, "-0002": 220, "-0003": -88, "-0004": 0.08, "-0005": 60
        });
        try { L.blendMode = "ADD"; } catch (e3) { }
        try { HSX.propScale(L).setValue([150, 150]); } catch (e4) { }
        break;
      case "paper":
        L = HSX.solid(comp, [0.5, 0.5, 0.5], name, comp.width, comp.height, dur * 1000);
        HSX.addFx(L, "ADBE Fractal Noise", "Paper", {
          "-0001": 1, "-0002": 130, "-0003": 0, "-0004": 0, "-0005": 40
        });
        try { L.blendMode = "SOFTLIGHT"; } catch (e5) { }
        try { HSX.propOpacity(L).setValue(28); } catch (e6) { }
        break;
      case "vignette":
        L = HSX.adjustment(comp, name, dur * 1000);
        var vg = HSX.addFx(L, "ADBE Vignette", "Vignette", {
          "-0002": 2.2, "-0004": 95
        });
        try { vg.property("-0005").setValue(HSX.center(comp)); } catch (e7) { }
        break;
    }
    try { L.moveToEndOfStack(1); } catch (e8) { }
    return { msg: recipe + " applied" };
  }
};

/* ------------------------------------------------ color looks */
HSX_LOOK = {
  apply: function (layer, lookId) {
    var looks = {
      clean: [
        ["ADBE Exposure", { "-0001": 0.35 }],
        ["ADBE HUE SATURATION-0001", { "-0002": 8 }],
        ["ADBE Levelsss", { "-0001": 12, "-0002": 235 }]
      ],
      moody: [
        ["ADBE Tint", { "-0001": [0.05, 0.12, 0.13], "-0002": [0.75, 0.82, 0.85] }],
        ["ADBE Levelsss", { "-0001": 30, "-0003": 8 }],
        ["ADBE HUE SATURATION-0001", { "-0002": -12 }]
      ],
      vintage: [
        ["ADBE Tint", { "-0001": [0.25, 0.16, 0.05], "-0002": [0.95, 0.82, 0.6] }],
        ["ADBE Levelsss", { "-0001": 25, "-0002": 220, "-0003": 10 }],
        ["ADBE Fractal Noise", { "-0002": 100, "-0003": -60, "-0004": 0.3 }],
        ["ADBE Vignette", { "-0002": 1.8, "-0004": 80 }]
      ],
      teo: [
        ["ADBE Tint", { "-0001": [0.03, 0.14, 0.16], "-0002": [0.9, 0.55, 0.3] }],
        ["ADBE Levelsss", { "-0001": 15, "-0002": 240 }],
        ["ADBE HUE SATURATION-0001", { "-0002": 14 }]
      ],
      bw: [
        ["ADBE Monochrome", { "-0001": 50 }],
        ["ADBE Levelsss", { "-0001": 8, "-0002": 245 }]
      ],
      pastel: [
        ["ADBE HUE SATURATION-0001", { "-0002": -22 }],
        ["ADBE Levelsss", { "-0001": 45, "-0003": 18 }],
        ["ADBE Exposure", { "-0001": 0.4 }]
      ],
      punch: [
        ["ADBE HUE SATURATION-0001", { "-0002": 22 }],
        ["ADBE Levelsss", { "-0001": 10, "-0002": 242 }],
        ["ADBE Exposure", { "-0001": 0.5 }]
      ],
      cold: [
        ["ADBE Tint", { "-0001": [0, 0.06, 0.18], "-0002": [0.7, 0.82, 1] }],
        ["ADBE HUE SATURATION-0001", { "-0002": -6 }]
      ]
    };
    var steps = looks[lookId];
    if (!steps) return;
    var i;
    for (i = 0; i < steps.length; i++) {
      try { HSX.addFx(layer, steps[i][0], null, steps[i][1]); } catch (e) { }
    }
  }
};

/* ------------------------------------------------ other ops */
HSX_OTHER = {
  apply: function (comp, sel, params) {
    var op = params.op;
    var i;
    switch (op) {
      case "dup":
        if (!sel.length) return { error: "Select layers to duplicate." };
        var n = params.n || 3, clones = 0;
        for (i = 0; i < sel.length; i++) {
          for (var k = 0; k < n; k++) {
            try {
              var c = sel[i].duplicate();
              var pos = HSX.propPos(c);
              var v = HSX.valAt(pos, HSX.playhead());
              var nx = (v && v.length >= 2) ? v[0] : comp.width / 2;
              var ny = (v && v.length >= 2) ? v[1] : comp.height / 2;
              pos.setValue([nx, ny - (k + 1) * 26]);
              clones++;
            } catch (e) { }
          }
        }
        return { msg: clones + " clones created" };
      case "freeze":
        if (!sel.length) return { error: "Select layers to freeze." };
        var fz = 0;
        for (i = 0; i < sel.length; i++) {
          try { sel[i].freezeFrame(); fz++; } catch (e1) { }
        }
        return fz ? { msg: fz + " layer(s) frozen" } : { error: "freezeFrame() not supported on this layer type." };
      case "solid":
        HSX.solid(comp, [0, 0, 0], HSX_LAYER_PREFIX + " Solid", comp.width, comp.height, comp.duration * 1000);
        return { msg: "solid added" };
      case "null":
        var nl = comp.layers.addNull(HSX_LAYER_PREFIX + " Null", comp.width, comp.height, comp.duration * 1000);
        try { HSX.propPos(nl).setValue(HSX.center(comp)); } catch (e2) { }
        return { msg: "null added" };
      case "adjust":
        HSX.adjustment(comp, HSX_LAYER_PREFIX + " Adjust", comp.duration * 1000);
        return { msg: "adjustment layer added" };
    }
    return { error: "Unknown op: " + op };
  }
};
