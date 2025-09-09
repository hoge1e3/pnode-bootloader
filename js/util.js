//@ts-check
export function getQueryString(key, default_) {
    if (arguments.length === 1) default_ = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(location.href);
    if (qs == null) return default_;else return decodeURLComponentEx(qs[1]);
}
export function decodeURLComponentEx(s) {
    return decodeURIComponent(s.replace(/\+/g, '%20'));
}
export function onReady(callback) {
    if (document.readyState==="complete") callback();
    else addEventListener("load",callback);
}
export function can(o,n){
  return n in o && typeof o[n]==="function" && o[n];
}
export const timeout=(t)=>new Promise(s=>setTimeout(s,t));
function mp(){
    const t=()=>{
        let v=t,f,c=()=>v!==t&&f&&f(v);
        // @ts-ignore
        return{v:(_)=>c(v=_),f:(_)=>c(f=_)};
    },s=t(),e=t();return Object.assign(
    new Promise((a,b)=>s.f(a)+e.f(b)),
    {resolve:s.v, reject:e.v});
}
export const mutablePromise=mp;
export function isPlainObject(o) {
    return o && o.__proto__===Object.prototype;
}
export function qsExists(...a) {
    const [root, q]=a.length>=2?a:[document, a[0]];
    const r=root.querySelector(q);
    if (!r) throw new Error(`${q} does not exist`);
    return r;
}
