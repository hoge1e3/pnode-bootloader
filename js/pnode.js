//@ts-check
import { assign, pollute } from "./global.js";
let pNode;
export function getInstance() {
    if (!pNode) throw new Error("Call 'init' first.");
    return pNode;
}
export async function loadPNode(env={}){
    env.PNODE_URL=env.PNODE_URL||"https://cdn.jsdelivr.net/npm/petit-node/dist/index.js";
    if (!env.PNODE_URL) throw new Error("PNODE_URL should set");
    pNode=await import(env.PNODE_URL);
    return pNode;
}
export async function init(env={}){
    await loadPNode(env);
    console.log("init");
    await pNode.boot();// 'process' is enabled here 
    Object.assign(process.env, env);
    process.env.PNODE_VER=pNode.version;
    //process.env.boot=process.env.TMP_BOOT||"/tmp/boot/";
    pollute({pNode, FS:pNode.FS});
    return pNode;
}
