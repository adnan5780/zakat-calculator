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

  const API_KEY = 'QY1V3ZK5JWL1PXNK9ERX138NK9ERX';

  try {
    const data = await httpsGet(
      `https://api.metals.dev/v1/latest?api_key=${API_KEY}&currency=USD&unit=g`
    );

    if (!data || !data.metals) {
      res.status(500).json({ error: 'Could not fetch metal prices' });
      return;
    }

    const goldPerGram = data.metals.gold;
    const silverPerGram = data.metals.silver;

    res.status(200).json({ goldPerGram, silverPerGram });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
