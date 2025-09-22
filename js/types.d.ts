type SFile={
    exists(): boolean;
    obj(): any;
    mkdir():void;
    isDir():boolean;
    ls():string[];
    rel(path:string):SFile;
};
type ShowModal=(qs?:string|boolean)=>HTMLElement;
type Splash=(mesg:string, dom:HTMLElement)=>void;
type WireUIDC={
    rmbtn: ()=>void,
    showModal: ShowModal,
    splash: Splash;
};
type IDBSuccess={
    target: {
        result: IDBDatabase
    }
}
type RootPackageJSON={
    prefetch?: string[],
    menus: Menus,
};
type Menus={[key:string]:Menu};
type Menu={
    icontext?:string,
    main:string,
    auto?:boolean, 
    submenus?:any,
    call?: [string,...any],
};
