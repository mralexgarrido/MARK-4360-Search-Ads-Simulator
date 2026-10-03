# Maintainer guide

## Build and deployment boundaries

Keep the existing React, TypeScript, Vite, and npm setup. No package was added for the revamp. Vite retains the base path /MARK-4360-Search-Ads-Simulator/, development port 3000, and build output docs/. Build artifacts belong there; hand-maintained documentation belongs elsewhere.

The workspace uses no external advertising or grading service. Unused API-key substitutions were removed from Vite configuration. Do not add account credentials or privileged API keys to browser code.

Before production deployment, inspect Settings > Pages and confirm the actual publishing branch and folder. Committed docs/ output alone does not prove those settings. Preserve the existing hosting method and verify the served bundle after an authorized deployment.

## Verification

~~~sh
npm ci
npm test
npm run typecheck
npm run build
npm run preview
~~~

Use the checked-in npm lockfile. The pnpm lockfile is also retained; do not regenerate or remove it as part of an unrelated change. Native tests require Node.js 22.14 or newer.

Tests cover empty and invalid campaigns, bid-specific technical rules, multiple groups and ads, keyword parsing, pinning, counted character limits, publication immutability, legacy migration, JSON version/shape checks, storage failures, safe URL handling, CSV escaping, retention bounds, and complete report rendering. They do not replace browser interaction or print-layout verification.

For manual browser checks:

1. Open an empty workspace. Review should list missing fields and disable publication. Exporting a draft should remain available.
2. Complete all nine steps with fictional data. Use two groups and two ads, different match types, campaign and group negatives, Spanish, custom locations, an excluded location, a schedule, pinned assets, sitelinks, callouts, and UTM parameters.
3. Open guides with the keyboard. Escape should close dialogs and restore focus. Inspect labels, focus visibility, the skip link, and the mobile navigation drawer.
4. Reload after editing and verify autosave. Download JSON, start a new campaign, import the file, and compare every setting and note. A failed or canceled import must keep the existing workspace.
5. Publish, edit a headline, and confirm the launch snapshot retains the earlier text. Republish, pause, resume, and inspect the recent local history.
6. Print the current campaign and a selected launch. Inspect all pages for clipping and confirm every ad asset and rationale is included. Historical reports should use captured notes and current student identification.
7. Check narrow-screen layouts, browser storage failure behavior, and assets served under the repository base path.
8. Open the same workspace in two tabs. Edit and save one tab; verify the other pauses saving and keeps its own visible copy. Download that copy before reloading. With browser storage blocked, edit accepted fields, attempt Save now, and verify that closing or reloading requests a leave-page warning.

Record actual browser and build checks separately. Do not claim a manual check passed because a build or rendered-markup test passed.

See [CLASS_READINESS.md](CLASS_READINESS.md) for the latest classroom review and its verification limits.

## Teaching boundaries

The instructor supplies assessment explanations, feedback, and grades. Limit automatic feedback to field requirements, syntax, lengths, and straightforward budget arithmetic. Do not introduce copy scores, rubric grades, predicted results, synthetic auction outcomes, or automated strategic evaluations.

Class notes are documentation and do not affect ad eligibility. Practice publication creates a local snapshot; it does not simulate policy approval or buy media. Audience and location lists are illustrative. Any expanded feature should preserve that distinction.

## Saved work

The v2 workspace uses mark4360_search_ads_workspace_v2. Earlier mark4360_draft entries are retained and migrated when possible. Malformed current saved data pauses autosave to protect that original entry. Browser storage is limited; JSON download remains available on save failure.

Imports validate shape, version, bounds, and identifiers before replacing the active workspace. Each snapshot includes a deep copy of campaign settings and notes. Retain at most ten launches and one hundred activity entries to bound local history. These are editable classroom records, not a secure audit trail.

## Rollback

Review work stays on its feature branch until an approved merge. Closing the draft pull request leaves the default branch unchanged. After an approved merge, revert through a separate pull request and restore the previously approved host deployment if necessary.

Before releasing, record the source commit and the actual serving bundle. The review started from main commit c48f8099b607178ec328254e10d4444dbf16b2ba; the public app served a different bundle at inspection time. See [REVAMP_REVIEW.md](REVAMP_REVIEW.md). Do not assume reverting main automatically restores the previously deployed version.
