//@ts-check
import { getGlobal,getValue } from "./global.js";
import { getInstance } from "./pnode.js";
import { qsExists, timeout,can, deleteAllTablesInDatabase } from "./util.js";
import { getMountPromise,readFstab } from "./fstab.js";

let rmbtn=()=>{};
/**@type ShowModal */
let showModal=(show)=>document.body;
/**@type Splash */
let splash=(mesg, dom)=>{};
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
/**@type (url:string, dest:SFile)=>Promise<void> */
export async function unzipURL(url, dest) {
    status("Fetching: "+url);
    const response = await fetch(url);
    console.log("Downloading...");
    let blob=await response.blob();
    console.log("Unpacking");
    return await unzipBlob(blob,dest);
}
/**@type (blob:Blob, dest:SFile)=>Promise<void> */
export async function unzipBlob(blob, dest) {
    const pNode=getInstance();
    const FS=pNode.getFS();
    status("unzipping blob ");
    let zip=FS.get("/tmp/boot.zip");
    await zip.setBlob(blob);
    dest.mkdir();
    await FS.zip.unzip(zip,dest,{v:1});
}
/**@type (run:SFile)=>SFile */
export function fixrun(run){
    try{
        if(run.isDir())return run;
        const ls=run.ls();
        if(!ls.includes("package.json")&&
        ls.length==1){
            run=run.rel(ls[0]);
        }
    }catch(e){
        console.error(e);
    }
    return run;
}
/**@type (url:string)=>Promise<void> */
export async function networkBoot(url){
    await getMountPromise();
    const pNode=getInstance();
    let boot=pNode.file(process.env.INSTALL_DIR);
    let rescue=false;
    if (boot.exists()) {
        if (!confirm(`Found installation in '${process.env.INSTALL_DIR}'. Boot with Rescue mode in '${process.env.RESCUE_DIR}'.`)) return;
        boot=pNode.file(process.env.RESCUE_DIR);
        rescue=true;
    }
    process.env.boot=boot;
    process.env.installation=rescue?"rescue":"install";
    const c=await getValue("readyPromises").vConsole;
    if (c) c.show();
    await unzipURL(url, boot);
    status("Boot start!");
    rmbtn();
    await timeout(1);
    if (c) c.hide();
    const mod=await pNode.importModule(fixrun(boot));
    if(can(mod,"install"))mod.install();
}
export function insertBootDisk() {
    const pNode=getInstance();
    showModal(true);/*qsExists(".modal-container");
    modal.setAttribute("style","");*/
    const cas=qsExists(".modal-dialog.upload");//createElement("input");
    cas.setAttribute("style","");
    //document.body.appendChild(cas);
    if (process.env.BOOT_DISK_URL) {
        const a=qsExists(cas, "a");
        //const dl=document.createElement("div");
        a.innerHTML="Download Sample Boot Disk";
        a.setAttribute("href",process.env.BOOT_DISK_URL);
        //document.body.appendChild(dl);
    }
    //const cas=document.querySelector("#casette");
    const file=qsExists(cas, ".file");
    file.addEventListener("input",async function () {
        const run=pNode.file(process.env.RESCUE_DIR);
        //@ts-ignore
        const file=this.files && this.files[0];
        if (!file) throw new Error("File is not selected.");
        const c=await getValue("readyPromises").vConsole;
        c?.show();
        await unzipBlob(file,run);
        c?.hide();
        rmbtn();
        showModal(false);
        const mod=await pNode.importModule(fixrun(run));
        if(can(mod,"install")) mod.install();
    });
}
export async function resetall(){
    if(prompt("type 'really' to clear all data")!=="really")return;
    const sp=showModal(".splash");
    await splash("deleting...",sp);
    const tab=readFstab();
    const pNode=getInstance();
    const FS=pNode.getFS();
    for (let {mountPoint,fsType,options} of tab) {
      if(fsType==="idb"){
        await deleteAllTablesInDatabase(options.dbName);
        /*console.log("DELETING", mountPoint);
        for(let f of pNode.file(mountPoint).listFiles()){
          console.log("DELETING", f.path());
          f.rm({r:true});
        }*/
      }
    }
    for(let k in localStorage){
        delete localStorage[k];
    }
    localStorage["/"]="{}";
    const r=FS.getRootFS();
    while(r.hasUncommited()) {
        await timeout(100);
    }
    showModal();
    location.reload();
}
export async function fullBackup(){
    const pNode=getInstance();
    const FS=pNode.getFS();
    const sp=showModal(".splash");
    await splash("zipping...",sp);
    await FS.zip.zip(FS.get("/"));
    showModal();
}