//@ts-check
import { getInstance } from "./pnode.js";
import {deleteAllTablesInDatabase, mutablePromise} from "./util.js";
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
    if (useWS) {
        for (let {mountPoint,fsType,options} of tab) {
            if (fsType==="idb" && mountPoint.match(/^\/idb\b/) && !wsMountPoint) {
                wsMountPoint=mountPoint;
                console.log("wsMountPoint", wsMountPoint);
                await deleteAllTablesInDatabase(options.dbName);
            }
        }
    }
    for (let {mountPoint,fsType,options} of tab) {
        await FS.mountAsync(mountPoint,fsType,options);
    }
    if (wsMountPoint){ 
        const ws=await import("./ws-client.js");
        await ws.init(FS.get(wsMountPoint));
    }
    mountPromise.resolve();
}