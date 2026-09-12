/* ================= app.js — boot, routing, header ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE;
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
