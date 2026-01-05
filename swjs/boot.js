//@ts-check
/** 
 * @typedef { import("./types").Menus } Menus
 * @typedef { import("./types").Menu } Menu
 * @typedef { import("./types").ShowModal } ShowModal
 * @typedef { import("./types").Splash } Splash
 * @typedef { import("./types").WireUIDC } WireUIDC
 * @typedef { import("./types").RootPackageJSON } RootPackageJSON
 * @typedef { import("./types.js").WSFileInfo } WSFileInfo
 */
import { getValue } from "./global.js";
import { fetchServed, serveBlob } from "./pwa.js";
//import { getInstance } from "./pnode.js";
import { qsExists, timeout,can, getEnv } from "./util.js";
//import { getMountPromise,readFstab, } from "./fstab.js";

let rmbtn=()=>{};
/**@type ShowModal */
export let showModal=(show)=>document.body;
/**@type Splash */
export let splash=async (mesg, dom)=>{};
/**@type (dc:WireUIDC)=>void*/
export function wireUI(dc){
  rmbtn=dc.rmbtn;
  showModal=dc.showModal;
  splash=dc.splash;
}
/**@type (...a:any[])=>void */
function status(...a){
    console.log(...a);
}
/**
 * 
 * @returns {Promise<RootPackageJSON>}
 */
export async function readPackagejson() {
    try {
        const resp=await fetchServed("boot/package.json");
        return (await resp.json());
    }catch(e){
        return {menus:{}};
    }

}
export function insertBootDisk() {
    const cas=showModal(".upload");
    if (getEnv("BOOT_DISK_URL",null)) {
        const a=qsExists(cas, "a");
        a.innerHTML="Download Sample Boot Disk";
        a.setAttribute("href",getEnv("BOOT_DISK_URL"));
    }
    const file=qsExists(cas, ".file");
    file.addEventListener("input",async function () {
        //const run=pNode.file(getEnv("RESCUE_DIR"));
        //@ts-ignore
        const _file=this.files && this.files[0];
        /**@type {File}*/
        const file=_file;
        if (!file) throw new Error("File is not selected.");
        const c=await getValue("readyPromises").vConsole;
        c?.show();
        //await unzipBlob(file,run);
        splash("Serving "+file.name,cas);
        const url=await serveBlob("boot/"+file.name, file);
        const p=await readPackagejson();
        p.menus[file.name]={
            main:url,
        };
        splash("Serving package.json",cas);
        await serveBlob("boot/package.json", new Blob([JSON.stringify(p)],
        {type:"text/json;charset=utf8"}));
        
        c?.hide();
        //rmbtn();
        showModal(false);
        location.reload();
        //const mod=await pNode.importModule(fixrun(run));
        //if(can(mod,"install")) mod.install();
    });
}