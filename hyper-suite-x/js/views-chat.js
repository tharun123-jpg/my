/* ================= views-chat.js — HyperAI assistant ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE;

  var CONVERSATION = []; // {role, content}
  var RENDERED = 0;      // how many messages already in DOM
  var AI_ON = false;     // key configured?

  var TOOLS = [
    ["apply_preset", "{presetId: 'sh_handheld'} — apply a library preset. IDs: sh_handheld, sh_earthq, zm_push, zm_punch, sl_left, tx_pop, ms_iris, cl_vintage, ot_adjust..."],
    ["transition",    "{id: 'flash'} — one-click transition at playhead. IDs: flash, shakeflash, zoomcut, parallel, whip, warp, glitch, pixel, iris, hyper"],
    ["fx",            "{effect: 'glow', on: true} — toggle an FX. IDs: glow, rays, warp, grain, blur, gauss, sharpen, chroma, vignette, tint, bw, exposure"],
    ["look",          "{id: 'teo'} — color look: clean, moody, vintage, teo, bw, pastel, punch, cold"],
    ["split_playhead", "{} — split selected layers at playhead"],
    ["marker",        "{} — drop marker at playhead"],
    ["resize_fit",    "{} — scale & center selected layers to comp"],
    ["purge",         "{} — purge all caches"],
    ["sfx",           "{id: 'impact'} — drop a sound: impact, boom, whoosh, riser, tick, click"]
  ];

  function systemPrompt() {
    var t = [];
    t.push("You are HyperAI, the built-in assistant inside Hyper Suite X for Adobe After Effects.");
    t.push("You help with motion design, VFX and editing tasks. Be concise (max ~120 words) and practical.");
    t.push("You can control After Effects. When the user asks for an action, include a fenced json block like:");
    t.push('```json\n{"ae_command":"transition","args":{"id":"flash"}}\n```');
    t.push("Available ae_commands:");
    TOOLS.forEach(function (r) { t.push("- " + r[0] + "  " + r[1]); });
    t.push("Use at most ONE ae_command per reply. If unsure which preset ID fits, pick the closest. Never invent command names outside this list.");
    return t.join("\n");
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  function renderShell() {
    var root = document.getElementById("chat-root");
    AI_ON = !!B.STATE.ai.apiKey;
    var models = B.STATE.ai;
    var mSel = models.customModel || (B.planIsPro() ? models.modelPro : models.modelFast);
    root.innerHTML =
      '<div class="chat-head">' +
        '<div class="ch-name"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" fill="currentColor"/></svg>HyperAI <span class="pill blue">BETA</span></div>' +
        '<span class="ch-note">HyperAI uses your credits faster than the tools. <a data-act="modelnote">Save credits by using a cheaper model.</a></span>' +
      '</div>' +
      '<div class="chat-comps" id="chat-comps"></div>' +
      '<div class="chat-msgs" id="chat-msgs"></div>' +
      '<div class="model-select">' +
        '<select id="ai-model">' +
          '<option value="fast">HyperAI Fast' + (models.modelFast ? " · " + models.modelFast : "") + '</option>' +
          '<option value="pro">HyperAI Pro' + (models.modelPro ? " · " + models.modelPro : "") + '</option>' +
          (models.customModel ? '<option value="custom">Custom · ' + B.esc(models.customModel) + '</option>' : '') +
        '</select>' +
        '<span style="font-size:10.5px;color:var(--tx3)" id="ai-model-note">' + (AI_ON ? "connected" : "no API key — demo mode") + '</span>' +
      '</div>' +
      '<div class="chat-input">' +
        '<input id="chat-input" placeholder="Ask for anything" autocomplete="off">' +
        '<button class="send" id="chat-send" title="Send (Ctrl+Enter)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div>';

    renderComps();
    rebind();

    // initial empty state
    var msgs = document.getElementById("chat-msgs");
    if (!CONVERSATION.length) {
      msgs.innerHTML =
        '<div class="chat-empty" id="chat-empty">' +
          '<div class="time">' + greeting() + '</div>' +
          '<div class="ask">What do you want to do?</div>' +
          '<div class="tip">Try: <b>“make the selected layer shake like a handheld camera”</b><br>' +
          'or <b>“add a flash transition at the playhead”</b><br><br>' +
          (AI_ON ? "Connected to your API." : "Demo mode — add an API key in <a data-act='openprofile'>Profile &amp; settings</a> for real answers.") +
        '</div>';
    }
    for (var i = 0; i < RENDERED; i++) appendMsg(CONVERSATION[i]);
  }

  function renderComps() {
    var box = document.getElementById("chat-comps");
    if (!box) return;
    box.innerHTML =
      '<div class="comp-chip active"><span class="dot"></span>' +
      (B.STATE.activeComp ? B.esc(B.STATE.compName) : "AlvarAI") +
      ' <span class="pill ' + (B.STATE.activeComp ? "green" : "gray") + '">' + (B.STATE.activeComp ? "LIVE" : "BETA") + '</span></div>' +
      '<button class="btn sm ghost" data-act="newcomp" style="margin-left:auto">+</button>';
  }

  function rebind() {
    var input = document.getElementById("chat-input");
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) { e.preventDefault(); send(); }
    });
    document.getElementById("chat-send").addEventListener("click", send);
    var root = document.getElementById("chat-root");
    root.addEventListener("click", function (e) {
      var el = e.target.closest("[data-act]");
      if (!el) return;
      var act = el.getAttribute("data-act");
      if (act === "modelnote") B.toast("Cheaper models (Fast tier) cost fewer credits per message.", "gold");
      if (act === "openprofile") window.HSX.go("profile");
      if (act === "newcomp") B.toast("Open or create a composition in After Effects first.");
    });
  }

  function appendMsg(m) {
    var empty = document.getElementById("chat-empty");
    if (empty) empty.remove();
    var box = document.getElementById("chat-msgs");
    var div = document.createElement("div");
    div.className = "msg " + (m.role === "user" ? "user" : "ai");
    var cmd = m.aeCmd ? JSON.parse(m.aeCmd) : null;
    div.innerHTML =
      '<div class="who">' + (m.role === "user" ? "YOU" : "HYPERAI") + '</div>' +
      '<div class="bubble">' + B.esc(m.content) + '</div>' +
      (cmd ? '<button class="ae-action" data-cmd>' +
             '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>' +
             'Apply in After Effects · ' + B.esc(cmd.ae_command) + '</button>' : '');
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  function selectedModel() {
    var sel = document.getElementById("ai-model");
    var v = sel ? sel.value : "fast";
    var a = B.STATE.ai;
    return v === "pro" ? a.modelPro : v === "custom" ? a.customModel : a.modelFast;
  }

  function send() {
    var input = document.getElementById("chat-input");
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    B.spend(B.costFor("ai"), "ai");
    CONVERSATION.push({ role: "user", content: text });
    appendMsg(CONVERSATION[CONVERSATION.length - 1]);
    RENDERED++;

    var holder = appendMsg({ role: "assistant", content: "" });
    var bubble = holder.querySelector(".bubble");
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    AI_ON = !!B.STATE.ai.apiKey;

    if (!AI_ON) { demoReply(text, bubble, holder); return; }

    var messages = [{ role: "system", content: systemPrompt() }];
    messages = messages.concat(CONVERSATION.slice(-10));
    var acc = "";
    var model = selectedModel();
    B.aiChat(messages, model,
      function (delta) {
        acc += delta;
        bubble.textContent = acc;
        var box = document.getElementById("chat-msgs");
        box.scrollTop = box.scrollHeight;
      },
      function (full) {
        acc = acc || full || "";
        var m = { role: "assistant", content: acc };
        var cmd = extractCmd(acc);
        if (cmd) m.aeCmd = JSON.stringify(cmd);
        CONVERSATION.push(m);
        finishMsg(holder, m);
      },
      function (err) {
        if (err === "no-key") { demoReply(text, bubble, holder); return; }
        bubble.textContent = "⚠ " + err + " — check the API settings in Profile & settings.";
      }
    );
  }

  function finishMsg(holder, m) {
    var bubble = holder.querySelector(".bubble");
    bubble.textContent = m.content;
    if (m.aeCmd) {
      var cmd = JSON.parse(m.aeCmd);
      var btn = document.createElement("button");
      btn.className = "ae-action";
      btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>Apply in After Effects · ' + B.esc(cmd.ae_command);
      btn.addEventListener("click", function () { runAECommand(cmd, btn); });
      holder.appendChild(btn);
    }
    var box = document.getElementById("chat-msgs");
    box.scrollTop = box.scrollHeight;
  }

  function extractCmd(text) {
    var re = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    var m = re.exec(text);
    if (!m) return null;
    try {
      var o = JSON.parse(m[1]);
      if (o && typeof o.ae_command === "string") return o;
    } catch (e) { }
    return null;
  }

  function runAECommand(cmd, btn) {
    var name = cmd.ae_command, args = cmd.args || {};
    if (btn) { btn.classList.add("done"); btn.textContent = "Applied ✓"; btn.disabled = true; }
    var mapping = {
      apply_preset: ["preset", args.presetId ? { preset: window.HSX_DATA.findPreset(args.presetId) } : null],
      transition:   ["transition", { id: args.id }],
      fx:           ["fx", { id: args.effect, on: args.on !== false }],
      look:         ["look", { id: args.id }],
      split_playhead: ["split", {}],
      marker:       ["marker", {}],
      resize_fit:   ["resize_fit", {}],
      purge:        ["purge", {}],
      sfx:          ["preset", { preset: null, sfxId: args.id }]
    };
    var m = mapping[name];
    if (!m || !m[1]) { B.toast("Unknown command: " + name, "err"); return; }
    if (!B.canSpend(m[0])) return;
    B.spend(B.costFor(m[0]), m[0]);
    var payload = m[1];
    if (name === "sfx") {
      var sp = window.HSX_DATA.findPreset("sfx_" + (args.id || "impact"));
      payload = { preset: sp, b64: window.HSX_SFX.synthesize(args.id || "impact") };
    }
    var r = B.cmd(m[0], payload);
    if (r && r.error) B.toast(r.error, "err");
    else B.toast("Done — " + name + " applied in After Effects", "ok");
  }

  function demoReply(text, bubble, holder) {
    // offline canned mode — still useful for UI testing
    var t = text.toLowerCase();
    var reply, cmd = null;
    if (/(shake|handheld|wiggle)/.test(t)) {
      reply = "On it — a handheld-style shake on your selected layers. In After Effects I'd apply the Handheld preset: 9 px amplitude over ~1.6 s with smooth random jitter. Click the button to run it (demo mode).";
      cmd = { ae_command: "apply_preset", args: { presetId: "sh_handheld" } };
    } else if (/(flash|transition|cut)/.test(t)) {
      reply = "A flash cut at the playhead is the safest pick: white additive solid, 0→100→0 opacity in 40 frames. Use the button below to apply it — or open Transitions for the full one-click set.";
      cmd = { ae_command: "transition", args: { id: "flash" } };
    } else if (/(zoom|dolly|push)/.test(t)) {
      reply = "Let's push in. I'd animate scale 100 → 112 over 4 seconds with a slow ease — that reads as a dolly without warping perspective.";
      cmd = { ae_command: "apply_preset", args: { presetId: "zm_push" } };
    } else if (/(color|grade|look|teal|moody)/.test(t)) {
      reply = "For a quick grade I'd go Teal & Orange: tint shadows teal, warm the highlights, squeeze the blacks and lift saturation a touch. One click.";
      cmd = { ae_command: "look", args: { id: "teo" } };
    } else if (/(glow|neon)/.test(t)) {
      reply = "Add the Glow FX toggle — radius 12, intensity 0.6, threshold 60. Toggle it on for the whole comp or selected layers.";
      cmd = { ae_command: "fx", args: { effect: "glow", on: true } };
    } else {
      reply = "I'm running in demo mode (no API key set). Connect any OpenAI-compatible API in Profile & settings and I'll answer for real — and I can execute actions directly in After Effects, like:\n\n• “make the selected layer shake like a handheld camera”\n• “add a flash transition at the playhead”\n• “grade this clip teal & orange”";
    }
    var m = { role: "assistant", content: reply };
    if (cmd) m.aeCmd = JSON.stringify(cmd);
    CONVERSATION.push(m);
    setTimeout(function () { finishMsg(holder, m); }, 700);
  }

  window.HSX_VIEW_CHAT = { render: renderShell, refresh: renderShell };
})();
