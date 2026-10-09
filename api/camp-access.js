const { getCamp, registrationStatus, checkAccessCode } = require('./_camps');

// Registration gate for timed / code-locked camps (the Miami combine).
//
// GET  ?campId=…            → { open, gated, opensAt } so the page shows the
//                             right state without hard-coding it.
// POST { campId, code }     → 200 when the code unlocks registration.
//
// api/checkout.js re-checks both the date and the code, so this endpoint only
// decides what the page shows — it can't be used to skip the gate.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const campId = req.method === 'GET' ? (req.query || {}).campId : (req.body || {}).campId;
  const camp = getCamp(campId);
  if (!camp) {
    return res.status(404).json({ error: 'Unknown camp.' });
  }

  const status = registrationStatus(camp);

  if (req.method === 'GET') {
    return res.status(200).json(status);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!status.open) {
    return res.status(403).json({ ...status, error: 'Registration has not opened yet.' });
  }
  if (!checkAccessCode(camp, (req.body || {}).code)) {
    return res.status(403).json({ ...status, error: 'That access code is not valid. Please check it and try again.' });
  }
  return res.status(200).json({ ...status, ok: true });
};
