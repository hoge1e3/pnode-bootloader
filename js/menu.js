//@ts-check
import { prefetchAuto , getPrefetchedAutoURL,doQuick } from "./prefetcher.js";
import { timeout } from "./util.js";
import { getInstance } from "./pnode.js";
import {mutablePromise} from "./util.js";

import {networkBoot,insertBootDisk,
resetall,fullBackup,fixrun,setRmbtn} from "./boot.js";
import {getMountPromise} from "./fstab.js";
import { assign, getValue } from "./global.js";
export function rmbtn(){
    for(let b of document.querySelectorAll('button')){
        b.parentNode?.removeChild(b);
    }
    doQuick();
}
setRmbtn(rmbtn);
export function showMenus(rp){
    if (process.env.SETUP_URL) {
        btn("Setup/Restore",()=>networkBoot(process.env.SETUP_URL));
    }
    btn("Insert Boot Disk",()=>insertBootDisk());
    btn("Factory Reset",()=>resetall());
    btn("Full backup",()=>fullBackup());
    btn("Console",()=>showConsole());
    //console.log("rp",rp.exists());
    if(rp.exists()){
        showMainmenus(rp);
        showSubmenus(rp);
    }
}
function showConsole(){
    const vConsole=getValue("vConsole");
    if (vConsole) vConsole.show();           
}
export function parseMenus(menus){
    for(let k in menus){
        const main=menus[k];
        if(typeof main==="string"){
            menus[k]={main};
        }
    }
    return menus;
}
export function initAutoexec(rp) {
  const pNode=getInstance();
  const FS=pNode.getFS();

    if (!rp.exists()) return;
    const o=rp.obj();
    //console.log("rp.obj",o);
    if(!o.menus) return;
    const menus=parseMenus(o.menus);
    for(let k in menus){
        const {main,auto, submenus}=menus[k];
        const mainF=fixrun(FS.get(main));
        if (auto) {
            prefetchAuto({mainF});
        }
    }
    
}
export function showMainmenus(rp) {
  const pNode=getInstance();
  const FS=pNode.getFS();

    const o=rp.obj();
    //console.log("rp.obj",o);
    if(!o.menus)return;
    const menus=parseMenus(o.menus);
    let hasAuto;
    for(let k in menus){
        const {main,auto, submenus}=menus[k];
        if (auto) hasAuto=true;
        btn(k,async ()=>{
            await getMountPromise();
            const mainF=fixrun(FS.get(main));
            rmbtn();
            process.env.boot=mainF.path();
            console.log("start",process.env.boot);
            await timeout(1);
            if (auto) {
                getPrefetchedAutoURL().then((u)=>import(u));
            } else {
                selectedSubmenu=null;
                await pNode.importModule(mainF);
            }
        },auto);
    }
    if (hasAuto) stopBtn();
    
}
export function getSelectedSubmenu() {
    return selectedSubmenu;
}
assign({getSelectedSubmenu});
function qsExists(q) {
    const r=document.querySelector(q);
    if (!r) throw new Error(`${q} does not exist`);
    return r;
}
let selectedSubmenu;
export function showSubmenus(rp) {
  const pNode=getInstance();
  const FS=pNode.getFS();
  /** @type {HTMLElement} */
    const submenus=qsExists("div.submenus");
    const o=rp.obj();
    if(!o.menus)return;
    const menus=parseMenus(o.menus);
    let submenuF;
    for(let k in menus){
        const {main,auto, submenus}=menus[k];
        if (auto && submenus) {
            submenuF=FS.get(submenus);
        }
    }
    if (!submenuF || !submenuF.exists()) return;
    for (let m of submenuF.obj()) {
        selectedSubmenu=selectedSubmenu||mutablePromise();
        submenus.style.display="block";
        const md=document.createElement("div");
        md.innerText=typeof m==="string"?m:m.label;
        md.addEventListener("click",()=>{
            const value=typeof m==="string"?m:m.value;
            console.log("Selected ", value);
            if (typeof process!=="undefined" && process.env){
                process.env.SUBMENU_SELECTED=value;   
                selectedSubmenu.resolve(value);
            }
            hideSubmenus();
            clickAutostartMenu();
        });
        submenus.appendChild(md);
    }
    
}
export function hideSubmenus(){
    /** @type {HTMLElement} */
    const submenus=qsExists(".submenus");
    submenus.style.display="none";
    
} 
export function btn(c,a,auto){
    let b=document.createElement("div");
    b.classList.add("menubtn");
    //b.innerHTML=c;
      const icon = document.createElement("div");
      icon.className = "icon";
      icon.textContent = false ? "📁" : "📄";

      const label = document.createElement("div");
      label.className = "label";
      label.textContent = c;
      b.appendChild(icon);
      b.appendChild(label);

    const menus=qsExists(".menus");
    menus.append(b);
    const act=async()=>{
        try {
            abortAuto();
            await a();
        }catch(e){console.error(e.message+"\n"+e.stack);}
    };
    b.addEventListener("click", act);	    
    if(auto){
        b.classList.add("autob");
    }
    /*console.log("auto start ",c," in 2 seconds.");
    autoexec=act;
    stopBtn();
    */
}
export function abortAuto(){
    const b=document.querySelector("button.stop");
    if(b)document.body.removeChild(b);
    if (stopBtnTimer) console.log("Auto boot aborted.");
    clearTimeout(stopBtnTimer);
    stopBtnTimer=null;
}
let stopBtnTimer;
export function stopBtn(){
    if(document.querySelector("button.stop"))return ;
    const b=document.createElement("button");
    b.classList.add("menubtn");
    b.classList.add("stop");
    
    b.innerHTML="Stop<br>auto start<br>2";
    document.body.append(b);
    const act=async()=>{
        selectedSubmenu=null;
        hideSubmenus();
        abortAuto();
    };
    b.addEventListener("click", act);	    
    stopBtnTimer=setTimeout(async()=>{
        if(b.parentNode){
            b.parentNode.removeChild(b);
        }
        await timeout(10);
        clickAutostartMenu();
    },2000);
    setTimeout(()=>{
        b.innerHTML="Stop<br>auto start<br>1";
    },1000);
}
export function clickAutostartMenu(){
    const ab=document.querySelector("button.autob");
    if (ab) {
        ab.dispatchEvent(new Event("click"));
    }
}
