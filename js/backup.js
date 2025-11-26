//@ts-check
/**
 * @typedef  { import("./types.js").MultiSyncIDBStorage } MultiSyncIDBStorage
 */
import { showModal, splash } from "./boot.js";
import { mount, readFstab, unmountExceptRoot, wakeLazies } from "./fstab.js";
import { getInstance } from "./pnode.js";
import { directorify, timeout } from "./util.js";
export async function factoryReset(){
    const sp=showModal(".splash");
    await splash("Factory reset...",sp);
    const pNode=getInstance();
    const _fs=pNode.getNodeLikeFs();
    for (let fs of _fs.fstab()) {
        if(fs.fstype()==="IndexedDB" && fs.storage) {
            await removeAllFromIDB(fs.storage, fs.mountPoint);
        }   
    }
    for(let k in localStorage){
        delete localStorage[k];
    }
    localStorage["/"]="{}";
    await _fs.commitPromise();
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

/**
 * @param storage {MultiSyncIDBStorage}
 * @param mountPoint {string}
 */
export async function removeAllFromIDB(storage, mountPoint) {
    mountPoint=directorify(mountPoint);
    for (let k of storage.keys()) {
        //console.log(k); 
        if (k==mountPoint) continue;
        storage.removeItem(k);
    }
    storage.setItem(mountPoint, "{}"); 
    await storage.waitForCommit();
}
/**
 * 
 * @param {ArrayBuffer} arrayBuf 
 */
export async function fullRestore(arrayBuf){
    
    const sp=showModal(".splash");
    const pNode=getInstance();
    const JSZip=await pNode.importModule("jszip");
    const jszip = new JSZip();
    await jszip.loadAsync(arrayBuf);
    const _fs=pNode.getNodeLikeFs();
    const zipEntry = jszip.files["fstab.json"];
    if (zipEntry) {
        const fstab_str = await zipEntry.async("string");
        if (_fs.readFileSync("/fstab.json",{encoding:"utf8"})!==fstab_str) {
            splash("Unmounting existing fs",sp);
            await unmountExceptRoot();
            _fs.writeFileSync("/fstab.json",fstab_str);
            splash("Mounting new fs", sp);
            await mount();
            await factoryReset();
            showModal(".splash");
        }
    }
    splash("Activating all fs", sp);
    await wakeLazies();           
    splash("Unzipping files ", sp);
    for (let key of Object.keys(jszip.files)) {
        const zipEntry = jszip.files[key];
        const buf = await zipEntry.async("arraybuffer");
        _fs.writeFileSync("/"+zipEntry.name,buf);
    }
    showModal();
}