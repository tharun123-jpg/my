/* ============================================================
   mock-ae.js — fake After Effects bridge for browser previews.
   Loaded automatically by bridge.js when evalScript is absent,
   so the whole panel UI can be tested outside After Effects.
   ============================================================ */
(function () {
  "use strict";
  var MOCK = {
    comp: "Demo_Comp 4K",
    w: 3840,
    h: 2160,
    sel: 2,
    t: 4.2,
    fr: 30,
    fx: {}
  };

  function tc() {
    var totalFrames = Math.floor(MOCK.t * MOCK.fr);
    var f = totalFrames % MOCK.fr;
    var s = Math.floor(totalFrames / MOCK.fr) % 60;
    var m = Math.floor(totalFrames / (MOCK.fr * 60)) % 60;
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    return p2(0) + ":" + p2(m) + ":" + p2(s) + ";" + p2(f);
  }

  function cmd(name, args) {
    var r = { ok: true };
    switch (name) {
      case "status":
        return { activeComp: true, compName: MOCK.comp, w: MOCK.w, h: MOCK.h, sel: MOCK.sel, tc: tc() };
      case "preset":
        r.layers = MOCK.sel;
        r.msg = "mock: preset applied";
        break;
      case "transition":
        r.msg = "mock: transition applied at playhead";
        break;
      case "general":
        r.msg = "mock: " + args.op;
        break;
      case "look":
        r.msg = "mock: look applied";
        r.layers = MOCK.sel;
        break;
      case "fx":
        if (args.id) MOCK.fx[args.id] = !!args.on;
        if (args.all != null) {
          for (var k in MOCK.fx) MOCK.fx[k] = args.all;
        }
        r.msg = "mock: fx updated";
        break;
      case "fx_state": {
        var st = {};
        for (var f2 in MOCK.fx) st[f2] = MOCK.fx[f2];
        r.states = st;
        break;
      }
      case "render":
        r.msg = "mock: render queued → " + MOCK.comp + "_HSX.mp4";
        break;
      case "save_frame":
        r.path = "mock/" + MOCK.comp + "_frame.png";
        r.msg = "mock: frame saved";
        break;
      case "reframe":
        MOCK.w = args.w; MOCK.h = args.h;
        r.msg = "mock: reframed";
        break;
      case "tidy":
        r.moved = 7;
        r.msg = "mock: bin tidied";
        break;
      case "purge":
        r.msg = "mock: purged";
        break;
      case "read_ease":
        r.keys = [
          { t: 0, v: 0 }, { t: 0.2, v: 0.02 }, { t: 0.5, v: 0.35 },
          { t: 0.8, v: 0.9 }, { t: 1, v: 1 }
        ];
        r.src = "ADBE Position";
        break;
      case "apply_ease":
        r.keys = args.kf ? args.kf.length : 0;
        r.msg = "mock: ease applied";
        break;
      case "sfx":
        r.msg = "mock: sound dropped at playhead";
        break;
      case "split":
        r.msg = "mock: split at playhead";
        break;
      case "marker":
        r.msg = "mock: marker dropped";
        break;
      case "resize_fit":
        r.msg = "mock: layers fitted";
        break;
      case "snapshot_save": {
        MOCK.snaps = MOCK.snaps || [];
        var id = (MOCK.snapSeq = (MOCK.snapSeq || 0) + 1);
        MOCK.snaps.push({ id: id, name: (args.name || "Snapshot") + "", when: tc(), scope: args.scope || "sel", layers: MOCK.sel, keys: 34 });
        if (MOCK.snaps.length > 12) MOCK.snaps.shift();
        r.id = id; r.layers = MOCK.sel; r.keys = 34; r.total = MOCK.snaps.length;
        break;
      }
      case "snapshot_list": {
        MOCK.snaps = MOCK.snaps || [];
        r.snaps = MOCK.snaps;
        break;
      }
      case "snapshot_restore": {
        MOCK.snaps = MOCK.snaps || [];
        var found = null;
        for (var si = 0; si < MOCK.snaps.length; si++) {
          if (MOCK.snaps[si].id === args.id) { found = MOCK.snaps[si]; break; }
        }
        if (!found) return { ok: false, error: "Snapshot not found in this session." };
        r.restored = found.layers; r.missing = 0;
        r.msg = "mock: restored “" + found.name + "”";
        break;
      }
      case "snapshot_delete": {
        MOCK.snaps = MOCK.snaps || [];
        var di = -1;
        for (var sj = 0; sj < MOCK.snaps.length; sj++) { if (MOCK.snaps[sj].id === args.id) { di = sj; break; } }
        if (di < 0) return { ok: false, error: "Snapshot not found in this session." };
        MOCK.snaps.splice(di, 1);
        r.remaining = MOCK.snaps.length;
        break;
      }
      case "scan":
        r.items = [
          { sev: "ok", msg: "Comp size " + MOCK.w + "×" + MOCK.h + " is reasonable." },
          { sev: "info", msg: "2 duplicate layer name(s) — unique names make edits & multi-select safer." },
          { sev: "warn", msg: "1 invisible layer(s) (hidden or 0% opacity) — hide or delete to speed up playback." },
          { sev: "info", msg: "41 effect instance(s) across " + MOCK.sel + " layer(s)." },
          { sev: "info", msg: "No keyframes on transform properties — nothing to optimize yet." }
        ];
        r.layers = MOCK.sel;
        break;
      case "edit_info":
        r.in = { name: "01_hero_cam_v3", in: MOCK.t - 2.4, out: MOCK.t, dur: 2.4 };
        r.out = { name: "02_insert_detail", in: MOCK.t, out: MOCK.t + 3.1, dur: 3.1 };
        r.count = 2;
        r.t = MOCK.t;
        r.tc = tc();
        break;
      case "motion":
        if (args.id === "slowmo" || args.id === "whip" || args.id === "stutter" || args.id === "overshoot") {
          r.msg = "mock: " + args.id + " applied to " + MOCK.sel + " layer(s)";
        } else {
          return { ok: false, error: "Unknown motion: " + args.id };
        }
        break;
      default:
        // parity with jsx/main.js: unknown commands are errors
        return { ok: false, error: "Unknown command: " + name };
    }
    return r;
  }

  window.evalScript = function (code) {
    // advance mock playhead for a bit of life
    MOCK.t += 0.5;
    var m = String(code).match(/^HSX\.boot\(/);
    if (m) return "BOOT_OK";
    m = String(code).match(/^HSX\.status\(\)/);
    if (m) return JSON.stringify(cmd("status", {}));
    m = String(code).match(/^HSX\.cmd\('([^']+)',\s*'(.*)'\)$/);
    if (m) {
      var name = m[1];
      var argsStr = m[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      var args = {};
      try { args = JSON.parse(argsStr); } catch (e) { }
      return JSON.stringify(cmd(name, args));
    }
    return "{}";
  };
})();
