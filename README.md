# MVP prototype · Shared property network (Cochabamba)

Clickable prototype for testing with 3 to 5 real estate agents. It has no backend and no login: everything lives in the phone's `localStorage`. The spec (PRDs), the interviews and the business plan are in the [business-idea](https://github.com/boris-ravn/business-idea) repository.

Stack: Vite + React + TypeScript + Tailwind CSS v4 + React Router (HashRouter) + Vitest.

## Running it

Requires Node 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (parser, filters, freshness, sharing…)
npm run build      # static build in dist/
npm run preview    # serves dist/ at http://localhost:4173
```

To try it on your phone on the same Wi‑Fi network: `npm run dev -- --host` and open the "Network" URL shown in the console.

## Configuration (`src/config.ts`)

| Constant | What it does |
|---|---|
| `PRODUCT_NAME` | Product name shown to users: `Real Estate App`. |
| `DEMO_MODE` | With `true`, "Consultar por WhatsApp" (Ask on WhatsApp) first shows a notice with the message, because the seed phone numbers are fictitious. |

After changing the configuration, rebuild and redeploy.

## During user testing

- **Reset the demo between participants:** press and hold the logo on the home screen for a few seconds, or open `/#/debug` and tap **Reiniciar demo** (Reset demo). This restores the sample listings and clears the profile and events.
- **See what the participant did:** `/#/debug` shows events grouped by session, with a **Copiar eventos** (Copy events) button (JSON).
- **Feedback:** collected outside the app, in the closing questions of each session (the app no longer has the **Opinar** (Give feedback) button). Before tapping **Reiniciar demo**, copy the events from `/#/debug`: they include how many fields the parser detected.
- **Test tasks (PRD §12):**
  1. Find a 2-bedroom apartment for rent, with garage, that allows pets and costs up to Bs 4.000 → the seed has 3 results.
  2. Publish by pasting a WhatsApp message.
  3. "One of your listings has already been rented" → in Mis propiedades (My listings) there is the Queru Queru apartment for rent.
  4. Share a listing in a group.

## Deploy (static site)

The build uses relative paths (`base: './'`) and HashRouter, so it works on any static hosting without configuring redirects.

**Vercel:** on vercel.com → *Add New… → Project*, import this repository. It detects *Vite* on its own (build `npm run build`, output `dist`) and nothing needs to change. Every push to `main` redeploys.

**Netlify:** use `npm run build` as the build command and `dist` as the publish directory. Alternatively, drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

The bundle is ~110 KB gzipped and uses no external fonts or images, so it loads fast on 4G.

## Structure

```
src/
  config.ts               single configuration (see above)
  domain/                 pure, tested logic: model, freshness, format, filters, draft, WhatsApp, sharing
  parser/parseListing.ts  "paste message → listing" (regex + dictionaries; can be swapped for an LLM without touching the UI)
  seed/                   28 listings, 9 fictitious agents and 8 sample messages; dates are relative to today
  store/                  state + localStorage, event log and filters
  screens/                Home (F1), Detail (F2/F3), Publish (F4), MyListings (F5), Debug
  components/             card, bottom sheets, sharing (F6)…
```

## Known prototype limitations

- Data is local to each phone: what one participant publishes is not seen by another, and the "Ver ficha" (View listing) link in the share text only opens on that same device.
- Freshness, commission and owner authorization are self-declared by the agent; nothing is verified.
- Photos are placeholders (gradient + icon).
