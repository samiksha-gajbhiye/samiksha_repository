const axios = require('axios');
const app = require('../src/app');

async function main() {
  const server = app.listen(0, '127.0.0.1', async () => {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    try {
      const health = await axios.get(`${base}/health`, { timeout: 5000 });
      console.log('Health:', health.status, health.data);
    } catch (e) {
      console.error('Health check failed:', e.message);
    }

    try {
      const rt = await axios.get(`${base}/api/v1/stocks/realtime?symbols=MSFT,AAPL`, { timeout: 15000 });
      console.log('Realtime status:', rt.status);
      console.log('Realtime body keys:', Object.keys(rt.data));
      console.log('Realtime meta:', rt.data.meta);
      console.log('Realtime quotes sample:', Array.isArray(rt.data.quotes) ? rt.data.quotes.slice(0, 2) : rt.data.quotes);
    } catch (e) {
      if (e.response) {
        console.log('Realtime status:', e.response.status);
        console.log('Realtime error:', e.response.data);
      } else {
        console.error('Realtime request failed:', e.message);
      }
    } finally {
      server.close(() => process.exit(0));
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
