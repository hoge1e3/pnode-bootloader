/*global self,caches,crypto*/
const NAME = 'acepad-os';
const VERSION = '035';
const CACHE_NAME = NAME + VERSION;
const urlsToCache = [];
let mesrc;
let cache;
(function () {
  const origLog = console.log.bind(console);
  const origError = console.error.bind(console);
  function forward(type, args) {
    try {
      // mesrc: MessagePort or Client (e.g. from event.source)
      mesrc?.postMessage({
        type: 'console',
        level: type,
        args: args.map(a => {
          try {
            return typeof a === 'string' ? a : JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
      });
    } catch {
      // ignore postMessage failures
    }
  }
  console.log = (...args) => {
    forward('log', args);
    origLog(...args);
  };
  console.error = (...args) => {
    forward('error', args);
    origError(...args);
  };
})();
addEventListener("error",(e)=>console.error("err",e.error+""));
addEventListener("unhandledrejection",(e)=>console.error("unh",e.reason+""));
const fh=(f)=>
  async(...a)=>{
    try{
      return await f(...a);
    }catch(e){
      console.error(e);
    }
  };
async function installEvent(event){
    self.skipWaiting();
    cache=await caches.open(CACHE_NAME);
    console.log('Opened cache',cache, CACHE_NAME);
    return cache.addAll(urlsToCache);
}
self.getCache=getCache;
async function getCache(){
  if(cache)return cache;
  cache=await caches.open(CACHE_NAME);
  return cache;
}
self.CACHE_NAME=CACHE_NAME;
self.addEventListener('install', 
(event)=>event.waitUntil(installEvent(event)));
/**
 * @type Map<string, Function>
 */
const messageHandlers=new Map();
function addMessageHandler(type, handler) {
    messageHandlers.set(type,handler);
    console.log("message handler added",type);
}
function removeMessageHandler(type) {
    messageHandlers.delete(type);
    console.log("messaged handler removed",type);
}
self.addMessageHandler=addMessageHandler;
self.removeMessageHandler=removeMessageHandler;
addMessageHandler("EVAL",async(event)=>{
  const { script } = event.data || {};
  try{
    const r=await(self.eval(script));
    event.source.postMessage(r);
  }catch(e){
    event.source.postMessage({
      type:"error",
      error:e+""
    });
  } 
});
addMessageHandler("serve_blob",async(event)=>{
  const { url, blob } = event.data || {};
  const cache=await getCache();
  cache.put(
    url,
    new Response(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Content-Length": blob.size
      }}));
  event.source.postMessage({type:"response", for:"serve_blob", url});
});
addMessageHandler("CACHE_NAME",(event)=>{
    event.source.postMessage({ CACHE_NAME });
});
addMessageHandler("serve",(event)=>{
  const {path}=event.data;
  const client = event.source;
  addUrlHandler(path,async(event)=>{
    event.respondWith(handle(event));
    async function handle(event) {
      return new Promise((resolve) => {
        const type=crypto.randomUUID();
        addMessageHandler(type,(e)=>{
          const { response } = e.data;
          resolve(new Response(response.body, response));
          self.removeMessageHandler(type);
        });
        //console.log("post",event.request.url);
        client.postMessage({
          type,
          request: {
            url: event.request.url,
            method: event.request.method
          }
        });
      });
    }
  });
});
self.addEventListener("message",fh((event)=>{
    const { type } = event.data || {};
    mesrc=event.source;
    if (!messageHandlers.has(type)) {
        event.source.postMessage({ type:"error", message:`sw: message type '${type}' is not found` });
        return;
    }
    messageHandlers.get(type)(event);
}));
function useCacheOnlyIfOffline({url}) {
    if (!self.registration.scope) return true;
    //console.log("useCacheOnlyIfOffline", url, self.registration.scope, url.startsWith(self.registration.scope), url.includes("/tmp-gen/"));
    if (url.includes("?")) return true;
    if (url.match(/\blatest\b/)) return true;
    if (!url.startsWith(self.registration.scope)) return false;
    return !url.includes("/gen/");
}
const doNotRetryOpaque=new Set();
const urlHandlers=new Map();
function addUrlHandler(path, handler){
    urlHandlers.set(path, handler);
    console.log("urlHandler added", path);
}
function removeUrlHandler(path) {
    urlHandlers.delete(path);
    console.log("urlHandler removed", path);
}
self.addUrlHandler=addUrlHandler;
self.removeUrlHandler=removeUrlHandler;
self.addEventListener('fetch', fh((event)=>{
    //console.log("fetch",event, event.request.url, CACHE_NAME);
    /*if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin'){
        return;
    }*/
    async function respond(event) {
        //console.log("global",globalVarTest++);
        const {request}=event;
        const {url}=request;
        let path=url.substring(self.registration.scope.length).replace(/^\//,"");
        let paths=path.split("/");
        //console.log("paths",paths);
        if (urlHandlers.has(paths[0])) {
          const r=urlHandlers.get(paths[0])(event);
          if (r) return r;
        }
        if (request.method!=="GET") {
            return await fetch(request);
        }
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
                //console.log("useCacheOnlyIfOffline was true", url);
                const response=await fetch(request);
                if (response.ok) cache.put(request,response.clone());
                return response;
            } catch (e) {
                console.error(e);
            }
        }
        let response=await cache.match(request);
        //console.log("fetch-res-in-cache",url,response);
        if (response) {
            return response;
        }
        response=await fetch(event.request);
        //console.log("fetch-res-from-network",url,response);
        if (response.type==="opaque" && !doNotRetryOpaque.has(url)) {
            try {
                response=await fetch(url);
                //console.log("retry-opaque-ok",url,response);
            } catch(e){
                //console.log("retry-opaque-fail",url);
                doNotRetryOpaque.add(url);
            }
        }
        if (response.ok) cache.put(request,response.clone());
        return response;
    }
    return event.respondWith(respond(event));
}));

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
