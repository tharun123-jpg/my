/* ============================================================
   audio.js — synthesized SFX: write WAV, import, drop layer (ES3)
   ============================================================ */
HSX_SFX = {
  dir: function () {
    var d = new Folder(Folder.myDocuments.fsName + "/HyperSuiteX/audio");
    if (!d.exists) d.create();
    return d;
  }
};

// the JS side sends {id, b64}; we write the file then import
HSX_CMD.sfx = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var id = args.id || "impact";
  var b64 = args.b64;
  if (!b64) return { error: "No audio data received." };

  var dir = HSX_SFX.dir();
  var wav = new File(dir.fsName + "/" + id + ".wav");
  try {
    var buf = Buffer.from(b64, "base64");
    wav.open("w");
    wav.encoding = "BINARY";
    wav.write(buf);
    wav.close();
  } catch (e) {
    return { error: "Could not write the sound file: " + e.toString() };
  }

  // import (or reuse) the footage item
  var item = null;
  var i;
  for (i = 1; i <= app.project.numItems; i++) {
    var it = app.project.item(i);
    if (it instanceof FootageItem && it.name === "HSX_" + id) { item = it; break; }
  }
  if (!item) {
    try {
      var io = new ImportOptionsFile(wav);
      io.choosenImportOption = ImportOption.OM_AUDIO;
      var before = app.project.numItems;
      var items = app.project.importFile(io);
      for (i = 1; i <= app.project.numItems; i++) {
        var cand = app.project.item(i);
        if (cand instanceof FootageItem && cand.name === (id + ".wav") || (items && cand === items[0])) {
          try { cand.name = "HSX_" + id; } catch (e1) { }
          item = cand;
          break;
        }
      }
    } catch (e2) {
      return { error: "Import failed: " + e2.toString() };
    }
    if (!item) return { error: "Imported the file but could not find the item." };
  }

  var t = HSX.playhead();
  var L = comp.layers.addAudio(item, t, t + 2);
  try {
    L.name = "[HSX] " + id;
    // extend to full sound length (2s default window; fine for SFX)
  } catch (e3) { }
  return { msg: "“" + id + "” dropped at the playhead" };
};
