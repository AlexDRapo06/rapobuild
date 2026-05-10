const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    parentFirst, parentLast, parentEmail, parentPhone,
    playerFirst, playerLast, playerDOB, playerAge,
    medical, session: campSession,
  } = req.body || {};
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: parentEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Footy Up Soccer Camp Registration',
            },
            unit_amount: 35000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        parent_name:  `${parentFirst || ''} ${parentLast || ''}`.trim(),
        parent_email: parentEmail  || '',
        parent_phone: parentPhone  || '',
        player_name:  `${playerFirst || ''} ${playerLast || ''}`.trim(),
        player_dob:   playerDOB    || '',
        player_age:   playerAge    || '',
        camp_session: campSession  || '',
        medical:      medical      || 'None',
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
