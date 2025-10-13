//@ts-check
/**
 * @typedef { import("./types").MultiSyncIDBStorage } MultiSyncIDBStorage
 */
import { getInstance } from "./pnode.js";
import { mutablePromise} from "./util.js";
import { assign } from "./global.js";
let mountPromise=mutablePromise();
const defaultFSTab=[
    {mountPoint:"/tmp", fsType:"ram", options:{}},
    {mountPoint:"/idb", fsType:"idb", options:{dbName: "petit-fs", storeName: "kvStore"}},
];
export function getMountPromise() {
    return mountPromise;
}
assign({getMountPromise});
export function readFstab(path="/fstab.json") {
    const pNode=getInstance();
    const f=pNode.file(path);
    if (f.exists()) return f.obj();
    return defaultFSTab;
}
export async function mount(path="/fstab.json") {
    const pNode=getInstance();
    const FS=pNode.getFS();
    const useWS=location.href.match(/localhost/);
    const tab=readFstab(path);
    let wsMountPoint;
    
    for (let {mountPoint,fsType,options} of tab) {
        const fs=await FS.mountAsync(mountPoint,fsType,options);
        if (useWS) {
            if (fsType==="idb" && mountPoint.match(/^\/idb\b/) && !wsMountPoint) {
                wsMountPoint=mountPoint;
                console.log("wsMountPoint", wsMountPoint);
                /** @ts-ignore */
                const storage=fs.storage;
                if (storage) {
                    removeAllFromIDB(storage);
                }
            }
        }
    }
    if (wsMountPoint){ 
        const ws=await import("./ws-client.js");
        await ws.init(FS.get(wsMountPoint));
        await FS.getRootFS().commitPromise();
    }
    mountPromise.resolve();
}
/**
 * @param storage {MultiSyncIDBStorage}
 */
export async function removeAllFromIDB(storage) {
    for (let k of storage.keys()) {
        //console.log(k); 
        storage.removeItem(k);
    }
    await storage.waitForCommit();
}