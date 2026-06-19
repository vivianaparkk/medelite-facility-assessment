# Facility Assessment Snapshot

A lightweight report generator built for Medelite's technical case study. Enter a CMS Certification
Number (CCN), pull live public ratings from the CMS Provider Data Catalog, layer in Medelite's
internal operational notes, and export a polished PDF snapshot.

## What it does

- **CCN lookup** — queries the CMS Provider Data Catalog's Nursing Home "Provider Information"
  dataset (`4pq5-n9py`) directly from the browser, no API key required.
- **Facility name override** — the CMS legal name is shown by default; typing a custom name
  in that field overrides it on the exported PDF only.
- **Manual operational fields** — EMR, current census, patient type, prior Medelite coverage,
  prior provider performance, and medical coverage, none of which live in the public CMS data.
- **CMS Five-Star ratings** — overall, health inspection, staffing, and quality of resident care.
- **One-click PDF export** — a print-ready report with a clickable link back to the facility's
  Medicare Care Compare profile (`medicare.gov/care-compare/details/nursing-home/{ccn}`).

## Validating against the test case

CMS Certification Number `105447` is Kendall Lakes Healthcare and Rehab Center (Miami, FL), the
reference example used in the case study materials. Type it into the CCN field (or use the
"load CCN 105447" shortcut on the empty state) to confirm the live data matches the reference
snapshot PDF provided alongside the brief.

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

This outputs a static `dist/` folder — no backend, no server-side environment variables, since
the CMS API call happens client-side and requires no credentials.

## Deploying

Because this is a static Vite build with zero server dependencies, any static host works.
The fastest paths:

**Vercel**
```bash
npm i -g vercel
vercel --prod
```

**Netlify**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**GitHub Pages**
Push `dist/` to a `gh-pages` branch, or use the `gh-pages` npm package pointed at the build output.

After deploying, drop the live URL and this repo's URL into the submission form.

## Architecture notes

- `src/cmsApi.js` — the CMS API client: builds the datastore query URL, normalizes the raw
  response into the fields the UI needs, and exposes typed errors (`FacilityNotFoundError`,
  `CmsApiError`) so the UI can distinguish "no such CCN" from "the network/API is down."
- `src/generatePdf.js` — builds the PDF with `jsPDF`, pulling from both the normalized CMS
  record and the manually entered fields. The Care Compare link is embedded as a real
  clickable annotation (`textWithLink`), not just styled text.
- `src/App.jsx` — the lookup form, the two-panel facility/manual-input layout, and the
  Five-Star ratings + download sidebar.
- `src/components/` — small presentational pieces (`FieldRow`, `StarRating`) kept separate so
  the manual-input field list in `App.jsx` stays readable.

## Verified before handoff

The following was actually executed and checked, not just assumed:

- `npm run build` and `npm run preview` both run clean and serve the production bundle.
- The CMS data normalization (`src/cmsApi.js`) was tested against a real captured CMS API
  response shape: numeric coercion, blank/footnoted-value handling, and address joining all
  behave correctly.
- The PDF generator was run end-to-end with the Kendall Lakes test case data (CCN 105447) and
  the output was inspected directly: a valid single-page PDF, text content matching the
  reference snapshot field-for-field, and a real `/Link` annotation (not styled text) pointing
  to `https://www.medicare.gov/care-compare/details/nursing-home/105447`.
- The facility-name override path was tested separately: leading/trailing whitespace is
  trimmed, the override replaces the CMS legal name in the report body, and the "MEDELITE"
  header band is untouched regardless of what's typed into the override field.

## Still needs your action

- **Deploying** — I don't have your Vercel/Netlify/GitHub credentials, so the actual `vercel
  --prod` or `netlify deploy` push has to come from you. Commands are above; should take under
  five minutes.
- **Pushing to a public repo** — same reason. `git init`, commit, push to a new GitHub repo.
- **Live-data smoke test** — everything above was tested with realistic mock data shaped exactly
  like the real CMS API's response, since this sandbox can't reach `data.cms.gov` directly. Once
  you run `npm run dev` on your machine and look up CCN 105447 for real, it's worth a quick visual
  check that the live network call returns the same fields.

## Known scope cuts (bonus features not implemented)

The 12 hospitalization/ED claims-based metrics (the bonus feature) require joining against
CMS's separate `NH_QualityMsr_Claims` dataset, which is structured as one row per facility per
measure code rather than one row per facility — a meaningfully different query shape than the
Provider Information dataset used for the MVP. The PDF generator already has a slot reserved
for these twelve fields (`manual.hospitalizationMetrics`) so they can be wired in without
touching the rest of the report layout, once that dataset's measure codes are mapped.
