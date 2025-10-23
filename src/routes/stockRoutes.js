const express = require('express');
const { getOrSet } = require('../lib/cache');
const { fetchQuotes } = require('../services/alphaVantageService');
const config = require('../config/env');

const router = express.Router();

router.get('/realtime', async (req, res) => {
  const symbolsParam = req.query.symbols || config.defaultSymbols.join(',');
  try {
    const { value, fromCache } = await getOrSet(
      'quotes',
      symbolsParam,
      async () => await fetchQuotes(symbolsParam),
      config.cacheTtlSeconds
    );

    res.status(200).json({ ...value, cache: { hit: fromCache, ttlSeconds: config.cacheTtlSeconds } });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message, details: err.details });
  }
});

module.exports = router;
