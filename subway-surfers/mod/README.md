# 🐧 Penguin Infinity Mod for Subway Surfers Web

A tiny mod that adds a penguin button to the bottom-right corner of the game.
It's a **toggle for "infinity mode"**:

| Mode | What happens |
|---|---|
| **ON** | Every keys/coins counter that is visible (menu wallet strips, the in-run HUD coin counter, the game-over board) shows **`:)`**, and your wallet **acts as infinite**: purchases, revives and upgrades are free and never decrease your saved keys/coins. |
| **OFF** | Everything is instantly back to your **legit saved stats**. |

![infinity mode on — wallet shows :), penguin badge is green with ∞](./preview.png)

Your save is **never touched** while the mode is on — keys/coins are only
faked in memory (accessor overrides), so when you toggle off your real
stats are exactly what they were.

## Install

There is nothing to build — the mod is already installed in this copy of the game:

1. `mod/penguin-mod.js` — the mod script.
2. `mod/penguin.svg` — the Twemoji penguin graphic.
3. `index.html` — loads the mod with one extra `<script type="module">` tag.

Serve the `subway-surfers` folder over HTTP (any static server works, e.g.
`npx http-server` or `python -m http.server`) and open the page. The penguin
button appears in the bottom-right corner once the game has loaded.

> ES modules don't load from `file://` URLs, so make sure you use a local web
> server like you already do for the game itself.

## Use

- Click the penguin → **infinity ON**: the button gets a green glow + `∞`
  badge and every visible counter switches to `:)` on the spot.
- Click it again → **OFF**: your real keys/coins are shown everywhere again.
- The mode is remembered between sessions (saved in `localStorage` under
  `PenguinMod.infinite`).

While ON:

- Buying anything (boards, characters, upgrades, boosters, revives — even
  paying keys to revive mid-run) works even if you couldn't afford it, and
  your saved balance does not change.
- Collecting coins/keys in a run still shows `:)` and doesn't change your
  saved balance either — nothing about your wallet changes while the mode is on.

## Uninstall

1. Remove this line from `index.html`:
   `<script type="module" src="./mod/penguin-mod.js"></script>`
2. Delete the `mod/` folder (optional).

## How it works

The game bundle is an ES module that exports its app singleton (`export { ... $ as t }`).
Importing that module from `penguin-mod.js` returns the **same live instance**
(browser module registry is keyed by URL), which exposes the game's own APIs.

- **Infinite wallet** — `app.user`'s `keys`/`coins` accessors are shadowed on
  the instance: getters return a huge number, setters are no-ops. Every
  `user.coins -= cost` spend in the game therefore succeeds but writes nothing
  to `gameSettings.currencies` (the real save).
- **Counters show `:)`** — the wallet strip widgets (`ug` coins tag / `wv`
  keys tag) get prototype-level setter patches that keep the numeric value in
  a side field (`__pmWalletValue`) while writing `:)` to the visible label.
  Prices and prize amounts use the same widget classes but aren't wallet
  strips, so they stay real.
- **Run HUD + game-over board** — the HUD's `Fm` counter and the game-over
  `Uv` score board get instance-level patches (they don't use the tag widgets).
- **Instant update on click** — toggling re-labels every known tag directly
  and dispatches the game's own settings-change refresh (`onGameSettingsChange`)
  after pre-aligning the internal numeric values, so there is no tween wait.

> **Note:** the mod imports `../assets/index-QNpTjs8S.js` by its hashed file
> name. If you replace the game with a newer build and the file name changes,
> update the import at the top of `mod/penguin-mod.js`.

## Debug

Open the browser console and look for `[PenguinMod]` messages. A toggle logs:

```
[PenguinMod] infinity mode ON
```

There is also a small scripting hook:

```js
window.__penguinMod.on        // current state (boolean)
window.__penguinMod.set(true) // toggle programmatically
```

## Credits

- Penguin graphic: [Twemoji](https://github.com/jdecked/twemoji) U+1F427
  (`1f427.svg`), artwork licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Mod code: public domain / do whatever you want.
