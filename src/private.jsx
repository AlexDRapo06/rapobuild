// PRIVATE TRAINING page
const PrivateTraining = ({ setPage }) => {
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", ages: "", players: "", bundle: "", notes: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const cards = [
    { tag: "Individual", count: "5 Sessions", price: "$550" },
    { tag: "Individual", count: "7 Sessions", price: "$640" },
    { tag: "Group (2+ Players)", count: "5 Sessions", price: "$850" },
    { tag: "Group (2+ Players)", count: "7 Sessions", price: "$1,000" },
  ];

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
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-white px-5 lg:px-10 pb-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.price} className="bg-smoke border border-ash p-10 flex flex-col">
                <div className="eyebrow">{c.tag}</div>
                <div className="font-display text-[24px] text-ink mt-3 leading-none">{c.count}</div>
                <div className="font-display text-ink mt-6 leading-none" style={{ fontSize: "clamp(3rem, 7vw, 5rem)" }}>{c.price}</div>
                <div className="border-t border-ash mt-7 pt-4">
                  <div className="text-[13px] text-fog">Coordinated directly with coach. Inquire to book.</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center font-cond uppercase tracking-[0.15em] text-[13px]" style={{ color: "#D2122E" }}>
            Inquiry only · No online payment
          </div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section className="bg-smoke py-20 px-5 lg:px-10">
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
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
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
                options={["Individual 5", "Individual 7", "Group 5", "Group 7"]}
              />
              <Textarea id="pt-notes" label="Availability / Notes" value={form.notes} onChange={set("notes")} />

              <button
                type="submit"
                className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-5 mt-2"
              >
                <span>SEND INQUIRY</span>
                <IconArrowRight size={20} className="arrow" />
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

window.PrivateTraining = PrivateTraining;
