export type SFile={
    exists(): boolean;
    obj(): any;
    mkdir():void;
    isDir():boolean;
    ls():string[];
    rel(path:string):SFile;
    path():string;
    relPath(base:SFile):string;
    lastUpdate():number;
    dataURL(u:string):void;
    dataURL():string;
    rm():void;
    setBlob(b:Blob):Promise<void>;
    watch(h:(type:string, file:SFile)=>void):void;
};
export type WSFileInfo={
    content:string;
    mtime:number;
};
export type PNode={
    boot():Promise<void>;
    version:string;
    getFS():TFS
    importModule(f:SFile):any;
    file(path:string):SFile;
    resolveEntry(f:SFile):Entry;
    ESModuleCompiler:{
        create(handlers:PNodeCompileHandler):{
            compile(e:Entry):Promise<PNodeModule>;        
        };
    }
};
export type RootFS={
    hasUncommited():boolean;
    commitPromise():Promise<void>;
};
export type TFS={
    get(path:string):SFile;
    getRootFS(): RootFS;
    mountAsync(mountPoint:string,fsType:string,options?:any):Promise<void>;
    zip:{
        unzip(zipfile:SFile, dest:SFile, options:any):Promise<void>;
        zip(src:SFile):Promise<void>;
    },
};
export interface MutablePromise<T> extends Promise<T>{
    resolve(value?:T):void;
    reject(e:Error):void;
}
export type ShowModal=(qs?:string|boolean)=>HTMLElement;
export type Splash=(mesg:string, dom:HTMLElement)=>Promise<void>;
export type WireUIDC={
    rmbtn: ()=>void,
    showModal: ShowModal,
    splash: Splash;
};
export type IDBSuccess={
    target: {
        result: IDBDatabase
    }
}
export type RootPackageJSON={
    prefetch?: string[],
    menus: Menus,
};
export type Menus={[key:string]:Menu};
export type Menu={
    icontext?:string,
    main:string,
    auto?:boolean, 
    submenus?:any,
    call?: [string,...any],
};
export type Entry={
    file:SFile;
};
export type PNodeModule={
    entry: Entry;
};
export type PNodeCompileHandler={
    oncompilestart(e:{entry:Entry}):void;
    oncachehit(e:{entry:Entry}):void;
    oncompiled(e:{module:PNodeModule}):void;
};
export type PrefetchScriptOptions={
    module?: boolean;
    global?: string;
};