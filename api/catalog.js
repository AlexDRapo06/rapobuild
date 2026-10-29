const { forward } = require('./_platform');

// Live prices, spots and open/closed state from the admin dashboard, so the
// pages show what Stripe will charge. Without the platform the pages keep the
// display prices in src/camps.jsx.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (await forward(req, res, 'catalog')) return;
  res.setHeader('Cache-Control', 'no-store');
  return res.status(404).json({ error: 'No live catalog' });
};
