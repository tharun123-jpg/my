/* ============================================================
   project.js — render, export, resize, tidy, purge (ES3)
   ============================================================ */

function HSX_outFolder() {
  var p = app.project.file;
  if (p && p.fsName) return Folder(getFolderPath(p.fsName));
  var d = Folder.myDocuments.fsName + "/HyperSuiteX";
  var f = new Folder(d);
  if (!f.exists) f.create();
  return f;
}

function HSX_getFolder(str) {
  // "C:\\a\\b\\c.mp4" -> Folder
  var i = str.lastIndexOf("/");
  if (i < 0) i = str.lastIndexOf("\\");
  if (i <= 0) return Folder.myDocuments;
  return new Folder(str.substring(0, i));
}

HSX_CMD.render = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var format = args.format || "H.264";
  var ext = "mp4";
  if (format === "PNG Sequence") ext = "png";
  else if (format === "TIFF Sequence") ext = "tif";
  else if (format.indexOf("ProRes") >= 0) ext = "mov";

  var q = app.project.renderQueueItems;
  var item = q.add(comp, true);
  item.name = comp.name + " · HSX";
  try {
    item.setSetting("Output Module Template", format);
  } catch (e) {
    try { item.setSetting("Video Output Module Template", format); } catch (e1) { }
  }

  var out = HSX_outFolder();
  var f = new File(out.fsName + "/" + comp.name + "_HSX." + ext);
  try {
    item.outputModule.file = f;
  } catch (e2) {
    return { error: "Could not set output file (format “" + format + "” may not be available — install Adobe Media Encoder for H.264)." };
  }
  try {
    app.project.renderQueue.startRendering(false);
  } catch (e3) {
    return { error: "Start rendering failed: " + e3.toString() };
  }
  return { msg: "Rendering “" + comp.name + "” as " + format + " → " + f.fsName, path: f.fsName };
};

HSX_CMD.save_frame = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var q = app.project.renderQueueItems;
  var item = q.add(comp, true);
  item.name = comp.name + " · frame";
  var out = HSX_outFolder();
  var f = new File(out.fsName + "/" + comp.name + "_frame_" + Math.round(HSX.playhead() * 100) + ".png");
  var ok = false;
  try {
    item.setSetting("Output Module Template", "Still Images - PNG");
    item.outputModule.file = f;
    ok = true;
  } catch (e) {
    // fallback: TIFF via frameRaster
    try {
      var tf = new File(out.fsName + "/" + comp.name + "_frame.tiff");
      comp.frameRaster(tf, 100);
      return { msg: "Frame saved as TIFF (PNG preset unavailable) → " + tf.fsName, path: tf.fsName };
    } catch (e2) { }
  }
  if (ok) {
    app.project.renderQueue.startRendering(true);
    return { msg: "Frame saved → " + f.fsName, path: f.fsName };
  }
  return { error: "Could not export the frame." };
};

HSX_CMD.reframe = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var w = args.w, h = args.h;
  if (!w || !h || w < 16 || h < 16) return { error: "Invalid size." };
  comp.width = w;
  comp.height = h;
  var c = [w / 2, h / 2];
  var i;
  for (i = 1; i <= comp.numLayers; i++) {
    try { HSX.propPos(comp.layer(i)).setValue(c); } catch (e) { }
  }
  return { msg: "comp reframed to " + w + "×" + h + " and layers re-centered" };
};

HSX_CMD.tidy = function (args) {
  var comp = HSX.comp();
  if (!comp) return { error: "Open a composition first." };
  var proj = app.project;
  var binName = "HSX · " + comp.name;
  var bin = null;
  var i;
  for (i = 1; i <= proj.numItems; i++) {
    var it = proj.item(i);
    if (it instanceof BinItem && it.name === binName) { bin = it; break; }
  }
  if (!bin) bin = proj.items.addBin(binName);
  var moved = 0;
  for (i = 1; i <= proj.numItems; i++) {
    var item = proj.item(i);
    if (item instanceof BinItem) continue;
    try {
      if (item.parent === proj) {
        item.parent = bin;
        moved++;
      }
    } catch (e) { }
  }
  return { msg: moved + " item(s) moved to “" + binName + "”", moved: moved };
};

HSX_CMD.purge = function (args) {
  try {
    app.project.purge(15);
    return { msg: "purged" };
  } catch (e) {
    return { error: e.toString() };
  }
};
