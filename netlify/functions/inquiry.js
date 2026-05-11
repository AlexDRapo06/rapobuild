exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { name, email, phone, players, bundle, ages, notes } = JSON.parse(event.body || '{}');

  const lines = [
    `🏐 *New Training Inquiry*`,
    ``,
    `*Parent:* ${name}`,
    `*Email:* ${email}`,
    `*Phone:* ${phone}`,
    `*Players:* ${players}`,
    `*Bundle:* ${bundle}`,
    ages  ? `*Player Ages:* ${ages}`  : null,
    notes ? `*Notes:* ${notes}`       : null,
  ].filter(Boolean);

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.description || 'Failed to send Telegram message' }),
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
