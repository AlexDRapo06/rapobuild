// COACHES page
const Coaches = ({ setPage }) => {
  return (
    <main id="main">
      {/* HEADER */}
      <section className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">The Staff</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}>THE COACHES.</h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            Active NCAA Division I starters and ex-New England Revolution professionals. Each has made a professional debut. Each is starting at the highest level of college soccer. Each is coaching this summer at Footy Up.
          </p>
        </div>
      </section>

      {/* ROSTER — zigzag */}
      <section className="bg-white px-5 lg:px-10 pb-10">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-16 lg:gap-20">
          {COACHES.map((c, i) => {
            const reverse = i % 2 === 1;
            return (
              <article
                key={c.name}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="aspect-[4/5] overflow-hidden bg-smoke">
                  <div className="w-full h-full coach-img" style={{ filter: "grayscale(100%) contrast(1.05)" }}>
                    <UnsplashImg id={c.img} w={1200} alt={`Portrait of coach ${c.name}`} />
                    {/* SWAP: real headshot from Rappo, May 11 shoot */}
                  </div>
                </div>

                <div className="lg:px-8">
                  <div className="font-cond font-bold text-fog text-[18px] tracking-[0.15em]">— {c.n}</div>
                  <h2
                    className="font-display text-ink mt-3"
                    style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 0.92 }}
                  >
                    {c.name}
                  </h2>
                  <div
                    className="font-display mt-1"
                    style={{ color: "#D2122E", fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                  >
                    {c.school}
                  </div>
                  <div className="text-fog text-[15px] mt-3">{c.role}</div>
                  <p className="text-[16px] text-ink leading-[1.55] mt-5" style={{ maxWidth: 460 }}>
                    {c.bio}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {c.chips.map((chip) => (
                      <span
                        key={chip}
                        className="font-display text-[20px] text-ink border border-ink px-3 py-1.5 leading-none"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* GUEST APPEARANCES CALLOUT */}
      <section className="bg-smoke py-20 px-5 lg:px-10">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="eyebrow mb-4" style={{ color: "#D2122E" }}>★ Featured this summer</div>
          <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>GUEST APPEARANCES.</h2>
          <p className="mt-5 text-[16px] text-ink leading-[1.55]">
            Peyton Miller, Olger Escobar, Eric Klein, and Cristiano Oliveira will all be making guest appearances at the camp throughout the summer. Sessions are not pre-scheduled — drop by, train with whoever's running the day.
          </p>
        </div>
      </section>

      {/* RED BANNER */}
      <AccentBanner>
        EX-NEW ENGLAND REVOLUTION PLAYERS.<br />
        NCAA D1 STARTERS.<br />
        YOUR KID'S COACHES.
      </AccentBanner>

      {/* CTA TO REGISTER */}
      <section className="bg-white py-20 px-5 lg:px-10 text-center">
        <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>READY TO TRAIN WITH THEM?</h2>
        <p className="mt-4 text-[16px] text-fog">Camp registration open. $415 per player. Spots are limited.</p>
        <div className="mt-7 flex justify-center">
          <RedButton onClick={() => setPage("register")}>REGISTER NOW</RedButton>
        </div>
      </section>
    </main>
  );
};

window.Coaches = Coaches;
