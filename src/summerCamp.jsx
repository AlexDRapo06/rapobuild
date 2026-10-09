// SUMMER CAMPS — a hub of every school we run camps at (#summerCamp), plus one
// page per camp (#summerCamp/<slug>). Camps that register on this site get the
// shared camp form; camps whose host school runs sign-ups get an info page.
// Add a camp in src/camps.jsx and it appears here, on the home page and in the footer.

const SUMMER_STATUS = {
  open:     { label: "Registration open", color: "#16A34A" },
  external: { label: "Registration via school", color: "#C9A24A" },
  soon:     { label: "Coming soon", color: "#757575" },
};

const SummerBackLink = ({ setPage }) => (
  <button
    type="button"
    onClick={() => setPage("summerCamp")}
    className="summer-back inline-flex items-center gap-2 font-cond font-bold uppercase tracking-[0.16em] text-[12px] text-fog hover:text-ink transition-colors"
  >
    <IconArrowRight size={14} className="summer-back__icon" />
    All summer camps
  </button>
);

// ---- HUB --------------------------------------------------------------------
const SummerHub = ({ setPage }) => {
  const live = SUMMER_CAMPS.filter((c) => c.status !== "soon");
  const soon = SUMMER_CAMPS.filter((c) => c.status === "soon");

  return (
    <main id="main">
      <section className="bg-white pt-20 pb-12 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Summer Camps 2027</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
            SUMMER 2027.<br />PICK YOUR CAMP.
          </h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            FOOTYUP camps at schools across Greater Boston, coached by NCAA Division I starters and ex-MLS Academy / MLS NEXT players. Choose a camp for dates, details and registration.
          </p>
        </div>
      </section>

      <section className="bg-white px-5 lg:px-10 pb-16 lg:pb-20">
        <div className="max-w-[1200px] mx-auto">
          <ul className="summer-grid" role="list">
            {live.map((c) => {
              const status = SUMMER_STATUS[c.status];
              const weeks = c.sessions.filter((s) => !s.hideCard);
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setPage("summerCamp", c.slug)} className="summer-card group">
                    <div className="summer-card__top">
                      <span className="summer-card__status" style={{ color: status.color }}>
                        <span className="summer-card__status-dot" style={{ background: status.color }} aria-hidden="true" />
                        {status.label}
                      </span>
                      <span className="summer-card__region">{c.region}</span>
                    </div>
                    <div className="summer-card__name font-display">{c.place}</div>
                    <div className="summer-card__venue">{c.venue}</div>

                    <ul className="summer-card__weeks" role="list">
                      {weeks.map((s) => (
                        <li key={s.value}>
                          <span className="summer-card__week-title">{s.title}{s.ages && s.ages !== c.ages ? ` · ${s.ages}` : ""}</span>
                          <span className="summer-card__week-dates">{shortDates(s.dates)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="summer-card__foot">
                      <span className="summer-card__price">{c.priceLabel}</span>
                      <span className="summer-card__cta">
                        {c.status === "open" ? "Details & register" : "Camp details"}
                        <IconArrowRight size={16} className="summer-card__arrow" />
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
            {soon.map((c) => (
              <li key={c.id}>
                <div className="summer-card summer-card--soon">
                  <div className="summer-card__top">
                    <span className="summer-card__status" style={{ color: SUMMER_STATUS.soon.color }}>
                      <span className="summer-card__status-dot" style={{ background: SUMMER_STATUS.soon.color }} aria-hidden="true" />
                      {SUMMER_STATUS.soon.label}
                    </span>
                    <span className="summer-card__region">{c.region}</span>
                  </div>
                  <div className="summer-card__name font-display">{c.place}</div>
                  <div className="summer-card__venue">More schools are on the way — dates announced soon.</div>
                  <div className="summer-card__foot">
                    <a href="mailto:footyupp@outlook.com?subject=Summer%20camp%20updates" className="summer-card__notify">
                      Get notified — footyupp@outlook.com
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* EVERY CAMP — from FOOTYUP's own camp description */}
      <section className="bg-ink text-white px-5 lg:px-10 py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="eyebrow mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>Every FOOTYUP Camp</div>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 0.95 }}>
            MORE CONFIDENT. MORE COMFORTABLE<br className="hidden sm:block" /> ON THE BALL.
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {[
              { t: "Technical Development", d: "Passing, dribbling, shooting and defending — every day, every player." },
              { t: "Speed & Agility", d: "Footwork, acceleration and the movement that wins games." },
              { t: "Grouped By Age & Ability", d: "Boys and girls of all levels, grouped so every camper is challenged." },
              { t: "Collegiate Coaches", d: "Led by current and former college players who bring high-level experience to each session." },
            ].map((p, i) => (
              <div key={p.t} className="bg-ink p-6 lg:p-7">
                <div className="font-display text-[18px]" style={{ color: "#D2122E" }}>{pad2(i + 1)}</div>
                <div className="mt-3 font-display text-[22px] leading-none">{p.t}</div>
                <p className="mt-3 text-[14px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.65)" }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AccentBanner>SUMMER 2027 — LOCK IN YOUR PLAYER.</AccentBanner>
      <section className="bg-white py-14 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-center gap-3">
          {live.filter((c) => c.status === "open").map((c) => (
            <RedButton key={c.id} onClick={() => setPage("summerCamp", c.slug)}>
              BOOK {c.place}
            </RedButton>
          ))}
        </div>
      </section>
    </main>
  );
};

// ---- WEEK / SESSION CARDS ---------------------------------------------------
// Literal class names so Tailwind always generates them.
const SESSION_COLS = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" };
const shortDates = (d) => d.replace(", 2027", "");

const SessionCards = ({ camp, selected, onSelect }) => {
  const cards = camp.sessions.filter((s) => !s.hideCard);
  const selectable = typeof onSelect === "function";
  return (
    <div className={`grid grid-cols-1 ${SESSION_COLS[Math.min(cards.length, 3)]} gap-4 lg:gap-5`}>
      {cards.map((s) => {
        const isSelected = selected === s.value;
        const Tag = selectable ? "button" : "div";
        return (
          <Tag
            key={s.value}
            type={selectable ? "button" : undefined}
            onClick={selectable ? () => onSelect(s.value) : undefined}
            aria-pressed={selectable ? isSelected : undefined}
            className={`session-card text-left p-7 lg:p-8 ${selectable ? "session-card--selectable" : ""} ${isSelected ? "session-card--selected" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: "#D2122E" }}>
                {s.kicker || s.title}
              </div>
              {selectable && (
                <span className="session-card__pick">{isSelected ? "Selected" : "Select"}</span>
              )}
            </div>
            {s.kicker && s.title && !/^Week/.test(s.title) && (
              <div className="font-display text-ink mt-3 leading-none text-[22px]">{s.title}</div>
            )}
            <div className="font-display text-ink mt-2 leading-none" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
              {s.dates}
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between gap-3 font-cond uppercase tracking-[0.12em] text-[12px] text-fog" style={{ borderTop: "1px solid #E5E5E5" }}>
              <span>{s.schedule || camp.schedule}</span>
              {s.price != null
                ? <span className="font-display text-ink text-[22px] tracking-normal">{formatUSD(s.price)}</span>
                : <span>{camp.ages}</span>}
            </div>
          </Tag>
        );
      })}
    </div>
  );
};

// ---- CAMP PAGE (registers here) ---------------------------------------------
const SummerCampDetail = ({ camp, setPage }) => {
  const [session, setSession] = React.useState("");

  const pickSession = (value) => {
    setSession(value);
    scrollToCampForm();
  };

  const RegisterButton = ({ full = false }) => (
    <button
      type="button"
      onClick={scrollToCampForm}
      className={`btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark px-6 py-5 text-[20px] sm:text-[22px] ${full ? "w-full" : ""}`}
    >
      <span>{camp.cta}</span>
      <IconArrowRight size={20} className="arrow" />
    </button>
  );

  const cards = camp.sessions.filter((s) => !s.hideCard);

  return (
    <main id="main">
      {/* HERO */}
      <section className="bg-white pt-10 lg:pt-12 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <SummerBackLink setPage={setPage} />
          <div className="text-center mt-8 lg:mt-10">
            <div className="eyebrow mb-4">Summer Camp 2027 · {camp.region}</div>
            <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
              {camp.headline[0]}<br />{camp.headline[1]}
            </h1>
            <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
              {camp.lead}
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
        </div>
      </section>

      {/* SESSIONS */}
      <section className="bg-white px-5 lg:px-10 pb-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="eyebrow mb-5 text-center">Pick your week</div>
          <SessionCards camp={camp} selected={session} onSelect={pickSession} />
          {camp.sessionsNote && (
            <p className="mt-5 text-center text-[14px] text-fog">{camp.sessionsNote}</p>
          )}
        </div>
      </section>

      {/* THE DETAILS */}
      <section className="bg-white px-5 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <div className="eyebrow mb-4">The Details</div>
            <h2 className="font-display text-ink leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              {camp.detailsTitle[0]}<br />{camp.detailsTitle[1]}
            </h2>
            <p className="mt-5 text-fog text-[16px] leading-[1.55]" style={{ maxWidth: 520 }}>
              {camp.details}
            </p>
          </div>

          <div className="bg-ink p-6 sm:p-10">
            <LabelRow dark label="Location" value={camp.venue} />
            <LabelRow dark label="Address" value={camp.address} />
            {/* One schedule for every week (Watertown) reads as dates + a single
                Schedule row; per-week hours (Arlington Catholic) go on each row. */}
            {cards.map((s) => (
              <LabelRow
                key={s.value}
                dark
                label={s.title}
                value={camp.schedule ? s.dates : `${shortDates(s.dates)} · ${s.schedule}`}
              />
            ))}
            {camp.schedule && <LabelRow dark label="Schedule" value={camp.schedule} />}
            <LabelRow dark label="Ages" value={camp.schedule ? camp.ages : cards.map((s) => s.ages.replace("Ages ", "")).join(" / ")} />
            <LabelRow dark label="Price" value={camp.schedule ? camp.priceLabel : cards.map((s) => formatUSD(s.price)).join(" / ")} last />
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
      <CampRegistrationForm camp={camp} session={session} onSessionChange={setSession} />

      {/* CTA BANNER */}
      <AccentBanner>{camp.name.toUpperCase()} — LOCK IN YOUR PLAYER.</AccentBanner>
      <section className="bg-white py-14 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex justify-center">
          <RegisterButton />
        </div>
      </section>
    </main>
  );
};

// ---- CAMP PAGE (host school runs sign-ups) ----------------------------------
const SummerCampInfo = ({ camp, setPage }) => {
  const bookable = SUMMER_CAMPS.filter((c) => c.status === "open");
  return (
    <main id="main">
      {/* HERO */}
      <section className="bg-white pt-10 lg:pt-12 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <SummerBackLink setPage={setPage} />
          <div className="text-center mt-8 lg:mt-10">
            <div className="eyebrow mb-4">Summer Camp 2027 · {camp.region}</div>
            <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
              {camp.headline[0]}<br />{camp.headline[1]}
            </h1>
            <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
              {camp.lead}
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
          </div>
        </div>
      </section>

      {/* WEEKS */}
      <section className="bg-white px-5 lg:px-10 pb-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="eyebrow mb-5 text-center">Camp weeks</div>
          <SessionCards camp={camp} />
        </div>
      </section>

      {/* ABOUT + WHAT TO BRING */}
      <section className="bg-white px-5 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <div>
            <div className="eyebrow mb-4">About the Camp</div>
            <h2 className="font-display text-ink leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              FUN. COMPETITIVE.<br />HIGH-ENERGY.
            </h2>
            {camp.about.map((p) => (
              <p key={p.slice(0, 24)} className="mt-5 text-fog text-[16px] leading-[1.6]" style={{ maxWidth: 560 }}>
                {p}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-smoke border border-ash p-6 sm:p-8">
              <div className="eyebrow mb-4">What to Bring</div>
              <p className="text-fog text-[15px] leading-[1.55]">
                Campers should wear athletic clothing, soccer cleats or sneakers, and shin guards, and bring everything they need for the day.
              </p>
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3" role="list">
                {camp.whatToBring.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[15px] text-ink">
                    <span className="bring-check" aria-hidden="true"><IconCheck size={12} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-ink text-white p-6 sm:p-8">
              <div className="eyebrow mb-3" style={{ color: "#C9A24A" }}>Registration</div>
              <div className="font-display text-[28px] leading-none">REGISTRATION IS HANDLED BY {camp.name}.</div>
              <p className="mt-4 text-[15px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)" }}>
                {camp.name} runs sign-ups for this camp directly — FOOTYUP runs everything on the field. Families enroll through {camp.name}; questions about the camp itself go to us.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {camp.registrationUrl && (
                  <a
                    href={camp.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark px-5 py-3 text-[16px]"
                  >
                    <span>REGISTER WITH {camp.name}</span>
                    <IconArrowRight size={18} className="arrow" />
                  </a>
                )}
                <a
                  href={`mailto:footyupp@outlook.com?subject=${encodeURIComponent(`${camp.name} Summer Camp`)}`}
                  className="btn-arrow justify-center font-display tracking-wide border border-white/40 text-white hover:bg-white hover:text-ink px-5 py-3 text-[16px] transition-colors"
                >
                  <span>QUESTIONS? EMAIL US</span>
                  <IconArrowRight size={18} className="arrow" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CROSS-SELL */}
      <AccentBanner>WANT TO BOOK ONLINE TODAY?</AccentBanner>
      <section className="bg-white py-14 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-center gap-3">
          {bookable.map((c) => (
            <RedButton key={c.id} onClick={() => setPage("summerCamp", c.slug)}>BOOK {c.place}</RedButton>
          ))}
        </div>
      </section>
    </main>
  );
};

// ---- PAGE -------------------------------------------------------------------
const SummerCamp = ({ setPage, sub }) => {
  const camp = sub ? summerCampBySlug(sub) : null;
  let content;
  if (camp && camp.status === "open") content = <SummerCampDetail key={camp.id} camp={camp} setPage={setPage} />;
  else if (camp && camp.status === "external") content = <SummerCampInfo key={camp.id} camp={camp} setPage={setPage} />;
  else content = <SummerHub setPage={setPage} />;

  return (
    <>
      {content}
      <style>{`
        .summer-back__icon { transform: rotate(180deg); }
        .summer-grid {
          list-style: none; padding: 0; margin: 0;
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 768px) { .summer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; } }
        .summer-card {
          display: flex; flex-direction: column; width: 100%; height: 100%;
          text-align: left;
          padding: 28px;
          background: #F5F5F5;
          border: 1px solid #E5E5E5;
          transition: border-color 250ms ease, background 250ms ease, transform 250ms ease, box-shadow 250ms ease;
        }
        button.summer-card:hover {
          background: #fff;
          border-color: #111;
          transform: translateY(-3px);
          box-shadow: 0 24px 40px -28px rgba(0,0,0,0.35);
        }
        .summer-card--soon { background: #FAFAFA; border-style: dashed; }
        .summer-card__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .summer-card__status {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.16em; font-size: 11px;
        }
        .summer-card__status-dot { width: 7px; height: 7px; border-radius: 999px; }
        .summer-card__region {
          font-family: "Barlow Condensed", sans-serif; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px; color: #757575;
        }
        .summer-card__name { margin-top: 18px; font-size: clamp(2.25rem, 4.5vw, 3.25rem); line-height: 0.9; color: #111; }
        .summer-card__venue { margin-top: 8px; font-size: 15px; color: #757575; }
        .summer-card__weeks { list-style: none; padding: 0; margin: 22px 0 0; border-top: 1px solid #E5E5E5; }
        .summer-card__weeks li {
          display: flex; justify-content: space-between; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid #E5E5E5;
          font-family: "Barlow Condensed", sans-serif; text-transform: uppercase; letter-spacing: 0.1em; font-size: 14px;
        }
        .summer-card__week-title { color: #111; font-weight: 700; }
        .summer-card__week-dates { color: #757575; font-weight: 600; white-space: nowrap; }
        .summer-card__foot { margin-top: auto; padding-top: 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .summer-card__price { font-family: "Bebas Neue", sans-serif; font-size: 24px; color: #111; }
        .summer-card__cta {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.03em;
          color: #fff; background: #D2122E; padding: 10px 16px;
          transition: background 200ms ease;
        }
        button.summer-card:hover .summer-card__cta { background: #A20E22; }
        .summer-card__arrow { transition: transform 200ms ease; }
        button.summer-card:hover .summer-card__arrow { transform: translateX(4px); }
        .summer-card__notify { font-family: "Barlow Condensed", sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; color: #111; text-decoration: underline; }

        .session-card {
          display: block; width: 100%;
          background: #F5F5F5; border: 1px solid #E5E5E5;
          transition: border-color 200ms ease, background 200ms ease, box-shadow 200ms ease;
        }
        .session-card--selectable { cursor: pointer; }
        .session-card--selectable:hover { background: #fff; border-color: #111; }
        .session-card--selected { background: #fff; border-color: #D2122E; box-shadow: inset 0 0 0 1px #D2122E; }
        .session-card__pick {
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.14em; font-size: 11px;
          padding: 4px 10px; border: 1px solid #111; color: #111;
        }
        .session-card--selected .session-card__pick { background: #D2122E; border-color: #D2122E; color: #fff; }
        .bring-check {
          width: 20px; height: 20px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: #D2122E; color: #fff;
        }
        @media (prefers-reduced-motion: reduce) {
          .summer-card, .session-card { transition: none !important; }
        }
      `}</style>
    </>
  );
};

window.SummerCamp = SummerCamp;
