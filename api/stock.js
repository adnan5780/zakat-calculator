const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { symbol } = req.query;
  if (!symbol) { res.status(400).json({ error: 'Symbol required' }); return; }

  const API_KEY = 'd6k81i1r01qko8c3qetgd6k81i1r01qko8c3qeu0';

  try {
    const [quote, metrics, bs] = await Promise.all([
      httpsGet(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`),
      httpsGet(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`),
      httpsGet(`https://finnhub.io/api/v1/financials?symbol=${symbol}&statement=bs&freq=annual&token=${API_KEY}`)
    ]);

    res.status(200).json({ quote, metrics, bs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
