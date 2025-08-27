const NAME = 'acepad-os';
const VERSION = '024';
const CACHE_NAME = NAME + VERSION;
const urlsToCache = [
    //"./test.js",
];
// Service Worker へファイルをインストール
let cache;
async function installEvent(event){
    self.skipWaiting();
    cache=await caches.open(CACHE_NAME);
    console.log('Opened cache',cache, CACHE_NAME);
    return cache.addAll(urlsToCache);
}
self.addEventListener('install', 
(event)=>event.waitUntil(installEvent(event)));
//const fs={};
self.addEventListener("message",(event)=>{
    console.log("mesg",event, CACHE_NAME);
    //const data=event.data;
    // data={url: body: headers: }
    //fs[data.url]=data;
    if (event.source) {
        event.source.postMessage({ CACHE_NAME });
    }
});
function useCacheOnlyIfOffline({url}) {
    if (!self.registration.scope) return true;
    console.log("useCacheOnlyIfOffline", url, self.registration.scope, url.startsWith(self.registration.scope), url.includes("/tmp-gen/"));
    if (url.includes("?")) return true;
    if (url.match(/\blatest\b/)) return true;
    if (!url.startsWith(self.registration.scope)) return false;
    return !url.includes("/tmp-gen/");
}
const doNotRetryOpaque=new Set();
// リクエストされたファイルが Service Worker にキャッシュされている場合
// キャッシュからレスポンスを返す
self.addEventListener('fetch', (event)=>{
    console.log("fetch",event, event.request.url, CACHE_NAME);
    /*if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin'){
        return;
    }*/
    async function respond(event) {
        const {request}=event;
        if (request.method!=="GET") {
            return await fetch(request);
        }
        const {url}=request;
        if (!cache) {
            try {
                cache=await caches.open(CACHE_NAME);
            } catch(e) {
                console.log(e);
            }
            if (!cache) return await fetch(request);
        }
        if (useCacheOnlyIfOffline(request)) {
            try {
                console.log("useCacheOnlyIfOffline was true", url);
                const response=await fetch(request);
                if (response.ok) cache.put(request,response.clone());
                return response;
            } catch (e) {
                console.error(e);
            }
        }
        let response=await cache.match(request);
        console.log("fetch-res-in-cache",url,response);
        if (response) {
            return response;
        }
        response=await fetch(event.request);
        console.log("fetch-res-from-network",url,response);
        if (response.type==="opaque" && !doNotRetryOpaque.has(url)) {
            try {
                response=await fetch(url);
                console.log("retry-opaque-ok",url,response);
            } catch(e){
                console.log("retry-opaque-fail",url);
                doNotRetryOpaque.add(url);
            }
        }
        if (response.ok) cache.put(request,response.clone());
        return response;
    }
    return event.respondWith(respond(event));
});

// Cache Storage にキャッシュされているサービスワーカーのkeyに変更があった場合
// 新バージョンをインストール後、旧バージョンのキャッシュを削除する
// (このファイルでは CACHE_NAME をkeyの値とみなし、変更を検知している)

async function activateEvent(event) {
    console.log("activate",event, CACHE_NAME);
    const keys=await caches.keys();
    console.log("keys",keys);
    await Promise.all(keys.map((key) => {
        console.log("keys-delete?",key,CACHE_NAME);
        if (!key.includes(CACHE_NAME)) {
            return caches.delete(key);
        }
    }));
    console.log(CACHE_NAME + "activated");
}
self.addEventListener('activate', 
(event) =>event.waitUntil(activateEvent(event)));
