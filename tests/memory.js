const used = process.memoryUsage().heapUsed / 1024 / 1024;
module.exports = () => `${Math.round(used * 100) / 100} MB`;
