/* ================= views-library.js — preset library + favorites ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;
  var openCats = { shakes: true };
  var search = "";
  var libTab = "presets"; // presets | sfx | texture

  function renderShell() {
    var root = document.getElementById("lib-root");
    var counts = catCounts();
    var cats = D.CATEGORIES.filter(function (c) {
      return c.id !== "sfx" && c.id !== "texture";
    });
    var h =
      '<div class="view-title">' +
        '<div class="vt-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h3v16H5zM10.5 4h3v16h-3zM16.8 5.2l2.9.8-4.2 15.2-2.9-.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></div>' +
        '<h2>Library</h2>' +
        '<div class="vt-search"><input id="lib-search" placeholder="Search presets..."><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="#6b7280" stroke-width="2"/><path d="m20 20-4.5-4.5" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg></div>' +
        '<button class="vt-refresh" id="lib-refresh" title="Refresh"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div>' +
      '<div class="tabs">' +
        '<button class="tab ' + (libTab === "presets" ? "active" : "") + '" data-tab="presets">Presets</button>' +
        '<button class="tab ' + (libTab === "sfx" ? "active" : "") + '" data-tab="sfx">Sound effects</button>' +
        '<button class="tab ' + (libTab === "texture" ? "active" : "") + '" data-tab="texture">Textures</button>' +
      '</div>' +
      '<div class="lib-body" id="lib-body"></div>' +
      '<div class="lib-foot">' +
        '<div class="toggle-row"><span>Stretch keyframes to layer duration</span><label class="switch"><input type="checkbox" id="lib-stretch"><span class="sl"></span></label></div>' +
        '<div class="toggle-row"><span>Apply at layer start</span><label class="switch"><input type="checkbox" id="lib-atstart" checked><span class="sl"></span></label></div>' +
        '<button class="btn gold block" id="lib-apply">Apply to selected</button>' +
      '</div>';
    root.innerHTML = h;
    renderBody();
    rebind();
  }

  function catCounts() {
    var c = {};
    D.CATEGORIES.forEach(function (cat) { c[cat.id] = D.byCat(cat.id).length; });
    return c;
  }

  function renderBody() {
    var body = document.getElementById("lib-body");
    if (libTab === "sfx" || libTab === "texture") {
      body.innerHTML = gridHtml(D.byCat(libTab), true);
      drawThumbs(body);
      return;
    }
    var h = "";
    D.CATEGORIES.filter(function (c) { return c.id !== "sfx" && c.id !== "texture"; }).forEach(function (cat) {
      var items = D.byCat(cat.id).filter(function (p) {
        return !search || (p.name + " " + p.desc).toLowerCase().indexOf(search) >= 0;
      });
      if (search && !items.length) return;
      var open = openCats[cat.id];
      h += '<div class="cat' + (open ? " open" : "") + '" data-cat="' + cat.id + '">' +
           '<span class="chev">▶</span>' +
           '<span class="cat-name">' + cat.name + '</span>' +
           '<span class="cat-badge">' + (search ? items.length : D.byCat(cat.id).length) + '</span></div>';
      if (open) h += '<div class="cat-items">' + cardsHtml(items) + '</div>';
    });
    body.innerHTML = h;
    drawThumbs(body);
  }

  function cardsHtml(items) {
    var h = "";
    items.forEach(function (p) {
      var fav = B.STATE.favorites[p.id];
      h += '<div class="preset-card" data-preset="' + p.id + '" data-fav-toggle="' + p.id + '">' +
           '<div class="thumb"><canvas width="132" height="52" data-thumb="' + p.id + '"></canvas></div>' +
           '<div class="p-name">' + p.name +
             '<span class="star' + (fav ? " on" : "") + '" data-star="' + p.id + '" title="Favorite">' +
               '<svg width="12" height="12" viewBox="0 0 24 24" fill="' + (fav ? "currentColor" : "none") + '"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9l-5.3 2.7 1.1-5.8-4.3-4.1 5.9-.8L12 3.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' +
             '</span></div>' +
           '<div class="p-desc">' + p.desc + '</div>' +
           '<div class="p-foot"><span class="p-apply">⚡ Apply</span><span class="pill gray">' + (p.dur ? p.dur + "s" : "static") + '</span></div>' +
           '</div>';
    });
    return h;
  }

  function gridHtml(items, full) {
    return '<div class="cat-items" style="padding-left:0">' + cardsHtml(items) + '</div>';
  }

  /* ---------- canvas thumbnails ---------- */
  function drawThumbs(scope) {
    var cv = scope.querySelectorAll("canvas[data-thumb]");
    for (var i = 0; i < cv.length; i++) drawThumb(cv[i]);
  }

  function drawThumb(cv) {
    var id = cv.getAttribute("data-thumb");
    var p = D.findPreset(id);
    if (!p) return;
    var ctx = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    var G = "#e8c15a", D2 = "#4a4f5a", TX = "#8b8f98";
    var cx = w / 2, cy = h / 2;
    function box(x, y, bw, bh, c, a) {
      ctx.globalAlpha = a == null ? 1 : a;
      ctx.strokeStyle = c; ctx.lineWidth = 1.6;
      ctx.strokeRect(x, y, bw, bh);
      ctx.globalAlpha = 1;
    }
    switch (p.thumb) {
      case "shake": case "glitchshake": {
        ctx.strokeStyle = G; ctx.lineWidth = 1.4; ctx.beginPath();
        for (var x = 6; x <= w - 6; x += 4) {
          var y = cy + Math.sin(x * 0.5) * 4 + (p.thumb === "glitchshake" ? (x % 24 < 12 ? 3 : -3) : Math.sin(x * 1.7) * 3);
          x === 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        box(8, 10, 20, 14, D2, 1); box(20, 14, 20, 14, D2, .7); box(32, 9, 20, 14, D2, .4);
        break;
      }
      case "drift":
        ctx.strokeStyle = TX; ctx.lineWidth = 1.4; ctx.beginPath();
        ctx.moveTo(14, h - 12); ctx.quadraticCurveTo(cx, cy - 14, w - 14, 12); ctx.stroke();
        ctx.fillStyle = G; ctx.beginPath(); ctx.arc(w - 14, 12, 2.5, 0, 7); ctx.fill();
        break;
      case "orbit":
        ctx.strokeStyle = G; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, cy, 34, 12, 0, 0, 7); ctx.stroke();
        ctx.fillStyle = G; ctx.beginPath(); ctx.arc(cx + 30, cy - 8, 3, 0, 7); ctx.fill();
        box(cx - 8, cy - 5, 16, 10, D2);
        break;
      case "zoomin":
        box(16, 12, 30, 16, D2, .5); box(30, 16, 40, 20, D2, .8); box(46, 19, 56, 24, G);
        break;
      case "zoomout":
        box(10, 8, 70, 36, G); box(26, 14, 50, 24, D2, .8); box(40, 19, 32, 14, D2, .5);
        break;
      case "ramp":
        ctx.strokeStyle = G; ctx.lineWidth = 1.6; ctx.beginPath();
        ctx.moveTo(8, h - 10); ctx.bezierCurveTo(40, h - 10, 50, 14, w - 8, 14); ctx.stroke();
        ctx.fillStyle = G; ctx.beginPath(); ctx.arc(w - 8, 14, 2.6, 0, 7); ctx.fill();
        break;
      case "slleft": case "slright": case "slup": case "sldown": case "sldiag":
      case "slbounce": case "slwhip": {
        var dir = { slleft: [1, 0], slright: [-1, 0], slup: [0, 1], sldown: [0, -1], sldiag: [1, -1], slbounce: [1, 0], slwhip: [1, 0] }[p.thumb] || [1, 0];
        var ex = cx + dir[0] * 26, ey = cy + dir[1] * 10;
        for (var k = 3; k >= 0; k--) {
          var f = k / 4;
          box(cx + dir[0] * 26 * f - 11, cy + dir[1] * 10 * f - 7, 22, 14, k === 0 ? G : D2, k === 0 ? 1 : 0.5 - k * 0.08);
        }
        if (p.thumb === "slbounce") {
          ctx.strokeStyle = TX; ctx.setLineDash([2, 3]); ctx.beginPath();
          ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy); ctx.stroke(); ctx.setLineDash([]);
        }
        break;
      }
      case "txpop": case "txfade": case "txtype": case "txglow": case "txtrack":
      case "txslide": case "txbounce": case "txglitch": case "txstrobe": case "txwipe": {
        ctx.font = "700 22px 'Segoe UI', sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        var txt = "Aa";
        if (p.thumb === "txglow") { ctx.shadowColor = G; ctx.shadowBlur = 12; }
        if (p.thumb === "txtype") { ctx.textAlign = "left"; ctx.font = "700 20px monospace"; txt = "Aa|"; }
        if (p.thumb === "txtrack") { txt = "Aa  Aa"; ctx.font = "700 15px 'Segoe UI', sans-serif"; }
        ctx.fillStyle = p.thumb === "txfade" ? "rgba(232,193,90,.55)" : G;
        ctx.fillText(txt, cx, cy);
        ctx.shadowBlur = 0;
        if (p.thumb === "txwipe") {
          ctx.fillStyle = "rgba(13,14,17,.9)"; ctx.fillRect(cx, 0, w / 2, h);
          ctx.strokeStyle = G; ctx.beginPath(); ctx.moveTo(cx, 6); ctx.lineTo(cx, h - 6); ctx.stroke();
        }
        break;
      }
      case "mask": case "iris": case "maskbar": {
        ctx.strokeStyle = G; ctx.lineWidth = 1.6;
        if (p.thumb === "maskbar") {
          box(14, 8, 10, h - 16, G); box(28, 12, 14, h - 24, G, .6); box(42, 16, 18, h - 32, G, .3);
        } else {
          ctx.beginPath(); ctx.arc(p.thumb === "iris" ? cx : 18, cy, 10, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(p.thumb === "iris" ? cx : 18, cy, 20, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(p.thumb === "iris" ? cx : 18, cy, 30, 0, 7); ctx.stroke();
        }
        break;
      }
      case "trflash":
        box(12, 12, w - 24, h - 24, D2);
        ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(cx - 3, 12, 6, h - 24);
        break;
      case "trshake":
        ctx.strokeStyle = G; ctx.beginPath();
        for (var x2 = 8; x2 <= w - 8; x2 += 5) x2 === 8 ? ctx.moveTo(x2, cy + (x2 % 20 < 10 ? 6 : -6)) : ctx.lineTo(x2, cy + (x2 % 20 < 10 ? 6 : -6));
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(cx - 2, 8, 4, h - 16);
        break;
      case "trzoom":
        box(10, 8, 64, 36, D2); box(22, 14, 44, 24, G);
        break;
      case "trparallel":
        box(10, 10, 34, 18, G, .9); box(24, 24, 34, 18, D2); box(38, 10, 34, 18, D2, .5);
        break;
      case "trwhip":
        ctx.strokeStyle = G; ctx.lineWidth = 2;
        for (var i3 = 0; i3 < 4; i3++) { ctx.globalAlpha = 1 - i3 * .22; ctx.beginPath(); ctx.moveTo(14 + i3 * 10, 10 + i3 * 2); ctx.lineTo(14 + i3 * 10 + 40, h - 10 - i3 * 2); ctx.stroke(); }
        ctx.globalAlpha = 1;
        break;
      case "trwarp":
        ctx.strokeStyle = G; ctx.lineWidth = 1.3;
        for (var j = 0; j < 4; j++) { ctx.beginPath(); for (var xx = 8; xx <= w - 8; xx += 4) { var yy = 12 + j * 10 + Math.sin(xx * .3 + j * 2) * 4; xx === 8 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } ctx.stroke(); }
        break;
      case "trglitch":
        ctx.fillStyle = "rgba(224,106,106,.8)"; ctx.fillRect(12, 14, w - 24, 6);
        ctx.fillStyle = "rgba(106,169,224,.8)"; ctx.fillRect(16, 24, w - 24, 6);
        ctx.fillStyle = "rgba(105,201,143,.8)"; ctx.fillRect(12, 34, w - 24, 6);
        break;
      case "trpixel":
        ctx.fillStyle = G;
        for (var px = 0; px < 8; px++) for (var py = 0; py < 4; py++)
          if ((px + py) % 3 !== 0) ctx.fillRect(10 + px * 14, 10 + py * 10, 9, 6);
        break;
      case "triris":
        ctx.strokeStyle = G; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.stroke();
        ctx.fillStyle = "rgba(13,14,17,.9)";
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7);
        ctx.rect(w, 0, -w, h); ctx.fill("evenodd");
        break;
      case "trhyper":
        ctx.strokeStyle = G; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(8, cy);
        ctx.bezierCurveTo(w * .4, cy, w * .5, 10, w - 8, 10); ctx.stroke();
        ctx.fillStyle = G; ctx.beginPath(); ctx.arc(w - 8, 10, 2.6, 0, 7); ctx.fill();
        ctx.fillStyle = TX; ctx.font = "8px monospace"; ctx.textAlign = "center";
        ctx.fillText("1× → 8×", cx, h - 6);
        break;
      case "sfx":
        ctx.strokeStyle = G; ctx.lineWidth = 1.4; ctx.beginPath();
        for (var xx2 = 6; xx2 <= w - 6; xx2 += 3) {
          var amp = Math.sin((xx2 / w) * Math.PI) * 14;
          var yy2 = cy + Math.sin(xx2 * .9) * amp * .5;
          xx2 === 6 ? ctx.moveTo(xx2, yy2) : ctx.lineTo(xx2, yy2);
        }
        ctx.stroke();
        break;
      case "texture":
        for (var d2 = 0; d2 < 90; d2++) {
          ctx.fillStyle = "rgba(232,193,90," + (0.1 + (d2 * 37 % 40) / 100) + ")";
          ctx.fillRect(8 + (d2 * 53) % (w - 16), 8 + (d2 * 91) % (h - 16), 2, 2);
        }
        break;
      case "vignette":
        var g = ctx.createRadialGradient(cx, cy, 8, cx, cy, 46);
        g.addColorStop(0, "rgba(232,193,90,.5)"); g.addColorStop(1, "rgba(13,14,17,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        box(8, 8, w - 16, h - 16, D2);
        break;
      case "color":
        if (p.sw) {
          var m = p.sw.match(/#[0-9a-f]{6}/g) || ["#888", "#333"];
          var grd = ctx.createLinearGradient(0, 0, w, h);
          grd.addColorStop(0, m[0]); grd.addColorStop(1, m[1] || m[0]);
          ctx.fillStyle = grd; ctx.fillRect(8, 8, w - 16, h - 16);
        }
        break;
      default:
        box(12, 12, w - 24, h - 24, D2);
        ctx.fillStyle = TX; ctx.font = "700 12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(p.name.charAt(0), cx, cy + 4);
    }
  }

  /* ---------- actions ---------- */
  function applyPreset(p) {
    if (!B.canSpend("preset")) return;
    B.spend(B.costFor("preset"), "preset");
    var stretch = document.getElementById("lib-stretch") ? document.getElementById("lib-stretch").checked : false;
    var atStart = document.getElementById("lib-atstart") ? document.getElementById("lib-atstart").checked : true;
    var r;
    if (p.kind === "sfx") {
      r = B.cmd("preset", { preset: p, stretch: stretch, atStart: atStart, b64: window.HSX_SFX.synthesize(p.params.sfx) });
    } else {
      r = B.cmd("preset", { preset: p, stretch: stretch, atStart: atStart });
    }
    if (r && r.error) B.toast(r.error, "err");
    else B.toast('Applied “' + p.name + '”' + (r && r.layers != null ? " to " + r.layers + " layer(s)" : ""), "ok");
  }

  function rebind() {
    document.getElementById("lib-search").addEventListener("input", function (e) {
      search = e.target.value.toLowerCase();
      renderBody();
    });
    document.getElementById("lib-refresh").addEventListener("click", function () { B.toast("Library refreshed", "ok"); });
    var root = document.getElementById("lib-root");
    root.addEventListener("click", function (e) {
      var star = e.target.closest("[data-star]");
      if (star) {
        e.stopPropagation();
        var sid = star.getAttribute("data-star");
        if (B.STATE.favorites[sid]) delete B.STATE.favorites[sid];
        else B.STATE.favorites[sid] = true;
        B.save();
        renderBody();
        if (window.HSX_VIEW_FAV && document.getElementById("view-favorites").classList.contains("hidden") === false) window.HSX_VIEW_FAV.render();
        return;
      }
      var tab = e.target.closest("[data-tab]");
      if (tab) { libTab = tab.getAttribute("data-tab"); renderShell(); return; }
      var cat = e.target.closest("[data-cat]");
      if (cat) {
        var cid = cat.getAttribute("data-cat");
        openCats[cid] = !openCats[cid];
        renderBody();
        return;
      }
      var card = e.target.closest("[data-preset]");
      if (card) {
        var p = D.findPreset(card.getAttribute("data-preset"));
        if (p) applyPreset(p);
      }
    });
    document.getElementById("lib-apply").addEventListener("click", function () {
      // applies the first open category's first search result? No — applies to selection: last hovered/selected preset
      B.toast("Select a preset card and press ⚡ Apply, or use the card directly.", "gold");
    });
  }

  window.HSX_VIEW_LIB = { render: renderShell };

  /* =============== favorites =============== */
  window.HSX_VIEW_FAV = {
    render: function () {
      var root = document.getElementById("favorites-root");
      var favs = [];
      D.PRESETS.forEach(function (p) { if (B.STATE.favorites[p.id]) favs.push(p); });
      var h =
        '<div class="view-title">' +
          '<div class="vt-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9l-5.3 2.7 1.1-5.8-4.3-4.1 5.9-.8L12 3.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></div>' +
          '<h2>Favorites</h2>' +
          '<span class="vt-sub">star anything in the library</span>' +
        '</div>';
      if (!favs.length) {
        h += '<div class="card center"><svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9l-5.3 2.7 1.1-5.8-4.3-4.1 5.9-.8L12 3.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
             '<div class="big">Nothing favorited yet</div>' +
             '<div class="small">Star presets in the Library and they will live here for one-click access.</div></div>';
      } else {
        h += '<div class="cat-items" style="grid-template-columns:repeat(auto-fill,minmax(148px,1fr))" id="fav-grid"></div>';
      }
      root.innerHTML = h;
      if (favs.length) {
        var grid = document.getElementById("fav-grid");
        var ch = "";
        favs.forEach(function (p) {
          ch += '<div class="preset-card" data-preset="' + p.id + '">' +
                '<div class="thumb"><canvas width="132" height="52" data-thumb="' + p.id + '"></canvas></div>' +
                '<div class="p-name">' + p.name + '</div>' +
                '<div class="p-desc">' + p.desc + '</div>' +
                '<div class="p-foot"><span class="p-apply">⚡ Apply</span><span class="pill gray">' + (p.dur ? p.dur + "s" : "static") + '</span></div></div>';
        });
        grid.innerHTML = ch;
        var cvs = grid.querySelectorAll("canvas[data-thumb]");
        for (var i = 0; i < cvs.length; i++) drawThumb(cvs[i]);
        grid.addEventListener("click", function (e) {
          var card = e.target.closest("[data-preset]");
          if (!card) return;
          var p = D.findPreset(card.getAttribute("data-preset"));
          if (p) {
            if (!B.canSpend("preset")) return;
            B.spend(B.costFor("preset"), "preset");
            var r = B.cmd("preset", { preset: p, stretch: false, atStart: true });
            if (r && r.error) B.toast(r.error, "err");
            else B.toast('Applied “' + p.name + '”', "ok");
          }
        });
      }
    }
  };
})();
