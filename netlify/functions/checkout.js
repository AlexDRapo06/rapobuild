const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const {
    parentFirst, parentLast, parentEmail, parentPhone,
    playerFirst, playerLast, playerDOB, playerAge,
    medical, session: campSession,
  } = JSON.parse(event.body || '{}');

  const origin = `https://${event.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: parentEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Footy Up Soccer Camp Registration' },
            unit_amount: 41500,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        parent_name:  `${parentFirst || ''} ${parentLast || ''}`.trim(),
        parent_email: parentEmail || '',
        parent_phone: parentPhone || '',
        player_name:  `${playerFirst || ''} ${playerLast || ''}`.trim(),
        player_dob:   playerDOB   || '',
        player_age:   playerAge   || '',
        camp_session: campSession || '',
        medical:      medical     || 'None',
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
