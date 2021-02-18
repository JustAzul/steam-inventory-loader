"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const getInventory_1 = __importDefault(require("../getInventory"));
const getInventory = (SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useSqlite = false, useCache = true, CacheDuration = 15, test = false) => {
    return new Promise((resolve, reject) => {
        const o = {
            workerData: {
                SteamID64, appID, contextID, tradableOnly, SteamCommunity_Jar, useSqlite, useCache, CacheDuration, test
            }
        };
        const worker = new worker_threads_1.Worker(__filename, o);
        worker.once("error", e => {
            worker.unref();
            reject(e);
        });
        worker.once("message", Result => {
            worker.unref();
            resolve(Result);
        });
    });
};
if (!worker_threads_1.isMainThread) {
    (async () => {
        const Result = await getInventory_1.default(worker_threads_1.workerData.SteamID64, worker_threads_1.workerData.appID, worker_threads_1.workerData.contextID, worker_threads_1.workerData.tradableOnly, worker_threads_1.workerData.SteamCommunity_Jar, worker_threads_1.workerData.useSqlite, worker_threads_1.workerData.useCache, worker_threads_1.workerData.CacheDuration, worker_threads_1.workerData.test);
        worker_threads_1.parentPort?.postMessage(Result);
    })();
}
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL1dvcmtlci9nZXRJbnZlbnRvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtREFBNEU7QUFDNUUsbUVBQXdFO0FBRXhFLE1BQU0sWUFBWSxHQUFHLENBQUMsU0FBaUIsRUFBRSxLQUFzQixFQUFFLFNBQTBCLEVBQUUsZUFBd0IsSUFBSSxFQUFFLGtCQUF1QixFQUFFLFlBQXFCLEtBQUssRUFBRSxXQUFvQixJQUFJLEVBQUUsZ0JBQXdCLEVBQUUsRUFBRSxPQUFnQixLQUFLLEVBQWtDLEVBQUU7SUFDM1IsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLENBQUMsR0FBRztZQUNOLFVBQVUsRUFBRTtnQkFDUixTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsSUFBSTthQUMxRztTQUNKLENBQUE7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLHVCQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3JCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDNUIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFRCxJQUFHLENBQUMsNkJBQVksRUFBRTtJQUNkLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDUixNQUFNLE1BQU0sR0FBRyxNQUFNLHNCQUFnQixDQUFDLDJCQUFVLENBQUMsU0FBUyxFQUFFLDJCQUFVLENBQUMsS0FBSyxFQUFFLDJCQUFVLENBQUMsU0FBUyxFQUFFLDJCQUFVLENBQUMsWUFBWSxFQUFFLDJCQUFVLENBQUMsa0JBQWtCLEVBQUUsMkJBQVUsQ0FBQyxTQUFTLEVBQUUsMkJBQVUsQ0FBQyxRQUFRLEVBQUUsMkJBQVUsQ0FBQyxhQUFhLEVBQUUsMkJBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsUCwyQkFBVSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwQyxDQUFDLENBQUMsRUFBRSxDQUFDO0NBQ1I7QUFFRCxrQkFBZSxZQUFZLENBQUMifQ==