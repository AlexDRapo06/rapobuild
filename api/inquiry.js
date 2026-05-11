module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, players, bundle, ages, notes } = req.body || {};

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
      return res.status(500).json({ error: err.description || 'Failed to send Telegram message' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
