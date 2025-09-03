//@ts-check
import { getInstance } from "./pnode.js";

let rmbtn=()=>0;
export function setRmbtn(f) {rmbtn=f;}
function status(...a){
    console.log(...a);
}
export async function unzipURL(url, dest) {
    status("Fetching: "+url);
    const response = await fetch(url);
    console.log(response);
    let blob=await response.blob();
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
    const pNode=getInstance();
    const boot=pNode.file(process.env.boot);
    await unzipURL(url, boot);
    status("Boot start!");
    rmbtn();
    await pNode.importModule(fixrun(boot));
}
export function insertBootDisk() {
    const pNode=getInstance();
    const cas=document.createElement("input");
    cas.setAttribute("type","file");
    document.body.appendChild(cas);
    if (process.env.BOOT_DISK_URL) {
        const dl=document.createElement("div");
        dl.innerHTML=`<a href="${process.env.BOOT_DISK_URL}">Download Sample Boot Disk</a>`;
        document.body.appendChild(dl);
    }
    //const cas=document.querySelector("#casette");
    cas.addEventListener("input",async function () {
        const run=pNode.file(process.env.boot);
        const file=this.files && this.files[0];
        if (!file) throw new Error("File is not selected.");
        await unzipBlob(file,run);
        rmbtn();
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
