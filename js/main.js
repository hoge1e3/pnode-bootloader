//@ts-check
import { onReady, timeout, mutablePromise } from "./util.js";
import { init } from "./pnode.js";
import { getMountPromise, mount } from "./fstab.js";
import {showMenus, initAutoexec, showModal, splash}from "./menu.js";
import { prefetchScript } from "./prefetcher.js";
import {installPWA } from "./pwa.js";
import {getValue, assignDefault, assign, pollute} from "./global.js";
const PNODE_VER=getValue("PNODE_VER");
const PNODE_URL=location.href.match(/localhost.*pnode-bootkit/)?
`../../petit-node/dist/index.js`:
`https://cdn.jsdelivr.net/npm/petit-node@${PNODE_VER}/dist/index.js`;
onReady(onload);
pollute({prefetchScript});
assign({
    readyPromises: {
        vConsole: mutablePromise(),
        zip: mutablePromise(),
        fs: getMountPromise(),
    }
})

async function onload() {
    //await import("./console.js");
    const sp=showModal(".splash");
    await splash("Loading petit-node",sp);    
    await installPWA();
    if(!localStorage["/"]){
        localStorage["/"]="{}";
    }
    prefetch().then(()=>{
        console.log("Scripts prefetched.");
    });
    const pNode=await init({
        BOOT_DISK_URL:"https://acepad.tonyu.jp/download.php",
        PNODE_URL,
        SETUP_URL:"https://acepad.tonyu.jp/download.php",
        INSTALL_DIR:"/idb/run",
        RESCUE_DIR:"/tmp/run",
    });
    const FS=pNode.getFS();
    const rp=FS.get("/package.json");
    showModal();
    showMenus(rp);
    console.log("Prefetching scripts");
    await timeout(1);
    const ti=performance.now();
    console.log("Mounting RAM/IDB");
    await mount();
    console.log("Mounted. ",performance.now()-ti,"msec taken.");
    initAutoexec(rp);
}
function initVConsole(){
    const VConsole=getValue("VConsole");
    const vConsole=new VConsole();
    assignDefault({vConsole});
    vConsole.hideSwitch();
    getValue("readyPromises").vConsole.resolve(vConsole);
}
function prefetch(){
    const cdn="https://cdn.jsdelivr.net/npm/";//"https://unpkg.com/"
    const to_p=(u)=>
    typeof u==="string" ? 
    prefetchScript(cdn+u) : u;
    const para=(...a)=>Promise.all(a.map(to_p));
    const seq=async (...a)=>{
        const r=[];
        for (let u of a) r.push(await to_p(u));
        return r;
    };
    const post=(p, f)=>to_p(p).then(f);
    return para(
    "jquery@1.12.1/dist/jquery.min.js",
    post("vconsole@latest/dist/vconsole.min.js",initVConsole),
    seq(
    "ace-builds@1.39.0/src-noconflict/ace.js",
    "ace-builds@1.39.0/src-noconflict/ext-language_tools.js"
    ));
}