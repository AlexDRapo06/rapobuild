const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getCamp, registrationStatus, checkAccessCode } = require('./_camps');

// Pricing, sessions, age ranges and access rules live in ./_camps.js, which
// src/camps.jsx mirrors for display. Nothing about what is charged is taken
// from the request body.

// Stripe metadata values cap at 500 characters; keep every field well under.
const clean = (v, max = 120) =>
  (typeof v === 'string' || typeof v === 'number') ? String(v).trim().slice(0, max) : '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Combine-only choices — must match the options in src/miami.jsx.
const CLOTHING_SIZES = ['Youth L', 'Adult XS', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult XXL'];
const POSITIONS = [
  'Goalkeeper', 'Center Back', 'Outside Back', 'Defensive Midfielder',
  'Central Midfielder', 'Attacking Midfielder', 'Winger', 'Striker',
];
const GRAD_YEARS = ['2027', '2028', '2029', '2030', '2031', '2032'];
const US_STATES = new Set((
  'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV ' +
  'NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'
).split(' '));

const fail = (res, status, error) => res.status(status).json({ error });

// Every camp: parent + player basics, plus the family's town for future
// location-based outreach.
const readCampFields = (body) => {
  const f = {
    playerName:  clean(body.playerName),
    parentName:  clean(body.parentName),
    playerAge:   clean(body.playerAge, 3),
    parentEmail: clean(body.parentEmail, 254),
    town:        clean(body.town, 80),
  };
  if (!f.playerName || !f.parentName || !f.playerAge || !f.parentEmail || !f.town) {
    return { error: 'Please fill in every field.' };
  }
  if (!EMAIL_RE.test(f.parentEmail)) return { error: 'Please enter a valid parent email.' };
  return { fields: f };
};

// College combine: everything the camp form takes, plus what the event needs —
// VALD testing (player email, height, weight), kit shipping (address, size),
// and recruiting profile basics (grad year, position, club).
const readCombineFields = (body) => {
  const f = {
    playerName:   clean(body.playerName),
    playerEmail:  clean(body.playerEmail, 254),
    playerAge:    clean(body.playerAge, 3),
    heightFt:     clean(body.heightFt, 1),
    heightIn:     clean(body.heightIn, 2),
    weight:       clean(body.weight, 3),
    gradYear:     clean(body.gradYear, 4),
    position:     clean(body.position, 40),
    club:         clean(body.club),
    clothingSize: clean(body.clothingSize, 20),
    parentName:   clean(body.parentName),
    parentEmail:  clean(body.parentEmail, 254),
    parentPhone:  clean(body.parentPhone, 30),
    address1:     clean(body.address1, 150),
    address2:     clean(body.address2, 80),
    city:         clean(body.city, 80),
    state:        clean(body.state, 20).toUpperCase(),
    zip:          clean(body.zip, 10),
  };
  const required = [
    'playerName', 'playerEmail', 'playerAge', 'heightFt', 'heightIn', 'weight',
    'gradYear', 'position', 'club', 'clothingSize',
    'parentName', 'parentEmail', 'parentPhone',
    'address1', 'city', 'state', 'zip',
  ];
  if (required.some((k) => !f[k])) return { error: 'Please fill in every required field.' };
  if (!EMAIL_RE.test(f.playerEmail)) return { error: 'Please enter a valid player email.' };
  if (!EMAIL_RE.test(f.parentEmail)) return { error: 'Please enter a valid parent email.' };

  const ft = Number(f.heightFt);
  const inch = Number(f.heightIn);
  const lb = Number(f.weight);
  if (!Number.isInteger(ft) || ft < 4 || ft > 7 || !Number.isInteger(inch) || inch < 0 || inch > 11) {
    return { error: 'Please enter a valid height.' };
  }
  if (!Number.isFinite(lb) || lb < 60 || lb > 350) return { error: 'Please enter weight in pounds.' };
  if (!GRAD_YEARS.includes(f.gradYear)) return { error: 'Please choose a graduation year.' };
  if (!POSITIONS.includes(f.position)) return { error: 'Please choose a position.' };
  if (!CLOTHING_SIZES.includes(f.clothingSize)) return { error: 'Please choose a clothing size.' };
  if (!US_STATES.has(f.state)) return { error: 'Please choose a state.' };
  if (!/^\d{5}(-\d{4})?$/.test(f.zip)) return { error: 'Please enter a valid ZIP code.' };
  if (f.parentPhone.replace(/\D/g, '').length < 10) return { error: 'Please enter a valid phone number.' };
  return { fields: f };
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return fail(res, 405, 'Method not allowed');
  }

  const body = req.body || {};
  const camp = getCamp(body.campId);
  const sessionId = clean(body.session, 20);
  const campSession = camp && Object.prototype.hasOwnProperty.call(camp.sessions, sessionId)
    ? camp.sessions[sessionId]
    : null;
  if (!campSession) {
    return fail(res, 400, 'Please choose a camp session.');
  }

  // Timed / code-gated registration (e.g. the Miami combine's private-school window).
  const status = registrationStatus(camp);
  if (!status.open) {
    return fail(res, 403, 'Registration for this camp has not opened yet.');
  }
  if (status.gated && !checkAccessCode(camp, body.accessCode)) {
    return fail(res, 403, 'That access code is not valid. Please check it and try again.');
  }

  const isCombine = camp.kind === 'combine';
  const parsed = isCombine ? readCombineFields(body) : readCampFields(body);
  if (parsed.error) {
    return fail(res, 400, parsed.error);
  }
  const f = parsed.fields;

  const age = Number(f.playerAge);
  if (!Number.isInteger(age) || age < campSession.minAge || age > campSession.maxAge) {
    return fail(res, 400, `This session is for ages ${campSession.minAge}–${campSession.maxAge}.`);
  }

  const metadata = {
    camp_id:      body.campId,
    session_id:   sessionId,
    camp:         camp.name,
    camp_session: campSession.label,
    player_name:  f.playerName,
    player_age:   String(age),
    parent_name:  f.parentName,
    parent_email: f.parentEmail,
  };
  if (isCombine) {
    Object.assign(metadata, {
      player_email:     f.playerEmail,
      player_sex:       campSession.sex,
      player_height:    `${f.heightFt}' ${f.heightIn}"`,
      player_weight_lb: f.weight,
      grad_year:        f.gradYear,
      position:         f.position,
      club:             f.club,
      clothing_size:    f.clothingSize,
      parent_phone:     f.parentPhone,
      address_line1:    f.address1,
      address_line2:    f.address2,
      address_city:     f.city,
      address_state:    f.state,
      address_zip:      f.zip,
      town:             f.city,
      access_code:      status.gated ? 'verified' : 'not required',
    });
  } else {
    metadata.town = f.town;
  }
  // Optional fields left blank (e.g. apartment) are dropped rather than sent empty.
  Object.keys(metadata).forEach((k) => { if (!metadata[k]) delete metadata[k]; });

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${req.headers.host}`;

  try {
    const checkout = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: f.parentEmail,
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
      cancel_url: `${origin}/cancel?camp=${encodeURIComponent(camp.route)}`,
      metadata,
      // Mirror onto the PaymentIntent so the details show on the payment itself
      // in the Stripe dashboard, not only on the Checkout Session.
      payment_intent_data: { metadata },
    });

    res.status(200).json({ url: checkout.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
