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

  const API_KEY = 'OWWSOT0K004I5E9C';

  try {
    // Fetch price quote and balance sheet in parallel
    const [quoteData, balanceSheetData] = await Promise.all([
      httpsGet(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`),
      httpsGet(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${API_KEY}`)
    ]);

    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) {
      res.status(404).json({ error: `Could not find data for "${symbol}". Check the ticker and try again.` });
      return;
    }

    const currentPrice = parseFloat(quote['05. price']);

    // Get latest annual balance sheet
    const annualReports = balanceSheetData.annualReports;
    let balanceSheet = null;
    if (annualReports && annualReports.length > 0) {
      balanceSheet = annualReports[0];
    }

    // Get shares outstanding from overview
    const overviewData = await httpsGet(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`
    );
    const sharesOutstanding = parseFloat(overviewData.SharesOutstanding) || 0;

    res.status(200).json({ currentPrice, balanceSheet, sharesOutstanding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
