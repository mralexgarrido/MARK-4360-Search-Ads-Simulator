# Classroom readiness review

Reviewed October 2, 2026, with the instructor remaining the sole grader.

## Live release verified

The earlier assignment-export fixes were merged in commit b2058396f9fc366c63bb2d7a7e2bc7ba5d0af381. GitHub Pages deployment 37079232560 succeeded through the existing fix-deployment-config-17180854313184448867 publishing branch. The live page serves index-xXn9ZxFZ.js and index-JmMAEvq4.css, matching the committed build.

Live browser checks confirmed:

- A comprehensive fictional project imports through the file chooser and confirmation dialog.
- Review includes both ad groups, four responsive ads, targeting, schedules, budget, bidding, and measurement settings, with no missing technical fields.
- Pause and resume update the local campaign status and activity record.
- The current report preview contains all four ads, the final headline and description assets, all five sitelinks, exclusions, and complete student rationale.
- A selected historical launch preserves the original headline while the current report contains its revision.
- The submission screen offers browser printing, a self-contained HTML report, project JSON, keyword CSV, and clear instructions to check files and upload them to the course assignment.

## Supplemental fixes on the review branch

- Guard browser saves against a changed stored copy, and pause autosave after a change from another tab.
- Retry saving immediately before leaving; request the browser's warning if accepted edits remain unsaved.
- Keep JSON export available during save failures or conflicts. Import/reset confirmation deliberately resumes saving.
- Deduplicate additional languages, including English and Spanish entered with different capitalization.
- Identify unpublished working-campaign changes in the assignment report.
- Keep printed configuration labels with their values across page breaks.

No dependencies, hosting settings, lockfiles, assessment scores, synthetic results, or grading tools were added.

## Validation

- All 41 native Node tests pass, including seven bidding paths, empty/invalid campaigns, multiple ads and groups, pinning, legacy migration, failed storage, stale writes, complete report rendering, Unicode CSV, and large JSON round trips retaining all ten launch versions.
- npm run typecheck and npm run build pass. git diff --check passes.
- The final report was rendered to a ten-page PDF with WeasyPrint 70.0 and visually reviewed. The test campaign has four ads, 15 headlines and four descriptions per ad, five sitelinks, multiple match types, campaign/group exclusions, and long multiline rationale. This is print-CSS verification, not a native browser print test.

## Remaining verification limits

The cloud browser blocks the local preview address. Live checks therefore apply to the release identified above; the supplemental storage and language fixes have code checks, but still need browser checks after an approved release.

Clicking live JSON and HTML download buttons produces the expected application notice, but this browser's download-event interface times out and does not expose a completed file. Saved download contents and native Print / Save PDF completion were not verified in this pass. Mobile viewport testing was also unavailable. Do not call these checks complete based only on the notices or unit tests.

## Release and rollback

Supplemental changes remain on fix/student-draft-safeguards until approved. Preserve the existing GitHub Pages publishing method. After approval, merge the source, advance the existing publishing branch without force, verify the new serving bundle, and repeat the browser checks above plus two-tab/save-failure checks. The rollback point is b2058396f9fc366c63bb2d7a7e2bc7ba5d0af381 and its successful Pages deployment.
