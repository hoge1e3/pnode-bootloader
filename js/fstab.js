//@ts-check
/**
 * @typedef { import("./types").MultiSyncIDBStorage } MultiSyncIDBStorage
 */
import { getInstance } from "./pnode.js";
import { mutablePromise, directorify} from "./util.js";
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
                /*const storage=fs.storage;
                if (storage) {
                    removeAllFromIDB(storage, mountPoint);
                }*/
            }
        }
    }
    if (wsMountPoint){ 
        const ws=await import("./ws-client.js");
        await ws.init(FS.get(wsMountPoint));
        await FS.getRootFS().commitPromise();
        const rootPkgJson=FS.get("/package.json");
        if (!rootPkgJson.exists() && process.env.INSTALL_DIR && FS.get(process.env.INSTALL_DIR).exists()) {
            rootPkgJson.obj({
                menus: {
                    run: {
                        main: process.env.INSTALL_DIR,
                        call: ["main"],
                    }
                }
            });
            alert(`Websocket sync dir is available on ${process.env.INSTALL_DIR}. Reload to show launch menu.`);
        }
    }
    mountPromise.resolve();
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