/* ============================================================
   bridge.js — talks to After Effects through CEP's evalScript.
   Falls back to a mock AE (mock/mock-ae.js) when opened in a
   plain browser so the UI can be previewed outside After Effects.
   ============================================================ */
(function () {
  "use strict";

  var STATE = {
    aeflag: false,
    booted: false,
    activeComp: false,
    compName: "",
    compW: 0,
    compH: 0,
    selCount: 0,
    timecode: "00:00:00;00",
    credits: HSX_BRAND.creditsStart,
    plan: "B",
    favorites: {},      // id -> true
    ai: {
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      modelFast: "gpt-4o-mini",
      modelPro: "gpt-4o",
      customModel: ""
    }
  };

  /* ---------- persistence (Chromium localStorage in CEP) ---------- */
  function save() {
    try {
      localStorage.setItem("hsx_state", JSON.stringify({
        credits: STATE.credits, plan: STATE.plan,
        favorites: STATE.favorites, ai: STATE.ai,
        bannerDismissed: STATE.bannerDismissed
      }));
    } catch (e) { /* browser preview without storage */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem("hsx_state");
      if (!raw) return;
      var d = JSON.parse(raw);
      if (typeof d.credits === "number") STATE.credits = d.credits;
      if (d.plan && HSX_BRAND.plans[d.plan]) STATE.plan = d.plan;
      if (d.favorites) STATE.favorites = d.favorites;
      if (d.ai) {
        STATE.ai.baseUrl = d.ai.baseUrl || STATE.ai.baseUrl;
        STATE.ai.apiKey = d.ai.apiKey || "";
        STATE.ai.modelFast = d.ai.modelFast || STATE.ai.modelFast;
        STATE.ai.modelPro = d.ai.modelPro || STATE.ai.modelPro;
        STATE.ai.customModel = d.ai.customModel || "";
      }
      STATE.bannerDismissed = !!d.bannerDismissed;
    } catch (e) { }
  }

  /* ---------- credits ---------- */
  function spend(n, reason) {
    STATE.credits = Math.max(0, STATE.credits - n);
    save();
    refreshHeader();
    if (STATE.credits === 0) {
      toast("Out of credits — reset them in Profile & settings", "gold", 4200);
    }
  }
  function costFor(cmd) {
    var c = { ai: 4, preset: 1, transition: 2, fx: 1, look: 1, render: 10, split: 1, purge: 1, sfx: 1 };
    return c[cmd] != null ? c[cmd] : 1;
  }
  function canSpend(cmd) {
    if (STATE.credits >= costFor(cmd)) return true;
    toast("Not enough credits for this action", "err");
    return false;
  }

  /* ---------- AE communication ---------- */
  function isAE() { return typeof window.evalScript === "function"; }

  function bootAE() {
    if (!isAE()) return false;
    try {
      var extFolder = extensionFolder();
      var r = callAE("HSX.boot(" + JSON.stringify(extFolder) + ")");
      if (r && r.indexOf("BOOT_OK") >= 0) { STATE.booted = true; return true; }
    } catch (e) { /* fall through */ }
    return false;
  }

  // folder that contains index.html
  function extensionFolder() {
    try {
      var p = decodeURIComponent(window.location.href);
      var i = p.lastIndexOf("index.html");
      if (i > 0) p = p.substring(0, i);
      if (p.charAt(p.length - 1) === "/") p = p.substring(0, p.length - 1);
      return p;
    } catch (e) { return ""; }
  }

  function callAE(jsx) {
    var out = window.evalScript(jsx);
    if (out == null) return null;
    try { return JSON.parse(out); } catch (e) { return { error: String(out) }; }
  }

  // send a command to the JSX dispatcher; JSX files are loaded on boot
  function cmd(name, args) {
    if (!isAE()) return null;
    var payload = JSON.stringify(args || {});
    payload = payload.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return callAE("HSX.cmd('" + name + "','" + payload + "')");
  }

  // poll AE state (cheap — small JSON)
  function pollStatus() {
    if (!isAE() || !STATE.booted) return;
    try {
      var s = callAE("HSX.status()");
      if (!s || s.error) return;
      STATE.activeComp = !!s.activeComp;
      STATE.compName = s.compName || "";
      STATE.compW = s.w || 0; STATE.compH = s.h || 0;
      STATE.selCount = s.sel || 0;
      STATE.timecode = s.tc || "";
      document.getElementById("comp-status-text").innerHTML = s.activeComp
        ? '<b>' + esc(s.compName) + '</b>&nbsp;&nbsp;' + s.w + "×" + s.h +
          "&nbsp;&nbsp;·&nbsp;&nbsp;" + s.sel + " selected&nbsp;&nbsp;·&nbsp;&nbsp;" + s.tc
        : "No composition active. Open one to use the tools.";
      var el = document.getElementById("comp-status");
      if (el) el.classList.toggle("live", !!s.activeComp);
      window.HSX.onStatus && window.HSX.onStatus(s);
    } catch (e) { }
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- header ---------- */
  function refreshHeader() {
    document.getElementById("credits-num").textContent = STATE.credits;
    var p = HSX_BRAND.plans[STATE.plan];
    var b = document.getElementById("plan-badge");
    b.textContent = p.letter;
    b.title = "Plan: " + p.label;
    b.classList.toggle("pro", p.pro);
  }

  /* ---------- toast / modal ---------- */
  function toast(msg, kind, ms) {
    var box = document.getElementById("toasts");
    var t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s"; t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 320);
    }, ms || 2400);
  }

  function modal(opts) {
    // opts: {title, icon, sub, html, actions:[{label, kind, cb}], onOpen}
    var bd = document.getElementById("modal-backdrop");
    var box = document.getElementById("modal-box");
    var h = "";
    h += "<h3>" + (opts.icon || "") + "<span>" + esc(opts.title || "") + "</span></h3>";
    if (opts.sub) h += '<div class="m-sub">' + opts.sub + "</div>";
    if (opts.html) h += "<div>" + opts.html + "</div>";
    h += '<div class="m-actions">';
    (opts.actions || [{ label: "Close", cb: null }]).forEach(function (a, i) {
      h += '<button class="btn ' + (a.kind || "") + '" data-ma="' + i + '">' + esc(a.label) + "</button>";
    });
    h += "</div>";
    box.innerHTML = h;
    bd.classList.remove("hidden");
    box.querySelectorAll("[data-ma]").forEach(function (el) {
      el.addEventListener("click", function () {
        var a = (opts.actions || [])[parseInt(el.getAttribute("data-ma"), 10)];
        bd.classList.add("hidden");
        if (a && a.cb) a.cb();
      });
    });
    if (opts.onOpen) opts.onOpen(box);
  }

  function closeModal() { document.getElementById("modal-backdrop").classList.add("hidden"); }

  /* ---------- AI chat transport ---------- */
  function aiChat(messages, model, onDelta, onDone, onErr) {
    var a = STATE.ai;
    if (!a.apiKey) { onErr("no-key"); return; }
    var url = (a.baseUrl.replace(/\/+$/, "")) + "/chat/completions";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + a.apiKey);
    var full = "";
    xhr.onreadystatechange = function () {
      if (xhr.readyState < 3) return;
      if (xhr.readyState === 4) {
        var text = full;
        if (!text && xhr.responseText) {
          // non-streaming JSON
          try {
            var j = JSON.parse(xhr.responseText);
            text = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : (j.error ? j.error.message : xhr.responseText);
          } catch (e) { text = xhr.responseText; }
        }
        if (xhr.status >= 200 && xhr.status < 300 || text) { onDone(text); }
        else {
          var msg = "Request failed (" + xhr.status + ")";
          try { msg = JSON.parse(xhr.responseText).error.message || msg; } catch (e2) { }
          onErr(msg);
        }
      }
    };
    // SSE streaming
    xhr.onprogress = function () {
      var chunk = xhr.responseText.substring(full.length);
      full = xhr.responseText;
      var lines = chunk.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i].trim();
        if (l.indexOf("data: ") !== 0) continue;
        var data = l.substring(6);
        if (data === "[DONE]") continue;
        try {
          var j = JSON.parse(data);
          var d = j.choices && j.choices[0] && j.choices[0].delta;
          if (d && d.content) onDelta(d.content);
        } catch (e) { /* partial line */ }
      }
    };
    var body = {
      model: model,
      messages: messages,
      stream: true,
      max_tokens: 900
    };
    try { xhr.send(JSON.stringify(body)); }
    catch (e) { onErr("Network error: " + e.message); }
  }

  /* ---------- public ---------- */
  window.HSX_BRIDGE = {
    STATE: STATE,
    isAE: isAE,
    planIsPro: function () { return !!HSX_BRAND.plans[STATE.plan].pro; },
    bootAE: bootAE,
    cmd: cmd,
    pollStatus: pollStatus,
    spend: spend,
    canSpend: canSpend,
    costFor: costFor,
    save: save,
    refreshHeader: refreshHeader,
    toast: toast,
    modal: modal,
    closeModal: closeModal,
    esc: esc,
    aiChat: aiChat,
    load: load
  };
})();
