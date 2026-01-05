//@ts-check
/**
 * @typedef { import("./types").Menus } Menus
 * @typedef { import("./types").Menu } Menu
 * @typedef { import("./types").ShowModal } ShowModal
 * @typedef { import("./types").RootPackageJSON } RootPackageJSON
 */
/** @type any */
const g=globalThis;


/**
 * 
 * @param {string} url 
 * @param {any} attr 
 * @returns 
 */
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
/**@type {{[key:string]:{value:any}}} */
export const prefetched={};// {[key:url]:{value}}
/**
 * 
 * @param {string} url 
 * @param {import("./types").PrefetchScriptOptions} [options]
 * @returns 
 */
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
        const value=(global?g[global]:null);
        prefetched[url]={value};
        return prefetched[url];
    }
}
