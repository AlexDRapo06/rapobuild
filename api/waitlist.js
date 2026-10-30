const { forward } = require('./_platform');

// Waitlist sign-ups (POST) and waitlist offer links (GET ?token=) are saved and
// checked by the Footy Up platform; there is no fallback without it.
module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (await forward(req, res, 'waitlist')) return;
  if (req.method === 'GET') return res.status(200).json({ valid: false });
  res.status(503).json({ error: 'The waitlist is not available right now. Please email footyupp@outlook.com.' });
};
