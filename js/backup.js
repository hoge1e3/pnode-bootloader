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
    await wakeLazies();  
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
}
export async function fullBackup(){
    const pNode=getInstance();
    const FS=pNode.getFS();
    const sp=showModal(".splash");
    await splash("Activate all fs...",sp);
    await wakeLazies();
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
    const JSZip=await pNode.importModule("pnode:jszip");
    const jszip = new JSZip();
    await jszip.loadAsync(arrayBuf);
    const _fs=pNode.getNodeLikeFs();
    const _path=await pNode.importModule("path");
    const fstabName="fstab.json";
    const fstabPath="/"+fstabName;
    
    const zipEntry = jszip.files[fstabName];
    if (zipEntry) {
        const fstab_str = await zipEntry.async("string");
        if (!_fs.existsSync(fstabPath) ||
            _fs.readFileSync(fstabPath,{encoding:"utf8"})!==fstab_str) {
            splash("Unmounting existing fs",sp);
            await unmountExceptRoot();
            _fs.writeFileSync(fstabPath, fstab_str);
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
        const filePath="/"+key;
        console.log("Unzip", filePath);
        await _fs.promises.mkdir(_path.dirname(filePath), {recursive:true} );
        if (!zipEntry.dir) {
            const buf = await zipEntry.async("arraybuffer");
            await _fs.promises.writeFile(filePath, buf);
        }
    }
    splash("Waiting for commit...",sp);
    await _fs.getRootFS().commitPromise();
    showModal();
}