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
export async function reload(path="/fstab.json") {
    await unmountExceptRoot();
    // fstab.json does NOT contains root
    await mount();
}
export async function unmountExceptRoot(){
    const pNode=getInstance();
    const fs=pNode.getNodeLikeFs();
    const mounted=fs.fstab().filter(f=>f.mountPoint!=="/").map(f=>f.mountPoint);
    for (let m of mounted){
        fs.unmount(m);
    }
}
export async function wakeLazies(){
    const pNode=getInstance();
    const fs=pNode.getNodeLikeFs();
    const mounted=fs.fstab();
    for (let m of mounted) {
        await fs.promises.readdir(m.mountPoint);
    }
}
export async function mount(path="/fstab.json") {
    const pNode=getInstance();
    const _fs=pNode.getNodeLikeFs();
    const tab=readFstab(path);
    for (let {mountPoint,fsType,options} of tab) {
        // FS.mountAsync does not clear _fs.linkCache
        await _fs.mount(mountPoint,fsType,options);
    }
    mountPromise.resolve();
}