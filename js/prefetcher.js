//@ts-check
import {mutablePromise,timeout} from "./util.js";
import { getInstance } from "./pnode.js";
let quick;
const handlers={
    async oncompilestart({entry}) {
        if(quick)return;
        await timeout(0);
        //console.log("Compile start ",entry.file.path());
    },
    async oncompiled({module}) {
        if(quick)return;
        await timeout(0);
        console.log("Compile complete ",module.entry.file.path());
    },
    async oncachehit({entry}) {
        if(quick)return;
        await timeout(0);
        //if (entry) console.log("In cache ",entry.file.path());
    }
};
export function doQuick() {
  quick=1;
}
export async function prefetchModule(file) {
    const pNode=getInstance();
    const e=pNode.resolveEntry(file);
    const compiler=pNode.ESModuleCompiler.create(handlers);
    const r=await compiler.compile(e);
    return r;
}
let prefetched_auto_url=mutablePromise();
export function getPrefetchedAutoURL() {
    return prefetched_auto_url;
}
export async function prefetchAuto({mainF}) {
    try {
        const r=await prefetchModule(mainF);
        prefetched_auto_url.resolve(r.url);
        console.log("Prefentched auto start",r.url);
    }catch(e) {
        prefetched_auto_url.reject(e);
        console.error(e);
    }
}
export function loadScriptTag(url,attr={}){
    if (attr.type!=="module" && 
    // @ts-ignore
    typeof define==="function" && define.amd && typeof requirejs==="function") {
        return new Promise(
        // @ts-ignore
        (s)=>requirejs([url],(r)=>s(r)));
    }
    const script = document.createElement('script');
    script.src = url;
    for(let k in attr){
        script.setAttribute(k,attr[k]);
    }
    return new Promise(
    function (resolve,reject){
        script.addEventListener("load",resolve);
        script.addEventListener("error",reject);
        document.head.appendChild(script);
    });
}
export const prefetched={};// {[key:url]:{value}}
export async function prefetchScript(url, options) {
    const {module, global, }=options||{};
    if (prefetched[url]) {
        console.log("Using prefeteched",url);
        return prefetched[url];
    }
    /*if (dependencies) {
        await Promise.all(dependencies.map(url=>prefetchScript(url)));
    }*/
    if (module) {
        const value=await import(url);
        prefetched[url]={value};
        return prefetched[url];
    } else {
        await loadScriptTag(url);
        const value=(global?globalThis[global]:null);
        prefetched[url]={value};
        return prefetched[url];
    }
}
