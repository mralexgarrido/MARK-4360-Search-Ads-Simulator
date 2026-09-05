# Maintainer guide

## Build and deployment boundaries

`vite.config.ts` sets the base path to `/MARK-4360-Search-Ads-Simulator/`, the development port to 3000, and build output to `docs/`. `npm run build` generates that folder. Keep hand-maintained documentation at the repository root or in a different directory.

Before deploying, inspect **Settings > Pages** and confirm the actual publishing source and branch. The existence of committed `docs/` output does not by itself prove the dashboard settings. Preserve the existing hosting method; do not add a second deployment workflow as part of a documentation change.

For a different hosting path, review `base` against that path on a separate branch and test asset loading before release. Do not copy another simulator's deployment configuration into this repository.

## Local checks before a release

- Run `npm ci` and `npm run build` using the checked-in npm lockfile. Investigate a lockfile mismatch rather than replacing it automatically.
- Run `npm run preview`, then open the base path printed by Vite.
- Complete all six campaign steps with fictional data. Confirm the ad preview and review reflect the entered values.
- Select Save, reload, and confirm the draft returns. Select Start Over, reload, and confirm the saved draft is gone.
- Check keyboard navigation, tooltip focus, narrow-screen usability, and print preview. Verify no required campaign fields are missing from the printed result.

There is no test script in the current package manifest. Record build checks and manual checks separately, including any check that was not run.

## Describe updates clearly

For each reviewed milestone, write a short release summary covering the user-visible improvement, fixes, limitations, and any migration steps. Tie it to the reviewed commit; do not invent historical release dates or publish untested claims. Publishing a release or tag requires a separate decision from updating this document.

## Repository presentation checklist

Suggested About description: **Practice search advertising campaign planning with an interactive simulator for marketing students.**

The About website should point to the verified hosted application, not an editor workspace. Suggested topics: `marketing-education`, `search-advertising`, `react`, `typescript`, `vite`.

Review the README's app link after a hosting change. Use an actual, current application screenshot without student data when adding a repository social preview. About fields and the social preview are GitHub settings; this file does not configure them.

## Rollback

Keep documentation work in its own pull request. Before merge, closing the pull request leaves the default branch unchanged. After an approved merge, revert the documentation commit or merge through a new pull request. A documentation merge may still trigger the existing host's build, so retain the previous deployment as the rollback target.
