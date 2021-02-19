const SteamCommunity = require('steamcommunity');
const Community = new SteamCommunity();

const Loader = (id) => {
    return new Promise((resolve, reject) => {

        Community.getUserInventoryContents(id, cfg.AppID, cfg.contextid, true, (err, inventory) => {
            if (!err) {
                resolve(inventory);
                return;
            }

            if (err) reject(err);
        });
    });
}

const cfg = require('./Config');
const {formatNumber} = require('azul-tools');

process.nextTick(async () => {
    const id = cfg.SteamID;

    const TimeKey = `SteamCommunity Loader (${id})`;
    console.log(`Testing SteamCommunity Loader`);

    console.time(TimeKey);
    const Inventory = await Loader(id);
    console.log(`Inventory Size: ${formatNumber(Inventory.length)} items`);
    console.log(`Memory Usage: ${require('./Memory')()}`);
    console.timeEnd(TimeKey);
    // clearInterval(interval);
})

/* let i = 0;
const interval = setInterval(()=> {
    i++
    console.log(`${i} seconds`)
}, 1000) */