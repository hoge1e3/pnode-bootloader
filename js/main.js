//@ts-check
import { onReady, timeout } from "./util.js";
import { init } from "./pnode.js";
import { mount } from "./fstab.js";
import {showMenus, initAutoexec}from "./menu.js";
import { prefetchScript } from "./prefetcher.js";
import {installPWA } from "./pwa.js";
import {getValue, assignDefault, pollute} from "./global.js";
const PNODE_VER=getValue("PNODE_VER");
const PNODE_URL=`https://cdn.jsdelivr.net/npm/petit-node@${PNODE_VER}/dist/index.js`;
onReady(onload);
pollute({prefetchScript});

async function onload() {
    //await import("./console.js");
    
    await installPWA();
    if(!localStorage["/"]){
        localStorage["/"]="{}";
    }
    prefetch().then(()=>{
        const VConsole=getValue("VConsole");
        const vConsole=new VConsole();
        assignDefault({vConsole});
        vConsole.hideSwitch();
        console.log("Scripts prefetched.");
    });
    const pNode=await init({
        BOOT_DISK_URL:"https://acepad.tonyu.jp/download.php",
        PNODE_URL,
        SETUP_URL:"https://acepad.tonyu.jp/download.php",
    });
    const FS=pNode.getFS();
    const rp=FS.get("/package.json");
    showMenus(rp);
    console.log("Prefetching scripts");
    await timeout(1);
    console.log("Mounting RAM/IDB");
    await mount();
    console.log("Mounted.");
    initAutoexec(rp);
}

function prefetch(){
    const cdn="https://cdn.jsdelivr.net/npm/";//"https://unpkg.com/"
    const to_p=(u)=>
    typeof u==="string" ? 
    prefetchScript(cdn+u) : u;
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