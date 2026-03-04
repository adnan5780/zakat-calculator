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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { symbol } = req.query;
  if (!symbol) { res.status(400).json({ error: 'Symbol required' }); return; }

  const API_KEY = 'OWWSOT0K004I5E9C';

  try {
    // Call sequentially to avoid rate limiting
    const quoteData = await httpsGet(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );
    await sleep(500);

    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) {
      res.status(404).json({ error: `Could not find data for "${symbol}". Check the ticker and try again.` });
      return;
    }
    const currentPrice = parseFloat(quote['05. price']);

    await sleep(500);
    const overviewData = await httpsGet(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`
    );

    await sleep(500);
    const balanceSheetData = await httpsGet(
      `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${API_KEY}`
    );

    const sharesOutstanding = parseFloat(overviewData.SharesOutstanding) || 0;
    const annualReports = balanceSheetData.annualReports;
    const balanceSheet = (annualReports && annualReports.length > 0) ? annualReports[0] : null;

    // Debug: return raw fields so we can see what's available
    res.status(200).json({
      currentPrice,
      sharesOutstanding,
      balanceSheet,
      debug: {
        overviewKeys: Object.keys(overviewData).slice(0, 10),
        bsKeys: balanceSheet ? Object.keys(balanceSheet).slice(0, 15) : null,
        rateLimited: quoteData['Note'] || balanceSheetData['Note'] || overviewData['Note'] || null
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
