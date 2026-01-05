//@ts-check
import { isPlainObject } from "./util.js";

/** @type {any} */
const g=globalThis;
const NAME="pNodeBootLoader";
/** @type any */
const serviceWorkerKit=g[NAME]||{};
g[NAME]=serviceWorkerKit;
export function getGlobal() {
    return serviceWorkerKit;
}
/**
 * @param {string} k 
 * @returns any
 */
export function getValue(k) {
    return serviceWorkerKit[k] || g[k];
}
/**
 * @param {object} o 
 */
export function pollute(o) {
    assign(o, serviceWorkerKit);
    assign(o, globalThis);
}
/**
 * @param {any} o 
 */
export function assign(o, dst=serviceWorkerKit) {
    for (let k in o) {
        if (isPlainObject(o[k]) && isPlainObject(dst[k])) {
            assign(o[k], dst[k]);
        } else {
            dst[k]=o[k];
        }
    }
}
/**
 * @param {any} o 
 */
export function assignDefault(o, dst=serviceWorkerKit) {
    for (let k in o) {
        if (isPlainObject(o[k]) && isPlainObject(dst[k])) {
            assignDefault(o[k], dst[k]);
        } else {
            dst[k]=dst[k]||o[k];
        }
    }
}
assignDefault({
    version:"1.0.0",
    getValue,
    assign, 
    assignDefault,
    pollute,
    env:{},
    readyPromises:{},
});