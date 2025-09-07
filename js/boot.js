//@ts-check
import { getGlobal,getValue } from "./global.js";
import { getInstance } from "./pnode.js";
import { qsExists, timeout } from "./util.js";
import { getMountPromise } from "./fstab.js";

let rmbtn=()=>0;
let showModal=(show)=>0;
export function wireUI(dc){
  rmbtn=dc.rmbtn;
  showModal=dc.showModal;
}
function status(...a){
    console.log(...a);
}
export async function unzipURL(url, dest) {
    status("Fetching: "+url);
    const response = await fetch(url);
    console.log("Downloading...");
    let blob=await response.blob();
    console.log("Unpacking");
    return await unzipBlob(blob,dest);
}
export async function unzipBlob(blob, dest) {
    const pNode=getInstance();
    const FS=pNode.getFS();
    status("unzipping blob ");
    let zip=FS.get("/tmp/boot.zip");
    await zip.setBlob(blob);
    dest.mkdir();
    await FS.zip.unzip(zip,dest,{v:1});
}
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
    const c=getValue("vConsole");
    if (c) c.show();
    await unzipURL(url, boot);
    status("Boot start!");
    rmbtn();
    await timeout(1);
    if (c) c.hide();
    await pNode.importModule(fixrun(boot));
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
        const run=pNode.file(process.env.boot);
        const file=this.files && this.files[0];
        if (!file) throw new Error("File is not selected.");
        getGlobal().vConsole?.show();
        await unzipBlob(file,run);
        getGlobal().vConsole?.hide();
        rmbtn();
        showModal(false);
        pNode.importModule(fixrun(run));
    });
}
export async function resetall(a){
    if(prompt("type 'really' to clear all data")!=="really")return;
    for(let k in localStorage){
        delete localStorage[k];
    }
    localStorage["/"]="{}";
}
export async function fullBackup(){
    const pNode=getInstance();
    const FS=pNode.getFS();
    await FS.zip.zip(FS.get("/"));
}
