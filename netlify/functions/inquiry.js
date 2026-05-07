exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { name, email, phone, players, bundle, ages, notes } = JSON.parse(event.body || '{}');

  const lines = [
    `Parent: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Players: ${players}`,
    `Bundle: ${bundle}`,
    ages  ? `Player Ages: ${ages}`  : null,
    notes ? `Notes: ${notes}`       : null,
  ].filter(Boolean);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Footy Up', email: process.env.SENDER_EMAIL },
        to: [{ email: process.env.CLIENT_EMAIL }],
        subject: `New Training Inquiry — ${name}`,
        textContent: lines.join('\n'),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message || 'Failed to send email' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
