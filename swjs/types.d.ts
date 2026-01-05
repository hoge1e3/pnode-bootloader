
export type WSFileInfo={
    content:string;
    mtime:number;
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
export type PrefetchScriptOptions={
    module?: boolean;
    global?: string;
};

