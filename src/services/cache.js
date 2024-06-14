const NodeCache = require('node-cache');
const cache = new NodeCache(
    { 
        // This data will most definitely not change often, so we can set a longer TTL.
        stdTTL: 43200,
        checkperiod: 600  
    }
);

module.exports = cache;