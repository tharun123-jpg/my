/* ============================================================
   snapshots.js — session-scoped undo points (ES3)
   In-memory only: lives for the AE session, no disk writes.
   Captures per layer: geometry (in/out/enabled) + keyframes
   for position / scale / rotation / opacity.
   ============================================================ */

HSX.snaps = [];      // stored snapshots
HSX.snapSeq = 0;     // id counter

function hsxSnapKeys(prop) {
  // sample up to 64 keys evenly, always keep first & last
  var out = [];
  var n = prop.numKeys;
  if (n <= 0) return out;
  var step = 1;
  var MAXK = 64;
  if (n > MAXK) step = Math.ceil(n / MAXK);
  var i, k, t, v;
  for (i = 0; i < n; i += step) {
    k = i + 1;
    try {
      t = prop.keyTime(k);
      v = prop.valueAtTime(t);
    } catch (e) { continue; }
    if (Array(v) === v) {
      var copy = [];
      for (var j = 0; j < v.length; j++) copy.push(v[j]);
      out.push({ t: t, v: copy });
    } else {
      out.push({ t: t, v: v });
    }
  }
  return out;
}

function hsxSnapProp(tg, mn) {
  var p = null;
  try { p = tg.property(mn); } catch (e) { return null; }
  if (!p) return null;
  var rec = { k: hsxSnapKeys(p) };
  if (p.numKeys === 0) {
    try {
      var v = p.value;
      if (Array(v) === v) {
        var c = [];
        for (var j = 0; j < v.length; j++) c.push(v[j]);
        rec.v0 = c;
      } else {
        rec.v0 = v;
      }
    } catch (e2) { }
  }
  return rec;
}

function hsxRestoreProp(tg, mn, rec) {
  if (!rec) return;
  var p = null;
  try { p = tg.property(mn); } catch (e) { return; }
  if (!p) return;
  try {
    if (rec.k && rec.k.length) {
      HSX.clearKeys(p);
      for (var i = 0; i < rec.k.length; i++) {
        p.setValueAtTime(rec.k[i].t, rec.k[i].v);
      }
    } else if (rec.v0 !== undefined) {
      HSX.clearKeys(p);
      p.setValue(rec.v0);
    }
  } catch (e2) { /* prop type mismatch (2d/3d) — skip */ }
}

HSX_CMD.snapshot_save = function (args) {
  var comp = HSX.requireComp();
  args = args || {};
  var name = (typeof args.name === "string" && args.name) ? args.name : "Snapshot";
  if (name.length > 48) name = name.substring(0, 48);
  var scope = args.scope === "comp" ? "comp" : "sel";

  var layers;
  if (scope === "comp") layers = comp.layers;
  else layers = HSX.requireSel(1);

  var recLayers = [];
  var totalKeys = 0;
  var i, l, tg;
  var n = layers.length;
  if (scope === "comp" && n > 60) n = 60; // sanity cap

  for (i = 0; i < n; i++) {
    l = layers[i];
    if (!HSX.isLiveLayer(l)) continue;
    // occurrence ordinal for same-name disambiguation
    var ordinal = 0, j;
    for (j = 0; j < i; j++) { if (layers[j] && layers[j].name === l.name) ordinal++; }
    try { tg = HSX.tg(l); } catch (e) { continue; }
    var rec = {
      name: l.name,
      ord: ordinal,
      in: l.inPoint,
      out: l.outPoint,
      en: l.enabled
    };
    rec.pos = hsxSnapProp(tg, "ADBE Position");
    rec.scale = hsxSnapProp(tg, "ADBE Scale");
    rec.rot = hsxSnapProp(tg, "ADBE Rotate");
    rec.op = hsxSnapProp(tg, "ADBE Opacity");
    if (rec.pos) totalKeys += rec.pos.k.length;
    if (rec.scale) totalKeys += rec.scale.k.length;
    if (rec.rot) totalKeys += rec.rot.k.length;
    if (rec.op) totalKeys += rec.op.k.length;
    recLayers.push(rec);
  }

  if (!recLayers.length) throw new Error("Nothing to snapshot — no live layers in scope.");

  HSX.snapSeq++;
  var snap = {
    id: HSX.snapSeq,
    name: name,
    when: HSX.timecode(comp.time || 0, comp.frameRate || 30),
    scope: scope,
    layers: recLayers.length,
    keys: totalKeys,
    data: recLayers
  };
  HSX.snaps.push(snap);
  if (HSX.snaps.length > 12) HSX.snaps.shift(); // session cap

  return { ok: true, id: snap.id, name: name, layers: recLayers.length, keys: totalKeys, total: HSX.snaps.length };
};

HSX_CMD.snapshot_list = function () {
  var out = [];
  for (var i = 0; i < HSX.snaps.length; i++) {
    var s = HSX.snaps[i];
    out.push({ id: s.id, name: s.name, when: s.when, scope: s.scope, layers: s.layers, keys: s.keys });
  }
  return { ok: true, snaps: out };
};

HSX_CMD.snapshot_restore = function (args) {
  args = args || {};
  var comp = HSX.requireComp();
  var snap = null;
  for (var i = 0; i < HSX.snaps.length; i++) {
    if ((typeof args.id === "number" && HSX.snaps[i].id === args.id) ||
        (typeof args.name === "string" && HSX.snaps[i].name === args.name)) {
      snap = HSX.snaps[i];
      break;
    }
  }
  if (!snap) throw new Error("Snapshot not found in this session.");

  comp.beginUndoGroup("HSX Restore: " + snap.name);
  try {
    var restored = 0, missing = 0, j, l, rec, tg;
    for (i = 0; i < snap.data.length; i++) {
      rec = snap.data[i];
      l = null;
      var seen = -1;
      for (j = 1; j <= comp.numLayers; j++) {
        if (comp.layer(j).name === rec.name) {
          seen++;
          if (seen === rec.ord) { l = comp.layer(j); break; }
        }
      }
      if (!l) { missing++; continue; }
      try { tg = HSX.tg(l); } catch (e) { missing++; continue; }
      try {
        l.enabled = rec.en;
        l.inPoint = rec.in;
        l.outPoint = rec.out;
      } catch (e2) { }
      hsxRestoreProp(tg, "ADBE Position", rec.pos);
      hsxRestoreProp(tg, "ADBE Scale", rec.scale);
      hsxRestoreProp(tg, "ADBE Rotate", rec.rot);
      hsxRestoreProp(tg, "ADBE Opacity", rec.op);
      restored++;
    }
    comp.endUndoGroup();
    return { ok: true, restored: restored, missing: missing };
  } catch (e) {
    try { comp.endUndoGroup(); } catch (e2) { }
    throw e;
  }
};

HSX_CMD.snapshot_delete = function (args) {
  args = args || {};
  var idx = -1;
  for (var i = 0; i < HSX.snaps.length; i++) {
    if (HSX.snaps[i].id === args.id) { idx = i; break; }
  }
  if (idx < 0) throw new Error("Snapshot not found in this session.");
  HSX.snaps.splice(idx, 1);
  return { ok: true, remaining: HSX.snaps.length };
};
