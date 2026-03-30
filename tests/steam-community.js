/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
const SteamCommunity = require('steamcommunity');

const Community = new SteamCommunity();
const { formatNumber } = require('azul-tools');
const cfg = require('./config');

const Loader = (id) => {
  return new Promise((resolve, reject) => {
    Community.getUserInventoryContents(
      id,
      cfg.appID,
      cfg.contextID,
      true,
      (err, inventory) => {
        if (!err) {
          resolve(inventory);
          return;
        }

        if (err) reject(err);
      },
    );
  });
};

process.nextTick(async () => {
  const id = cfg.steamID64;

  const TimeKey = `SteamCommunity Loader (${id})`;
  console.log(`Testing SteamCommunity Loader`);

  console.time(TimeKey);
  const Inventory = await Loader(id);
  console.log(`Inventory Size: ${formatNumber(Inventory.length)} items`);
  console.log(`Memory Usage: ${require('./memory')()}`);
  console.timeEnd(TimeKey);
});
