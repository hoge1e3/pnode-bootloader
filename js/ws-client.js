//@ts-check
import { mutablePromise } from "./util.js";
export function init(home) {
    const mp=mutablePromise();
    const ws = new WebSocket("ws://localhost:8080");
    //const files = {}; // path -> {mtime, content}
    const log=(...a)=>console.log("websocket",...a);
    ws.addEventListener("open", () => {
        log("connected");
    });
    ws.addEventListener("message", e => {
        const _data = JSON.parse(e.data);
        if (_data.type === "init") {
            for (let f of home.listFiles()) f.rm({r:true});
            //console.log("init", _data);
            for (let {path, info} of _data.files) {
                writeFile(path, info, true);
            }
            //Object.assign(files, _data.files);
            log("initialized: " + (_data.files).length + "Files");
            startWatch();
            mp.resolve();
        } else if (_data.type === "update") {
            const { path, info } = _data;
            const cur = readFile(path);
            if (!cur || info.mtime > cur.mtime) {
                writeFile(path, info, true);
                log("updated from server: " + path);
            }
        } else if (_data.type === "delete") {
            const { path } = _data;
            deleteFile(path, true);
            log("deleted from server: " + path);
        }
    });
    function startWatch(){
        home.watch((type, file)=>{
            const path=file.relPath(home);
            if (file.isDir()) return;
            setTimeout(()=>{
                if (file.exists()) {
                    ws.send(JSON.stringify({
                        type: "update",
                        path,
                        info: readFile(path),
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: "delete",
                        path
                    }));
                }
            },100);
        });
    }

    // --- API ---
    function readFile(path) {
        const f=home.rel(path);
        return f.exists() ? {mtime: f.lastUpdate(), content:f.dataURL()} : null ;// files[path] || null;
    }
    function writeFile(path, info, nosend) {
        const f=home.rel(path);
        //console.log("path-info",path, info);
        f.dataURL(info.content);
        //files[path] = info;
        if (nosend) return;
        ws.send(JSON.stringify({
            type: "update",
            path,
            info
        }));
    }
    function deleteFile(path, nosend) {
        const f=home.rel(path);
        if (!f.exists()) return;
        f.rm();//    delete files[path];
        if (nosend) return;
        ws.send(JSON.stringify({
            type: "delete",
            path
        }));
    }
    return mp;
}