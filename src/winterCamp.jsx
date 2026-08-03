// WINTER CAMP page — indoor camp in Walpole, registration via the shared camp form
const WinterCamp = ({ setPage }) => {
  const camp = CAMPS.winterCamp;

  const RegisterButton = ({ size = "lg", full = false, className = "" }) => (
    <button
      type="button"
      onClick={scrollToCampForm}
      className={`btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark ${size === "lg" ? "px-6 py-5 text-[20px] sm:text-[22px]" : "px-5 py-3 text-[16px]"} ${full ? "w-full" : ""} ${className}`}
    >
      <span>SIGN UP NOW — $315</span>
      <IconArrowRight size={20} className="arrow" />
    </button>
  );

  return (
    <main id="main">
      {/* HERO */}
      <section className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Winter Camp</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
            WINTER CAMP.<br />TRAIN THROUGH THE COLD.
          </h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            A high-energy indoor session with the FOOTYUP staff — four hours of real coaching to keep your player sharp all winter. Spots are limited.
          </p>
          <div className="mt-5 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 font-cond uppercase tracking-[0.15em] text-[13px] text-fog">
            <span className="inline-flex items-center gap-2">
              <IconMapPin size={14} />
              {camp.address}
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

      {/* THE DETAILS */}
      <section className="bg-white px-5 lg:px-10 pb-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <div className="eyebrow mb-4">The Details</div>
            <h2 className="font-display text-ink leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              ONE FLAT PRICE.<br />DROP OFF &amp; TRAIN.
            </h2>
            <p className="mt-5 text-fog text-[16px] leading-[1.55]" style={{ maxWidth: 520 }}>
              Drop your player off at 9 and pick them up at 1 — technical work, small-sided games, and coaching from college and pro-level players. Register online in under a minute; details for the day are sent after checkout.
            </p>
          </div>

          <div className="bg-ink p-6 sm:p-10">
            <LabelRow dark label="Location" value={camp.address} />
            <LabelRow dark label="Dates" value={camp.dates} />
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
      <AccentBanner>SPOTS ARE LIMITED — LOCK IN YOUR PLAYER.</AccentBanner>
      <section className="bg-white py-14 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex justify-center">
          <RegisterButton />
        </div>
      </section>
    </main>
  );
};

window.WinterCamp = WinterCamp;
