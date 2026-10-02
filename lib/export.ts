import type { Workspace } from '../types.ts';
import { keywordSyntax } from './campaign.ts';
export const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'search-campaign';
export function downloadFile(content: string, fileName: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = fileName;
  try {
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Leave time for slower browsers and large project files to consume the blob.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
export function keywordsCsv(workspace: Workspace): string {
  const cell = (value: string) => '"' + (/^(?:[\t\r\n]|[\s\uFEFF]*[=+\-@])/.test(value) ? "'" + value : value).replace(/"/g,'""') + '"';
  const rows = [['Scope','Ad group','Keyword','Match type','Type']];
  workspace.campaign.negativeKeywords.forEach(k => rows.push(['Campaign','',keywordSyntax(k),k.matchType,'Negative']));
  workspace.campaign.adGroups.forEach(g => {
    g.keywords.forEach(k => rows.push(['Ad group',g.name,keywordSyntax(k),k.matchType,'Positive']));
    g.negativeKeywords.forEach(k => rows.push(['Ad group',g.name,keywordSyntax(k),k.matchType,'Negative']));
  });
  // The UTF-8 BOM keeps Spanish names and international keywords readable in Excel.
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}

/** Shared by the on-screen preview and the self-contained downloadable report. */
export const REPORT_STYLES = `
.submission-report{font:15px/1.55 Arial,Helvetica,sans-serif;color:#202124;background:#fff;overflow-wrap:anywhere}
.submission-report h1,.submission-report h2,.submission-report h3,.submission-report h4{line-height:1.35}
.submission-report h1{font-size:30px;color:#174ea6;margin:4px 0 8px}
.submission-report h2{font-size:21px;color:#174ea6;border-bottom:1px solid #b8c2cf;padding-bottom:6px;margin:30px 0 14px}
.submission-report h3{font-size:17px;margin:20px 0 9px}.submission-report h4{font-size:15px;margin:14px 0 6px}
.submission-report p{margin:9px 0}.submission-report li{margin:6px 0}.submission-report ul,.submission-report ol{padding-left:24px}
.submission-report .report-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:2px solid #174ea6;padding-bottom:16px;margin-bottom:18px}
.submission-report .report-heading p{font-size:13px}.submission-report .eyebrow{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5f6368}
.submission-report .report-notice{border:1px solid #b9c8df;background:#f5f8fc;padding:12px;font-size:13px}
.submission-report .facts{margin:0;font-size:14px}.submission-report .facts>div{display:grid;grid-template-columns:180px minmax(0,1fr);gap:18px;padding:9px 0;border-bottom:1px solid #e1e5ea}
.submission-report .facts dt{color:#5f6368}.submission-report .facts dd{margin:0;white-space:pre-wrap}
.submission-report .report-table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0;table-layout:fixed}
.submission-report .report-table th,.submission-report .report-table td{border:1px solid #c4cbd5;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
.submission-report .report-table th{background:#f1f4f8}.submission-report .report-table thead{display:table-header-group}
.submission-report .report-asset-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.submission-report .report-ad{border-bottom:1px solid #cad0da;padding-bottom:18px;margin-bottom:16px}
.submission-report .report-ad-preview{max-width:500px;margin:20px auto}.submission-report .search-preview{background:#fff;border:1px solid #bbc4ce;border-radius:8px;overflow:hidden;max-width:100%}
.submission-report .search-ad-content{padding:18px;overflow-wrap:anywhere}.submission-report .sponsored{font-size:12px;font-weight:bold;margin-bottom:12px}
.submission-report .search-domain{display:flex;align-items:center;gap:9px;margin-bottom:12px;font-size:12px;line-height:1.4}.submission-report .search-domain strong{font-size:14px}
.submission-report .globe-circle{display:flex;padding:6px;background:#f1f3f4;border-radius:50%;flex-shrink:0}
.submission-report .search-headline{font-size:20px;color:#1a0dab;margin:8px 0;line-height:1.35}.submission-report .search-description{font-size:14px;color:#4d5156}
.submission-report .search-callouts{font-size:13px;margin:10px 0}.submission-report .search-sitelinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
.submission-report .search-sitelinks span{font-size:16px;color:#1a0dab}.submission-report .search-sitelinks small{display:block;font-size:12px;margin-top:5px}
.submission-report .report-sitelink{border-bottom:1px solid #d9dfe7;padding:7px 0}.submission-report .field-hint{font-size:12px;color:#5f6368}
.submission-report .break-word{overflow-wrap:anywhere}.submission-report .preserve-lines{white-space:pre-wrap;overflow-wrap:anywhere}
@media(max-width:600px){.submission-report .report-heading{display:block}.submission-report .facts>div{grid-template-columns:1fr;gap:3px}.submission-report .report-asset-columns{display:block}.submission-report h1{font-size:25px}}
@media print{
 @page{size:auto;margin:15mm;@bottom-right{content:"Page " counter(page) " of " counter(pages);font:8pt Arial,Helvetica,sans-serif;color:#5f6368}}
 .submission-report{font-size:10pt;line-height:1.45}
 .submission-report .report-heading h1{font-size:22pt}.submission-report h2{font-size:13pt}.submission-report h3{font-size:11pt}.submission-report h4{font-size:10pt}
 .submission-report h2,.submission-report h3,.submission-report h4{break-after:avoid}
 .submission-report p{orphans:3;widows:3}.submission-report .report-heading,.submission-report .report-ad-preview,.submission-report .report-sitelink{break-inside:avoid}
 .submission-report .report-asset-columns{display:block}.submission-report .facts{font-size:9pt}.submission-report .facts>div{display:block;padding:6px 0;break-inside:auto}.submission-report .facts dt{font-weight:bold}.submission-report .facts dd{margin-top:2px}
 .submission-report .report-table{font-size:9pt}.submission-report .report-table tr{break-inside:auto}.submission-report .field-hint{font-size:8pt}
}
`;

/** markup must be rendered PrintView HTML, where React escapes student-entered text. */
export function reportHtml(markup: string, title: string): string {
  const escapedTitle = title.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<title>${escapedTitle} | Search campaign submission</title><style>
html{background:#edf1f6}body{margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#202124}
.assignment-toolbar{max-width:960px;margin:0 auto 18px;display:flex;gap:18px;align-items:center;justify-content:space-between}
.assignment-toolbar p{font-size:13px;margin:0}.assignment-toolbar button{background:#0b57d0;color:#fff;border:0;border-radius:5px;padding:12px 16px;font-size:14px;cursor:pointer;white-space:nowrap}
.assignment-toolbar button:focus-visible{outline:3px solid #202124;outline-offset:3px}
.offline-report{max-width:960px;margin:auto;background:#fff;padding:32px;border:1px solid #d9dfe8;border-radius:8px}
.offline-report .print-only{display:block!important}
@media(max-width:600px){body{padding:12px}.offline-report{padding:18px}.assignment-toolbar{align-items:flex-start;flex-direction:column}}
@media print{html,body{background:#fff;padding:0}.assignment-toolbar{display:none}.offline-report{padding:0;border:0;border-radius:0;max-width:none}}
${REPORT_STYLES}</style></head><body>
<div class="assignment-toolbar"><p>This complete assignment report opens without an internet connection. Submit this file or use your browser to save it as a PDF.</p><button type="button" id="print-report">Print / Save PDF</button></div>
<main class="offline-report">${markup}</main>
<script>document.getElementById('print-report').addEventListener('click', function () { window.print(); });</script>
</body></html>`;
}
