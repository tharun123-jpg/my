/* ================= views-transitions.js — one-click transitions ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;
  var current = "flash";
  var done = {}; // id -> true (applied in this session)

  var MOTIONS = [
    { id: "slowmo", name: "Slow-mo beat", desc: "100% → 40% → 100% speed ramp through the playhead (time-remap)." },
    { id: "whip", name: "Whip pan", desc: "Fast position whip with motion-blur ramp for a snappy scene change." },
    { id: "stutter", name: "Stutter", desc: "Staccato position steps — glitchy, high-tension rhythm." },
    { id: "overshoot", name: "Overshoot", desc: "Anticipate + settle move: quick push past the target, then back." }
  ];

  function renderShell() {
    var root = document.getElementById("transitions-root");
    var h =
      '<div class="view-title">' +
        '<div class="vt-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></div>' +
        '<h2>Transitions</h2><span class="vt-sub">· One-click transitions on the playhead</span>' +
      '</div>' +
      '<div id="edit-inspector" class="edit-inspector" style="display:none"></div>' +
      '<div class="tr-top"><canvas id="tr-canvas" width="600" height="300"></canvas><div class="tr-label" id="tr-label">Flash Cut</div></div>' +
      '<div class="tr-list" id="tr-list"></div>' +
      '<button class="btn ghost block" id="tr-queue-all" style="margin-top:10px">⚡ Queue all unlocked transitions (batch)</button>' +
      '<div class="sec-label">MOTION PACK · SPEED &amp; MOVE</div>' +
      '<div class="motion-grid">' + MOTIONS.map(function (m) {
        return '<div class="motion-card" data-motion="' + m.id + '"><div class="mc-name">' + m.name + '</div><div class="mc-desc">' + m.desc + '</div></div>';
      }).join("") + '</div>';
    root.innerHTML = h;
    renderEditInspector();

    var list = document.getElementById("tr-list");
    var lh = "";
    D.TRANSITIONS.forEach(function (t) {
      lh += '<div class="tr-item' + (t.id === current ? " current" : "") + (done[t.id] ? " done" : "") + '" data-tr="' + t.id + '">' +
        '<div class="tr-ico">' + (t.locked
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" stroke-width="1.8"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 7.8-1.3" stroke="currentColor" stroke-width="1.8"/></svg>') +
        '</div>' +
        '<div class="tr-name">' + t.name + (t.locked ? ' <span class="pill gold">PRO</span>' : '') + '</div>' +
        '<div class="tr-status">' +
          (done[t.id] ? '<span class="tr-done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5L20 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Complete</span>' : '') +
          (t.locked ? '<button class="tr-apply" data-act="unlock">Unlock</button>' : '<button class="tr-apply" data-act="apply">Apply ⚡</button>') +
        '</div></div>';
    });
    list.innerHTML = lh;
    drawPreview();

    list.addEventListener("click", function (e) {
      var item = e.target.closest("[data-tr]");
      if (!item) return;
      var t = item.getAttribute("data-tr");
      var def = null;
      D.TRANSITIONS.forEach(function (x) { if (x.id === t) def = x; });
      if (!def) return;
      if (e.target.closest('[data-act="apply"]') || (!e.target.closest('[data-act]'))) {
        if (def.locked) { unlockModal(def); return; }
        current = t;
        renderShell();
        apply(def);
      } else if (e.target.closest('[data-act="unlock"]')) {
        unlockModal(def);
      }
    });

    var qa = document.getElementById("tr-queue-all");
    if (qa) qa.addEventListener("click", function () {
      var list = D.TRANSITIONS.filter(function (t) { return !t.locked; });
      if (!list.length) { B.toast("Nothing to queue.", "gold"); return; }
      list.forEach(function (t) { B.queuePush("transition", { id: t.id }, t.name, { silent: true }); });
      B.toast(list.length + " transitions queued — ⚙ header shows progress", "ok");
    });

    document.querySelectorAll("[data-motion]").forEach(function (card) {
      card.addEventListener("click", function () {
        var id = card.getAttribute("data-motion");
        if (!B.canSpend("motion")) return;
        B.spend(B.costFor("motion"), "motion");
        B.hsx("motion", { id: id }, { label: "motion " + id, toastOk: "Motion applied: " + id });
      });
    });
  }

  function fmtT(t) {
    var fr = 30, f = Math.round((t || 0) * fr);
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    return p2(Math.floor(f / 60)) + ":" + p2(f % 60);
  }

  function renderEditInspector() {
    var el = document.getElementById("edit-inspector");
    if (!el) return;
    var r = B.hsx("edit_info", {}, { silent: true });
    if (!r || r.error || !r.ok) { el.style.display = "none"; return; }
    el.style.display = "";
    function clip(c, dir) {
      if (!c) return '<div class="ei-clip ' + dir + '"><div class="ei-name" style="color:var(--tx3)">—</div><div class="ei-meta">no clip</div></div>';
      return '<div class="ei-clip ' + dir + '"><div class="ei-name">' + B.esc(c.name) + '</div><div class="ei-meta">' +
             fmtT(c.in) + ' → ' + fmtT(c.out) + ' · ' + (c.dur != null ? c.dur.toFixed(2) + "s" : "") + '</div></div>';
    }
    el.innerHTML =
      '<div class="ei-clip-wrap" style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">' +
        clip(r.in, "in") +
        '<div class="ei-ph" title="playhead"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 4v16M5 4h14l-4 6 4 6H5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></div>' +
        clip(r.out, "out") +
      '</div>' +
      '<span class="pill ' + (r.count >= 2 ? "green" : "gold") + '">' + (r.count >= 2 ? "2 clips at playhead ✓" : r.count === 1 ? "1 clip — no edit" : "no clips") + '</span>';
  }

  function apply(def) {
    if (!B.canSpend("transition")) return;
    B.spend(B.costFor("transition"), "transition");
    var r = B.hsx("transition", { id: def.id }, { label: def.name, silent: true });
    if (r && r.error) { B.toast(r.error, "err"); return; }
    done[def.id] = true;
    B.toast(def.name + " applied at the playhead", "ok");
    setTimeout(renderShell, 400);
  }

  function unlockModal(def) {
    B.modal({
      title: "Unlock " + def.name,
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="var(--gold)" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 7.8-1.3" stroke="var(--gold)" stroke-width="1.8"/></svg>',
      sub: "Premium transition. Your build of Hyper Suite X includes the full Pro feature set — unlock it locally (free, offline, no account).",
      actions: [
        { label: "Later", cb: null },
        { label: "Unlock for free", kind: "gold", cb: function () {
            var plan = HSX_BRAND.plans;
            if (!plan[B.STATE.plan].pro) B.STATE.plan = "P";
            B.save(); B.refreshHeader();
            B.toast(def.name + " unlocked — Pro features enabled", "gold");
            apply(def);
          } }
      ]
    });
  }

  /* ---------- animated preview canvas ---------- */
  var anim = null;
  function drawPreview() {
    var cv = document.getElementById("tr-canvas");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    if (anim) cancelAnimationFrame(anim);
    var t0 = performance.now();
    var loop = function (now) {
      var t = ((now - t0) % 1600) / 1600; // 0..1 loop
      ctx.clearRect(0, 0, W, H);
      // base "scene A"
      ctx.fillStyle = "#1d232e"; ctx.fillRect(0, 0, W / 2, H);
      ctx.fillStyle = "#2a3342"; ctx.fillRect(0, 0, W * 0.3, H);
      ctx.fillStyle = "rgba(255,255,255,.14)";
      ctx.beginPath(); ctx.arc(W * 0.22, H * 0.35, 26, 0, 7); ctx.fill();
      ctx.fillRect(W * 0.08, H * 0.62, W * 0.3, H * 0.3);
      // scene B (right half)
      ctx.fillStyle = "#243043"; ctx.fillRect(W / 2, 0, W / 2, H);
      ctx.fillStyle = "#31435c"; ctx.fillRect(W * 0.7, 0, W * 0.3, H);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.beginPath(); ctx.arc(W * 0.78, H * 0.4, 30, 0, 7); ctx.fill();
      // playhead
      ctx.fillStyle = "var(--gold)"; ctx.fillStyle = "#e8c15a";
      ctx.fillRect(W / 2 - 1.5, 0, 3, H);
      // transition overlay
      var mid = W / 2;
      switch (current) {
        case "flash": case "shakeflash": {
          var f = Math.max(0, 1 - Math.abs(t - 0.5) * 8);
          ctx.fillStyle = "rgba(255,255,255," + (f * 0.95) + ")";
          ctx.fillRect(0, 0, W, H);
          if (current === "shakeflash") {
            var s = f * 6;
            ctx.save(); ctx.translate(Math.sin(t * 60) * s, Math.cos(t * 47) * s);
            ctx.fillStyle = "rgba(232,193,90,.25)"; ctx.fillRect(mid - 60, 20, 120, 8); ctx.restore();
          }
          break;
        }
        case "zoomcut": {
          var z = t < 0.5 ? 1 + t * 1.4 : 2.4 - (t - 0.5) * 1.4;
          ctx.save(); ctx.globalAlpha = t < 0.5 ? 1 - t : (t - 0.5);
          ctx.translate(mid, H / 2); ctx.scale(z, z);
          ctx.fillStyle = t < 0.5 ? "#3a4a63" : "#1d232e";
          ctx.fillRect(-90, -45, 180, 90); ctx.restore();
          break;
        }
        case "parallel": {
          var px = (t - 0.5) * W * 0.9;
          ctx.save(); ctx.globalAlpha = 0.9;
          ctx.fillStyle = "#3a4a63"; ctx.fillRect(mid - 120 + px, 0, 120, H);
          ctx.fillStyle = "#26313f"; ctx.fillRect(mid + px, 0, 120, H);
          ctx.restore();
          break;
        }
        case "whip": {
          var wx = (t - 0.5) * W * 1.6;
          var g = ctx.createLinearGradient(mid - 200 + wx, 0, mid + 200 + wx, 0);
          g.addColorStop(0, "rgba(232,193,90,0)"); g.addColorStop(0.5, "rgba(232,193,90,.8)"); g.addColorStop(1, "rgba(232,193,90,0)");
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          break;
        }
        case "warp": {
          var w2 = Math.max(0, 1 - Math.abs(t - 0.5) * 5);
          ctx.save();
          ctx.filter = "none";
          for (var i = 0; i < 5; i++) {
            ctx.globalAlpha = w2 * 0.5;
            ctx.fillStyle = i % 2 ? "#e8c15a" : "#6aa9e0";
            ctx.fillRect(0, (H / 5) * i + Math.sin(t * 30 + i) * 12 * w2, W, H / 10);
          }
          ctx.restore();
          break;
        }
        case "glitch": {
          var g2 = Math.max(0, 1 - Math.abs(t - 0.5) * 6);
          if (g2 > 0.05) {
            ctx.fillStyle = "rgba(224,106,106," + g2 + ")"; ctx.fillRect(0, H * 0.2 + (t * 400 % 13) - 6, W, 10);
            ctx.fillStyle = "rgba(106,169,224," + g2 + ")"; ctx.fillRect(0, H * 0.55 - (t * 300 % 17) + 6, W, 12);
            ctx.fillStyle = "rgba(255,255,255," + g2 * 0.6 + ")"; ctx.fillRect(0, H * 0.78, W, 5);
          }
          break;
        }
        case "pixel": {
          var p2 = Math.max(0, 1 - Math.abs(t - 0.5) * 4);
          var cell = Math.round(p2 * 60) + 6;
          ctx.save(); ctx.globalAlpha = p2 * 0.85;
          for (var x = 0; x < W; x += cell) for (var y = 0; y < H; y += cell) {
            ctx.fillStyle = ((x + y) / cell) % 2 ? "rgba(58,74,99,.9)" : "rgba(29,35,46,.9)";
            ctx.fillRect(x, y, cell - 2, cell - 2);
          }
          ctx.restore();
          break;
        }
        case "iris": {
          var r3 = Math.abs(t - 0.5) * 2; // close then open
          var rad = Math.max(6, r3 * H * 0.7);
          ctx.save();
          ctx.fillStyle = "#0d0e11";
          ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(mid, H / 2, rad, 0, 7, true);
          ctx.fill();
          ctx.strokeStyle = "#e8c15a"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(mid, H / 2, rad, 0, 7); ctx.stroke();
          ctx.restore();
          break;
        }
        case "hyper": {
          var hp = Math.sin(t * Math.PI);
          var stretch = hp * 12;
          ctx.save(); ctx.globalAlpha = 0.8;
          for (var k2 = 0; k2 < 8; k2++) {
            ctx.fillStyle = "rgba(232,193,90," + (0.5 - k2 * 0.05) + ")";
            ctx.fillRect(mid - 4 - stretch * (k2 / 8), 0, 3, H);
          }
          ctx.restore();
          ctx.fillStyle = "rgba(255,255,255,.7)";
          ctx.font = "700 15px monospace"; ctx.textAlign = "center";
          ctx.fillText((1 + hp * 7).toFixed(1) + "× speed", mid, 26);
          break;
        }
      }
      anim = requestAnimationFrame(loop);
    };
    anim = requestAnimationFrame(loop);
  }

  window.HSX_VIEW_TR = { render: renderShell };
})();
