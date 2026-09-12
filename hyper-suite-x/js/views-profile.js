/* ================= views-profile.js — profile & settings ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;

  function renderShell() {
    var a = B.STATE.ai, plan = HSX_BRAND.plans[B.STATE.plan];
    var root = document.getElementById("profile-root");
    var h =
      '<div class="prof-hero">' +
        '<div class="prof-avatar">' + plan.letter + '</div>' +
        '<div><div class="ph-name">Creative — ' + plan.label + '</div>' +
        '<div class="ph-sub">Hyper Suite X v' + HSX_BRAND.version + ' · ' + (B.isAE() ? "running in After Effects" : "browser preview (mock AE)") + '</div></div>' +
      '</div>' +
      '<div class="prof-stats">' +
        '<div class="st"><div class="n">' + B.STATE.credits + '</div><div class="l">credits</div></div>' +
        '<div class="st"><div class="n">' + Object.keys(B.STATE.favorites).length + '</div><div class="l">favorites</div></div>' +
        '<div class="st"><div class="n">' + D.PRESETS.length + '</div><div class="l">presets</div></div>' +
        '<div class="st"><div class="n">' + D.TRANSITIONS.length + '</div><div class="l">transitions</div></div>' +
      '</div>' +

      '<div class="card prof-sec" style="margin-top:16px">' +
        '<h3>HYPERAI · API CONNECTION</h3>' +
        '<div class="field"><label>Provider (any OpenAI-compatible endpoint)</label>' +
          '<select id="pf-provider">' +
            '<option value="https://api.openai.com/v1"' + (a.baseUrl.indexOf("openai") >= 0 ? " selected" : "") + '>OpenAI</option>' +
            '<option value="https://openrouter.ai/api/v1"' + (a.baseUrl.indexOf("openrouter") >= 0 ? " selected" : "") + '>OpenRouter</option>' +
            '<option value="https://api.groq.com/openai/v1"' + (a.baseUrl.indexOf("groq") >= 0 ? " selected" : "") + '>Groq</option>' +
            '<option value="custom"' + (a.baseUrl.indexOf("openai") < 0 && a.baseUrl.indexOf("openrouter") < 0 && a.baseUrl.indexOf("groq") < 0 ? " selected" : "") + '>Custom base URL</option>' +
          '</select></div>' +
        '<div class="field" id="pf-customwrap"' + (a.baseUrl.indexOf("openai") < 0 && a.baseUrl.indexOf("openrouter") < 0 && a.baseUrl.indexOf("groq") < 0 ? "" : " style=\"display:none\"") + '><label>Base URL</label>' +
          '<input id="pf-base" value="' + B.esc(a.baseUrl) + '" placeholder="https://.../v1"></div>' +
        '<div class="field"><label>API key (stored locally, never uploaded)</label>' +
          '<input id="pf-key" type="password" value="' + B.esc(a.apiKey) + '" placeholder="sk-..."></div>' +
        '<div class="field"><label>Fast model (default)</label>' +
          '<input id="pf-fast" value="' + B.esc(a.modelFast) + '" placeholder="gpt-4o-mini"></div>' +
        '<div class="field"><label>Pro model</label>' +
          '<input id="pf-pro" value="' + B.esc(a.modelPro) + '" placeholder="gpt-4o">' +
          '<div class="hint">Cheaper models cost fewer credits per message — the chat UI recommends the Fast tier by default.</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:4px">' +
          '<button class="btn gold" id="pf-save">Save settings</button>' +
          '<button class="btn ghost" id="pf-test">Test connection</button>' +
        '</div>' +
        '<div id="pf-testout" style="font-size:11px;color:var(--tx3);margin-top:8px"></div>' +
      '</div>' +

      '<div class="card prof-sec">' +
        '<h3>CREDITS &amp; PLAN</h3>' +
        '<div class="prof-stats" style="margin-top:0;margin-bottom:12px">' +
          '<div class="st"><div class="n">B</div><div class="l">Basic · 300 cr</div></div>' +
          '<div class="st"><div class="n">P</div><div class="l">Pro · 2000 cr</div></div>' +
          '<div class="st"><div class="n">S</div><div class="l">Studio · 9999 cr</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn sm" id="pf-plan-b">Basic</button>' +
          '<button class="btn sm gold" id="pf-plan-p">Upgrade to Pro</button>' +
          '<button class="btn sm" id="pf-reset">Reset credits</button>' +
        '</div>' +
        '<div class="hint" style="margin-top:8px">Plans are local-only in this build — everything is unlocked, no server, no account.</div>' +
      '</div>' +

      '<div class="card prof-sec">' +
        '<h3>DATA</h3>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn sm" id="pf-export">Export settings (JSON)</button>' +
          '<button class="btn sm danger" id="pf-wipe">Wipe local data</button>' +
        '</div>' +
      '</div>' +

      '<div class="card prof-sec" style="margin-bottom:8px">' +
        '<h3>ABOUT</h3>' +
        '<ul>' +
          '<li>Hyper Suite X v' + HSX_BRAND.version + ' — a Hyper Suite X extension for Adobe After Effects (CEP 11 / AE 2023+).</li>' +
          '<li>Library presets, one-click transitions, ease editor, FX toggles, color looks, cut tools, render & export.</li>' +
          '<li>HyperAI works with any OpenAI-compatible API and can execute actions directly in After Effects.</li>' +
          '<li>All credits, plans and API keys live in your browser storage — nothing leaves your machine except the API chat calls you make.</li>' +
        '</ul>' +
      '</div>';
    root.innerHTML = h;
    bind();
  }

  function bind() {
    var prov = document.getElementById("pf-provider");
    var cwrap = document.getElementById("pf-customwrap");
    prov.addEventListener("change", function () {
      cwrap.style.display = prov.value === "custom" ? "" : "none";
    });
    document.getElementById("pf-save").addEventListener("click", function () {
      var a = B.STATE.ai;
      a.baseUrl = prov.value === "custom" ? (document.getElementById("pf-base").value.trim() || "https://api.openai.com/v1") : prov.value;
      a.apiKey = document.getElementById("pf-key").value.trim();
      a.modelFast = document.getElementById("pf-fast").value.trim() || "gpt-4o-mini";
      a.modelPro = document.getElementById("pf-pro").value.trim() || "gpt-4o";
      B.save();
      B.toast("Settings saved", "ok");
      B.refreshHeader();
    });
    document.getElementById("pf-test").addEventListener("click", function () {
      var out = document.getElementById("pf-testout");
      out.textContent = "Testing…";
      var a = B.STATE.ai;
      var baseUrl = prov.value === "custom" ? (document.getElementById("pf-base").value.trim() || a.baseUrl) : prov.value;
      var key = document.getElementById("pf-key").value.trim();
      if (!key) { out.textContent = "⚠ No API key entered."; return; }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", baseUrl.replace(/\/+$/, "") + "/models", true);
      xhr.setRequestHeader("Authorization", "Bearer " + key);
      xhr.onload = function () {
        out.textContent = xhr.status === 200 ? "✓ Connected — " + xhr.status + " OK, endpoint reachable." : "✗ HTTP " + xhr.status + " — check the key / URL.";
      };
      xhr.onerror = function () { out.textContent = "✗ Network error — endpoint not reachable from After Effects."; };
      xhr.send();
    });
    function setPlan(p) {
      B.STATE.plan = p;
      B.STATE.credits = HSX_BRAND.plans[p].maxCredits;
      B.save(); B.refreshHeader(); renderShell();
      B.toast("Plan set to " + HSX_BRAND.plans[p].label + " — " + B.STATE.credits + " credits", "gold");
    }
    document.getElementById("pf-plan-b").addEventListener("click", function () { setPlan("B"); });
    document.getElementById("pf-plan-p").addEventListener("click", function () { setPlan("P"); });
    document.getElementById("pf-reset").addEventListener("click", function () {
      B.STATE.credits = HSX_BRAND.plans[B.STATE.plan].maxCredits;
      B.save(); B.refreshHeader();
      B.toast("Credits reset to " + B.STATE.credits, "ok");
      renderShell();
    });
    document.getElementById("pf-export").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify({ credits: B.STATE.credits, plan: B.STATE.plan, favorites: B.STATE.favorites, ai: { baseUrl: B.STATE.ai.baseUrl, modelFast: B.STATE.ai.modelFast, modelPro: B.STATE.ai.modelPro } }, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "hyper-suite-x-settings.json";
      document.body.appendChild(a); a.click(); a.remove();
      B.toast("Settings exported", "ok");
    });
    document.getElementById("pf-wipe").addEventListener("click", function () {
      B.modal({
        title: "Wipe local data?",
        sub: "Credits, plan, favorites and API settings will be reset. Presets and code stay untouched.",
        actions: [
          { label: "Cancel", cb: null },
          { label: "Wipe", kind: "danger", cb: function () {
              try { localStorage.clear(); } catch (e) { }
              location.reload();
            } }
        ]
      });
    });
  }

  window.HSX_VIEW_PROF = { render: renderShell };
})();
