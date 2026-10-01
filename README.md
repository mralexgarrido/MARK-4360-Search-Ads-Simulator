# Google Ads Simulator Revamp

A guided Google Search Ads practice workspace for MARK 4360. Students learn the campaign creation controls, publish a local practice campaign, and document their decisions for Alex Garrido's review.

**The instructor provides the feedback, explanation, and final grade.** The app checks technical field requirements. It does not grade strategy, score ad copy, predict performance, or generate assessment explanations.

[Current public simulator](https://mralexgarrido.github.io/MARK-4360-Search-Ads-Simulator/) · [Maintainer guide](MAINTAINING.md) · [Revamp review notes](REVAMP_REVIEW.md) · [Report an issue](https://github.com/mralexgarrido/MARK-4360-Search-Ads-Simulator/issues)

The public link may still show the earlier version while this revamp is under review.

## Student workflow

| Step | Platform practice |
| --- | --- |
| Campaign | Choose an objective and define the conversion and measurement plan |
| Bidding | Select clicks, manual CPC, conversions, target CPA, conversion value, target ROAS, or impression share |
| Campaign settings | Configure search partners, included and excluded locations, presence options, languages, dates, schedules, and audience mode |
| Ad groups & keywords | Organize groups, enter broad/phrase/exact keywords, and add group or campaign negative keywords |
| Ads | Create multiple responsive ads, edit headline and description assets, pin positions, and inspect illustrative combinations |
| Assets & URL options | Enter sitelinks, callouts, and optional documented UTM parameters |
| Budget | Enter an average daily budget and inspect spending-limit arithmetic |
| Review & publish | Resolve missing technical fields, confirm practice publication, and pause or resume locally |
| Class submission | Add identifying information and written rationale, then export the campaign evidence |

Information boxes and accessible step guides explain controls using bundled examples. Asset counts and character counters describe completion only. The app never labels a campaign strategically successful.

This is an independent educational simulation. It reproduces selected Search campaign concepts and controls, rather than every screen or feature of Google Ads. There is no account login, billing, policy decision, auction, or real delivery. Location names and audience segments are practice selections. Destinations and conversion tracking plans are recorded without fetching websites or installing tags.

## Save and submit

- **Autosave** stores the current workspace in this browser and site after a short delay. **Save now** also saves immediately.
- **Project JSON** preserves the working campaign, notes, recent activity, and launch snapshots. Download a copy and import it to continue on another device.
- **Print / Save PDF** uses the browser's native print dialog. The report lists every group, keyword, exclusion, ad asset and pin, campaign setting, destination, measurement plan, and written rationale.
- **Keyword CSV** documents positive and negative keywords and their scope. It is not a Google Ads upload template.
- **Launch snapshots** capture publication settings and notes. Choose the current working campaign or a historical launch for the report. Student name and course section use the current submission information.

Publication captures a snapshot and enables the practice campaign here. Later edits are marked as unpublished changes until another publication. Pausing and resuming affect the locally published campaign status. Recent history retains up to 10 launches and 100 activity entries; export JSON before replacing a project or if you need an earlier record.

Storage belongs to the browser origin, has browser quota limits, and does not sync through a student account. Clearing site data removes saved work. If browser saving fails, the app gives a notice and keeps downloads available. A malformed current saved entry is preserved and autosave pauses until the student explicitly imports or starts a new project.

Earlier drafts under the original storage key are migrated when possible, keeping the original entry. Match types, assets, student information, targeting, and explanatory text are retained. Migration notes call attention to settings that need review. JSON imports are checked before replacement, are limited to 32 MB, and require confirmation to open.

### For the instructor

Ask students to submit the campaign PDF and, when useful, the project JSON. Written rationale explains the audience, keyword structure, creative, destination, bidding, and budget assumptions. Local activity records are editable and do not prove authorship. Evaluate the choices and explanations yourself; technical completion is not a grade.

## Run locally

Use Node.js 22.14 or newer and npm with the existing npm lockfile:

~~~sh
git clone https://github.com/mralexgarrido/MARK-4360-Search-Ads-Simulator.git
cd MARK-4360-Search-Ads-Simulator
npm ci
npm run dev
~~~

For this review branch, check out feat/google-ads-guided-workspace before running the commands. Open the Vite address at /MARK-4360-Search-Ads-Simulator/.

~~~sh
npm test
npm run typecheck
npm run build
npm run preview
~~~

The build output remains **docs/**. The base path remains **/MARK-4360-Search-Ads-Simulator/**. Both existing lockfiles are retained. The revamp adds no packages or hosted runtime services. React, icons, styles, and teaching content are bundled locally; there are no CDN stylesheets, remote fonts, API requests, or analytics calls in the workspace.

## Project structure

| Path | Purpose |
| --- | --- |
| App.tsx | Campaign steps, editing, saving, publication, and submission controls |
| components/ | Form controls, native dialogs, ad preview, and printable report |
| types.ts | Campaign, ad-group, ad, and workspace types and initial values |
| lib/ | Technical requirements, snapshot operations, migration, import, and exports |
| data/ | Bundled step guides and sample audiences |
| styles.css | Responsive workspace, keyboard focus, and print styling |
| tests/ | Native Node tests for campaign rules, persistence, exports, and report rendering |
| vite.config.ts | Existing base path, development port, and docs output directory |
| docs/ | Generated static website |

The original package manifest does not include React type definitions. The small jsx.d.ts declaration supports React's special JSX key without adding a package. Type checking is therefore not a substitute for browser interaction tests.

## Teaching references

Guides are stored in the app and work without loading these pages. Maintainers should periodically compare terminology and field limits against official documentation.

- Google. (n.d.). [About responsive search ads](https://support.google.com/google-ads/answer/7684791?hl=en). Google Ads Help. Retrieved October 1, 2026.
- Google. (n.d.). [About keyword matching options](https://support.google.com/google-ads/answer/7478529?hl=en). Google Ads Help. Retrieved October 1, 2026.
- Google. (n.d.). [About Target CPA bidding](https://support.google.com/google-ads/answer/6268632?hl=en). Google Ads Help. Retrieved October 1, 2026.
- Google. (n.d.). [About overdelivery and your average daily budget](https://support.google.com/google-ads/answer/1704443?hl=en). Google Ads Help. Retrieved October 1, 2026.

## Support and contributions

For bugs, include the step, expected and actual result, browser, and a fictional example in an [issue](https://github.com/mralexgarrido/MARK-4360-Search-Ads-Simulator/issues). See [CONTRIBUTING.md](CONTRIBUTING.md).

Maintained by [Alex Garrido](https://github.com/mralexgarrido). Google and Google Ads are trademarks of their respective owner; this project does not imply endorsement. No project-level LICENSE file is included; contact the repository owner about reuse.
