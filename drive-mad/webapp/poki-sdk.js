// Minimal offline stub of the Poki SDK (no network calls).
// init/commercialBreak resolve immediately so the game starts when the Play
// button is pressed. rewardedBreak is routed through the reward-spinner.js
// "Lucky Spin" overlay: a 1-in-10,000 spin grants the reward, anything else
// reloads the page so the request never completes and nothing is granted.
(function () {
  "use strict";
  var api = {
    init: function () { return Promise.resolve(); },
    initWithVideoHB: function () { return Promise.resolve(); },
    commercialBreak: function () { return Promise.resolve(); },
    rewardedBreak: function () {
      try {
        if (window.RewardedSpinner && typeof window.RewardedSpinner.play === "function") {
          return window.RewardedSpinner.play();
        }
      } catch (err) {
        console.error("[Drive Mad] reward spinner failed to start:", err);
      }
      console.error("[Drive Mad] reward-spinner.js unavailable; the game may grant this reward unconditionally.");
      return Promise.resolve(false);
    },
    displayAd: function (id, name, cb, done) { if (cb) cb(); if (done) done(true); },
    destroyAd: function () {},
    getLeaderboard: function () { return Promise.resolve([]); },
    shareableURL: function () { return Promise.resolve(window.location.href); },
    getURLParam: function (name) {
      var m = new RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
      return m ? decodeURIComponent(m[1]) : "";
    },
    getLanguage: function () { return (navigator.language || "en").split("-")[0]; },
    getDeviceInfo: function () { return { category: "desktop" }; },
    isAdBlocked: function () { return true; },
    getUser: function () { return Promise.resolve(null); },
    getToken: function () { return Promise.resolve("local-token"); },
    login: function () { return Promise.resolve(null); },
    generateScreenshot: function () { return Promise.resolve(null); },
    // fire-and-forget methods
    setDebug: function () {}, setLogging: function () {}, muteAd: function () {},
    happytime: function () {}, happyTime: function () {},
    captureError: function () {}, customEvent: function () {}, logError: function () {},
    sendHighscore: function () {}, setPlayerAge: function () {},
    roundStart: function () {}, roundEnd: function () {},
    gameplayStart: function () {}, gameplayStop: function () {},
    gameLoadingStart: function () {}, gameLoadingProgress: function () {}, gameLoadingFinished: function () {},
    gameInteractive: function () {}, openExternalLink: function () {},
    showLeaderboard: function () {}, setDebugTouchOverlayController: function () {},
  };
  window.PokiSDK = api;
})();
