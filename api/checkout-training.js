const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PACKAGES = {
  individual_5:  { name: "Individual — 5 Sessions (1 hr 30 min each)",  unit_amount: 55000 },
  individual_7:  { name: "Individual — 7 Sessions (1 hr 30 min each)",  unit_amount: 64000 },
  individual_10: { name: "Individual — 10 Sessions (1 hr 30 min each)", unit_amount: 91000 },
  group2_5:      { name: "Group of 2 — 5 Sessions (1 hr 30 min each)",  unit_amount: 85000 },
  group2_7:      { name: "Group of 2 — 7 Sessions (1 hr 30 min each)",  unit_amount: 100000 },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { packageId } = req.body || {};
  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid package' });
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: pkg.name },
            unit_amount: pkg.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      custom_fields: [
        {
          key: 'player_name',
          label: { type: 'custom', custom: "Player's Full Name" },
          type: 'text',
        },
        {
          key: 'player_age',
          label: { type: 'custom', custom: "Player's Age" },
          type: 'text',
        },
      ],
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        package_id:   packageId,
        package_name: pkg.name,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
