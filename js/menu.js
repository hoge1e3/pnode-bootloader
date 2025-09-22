//@ts-check
import { prefetchAuto , prefetchModule, getPrefetchedAutoURL,doQuick } from "./prefetcher.js";
import { qsExists, timeout } from "./util.js";
import { getInstance } from "./pnode.js";
import {mutablePromise,can} from "./util.js";

import {networkBoot,insertBootDisk,
resetall,fullBackup,fixrun,wireUI} from "./boot.js";
import {getMountPromise} from "./fstab.js";
import { assign, getValue } from "./global.js";

/**@type boolean */
let modalInited;
/**@type ShowModal */
export function showModal(s) {
  const modal=qsExists(".modal-container");
  modal.setAttribute("style", s?"":"display: none;");
  if (!modalInited) {
    modal.addEventListener("click",(e)=>{
        if (e.target===modal) {
            showModal(false);
        }
    });
    modalInited=true;
  }
  for (let e of modal.querySelectorAll(".modal-dialog")) {
        e.setAttribute("style", "display: none;");
  }
  if (typeof s==="string") {
    const d=qsExists(modal, s);
    d.setAttribute("style","");
    return d;
  }
  return modal;
}
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
        showSubmenus(rp);
    }
    const su=process.env.SETUP_URL;
    if (su) {
        btn(["💾","Install/Rescue"],()=>networkBoot(su));
    }
    btn(["💿","Insert Boot Disk"],()=>insertBootDisk());
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
        if (auto) {
            prefetchAuto({mainF});
        }
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
        btn(c, ()=>runMenu(k,v),v.auto);
    }
    if (hasAuto) stopBtn();
}
/**
 * @param {string} mesg 
 * @param {HTMLElement} sp 
*/
export async function splash(mesg,sp){
  sp.textContent=mesg;
  await timeout(1);    
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
        //
        /*if (auto) {
            getPrefetchedAutoURL().then((u)=>import(u));
        } else {*/
            selectedSubmenu=null;
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
export function getSelectedSubmenu() {
    return selectedSubmenu;
}
assign({getSelectedSubmenu});
/**@type Promise<string> */
let selectedSubmenu;
/**@type (rp:SFile)=>void */
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
    let icont;
    if (typeof c==="string") {
        icont=c[0];
    } else {
        icont=c[0];
        c=c[1];
    }
    let b=document.createElement("div");
    b.classList.add("menubtn");
    //b.innerHTML=c;
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = icont;//false ? "📁" : "📄";

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
    if(document.querySelector(".icon.stop"))return ;
    const b=document.createElement("div");
    b.classList.add("menubtn");
    b.classList.add("stop");
    //b.innerHTML=c;
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = "⛔";

    const label = document.createElement("div");
    label.className = "label";
    label.innerHTML = "Stop <BR>auto Boot<BR>2";
    b.appendChild(icon);
    b.appendChild(label);
    
    const menus=qsExists(".menus");
    menus.append(b);
    const act=async()=>{
        if(b.parentNode){
            b.parentNode.removeChild(b);
        }
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
        label.innerHTML="Stop<br>auto start<br>1";
    },1000);
}
export function clickAutostartMenu(){
    const ab=document.querySelector(".autob");
    if (ab) {
        ab.dispatchEvent(new Event("click"));
    }
}
