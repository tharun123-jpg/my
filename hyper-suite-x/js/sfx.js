/* ============================================================
   sfx.js — tiny synthesized sound effects (WAV, 16-bit PCM)
   Sent to After Effects as base64 and written by the JSX side.
   ============================================================ */
(function () {
  "use strict";

  var SR = 44100;

  function wavBase64(samples) {
    var n = samples.length;
    var buf = new ArrayBuffer(44 + n * 2);
    var v = new DataView(buf);
    function ws(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    ws(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); ws(8, "WAVE");
    ws(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    ws(36, "data"); v.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) {
      var x = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    // ArrayBuffer -> base64
    var bytes = new Uint8Array(buf), bin = "";
    var CH = 0x8000;
    for (var j = 0; j < bytes.length; j += CH) {
      bin += String.fromCharCode.apply(null, bytes.subarray(j, j + CH));
    }
    return btoa(bin);
  }

  function env(i, n, a, d) { // attack-decay envelope
    var t = i / n;
    if (t < a) return t / a;
    return Math.pow(1 - (t - a) / (1 - a), d);
  }

  function make(seedFn, durSec) {
    var n = Math.floor(SR * durSec), out = new Array(n);
    var seed = 1337;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < n; i++) out[i] = seedFn(i / n, i, n, rnd);
    return wavBase64(out);
  }

  window.HSX_SFX = {
    synthesize: function (id) {
      switch (id) {
        case "impact":
          return make(function (t, i, n, rnd) {
            var f = 82 - 48 * t;
            return Math.sin(2 * Math.PI * f * i / SR) * 0.8 * Math.pow(1 - t, 2.2) +
                   (rnd() * 2 - 1) * 0.25 * Math.pow(1 - t, 6);
          }, 0.55);
        case "boom":
          return make(function (t, i, n, rnd) {
            return Math.sin(2 * Math.PI * (48 - 14 * t) * i / SR) * 0.9 * Math.pow(1 - t, 1.6) +
                   Math.sin(2 * Math.PI * 96 * i / SR) * 0.25 * Math.pow(1 - t, 4) +
                   (rnd() * 2 - 1) * 0.08 * Math.pow(1 - t, 3);
          }, 0.9);
        case "whoosh":
          return make(function (t, i, n, rnd) {
            var lp = 0; // one-pole lowpass sweep 300 -> 4200 Hz
            var fc = 300 + Math.pow(t, 2) * 4000;
            var a = 2 * Math.PI * fc / SR;
            lp += a * (rnd() * 2 - 1 - lp) / (1 + a);
            return lp * 2.4 * Math.sin(Math.PI * t) * Math.sin(Math.PI * t);
          }, 0.7);
        case "riser":
          return make(function (t, i, n, rnd) {
            var f = 180 + Math.pow(t, 2.4) * 1100;
            return (Math.sin(2 * Math.PI * f * i / SR) * 0.5 +
                    (rnd() * 2 - 1) * 0.35 * t) * (0.35 + 0.65 * t);
          }, 1.3);
        case "tick":
          return make(function (t, i, n, rnd) {
            if (t > 0.05) return 0;
            var s = i % 2 ? 1 : -1;
            return (s * 0.5 + Math.sin(2 * Math.PI * 1900 * i / SR) * 0.5) * (1 - t / 0.05);
          }, 0.06);
        case "click":
          return make(function (t, i, n, rnd) {
            if (t > 0.12) return 0;
            var a = t < 0.01 ? t / 0.01 : 1;
            return (Math.sin(2 * Math.PI * 850 * i / SR) * 0.6 + (rnd() * 2 - 1) * 0.4 * (1 - t)) * a * (1 - t / 0.12);
          }, 0.13);
      }
      return make(function (t) { return Math.sin(2 * Math.PI * 440 * t) * 0.3 * (1 - t); }, 0.2);
    },
    list: [
      { id: "impact", name: "Impact",    desc: "Punchy hit for hard cuts" },
      { id: "boom",   name: "Boom",      desc: "Deep cinematic thud" },
      { id: "whoosh", name: "Whoosh",    desc: "Fast transition sweep" },
      { id: "riser",  name: "Riser",     desc: "Build-up tension sweep" },
      { id: "tick",   name: "Tick",      desc: "UI / editing tick" },
      { id: "click",  name: "Click",     desc: "Light interface click" }
    ]
  };
})();
