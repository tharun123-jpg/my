/* ============================================================
   graph.js — read / apply easing on real keyframes (ES3)
   ============================================================ */

function HSX_targetProp() {
  var sel = HSX.sel();
  if (!sel.length) return null;
  var L = sel[0];
  var i, p;

  // 1) explicitly selected properties
  try {
    if (L.selectedProperties && L.selectedProperties.length) {
      for (i = 0; i < L.selectedProperties.length; i++) {
        p = L.selectedProperties[i];
        if (p.numKeys >= 2) return p;
      }
    }
  } catch (e) { }

  // 2) explicitly selected keyframes -> first animated property
  // 3) fall back to first animated transform property
  var cands = [];
  try {
    var tg = HSX.tg(L);
    var names = ["ADBE Position", "ADBE Scale", "ADBE Opacity", "ADBE Rotate"];
    for (i = 0; i < names.length; i++) {
      try {
        var q = tg.property(names[i]);
        if (q && q.numKeys >= 2) cands.push(q);
      } catch (e1) { }
    }
    if (cands.length) return cands[0];
  } catch (e2) { }

  // 4) scan effects
  try {
    var parade = HSX.fxParade(L);
    for (i = 1; i <= parade.numProperties; i++) {
      var eff = parade.property(i);
      for (var j = 1; j <= eff.numProperties; j++) {
        var sp = eff.property(j);
        if (sp.numKeys >= 2) return sp;
      }
    }
  } catch (e3) { }
  return null;
}

HSX_CMD.read_ease = function (args) {
  var prop = HSX_targetProp();
  if (!prop) return { error: "No animated keyframes found on the selection. Select a layer with 2+ keyframes (or the keyframes themselves)." };
  var keys = [];
  var i;
  for (i = 1; i <= prop.numKeys; i++) {
    try {
      var t = prop.keyTime(i);
      var v = HSX.scalar(prop.keyValue(i));
      keys.push({ t: t, v: v });
    } catch (e) { }
  }
  return { keys: keys, src: prop.name };
};

HSX_CMD.apply_ease = function (args) {
  var prop = HSX_targetProp();
  if (!prop) return { error: "No animated keyframes found on the selection." };
  var kf = args.kf;
  if (!kf || kf.length < 2) return { error: "No ease curve data." };

  var i;
  var t0 = prop.keyTime(1);
  var tN = prop.keyTime(prop.numKeys);
  var kv0 = prop.keyValue(1);
  var kvN = prop.keyValue(prop.numKeys);
  var isVec = (typeof kv0 === "object");
  var ref = (isVec && typeof kvN === "object") ? kvN : null;

  HSX.clearKeys(prop);
  for (i = 0; i < kf.length; i++) {
    var t = t0 + (tN - t0) * kf[i].t;
    var f = kf[i].v;
    var val;
    if (isVec && ref && ref.length) {
      // animate axis 0 along the curve, hold other axes from the last key
      val = [];
      for (var j = 0; j < ref.length; j++) {
        if (j === 0) val.push(HSX.scalar(kv0) + (HSX.scalar(kvN) - HSX.scalar(kv0)) * f);
        else val.push(ref[j]);
      }
    } else {
      val = HSX.scalar(kv0) + (HSX.scalar(kvN) - HSX.scalar(kv0)) * f;
    }
    prop.setValueAtTime(t, val);
  }
  try { prop.interpolationType = KeyframeInterpolationType.LINEAR; } catch (e) { }
  return { keys: kf.length, msg: "ease applied" };
};
