/* ============================================================
   main.js — Hyper Suite X dispatcher (runs in After Effects
   ExtendScript via CEP evalScript). ES3-only.
   ============================================================ */
var HSX = {
  booted: false,

  boot: function (fsPath) {
    try {
      var names = ["lib.js", "library.js", "transitions.js", "general.js", "graph.js", "fx.js", "project.js", "audio.js", "snapshots.js"];
      var i, f, code;
      for (i = 0; i < names.length; i++) {
        f = new File(fsPath + "/jsx/" + names[i]);
        if (!f.exists) continue;
        f.open("r");
        f.encoding = "UTF-8";
        code = f.read();
        f.close();
        if (code) eval(code);
      }
      HSX.booted = true;
      return "BOOT_OK";
    } catch (e) {
      return JSON.stringify({ error: "boot: " + e.toString() });
    }
  },

  cmd: function (name, argsStr) {
    try {
      var args = JSON.parse(argsStr || "{}");
      var fn = HSX_CMD[name];
      if (!fn) return JSON.stringify({ ok: false, error: "Unknown command: " + name });
      return JSON.stringify(fn(args));
    } catch (e) {
      // strip ExtendScript stack trace — keep only the first line for the UI
      var msg = String(e && e.message ? e.message : e).split("\n")[0];
      if (msg.length > 180) msg = msg.substring(0, 180) + "…";
      return JSON.stringify({ ok: false, error: name + ": " + msg });
    }
  },

  status: function () {
    try {
      var comp = HSX.comp();
      if (!comp) return JSON.stringify({ activeComp: false });
      var sel = 0;
      try { sel = comp.selectedLayers.length; } catch (e2) { }
      var t = 0;
      try { t = comp.displayedFrameTime; } catch (e3) { try { t = comp.time; } catch (e4) { } }
      return JSON.stringify({
        activeComp: true,
        compName: comp.name,
        w: comp.width,
        h: comp.height,
        sel: sel,
        tc: HSX.timecode(t, comp.frameRate || 30)
      });
    } catch (e) {
      return JSON.stringify({ activeComp: false, error: e.toString() });
    }
  }
};

/* command registry — filled by the loaded modules */
var HSX_CMD = {};
