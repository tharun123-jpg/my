/* ================= app.js — boot, routing, header ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;
  var currentView = "chat";

  function go(view) {
    currentView = view;
    var views = {
      chat: "view-chat", library: "view-library", favorites: "view-favorites",
      transitions: "view-transitions", fx: "view-fx", graph: "view-graph",
      general: "view-general", project: "view-project", profile: "view-profile"
    };
    for (var k in views) {
      var el = document.getElementById(views[k]);
      if (el) el.classList.toggle("hidden", k !== view);
    }
    document.querySelectorAll(".sb-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });
    var renderers = {
      chat: window.HSX_VIEW_CHAT, library: window.HSX_VIEW_LIB,
      favorites: window.HSX_VIEW_FAV, transitions: window.HSX_VIEW_TR,
      fx: window.HSX_VIEW_FX, graph: window.HSX_VIEW_GRAPH,
      general: window.HSX_VIEW_GEN, project: window.HSX_VIEW_PRJ,
      profile: window.HSX_VIEW_PROF
    };
    var r = renderers[view];
    if (r && r.render) r.render();
  }

  /* ================= command palette (Ctrl+K) ================= */
  var PALETTE = (function () {
    var items = [];
    function add(label, hint, run) { items.push({ label: label.toLowerCase(), hint: hint || "", run: run }); }
    D.TRANSITIONS.forEach(function (t) {
      add(t.name + " transition @ playhead", "transition", function () {
        B.hsx("transition", { id: t.id }, { label: t.name, toastOk: t.name + " applied at the playhead" });
        if (window.HSX_VIEW_TR && currentView === "transitions") window.HSX_VIEW_TR.render();
      });
    });
    add("Split selected layers at playhead", "cuts", function () {
      B.hsx("split", {}, { toastOk: "Split done at playhead" });
    });
    add("Drop marker at playhead", "cuts", function () {
      B.hsx("marker", {}, { toastOk: "Marker dropped" });
    });
    add("Resize & center selected layers", "project", function () {
      B.hsx("resize_fit", {}, { toastOk: "Selected layers resized & centered" });
    });
    add("Purge memory, disk cache & bitmaps", "project", function () {
      B.hsx("purge", {}, { toastOk: "All caches purged" });
    });
    add("Tidy project bin", "project", function () {
      B.hsx("tidy", {}, { toastOk: "Project bin tidied" });
    });
    add("Render comp → H.264 .mp4", "render", function () {
      if (!B.canSpend("render")) return;
      B.spend(B.costFor("render"), "render");
      B.hsx("render", { format: "H.264" }, { toastOk: "Render queued (H.264 → MP4)" });
    });
    add("Save current frame as PNG", "render", function () {
      B.hsx("save_frame", {}, { toastOk: "Frame saved as PNG" });
    });
    add("Project health scan", "analyze", function () {
      go("project");
      setTimeout(function () { var b = document.getElementById("pr-scan"); if (b) b.click(); }, 60);
    });
    add("Save snapshot of selection (undo point)", "snapshot", function () {
      var n = prompt("Snapshot name:", "Undo point " + (new Date().getMinutes()) + ":" + (new Date().getSeconds()));
      if (n) B.hsx("snapshot_save", { name: n, scope: "sel" }, { toastOk: "Snapshot saved: " + n });
    });
    ["slowmo", "whip", "stutter", "overshoot"].forEach(function (id) {
      var names = { slowmo: "Slow-mo beat", whip: "Whip pan", stutter: "Stutter", overshoot: "Overshoot" };
      add("Motion: " + names[id] + " (selected layers)", "motion", function () {
        B.hsx("motion", { id: id }, { label: "motion " + id, toastOk: names[id] + " applied" });
      });
    });
    ["clean", "moody", "vintage", "teo", "bw", "pastel", "punch", "cold"].forEach(function (id) {
      add("Color look: " + id, "color", function () {
        B.hsx("look", { id: id }, { label: "look " + id, toastOk: "Look applied: " + id });
      });
    });
    add("Full polish (tidy + purge, batched)", "batch", function () {
      go("project");
      B.queuePush("tidy", {}, "Tidy bin");
      B.queuePush("purge", {}, "Purge caches");
      openDrawer("queue");
    });
    ["library", "favorites", "transitions", "fx", "graph", "general", "project", "profile", "chat"].forEach(function (v) {
      add("Open " + v.charAt(0).toUpperCase() + v.slice(1), "navigate", function () { go(v); });
    });
    return items;
  })();

  var palIndex = 0, palFiltered = [];
  function palFilter(q) {
    palFiltered = PALETTE.filter(function (it) {
      if (!q) return true;
      // subsequence match (fuzzy)
      var i = 0;
      for (var j = 0; j < it.label.length && i < q.length; j++) if (it.label.charAt(j) === q.charAt(i)) i++;
      return i === q.length;
    }).slice(0, 12);
    palIndex = 0;
  }
  function palRender() {
    var list = document.getElementById("pal-list");
    if (!list) return;
    var h = "";
    if (!palFiltered.length) h = '<div class="pal-empty">No matching command</div>';
    palFiltered.forEach(function (it, i) {
      h += '<div class="pal-item' + (i === palIndex ? " active" : "") + '" data-pi="' + i + '">' +
           '<span class="pal-label">' + B.esc(it.label) + '</span>' +
           (it.hint ? '<span class="pal-hint">' + B.esc(it.hint) + '</span>' : "") + '</div>';
    });
    list.innerHTML = h;
  }
  function palRun(i) {
    var it = palFiltered[i];
    if (!it) return;
    palClose();
    it.run();
  }
  function palOpen() {
    var bd = document.getElementById("palette-backdrop");
    bd.classList.remove("hidden");
    var inp = document.getElementById("pal-input");
    inp.value = "";
    palFilter("");
    palRender();
    setTimeout(function () { inp.focus(); }, 30);
  }
  function palClose() { document.getElementById("palette-backdrop").classList.add("hidden"); }

  function bindPalette() {
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        document.getElementById("palette-backdrop").classList.contains("hidden") ? palOpen() : palClose();
        return;
      }
      if (e.key === "Escape") {
        if (!document.getElementById("palette-backdrop").classList.contains("hidden")) { palClose(); return; }
        if (!document.getElementById("drawer").classList.contains("hidden")) { dwClose(); return; }
      }
      if (!document.getElementById("palette-backdrop").classList.contains("hidden")) {
        if (e.key === "ArrowDown") { e.preventDefault(); palIndex = Math.min(palFiltered.length - 1, palIndex + 1); palRender(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); palIndex = Math.max(0, palIndex - 1); palRender(); }
        else if (e.key === "Enter") { e.preventDefault(); palRun(palIndex); }
      }
    });
    document.getElementById("palette-btn").addEventListener("click", palOpen);
    document.getElementById("pal-input").addEventListener("input", function (e) {
      palFilter(e.target.value.toLowerCase());
      palRender();
    });
    document.getElementById("pal-list").addEventListener("click", function (e) {
      var el = e.target.closest("[data-pi]");
      if (el) palRun(parseInt(el.getAttribute("data-pi"), 10));
    });
    document.getElementById("palette-backdrop").addEventListener("click", function (e) {
      if (e.target === this) palClose();
    });
  }

  /* ================= drawer (queue + activity) ================= */
  function dwOpen(tab) {
    var dw = document.getElementById("drawer");
    dw.classList.remove("hidden");
    document.getElementById("drawer-backdrop").classList.remove("hidden");
    dwSetTab(tab || "queue");
  }
  function dwClose() {
    document.getElementById("drawer").classList.add("hidden");
    document.getElementById("drawer-backdrop").classList.add("hidden");
  }
  function dwSetTab(tab) {
    var tabs = document.querySelectorAll(".dw-tab");
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("active", tabs[i].getAttribute("data-dw") === tab);
    document.getElementById("dw-queue-body").classList.toggle("hidden", tab !== "queue");
    document.getElementById("dw-log-body").classList.toggle("hidden", tab !== "log");
    if (tab === "queue") dwRenderQueue(); else dwRenderLog();
  }
  var DW_TAB = "queue";
  function dwRenderQueue() {
    var body = document.getElementById("dw-queue-body");
    var h = "";
    if (!B.QUEUE.items.length) {
      h = '<div class="dw-empty">Queue is empty.<br>Batch operations will run here — e.g. “Full polish” from the palette, or queue presets from the Library.</div>';
    } else {
      var dot = { pending: "p-pend", running: "p-run", done: "p-done", error: "p-err", cancelled: "p-canc" };
      B.QUEUE.items.forEach(function (it, i) {
        h += '<div class="dw-item">' +
             '<span class="dw-dot ' + dot[it.status] + '"></span>' +
             '<div class="dw-it"><div class="dw-lab">' + B.esc(it.label) + '</div>' +
             (it.result ? '<div class="dw-res ' + (it.status === "error" ? "err" : "") + '">' + B.esc(it.result) + '</div>' : "") +
             '</div></div>';
      });
      h += '<div class="dw-actions"><button class="btn sm danger" id="dw-qcancel"' + (B.QUEUE.running ? "" : " disabled") + '>Cancel queue</button>' +
           '<button class="btn sm ghost" id="dw-qclear">Clear finished</button></div>';
    }
    body.innerHTML = h;
    var c = document.getElementById("dw-qcancel");
    if (c) c.addEventListener("click", function () { B.queueCancel(); });
    var cl = document.getElementById("dw-qclear");
    if (cl) cl.addEventListener("click", function () { B.queueClear(); });
  }
  function dwRenderLog() {
    var body = document.getElementById("dw-log-body");
    var h = "";
    if (!B.LOGS.length) h = '<div class="dw-empty">No activity yet — actions you run will be logged here with status.</div>';
    for (var i = B.LOGS.length - 1; i >= 0; i--) {
      var e = B.LOGS[i];
      h += '<div class="dw-log"><span class="dw-time">' + e.t + '</span><span class="dw-dot ' +
           (e.kind === "ok" ? "p-done" : e.kind === "err" ? "p-err" : "p-pend") + '"></span><span class="dw-msg">' + B.esc(e.msg) + '</span></div>';
    }
    body.innerHTML = h;
  }
  function bindDrawer() {
    document.getElementById("activity-btn").addEventListener("click", function () {
      var dw = document.getElementById("drawer");
      if (dw.classList.contains("hidden")) dwOpen(DW_TAB); else dwClose();
    });
    document.getElementById("dw-close").addEventListener("click", dwClose);
    document.getElementById("drawer-backdrop").addEventListener("click", dwClose);
    document.querySelectorAll(".dw-tab").forEach(function (t) {
      t.addEventListener("click", function () { DW_TAB = t.getAttribute("data-dw"); dwSetTab(DW_TAB); });
    });
    B.onQueueChange(function () {
      DW_TAB = "queue";
      if (!document.getElementById("drawer").classList.contains("hidden")) dwRenderQueue();
    });
  }

  function boot() {
    B.load();
    B.refreshHeader();

    var isAE = B.isAE();
    if (isAE) B.bootAE();

    // sidebar
    document.querySelectorAll(".sb-btn").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-view")); });
    });

    // header menu
    document.getElementById("hdr-menu").addEventListener("click", function () {
      B.modal({
        title: HSX_BRAND.name + " " + HSX_BRAND.accent,
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12c2.5-6 5-6 7 0s4.5 6 7 0 4.5-6 4-6" stroke="var(--gold)" stroke-width="2.2" stroke-linecap="round"/><circle cx="20.5" cy="6" r="2" fill="var(--gold)"/></svg>',
        sub: "The most advanced toolkit in your After Effects — AI, presets, transitions, easing, FX, color and render in one panel.",
        html:
          '<div style="display:flex;flex-direction:column;gap:7px">' +
          '<button class="btn sm ghost" data-mnav="chat" style="justify-content:flex-start">💬 &nbsp;Ask HyperAI</button>' +
          '<button class="btn sm ghost" data-mnav="library" style="justify-content:flex-start">📚 &nbsp;Open the preset library</button>' +
          '<button class="btn sm ghost" data-mnav="transitions" style="justify-content:flex-start">⚡ &nbsp;One-click transitions</button>' +
          '<button class="btn sm ghost" data-mnav="profile" style="justify-content:flex-start">⚙️ &nbsp;Profile &amp; settings</button>' +
          '</div>' +
          '<div style="margin-top:12px;font-size:11px;color:var(--tx3)">v' + HSX_BRAND.version + ' · ' + (isAE ? "connected to After Effects" : "browser preview — install to go live") + '</div>',
        onOpen: function (box) {
          box.querySelectorAll("[data-mnav]").forEach(function (el) {
            el.addEventListener("click", function () {
              B.closeModal();
              go(el.getAttribute("data-mnav"));
            });
          });
        }
      });
    });

    // plan badge → profile
    document.getElementById("plan-badge").addEventListener("click", function () { go("profile"); });

    // update banner
    var banner = document.getElementById("update-banner");
    if (B.STATE.bannerDismissed) banner.classList.add("hidden");
    document.getElementById("update-x").addEventListener("click", function () {
      B.STATE.bannerDismissed = true; B.save();
      banner.classList.add("hidden");
    });
    document.getElementById("update-get").addEventListener("click", function () {
      B.STATE.bannerDismissed = true; B.save();
      banner.classList.add("hidden");
      B.toast("This is already the latest build — v" + HSX_BRAND.version, "ok");
    });
    document.getElementById("update-what").addEventListener("click", function () {
      B.modal({
        title: "What's new in v" + HSX_BRAND.version,
        sub: "The “most advanced” build of the suite:",
        html: "<ul>" +
          "<li><b>New — Snapshot / Undo points:</b> named, restorable state captures of layers (keyframes, transforms, effects)</li>" +
          "<li><b>New — Batch queue:</b> run many operations in order, per-item status, cancel anytime (header ⚙)</li>" +
          "<li><b>New — Command palette:</b> Ctrl+K — every action, one keystroke away</li>" +
          "<li><b>New — Edit inspector:</b> see exactly which clips sit at the playhead before a transition</li>" +
          "<li><b>New — Motion pack:</b> slow-mo beat, whip pan, stutter, overshoot speed presets</li>" +
          "<li><b>New — Project health scan</b> with one-click fixes · <b>Activity log</b> · import settings</li>" +
          "<li>Optimized UI: lazy thumbnails, chunked grids, GPU-only animation, debounced search</li>" +
          "<li>Stability: every AE command wrapped in structured error handling with logging</li>" +
          "<li>HyperAI with streaming, model picker and <b>direct action execution</b> in After Effects</li>" +
          "<li>" + window.HSX_DATA.PRESETS.length + " library presets across 10 categories with live thumbnails</li>" +
          "<li>10 one-click playhead transitions with animated previews</li>" +
          "<li>Draggable bezier ease editor — read from, and apply to, real keyframes</li>" +
          "<li>12 FX toggles (whole comp or selected layers), 8 one-click color looks</li>" +
          "<li>Arrangement grid, audio controls, cut toolkit, render &amp; export suite</li>" +
          "<li>Synthesized sound effects — no sample files needed</li>" +
          "</ul>",
        actions: [{ label: "Nice", kind: "gold", cb: null }]
      });
    });

    bindPalette();
    bindDrawer();

    // mock badge when in browser
    if (!isAE) {
      var mb = document.createElement("div");
      mb.id = "mock-badge";
      mb.textContent = "BROWSER PREVIEW · MOCK AE";
      document.body.appendChild(mb);
    }

    go("chat");

    // status polling
    setInterval(function () { B.pollStatus(); }, 1500);
    B.pollStatus();
  }

  window.HSX = { go: go, onStatus: null };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
