# Google Ads Simulator Revamp: review notes

## Result

The six-step form becomes a nine-step Search campaign workspace with contextual teaching guides, multiple ad groups and ads, explicit match types and negative scopes, responsive-ad pinning, optional assets, expanded targeting and measurement controls, local practice publication, autosave, migration, and submission exports.

The instructor remains the grader. The earlier ad-strength calculation is removed. Neither the app nor exports score creative, assign grades, predict results, or provide assessment explanations. Checks are restricted to technical fields and limits.

## Scope preserved

- React/TypeScript/Vite, existing dependencies, both lockfiles, repository base path, and docs build output.
- Existing GitHub Pages hosting remains the production target; no publishing settings, access, DNS, or production deployment are changed by the review branch.
- Earlier browser drafts are retained. A new storage namespace avoids collisions with other applications on the same origin.
- Teaching content, styling, and audience examples are bundled. No new runtime network dependency, remote font, grading service, account, or backend.

## Verification performed

Using Node.js 24.19.0 and the existing npm lockfile:

- npm ci --ignore-scripts: passed.
- npm test: 16 tests passed, including complete current and historical submission report rendering.
- npm run typecheck: passed, with the original React typing limitation documented in README.
- npm run build: passed and generated docs assets under the existing base path.
- Source inspection: checked conditional bid fields, controls and labels, native dialog focus handling, mobile navigation keyboard handling, responsive CSS, report fields, print CSS, storage/import paths, and absence of runtime API/CDN calls.

The local Vite server starts at http://127.0.0.1:3000/MARK-4360-Search-Ads-Simulator/. The cloud browser rejected this local address with net::ERR_BLOCKED_BY_CLIENT. Consequently, browser interaction, mobile visual inspection, real reload/download/import behavior, and native print pagination were **not verified** in this environment. Server-rendered report content checks passed; they do not establish visual print quality.

The default 0.0.0.0 dev-server startup encountered an environment-specific network-interface error here. npm run dev -- --host 127.0.0.1 started successfully without changing the repository's server configuration.

## Review locally

~~~sh
git fetch origin
git switch feat/google-ads-guided-workspace
npm ci
npm test
npm run typecheck
npm run dev
~~~

Open the Vite address with the existing repository base path. Follow the manual checklist in [MAINTAINING.md](MAINTAINING.md) before approving production release.

## Deployment discrepancy found during inspection

At inspection, main commit c48f8099b607178ec328254e10d4444dbf16b2ba referenced index-Bocx5mPR.js in its committed docs output. Reloading the public app still served index-zEFB-REY.js. The latest successful Pages action observed was from the fix-deployment-config-17180854313184448867 branch on December 12, 2025.

This proves a bundle mismatch, not which publishing setting caused it. Confirm the actual Pages source in the repository settings before release. No hosting settings or deployed app were changed during this revamp.

## Deliberate limitations

- Search campaign creation only. No Facebook/Meta workflow, login, account billing, live auction, policy review, or performance dashboard.
- No geocoding, live audience lookup, destination fetching, or conversion-tag verification. Students enter and justify those planning selections.
- Responsive previews are illustrative traditional combinations. They do not reproduce all live formats, asset sharing, or automated platform features.
- Native browser printing supplies PDF output. Final pagination needs browser inspection.
- Browser saves and local history are editable and may encounter quota limits. Download JSON for durable copies and transfer.
- Workspace limits of 20 groups, 10 ads per group, and 200 keywords per list support classroom work and are not presented as Google's account limits.
