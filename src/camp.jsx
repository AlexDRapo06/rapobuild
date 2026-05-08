// CAMP page
const SCHEDULE = [
  { time: "09:00 — 09:30", title: "CHECK-IN", desc: "Players arrive, gear up, meet their group.", img: "1517466787929-bc90951d0974" },
  { time: "09:30 — 10:30", title: "TECHNICAL & PASSING", desc: "Foundational ball work. First touch.", img: "1551958219-acbc608c6377" },
  { time: "10:30 — 10:45", title: "SNACK BREAK", desc: "Hydrate. Refuel. Recover.", img: "1543326727-cf6c39e8f84c" },
  { time: "10:45 — 12:00", title: "BALL WORK + PROGRESSIONS", desc: "Live drills scaling into game scenarios.", img: "1574629810360-7efbbe195018" },
  { time: "12:00 — 12:45", title: "LUNCH", desc: "Provided. Eat with the staff.", img: "1571019613454-1cb2f99b2d8b" },
  { time: "12:45 — 02:00", title: "SCRIMMAGES — 9v9 / 11v11", desc: "Real reps. Real pressure. Coached live.", img: "1431324155629-1a6deb1dec8d" },
];

const Camp = ({ setPage }) => {
  return (
    <main id="main">
      {/* HEADER */}
      <section className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Summer Camp 2026</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}>A DAY AT FOOTY UP.</h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            5 hours. Zero wasted minutes. Coached start to finish by D1 athletes.
          </p>
        </div>
      </section>

      {/* FACTS + SCHEDULE */}
      <section className="bg-white px-5 lg:px-10 pb-20">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          {/* Facts */}
          <div className="lg:col-span-2 lg:sticky" style={{ top: 100 }}>
            <div className="bg-ink text-white p-10 lg:p-12">
              <div className="eyebrow mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>The Facts</div>
              <LabelRow dark label="Location" value="Greater Boston, MA" /> {/* SWAP: camp address */}
              <LabelRow dark label="Dates" value="July 13 — 17, 2026" /> {/* SWAP: camp dates */}
              <LabelRow dark label="Ages" value="U10 — U16" /> {/* SWAP: age range */}
              <LabelRow dark label="Price" value="$350 per player" />
              <LabelRow dark label="Includes" value="Lunch, snacks, GOAT × Footy Up gear" />
              <LabelRow dark label="Guest Coaches" value="Peyton · Olger · Eric · Cristiano" last />
              <div className="mt-8">
                <RedButton onClick={() => setPage("register")} full>REGISTER YOUR PLAYER</RedButton>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="lg:col-span-3">
            <div className="eyebrow mb-6">Day in the life</div>
            <div className="relative pl-6 lg:pl-8" style={{ borderLeft: "4px solid #111111" }}>
              <ul className="flex flex-col gap-8">
                {SCHEDULE.map((s) => (
                  <li key={s.title} className="flex items-center gap-4 sm:gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[22px] sm:text-[24px] text-ink leading-none">{s.time}</div>
                      <div className="font-display text-[24px] sm:text-[28px] text-ink mt-2 leading-tight">· {s.title}</div>
                      <div className="text-[14px] text-fog mt-2 leading-[1.5]">{s.desc}</div>
                    </div>
                    <div className="hidden sm:block w-[80px] h-[80px] flex-shrink-0 ml-auto overflow-hidden bg-smoke">
                      <UnsplashImg id={s.img} w={200} alt={s.title.toLowerCase()} />
                      {/* SWAP: real photo from Rappo */}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Parent special session */}
            <div
              className="mt-10 p-7 lg:p-8"
              style={{ background: "#FFF5F6", borderLeft: "4px solid #D2122E" }}
            >
              <div className="eyebrow" style={{ color: "#D2122E" }}>★ Special session for parents</div>
              <h3 className="font-display text-ink mt-2" style={{ fontSize: "clamp(1.75rem, 3vw, 2rem)" }}>
                PARENT RECRUITMENT SESSION.
              </h3>
              <p className="mt-3 text-[16px] text-ink leading-[1.55]">
                One day per camp, our coaches break down exactly how to set your child up for D1 college recruiting. Taught by athletes who've lived it. Parents are invited.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GOAT BONUS */}
      <section className="bg-ink text-white py-20 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-3">
            <div className="font-display flex items-baseline gap-3" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="text-[24px] lg:text-[28px]">FOOTY UP ×</span>
              <span className="text-[56px] lg:text-[64px] text-white leading-none">GOAT.</span>
            </div>
            <h2 className="font-display mt-6" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              EVERY CAMPER GETS THE DROP.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.8)", maxWidth: 480 }}>
              Co-branded gear included with every camp registration. Limited to camp participants only. Sizes locked at registration. Drop reveals on Day 1.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
            {[
              { label: "JERSEY", img: "1556906781-9a412961c28c" },
              { label: "BALL", img: "1551958219-acbc608c6377" },
              { label: "KIT BAG", img: "1553062407-98eeb64c6a62" },
            ].map((p) => (
              <div key={p.label} className="bg-charcoal p-4 flex flex-col">
                <div className="aspect-square overflow-hidden bg-black">
                  <UnsplashImg id={p.img} w={400} alt={p.label.toLowerCase()} />
                  {/* SWAP: real GOAT product photo */}
                </div>
                <div className="mt-3">
                  <div className="font-display text-[18px] text-white leading-none">{p.label}</div>
                  <div className="font-cond uppercase text-[11px] tracking-[0.15em] mt-1.5" style={{ color: "#D2122E" }}>Included</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RED BANNER */}
      <AccentBanner>TRAIN WITH PROS. SIGN UP IN UNDER 60 SECONDS.</AccentBanner>

      {/* FINAL CTA */}
      <section className="bg-white py-20 px-5 lg:px-10 text-center">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>LOCK YOUR SPOT.</h2>
          <p className="mt-4 text-[16px] text-fog">Spots are limited. Once gone, gone.</p>
          <div className="mt-7 flex justify-center">
            <RedButton onClick={() => setPage("register")}>REGISTER NOW — $350</RedButton>
          </div>
        </div>
      </section>
    </main>
  );
};

window.Camp = Camp;
