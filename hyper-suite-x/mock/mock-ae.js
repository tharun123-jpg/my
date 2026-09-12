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
      default:
        r.msg = "mock: " + name;
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
