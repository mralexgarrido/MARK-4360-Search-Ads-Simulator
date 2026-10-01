import type { Workspace } from '../types.ts';
import { keywordSyntax } from './campaign.ts';
export const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'search-campaign';
export function downloadFile(content: string, fileName: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = fileName; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function keywordsCsv(workspace: Workspace): string {
  const cell = (value: string) => '"' + (/^[=+\-@\t\r\n]/.test(value) ? "'" + value : value).replace(/"/g,'""') + '"';
  const rows = [['Scope','Ad group','Keyword','Match type','Type']];
  workspace.campaign.negativeKeywords.forEach(k => rows.push(['Campaign','',keywordSyntax(k),k.matchType,'Negative']));
  workspace.campaign.adGroups.forEach(g => {
    g.keywords.forEach(k => rows.push(['Ad group',g.name,keywordSyntax(k),k.matchType,'Positive']));
    g.negativeKeywords.forEach(k => rows.push(['Ad group',g.name,keywordSyntax(k),k.matchType,'Negative']));
  });
  return rows.map(row => row.map(cell).join(',')).join('\r\n');
}
