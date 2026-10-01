import { makeId } from '../types.ts';
import type { CampaignData, Keyword, MatchType, SearchAd, TextAsset, Workspace, Step } from '../types.ts';

export const BID_LABELS: Record<CampaignData['biddingStrategy'], string> = {
  maximize_clicks: 'Maximize clicks', manual_cpc: 'Manual CPC', maximize_conversions: 'Maximize conversions',
  target_cpa: 'Target CPA', maximize_conversion_value: 'Maximize conversion value',
  target_roas: 'Target ROAS', target_impression_share: 'Target impression share'
};
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const usesConversions = (c: CampaignData) => ['maximize_conversions', 'target_cpa', 'maximize_conversion_value', 'target_roas'].includes(c.biddingStrategy);
export const usesValue = (c: CampaignData) => ['maximize_conversion_value', 'target_roas'].includes(c.biddingStrategy);
export const isWebUrl = (value: string) => {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !!u.hostname && !u.username && !u.password; }
  catch { return false; }
};
export const adCharacters = (value: string) => Array.from(value).reduce((sum, character) =>
  sum + (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff01-\uff60\uffe0-\uffe6]/u.test(character) ? 2 : 1), 0);
export const keywordSyntax = (k: Keyword) => k.matchType === 'exact' ? '[' + k.text + ']' : k.matchType === 'phrase' ? '"' + k.text + '"' : k.text;
export function parseKeywords(text: string): Keyword[] {
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (lines.length > 200) throw new Error('Import up to 200 keywords at a time.');
  return lines.map(line => {
    let matchType: MatchType = 'broad';
    let value = line;
    const startsExact = line.startsWith('['), endsExact = line.endsWith(']');
    const startsPhrase = /^["“]/.test(line), endsPhrase = /["”]$/.test(line);
    if (startsExact || endsExact) {
      if (!startsExact || !endsExact) throw new Error('Close both brackets in: ' + line);
      matchType = 'exact'; value = line.slice(1, -1).trim();
    } else if (startsPhrase || endsPhrase) {
      if (!startsPhrase || !endsPhrase) throw new Error('Close both quotation marks in: ' + line);
      matchType = 'phrase'; value = line.slice(1, -1).trim();
    }
    if (!value || /[\[\]“”"]/.test(value)) throw new Error('Use one valid keyword per line: ' + line);
    return { id: makeId(), text: value, matchType };
  });
}
export interface Requirement { step: Step; message: string; groupId?: string; adId?: string }
const positive = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
export function requirements(c: CampaignData): Requirement[] {
  const errors: Requirement[] = [];
  const add = (step: Step, message: string, groupId?: string, adId?: string) => errors.push({ step, message, groupId, adId });
  if (!c.campaignName.trim()) add('campaign', 'Enter a campaign name.');
  if (usesConversions(c) && !c.conversionAction.trim()) add('campaign', 'Define the conversion action used by your bidding strategy.');
  if (usesValue(c) && c.conversionValueMode === 'fixed' && !positive(c.conversionValue)) add('campaign', 'Enter a positive conversion value or select transaction-specific values.');
  if (c.biddingStrategy === 'target_cpa' && !positive(c.targetCpa)) add('bidding', 'Enter a positive target CPA.');
  if (c.biddingStrategy === 'target_roas' && !positive(c.targetRoas)) add('bidding', 'Enter a positive target ROAS percentage.');
  if (['maximize_clicks','target_impression_share'].includes(c.biddingStrategy) && c.cpcLimit && !positive(c.cpcLimit)) add('bidding', 'The CPC limit must be a positive amount.');
  if (c.biddingStrategy === 'target_impression_share') {
    if (!positive(c.impressionShare) || Number(c.impressionShare) < 1 || Number(c.impressionShare) > 100) add('bidding', 'Set an impression share target from 1 to 100%.');
    if (!positive(c.cpcLimit)) add('bidding', 'Enter a positive maximum CPC limit for target impression share.');
  }
  if (c.locationOption === 'custom' && !c.locations.length) add('settings', 'Add at least one included location.');
  if (!c.languages.length) add('settings', 'Select at least one language.');
  [c.startDate,c.endDate].filter(Boolean).forEach(date => {
    const parsed = new Date(date + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date)
      add('settings', 'Use a valid calendar date for the campaign start and end.');
  });
  try { new Intl.DateTimeFormat('en-US',{timeZone:c.timeZone}); }
  catch { add('settings', 'Choose a valid account time zone.'); }
  if (c.startDate && c.endDate && c.endDate < c.startDate) add('settings', 'The end date must follow the start date.');
  c.schedules.forEach((s, i) => {
    if (!s.days.length || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.start) || !/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/.test(s.end) || s.end <= s.start)
      add('settings', 'Schedule ' + (i + 1) + ': choose days and an end time after the start time. Split overnight hours into two rows.');
  });
  if (!positive(c.budgetAmount)) add('budget', 'Enter an average daily budget greater than zero.');
  if (!c.adGroups.length) add('groups', 'Create an ad group.');
  const checkKeywords = (items: Keyword[], step: Step, groupId?: string) => items.forEach(k => {
    if (!k.text.trim() || /[\[\]“”"]/.test(k.text) || k.text.trim().split(/\s+/).length > 10 || k.text.length > 80)
      add(step, 'Keywords need 1–10 words, at most 80 characters, and no match-type brackets inside the text.', groupId);
  });
  checkKeywords(c.negativeKeywords, 'groups');
  c.adGroups.forEach((g, gi) => {
    const label = g.name.trim() || 'Ad group ' + (gi + 1);
    if (!g.name.trim()) add('groups', 'Name ' + label + '.', g.id);
    if (!g.keywords.length) add('groups', label + ': add a keyword.', g.id);
    checkKeywords(g.keywords, 'groups', g.id); checkKeywords(g.negativeKeywords, 'groups', g.id);
    if (c.biddingStrategy === 'manual_cpc' && !positive(g.defaultCpc)) add('groups', label + ': enter a positive default CPC bid.', g.id);
    if (!g.ads.length) add('ads', label + ': create a responsive search ad.', g.id);
    g.ads.forEach((ad, ai) => {
      const prefix = label + ' / ' + (ad.name || 'Ad ' + (ai + 1)) + ': ';
      if (!isWebUrl(ad.finalUrl)) add('ads', prefix + 'enter a complete http:// or https:// destination URL without embedded credentials.', g.id, ad.id);
      if (ad.headlines.filter(a => a.text.trim()).length < 3) add('ads', prefix + 'enter at least 3 headlines.', g.id, ad.id);
      if (ad.descriptions.filter(a => a.text.trim()).length < 2) add('ads', prefix + 'enter at least 2 descriptions.', g.id, ad.id);
      if (ad.headlines.some(a => adCharacters(a.text) > 30)) add('ads', prefix + 'headlines may contain at most 30 counted characters.', g.id, ad.id);
      if (ad.descriptions.some(a => adCharacters(a.text) > 90)) add('ads', prefix + 'descriptions may contain at most 90 counted characters.', g.id, ad.id);
      if (adCharacters(ad.displayPath1) > 15 || adCharacters(ad.displayPath2) > 15) add('ads', prefix + 'display paths may contain at most 15 counted characters each.', g.id, ad.id);
    });
  });
  c.sitelinks.forEach((s, i) => {
    if (!s.text.trim() || adCharacters(s.text) > 25 || !isWebUrl(s.url)) add('assets', 'Sitelink ' + (i + 1) + ': add text of 1–25 counted characters and a complete web URL.');
    if (!!s.description1.trim() !== !!s.description2.trim()) add('assets', 'Sitelink ' + (i + 1) + ': enter both description lines or leave both empty.');
    if (adCharacters(s.description1) > 35 || adCharacters(s.description2) > 35) add('assets', 'Sitelink ' + (i + 1) + ': description lines may contain at most 35 counted characters.');
  });
  if (c.callouts.some(s => !s.trim() || adCharacters(s) > 25)) add('assets', 'Enter callout text of 1–25 counted characters or remove the empty row.');
  return errors;
}
export function landingUrl(ad: SearchAd, campaign: CampaignData): string {
  if (!campaign.trackingEnabled || !isWebUrl(ad.finalUrl)) return ad.finalUrl;
  const url = new URL(ad.finalUrl);
  url.searchParams.set('utm_source', campaign.utmSource);
  url.searchParams.set('utm_medium', campaign.utmMedium);
  url.searchParams.set('utm_campaign', campaign.utmCampaign || campaign.campaignName);
  return url.toString();
}
export function previewAssets(assets: TextAsset[], positions: number, index: number): string[] {
  const available = assets.filter(a => a.text.trim());
  const used = new Set<number>();
  const output: string[] = [];
  for (let position = 1; position <= positions; position++) {
    let candidates = available.map((a, i) => ({ a, i })).filter(({a, i}) => !used.has(i) && a.pin === String(position));
    if (!candidates.length) candidates = available.map((a, i) => ({ a, i })).filter(({a, i}) => !used.has(i) && !a.pin);
    if (candidates.length) {
      const selected = candidates[(index + position - 1) % candidates.length];
      used.add(selected.i); output.push(selected.a.text);
    }
  }
  return output;
}
export const recordActivity = (workspace: Workspace, action: string, detail: string): Workspace => ({
  ...workspace, updatedAt: new Date().toISOString(),
  activity: [...workspace.activity, { id: makeId(), at: new Date().toISOString(), action, detail }].slice(-100)
});
export function publishWorkspace(workspace: Workspace): Workspace {
  if (requirements(workspace.campaign).length) throw new Error('Complete the platform requirements before publishing.');
  const campaign = JSON.parse(JSON.stringify(workspace.campaign)) as CampaignData;
  return recordActivity({
    ...workspace, status: 'enabled',
    launches: [...workspace.launches, { id: makeId(), at: new Date().toISOString(), campaign }].slice(-10)
  }, 'Published practice campaign', 'Saved campaign settings and every ad group and ad as a launch snapshot.');
}
export const hasUnpublishedChanges = (w: Workspace) => !!w.launches.length && JSON.stringify(w.campaign) !== JSON.stringify(w.launches[w.launches.length - 1].campaign);
