/* ================= views-fx.js — FX toggles ================= */
(function () {
  "use strict";
  var B = window.HSX_BRIDGE, D = window.HSX_DATA;
  var target = "comp"; // comp | layers
  var state = {}; // id -> bool (last known state)
  var allOn = false;

  function renderShell() {
    var root = document.getElementById("fx-root");
    var h =
      '<div class="view-title">' +
        '<div class="vt-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.7"/></svg></div>' +
        '<h2>FX</h2>' +
        '<div class="vt-search"><input id="fx-search" placeholder="Search..."></div>' +
        '<button class="vt-refresh" id="fx-refresh" title="Refresh states"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div>' +
      '<div class="fx-target">' +
        '<button class="tab' + (target === "comp" ? " active" : "") + '" data-ft="comp">Whole comp</button>' +
        '<button class="tab' + (target === "layers" ? " active" : "") + '" data-ft="layers">Selected layers</button>' +
      '</div>' +
      '<div class="fx-all-row"><span>All effects</span>' +
        '<label class="switch"><input type="checkbox" id="fx-all" ' + (allOn ? "checked" : "") + '><span class="sl"></span></label>' +
      '</div>' +
      '<div class="fx-list" id="fx-list"></div>';
    root.innerHTML = h;
    renderList();
    bind();
  }

  function renderList() {
    var q = (document.getElementById("fx-search") || { value: "" }).value.toLowerCase();
    var list = document.getElementById("fx-list");
    var h = "";
    D.FX.forEach(function (fx) {
      if (q && fx.name.toLowerCase().indexOf(q) < 0) return;
      var on = !!state[fx.id];
      h += '<div class="fx-item' + (on ? " on" : "") + '" data-fx="' + fx.id + '">' +
        '<div><div class="fx-name">' + fx.name + '</div><div class="fx-desc">' + fx.desc + '</div></div>' +
        '<label class="switch"><input type="checkbox" ' + (on ? "checked" : "") + '><span class="sl"></span></label>' +
        '</div>';
    });
    list.innerHTML = h || '<div class="card center" style="width:100%"><div class="big">No FX match your search</div></div>';
  }

  function refreshStates() {
    var r = B.cmd("fx_state", { target: target });
    if (r && !r.error) {
      D.FX.forEach(function (fx) { state[fx.id] = !!r.states[fx.id]; });
      allOn = D.FX.every(function (fx) { return state[fx.id]; });
      renderShell();
    }
  }

  function bind() {
    document.getElementById("fx-search").addEventListener("input", renderList);
    document.getElementById("fx-refresh").addEventListener("click", function () {
      refreshStates();
    });
    document.getElementById("fx-all").addEventListener("change", function (e) {
      allOn = e.target.checked;
      if (!B.canSpend("fx")) return;
      B.spend(B.costFor("fx"), "fx");
      var r = B.cmd("fx", { all: allOn, target: target });
      if (r && r.error) B.toast(r.error, "err");
      else B.toast(allOn ? "All FX on" : "All FX off", "ok");
      D.FX.forEach(function (fx) { state[fx.id] = allOn; });
      renderList();
    });
    document.querySelectorAll("[data-ft]").forEach(function (el) {
      el.addEventListener("click", function () {
        target = el.getAttribute("data-ft");
        state = {}; allOn = false;
        renderShell();
      });
    });
    document.getElementById("fx-list").addEventListener("click", function (e) {
      var item = e.target.closest("[data-fx]");
      if (!item) return;
      var id = item.getAttribute("data-fx");
      var next = !state[id];
      state[id] = next;
      var inp = item.querySelector("input");
      if (inp) inp.checked = next;
      item.classList.toggle("on", next);
      if (!B.canSpend("fx")) { state[id] = !next; item.classList.remove("on"); if (inp) inp.checked = !next; return; }
      B.spend(B.costFor("fx"), "fx");
      var fx = null;
      D.FX.forEach(function (f) { if (f.id === id) fx = f; });
      var r = B.cmd("fx", { id: id, on: next, target: target });
      if (r && r.error) { B.toast(r.error, "err"); state[id] = !next; item.classList.toggle("on", state[id]); }
    });
  }

  window.HSX_VIEW_FX = { render: renderShell, refreshStates: refreshStates };
})();
