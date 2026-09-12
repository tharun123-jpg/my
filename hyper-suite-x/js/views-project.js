/* ================= views-project.js — render, size, tidy ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE;

  var PRESETS = ["H.264", "H.265", "ProRes 422", "PNG Sequence", "TIFF Sequence"];

  function renderShell() {
    var s = B.STATE;
    var w = s.compW || 1920, h = s.compH || 1080;
    var root = document.getElementById("project-root");
    var h2 =
      '<div class="view-title">' +
        '<div class="vt-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 9.5h17M9 4.5v5M15 19.5v-5" stroke="currentColor" stroke-width="1.7"/></svg></div>' +
        '<h2>Project</h2><span class="vt-sub">· Resize, render and tidy up</span>' +
      '</div>' +
      '<div class="pr-sec">' +
        '<div class="pr-sec-head"><span class="k">EXPORT</span><span class="v">H.264 .mp4</span></div>' +
        '<button class="btn gold block" id="pr-render" style="height:42px">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 7.8-1.3" stroke="currentColor" stroke-width="2"/></svg>' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="m10 9 5 3-5 3V9z" fill="currentColor"/></svg>' +
          'Render &amp; convert</button>' +
        '<select id="pr-format" style="width:100%;margin-top:8px;height:32px;background:var(--bg3);border:1px solid var(--line);border-radius:7px;padding:0 10px;font-size:12px">' +
          PRESETS.map(function (p) { return '<option>' + p + '</option>'; }).join("") +
        '</select>' +
        '<button class="btn ghost block" id="pr-png" style="margin-top:8px">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3 4 9v12h16V9l-8-6zM12 3v9" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' +
          'Save frame as PNG</button>' +
      '</div>' +
      '<div class="pr-sec">' +
        '<div class="pr-sec-head"><span class="k">SIZE</span><span class="v">pixels</span></div>' +
        '<div class="size-row"><label>Size</label><input id="pr-w" value="' + w + '"><span>×</span><input id="pr-h" value="' + h + '"><span class="unit">px</span></div>' +
        '<button class="btn ghost block" id="pr-resize" style="margin-bottom:8px">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
          'Resize &amp; center selected</button>' +
        '<button class="btn ghost block" id="pr-reframe">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 6V4h6v2M9 18v2h6v-2" stroke="currentColor" stroke-width="1.8"/></svg>' +
          'Reframe comp to size</button>' +
      '</div>' +
      '<div class="pr-sec">' +
        '<div class="pr-sec-head"><span class="k">PROJECT</span></div>' +
        '<div class="pr-duo">' +
          '<button class="btn" id="pr-tidy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h10M4 17h6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="m15 15 2 5 2-5-2-1h-2l-2 1z" fill="currentColor"/></svg>Tidy project bin</button>' +
          '<button class="btn" id="pr-purge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Purge memory</button>' +
        '</div>' +
        '<button class="btn ghost block" id="pr-polish" style="margin-top:8px">✨ Full polish — tidy + purge (batch queue)</button>' +
      '</div>' +
      '<div class="pr-sec">' +
        '<div class="pr-sec-head"><span class="k">SNAPSHOTS</span><span class="v">undo points</span></div>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px">' +
          '<select id="sn-scope" style="flex:1;height:34px;background:var(--bg3);border:1px solid var(--line);border-radius:7px;padding:0 10px;font-size:12px">' +
            '<option value="sel">Selected layers</option><option value="comp">Whole comp</option>' +
          '</select>' +
          '<button class="btn gold" id="sn-save" style="height:34px">◉ Save snapshot</button>' +
        '</div>' +
        '<div id="sn-list"></div>' +
      '</div>' +
      '<div class="pr-sec">' +
        '<div class="pr-sec-head"><span class="k">HEALTH SCAN</span><span class="v">project check</span></div>' +
        '<button class="btn block" id="pr-scan" style="height:38px">🔍 Scan project for issues</button>' +
        '<div id="scan-out" style="margin-top:8px"></div>' +
      '</div>' +
      '<div class="pr-sec">' +
        '<div class="pr-sec-head"><span class="k">STATUS</span></div>' +
        '<div class="card center" id="pr-status" style="padding:18px">' +
          '<div class="small">Render results will appear here.</div>' +
        '</div>' +
      '</div>';
    root.innerHTML = h2;
    bind();
    renderSnaps();
  }

  function status(msg, kind) {
    var el = document.getElementById("pr-status");
    if (el) el.innerHTML = '<div class="small" style="color:' + (kind === "ok" ? "var(--green)" : kind === "err" ? "var(--red)" : "var(--tx2)") + '">' + B.esc(msg) + '</div>';
  }

  /* ---------- snapshots ---------- */
  function renderSnaps() {
    var el = document.getElementById("sn-list");
    if (!el) return;
    var r = B.hsx("snapshot_list", {}, { silent: true });
    var list = (r && r.snaps) || [];
    if (!list.length) {
      el.innerHTML = '<div class="small" style="color:var(--tx3);padding:4px 2px">No snapshots yet. Select layers (or nothing = whole comp), then Save snapshot — restore any time, even after mistakes.</div>';
      return;
    }
    var h = "";
    list.forEach(function (s) {
      h += '<div class="snap-item">' +
           '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l2.5 2.5" stroke="var(--gold)" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="8.5" stroke="var(--gold)" stroke-width="1.7"/></svg>' +
           '<div class="sn-name">' + B.esc(s.name) + '<div class="sn-meta">' + s.layers + ' layer(s) · ' + s.keys + ' keyframes · ' + s.when + '</div></div>' +
           '<button class="btn sm" data-sr="' + s.id + '">Restore</button>' +
           '<button class="mini" data-sd="' + s.id + '" title="Delete">✕</button>' +
           '</div>';
    });
    el.innerHTML = h;
    el.querySelectorAll("[data-sr]").forEach(function (b) {
      b.addEventListener("click", function () {
        B.hsx("snapshot_restore", { id: b.getAttribute("data-sr") }, { toastOk: "Snapshot restored" });
        renderSnaps();
      });
    });
    el.querySelectorAll("[data-sd]").forEach(function (b) {
      b.addEventListener("click", function () {
        B.hsx("snapshot_delete", { id: b.getAttribute("data-sd") }, { silent: true });
        renderSnaps();
      });
    });
  }

  /* ---------- health scan ---------- */
  function runScan() {
    var out = document.getElementById("scan-out");
    out.innerHTML = '<div class="small" style="color:var(--tx3)">Scanning…</div>';
    var r = B.hsx("scan", {}, { silent: true });
    if (!r || r.error) { out.innerHTML = ""; B.toast(r && r.error ? r.error : "Scan failed", "err"); return; }
    var items = r.items || [];
    var warn = 0;
    items.forEach(function (it) { if (it.sev === "warn") warn++; });
    var h = '';
    if (!items.length) h = '<div class="small" style="color:var(--green)">✓ No issues found.</div>';
    items.forEach(function (it) {
      var c = it.sev === "warn" ? "p-err" : it.sev === "info" ? "p-pend" : "p-done";
      h += '<div class="scan-row"><span class="dw-dot ' + c + '"></span><span style="flex:1">' + B.esc(it.msg) + '</span></div>';
    });
    if (warn) h += '<button class="btn sm gold" id="scan-fix" style="margin-top:6px">Fix quick wins (tidy + purge, batched)</button>';
    out.innerHTML = h;
    var fix = document.getElementById("scan-fix");
    if (fix) fix.addEventListener("click", function () {
      B.queuePush("tidy", {}, "Tidy bin");
      B.queuePush("purge", {}, "Purge caches");
      B.toast("Fixes queued — ⚙ header", "ok");
    });
    B.toast("Scan done — " + warn + " warning(s)", warn ? "gold" : "ok");
  }

  function bind() {
    document.getElementById("pr-render").addEventListener("click", function () {
      if (!B.canSpend("render")) return;
      B.spend(B.costFor("render"), "render");
      var format = document.getElementById("pr-format").value;
      status("Rendering… (watch the Render Queue in After Effects)", "");
      var r = B.hsx("render", { format: format }, { label: "render " + format, silent: true });
      if (r && r.error) { status(r.error, "err"); B.toast(r.error, "err"); }
      else { status(r.msg || "Render queued — H.264 → MP4", "ok"); B.toast("Render queued: " + format, "ok"); }
    });
    document.getElementById("pr-png").addEventListener("click", function () {
      if (!B.canSpend("render")) return;
      B.spend(B.costFor("render"), "render");
      var r = B.hsx("save_frame", {}, { silent: true });
      if (r && r.error) { status(r.error, "err"); B.toast(r.error, "err"); }
      else { status("Frame saved: " + (r.path || "PNG"), "ok"); B.toast("Frame saved as PNG", "ok"); }
    });
    document.getElementById("pr-resize").addEventListener("click", function () {
      var r = B.hsx("resize_fit", {}, { toastOk: "Selected layers resized & centered" });
      if (r && r.error) B.toast(r.error, "err");
    });
    document.getElementById("pr-reframe").addEventListener("click", function () {
      var w = parseInt(document.getElementById("pr-w").value, 10) || 1920;
      var h = parseInt(document.getElementById("pr-h").value, 10) || 1080;
      if (w < 16 || h < 16 || w > 16384 || h > 16384) { B.toast("Size must be 16–16384 px", "err"); return; }
      if (!B.canSpend("preset")) return;
      B.spend(B.costFor("preset"), "preset");
      var r = B.hsx("reframe", { w: w, h: h }, { silent: true });
      if (r && r.error) B.toast(r.error, "err");
      else B.toast("Comp reframed to " + w + "×" + h, "ok");
    });
    document.getElementById("pr-tidy").addEventListener("click", function () {
      var r = B.hsx("tidy", {}, { silent: true });
      if (r && r.error) B.toast(r.error, "err");
      else B.toast("Project bin tidied — " + (r.moved || 0) + " item(s) organized", "ok");
    });
    document.getElementById("pr-purge").addEventListener("click", function () {
      if (!B.canSpend("purge")) return;
      B.spend(B.costFor("purge"), "purge");
      var r = B.hsx("purge", {}, { silent: true });
      if (r && r.error) B.toast(r.error, "err");
      else B.toast("Memory, disk cache & bitmaps purged", "ok");
    });
    document.getElementById("pr-polish").addEventListener("click", function () {
      B.queuePush("tidy", {}, "Tidy bin");
      B.queuePush("purge", {}, "Purge caches");
      B.queuePush("resize_fit", {}, "Resize & center selected");
      B.toast("Full polish queued — ⚙ header", "ok");
    });
    document.getElementById("sn-save").addEventListener("click", function () {
      var scope = document.getElementById("sn-scope").value;
      if (!B.canSpend("snapshot")) return;
      B.spend(B.costFor("snapshot"), "snapshot");
      var name = prompt("Snapshot name:", "Undo point " + new Date().toLocaleTimeString());
      if (!name) return;
      var r = B.hsx("snapshot_save", { name: name, scope: scope }, { silent: true });
      if (r && r.error) B.toast(r.error, "err");
      else B.toast("Snapshot saved — " + (r.layers != null ? r.layers + " layer(s)" : ""), "ok");
      renderSnaps();
    });
    document.getElementById("pr-scan").addEventListener("click", runScan);
  }

  window.HSX_VIEW_PRJ = { render: renderShell };
})();
