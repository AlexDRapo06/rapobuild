// APP — hash router.
//
// Routes are "#page" or "#page/sub" — e.g. #summerCamp/arlington-catholic for a
// single camp, or #coaches/josh-partal to open the staff page at one coach.
// Unknown pages (including the retired #basketball) fall back to home.
const VALID_PAGES = [
  "home", "summerCamp", "winterCamp", "veteransDay",
  ...(SHOW_MIAMI ? ["miami"] : []),
  "coaches", "media", "privateTraining",
];

const PAGE_TITLES = {
  home: "FOOTYUP — Boston Youth Soccer",
  summerCamp: "Summer Camps 2027 — FOOTYUP",
  winterCamp: "Winter Camp — FOOTYUP",
  veteransDay: "Veterans Day Camp — FOOTYUP",
  miami: "Miami College Combine — FOOTYUP",
  coaches: "Coaches — FOOTYUP",
  media: "Media — FOOTYUP",
  privateTraining: "Private Training — FOOTYUP",
};

function readRoute() {
  const raw = (window.location.hash || "").replace(/^#/, "");
  const [page, sub = ""] = raw.split("/");
  return VALID_PAGES.includes(page) ? { page, sub: decodeURIComponent(sub) } : { page: "home", sub: "" };
}

function pageTitle({ page, sub }) {
  if (page === "summerCamp" && sub) {
    const camp = summerCampBySlug(sub);
    if (camp) return `${camp.name} Summer Camp — FOOTYUP`;
  }
  return PAGE_TITLES[page] || PAGE_TITLES.home;
}

const App = () => {
  const [route, setRoute] = React.useState(readRoute());

  React.useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    document.title = pageTitle(route);
  }, [route.page, route.sub]);

  // Re-render once live prices from the dashboard arrive (see applyCatalog).
  const [, setCatalogVersion] = React.useState(0);
  React.useEffect(() => {
    fetch("/api/site/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((catalog) => {
        if (applyCatalog(catalog)) setCatalogVersion((v) => v + 1);
      })
      .catch(() => {});
  }, []);

  // Waitlist offer emails link to /?waitlist=<token>: open that camp's form with the spot held.
  const [offerExpired, setOfferExpired] = React.useState(false);
  React.useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("waitlist");
    if (!token) return;
    fetch(`/api/site/waitlist?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((offer) => {
        const camp = offer && offer.valid && campById(offer.campId);
        const target = camp && campRoute(camp);
        if (!target) { setOfferExpired(true); return; }
        window.WAITLIST_OFFER = { ...offer, token };
        setPage(target[0], target[1] || "");
        setTimeout(() => {
          const el = document.getElementById(camp.page === "miami" ? "miami-register" : "camp-register");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      })
      .catch(() => setOfferExpired(true));
  }, []);

  const setPage = (p, sub = "") => {
    if (!VALID_PAGES.includes(p)) { p = "home"; sub = ""; }
    const hash = sub ? `${p}/${encodeURIComponent(sub)}` : p;
    if (window.location.hash !== "#" + hash) {
      window.location.hash = hash;
    }
    setRoute({ page: p, sub });
    // Deep links into the coaches page scroll to that coach themselves.
    if (p === "coaches" && sub) return;
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  let Page;
  switch (route.page) {
    case "summerCamp": Page = window.SummerCamp; break;
    case "winterCamp": Page = window.WinterCamp; break;
    case "veteransDay": Page = window.VeteransDayCamp; break;
    case "miami": Page = window.MiamiCombine; break;
    case "coaches": Page = window.Coaches; break;
    case "media": Page = window.Media; break;
    case "privateTraining": Page = window.PrivateTraining; break;
    default: Page = window.Home;
  }

  return (
    <>
      <TopNav page={route.page} setPage={setPage} />
      {offerExpired && (
        <div role="alert" className="bg-ink text-white px-5 py-4 text-center text-[14px] flex items-center justify-center gap-4 flex-wrap">
          <span>This waitlist link has expired or was already used. Email footyupp@outlook.com and we'll help.</span>
          <button type="button" onClick={() => setOfferExpired(false)} className="font-cond uppercase tracking-[0.15em] text-[12px] underline">Dismiss</button>
        </div>
      )}
      <Page setPage={setPage} sub={route.sub} />
      <Footer setPage={setPage} />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
