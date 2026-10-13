(()=>{"use strict";const e={};function t(e,...t){console.error(`%cPOKI:%c ${e}`,"background-color: red; border-radius: 3px; color: white; padding: 1px 5px","",...t)}e.dn=e=>{var t=Object.getOwnPropertyDescriptor(e,"name");(!t||!t.writable&&t.configurable)&&Object.defineProperty(e,"name",{value:"default",configurable:!0})};const o=(e,t)=>{var o;if("undefined"==typeof window&&!t)return"";e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");const i=new RegExp(`(?:[\\?&]|^)${e}=([^&#]*)`).exec(t||(null===(o=null===window||void 0===window?void 0:window.location)||void 0===o?void 0:o.search)||"");return null===i?"":decodeURIComponent(i[1].replace(/\+/g," "))};e.dn(o);const i=/(?:phone|windows\s+phone|ipod|blackberry|(?:android|bb\d+|meego|silk|googlebot) .+? mobile|palm|windows\s+ce|opera mini|avantgo|mobilesafari|docomo|kaios)/i,n=/(?:ipad|playbook|android|bb\d+|meego|silk)/i,a=/(?:android|bb\d+|meego|silk) .+? mobile/i;function r(){const e=o("device");return"desktop"===e||"mobile"===e||"tablet"===e?e:"undefined"!=typeof navigator&&"MacIntel"===navigator.platform&&navigator.maxTouchPoints>1?"tablet":i.test(navigator.userAgent)?"mobile":n.test(navigator.userAgent)&&!a.test(navigator.userAgent)?"tablet":"desktop"}var s,d=function(e,t,o,i){if("a"===o&&!i)throw new TypeError("Private accessor was defined without a getter");if("function"==typeof t?e!==t||!i:!t.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return"m"===o?i:"a"===o?i.call(e):i?i.value:t.get(e)};const c=e=>{const t=RegExp(`[?&]${e}=([^&]*)`).exec(window.location.search);return t&&decodeURIComponent(t[1].replace(/\+/g," "))},l="kids"===c("tag"),u=!!window.adBridge,p="yes"===c("hoist")||"yes"===c("gdhoist"),g="1"===c("netflix"),m="1"===c("couchplay"),w=(parseInt(c("site_id")||"",10)||0)>0,h=l||m,k=navigator.userAgent.includes("PokiApp");s=new WeakMap;const f=new class{constructor(){s.set(this,[]),this.init=(e={})=>new Promise((t,o)=>{this.enqueue("init",[e],t,o)}),this.rewardedBreak=()=>new Promise(e=>{e(m)}),this.commercialBreak=e=>new Promise((t,o)=>{this.enqueue("commercialBreak",[e],t,o)}),this.displayAd=(e,t,o,i)=>{i&&i(!0),o&&o()},this.withArguments=e=>(...t)=>{this.enqueue(e,t)},this.withPromise=e=>()=>new Promise((t,o)=>{this.enqueue(e,[],t,o)}),this.handleAutoResolvePromise=()=>new Promise(e=>{e()}),this.throwNotLoaded=()=>{!function(e,...t){console.debug(`%cPOKI:%c ${e}`,"background-color: gray; border-radius: 3px; color: white; padding: 1px 5px","",...t)}("SDK is not loaded yet. Not all methods are available.")},this.doNothing=()=>{}}enqueue(e,t,o,i){const n={fn:e,args:t||[],resolveFn:o,rejectFn:i};h?o&&o(!0):d(this,s,"f").push(n)}dequeue(){for(;d(this,s,"f").length>0;){const e=d(this,s,"f").shift(),{fn:o,args:i}=e;if("function"==typeof window.PokiSDK[o])if((null==e?void 0:e.resolveFn)||(null==e?void 0:e.rejectFn)){const t="init"===o;if(window.PokiSDK[o](...i).catch((...o)=>{"function"==typeof e.rejectFn&&e.rejectFn(...o),t&&setTimeout(()=>{this.dequeue()},0)}).then((...o)=>{"function"==typeof e.resolveFn&&e.resolveFn(...o),t&&setTimeout(()=>{this.dequeue()},0)}),t)break}else window.PokiSDK[o](...i);else t(`cannot execute ${o}`)}}};if(window.PokiSDK={init:f.init,initWithVideoHB:f.init,commercialBreak:f.commercialBreak,rewardedBreak:f.rewardedBreak,displayAd:f.displayAd,destroyAd:f.doNothing,getLeaderboard:f.handleAutoResolvePromise,shareableURL:()=>new Promise((e,t)=>{t()}),getURLParam:e=>c(`gd${e}`)||c(e)||"",getLanguage:()=>(c("iso_lang")||navigator.language.toLowerCase()).split("-")[0],getDeviceInfo:()=>({category:r()}),isAdBlocked:()=>{},getUser:f.withPromise("getUser"),getToken:f.withPromise("getToken"),login:f.withPromise("login"),generateScreenshot:f.withPromise("generateScreenshot")},["captureError","customEvent","gameInteractive","gameLoadingFinished","gameLoadingProgress","gameLoadingStart","gameplayStart","gameplayStop","happyTime","logError","muteAd","roundEnd","roundStart","sendHighscore","setDebug","setDebugTouchOverlayController","setLogging","setPlayerAge","setPlaytestCanvas","enableEventTracking","openExternalLink","playtestSetCanvas","playtestCaptureHtmlOnce","playtestCaptureHtmlForce","playtestCaptureHtmlOn","playtestCaptureHtmlOff","movePill","showLeaderboard"].forEach(e=>{window.PokiSDK[e]=f.withArguments(e)}),!u&&!l)try{let e=localStorage.getItem("poki_events_user_id");e||(e=crypto.randomUUID(),"GB"!==c("country")&&localStorage.setItem("poki_events_user_id",e));const o=crypto.randomUUID(),i=c("game_id"),n=c("game_version_id"),a="1"===localStorage.getItem("poki_pbf");let s=1;window.PokiSDK.measure=(d,l,u,p)=>{if(function(e,...t){console.info(`%cPOKI:%c ${e}`,"background-color: green; border-radius: 3px; color: white; padding: 1px 5px","",...t)}(`PokiSDK.measure(${d=`${d}`.trim()}, ${l=void 0===l?"":`${l}`.trim()}, ${u=void 0===u?"":`${u}`.trim()}${void 0===p?"":`, ${JSON.stringify(p)}`})`),function(e,o,i){return""===e||""===o?(t("PokiSDK.measure() first two arguments (category and what) are required."),!1):[e,o,i].some(e=>/[^A-Za-z0-9_: .+|-]/.test(e))?(t('PokiSDK.measure() arguments may only contain A-Z, a-z, 0-9, spaces, "-", "_", ":", ".", "+", and "|" characters.'),!1):!(function(...e){return e.join(" ").split(/\d+|\{n\}/i).length-1}(e,o,i)>2&&(t("PokiSDK.measure() accepts at most 2 numeric values across category, what, and action combined."),1))}(d,l,u)){if(window.pokiMeasureBuildin=!0,window.parent.postMessage({type:"pokiMessageEvent",content:{event:"pokiTrackingMeasure",data:{category:d,action:l,label:u}}},"*"),i&&n){const t={category:d,action:l,label:u,p4d_game_id:i,p4d_version_id:n,time_on_page:Math.floor(performance.now()),user_id:e,user_new:!a,gameplay_id:o,experiment:c("experiment")||void 0,event_order:s++,device_category:r()};w&&window.parent.postMessage({type:"pokiMessageSendGameEvent",content:{payload:t}},"*")}window.dispatchEvent(new CustomEvent("pokiMeasure",{detail:{category:d,action:l,label:u,data:p}}))}},window.PokiSDK.measure("game","loading","start"),window.pokiMeasureBuildin=!1}catch(e){t(e),window.PokiSDK.measure=()=>{}}if(!h){const e=(()=>{const e=window.pokiSDKVersion||c("ab")||"7ec690964d8b5030ec19eda1a583d63a487ec738";let t=`poki-sdk-core-${e}.js`;return u&&(t=`poki-sdk-playground-${e}.js`),p&&(t=`poki-sdk-hoist-${e}.js`),k&&u&&(t=`poki-sdk-app-${e}.js`),g&&(t=`poki-sdk-netflix-${e}.js`),`https://game-cdn.poki.com/scripts/${e}/${t}`})(),t=document.createElement("script");t.setAttribute("src",e),t.setAttribute("type","text/javascript"),t.setAttribute("crossOrigin","anonymous"),t.onload=()=>f.dequeue(),document.head.appendChild(t)}})();
/* --- Local override: treat every ad as successfully completed ---
   The game only grants a rewarded-ad reward when window.PokiSDK.rewardedBreak()
   resolves truthy, and it silently skips the reward when PokiSDK.adBlockerOn is
   truthy (set by the SDK init() failure path). Off the Poki platform the bundled
   stub resolves rewardedBreak(false) and the remote core script errors, so
   clicking an ad does nothing. Force the SDK methods to always succeed and keep
   the overrides in place even if the remote core script replaces window.PokiSDK. */
(() => {
    "use strict";

    const force = {
        init: () => Promise.resolve(true),
        initWithVideoHB: () => Promise.resolve(true),
        rewardedBreak: () => Promise.resolve(true),
        commercialBreak: () => Promise.resolve(true),
        displayAd: (category, name, onSuccess, onError) => {
            if (typeof onSuccess === "function") onSuccess(true);
        },
        destroyAd: () => {},
        gameLoadingStart: () => {},
        gameLoadingProgress: () => {},
        gameLoadingFinished: () => {},
        gameInteractive: () => {},
        gameplayStart: () => {},
        gameplayStop: () => {},
        roundStart: () => {},
        roundEnd: () => {},
        happyTime: () => {},
        customEvent: () => {},
        captureError: () => {},
        logError: () => {},
        muteAd: () => {},
        sendHighscore: () => {},
        setDebug: () => {},
        setDebugTouchOverlayController: () => {},
        setLogging: () => {},
        setPlayerAge: () => {},
        setPlaytestCanvas: () => {},
        enableEventTracking: () => {},
        openConsole: () => {},
        measure: () => {},
        isAdBlocked: () => false,
        getLeaderboard: () => Promise.resolve([]),
        getUser: () => Promise.resolve({}),
        getToken: () => Promise.resolve(""),
        login: () => Promise.resolve(),
        generateScreenshot: () => Promise.resolve(""),
        shareableURL: () => Promise.resolve(""),
        getURLParam: () => "",
        getLanguage: () => "en",
        getDeviceInfo: () => ({ category: "desktop" }),
        getReferrer: () => "",
    };

    const wrap = (target) => new Proxy(target && typeof target === "object" ? target : {}, {
        get(t, prop) {
            if (prop === "adBlockerOn" || prop === "_skipVideo") return false;
            if (Object.prototype.hasOwnProperty.call(force, prop)) return force[prop];
            const value = t[prop];
            return typeof value === "function" ? value.bind(t) : value;
        },
        set(t, prop, value) {
            if (prop === "adBlockerOn" || prop === "_skipVideo") return true;
            if (Object.prototype.hasOwnProperty.call(force, prop)) return true;
            t[prop] = value;
            return true;
        },
    });

    let sdk = wrap(window.PokiSDK);

    try {
        Object.defineProperty(window, "PokiSDK", {
            configurable: true,
            enumerable: true,
            get: () => sdk,
            set: (value) => { sdk = wrap(value); },
        });
    } catch {
        window.PokiSDK = sdk;
    }
})();