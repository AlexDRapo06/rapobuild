// CAMP REGISTRATION FORM — shared by every camp page.
//
// Collects the details on the site (Player Name, Parent Name, Player Age,
// Parent Email, Parent Phone, Town, and the waiver once one is published) and
// then hands off to Stripe, rather than letting Stripe collect them at
// checkout. A full session shows the waitlist form instead. Camps running more
// than one session also get a session picker. Pages that let families pick a
// session from cards pass `session` + `onSessionChange` to control it;
// otherwise the form owns it.

// Camp pages link to the form with a button rather than an <a href="#camp-register">,
// because the site routes on the URL hash — an anchor would navigate to the home page.
const scrollToCampForm = () => {
  const el = document.getElementById("camp-register");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const CampRegistrationForm = ({ camp, session: sessionProp, onSessionChange }) => {
  const multiSession = camp.sessions.length > 1;
  const controlled = typeof onSessionChange === "function";
  const offer = waitlistOfferFor(camp.id);
  const [form, setForm] = React.useState({
    playerName: "",
    parentName: offer ? offer.parent.name : "",
    playerAge: "",
    parentEmail: offer ? offer.parent.email : "",
    parentPhone: offer ? offer.parent.phone : "",
    town: offer ? offer.parent.town : "",
    // Single-session camps have nothing to choose, so preselect it.
    session: offer ? offer.session : multiSession ? "" : camp.sessions[0].value,
  });
  const [waiverAccepted, setWaiverAccepted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  // Set when checkout reports the session filled up after the page loaded.
  const [fullNow, setFullNow] = React.useState("");
  const { waiver, waiverRequired } = siteForm("camp");

  React.useEffect(() => {
    if (offer && controlled && !sessionProp) onSessionChange(offer.session);
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const session = controlled ? sessionProp || "" : form.session;
  const setSession = (e) => {
    if (controlled) onSessionChange(e.target.value);
    else setForm({ ...form, session: e.target.value });
  };
  const selected = camp.sessions.find((s) => s.value === session);
  const isFull = !offer && !!selected && (selected.full || fullNow === session);

  // Age limits follow the chosen session (e.g. Arlington Catholic's 6–13 vs 14–18 weeks).
  const minAge = selected ? selected.minAge : camp.minAge;
  const maxAge = selected ? selected.maxAge : camp.maxAge;
  const age = Number(form.playerAge);
  const ageOutOfRange = form.playerAge !== "" && selected && (age < minAge || age > maxAge);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: camp.id, ...form, session,
          ...(waiver ? { waiverId: waiver.id, waiverAccepted } : {}),
          ...(offer ? { waitlistToken: offer.token } : {}),
        }),
      });
      const data = await res.json();
      if (data.url) {
        // Leaves the page — deliberately stays in the loading state.
        window.location.href = data.url;
      } else if (data.code === "session_full" && !offer) {
        setFullNow(session);
        setLoading(false);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const cta = loading
    ? "REDIRECTING TO CHECKOUT…"
    : selected
      ? `REGISTER — ${formatUSD(selected.price)}`
      : "REGISTER";

  const subline = selected
    ? [selected.title && multiSession ? selected.title : null, selected.ages || camp.ages, selected.schedule || camp.schedule, camp.venue]
    : [camp.ages, camp.schedule, camp.venue];

  return (
    <section id="camp-register" className="bg-smoke px-5 lg:px-10 py-16 lg:py-24" style={{ scrollMarginTop: 72 }}>
      <div className="max-w-[680px] mx-auto">
        <div className="text-center">
          <div className="eyebrow mb-3">Registration · {camp.name}</div>
          <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            REGISTER YOUR PLAYER.
          </h2>
          <p className="mt-4 text-[15px] text-fog leading-[1.55]">
            {subline.filter(Boolean).join(" · ")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          {multiSession && (
            <div className="flex flex-col gap-3">
              <SelectField
                id="session"
                label="Camp Session"
                required
                value={session}
                onChange={setSession}
                options={camp.sessions}
              />
              {selected && (
                <div className="camp-form__summary" aria-live="polite">
                  <span>{selected.dates}</span>
                  {(selected.schedule || camp.schedule) && <span>{selected.schedule || camp.schedule}</span>}
                  <span>{selected.ages}</span>
                  <span className="camp-form__summary-price">{isFull ? "FULL" : formatUSD(selected.price)}</span>
                </div>
              )}
            </div>
          )}

          {offer && (
            <div className="camp-form__offer" role="status">
              Your waitlist spot is held until {new Date(offer.expiresAt).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.
            </div>
          )}

          {!isFull && (<>
          <Field
            id="playerName"
            label="Player Name"
            required
            autoComplete="off"
            value={form.playerName}
            onChange={set("playerName")}
          />
          <Field
            id="parentName"
            label="Parent Name"
            required
            autoComplete="name"
            value={form.parentName}
            onChange={set("parentName")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              id="playerAge"
              type="number"
              inputMode="numeric"
              label="Player Age"
              required
              min={minAge}
              max={maxAge}
              value={form.playerAge}
              onChange={set("playerAge")}
              hint={ageOutOfRange ? `This session is for ages ${minAge}–${maxAge}.` : null}
              invalid={ageOutOfRange}
            />
            <Field
              id="parentEmail"
              type="email"
              label="Parent Email"
              required
              autoComplete="email"
              value={form.parentEmail}
              onChange={set("parentEmail")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              id="parentPhone"
              type="tel"
              label="Parent Phone"
              required
              autoComplete="tel"
              value={form.parentPhone}
              onChange={set("parentPhone")}
            />
            <Field
              id="town"
              label="Town / City of Residence"
              required
              autoComplete="address-level2"
              placeholder="e.g. Brookline"
              maxLength={80}
              value={form.town}
              onChange={set("town")}
            />
          </div>

          {waiver && (
            <WaiverAcceptance id="camp-waiver" waiver={waiver} required={waiverRequired} checked={waiverAccepted} onChange={setWaiverAccepted} />
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-5 mt-2"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <span>{cta}</span>
            <IconArrowRight size={20} className="arrow" />
          </button>

          {error && (
            <p role="alert" className="text-[14px] text-center" style={{ color: "#D2122E" }}>
              {error}
            </p>
          )}

          <div className="mt-1 text-[12px] text-fog flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
            <span>Secured by Stripe</span>
            <span aria-hidden="true" className="text-fog/50">•</span>
            <span>Confirmation emailed after checkout</span>
          </div>
          </>)}
        </form>
        {isFull && (
          <div className="mt-5">
            <WaitlistForm campId={camp.id} session={session} />
          </div>
        )}
      </div>

      <style>{`
        .camp-form__summary {
          display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px;
          padding: 12px 16px;
          background: #FFFFFF;
          border-left: 3px solid #D2122E;
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; font-size: 13px;
          color: #757575;
        }
        .camp-form__offer {
          padding: 12px 16px; background: #111; color: #fff;
          font-family: "Barlow Condensed", sans-serif; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em; font-size: 13px;
        }
        .camp-form__summary-price { margin-left: auto; color: #111; font-family: "Bebas Neue", sans-serif; font-size: 20px; letter-spacing: 0.02em; }
      `}</style>
    </section>
  );
};

window.CampRegistrationForm = CampRegistrationForm;
window.scrollToCampForm = scrollToCampForm;
