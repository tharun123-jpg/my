/* ================= views-graph.js — ease curve editor ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;

  // current curve as bezier control points (normalized)
  var P1 = { x: 0.25, y: 0.1 }, P2 = { x: 0.75, y: 0.9 };
  var selectedEase = "ease";
  var savedEases = loadSaved();
  var drag = null;

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem("hsx_saved_eases") || "[]"); }
    catch (e) { return []; }
  }
  function persistSaved() {
    try { localStorage.setItem("hsx_saved_eases", JSON.stringify(savedEases)); } catch (e) { }
  }

  function renderShell() {
    var root = document.getElementById("graph-root");
    var h =
      '<div class="graph-wrap">' +
        '<div class="curve-box" id="curve-box"><svg viewBox="0 0 300 300" id="curve-svg">' +
          '<g id="cv-grid"></g>' +
          '<line x1="0" y1="270" x2="300" y2="270" stroke="#313642" stroke-width="1"/>' +
          '<line x1="0" y1="15" x2="300" y2="15" stroke="#313642" stroke-width="1"/>' +
          '<g id="cv-overshoot" style="display:none">' +
            '<line x1="0" y1="15" x2="300" y2="15" stroke="#e06a6a" stroke-width="1" stroke-dasharray="4 4" opacity=".6"/>' +
          '</g>' +
          '<path id="cv-fill" fill="rgba(232,193,90,.08)" d=""/>' +
          '<path id="cv-curve" fill="none" stroke="#e8c15a" stroke-width="2.6" stroke-linecap="round" d=""/>' +
          '<line id="cv-h1l" stroke="#e8c15a" stroke-width="1.2" opacity=".55"/>' +
          '<line id="cv-h2l" stroke="#e8c15a" stroke-width="1.2" opacity=".55"/>' +
          '<circle id="cv-h1" r="7" fill="#0d0e11" stroke="#e8c15a" stroke-width="2.4" style="cursor:grab"/>' +
          '<circle id="cv-h2" r="7" fill="#0d0e11" stroke="#e8c15a" stroke-width="2.4" style="cursor:grab"/>' +
        '</svg></div>' +
        '<div class="ease-row"><span class="dot"></span><div class="bar"><div class="fill" id="ease-fill"></div></div></div>' +
        '<div class="graph-opts"><span>Overshoot</span>' +
          '<label class="switch"><input type="checkbox" id="ease-over"><span class="sl"></span></label>' +
        '</div>' +
        '<div class="graph-actions">' +
          '<button class="btn read" id="ease-read">Read selected</button>' +
          '<button class="btn gold" id="ease-apply">Apply ease</button>' +
        '</div>' +
        '<div class="ease-sel-row">' +
          '<select id="ease-sel"></select>' +
          '<button class="mini" id="ease-minus" title="Delete saved ease">−</button>' +
          '<button class="mini" id="ease-plus" title="New ease">+</button>' +
          '<button class="btn sm gold" id="ease-save">★ Save</button>' +
        '</div>' +
        '<div class="ease-sec">PRESETS</div>' +
        '<div class="ease-grid" id="ease-grid"></div>' +
      '</div>';
    root.innerHTML = h;
    renderEaseSelect();
    renderGrid();
    bind();
    draw();
  }

  function renderEaseSelect() {
    var sel = document.getElementById("ease-sel");
    var h = '<option value="">Default</option>';
    D.EASES.forEach(function (e) { h += '<option value="' + e.id + '" ' + (e.id === selectedEase ? "selected" : "") + '>' + e.name + '</option>'; });
    savedEases.forEach(function (e) { h += '<option value="saved:' + e.name + '" ' + (selectedEase === "saved:" + e.name ? "selected" : "") + '>' + e.name + '</option>'; });
    sel.innerHTML = h;
  }

  function renderGrid() {
    var grid = document.getElementById("ease-grid");
    var h = "";
    D.EASES.forEach(function (e) {
      h += '<div class="ease-tile' + (e.id === selectedEase ? " active" : "") + '" data-ease="' + e.id + '">' +
           easeTileSvg(e) + "<span>" + e.name + "</span></div>";
    });
    savedEases.forEach(function (e) {
      h += '<div class="ease-tile" data-ease="saved:' + e.name + '">' + easeTileSvg({ type: "bez", bez: e.bez }) + "<span>" + e.name + "</span></div>";
    });
    grid.innerHTML = h;
  }

  function easeTileSvg(def) {
    var pts = D.sampleEase(def, 24);
    var d = "";
    for (var i = 0; i < pts.length; i++) {
      var x = 4 + pts[i].t * 36;
      var y = 34 - pts[i].v * 28;
      y = Math.max(1, Math.min(39, y));
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return '<svg viewBox="0 0 44 40"><path d="' + d + '" fill="none" stroke="var(--gold)" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  /* ---------- drawing ---------- */
  var M = 15, S = 270; // margin + span (y: 270..15)
  function toX(t) { return M + t * S; }
  function toY(v) { return 270 - v * S; }
  function fromX(x) { return (x - M) / S; }
  function fromY(y) { return (270 - y) / S; }

  function curvePath() {
    var p = "M " + toX(0) + " " + toY(0);
    p += " C " + toX(P1.x) + " " + toY(P1.y) + ", " + toX(P2.x) + " " + toY(P2.y) + ", " + toX(1) + " " + toY(1);
    return p;
  }

  function draw() {
    var box = document.getElementById("curve-box");
    if (!box) return;
    var svg = document.getElementById("curve-svg");
    // grid
    var g = "";
    for (var i = 0; i <= 4; i++) {
      var xx = toX(i / 4), yy = toY(i / 4);
      g += '<line x1="' + xx + '" y1="' + toY(0) + '" x2="' + xx + '" y2="' + toY(1) + '" stroke="#1c2027" stroke-width="1"/>';
      g += '<line x1="' + toX(0) + '" y1="' + yy + '" x2="' + toX(1) + '" y2="' + yy + '" stroke="#1c2027" stroke-width="1"/>';
    }
    document.getElementById("cv-grid").innerHTML = g;
    document.getElementById("cv-curve").setAttribute("d", curvePath());
    document.getElementById("cv-fill").setAttribute("d", curvePath() + " L " + toX(1) + " " + toY(0) + " L " + toX(0) + " " + toY(0) + " Z");
    var h1 = document.getElementById("cv-h1"), h2 = document.getElementById("cv-h2");
    h1.setAttribute("cx", toX(P1.x)); h1.setAttribute("cy", toY(P1.y));
    h2.setAttribute("cx", toX(P2.x)); h2.setAttribute("cy", toY(P2.y));
    document.getElementById("cv-h1l").setAttribute("x1", toX(0)); document.getElementById("cv-h1l").setAttribute("y1", toY(0));
    document.getElementById("cv-h1l").setAttribute("x2", toX(P1.x)); document.getElementById("cv-h1l").setAttribute("y2", toY(P1.y));
    document.getElementById("cv-h2l").setAttribute("x1", toX(1)); document.getElementById("cv-h2l").setAttribute("y1", toY(1));
    document.getElementById("cv-h2l").setAttribute("x2", toX(P2.x)); document.getElementById("cv-h2l").setAttribute("y2", toY(P2.y));
    var over = document.getElementById("ease-over");
    if (over) over.checked = P1.y > 1 || P1.y < 0 || P2.y > 1 || P2.y < 0;
    document.getElementById("cv-overshoot").style.display = over.checked ? "" : "none";
    var fill = document.getElementById("ease-fill");
    if (fill) fill.style.width = Math.round(D.bezY([P1.x, P1.y, P2.x, P2.y], 0.5) * 100) + "%";
  }

  /* ---------- interaction ---------- */
  function svgPoint(svg, evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    var p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function bind() {
    var box = document.getElementById("curve-box");
    var svg = document.getElementById("curve-svg");
    var over = document.getElementById("ease-over");

    over.addEventListener("change", function () {
      // when toggled on, nudge handles into overshoot territory
      if (over.checked) { if (P1.y <= 1 && P2.y <= 1) { P1.y = 1.18; P2.y = 1.18; } }
      else { P1.y = Math.min(1, Math.max(0, P1.y)); P2.y = Math.min(1, Math.max(0, P2.y)); }
      draw();
    });

    ["cv-h1", "cv-h2"].forEach(function (id, idx) {
      var el = document.getElementById(id);
      el.addEventListener("mousedown", function (e) {
        drag = idx; el.style.cursor = "grabbing"; e.preventDefault();
      });
    });
    // rAF-throttled drag: at most one redraw per frame
    var lastEvt = null, rafId = 0;
    window.addEventListener("mousemove", function (e) {
      if (!drag) return;
      lastEvt = e;
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        rafId = 0;
        if (!drag || !lastEvt) return;
        var p = svgPoint(svg, lastEvt);
        var t = Math.max(0, Math.min(1, fromX(p.x)));
        var v = fromY(p.y);
        var overEl = document.getElementById("ease-over");
        if (!overEl) return;
        var lim = overEl.checked ? 1.6 : 1;
        v = Math.max(-0.6, Math.min(lim, v));
        if (drag === 0) { P1.x = t; P1.y = v; } else { P2.x = t; P2.y = v; }
        draw();
      });
    });
    window.addEventListener("mouseup", function () {
      if (!drag) return;
      drag = null; lastEvt = null;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      draw();
    });

    document.getElementById("ease-sel").addEventListener("change", function (e) {
      loadEase(e.target.value);
    });
    document.getElementById("ease-grid").addEventListener("click", function (e) {
      var tile = e.target.closest("[data-ease]");
      if (!tile) return;
      selectedEase = tile.getAttribute("data-ease");
      loadEase(selectedEase);
      renderGrid();
    });
    document.getElementById("ease-save").addEventListener("click", function () {
      var name = prompt("Name this ease curve:", "My Ease " + (savedEases.length + 1));
      if (!name) return;
      var exists = null;
      savedEases.forEach(function (s) { if (s.name === name) exists = s; });
      if (exists) exists.bez = [P1.x, P1.y, P2.x, P2.y];
      else savedEases.push({ name: name, bez: [P1.x, P1.y, P2.x, P2.y] });
      persistSaved();
      selectedEase = "saved:" + name;
      renderEaseSelect(); renderGrid();
      B.toast("Saved ease: " + name, "ok");
    });
    document.getElementById("ease-plus").addEventListener("click", function () {
      P1 = { x: 0.4, y: 0 }; P2 = { x: 0.6, y: 1 };
      selectedEase = ""; renderEaseSelect(); renderGrid(); draw();
    });
    document.getElementById("ease-minus").addEventListener("click", function () {
      if (!savedEases.length) { B.toast("No saved eases yet", "gold"); return; }
      savedEases.pop(); persistSaved();
      selectedEase = ""; renderEaseSelect(); renderGrid();
    });
    document.getElementById("ease-read").addEventListener("click", function () {
      var btn = document.getElementById("ease-read");
      btn.classList.add("active");
      var r = B.cmd("read_ease", {});
      if (!r) return;
      if (r.error) { B.toast(r.error, "err"); return; }
      if (!r.keys || !r.keys.length) { B.toast("Select keyframes in After Effects first (or a layer with animated properties).", "gold"); return; }
      fitFromKeys(r);
      btn.classList.remove("active");
      B.toast("Read easing from " + r.keys.length + " keyframe(s)", "ok");
    });
    document.getElementById("ease-apply").addEventListener("click", function () {
      if (!B.canSpend("preset")) return;
      B.spend(B.costFor("preset"), "preset");
      var pts = D.sampleEase({ type: "bez", bez: [P1.x, P1.y, P2.x, P2.y] }, 14);
      var r = B.cmd("apply_ease", { kf: pts, named: selectedEase });
      if (r && r.error) B.toast(r.error, "err");
      else B.toast("Ease applied to " + (r && r.keys != null ? r.keys : "selected") + " keyframe(s)", "ok");
    });
  }

  function loadEase(id) {
    if (!id) return;
    if (id.indexOf("saved:") === 0) {
      for (var i = 0; i < savedEases.length; i++) if (savedEases[i].name === id.slice(6)) {
        setBez(savedEases[i].bez); return;
      }
    }
    var e = D.findEase(id);
    if (!e) return;
    selectedEase = e.id;
    if (e.type === "bez") setBez(e.bez);
    else {
      // kf-based: approximate with a bezier through mid values
      var kf = D.sampleEase(e, 8);
      var mid = kf[Math.floor(kf.length / 2)].v;
      P1 = { x: 0.25, y: Math.min(1.5, Math.max(-0.5, mid * 2)) };
      P2 = { x: 0.75, y: 1 };
      draw();
    }
  }

  function setBez(b) {
    P1 = { x: b[0], y: b[1] };
    P2 = { x: b[2], y: b[3] };
    draw();
  }

  // approximate bezier handles from real AE keyframe data
  function fitFromKeys(r) {
    var k = r.keys;
    if (k.length < 2) return;
    var t0 = k[0].t, t1 = k[k.length - 1].t;
    var v0 = k[0].v, v1 = k[k.length - 1].v;
    var span = Math.max(1e-6, t1 - t0);
    var pts = [];
    for (var i = 0; i < k.length; i++) {
      pts.push({ t: (k[i].t - t0) / span, v: (k[i].v - v0) / Math.max(1e-6, v1 - v0) });
    }
    // start / end slopes (normalized)
    var slope0 = pts.length > 1 ? (pts[1].v - pts[0].v) / Math.max(1e-6, pts[1].t - pts[0].t) : 0.5;
    var slope1 = pts.length > 1 ? (pts[pts.length - 1].v - pts[pts.length - 2].v) / Math.max(1e-6, pts[pts.length - 1].t - pts[pts.length - 2].t) : 0.5;
    P1 = { x: 0.25, y: Math.max(-0.6, Math.min(1.6, slope0 * 0.35)) };
    P2 = { x: 0.75, y: Math.max(-0.6, Math.min(1.6, 1 - (1 - slope1) * 0.35)) };
    selectedEase = "";
    draw();
  }

  window.HSX_VIEW_GRAPH = { render: renderShell };
})();
