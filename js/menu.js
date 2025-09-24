//@ts-check
/** 
 * @typedef { import("./types").SFile } SFile
 * @typedef { import("./types").Menus } Menus
 * @typedef { import("./types").Menu } Menu
 * @typedef { import("./types").ShowModal } ShowModal
 * @typedef { import("./types").RootPackageJSON } RootPackageJSON
 */

import { /*prefetchAuto ,*/ prefetchModule, doQuick } from "./prefetcher.js";
import { getInstance } from "./pnode.js";

import {networkBoot,insertBootDisk,
resetall,fullBackup,fixrun,wireUI} from "./boot.js";
import {getMountPromise} from "./fstab.js";
import { getValue } from "./global.js";
import { btn, showModal, splash } from "./ui.js";

export function rmbtn(){
    for(let b of document.querySelectorAll('button')){
        b.parentNode?.removeChild(b);
    }
    doQuick();
}
wireUI({rmbtn,showModal,splash});
/** @type (rp:SFile)=>void */
export function showMenus(rp){
    if(rp.exists()){
        showMainmenus(rp);
        //showSubmenus(rp);
    }
    const su=process.env.SETUP_URL;
    if (su) {
        btn(["💿","Install/Rescue"],()=>networkBoot(su));
    }
    btn(["💾","Insert Boot Disk"],()=>insertBootDisk());
    btn(["💣","Factory Reset"],()=>resetall());
    btn(["📦","Full backup"],()=>fullBackup());
    btn(["💻","Console"],()=>showConsole());
    //console.log("rp",rp.exists());
}
function showConsole(){
    const vConsole=getValue("vConsole");
    if (vConsole) vConsole.show();           
}
/**@param {Menus} menus */
export function parseMenus(menus){
    for(let k in menus){
        const main=menus[k];
        if(typeof main==="string"){
            menus[k]={main};
        }
    }
    return menus;
}
/**@param {SFile} rp */
export function initAutoexec(rp) {
  const pNode=getInstance();
  const FS=pNode.getFS();

    if (!rp.exists()) return;
    /**@type {RootPackageJSON}*/
    const o=rp.obj();
    //console.log("rp.obj",o);
    if(!o.menus) return;
    const menus=parseMenus(o.menus);
    for(let k in menus){
        const {main,auto, submenus}=menus[k];
        const mainF=fixrun(FS.get(main));
        /*if (auto) {
            prefetchAuto({mainF});
        }*/
    }
    if (o.prefetch) {
        try {
            for (let m of o.prefetch) {
                prefetchModule(FS.get(m));
            }
        } catch(e){
            console.error(e);
        }
    }
}
/** @param {SFile} rp */
export function showMainmenus(rp) {
    const o=rp.obj();
    //console.log("rp.obj",o);
    if(!o.menus)return;
    const menus=parseMenus(o.menus);
    let hasAuto;
    for(let k in menus){
      const v=menus[k];
        if (v.auto) hasAuto=true;
        /**@type string|string[] */
        let c=k;
        if(v.icontext){
          c=[v.icontext,k];
        }
        btn(c, ()=>runMenu(k,v));//,v.auto);
    }
    //if (hasAuto) stopBtn();
}
/**
 * @param {string} k 
 * @param {Menu} v 
*/
export async function runMenu(k,v){
    try {
        const sp=showModal(".splash");
        await splash("Launching "+k,sp);
        const pNode=getInstance();
        const FS=pNode.getFS();
        const {main,auto, submenus}=v;
        rmbtn();
        await splash("Waiting for disk ready",sp);
        await getMountPromise();
        await splash("disk ready",sp);
        const mainF=fixrun(FS.get(main));
        process.env.boot=mainF.path();
        await splash("start "+process.env.boot,sp);
        const mod=await pNode.importModule(mainF);
        await splash("impored "+mainF,sp);
        if(v.call){
          const [n,...a]=v.call;
          mod[n](...a);
        }
        //}  
    } finally {
        showModal(false);
    }
}