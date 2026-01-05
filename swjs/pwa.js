//@ts-check
import {assign, pollute} from "./global.js";
import { mutablePromise } from "./util.js";
export async function installPWA(swurl="./sw.js"){
    try {
        const registration=await navigator.serviceWorker.register(swurl, {type: 'module'});
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        console.log("registration",registration);
        const sw=registration.active;
        if (!sw) {
            throw new Error("sw is not found");
        }
        pollute({__serviceWorker__:sw});
        navigator.serviceWorker.addEventListener("message",({data})=>{
            console.log("CACHE_NAME",data.CACHE_NAME);
            pollute({__CACHE_NAME__:data.CACHE_NAME});
        },{once:true});
        sw.postMessage({type:"CACHE_NAME"});
    }catch(err) {
        console.error(err);
        console.log('ServiceWorker registration failed: ', err);
    }
}
/**
 * 
 * @param {object} data 
 */
export async function postToSw(data){
    const reg=await navigator.serviceWorker.ready;
    reg.active?.postMessage(data);
}
/**
 * 
 * @param {string} path 
 * @param {Blob} blob 
 */
export async function serveBlob(path, blob) {
    const mp=mutablePromise();
    const url=await path2url(path);
    navigator.serviceWorker.addEventListener("message", respHandler);
    /**
     * 
     * @param {MessageEvent} event 
     * @returns 
     */
    function respHandler(event) {
        const data=event.data;
        if (!data) return;
        if (data.type!=="response") return;
        if (data.for!=="serve_blob") return;
        if (data.url!==url) return;
        navigator.serviceWorker.removeEventListener("message",respHandler);
        mp.resolve(url);
    }
    postToSw({type:"serve_blob",url,blob});
    return mp;
}
/**
 * 
 * @param {string} path 
 * @returns {Promise<string>}
 */
export async function path2url(path) {
    const reg=await navigator.serviceWorker.ready;
    let base=reg.scope;
    if (!base.endsWith("/")) base+="/";
    if (path.startsWith("/")) path=path.substring(1);
    return base+"gen/"+path;
}
/**
 * 
 * @param {string} path 
 */
export async function fetchServed(path) {
    const resp=await fetch(await path2url(path));
    return resp;
}