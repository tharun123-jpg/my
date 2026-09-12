/* ================= views-general.js — arrange, audio, color, cuts ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;
  var tab = "arrange";

  function renderShell() {
    var root = document.getElementById("general-root");
    var h =
      '<div class="view-title">' +
        '<div class="vt-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 8h10M18 8h2M4 16h4M12 16h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16" cy="8" r="2.2" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="16" r="2.2" stroke="currentColor" stroke-width="1.7"/></svg></div>' +
        '<h2>General</h2><span class="vt-sub">· Arrange, audio, color and cuts</span>' +
      '</div>' +
      '<div class="tabs">' +
        ["arrange", "audio", "color", "cuts"].map(function (t) {
          return '<button class="tab' + (t === tab ? " active" : "") + '" data-gtab="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>';
        }).join("") +
      '</div>' +
      '<div id="gen-body"></div>';
    root.innerHTML = h;
    renderBody();
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-gtab]");
      if (t) { tab = t.getAttribute("data-gtab"); renderShell(); return; }
      var b = e.target.closest("[data-gen]");
      if (!b) return;
      var action = b.getAttribute("data-gen");
      if (action === "locked") {
        B.modal({
          title: "Split at cuts",
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="var(--gold)" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 7.8-1.3" stroke="var(--gold)" stroke-width="1.8"/></svg>',
          sub: "Frame-accurate scene detection needs the Pro rendering pipeline (pixel analysis via Media Encoder). In this build you get the full cut toolkit: split at playhead, split at markers, and adjustment layers per cut.",
          actions: [
            { label: "Got it", cb: null },
            { label: "Split at playhead", kind: "gold", cb: function () { genCmd("split", {}); } }
          ]
        });
        return;
      }
      var args = {};
      if (action.indexOf("align:") === 0) args.op = action.slice(6);
      if (action.indexOf("vol:") === 0) args.db = parseFloat(action.slice(4)) || 0;
      genCmd(action === "gen" ? args.op : (action.split(":")[0]), args);
    });
  }

  function genCmd(op, args) {
    if (!B.canSpend("preset")) return;
    B.spend(B.costFor("preset"), "preset");
    var r = B.cmd("general", { op: op, args: args || {} });
    if (r && r.error) B.toast(r.error, "err");
    else B.toast("Done" + (r && r.msg ? ": " + r.msg : ""), "ok");
  }

  function I(p, s) { return '<svg width="' + (s || 15) + '" height="' + (s || 15) + '" viewBox="0 0 24 24" fill="none">' + p + '</svg>'; }
  var IC = {
    alignL: '<path d="M5 4v16M9 8h10M9 14h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    alignC: '<path d="M12 4v16M8 9h8M9 15h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    alignR: '<path d="M19 4v16M5 8h10M9 14h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    alignT: '<path d="M4 5h16M8 9v10M14 9v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    alignM: '<path d="M4 12h16M9 8v8M15 9v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    alignB: '<path d="M4 19h16M8 5v10M14 9v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    distH: '<path d="M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    distV: '<path d="M12 4v16M9 7l3-3 3 3M9 17l3 3 3-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    flipH: '<path d="M12 4v16M7 8 4 12l3 4M17 8l3 4-3 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    flipV: '<path d="M4 12h16M8 7l4-3 4 3M8 17l4 3 4-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    comp: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 8l4 4-4 4-4-4 4-4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9H4zM17 9l4 6M21 9l-4 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    unmut: '<path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    vol: '<path d="M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    trim: '<path d="M3 12h18M7 8v8M17 8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    split: '<path d="M12 3v18M8 7 4 12l4 5M16 7l4 5-4 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    marker: '<path d="M12 4v16M12 4 6 8v12h12V8l-6-4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" transform="translate(0 2) scale(1 .8)"/>',
    adj: '<path d="M4 6h16M4 12h16M4 18h16M9 4v4M15 10v4M7 16v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  };

  function renderBody() {
    var body = document.getElementById("gen-body");
    if (tab === "arrange") {
      var items = [
        ["align:alignL", IC.alignL, "Align Left"],
        ["align:alignC", IC.alignC, "Align Center H"],
        ["align:alignR", IC.alignR, "Align Right"],
        ["align:alignT", IC.alignT, "Align Top"],
        ["align:alignM", IC.alignM, "Align Center V"],
        ["align:alignB", IC.alignB, "Align Bottom"],
        ["align:distH", IC.distH, "Distribute H", "even spacing"],
        ["align:distV", IC.distV, "Distribute V", "even spacing"],
        ["align:fitComp", IC.fit, "Scale to Fit Comp", "resize & center selected"],
        ["align:flipH", IC.flipH, "Flip Horizontal"],
        ["align:flipV", IC.flipV, "Flip Vertical"],
        ["align:toComp", IC.comp, "Center on Comp"]
      ];
      body.innerHTML = '<div class="gen-grid">' + items.map(function (it) {
        return '<button class="gen-btn" data-gen="' + it[0] + '">' + I(it[1]) + "<span>" + it[2] + (it[3] ? '<span class="gen-sub">' + it[3] + "</span>" : "") + "</span></button>";
      }).join("") + "</div>";
      return;
    }
    if (tab === "audio") {
      body.innerHTML =
        '<div class="gen-grid">' +
        '<button class="gen-btn" data-gen="mute"><svg width="15" height="15" viewBox="0 0 24 24" fill="none">' + IC.mute + '</svg><span>Mute selected<span class="gen-sub">silence the selection</span></span></button>' +
        '<button class="gen-btn" data-gen="unmute"><svg width="15" height="15" viewBox="0 0 24 24" fill="none">' + IC.unmut + '</svg><span>Unmute selected</span></button>' +
        '<button class="gen-btn" data-gen="vol:-3"><svg width="15" height="15" viewBox="0 0 24 24" fill="none">' + IC.vol + '</svg><span>Volume −3 dB<span class="gen-sub">safe dialogue level</span></span></button>' +
        '<button class="gen-btn" data-gen="vol:-10"><svg width="15" height="15" viewBox="0 0 24 24" fill="none">' + IC.vol + '</svg><span>Volume −10 dB<span class="gen-sub">background bed level</span></span></button>' +
        '<button class="gen-btn" data-gen="trim"><svg width="15" height="15" viewBox="0 0 24 24" fill="none">' + IC.trim + '</svg><span>Trim to Comp<span class="gen-sub">in/out = comp range</span></span></button>' +
        '<button class="gen-btn" data-gen="muteOthers"><svg width="15" height="15" viewBox="0 0 24 24" fill="none">' + IC.mute + '</svg><span>Mute Others<span class="gen-sub">isolate the selection</span></span></button>' +
        '</div>';
      return;
    }
    if (tab === "color") {
      var looks = Object.keys(D.LOOKS).map(function (k) {
        var L = D.LOOKS[k];
        var p = null;
        for (var i = 0; i < D.PRESETS.length; i++) if (D.PRESETS[i].id === "cl_" + k) p = D.PRESETS[i];
        return '<div class="look-chip" data-look="' + k + '"><div class="sw" style="background:' + (p ? p.sw : "#333") + '"></div><span>' + L.name + '</span></div>';
      }).join("");
      body.innerHTML =
        '<div class="look-strip">' + looks + '</div>' +
        '<div class="gen-note">' + I('<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>') +
        "Looks apply a stack of built-in effects (tint, levels, saturation, grain) to the selected layers. Nothing destructive — every effect can be removed in Effect Controls.</div>";
      body.addEventListener("click", function (e) {
        var chip = e.target.closest("[data-look]");
        if (!chip) return;
        var look = chip.getAttribute("data-look");
        if (!B.canSpend("look")) return;
        B.spend(B.costFor("look"), "look");
        var r = B.cmd("look", { id: look });
        if (r && r.error) B.toast(r.error, "err");
        else B.toast(D.LOOKS[look].name + " grade applied", "ok");
      });
      return;
    }
    // cuts
    body.innerHTML =
      '<div class="gen-note">' + I(IC.split, 16) + '<span>Select one footage clip, then detect. Markers drive the split so everything stays editable.</span></div>' +
      '<div class="gen-grid">' +
      '<button class="gen-btn" data-gen="split">' + I(IC.split) + '<span>Split at Playhead<span class="gen-sub">all layers (or selection)</span></span></button>' +
      '<button class="gen-btn" data-gen="marker">' + I(IC.marker) + '<span>Marker at Playhead<span class="gen-sub">drop a cut marker</span></span></button>' +
      '<button class="gen-btn" data-gen="splitMarkers">' + I(IC.split) + '<span>Split at Markers<span class="gen-sub">every layer at every comp marker</span></span></button>' +
      '<button class="gen-btn" data-gen="adjPerCut">' + I(IC.adj) + '<span>Adjustment Layer per Cut<span class="gen-sub">one solid per marker section</span></span></button>' +
      '<button class="gen-btn gen-locked" data-gen="locked">' + I(IC.split) + '<span>Split at Cuts<span class="gen-sub">AI scene detection</span><span class="gen-lock"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 7.8-1.3" stroke="currentColor" stroke-width="1.8"/></svg></span></button>' +
      '</div>';
  }

  window.HSX_VIEW_GEN = { render: renderShell };
})();
