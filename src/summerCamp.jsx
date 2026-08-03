// SUMMER CAMP page — Watertown 2027, two week-long sessions, shared camp form
const SummerCamp = ({ setPage }) => {
  const camp = CAMPS.summerCamp;

  const WEEKS = [
    { n: "Week 01", dates: "July 12 – 16, 2027", price: "$415" },
    { n: "Week 02", dates: "July 19 – 23, 2027", price: "$415" },
  ];

  const RegisterButton = ({ size = "lg", full = false, className = "" }) => (
    <button
      type="button"
      onClick={scrollToCampForm}
      className={`btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark ${size === "lg" ? "px-6 py-5 text-[20px] sm:text-[22px]" : "px-5 py-3 text-[16px]"} ${full ? "w-full" : ""} ${className}`}
    >
      <span>REGISTER NOW — $415/WEEK</span>
      <IconArrowRight size={20} className="arrow" />
    </button>
  );

  return (
    <main id="main">
      {/* HERO */}
      <section className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Summer Camp 2027</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
            WATERTOWN.<br />TWO WEEKS. ALL SUMMER SHARP.
          </h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            Five hours a day on the grass at Victory Field, coached by college and pro-level players. Take one week or both — ages 6 to 17, every level welcome.
          </p>
          <div className="mt-5 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 font-cond uppercase tracking-[0.15em] text-[13px] text-fog">
            <span className="inline-flex items-center gap-2">
              <IconMapPin size={14} />
              {camp.venue} · {camp.address}
            </span>
            <span className="inline-flex items-center gap-2">
              <IconCalendar size={14} />
              {camp.dates}
            </span>
          </div>
          <div className="mt-8 flex justify-center">
            <RegisterButton />
          </div>
        </div>
      </section>

      {/* WEEKS */}
      <section className="bg-white px-5 lg:px-10 pb-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="eyebrow mb-5 text-center">Pick your week</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {WEEKS.map((w) => (
              <div key={w.n} className="p-7 lg:p-8" style={{ border: "1px solid #E5E5E5", background: "#F5F5F5" }}>
                <div className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: "#D2122E" }}>
                  {w.n}
                </div>
                <div className="font-display text-ink mt-3 leading-none" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
                  {w.dates}
                </div>
                <div className="mt-4 pt-4 flex items-center justify-between font-cond uppercase tracking-[0.12em] text-[12px] text-fog" style={{ borderTop: "1px solid #E5E5E5" }}>
                  <span>{camp.schedule}</span>
                  <span className="font-display text-ink text-[22px] tracking-normal">{w.price}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[14px] text-fog">
            Registering for both weeks? Choose <span className="text-ink font-semibold">Both Weeks</span> at checkout — $830 total.
          </p>
        </div>
      </section>

      {/* THE DETAILS */}
      <section className="bg-white px-5 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <div className="eyebrow mb-4">The Details</div>
            <h2 className="font-display text-ink leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              FIVE HOURS A DAY.<br />ZERO WASTED.
            </h2>
            <p className="mt-5 text-fog text-[16px] leading-[1.55]" style={{ maxWidth: 520 }}>
              Drop off at 9, pick up at 2. Technical work in the morning, small-sided games and full scrimmages in the afternoon — grouped by age and level so every player is challenged. Register online in under a minute; details for the week are sent after checkout.
            </p>
          </div>

          <div className="bg-ink p-6 sm:p-10">
            <LabelRow dark label="Location" value={camp.venue} />
            <LabelRow dark label="Address" value={camp.address} />
            <LabelRow dark label="Week 1" value="July 12 – 16, 2027" />
            <LabelRow dark label="Week 2" value="July 19 – 23, 2027" />
            <LabelRow dark label="Schedule" value={camp.schedule} />
            <LabelRow dark label="Ages" value={camp.ages} />
            <LabelRow dark label="Price" value={camp.priceLabel} last />
            <div className="mt-8">
              <RegisterButton full />
            </div>
            <p className="mt-4 text-center font-cond uppercase tracking-[0.15em] text-[12px] text-white/50">
              Secure checkout · Confirmation emailed after payment
            </p>
          </div>
        </div>
      </section>

      {/* REGISTRATION */}
      <CampRegistrationForm camp={camp} />

      {/* CTA BANNER */}
      <AccentBanner>TWO WEEKS ONLY — LOCK IN YOUR PLAYER.</AccentBanner>
      <section className="bg-white py-14 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex justify-center">
          <RegisterButton />
        </div>
      </section>
    </main>
  );
};

window.SummerCamp = SummerCamp;
