// APP — page-state router
const VALID_PAGES = ["home", "coaches", "privateTraining", "basketball", "winterCamp", "summerCamp"];

function readHash() {
  const h = (window.location.hash || "").replace("#", "");
  return VALID_PAGES.includes(h) ? h : "home";
}

const App = () => {
  const [page, setPageState] = React.useState(readHash());

  React.useEffect(() => {
    const onHash = () => setPageState(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPage = (p) => {
    if (!VALID_PAGES.includes(p)) p = "home";
    if (window.location.hash !== "#" + p) {
      window.location.hash = p;
    }
    setPageState(p);
    // smooth scroll to top
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  let Page;
  switch (page) {
    case "coaches": Page = window.Coaches; break;
    case "privateTraining": Page = window.PrivateTraining; break;
    case "basketball": Page = window.Basketball; break;
    case "winterCamp": Page = window.WinterCamp; break;
    case "summerCamp": Page = window.SummerCamp; break;
    default: Page = window.Home;
  }

  return (
    <>
      <TopNav page={page} setPage={setPage} />
      <Page setPage={setPage} />
      <Footer setPage={setPage} />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
