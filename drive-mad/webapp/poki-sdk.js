// Minimal offline stub of the Poki SDK (no network calls).
// Loads the "SDK is not loaded yet" fallback behavior: init/commercialBreak
// resolve immediately so the game starts when the Play button is pressed.
(function () {
  "use strict";
  var api = {
    init: function () { return Promise.resolve(); },
    initWithVideoHB: function () { return Promise.resolve(); },
    commercialBreak: function () { return Promise.resolve(); },
    rewardedBreak: function () { return Promise.resolve(true); },
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
