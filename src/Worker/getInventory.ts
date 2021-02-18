import {isMainThread, parentPort, Worker, workerData} from 'worker_threads';
import raw_getInventory, {AzulInventoryResponse} from '../getInventory';

export const getInventory = (SteamID64: string, appID: string | number, contextID: string | number, tradableOnly: boolean = true, SteamCommunity_Jar: any, useSqlite: boolean = false, useCache: boolean = true, CacheDuration: number = 15): Promise<AzulInventoryResponse> => {
    return new Promise((resolve, reject) => {
        const o = {
            workerData: {
                SteamID64, appID, contextID, tradableOnly, SteamCommunity_Jar, useSqlite, useCache, CacheDuration
            }
        }
    
        const worker = new Worker(__filename, o);
    
        worker.once("error", e => {
            worker.unref();
            reject(e);
        });
    
        worker.once("message", Result => {
            worker.unref();
            resolve(Result);
        });
    });
}

if(!isMainThread) {
    (async () => {
        const Result = await raw_getInventory(workerData.SteamID64, workerData.appID, workerData.contextID, workerData.tradableOnly, workerData.SteamCommunity_Jar, workerData.useSqlite, workerData.useCache, workerData.CacheDuration);
        parentPort?.postMessage(Result);
    })();
}

export default getInventory;