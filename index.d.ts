declare module 'macaddress' {
  export type MacAddresCallback = (err: any, data: any) => void;

  export type MacAddressOneCallback = (err: any, mac: string) => void;

  export function one(ifaceOrCallback: string | MacAddressOneCallback, callback?: MacAddressOneCallback): void;

  export function all(callback: MacAddresCallback): void;

  export function networkInterfaces(): any;
}
