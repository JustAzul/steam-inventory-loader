/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
const { formatNumber } = require('azul-tools');
const Azul = require('..');
const cfg = require('./config');

process.nextTick(async () => {
  const id = cfg.steamID64;

  const TimeKey = `Azul Loader (${id})`;
  console.log(`Testing Azul Loader (${id})`);

  console.time(TimeKey);
  const Inventory = await Azul.Loader(id, cfg.appID, cfg.contextID);
  console.timeEnd(TimeKey);

  console.log(`Inventory Size: ${formatNumber(Inventory.count)} items`);
  console.log(`Memory Usage: ${require('./memory')()}`);
});
