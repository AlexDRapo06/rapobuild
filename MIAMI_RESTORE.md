# Restoring the Miami College Combine

The Miami section is hidden, not deleted. `src/miami.jsx`, the camp data in
`src/camps.jsx`, and the API config (`api/_camps.js`, `api/camp-access.js`,
`api/checkout.js`) are all untouched.

To bring it back:

1. In `src/camps.jsx`, set `const SHOW_MIAMI = true;`. That restores the `#miami`
   route, the nav + footer links, the home hero pill, the "Upcoming Camps" Miami
   card and gold CTA button, and the Miami wording in the home / media copy.
2. In `index.html`, put "and the Miami College Combine" back into the two meta
   descriptions (`description` and `og:description`), right after "private training":
   `... private training and the Miami College Combine — coached by ...`
