//@ts-check
/** 
 * @typedef { import("./types").Menus } Menus
 * @typedef { import("./types").Menu } Menu
 * @typedef { import("./types").ShowModal } ShowModal
 * @typedef { import("./types").RootPackageJSON } RootPackageJSON
 */


import {insertBootDisk,readPackagejson,wireUI} from "./boot.js";
import { getValue } from "./global.js";
import { btn, showModal, splash, rmbtn as rmbtnWithoutQuick, uploadFile } from "./ui.js";
import { blob2arrayBuffer, getEnv } from "./util.js";

export function rmbtn(){
    rmbtnWithoutQuick();
}
wireUI({rmbtn,showModal,splash});
/** @type ()=>Promise<void> */
export async function showMenus(){
    await showMainmenus();
    //const FS=pNode.getFS();
    
    /*const su=getEnv("SETUP_URL");
    if (su) {
        btn(["💿","Install/Rescue"],()=>networkBoot(su));
    }*/
    btn(["💾","Add Boot Disk"],()=>insertBootDisk());
    /*btn(["💣","Factory Reset"],async ()=>{
        if(prompt("type 'really' to clear all data")!=="really")return;
        await factoryReset();
        if (confirm("Factory reset complete. reload?")) location.reload();
    });
    btn(["📦","Full backup"],()=>fullBackup());
    btn(["📦","Full restore"],async ()=>{
        const blob=await uploadFile();
        const arrayBuffer=await blob2arrayBuffer(blob);
        await fullRestore(arrayBuffer);
        if (confirm("Full restore complete. reload?")) location.reload();
    });*/
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
export async function showMainmenus() {
    const o=await readPackagejson();
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
        const {main,auto, submenus}=v;
        rmbtn();
        const mod=await import(main);
        await splash("impored "+k,sp);
        if(v.call){
          const [n,...a]=v.call;
          mod[n](...a);
        }
    } finally {
        showModal(false);
    }
}