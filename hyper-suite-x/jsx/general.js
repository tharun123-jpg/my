/* ============================================================
   general.js — arrange, audio, cuts (ES3)
   ============================================================ */
HSX_CMD.general = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var op = args.op;
  var sel = HSX.sel();
  var i;

  function bounds(l) {
    var pos = HSX.valAt(HSX.propPos(l), 0);
    var x = (pos && pos.length >= 2) ? pos[0] : comp.width / 2;
    var y = (pos && pos.length >= 2) ? pos[1] : comp.height / 2;
    return [x, y];
  }

  function allLayers() {
    var arr = [];
    for (var j = 1; j <= comp.numLayers; j++) arr.push(comp.layer(j));
    return arr;
  }

  switch (op) {
    /* ---------- arrange ---------- */
    case "alignL":
    case "alignR":
    case "alignT":
    case "alignB":
    case "alignC":
    case "alignM": {
      if (!sel.length) return { error: "Select two or more layers." };
      var j, min = 1e12, max = -1e12, sum = 0;
      for (j = 0; j < sel.length; j++) {
        var p = bounds(sel[j]);
        if (op === "alignT" || op === "alignM" || op === "alignB" || op === "distV") {
          min = Math.min(min, p[1]); max = Math.max(max, p[1]); sum += p[1];
        } else {
          min = Math.min(min, p[0]); max = Math.max(max, p[0]); sum += p[0];
        }
      }
      var center = sum / sel.length;
      for (j = 0; j < sel.length; j++) {
        var L = sel[j];
        var pos = HSX.propPos(L);
        var v = HSX.valAt(pos, 0);
        var x = (v && v.length >= 2) ? v[0] : comp.width / 2;
        var y = (v && v.length >= 2) ? v[1] : comp.height / 2;
        if (op === "alignL") x = min;
        if (op === "alignR") x = max;
        if (op === "alignT") y = min;
        if (op === "alignB") y = max;
        if (op === "alignC") x = center;
        if (op === "alignM") y = center;
        pos.setValue([x, y]);
      }
      return { msg: "aligned" };
    }

    case "distH":
    case "distV": {
      if (sel.length < 3) return { error: "Select three or more layers to distribute." };
      var axis = op === "distV" ? 1 : 0;
      var arr = [];
      for (i = 0; i < sel.length; i++) arr.push(sel[i]);
      arr.sort(function (a, b) {
        return bounds(a)[axis] - bounds(b)[axis];
      });
      var first = bounds(arr[0])[axis], last = bounds(arr[arr.length - 1])[axis];
      var step = (last - first) / (arr.length - 1);
      for (i = 0; i < arr.length; i++) {
        var L2 = arr[i];
        var pos2 = HSX.propPos(L2);
        var v2 = HSX.valAt(pos2, 0);
        var x2 = (v2 && v2.length >= 2) ? v2[0] : comp.width / 2;
        var y2 = (v2 && v2.length >= 2) ? v2[1] : comp.height / 2;
        if (axis === 0) x2 = first + step * i; else y2 = first + step * i;
        pos2.setValue([x2, y2]);
      }
      return { msg: "distributed" };
    }

    case "fitComp":
    case "resize_fit": {
      if (!sel.length) return { error: "Select layers to resize." };
      var c = HSX.center(comp);
      var done = 0;
      for (i = 0; i < sel.length; i++) {
        var LL = sel[i];
        var sw = comp.width, sh = comp.height;
        try {
          if (LL.source && LL.source.width) { sw = LL.source.width; sh = LL.source.height; }
          else if (LL.sourceRect) { sw = LL.sourceRect[2]; sh = LL.sourceRect[3]; }
        } catch (e) { }
        var s = Math.min(comp.width / sw, comp.height / sh) * 100;
        if (s > 0.05) {
          try {
            HSX.propScale(LL).setValue([s, s]);
            HSX.propPos(LL).setValue(c);
            done++;
          } catch (e1) { }
        }
      }
      return { msg: done + " layer(s) fitted to comp" };
    }

    case "flipH":
    case "flipV": {
      if (!sel.length) return { error: "Select layers to flip." };
      for (i = 0; i < sel.length; i++) {
        var sc = HSX.propScale(sel[i]);
        var sv = sc.value || [100, 100];
        if (typeof sv === "number") sv = [sv, sv];
        if (op === "flipH") sv[0] = -Math.abs(sv[0]);
        else sv[1] = -Math.abs(sv[1]);
        sc.setValue([sv[0], sv[1]]);
      }
      return { msg: "flipped" };
    }

    case "toComp": {
      if (!sel.length) return { error: "Select layers." };
      var c2 = HSX.center(comp);
      for (i = 0; i < sel.length; i++) HSX.propPos(sel[i]).setValue(c2);
      return { msg: "centered on comp" };
    }

    /* ---------- audio ---------- */
    case "mute":
    case "unmute":
    case "muteOthers": {
      var targets = op === "muteOthers" ? allLayers() : sel;
      var mutes = 0, j;
      if (op === "muteOthers") {
        var isSel = function (l) {
          for (j = 0; j < sel.length; j++) if (sel[j] === l) return true;
          return false;
        };
        for (j = 0; j < targets.length; j++) {
          if (isSel(targets[j])) continue;
          try { targets[j].muteAudio = true; mutes++; } catch (e2) { }
        }
        return { msg: mutes + " layer(s) muted (isolated selection)" };
      }
      if (!targets.length) return { error: "Select layers." };
      for (j = 0; j < targets.length; j++) {
        try {
          targets[j].muteAudio = (op === "mute");
          mutes++;
        } catch (e3) {
          // fallback via Volume effect
          if (op === "mute") HSX.addFx(targets[j], "ADBE Volume", null, { "-0001": -60 });
        }
      }
      return { msg: mutes + " layer(s) " + (op === "mute" ? "muted" : "unmuted") };
    }

    case "vol": {
      if (!sel.length) return { error: "Select layers." };
      var db = (args.args && args.args.db) || -3;
      for (i = 0; i < sel.length; i++) {
        HSX.addFx(sel[i], "ADBE Volume", "HSX Volume", { "-0001": db });
      }
      return { msg: "volume set to " + db + " dB" };
    }

    case "trim": {
      if (!sel.length) return { error: "Select layers." };
      var n = 0;
      for (i = 0; i < sel.length; i++) {
        try {
          sel[i].inPoint = comp.inPoint;
          sel[i].outPoint = comp.outPoint;
          n++;
        } catch (e4) { }
      }
      return { msg: n + " layer(s) trimmed to comp" };
    }

    /* ---------- cuts ---------- */
    case "split": {
      var t = HSX.playhead();
      var list = sel.length ? sel : allLayers();
      var split = 0;
      for (i = 0; i < list.length; i++) {
        try {
          if (t > list[i].inPoint && t < list[i].outPoint) {
            list[i].splitAtTime(t);
            split++;
          }
        } catch (e5) { }
      }
      return split ? { msg: split + " layer(s) split at playhead" } : { error: "Playhead is not inside any layer." };
    }

    case "marker": {
      var tm = HSX.playhead();
      comp.marker.setValueAtTime(tm, "HSX cut");
      return { msg: "marker at " + tm.toFixed(2) + "s" };
    }

    case "splitMarkers": {
      var list2 = sel.length ? sel : allLayers();
      var mt = [], k;
      for (k = 1; k <= comp.marker.numKeys; k++) {
        try { mt.push(comp.marker.keyTime(k)); } catch (e6) { }
      }
      if (!mt.length) return { error: "No markers on the comp — drop one at the playhead first." };
      var split2 = 0;
      for (var m = 0; m < mt.length; m++) {
        for (i = 0; i < list2.length; i++) {
          try {
            if (mt[m] > list2[i].inPoint && mt[m] < list2[i].outPoint) {
              list2[i].splitAtTime(mt[m]);
              split2++;
            }
          } catch (e7) { }
        }
      }
      return { msg: split2 + " cuts at " + mt.length + " marker(s)" };
    }

    case "adjPerCut": {
      var mts = [comp.inPoint];
      for (var k2 = 1; k2 <= comp.marker.numKeys; k2++) {
        try { mts.push(comp.marker.keyTime(k2)); } catch (e8) { }
      }
      mts.push(comp.outPoint);
      var made = 0;
      for (var s2 = 0; s2 < mts.length - 1; s2++) {
        if (mts[s2 + 1] - mts[s2] < 0.1) continue;
        var adj = HSX.adjustment(comp, HSX_LAYER_PREFIX + " Cut " + (s2 + 1), (mts[s2 + 1] - mts[s2]) * 1000);
        try {
          adj.inPoint = mts[s2];
          adj.outPoint = mts[s2 + 1];
          adj.startTime = mts[s2];
          made++;
        } catch (e9) { }
      }
      return made ? { msg: made + " adjustment layer(s) created" } : { error: "Not enough marker sections (need ≥2 markers)." };
    }
  }
  return { error: "Unknown op: " + op };
};

/* direct wrappers (used by AI + views) */
HSX_CMD.split = function (args) { return HSX_CMD.general({ op: "split" }); };
HSX_CMD.marker = function (args) { return HSX_CMD.general({ op: "marker" }); };
HSX_CMD.resize_fit = function (args) { return HSX_CMD.general({ op: "resize_fit" }); };
