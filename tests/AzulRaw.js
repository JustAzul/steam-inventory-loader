const Azul = require('../');
const cfg = require('./Config');
const {formatNumber} = require('azul-tools');

process.nextTick(async () => {
    const id = cfg.SteamID;

    const TimeKey = `Azul Loader (${id})`;
    console.log(`Testing Azul Loader`);
    
    console.time(TimeKey);
    const Inventory = await Azul.Loader(id,cfg.AppID,cfg.contextid);
    console.log(`Inventory Size: ${formatNumber(Inventory.count)} items`);
    console.log(`Memory Usage: ${require('./Memory')()}`);
    console.timeEnd(TimeKey);
    // clearInterval(interval);
})

/* let i = 0;
const interval = setInterval(()=> {
    i++
    console.log(`${i} seconds`)
}, 1000) */