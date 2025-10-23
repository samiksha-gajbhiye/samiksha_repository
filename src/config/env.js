const path = require('path');
const dotenv = require('dotenv');

// Load .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnvVar(key, defaultValue) {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}

const config = {
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  alphaVantageApiKey: getEnvVar('ALPHA_VANTAGE_API_KEY', ''),
  alphaVantageBaseUrl: getEnvVar('ALPHA_VANTAGE_BASE_URL', 'https://www.alphavantage.co'),
  cacheTtlSeconds: parseInt(getEnvVar('CACHE_TTL_SECONDS', '60'), 10),
  defaultSymbols: getEnvVar(
    'DEFAULT_STOCK_SYMBOLS',
    'MSFT,AAPL,GOOGL,TSLA,AMZN,NVDA,JPM,V,MA,PFE,BABA,INTC'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  alphaVantageFunction: getEnvVar('ALPHA_VANTAGE_FUNCTION', 'BATCH_STOCK_QUOTES'),
};

module.exports = config;
