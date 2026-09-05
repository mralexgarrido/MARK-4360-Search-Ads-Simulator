# Search Ads Simulator

Practice the decisions behind a search advertising campaign before working in a production advertising account.

Built for MARK 4360 and other marketing learning environments, this browser-based simulator guides students through bidding, campaign settings, keywords, ad copy, budget, and a final review. The emphasis is on explaining a campaign strategy, not simply completing a form.

**[Open the simulator](https://mralexgarrido.github.io/MARK-4360-Search-Ads-Simulator/)** · [Report an issue](https://github.com/mralexgarrido/MARK-4360-Search-Ads-Simulator/issues) · [Maintainer guide](MAINTAINING.md)

## What you can do

- Plan bidding, locations, audience segments, keywords, and budget in a guided campaign workspace.
- Draft headlines and descriptions, review an ad preview, and use completion indicators to identify unfinished steps.
- Save a draft in the current browser and print the campaign review using the browser's print or Save as PDF option.

This is an independent educational simulation, not Google Ads or a connection to an advertising account. Entered budgets do not buy media. The ad-strength indicator is a local completeness calculation, not Google's scoring system or a performance forecast.

## Start a practice campaign

1. Choose a fictional business, a customer need, and a campaign objective.
2. Work through **Bidding**, **Campaign settings**, **Keywords**, **Ads**, and **Budget** in the sidebar. Explain how each choice supports the objective.
3. Open **Review**, complete the requested student information, and check the campaign before printing.
4. Select **Save** before closing the page. Use **Print PDF** to open the browser's print dialog, or **Start Over** to clear the saved campaign and begin again.

Saving is manual. A saved draft belongs to this browser and site, not a user account; clearing site data removes it, and it does not sync between devices. Use fictional or non-sensitive information, particularly on shared classroom computers.

### For instructors

Ask students to submit their printed campaign plan with a short explanation of keyword intent, audience fit, copy choices, and budget tradeoffs. A useful peer-review exercise is to have a partner identify one mismatch between the customer's search intent and the proposed landing page or ad. These are suggested activities, not a built-in grading rubric.

## Run locally

Use Node.js 22.14 or newer within the Node.js 22 release line and npm. From a local checkout:

```sh
git clone https://github.com/mralexgarrido/MARK-4360-Search-Ads-Simulator.git
cd MARK-4360-Search-Ads-Simulator
npm ci
npm run dev
```

Open the address printed by Vite. The development server is configured for port 3000 and the `/MARK-4360-Search-Ads-Simulator/` base path.

```sh
npm run build
npm run preview
```

The build output is **`docs/`**, not `dist/`. It is generated site content, so do not place hand-maintained documentation there. The repository includes both npm and pnpm lockfiles; the commands above use the existing npm lockfile without removing or regenerating either lockfile.

The campaign-planning interface does not require an AI-service account. Historical environment-variable substitutions remain in `vite.config.ts`; do not add privileged API keys to browser code or public build artifacts. This documentation does not change that configuration.

## Project structure

| Path | Purpose |
| --- | --- |
| `App.tsx` | Campaign steps, form state, save/reset behavior, and completion indicators |
| `components/` | Shared icons, ad preview, and printable campaign view |
| `types.ts` | Campaign data types and initial values |
| `vite.config.ts` | Development server, application base path, and output directory |
| `docs/` | Generated static website |

The interface uses React, TypeScript, and Vite. See [package.json](package.json) for the actual scripts and dependencies. No automated test script is currently declared there; a successful build alone is not an end-to-end test.

## Related teaching tool

[`mark4360_gsearch`](https://github.com/mralexgarrido/mark4360_gsearch) is a separate search-advertising simulator repository. Its source, build settings, and saved work are independent. Do not assume fixes or data transfer between the two projects, or that one is an officially retired version of the other.

## Support and contributions

For bugs, include the step, expected result, actual result, browser, and a small fictional example in an [issue](https://github.com/mralexgarrido/MARK-4360-Search-Ads-Simulator/issues). Remove student information, credentials, and real campaign data from screenshots. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Maintained by [Alex Garrido](https://github.com/mralexgarrido). Google and Google Ads are trademarks of their respective owner; this project does not imply endorsement. No project-level `LICENSE` file is currently included; contact the repository owner about reuse.
