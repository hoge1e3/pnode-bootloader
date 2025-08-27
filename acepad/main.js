/*global globalThis*/
import * as boot from "./bootLoader.js";
const PNODE_VER=globalThis.PNODE_VER;
const PNODE_URL=`https://cdn.jsdelivr.net/npm/petit-node@${PNODE_VER}/dist/index.js`;
globalThis.pNodeBootLoader=boot;
boot.onReady(onload);
async function onload() {
    await import("./console.js");
    await installPWA();
    if(!localStorage["/"]){
        localStorage["/"]="{}";
    }
    const pNode=await boot.init({
        BOOT_DISK_URL:"https://github.com/hoge1e3/acepad-dev/archive/refs/heads/main.zip",
        PNODE_URL,
        SETUP_URL:"acepad/setup.zip",
    });
    const FS=pNode.FS;
    const rp=FS.get("/package.json");
    const mountPromise=boot.enableMountPromise();
    await boot.showMenus(rp);
    prefetch().then(()=>console.log("Prefetched scripts."));
    await boot.timeout(1);
    globalThis.pNode=pNode;
    console.log("Mounting RAM/IDB");
    FS.mount("/tmp/","ram");
    await FS.mountAsync("/idb/","idb");
    console.log("Done");
    mountPromise.resolve();
    boot.initAutoexec(rp);
    
}
async function installPWA(){
    try {
        const registration=await navigator.serviceWorker.register('./sw.js');
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        console.log("registration",registration);
        const sw=globalThis.__serviceWorker__=registration.active;
        navigator.serviceWorker.addEventListener("message",({data})=>{
            console.log("CACHE_NAME",data.CACHE_NAME);
            globalThis.__CACHE_NAME__=data.CACHE_NAME;
        });
        sw.postMessage("");
    }catch(err) {
        console.error(err);
        console.log('ServiceWorker registration failed: ', err);
    }
}
function prefetch(){
    const cdn="https://cdn.jsdelivr.net/npm/";//"https://unpkg.com/"
    const to_p=(u)=>
    typeof u==="string" ? 
    boot.prefetchScript(cdn+u) : u;
    const para=(...a)=>Promise.all(a.map(to_p));
    const seq=async (...a)=>{
        for (let u of a) await to_p(u);
    };
    return para(
    "jquery@1.12.1/dist/jquery.min.js",
    "vconsole@latest/dist/vconsole.min.js",
    seq(
    "ace-builds@1.39.0/src-noconflict/ace.js",
    "ace-builds@1.39.0/src-noconflict/ext-language_tools.js"
    ));
}