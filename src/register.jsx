// REGISTER page
const Field = ({ label, id, type = "text", required, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-cond font-bold uppercase tracking-[0.1em] text-[12px] text-ink">
      {label}{required && " *"}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="border border-ink px-4 py-3.5 text-[16px] bg-white text-ink"
      style={{ borderRadius: 0, transition: "border-color 200ms ease" }}
    />
  </div>
);

const Textarea = ({ label, id, rows = 4, required, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-cond font-bold uppercase tracking-[0.1em] text-[12px] text-ink">
      {label}{required && " *"}
    </label>
    <textarea
      id={id}
      name={id}
      rows={rows}
      required={required}
      value={value}
      onChange={onChange}
      className="border border-ink px-4 py-3.5 text-[16px] bg-white text-ink resize-none"
      style={{ borderRadius: 0, transition: "border-color 200ms ease" }}
    />
  </div>
);

const SelectField = ({ label, id, required, value, onChange, options }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-cond font-bold uppercase tracking-[0.1em] text-[12px] text-ink">
      {label}{required && " *"}
    </label>
    <select
      id={id}
      name={id}
      required={required}
      value={value}
      onChange={onChange}
      className="border border-ink px-4 py-3.5 text-[16px] bg-white text-ink"
      style={{ borderRadius: 0, transition: "border-color 200ms ease" }}
    >
      <option value="" disabled>Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SuccessCard = ({ headline, sub }) => (
  <div className="bg-ink text-white p-12 text-center max-w-[640px]">
    <div
      className="mx-auto w-14 h-14 flex items-center justify-center"
      style={{ background: "#D2122E" }}
    >
      <IconCheck size={28} className="text-white" strokeWidth={3} />
    </div>
    <h3 className="font-display mt-6" style={{ fontSize: "clamp(1.75rem, 3vw, 2rem)" }}>{headline}</h3>
    <p className="mt-3 text-[15px]" style={{ color: "rgba(255,255,255,0.75)" }}>{sub}</p>
  </div>
);

const Register = ({ setPage }) => {
  const [form, setForm] = React.useState({
    parentFirst: "", parentLast: "", parentEmail: "", parentPhone: "",
    playerFirst: "", playerLast: "", playerDOB: "", playerAge: "",
    medical: "", session: "",
  });
  const [waiver, setWaiver] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const included = [
    "Full-week camp instruction (Mon–Fri)",
    "Lunch and snacks daily",
    "GOAT × Footy Up gear drop",
    "Parent recruitment session access",
    "Guest coaching from NER pros",
    "Certificate of completion",
  ];

  const dayInLife = [
    { time: "09:00 — 09:30", title: "Check-in" },
    { time: "09:30 — 10:30", title: "Technical & passing" },
    { time: "10:30 — 10:45", title: "Snack break" },
    { time: "10:45 — 12:00", title: "Ball work + progressions" },
    { time: "12:00 — 12:45", title: "Lunch" },
    { time: "12:45 — 02:00", title: "Scrimmages — 9v9 / 11v11" },
  ];

  return (
    <main id="main">
      {/* HEADER */}
      <section className="bg-white pt-14 pb-8 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Registration</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.25rem, 5.5vw, 5rem)" }}>
            LOCK YOUR PLAYER'S SPOT.
          </h1>
          <div className="font-display mt-3" style={{ color: "#D2122E", fontSize: "clamp(2rem, 4vw, 3rem)" }}>$415.</div>
          <p className="mt-3 text-[16px] text-fog">Spots limited. Refund policy: 14 days prior to camp.</p>
        </div>
      </section>

      <section className="bg-white px-5 lg:px-10 pb-20">
        <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">
          {/* LEFT RAIL — INCLUDED + DAY IN LIFE */}
          <aside className="lg:col-span-2 lg:sticky flex flex-col gap-5" style={{ top: 100 }}>
            {/* Included */}
            <div className="bg-ink text-white p-8 lg:p-10">
              <div className="eyebrow" style={{ color: "rgba(255,255,255,0.55)" }}>Included in registration</div>
              <ul className="mt-6 flex flex-col gap-3.5">
                {included.map((it) => (
                  <li key={it} className="flex items-start gap-3 text-[14px]" style={{ color: "rgba(255,255,255,0.92)" }}>
                    <span className="mt-0.5" style={{ color: "#D2122E" }}><IconCheck size={16} strokeWidth={3} /></span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 pt-6 border-t border-white/10">
                <div className="eyebrow" style={{ color: "rgba(255,255,255,0.55)" }}>Coached by</div>
                <div className="font-display text-[18px] mt-3 leading-tight">
                  PEYTON MILLER · OLGER ESCOBAR · ERIC KLEIN · CRISTIANO OLIVEIRA
                </div>
              </div>
            </div>

            {/* Day in the life */}
            <div className="bg-smoke p-8 lg:p-10" style={{ border: "1px solid #E5E5E5" }}>
              <div className="eyebrow">A day at the camp</div>
              <h3 className="font-display text-ink mt-2 leading-none" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}>
                5 HOURS. ZERO WASTED.
              </h3>

              <ol className="mt-6 relative pl-5" style={{ borderLeft: "3px solid #111111" }}>
                {dayInLife.map((d, i) => (
                  <li key={d.time} className={`relative ${i === dayInLife.length - 1 ? "" : "pb-5"}`}>
                    <span
                      aria-hidden="true"
                      className="absolute"
                      style={{
                        left: "-26px",
                        top: "6px",
                        width: 9,
                        height: 9,
                        background: "#D2122E",
                      }}
                    />
                    <div className="font-cond font-bold uppercase tracking-[0.08em] text-[12px] text-fog">{d.time}</div>
                    <div className="font-display text-[20px] text-ink leading-tight mt-0.5">{d.title.toUpperCase()}.</div>
                  </li>
                ))}
              </ol>

              {/* Parent recruitment callout */}
              <div className="mt-6 p-5" style={{ background: "#FFF5F6", borderLeft: "3px solid #D2122E" }}>
                <div className="font-cond font-bold uppercase tracking-[0.15em] text-[11px]" style={{ color: "#D2122E" }}>
                  ★ One day per camp
                </div>
                <div className="font-display text-[18px] text-ink leading-tight mt-1.5">
                  PARENT RECRUITMENT SESSION.
                </div>
                <p className="text-[13px] text-ink leading-[1.5] mt-2">
                  Coaches break down how to set your child up for D1 college recruiting — taught by the athletes who've lived it. Parents invited.
                </p>
              </div>
            </div>
          </aside>

          {/* FORM */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="flex justify-center">
                <SuccessCard headline="REGISTRATION RECEIVED." sub="We'll email confirmation within 24 hours." />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="max-w-[640px] flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field id="parentFirst" label="Parent / Guardian First Name" required value={form.parentFirst} onChange={set("parentFirst")} />
                  <Field id="parentLast" label="Parent / Guardian Last Name" required value={form.parentLast} onChange={set("parentLast")} />
                </div>
                <Field id="parentEmail" type="email" label="Parent Email" required value={form.parentEmail} onChange={set("parentEmail")} />
                <Field id="parentPhone" type="tel" label="Parent Phone" required value={form.parentPhone} onChange={set("parentPhone")} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field id="playerFirst" label="Player First Name" required value={form.playerFirst} onChange={set("playerFirst")} />
                  <Field id="playerLast" label="Player Last Name" required value={form.playerLast} onChange={set("playerLast")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field id="playerDOB" type="date" label="Player Date of Birth" required value={form.playerDOB} onChange={set("playerDOB")} />
                  <Field id="playerAge" type="number" label="Player Age" required value={form.playerAge} onChange={set("playerAge")} />
                </div>
                <Textarea id="medical" label="Medical Concerns / Allergies" value={form.medical} onChange={set("medical")} />
                <SelectField id="session" label="Camp Session" required value={form.session} onChange={set("session")} options={["Session 1", "Session 2", "TBD"]} />

                <label className="flex items-start gap-3 mt-2 cursor-pointer">
                  <span
                    role="checkbox"
                    aria-checked={waiver}
                    tabIndex="0"
                    onClick={() => setWaiver(!waiver)}
                    onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setWaiver(!waiver); } }}
                    className="check-box mt-0.5"
                    data-checked={waiver ? "true" : "false"}
                  >
                    {waiver && <IconCheck size={12} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-[14px] text-ink leading-[1.5]">
                    I have read and agree to the Footy Up Camp Waiver. I understand a signed waiver must be emailed to <span className="underline">camp@footyup.com</span> before my child can participate.
                  </span>
                </label>

                <button
                  type="submit"
                  className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-5 mt-2"
                  style={{ opacity: waiver ? 1 : 0.6 }}
                  disabled={!waiver}
                >
                  <span>COMPLETE REGISTRATION — $415</span>
                  <IconArrowRight size={20} className="arrow" />
                </button>

                <div className="text-[12px] text-fog text-center">
                  Secured by Stripe · Refund policy: 14 days prior to camp
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

window.Register = Register;
window.SuccessCard = SuccessCard;
window.Field = Field;
window.Textarea = Textarea;
window.SelectField = SelectField;
