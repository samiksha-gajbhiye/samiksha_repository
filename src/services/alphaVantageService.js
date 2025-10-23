const axios = require('axios');
const config = require('../config/env');

function buildSymbolsParam(symbols) {
  const list = Array.isArray(symbols) ? symbols : String(symbols || '').split(',');
  return list
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .join(',');
}

function mapBatchQuotesResponse(data) {
  // Handle Alpha Vantage BATCH_STOCK_QUOTES format
  const quotes = data?.['Stock Quotes'] || data?.['StockQuotes'] || [];
  return quotes.map((q) => ({
    symbol: q['1. symbol'] || q['symbol'],
    price: parseFloat(q['2. price'] || q['price']),
    volume: parseInt(q['3. volume'] || q['volume'] || '0', 10),
    timestamp: q['4. timestamp'] || q['timestamp'] || null,
  }));
}

function mapRealtimeBulkQuotesResponse(data) {
  // Hypothetical REALTIME_BULK_QUOTES structure fallback
  const quotes = data?.quotes || data?.['Realtime Quotes'] || [];
  return quotes.map((q) => ({
    symbol: q.symbol || q['symbol'],
    price: parseFloat(q.price || q['price']),
    volume: parseInt(q.volume || q['volume'] || '0', 10),
    timestamp: q.timestamp || q['timestamp'] || null,
  }));
}

async function fetchQuotes(symbols) {
  const functionName = config.alphaVantageFunction;
  const symbolParam = buildSymbolsParam(symbols || config.defaultSymbols);

  if (!config.alphaVantageApiKey) {
    const error = new Error('Missing Alpha Vantage API key');
    error.statusCode = 500;
    throw error;
  }

  const params = new URLSearchParams({
    function: functionName,
    symbols: symbolParam,
    apikey: String(config.alphaVantageApiKey),
  });

  const url = `${config.alphaVantageBaseUrl}/query?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'stocks-service/1.0 (+https://example.com)' },
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status !== 200) {
      const err = new Error(`Alpha Vantage HTTP ${response.status}`);
      err.statusCode = 502;
      err.details = response.data;
      throw err;
    }

    const data = response.data || {};

    if (data['Note'] || data['Information']) {
      const err = new Error('Alpha Vantage rate limit or informational response');
      err.statusCode = 429;
      err.details = data['Note'] || data['Information'];
      throw err;
    }

    if (data['Error Message']) {
      const err = new Error('Alpha Vantage API error');
      err.statusCode = 400;
      err.details = data['Error Message'];
      throw err;
    }

    // Map to our standardized model
    let quotes = [];
    if (functionName === 'BATCH_STOCK_QUOTES') {
      quotes = mapBatchQuotesResponse(data);
    } else {
      quotes = mapRealtimeBulkQuotesResponse(data);
    }

    return {
      quotes,
      meta: {
        symbols: symbolParam.split(','),
        function: functionName,
        source: 'alpha-vantage',
      },
    };
  } catch (error) {
    if (error.response) {
      const err = new Error('Alpha Vantage request failed');
      err.statusCode = 502;
      err.details = error.response.data;
      throw err;
    }
    if (error.code === 'ECONNABORTED') {
      const err = new Error('Alpha Vantage request timed out');
      err.statusCode = 504;
      throw err;
    }
    if (error.statusCode) {
      throw error;
    }
    const err = new Error('Unexpected Alpha Vantage client error');
    err.statusCode = 500;
    err.details = error.message;
    throw err;
  }
}

module.exports = { fetchQuotes };
