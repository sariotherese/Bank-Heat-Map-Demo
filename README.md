# Mortgage Overview App

Eximbank-branded mortgage intelligence demonstration for Ho Chi Minh City. Includes interactive district choropleths, four KPI cards, area portfolio previews on hover or keyboard focus, pinned district selection, borrower profiles, opportunity ranking, district search, a comparison table and scoped CSV export. The map supports zoom, drag-to-pan, label toggling and reset. The layout adapts to desktop and mobile.

**Status:** standalone React application, ready to build and host. **Not published to Fabric and not a Rayfin-native application.** No authenticated Fabric/Rayfin tooling was available during implementation. No Fabric item has been created or saved.

## Run

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

```sh
npm run build       # TypeScript check + production bundle in dist/
npm run preview    # Serve the production build locally
npm test           # Data invariants, aggregation, search and ranking
npx playwright install chromium
npm run test:e2e    # Production-build browser tests, desktop and mobile
npm run data:generate
```

The build is static and uses relative asset paths. Host **the complete `dist/` directory**, including its `data/` directory, on an approved HTTPS static host. Runtime data and geography are bundled locally; no API key, map tile service, external font request, credentials or backend is required. External links are only opened when explicitly selected.

`deployment/github-actions-checks.yml` is an **inactive workflow example** that builds, verifies and uploads the **Mortgage-Overview-App** bundle. A maintainer can copy it to `.github/workflows/ci.yml` to enable it. This session's GitHub App token does not have workflow-write permission, so the example is intentionally not installed as an active workflow.

## Synthetic data and geography

All financial and demographic values are **dummy data**, not actual Eximbank records or official population statistics. No personal data is included. The illustrative snapshot is **30 September 2026**. `scripts/generate-data.mjs` reproducibly generates:

- `src/data/districts.json`: typed application dataset.
- `public/data/districts.json`: portable JSON dataset.
- `public/data/districts.csv`: flat dataset suitable for ingestion into an approved Fabric data item.

Real boundary geometry covers the **historical 22 districts / Thu Duc City in pre-2025 Ho Chi Minh City**. This is intentionally a historical analytical geography, not the current expanded city's administrative structure. The app discloses this distinction. Each data record's `id` joins to the GeoJSON property's `gid`.

`public/data/hcm-districts.geojson` comes from [Nguyễn Cao Nhân's district boundary dataset](https://github.com/nguyencaonhan271201/tphcm_district_boundaries), derived from OpenStreetMap and polygons.openstreetmap.fr. Repository license: MIT; reproduced in `public/data/BOUNDARY-LICENSE.txt`. Underlying geographic data: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Preserve the attribution and license when redistributing the boundary data. Synthetic statistics are independent of the source geography.

### Measures

| Field | Meaning / calculation |
|---|---|
| `population` | Assumed residents for historical district geography |
| `workingPopulation` | Assumed working residents: 59–63.8% of population |
| `mortgageHolders` | Assumed people with mortgages across all lenders, not Eximbank alone |
| `bankCustomers` | Synthetic Eximbank mortgage borrowers, a subset of mortgage holders |
| `eligibleNonBorrowers` | 6.5–10.5% of working residents without mortgages; illustrative eligibility proxy |
| `propensity` | Assumed borrowing propensity: 14–24% |
| `opportunities` | Rounded eligible non-borrowers × propensity |
| `averageLoanVnd` | Assumed loan balance in VND |
| `portfolioVnd` | Eximbank borrowers × average loan |
| `potentialVnd` | Opportunities × average loan; not a forecast or approved lending |
| `salariedShare`, `affluentShare` | Synthetic, mutually exclusive borrower segments; self-employed is the remainder |
| `snapshot`, `synthetic` | Demo snapshot date and explicit dummy-data indicator |

Heat intensity shows **absolute counts**, not density or likelihood. Its scale remains citywide when searching so colors stay comparable. Mortgage penetration = mortgage holders / working population. Monetary values use VND; B = billion and T = trillion. Opportunity estimates are not qualified leads or credit recommendations.

KPI cards default to citywide totals, follow the search scope, and use a pinned district when selected. Hover temporarily previews an area's portfolio without changing the pinned selection. CSV export follows the current search or pinned-district scope. No individual customer profiles or identifiable records are exposed.

## Fabric / Rayfin handoff

Requested destination:

| Setting | Value |
|---|---|
| Application name | **Mortgage Overview App** |
| Folder name | **Eximbank Demo** |
| Workspace ID | `6d6350e8-6f22-4a8b-b06a-eb4a3b68dd23` |
| Folder ID | `102243` (as supplied in the destination URL) |

[Open the supplied Fabric destination](https://app.fabric.microsoft.com/groups/6d6350e8-6f22-4a8b-b06a-eb4a3b68dd23/list?experience=fabric-developer&subfolderId=102243).

The URL and folder ID are recorded as supplied, **not verified against Fabric**. This repository does not contain a Fabric item definition, Rayfin SDK dependency or an importable Rayfin package. A React static bundle cannot simply be uploaded as a native Fabric application.

Manual integration requires an authorized operator:

1. Open the target workspace and confirm that the supplied folder ID resolves to **Eximbank Demo**, and that the required Fabric/Rayfin workload is installed and authorized.
2. Build and host `dist/` on an organization-approved HTTPS host if that workload explicitly supports external web applications. Otherwise use this app as the UI specification and implement the same views through the documented Rayfin-native application format. The required SDK, packaging and embedding support must be confirmed with the actual Rayfin environment; no unsupported API or import procedure is assumed here.
3. If a Fabric data connection is needed, ingest `public/data/districts.csv` into the chosen Lakehouse/Warehouse using the supported Fabric ingestion flow. Keep integer counts and VND balances numeric, `propensity` decimal, and preserve `id`, `snapshot` and `synthetic`. The standalone demo continues to read its bundled JSON until a documented, authenticated adapter is implemented.
4. Through the workload's supported publish flow, create the application named **Mortgage Overview App** and save/move it to the verified **Eximbank Demo** folder.
5. Verify the resulting item URL, viewer permissions, data access, hover portfolios, map interactions and synthetic-data notices inside Fabric before sharing it.

There are intentionally no credentials, fabricated Fabric deployment scripts or claims of a completed Fabric publish in this project.