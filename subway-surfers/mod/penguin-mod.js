/**
 * ============================================================================
 *  Penguin Infinity Mod for Subway Surfers Web  (local build)
 * ============================================================================
 *
 *  The penguin button in the bottom-right corner toggles "infinity mode":
 *
 *    ON   Every keys/coins counter that is showing (menu wallet strips, the
 *         in-run HUD coin counter, the game-over board) displays ":)" and
 *         your wallet acts as infinite: purchases and revives are free and
 *         never decrease your saved keys/coins.
 *
 *    OFF  Everything is back to your legit saved stats.
 *
 *  Your save is never touched while the mode is on. The currencies are only
 *  faked in memory through accessor overrides:
 *
 *    - app.user 'keys'/'coins' getters return a huge number, setters no-op,
 *      so every "you.coins -= cost" spend succeeds but writes nothing.
 *    - the wallet tag widgets (ug/wv) show ":)" while their internal
 *      numeric value keeps tracking the real game flow.
 *    - the run HUD counter widget (Fm) and the game-over score board (Uv)
 *      get instance-level patches.
 *
 *  Counters that are on screen update instantly on click: every known tag
 *  is re-labelled directly and the game's own settings-change refresh runs
 *  (tweens are pre-empted so the swap is immediate).
 *
 *  ------------------------------------------------------------------------
 *  Graphics: Twemoji "Penguin" U+1F427 (github.com/twemoji / jdecked/twemoji),
 *  artwork licensed CC-BY 4.0. See ./penguin.svg and ./README.md.
 *
 *  License: do whatever you want with the mod code.
 * ============================================================================
 */

import { t as app } from '../assets/index-QNpTjs8S.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const READY_POLL_MS = 250;          // how often we check game readiness
const FAKE_TEXT = ':)';             // what counters show while ON
const FAKE_VALUE = 999999999;       // what wallet math sees while ON
const STORAGE_KEY = 'PenguinMod.infinite';
const PRIZE_SCREEN_ASSET = 'prizescreen-bg.png';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let ready = false;                  // true once the game is fully booted
let infiniteON = false;             // toggle state
let bootRestoreDone = false;        // applied the persisted state yet?
let userPatch = null;               // { user } while the user override is installed
let tagPatches = null;              // { ugProto, wvProto, coinsDesc, keysDesc }
let hudPatched = false;             // run HUD counter wrapped
let sbPatched = false;              // game-over score board wrapped
const walletKeysTags = new Set();   // wv instances that belong to a wallet strip (Tv)
const walletCoinsTags = new Set();  // ug instances that belong to a wallet strip (Tv)

// ---------------------------------------------------------------------------
// Ready check (same as before: wait for a fully booted game)
// ---------------------------------------------------------------------------
function hasCachedAsset(cache, name) {
  if (!cache) return false;
  if (cache[name]) return true;
  for (const key in cache) {
    if (key === name || key.endsWith('/' + name)) return true;
  }
  return false;
}

