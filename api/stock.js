export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { symbol } = req.query;
  if (!symbol) { res.status(400).json({ error: 'Symbol required' }); return; }

  const API_KEY = 'd6k81i1r01qko8c3qetgd6k81i1r01qko8c3qeu0';

  try {
    const [quoteRes, metricsRes, bsRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`),
      fetch(`https://finnhub.io/api/v1/financials?symbol=${symbol}&statement=bs&freq=annual&token=${API_KEY}`)
    ]);

    const quote = await quoteRes.json();
    const metrics = await metricsRes.json();
    const bs = await bsRes.json();

    res.status(200).json({ quote, metrics, bs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
