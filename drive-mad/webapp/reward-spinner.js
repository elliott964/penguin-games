// "Lucky Spin" - replaces rewarded ads in Drive Mad.
//
// Whenever the game asks PokiSDK for a rewarded ad, this overlay opens and
// spins a prize wheel. The outcome is a straight 1-in-10,000 roll:
//
//   JACKPOT (1/10000) -> the promise resolves true, the game grants the reward
//   anything else     -> the page reloads; the ad request dies with it and
//                        the game grants nothing
//
// The promise is never resolved with false on purpose: Drive Mad applies its
// rewards whenever the ad flow *finishes*, regardless of the result value
// (verified against the shipped wasm), so resolving false would hand out the
// reward anyway. Reloading aborts the flow instead.
//
// Public API: window.RewardedSpinner.play() -> Promise<boolean>
(function () {
  "use strict";

  var WIN_CHANCE = 1 / 10000;     // chance to land on the jackpot
  var SPIN_TURNS = 7;             // full rotations before landing
  var SPIN_DURATION_MS = 5600;    // how long the wheel spins
  var SPIN_START_DELAY_MS = 500;  // small beat before the wheel starts moving
  var RESULT_PAUSE_MS = 2000;     // how long the result stays on screen

  var LABELS = ["NOPE", "MISS", "ZERO", "DUD", "FLOP", "JACKPOT", "NIL", "EMPTY", "OOPS", "NAH"];
  var WINNER_INDEX = 5;

  var activePromise = null;
  var stylesInjected = false;

  // ---------------------------------------------------------------- helpers

  function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var key in attrs) {
      node.setAttribute(key, attrs[key]);
    }
    return node;
  }

  function setGameFocus(focus) {
    // The engine helper exists as an implicit global; best effort only.
    try {
      if (typeof window.setGameFocus === "function") {
        window.setGameFocus(focus);
      } else if (window.Module && window.Module.ccall) {
        window.Module.ccall("set_game_focus", "v", ["number"], [focus ? 1 : 0]);
      }
    } catch (err) {}
  }

  function ensureStyles() {
    if (stylesInjected) {
      return;
    }
    var css = [
      "#rws-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow-y:auto;background:radial-gradient(120% 90% at 50% 0%,rgba(43,54,76,.97) 0%,rgba(7,10,16,.99) 60%),#05070c;color:#dbe4f2;font-family:Consolas,'Lucida Console',Menlo,monospace;-webkit-user-select:none;user-select:none;animation:rws-fade .15s ease-out;}",
      "@keyframes rws-fade{from{opacity:0}to{opacity:1}}",
      "@keyframes rws-pulse{0%,100%{opacity:1}50%{opacity:.45}}",
      ".rws-panel{width:100%;max-width:480px;box-sizing:border-box;background:#0c1017;border:1px solid #2a3548;border-top:3px solid #ffb300;border-radius:12px;padding:22px 26px 24px;box-shadow:0 24px 80px rgba(0,0,0,.7);text-align:center;}",
      ".rws-kicker{font-size:11px;letter-spacing:.34em;color:#ffb300;margin-bottom:8px;}",
      ".rws-title{margin:0 0 8px;font-size:26px;line-height:1.1;letter-spacing:.06em;color:#fff;text-shadow:0 0 30px rgba(255,179,0,.25);}",
      ".rws-sub{margin:0;font-size:13px;line-height:1.55;color:#93a1b8;}",
      ".rws-wheel-wrap{position:relative;width:min(300px,72vw);height:min(300px,72vw);margin:22px auto 4px;}",
      ".rws-wheel{display:block;width:100%;height:100%;transform-origin:50% 50%;will-change:transform;}",
      ".rws-label{fill:#cfd9ea;font-family:inherit;font-size:8px;font-weight:700;letter-spacing:.05em;}",
      ".rws-label-win{fill:#231800;}",
      ".rws-pointer{position:absolute;top:-10px;left:50%;width:30px;height:24px;transform:translateX(-50%);filter:drop-shadow(0 3px 6px rgba(0,0,0,.55));z-index:2;}",
      ".rws-hub{position:absolute;left:50%;top:50%;width:23%;height:23%;transform:translate(-50%,-50%);background:#0c1017;border:2px solid #ffb300;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#ffd766;letter-spacing:.04em;z-index:1;}",
      ".rws-status{margin-top:16px;font-size:14px;letter-spacing:.14em;color:#ffd766;min-height:20px;}",
      ".rws-status.good{color:#5ef08a;text-shadow:0 0 18px rgba(94,240,138,.5);}",
      ".rws-status.bad{color:#ff6b6b;text-shadow:0 0 18px rgba(255,107,107,.45);}",
      ".rws-odds{margin-top:10px;font-size:11px;letter-spacing:.08em;color:#6f819f;}",
      "@media (max-width:480px){.rws-panel{padding:16px}.rws-title{font-size:20px}.rws-status{font-size:12px}}",
    ].join("\n");

    var style = document.createElement("style");
    style.id = "rws-style";
    style.textContent = css;
    document.head.appendChild(style);
    stylesInjected = true;
  }

  // ------------------------------------------------------------------- view

  function buildWheel() {
    var n = LABELS.length;
    var step = 360 / n;
    var svg = svgEl("svg", { viewBox: "-100 -100 200 200", "class": "rws-wheel" });
    var i;

    for (i = 0; i < n; i++) {
      var c = i * step;
      var a0 = ((c - step / 2) * Math.PI) / 180;
      var a1 = ((c + step / 2) * Math.PI) / 180;
      svg.appendChild(svgEl("path", {
        d: "M0 0 L" + (Math.cos(a0) * 96).toFixed(2) + " " + (Math.sin(a0) * 96).toFixed(2) +
           " A96 96 0 0 1 " + (Math.cos(a1) * 96).toFixed(2) + " " + (Math.sin(a1) * 96).toFixed(2) + " Z",
        fill: i === WINNER_INDEX ? "#ffb300" : i % 2 ? "#1c2637" : "#141b27",
        stroke: "#0a0e14",
        "stroke-width": "1",
      }));
    }

    for (i = 0; i < n; i++) {
      var center = (i * step * Math.PI) / 180;
      var lx = (Math.cos(center) * 62).toFixed(2);
      var ly = (Math.sin(center) * 62).toFixed(2);
      var text = svgEl("text", {
        x: lx,
        y: ly,
        transform: "rotate(" + i * step + " " + lx + " " + ly + ")",
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "class": "rws-label" + (i === WINNER_INDEX ? " rws-label-win" : ""),
      });
      text.textContent = LABELS[i];
      svg.appendChild(text);
    }

    svg.appendChild(svgEl("circle", { r: "96", fill: "none", stroke: "#2a3548", "stroke-width": "5" }));
    svg.appendChild(svgEl("circle", { r: "99.5", fill: "none", stroke: "#ffb300", "stroke-width": "1", "stroke-opacity": "0.45" }));
    return svg;
  }

  function buildOverlay() {
    ensureStyles();

    var overlay = makeEl("div");
    overlay.id = "rws-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Lucky Spin");

    var panel = makeEl("div", "rws-panel");
    panel.appendChild(makeEl("div", "rws-kicker", "REWARDED AD INTERCEPTED"));
    panel.appendChild(makeEl("h1", "rws-title", "THE 1 IN 10,000 SPIN"));
    panel.appendChild(makeEl("p", "rws-sub", "One segment pays out. The rest refresh the page. Spin it and pray."));

    var wrap = makeEl("div", "rws-wheel-wrap");
    var wheel = buildWheel();
    wrap.appendChild(wheel);

    var pointer = svgEl("svg", { viewBox: "0 0 28 22", "class": "rws-pointer" });
    pointer.appendChild(svgEl("polygon", { points: "1,1 27,1 14,21", fill: "#ffb300", stroke: "#6b4a00", "stroke-width": "1" }));
    pointer.appendChild(svgEl("polygon", { points: "4,3 24,3 14,18", fill: "#ffd766", opacity: "0.35" }));
    wrap.appendChild(pointer);

    wrap.appendChild(makeEl("div", "rws-hub", "1/10K"));
    panel.appendChild(wrap);

    var status = makeEl("div", "rws-status", "SPINNING...");
    panel.appendChild(status);
    panel.appendChild(makeEl("div", "rws-odds", "Odds of a payout: 1 in 10,000 \u00b7 no payout = instant reload"));

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    return { overlay: overlay, wheel: wheel, status: status };
  }

  // -------------------------------------------------------------- game loop

  function start(resolve) {
    var ui = buildOverlay();
    var rotation = 0;
    var settled = false;

    setGameFocus(false);

    function setStatus(text, tone) {
      ui.status.textContent = text;
      ui.status.className = "rws-status" + (tone ? " " + tone : "");
    }

    function spin() {
      var win = Math.random() < WIN_CHANCE;
      var index = win ? WINNER_INDEX : Math.floor(Math.random() * LABELS.length);
      if (index === WINNER_INDEX && !win) {
        index = (index + 1) % LABELS.length; // never fake-land on the jackpot
      }

      var step = 360 / LABELS.length;
      var jitter = (Math.random() * 2 - 1) * step * 0.3;
      var targetMod = ((((270 - index * step + jitter) % 360) + 360) % 360);
      var currentMod = ((rotation % 360) + 360) % 360;
      var delta = ((((targetMod - currentMod) % 360) + 360) % 360);
      var from = rotation;
      var total = 360 * SPIN_TURNS + delta;
      var startTime = performance.now();

      function frame(now) {
        var t = Math.min(1, (now - startTime) / SPIN_DURATION_MS);
        var eased = 1 - Math.pow(1 - t, 4);
        rotation = from + total * eased;
        ui.wheel.style.transform = "rotate(" + rotation.toFixed(3) + "deg)";
        if (t < 1) {
          requestAnimationFrame(frame);
          return;
        }
        rotation = from + total;
        settle(win);
      }
      requestAnimationFrame(frame);
    }

    function settle(win) {
      if (settled) {
        return;
      }
      settled = true;
      if (win) {
        setStatus("JACKPOT \u2014 REWARD EARNED!", "good");
        setTimeout(function () {
          setGameFocus(true);
          if (ui.overlay.parentNode) {
            ui.overlay.parentNode.removeChild(ui.overlay);
          }
          activePromise = null;
          resolve(true);
        }, RESULT_PAUSE_MS);
      } else {
        setStatus("NO LUCK \u2014 REFRESHING THE PAGE...", "bad");
        setTimeout(function () {
          location.reload();
        }, RESULT_PAUSE_MS);
      }
    }

    setTimeout(spin, SPIN_START_DELAY_MS);
  }

  // ------------------------------------------------------------ public API

  function play() {
    if (activePromise) {
      return activePromise;
    }
    activePromise = new Promise(function (resolve) {
      if (typeof document === "undefined" || !document.body) {
        activePromise = null;
        resolve(false);
        return;
      }
      try {
        start(resolve);
      } catch (err) {
        activePromise = null;
        if (window.console && console.error) {
          console.error("[reward-spinner] failed to start", err);
        }
        resolve(false);
      }
    });
    return activePromise;
  }

  window.RewardedSpinner = {
    play: play,
    winChance: WIN_CHANCE,
    labels: LABELS,
  };
})();
