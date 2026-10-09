// APP — hash router.
//
// Routes are "#page" or "#page/sub" — e.g. #summerCamp/arlington-catholic for a
// single camp, or #coaches/josh-partal to open the staff page at one coach.
// Unknown pages (including the retired #basketball) fall back to home.
const VALID_PAGES = ["home", "summerCamp", "winterCamp", "miami", "coaches", "media", "privateTraining"];

const PAGE_TITLES = {
  home: "FOOTYUP — Boston Youth Soccer",
  summerCamp: "Summer Camps 2027 — FOOTYUP",
  winterCamp: "Winter Camp — FOOTYUP",
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
    case "miami": Page = window.MiamiCombine; break;
    case "coaches": Page = window.Coaches; break;
    case "media": Page = window.Media; break;
    case "privateTraining": Page = window.PrivateTraining; break;
    default: Page = window.Home;
  }

  return (
    <>
      <TopNav page={route.page} setPage={setPage} />
      <Page setPage={setPage} sub={route.sub} />
      <Footer setPage={setPage} />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
