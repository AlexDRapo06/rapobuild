const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Authoritative camp pricing. src/camps.jsx mirrors these figures for display,
// but the amount charged is always resolved here — never taken from the request
// body. Keys must match `id` and session `value` in src/camps.jsx.
const CAMPS = {
  winter_walpole: {
    name: 'FOOTYUP Winter Camp — Walpole, MA',
    sessions: {
      full: { label: 'Dec 27–31 · 9 AM–1 PM', unit_amount: 31500 },
    },
  },
  watertown_2027: {
    name: 'FOOTYUP Summer Camp 2027 — Watertown, MA',
    sessions: {
      week1: { label: 'Week 1 · July 12–16, 2027 · 9 AM–2 PM', unit_amount: 41500 },
      week2: { label: 'Week 2 · July 19–23, 2027 · 9 AM–2 PM', unit_amount: 41500 },
      both:  { label: 'Both Weeks · July 12–23, 2027 · 9 AM–2 PM', unit_amount: 83000 },
    },
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    campId, session: sessionId,
    playerName, parentName, playerAge, parentEmail,
  } = req.body || {};

  const camp = CAMPS[campId];
  const campSession = camp && camp.sessions[sessionId];
  if (!campSession) {
    return res.status(400).json({ error: 'Please choose a camp session.' });
  }

  if (!playerName || !parentName || !playerAge || !parentEmail) {
    return res.status(400).json({ error: 'Please fill in every field.' });
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${req.headers.host}`;

  try {
    const checkout = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: parentEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: camp.name,
              description: campSession.label,
            },
            unit_amount: campSession.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        camp:         camp.name,
        camp_session: campSession.label,
        player_name:  playerName,
        player_age:   String(playerAge),
        parent_name:  parentName,
        parent_email: parentEmail,
      },
    });

    res.status(200).json({ url: checkout.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
