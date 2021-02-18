"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventory = void 0;
const worker_threads_1 = require("worker_threads");
const getInventory_1 = __importDefault(require("../getInventory"));
const getInventory = (SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useSqlite = false, useCache = true, CacheDuration = 15) => {
    return new Promise((resolve, reject) => {
        const o = {
            workerData: {
                SteamID64, appID, contextID, tradableOnly, SteamCommunity_Jar, useSqlite, useCache, CacheDuration
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
exports.getInventory = getInventory;
if (!worker_threads_1.isMainThread) {
    (async () => {
        const Result = await getInventory_1.default(worker_threads_1.workerData.SteamID64, worker_threads_1.workerData.appID, worker_threads_1.workerData.contextID, worker_threads_1.workerData.tradableOnly, worker_threads_1.workerData.SteamCommunity_Jar, worker_threads_1.workerData.useSqlite, worker_threads_1.workerData.useCache, worker_threads_1.workerData.CacheDuration);
        worker_threads_1.parentPort?.postMessage(Result);
    })();
}
exports.default = exports.getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL1dvcmtlci9nZXRJbnZlbnRvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsbURBQTRFO0FBQzVFLG1FQUF3RTtBQUVqRSxNQUFNLFlBQVksR0FBRyxDQUFDLFNBQWlCLEVBQUUsS0FBc0IsRUFBRSxTQUEwQixFQUFFLGVBQXdCLElBQUksRUFBRSxrQkFBdUIsRUFBRSxZQUFxQixLQUFLLEVBQUUsV0FBb0IsSUFBSSxFQUFFLGdCQUF3QixFQUFFLEVBQWtDLEVBQUU7SUFDM1EsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLENBQUMsR0FBRztZQUNOLFVBQVUsRUFBRTtnQkFDUixTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxhQUFhO2FBQ3BHO1NBQ0osQ0FBQTtRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksdUJBQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDckIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUM1QixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQXBCWSxRQUFBLFlBQVksZ0JBb0J4QjtBQUVELElBQUcsQ0FBQyw2QkFBWSxFQUFFO0lBQ2QsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNSLE1BQU0sTUFBTSxHQUFHLE1BQU0sc0JBQWdCLENBQUMsMkJBQVUsQ0FBQyxTQUFTLEVBQUUsMkJBQVUsQ0FBQyxLQUFLLEVBQUUsMkJBQVUsQ0FBQyxTQUFTLEVBQUUsMkJBQVUsQ0FBQyxZQUFZLEVBQUUsMkJBQVUsQ0FBQyxrQkFBa0IsRUFBRSwyQkFBVSxDQUFDLFNBQVMsRUFBRSwyQkFBVSxDQUFDLFFBQVEsRUFBRSwyQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2pPLDJCQUFVLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxFQUFFLENBQUM7Q0FDUjtBQUVELGtCQUFlLG9CQUFZLENBQUMifQ==