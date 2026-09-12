/* ============================================================
   transitions.js — one-click playhead transitions (ES3)
   ============================================================ */
HSX_CMD.transition = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var sel = HSX.sel();
  if (!sel.length) return { error: "Select the layer(s) around your cut first." };
  var t = HSX.playhead();
  var id = args.id || "flash";
  var D = HSX_TRANSITION.DUR[id] || 0.5;
  var t0 = t - D / 2, t1 = t + D / 2;
  if (t0 < 0) t0 = 0;
  if (t1 > comp.outPoint) t1 = comp.outPoint;
  var fn = HSX_TRANSITION.FN[id];
  if (!fn) return { error: "Unknown transition: " + id };
  try {
    var r = fn(comp, sel, t0, t1);
    return r || { msg: id + " applied" };
  } catch (e) {
    return { error: id + ": " + e.toString() };
  }
};

HSX_TRANSITION = {
  DUR: { flash: 0.35, shakeflash: 0.55, zoomcut: 0.45, parallel: 0.5, whip: 0.4, warp: 0.55, glitch: 0.55, pixel: 0.6, iris: 0.7, hyper: 1.5 },

  first2: function (sel) {
    var a = sel[0], b = null;
    for (var i = 1; i < sel.length; i++) { b = sel[i]; break; }
    return b ? [a, b] : [a, a];
  },

  FN: {
    flash: function (comp, sel, t0, t1) {
      HSX.flash(comp, t0, t1, 100);
      return { msg: "flash cut" };
    },

    shakeflash: function (comp, sel, t0, t1) {
      var i;
      for (i = 0; i < sel.length; i++) {
        HSX.shakeKeys(sel[i], t0, t1, 11, "hard", "xy");
      }
      HSX.flash(comp, t0, t1, 85);
      return { msg: "shake flash" };
    },

    zoomcut: function (comp, sel, t0, t1) {
      var pair = HSX_TRANSITION.first2(sel);
      var a = pair[0], b = pair[1];
      if (a === b) {
        // single layer: punch in
        HSX_ANIM.zoom(a, { from: 100, to: 118 }, t0, t1 - t0, null);
        return { msg: "punch in (select 2 layers for a full cut)" };
      }
      var sca = HSX.propScale(a), scb = HSX.propScale(b);
      var opa = HSX.propOpacity(a), opb = HSX.propOpacity(b);
      HSX.clearKeys(sca); HSX.clearKeys(scb);
      HSX.clearKeys(opa); HSX.clearKeys(opb);
      sca.setValueAtTime(t0, [100, 100]);
      sca.setValueAtTime(t1, [122, 122]);
      scb.setValueAtTime(t0, [78, 78]);
      scb.setValueAtTime(t1, [100, 100]);
      opa.setValueAtTime(t0, 100);
      opa.setValueAtTime(t1, 0);
      opb.setValueAtTime(t0, 0);
      opb.setValueAtTime(t1, 100);
      try {
        sca.interpolationType = KeyframeInterpolationType.LINEAR;
        scb.interpolationType = KeyframeInterpolationType.LINEAR;
        opa.interpolationType = KeyframeInterpolationType.LINEAR;
        opb.interpolationType = KeyframeInterpolationType.LINEAR;
      } catch (e) { }
      return { msg: "zoom into edit" };
    },

    parallel: function (comp, sel, t0, t1) {
      var pair = HSX_TRANSITION.first2(sel);
      var a = pair[0], b = pair[1];
      var W = comp.width, H = comp.height;
      var pa = HSX.propPos(a), pb = HSX.propPos(b);
      var ba = HSX.valAt(pa, t0), bb = HSX.valAt(pb, t0);
      var ax = (ba && ba.length >= 2) ? ba[0] : W / 2, ay = (ba && ba.length >= 2) ? ba[1] : H / 2;
      var bx = (bb && bb.length >= 2) ? bb[0] : W / 2, by = (bb && bb.length >= 2) ? bb[1] : H / 2;
      HSX.clearKeys(pa); HSX.clearKeys(pb);
      if (a === b) {
        pa.setValueAtTime(t0, [ax + W * 0.4, ay]);
        pa.setValueAtTime(t1, [ax - W * 0.05, ay]);
      } else {
        pa.setValueAtTime(t0, [ax, ay]);
        pa.setValueAtTime(t1, [ax - W * 0.42, ay]);
        pb.setValueAtTime(t0, [bx + W * 0.42, by]);
        pb.setValueAtTime(t1, [bx, by]);
        var oa = HSX.propOpacity(a), ob = HSX.propOpacity(b);
        HSX.clearKeys(oa); HSX.clearKeys(ob);
        oa.setValueAtTime(t0, 100); oa.setValueAtTime(t1, 0);
        ob.setValueAtTime(t0, 0); ob.setValueAtTime(t1, 100);
      }
      try {
        pa.interpolationType = KeyframeInterpolationType.AUTO_BEZIER;
        pb.interpolationType = KeyframeInterpolationType.AUTO_BEZIER;
      } catch (e) { }
      return { msg: "smooth parallel" };
    },

    whip: function (comp, sel, t0, t1) {
      var W = comp.width;
      var i;
      for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        var pos = HSX.propPos(L);
        var base = HSX.valAt(pos, t0);
        var x = (base && base.length >= 2) ? base[0] : comp.width / 2;
        var y = (base && base.length >= 2) ? base[1] : comp.height / 2;
        HSX.clearKeys(pos);
        pos.setValueAtTime(t0, [x + W * 0.5, y]);
        pos.setValueAtTime(t1, [x - W * 0.5, y]);
        try { pos.interpolationType = KeyframeInterpolationType.AUTO_BEZIER; } catch (e) { }
        try { L.motionBlurEnabled = true; } catch (e2) { }
      }
      return { msg: "whip pan" };
    },

    warp: function (comp, sel, t0, t1) {
      var mid = (t0 + t1) / 2;
      var i;
      for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        var w = HSX.addFx(L, "ADBE Turbulent Displace", "HSX Warp", { "-0002": 46 });
        var d = w.property("-0001");
        d.setValueAtTime(t0, 0);
        d.setValueAtTime(mid, 44);
        d.setValueAtTime(t1, 0);
        try { d.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e) { }
      }
      HSX.flash(comp, mid - 0.06, mid + 0.1, 60);
      return { msg: "warp flash" };
    },

    glitch: function (comp, sel, t0, t1) {
      var i, j;
      var n = Math.max(2, sel.length - 1);
      for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        // RGB split pulse
        var co = HSX.addFx(L, "ADBE Channel Offset", "HSX RGB Split", { "-0001": 7 });
        var rO = co.property("-0002");
        var bO = co.property("-0004");
        var r = [[0, 0], [9, 0], [-6, 2], [4, -2], [0, 0]];
        for (j = 0; j < r.length; j++) {
          var t = t0 + (t1 - t0) * (j / (r.length - 1));
          rO.setValueAtTime(t, [r[j][0], r[j][1]]);
          bO.setValueAtTime(t, [-r[j][0], -r[j][1]]);
        }
        try { rO.interpolationType = KeyframeInterpolationType.ROBOTIC; bO.interpolationType = KeyframeInterpolationType.ROBOTIC; } catch (e) { }
        // position jolt
        HSX.shakeKeys(L, t0, t1, 7, "hard", "xy");
        // opacity flicker
        var op = HSX.propOpacity(L);
        var base = HSX.valAt(op, t1);
        var bv = typeof base === "number" ? base : 100;
        var flick = [100, 25, 100, 10, 100];
        for (j = 0; j < flick.length; j++) {
          op.setValueAtTime(t0 + (t1 - t0) * (j / (flick.length - 1)), flick[j] === 100 ? bv : flick[j]);
        }
        try { op.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e2) { }
      }
      return { msg: "glitch + shake" };
    },

    pixel: function (comp, sel, t0, t1) {
      var mid = (t0 + t1) / 2;
      var i;
      for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        var px = HSX.addFx(L, "ADBE Pixelate", "HSX Pixelate", null);
        var s = px.property("-0001");
        s.setValueAtTime(t0, 4);
        s.setValueAtTime(mid, 54);
        s.setValueAtTime(t1, 4);
        try { s.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e) { }
        try { px.property("-0002").setValue(HSX.center(comp)); } catch (e2) { }
      }
      return { msg: "pixel dissolve" };
    },

    iris: function (comp, sel, t0, t1) {
      var mid = (t0 + t1) / 2;
      var c = HSX.center(comp);
      var big = Math.max(comp.width, comp.height) * 1.4;
      var solid = HSX.solid(comp, [0, 0, 0], HSX_LAYER_PREFIX + " Iris", comp.width, comp.height, (t1 - t0) * 1000);
      try { solid.inPoint = t0; solid.outPoint = t1; solid.startTime = t0; } catch (e) { }
      try {
        var m = HSX_ANIM.addMask(solid, c[0], c[1], 10, 10, 25);
        m.property("ADBE Mask Parade-0002").setValue(MaskMode.INTERSECT);
        var exp = m.property("ADBE Mask Parade-0004");
        exp.setValueAtTime(t0, big);
        exp.setValueAtTime(mid, 2);
        exp.setValueAtTime(t1, big);
        try { exp.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e1) { }
      } catch (e2) {
        // fallback: quick white-out
        HSX.flash(comp, mid - 0.12, mid + 0.12, 100);
      }
      return { msg: "iris cut" };
    },

    hyper: function (comp, sel, t0, t1) {
      var ok = 0, i;
      for (i = 0; i < sel.length; i++) {
        var L = sel[i];
        var expr =
          "var T0 = " + t0.toFixed(4) + ";\n" +
          "var T1 = " + t1.toFixed(4) + ";\n" +
          "var S = 5;\n" +
          "var t = time, o = 0;\n" +
          "if (t >= T0) o = Math.min((t - T0) * (S - 1), (T1 - T0) * (S - 1));\n" +
          "time + o;";
        try {
          L.hasTimeRemap = true;
        } catch (e) { }
        var tr = null;
        try { tr = L.property("ADBE Time Stretch"); } catch (e1) { }
        if (tr && tr.property("ADBE Time Stretch-0001")) {
          try {
            tr.property("ADBE Time Stretch-0001").expression = expr;
            ok++;
          } catch (e2) { }
        }
      }
      if (!ok) {
        // fallback: scale burst
        for (i = 0; i < sel.length; i++) {
          HSX_ANIM.ramp(sel[i], { inTo: 118, inFrac: 0.45, outFrac: 0.8, outTo: 100 }, t0, t1 - t0);
        }
        return { msg: "time remap unavailable — applied scale burst instead" };
      }
      return { msg: "hyperlapse speed ramp (×5)" };
    }
  }
};
