// PRIVATE TRAINING page
const PrivateTraining = ({ setPage }) => {
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", ages: "", players: "", bundle: "", notes: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const scrollToInquiry = (preset) => {
    if (preset) setForm((f) => ({ ...f, bundle: preset }));
    const el = document.getElementById("inquiry-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const individual = [
    { count: "5 Sessions",  price: "$550" },
    { count: "7 Sessions",  price: "$640" },
    { count: "10 Sessions", price: "$910" },
  ];
  const group2 = [
    { count: "5 Sessions", price: "$850" },
    { count: "7 Sessions", price: "$1,000" },
  ];
  const bundleOptions = [
    "Evaluation Session",
    "Recruitment Session (Year-long)",
    "Individual — 5 Sessions",
    "Individual — 7 Sessions",
    "Individual — 10 Sessions",
    "Group of 2 — 5 Sessions",
    "Group of 2 — 7 Sessions",
    "Custom Group (3+ Players)",
  ];

  const BundleCard = ({ tag, count, price }) => (
    <div className="bundle-card bg-smoke border border-ash p-5 sm:p-10 flex flex-col">
      <div className="bundle-card__tag eyebrow">{tag}</div>
      <div className="bundle-card__count font-display text-ink mt-2 sm:mt-3 leading-none">{count}</div>
      <div className="bundle-card__price font-display text-ink mt-4 sm:mt-6 leading-none">{price}</div>
      <div className="bundle-card__foot border-t border-ash mt-5 sm:mt-7 pt-3 sm:pt-4">
        <div className="bundle-card__note text-fog">Coordinated directly with coach. Inquire to book.</div>
      </div>
    </div>
  );

  const SectionDivider = ({ label }) => (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-ash" />
      <div className="font-cond uppercase tracking-[0.2em] text-[12px] text-fog">{label}</div>
      <div className="flex-1 h-px bg-ash" />
    </div>
  );

  const SubsectionLabel = ({ label, className = "" }) => (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="font-cond uppercase tracking-[0.15em] text-[12px] text-fog whitespace-nowrap">{label}</div>
      <div className="flex-1 h-px bg-ash" />
    </div>
  );

  return (
    <main id="main">
      {/* HEADER */}
      <section className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Private Training</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
            ONE-ON-ONE.<br />BY REQUEST.
          </h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            Custom session bundles built around your player's level. We respond within 24 hours — directly from your coach, no bots.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 font-cond uppercase tracking-[0.15em] text-[13px] text-fog">
            <span style={{ color: "#D2122E" }} aria-hidden="true">📍</span>
            Training held in Dover, MA
          </div>
        </div>
      </section>

      {/* START HERE */}
      <section className="bg-white px-5 lg:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionDivider label="Start Here" />

          <div className="mt-6 grid grid-cols-1 gap-4">
            {/* Evaluation */}
            <button
              type="button"
              onClick={() => scrollToInquiry("Evaluation Session")}
              className="text-left bg-smoke border-2 p-5 sm:p-8 hover:bg-white transition-colors block"
              style={{ borderColor: "#3B82F6" }}
              aria-label="Book Evaluation Session — scroll to inquiry form"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <span
                    className="font-cond uppercase tracking-[0.15em] text-[11px] sm:text-[12px] text-white px-3 py-1 rounded-full inline-block"
                    style={{ backgroundColor: "#3B82F6" }}
                  >
                    Required Before Packages
                  </span>
                  <h3 className="font-display text-ink mt-3 leading-none" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}>
                    Evaluation Session
                  </h3>
                  <p className="mt-3 text-fog text-[14px] sm:text-[15px] leading-[1.55] max-w-[640px]">
                    Book an evaluation before committing to a package. We assess your player's level and build the right plan from there.
                  </p>
                </div>
                <div className="font-display text-ink leading-none whitespace-nowrap" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                  $110
                </div>
              </div>
            </button>

            {/* Recruitment */}
            <button
              type="button"
              onClick={() => scrollToInquiry("Recruitment Session (Year-long)")}
              className="text-left bg-smoke border-2 p-5 sm:p-8 hover:bg-white transition-colors block"
              style={{ borderColor: "#16A34A" }}
              aria-label="Book Recruitment Session — scroll to inquiry form"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <span
                    className="font-cond uppercase tracking-[0.15em] text-[11px] sm:text-[12px] text-white px-3 py-1 rounded-full inline-block"
                    style={{ backgroundColor: "#16A34A" }}
                  >
                    Recruitment Package · Year-Long
                  </span>
                  <h3 className="font-display text-ink mt-3 leading-none" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}>
                    Recruitment Session
                  </h3>
                  <p className="mt-3 text-fog text-[14px] sm:text-[15px] leading-[1.55] max-w-[640px]">
                    A dedicated year-long package focused on the full recruitment process — highlight preparation, outreach strategy, coach communication, and positioning your player for the right programs.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="font-display text-ink leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                    $250
                  </div>
                  <div className="text-fog text-[13px] mt-1">/year</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* TRAINING PACKAGES */}
      <section className="bg-white px-5 lg:px-10 pb-12">
        <div className="max-w-[1200px] mx-auto">
          <SectionDivider label="Training Packages" />
          <p className="mt-4 text-center text-fog font-cond uppercase tracking-[0.15em] text-[12px]">
            All sessions are 1 hour 30 minutes
          </p>

          {/* Individual */}
          <SubsectionLabel label="Individual" className="mt-8" />
          <div className="bundle-grid grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-5">
            {individual.map((c) => (
              <BundleCard key={`ind-${c.count}`} tag="Individual" count={c.count} price={c.price} />
            ))}
          </div>

          {/* Group of 2 */}
          <SubsectionLabel label="Group (2 Players)" className="mt-10" />
          <div className="bundle-grid grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 mt-5">
            {group2.map((c) => (
              <BundleCard key={`g2-${c.count}`} tag="Group (2+ Players)" count={c.count} price={c.price} />
            ))}
          </div>

          {/* Groups of 3+ */}
          <SubsectionLabel label="Groups of 3+" className="mt-10" />
          <div className="mt-5 bg-smoke border border-ash p-5 sm:p-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="eyebrow">Group (3+ Players)</div>
              <div className="font-display text-ink mt-2 leading-none" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
                Custom Bundles Available
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollToInquiry("Custom Group (3+ Players)")}
              className="font-cond uppercase tracking-[0.15em] text-[13px] text-ink border border-ink hover:bg-ink hover:text-white px-5 py-3 transition-colors"
            >
              Inquire for Pricing
            </button>
          </div>

          <style>{`
            .bundle-card__count { font-size: 24px; }
            .bundle-card__price { font-size: clamp(3rem, 7vw, 5rem); }
            .bundle-card__note { font-size: 13px; }
            @media (max-width: 639px) {
              .bundle-card__tag {
                font-size: 9px;
                letter-spacing: 0.16em;
              }
              .bundle-card__count { font-size: 17px; }
              .bundle-card__price { font-size: 38px; }
              .bundle-card__note { font-size: 11px; line-height: 1.4; }
            }
          `}</style>

          <div className="mt-10 text-center font-cond uppercase tracking-[0.15em] text-[13px]" style={{ color: "#D2122E" }}>
            Inquiry only · No online payment
          </div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section id="inquiry-form" className="bg-smoke py-20 px-5 lg:px-10">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center">
            <div className="eyebrow mb-4">Inquire</div>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>SEND AN INQUIRY.</h2>
            <p className="mt-4 text-[16px] text-fog">We'll reach out within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="mt-10 flex justify-center">
              <SuccessCard headline="INQUIRY RECEIVED." sub="We'll reach out within 24 hours." />
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (loading) return;
                setLoading(true);
                setError("");
                try {
                  const res = await fetch('/api/inquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: form.name,
                      email: form.email,
                      phone: form.phone,
                      players: form.players,
                      bundle: form.bundle,
                      ages: form.ages,
                      notes: form.notes,
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setSubmitted(true);
                  } else {
                    setError(data.error || 'Something went wrong. Please try again.');
                  }
                } catch {
                  setError('Something went wrong. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-10 flex flex-col gap-5"
            >
              <Field id="pt-name" label="Parent Name" required value={form.name} onChange={set("name")} />
              <Field id="pt-email" type="email" label="Email" required value={form.email} onChange={set("email")} />
              <Field id="pt-phone" type="tel" label="Phone" required value={form.phone} onChange={set("phone")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field id="pt-ages" label="Player Age(s)" required value={form.ages} onChange={set("ages")} />
                <Field id="pt-players" type="number" label="Number of Players" required value={form.players} onChange={set("players")} />
              </div>
              <SelectField
                id="pt-bundle"
                label="Preferred Bundle"
                required
                value={form.bundle}
                onChange={set("bundle")}
                options={bundleOptions}
              />
              <Textarea id="pt-notes" label="Availability / Notes" value={form.notes} onChange={set("notes")} />

              <button
                type="submit"
                className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-5 mt-2"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <span>{loading ? "SENDING…" : "SEND INQUIRY"}</span>
                <IconArrowRight size={20} className="arrow" />
              </button>

              {error && (
                <p className="text-[14px] text-center" style={{ color: "#D2122E" }}>{error}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

window.PrivateTraining = PrivateTraining;