function computeReady() {
  try {
    if (!app || !app.prizeScreen || !app.stage) return false;
    const view = app.stage.view;
    if (!view || !view.parentNode) return false;             // canvas attached to DOM
    const cache = app.resources && app.resources.cache;
    if (hasCachedAsset(cache, PRIZE_SCREEN_ASSET)) return true;
    return !document.getElementById('message') && !!app.user && !!app.title;
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Wallet tag patches (menu currency strips: Tv -> ug / wv tag widgets)
// ---------------------------------------------------------------------------
function isWalletTag(tag) {
  // A wallet tag's parent is its Tv strip (which owns both coinsTag & keysTag)
  const p = tag && tag.parent;
  if (!p) return false;
  return (p.coinsTag === tag || p.keysTag === tag) && !!p.coinsTag && !!p.keysTag;
}

function installTagPatches() {
  if (tagPatches) return true;
  try {
    const prize = app.prizeScreen;
    if (!prize) return false;
    if (!prize.currencies) prize.build();                  // builds the screen's Tv strip
    const tv = prize.currencies;
    if (!tv || !tv.coinsTag || !tv.keysTag) return false;

    const ugProto = Object.getPrototypeOf(tv.coinsTag);    // coins tag class
    const wvProto = Object.getPrototypeOf(tv.keysTag);     // keys tag class
    const coinsDesc = Object.getOwnPropertyDescriptor(ugProto, 'coins');
    const keysDesc = Object.getOwnPropertyDescriptor(wvProto, 'keys');
    if (!coinsDesc || !coinsDesc.set || !keysDesc || !keysDesc.set) return false;

    tagPatches = { ugProto, wvProto, coinsDesc, keysDesc };

    Object.defineProperty(ugProto, 'coins', {
      configurable: true,
      enumerable: coinsDesc.enumerable,
      get() {
        if (walletCoinsTags.has(this) && this.__pmWalletValue !== undefined) return this.__pmWalletValue;
        return coinsDesc.get.call(this);
      },
      set(v) {
        if (!isWalletTag(this)) { coinsDesc.set.call(this, v); return; }   // prices/prizes stay real
        walletCoinsTags.add(this);
        this.__pmWalletValue = v;
        if (this.label) this.label.text = infiniteON ? FAKE_TEXT : String(v);
      }
    });

    Object.defineProperty(wvProto, 'keys', {
      configurable: true,
      enumerable: keysDesc.enumerable,
      get() {
        if (walletKeysTags.has(this) && this.__pmWalletValue !== undefined) return this.__pmWalletValue;
        return keysDesc.get.call(this);
      },
      set(v) {
        if (!isWalletTag(this)) { keysDesc.set.call(this, v); return; }    // costs stay real
        walletKeysTags.add(this);
        this.__pmWalletValue = v;
        if (this.label) this.label.text = infiniteON ? FAKE_TEXT : String(v);
      }
    });

    return true;
  } catch (err) {
    console.warn('[PenguinMod] tag patch failed', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// User state patch: infinite wallet while ON, untouched save
// ---------------------------------------------------------------------------
function installUserInfinity() {
  try {
    const user = app.user;
    if (!user || user.__pmInfOn) return !!user;
    Object.defineProperty(user, 'coins', {
      configurable: true, enumerable: false,
      get: () => FAKE_VALUE,
      set: () => {}                       // spends succeed but write nothing
    });
    Object.defineProperty(user, 'keys', {
      configurable: true, enumerable: false,
      get: () => FAKE_VALUE,
      set: () => {}
    });
    user.__pmInfOn = true;
    userPatch = { user };
    return true;
  } catch (err) {
    console.warn('[PenguinMod] user patch failed', err);
    return false;
  }
}

function removeUserInfinity() {
  try {
    if (userPatch && userPatch.user) {
      delete userPatch.user.coins;        // own props shadow the prototype accessors
      delete userPatch.user.keys;
      userPatch.user.__pmInfOn = false;
    }
  } catch (err) { /* ignore */ }
  userPatch = null;
}

// ---------------------------------------------------------------------------
// Run HUD coin counter (Fm widget: digit slots)
// ---------------------------------------------------------------------------
function renderFakeFm(fm) {
  try {
    const kids = fm && fm.text && fm.text.children;
    if (!kids || !kids.length) return false;
    const n = kids.length;
    const c1 = Math.floor((n - 1) / 2);
    const c2 = Math.min(n - 1, c1 + 1);
    for (let i = 0; i < n; i++) {
      const kid = kids[i];
      if (i === c1) { kid.text = ':'; kid.visible = true; }
      else if (i === c2) { kid.text = ')'; kid.visible = true; }
      else { kid.text = ''; kid.visible = false; }
    }
    return true;
  } catch (err) { return false; }
}

function patchHudCounter() {
  const hud = app.game && app.game.hud;
  if (!hud || !hud.coins || hud.coins.__pmPatched) return;
  if (!hud._built || !hud.coins.text || !hud.coins.text.children) return;
  const c = hud.coins;
  c.__pmPatched = true;
  c.__pmOrigSetText = c.setText.bind(c);
  c.setText = function (v, pad = 0) {
    c.__pmLastArgs = [v, pad];
    if (infiniteON) {
      c.__pmTxt = v;                       // keep the numeric state coherent
      c['_txt'] = v;
      renderFakeFm(c);
    } else {
      c.__pmOrigSetText(v, pad);
    }
  };
  if (infiniteON) renderFakeFm(c);
}

// ---------------------------------------------------------------------------
// Game-over score board (Uv widget: score + coins texts)
// ---------------------------------------------------------------------------
function patchScoreboard() {
  const sb = app.gameover && app.gameover.scoreboard;
  if (!sb || sb.__pmPatched) return;
  sb.__pmPatched = true;
  sb.__pmOrigUpdate = sb.update.bind(sb);
  sb.update = function (data) {
    sb.__pmData = data;
    sb.__pmOrigUpdate(data);
    if (infiniteON && sb.coins) sb.coins.text = FAKE_TEXT;
  };
  if (infiniteON && sb.coins && sb.coins.text !== undefined && sb.coins.text !== FAKE_TEXT) {
    sb.__pmPrevText = sb.coins.text;
    sb.coins.text = FAKE_TEXT;
  }
}

// ---------------------------------------------------------------------------
// Refresh everything that is currently showing
// ---------------------------------------------------------------------------
function refreshCounters() {
  try {
    const user = app.user;

    if (infiniteON) {
      for (const t of walletKeysTags) {
        t.__pmWalletValue = FAKE_VALUE;                  // pre-empt the tween: instant swap
        if (t.label) t.label.text = FAKE_TEXT;
      }
      for (const t of walletCoinsTags) {
        t.__pmWalletValue = FAKE_VALUE;
        if (t.label) t.label.text = FAKE_TEXT;
      }
    } else if (user) {
      const realKeys = user.keys;                        // override already removed: real values
      const realCoins = user.coins;
      for (const t of walletKeysTags) {
        t.__pmWalletValue = realKeys;
        if (t.label) t.label.text = String(realKeys);
      }
      for (const t of walletCoinsTags) {
        t.__pmWalletValue = realCoins;
        if (t.label) t.label.text = String(realCoins);
      }
    }

    // the game's own refresh broadcast (covers any strip we never touched;
    // tweens are skipped since the values above already match)
    const sig = user && user.onGameSettingsChange;
    if (sig && sig.dispatch) sig.dispatch();

    // run HUD
    const hudCoins = app.game && app.game.hud && app.game.hud.coins;
    if (hudCoins && hudCoins.__pmPatched) {
      if (infiniteON) {
        renderFakeFm(hudCoins);
      } else {
        // clear every slot (incl. any fake glyphs), then let the original renderer repaint
        const kids = hudCoins.text && hudCoins.text.children;
        if (kids) {
          for (let i = 0; i < kids.length; i++) { kids[i].text = ''; kids[i].visible = false; }
        }
        hudCoins['_txt'] = null;                         // force a re-render
        const args = hudCoins.__pmLastArgs ||
          [Number(app.game.stats && app.game.stats.coins) || 0, 0];
        hudCoins.__pmOrigSetText(args[0], args[1]);
      }
    }

    // game-over score board
    const sb = app.gameover && app.gameover.scoreboard;
    if (sb && sb.__pmPatched && sb.coins) {
      if (infiniteON) {
        if (sb.coins.text !== undefined && sb.coins.text !== FAKE_TEXT) sb.__pmPrevText = sb.coins.text;
        sb.coins.text = FAKE_TEXT;
      } else if (sb.__pmData && sb.__pmData.coins !== undefined) {
        sb.coins.text = String(sb.__pmData.coins);
      } else if (sb.__pmPrevText !== undefined && sb.__pmPrevText !== FAKE_TEXT) {
        sb.coins.text = sb.__pmPrevText;
      }
    }
  } catch (err) {
    console.warn('[PenguinMod] refresh failed', err);
  }
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------
function setInfinite(on, opts = {}) {
  infiniteON = !!on;

  if (infiniteON) {
    installTagPatches();
    installUserInfinity();
  } else {
    removeUserInfinity();
  }

  refreshCounters();

  try { localStorage.setItem(STORAGE_KEY, infiniteON ? '1' : '0'); } catch (err) { /* ignore */ }

  updateButton();
  if (!opts.silent) {
    spawnFloater(infiniteON ? '\u221E' : '\u2713', infiniteON);
    try { app.sound && app.sound.play && app.sound.play('gui-tap'); } catch (err) { /* optional */ }
  }
  console.log('[PenguinMod] infinity mode ' + (infiniteON ? 'ON' : 'OFF'));
}

// ---------------------------------------------------------------------------
// Button UI
// ---------------------------------------------------------------------------
const PENGUIN_SVG_URL = new URL('./penguin.svg', import.meta.url).href;

const styleEl = document.createElement('style');
styleEl.textContent = `
#penguin-mod-btn {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right, 0px));
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  width: 62px;
  height: 62px;
  padding: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.92);
  background: radial-gradient(circle at 32% 26%, #ffc24d 0%, #f87b1e 48%, #f65000 100%);
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.45), inset 0 -5px 10px rgba(140, 40, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2147483000;
  transition: transform 0.12s ease, opacity 0.25s ease, filter 0.25s ease,
              border-color 0.2s ease, box-shadow 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
  outline: none;
}
#penguin-mod-btn img {
  width: 74%;
  height: 74%;
  pointer-events: none;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}
#penguin-mod-btn[data-ready="1"]:hover { transform: scale(1.07); }
#penguin-mod-btn[data-ready="1"]:active,
#penguin-mod-btn.penguin-pulse { transform: scale(0.9); }
#penguin-mod-btn[data-ready="0"] {
  cursor: progress;
  opacity: 0.5;
  filter: grayscale(0.9);
}
#penguin-mod-btn.penguin-inf {
  border-color: #7cff6b;
  box-shadow: 0 0 18px rgba(124, 255, 107, 0.85), 0 5px 16px rgba(0, 0, 0, 0.45),
              inset 0 -5px 10px rgba(140, 40, 0, 0.35);
}
#penguin-mod-btn.penguin-inf::after {
  content: '\u221E';
  position: absolute;
  top: -7px;
  right: -7px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #35d435;
  border: 2px solid #fff;
  color: #fff;
  font: bold 15px/22px Verdana, sans-serif;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.penguin-mod-floater {
  position: fixed;
  right: calc(28px + env(safe-area-inset-right, 0px));
  bottom: calc(78px + env(safe-area-inset-bottom, 0px));
  z-index: 2147483001;
  font-family: "Titan One", "Verdana", sans-serif;
  font-size: 26px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 0 #8a4b00, 0 4px 10px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  animation: penguin-mod-float 1.1s ease-out forwards;
}
.penguin-mod-floater.penguin-mod-floater-inf {
  color: #8dff7a;
  text-shadow: 0 2px 0 #14520d, 0 4px 10px rgba(0, 0, 0, 0.55);
}
@keyframes penguin-mod-float {
  0%   { opacity: 0; transform: translateY(14px) scale(0.8); }
  15%  { opacity: 1; transform: translateY(0)    scale(1.05); }
  100% { opacity: 0; transform: translateY(-52px) scale(1); }
}
`;
document.head.appendChild(styleEl);

const btn = document.createElement('button');
btn.id = 'penguin-mod-btn';
btn.type = 'button';
btn.dataset.ready = '0';
btn.title = 'Penguin Mod: loading…';

const btnImg = document.createElement('img');
btnImg.src = PENGUIN_SVG_URL;
btnImg.alt = 'Penguin — infinite keys & coins';
btnImg.draggable = false;
btn.appendChild(btnImg);
(document.body || document.documentElement).appendChild(btn);

function spawnFloater(text, isInf) {
  const el = document.createElement('div');
  el.className = 'penguin-mod-floater' + (isInf ? ' penguin-mod-floater-inf' : '');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function pulseButton() {
  btn.classList.remove('penguin-pulse');
  void btn.offsetWidth;                      // restart the CSS transition
  btn.classList.add('penguin-pulse');
  setTimeout(() => btn.classList.remove('penguin-pulse'), 160);
}

function updateButton() {
  btn.classList.toggle('penguin-inf', infiniteON);
  btn.title = !ready
    ? 'Penguin Mod: loading…'
    : (infiniteON
        ? 'Penguin Mod: infinity mode ON — counters show :) — click to restore real stats'
        : 'Penguin Mod: click to toggle infinity mode (all counters show :)');
}

// ---------------------------------------------------------------------------
// Click handling: simply toggle
// ---------------------------------------------------------------------------
function onClick() {
  if (!ready) return;
  pulseButton();
  setInfinite(!infiniteON);
}

for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) {
  btn.addEventListener(type, (e) => e.stopPropagation());
}
btn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  onClick();
});
btn.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------------------------------------------------------------------
// Watchdog: readiness, lazily-built widgets, persisted state
// ---------------------------------------------------------------------------
function watchdog() {
  try {
    const nowReady = computeReady();
    if (nowReady !== ready) {
      ready = nowReady;
      btn.dataset.ready = ready ? '1' : '0';
      updateButton();
    }
    if (!ready) return;

    installTagPatches();
    patchHudCounter();
    patchScoreboard();

    if (infiniteON) {
      // self-heal any counter that appeared after the toggle
      renderFakeFm(app.game && app.game.hud && app.game.hud.coins);
      const sb = app.gameover && app.gameover.scoreboard;
      if (sb && sb.__pmPatched && sb.coins && sb.coins.text !== FAKE_TEXT && sb.__pmData) {
        sb.coins.text = FAKE_TEXT;
      }
    }

    if (!bootRestoreDone) {
      bootRestoreDone = true;
      let saved = false;
      try { saved = localStorage.getItem(STORAGE_KEY) === '1'; } catch (err) { /* ignore */ }
      if (saved) setInfinite(true, { silent: true });
    }
  } catch (err) {
    // never let the watchdog break the game
  }
}

setInterval(watchdog, READY_POLL_MS);
watchdog();

// Debug/testing hook (optional, safe to ignore)
window.__penguinMod = {
  get on() { return infiniteON; },
  get ready() { return ready; },
  set: (v) => setInfinite(v),
  app
};

console.log('[PenguinMod] loaded — waiting for the game to boot…');
