# Mortgage Overview App

Eximbank-branded mortgage intelligence demonstration for Ho Chi Minh City. Includes interactive district choropleths, four KPI cards, area portfolio previews on hover or keyboard focus, pinned district selection, borrower profiles, opportunity ranking, district search, a comparison table and scoped CSV export. The map supports zoom, drag-to-pan, label toggling and reset. The layout adapts to desktop and mobile.

**Status:** React application with official Rayfin CLI publishing configuration in `rayfin/rayfin.yml`. **Not published to Fabric.** Publishing from the implementation session was blocked because Microsoft sign-in (`login.microsoftonline.com`) and the Fabric API (`api.fabric.microsoft.com`) could not be resolved. No Fabric item has been created or saved.

## Run

The React application supports Node.js 22, 24 or 26 and npm. `.nvmrc` selects Node.js 26 for application development, builds and tests.

**Fabric publishing uses separate tooling:** Rayfin CLI 1.36.2, including the latest published version at the time of this change, declares support for Node.js 20, 22 and 24 only. Installing dependencies on Node.js 26 can emit an `EBADENGINE` warning for that CLI; strict engine enforcement will reject the install. Do not disable engine enforcement to bypass this restriction. Use Node.js 22 or 24 for Fabric login, deployment and status checks. Application compatibility with Node.js 26 does not add Node.js 26 support to Microsoft's CLI.

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

The URL and folder ID are recorded as supplied, **not verified against Fabric**. The official `@microsoft/rayfin-cli` is installed. Its in-place initializer generated `rayfin/rayfin.yml`, configuring `npm run build`, the `dist/` static hosting directory, Fabric authentication and **protected** static asset access. The data service is disabled: this demonstration uses its bundled synthetic records, not a provisioned database.

### Publish from an authorized, network-connected environment

Use a trusted machine that can reach Microsoft Entra sign-in and the Fabric API. Sign in with an account authorized to create items in the target workspace. Do not paste passwords, access tokens or client secrets into chat or commit them.

```sh
# Select Node.js 22 or 24 using your normal runtime manager first.
npm ci
npm run rayfin:login
npm run rayfin:deploy
npm run rayfin:status
```

The deploy script executes the supported command:

```sh
npx rayfin up --workspace-id 6d6350e8-6f22-4a8b-b06a-eb4a3b68dd23 --item-name "Mortgage Overview App"
```

`rayfin up` builds and publishes the app; `rayfin up status` checks the deployment. Confirm the resulting item and hosting URLs before sharing. Provisioning may require Fabric capacity, tenant enablement or administrator consent; those requirements must be checked in the actual tenant.

**Folder placement is a separate step:** Rayfin CLI 1.36.2 exposes workspace and item-name options, but no folder option. After publishing, use the Fabric portal's supported move action to place the item in **Eximbank Demo**. Confirm the folder name and supplied ID rather than assuming the URL's `subfolderId` is a valid REST API folder identifier.

The CLI stores deployment metadata in `rayfin/.deployments.json` and generated runtime settings in `rayfin/.env`; these are ignored by git. On systems without an OS keychain, Rayfin requires explicit opt-in to plaintext token storage. Prefer signing in on a trusted desktop with its keychain; no plaintext fallback or credential collection was enabled in this session.

The installed Rayfin context in `AGENTS.md` and `.agents/skills/` explains how to find version-matched package documentation. The official initializer also generated the optional `.mcp.json` integration.

If a Fabric data connection is later needed, ingest `public/data/districts.csv` through the supported Fabric ingestion flow. Keep integer counts and VND balances numeric, `propensity` decimal, and preserve `id`, `snapshot` and `synthetic`. A production database/client integration and Fabric-hosted end-to-end authentication still require validation against the live tenant.

There are intentionally no credentials or claims of a completed Fabric publish in this project.