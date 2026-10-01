import { createWorkspace, makeId, newAd, newGroup } from '../types.ts';
import type { Workspace, CampaignData } from '../types.ts';
import { parseKeywords } from './campaign.ts';

export const STORAGE_KEY = 'mark4360_search_ads_workspace_v2';
export const LEGACY_KEY = 'mark4360_draft';
export const MAX_FILE_BYTES = 32 * 1024 * 1024;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const string = (value: unknown, limit = 10000) => typeof value === 'string' && value.length <= limit;
const strings = (value: unknown, max = 200): value is string[] => Array.isArray(value) && value.length <= max && value.every(v => string(v, 500));
const oneOf = (value: unknown, values: unknown[]) => values.includes(value);
const idsUnique = (items: { id: string }[]) => new Set(items.map(i => i.id)).size === items.length;
const keywordArray = (value: unknown) => Array.isArray(value) && value.length <= 200 && value.every(k =>
  object(k) && string(k.id, 100) && string(k.text, 500) && oneOf(k.matchType, ['broad', 'phrase', 'exact'])) && idsUnique(value);
const textAssets = (value: unknown, max: number, pins: string[]) => Array.isArray(value) && value.length <= max &&
  value.every(a => object(a) && string(a.text, 500) && oneOf(a.pin, pins));
function campaignShape(value: unknown): value is CampaignData {
  if (!object(value)) return false;
  const c = value;
  const fields = ['id','campaignName','businessName','businessBrief','studentName','courseSection','targetCpa','targetRoas',
    'cpcLimit','impressionShare','conversionAction','conversionValue','measurementPlan','startDate','endDate','timeZone','budgetAmount',
    'utmSource','utmMedium','utmCampaign'];
  if (!fields.every(key => string(c[key]))) return false;
  if (!oneOf(c.objective, ['leads','sales','traffic','no_guidance']) ||
      !oneOf(c.biddingStrategy, ['maximize_clicks','manual_cpc','maximize_conversions','target_cpa','maximize_conversion_value','target_roas','target_impression_share']) ||
      !oneOf(c.conversionValueMode, ['fixed','dynamic']) || !oneOf(c.impressionPlacement, ['anywhere','top','absolute_top']) ||
      !oneOf(c.locationOption, ['all','us_ca','us','custom']) || !oneOf(c.locationPresence, ['presence','presence_interest']) ||
      !oneOf(c.audienceMode, ['observation','targeting'])) return false;
  if (typeof c.networkSearchPartners !== 'boolean' || typeof c.trackingEnabled !== 'boolean') return false;
  if (!['locations','excludedLocations','languages','audienceSegments','callouts','importNotes'].every(k => strings(c[k]))) return false;
  if (!keywordArray(c.negativeKeywords)) return false;
  if (!object(c.rationale) || !['audience','keywords','creative','budget'].every(k => string((c.rationale as Record<string,unknown>)[k]))) return false;
  if (!Array.isArray(c.schedules) || c.schedules.length > 30 || !c.schedules.every(s => object(s) && string(s.id,100) &&
      strings(s.days,7) && s.days.every(d => oneOf(d,['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])) && string(s.start,5) && string(s.end,5)) || !idsUnique(c.schedules)) return false;
  if (!Array.isArray(c.sitelinks) || c.sitelinks.length > 20 || !c.sitelinks.every(s => object(s) &&
      ['id','text','url','description1','description2'].every(k => string(s[k],2000))) || !idsUnique(c.sitelinks)) return false;
  if (!Array.isArray(c.adGroups) || c.adGroups.length < 1 || c.adGroups.length > 20 || !idsUnique(c.adGroups)) return false;
  return c.adGroups.every(g => object(g) && ['id','name','intentNote','defaultCpc'].every(k => string(g[k])) &&
    keywordArray(g.keywords) && keywordArray(g.negativeKeywords) &&
    Array.isArray(g.ads) && g.ads.length > 0 && g.ads.length <= 10 && idsUnique(g.ads) && g.ads.every(a =>
      object(a) && ['id','name','finalUrl','displayPath1','displayPath2'].every(k => string(a[k],2000)) &&
      textAssets(a.headlines,15,['','1','2','3']) && textAssets(a.descriptions,4,['','1','2'])));
}
export function validateWorkspace(input: unknown): Workspace {
  if (!object(input) || input.schemaVersion !== 2 || !campaignShape(input.campaign) ||
      !oneOf(input.status,['draft','enabled','paused']) || !string(input.updatedAt,100) ||
      !Array.isArray(input.activity) || input.activity.length > 100 ||
      !input.activity.every(a => object(a) && ['id','at','action','detail'].every(k => string(a[k]))) || !idsUnique(input.activity) ||
      !Array.isArray(input.launches) || input.launches.length > 10 ||
      !input.launches.every(s => object(s) && string(s.id,100) && string(s.at,100) && campaignShape(s.campaign)) || !idsUnique(input.launches) ||
      (input.status !== 'draft' && input.launches.length === 0)) {
    throw new Error('This file does not contain a supported Search Ads workspace. Export a project JSON from this simulator.');
  }
  return JSON.parse(JSON.stringify(input)) as Workspace;
}
export function decodeProject(text: string): Workspace {
  if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error('Choose a project JSON smaller than 32 MB.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error('This is not valid JSON. Choose an exported project file.'); }
  if (object(input) && input.format === 'mark4360-search-ads') {
    if (input.schemaVersion !== 2) throw new Error('This project version is not supported by this workspace.');
    return validateWorkspace(input.workspace);
  }
  if (object(input) && input.schemaVersion === 2) return validateWorkspace(input);
  return migrateLegacy(input);
}
export function migrateLegacy(input: unknown): Workspace {
  if (!object(input) || !strings(input.headlines,15) || !strings(input.descriptions,4) ||
      !string(input.biddingFocus) || !oneOf(input.biddingFocus,['conversions','conversion_value','clicks','impression_share']) ||
      !string(input.rawKeywords) || !string(input.budgetAmount)) throw new Error('The file is not a supported campaign draft.');
  const workspace = createWorkspace();
  const c = workspace.campaign;
  const copy = (from: string, to: keyof CampaignData) => { if (string(input[from])) (c as unknown as Record<string, unknown>)[to] = input[from]; };
  ['campaignName','studentName','budgetAmount'].forEach(k => copy(k,k as keyof CampaignData));
  copy('strategyDescription','businessBrief'); copy('targetCpaAmount','targetCpa');
  c.rationale.budget = typeof input.strategyDescription === 'string' ? input.strategyDescription : '';
  c.biddingStrategy = input.biddingFocus === 'clicks' ? 'maximize_clicks' :
    input.biddingFocus === 'conversion_value' ? 'maximize_conversion_value' :
    input.biddingFocus === 'impression_share' ? 'target_impression_share' :
    input.setTargetCpa ? 'target_cpa' : 'maximize_conversions';
  if (typeof input.networkSearchPartners === 'boolean') c.networkSearchPartners = input.networkSearchPartners;
  if (oneOf(input.locationOption,['all','us_ca','us','custom'])) c.locationOption = input.locationOption as CampaignData['locationOption'];
  if (strings(input.customLocations)) c.locations = input.customLocations;
  if (strings(input.languages)) c.languages = input.languages;
  if (strings(input.audienceSegments)) c.audienceSegments = input.audienceSegments;
  if (oneOf(input.audienceTargetingSetting,['observation','targeting'])) c.audienceMode = input.audienceTargetingSetting as CampaignData['audienceMode'];
  const group = newGroup('Imported ad group');
  try { group.keywords = parseKeywords(input.rawKeywords as string); }
  catch {
    const lines = (input.rawKeywords as string).split(/\r?\n/).filter(Boolean).slice(0,200);
    group.keywords = lines.map(text => ({ id: makeId(), text, matchType: 'broad' as const }));
    c.importNotes.push('Some keyword syntax needs review. The original keyword text was preserved.');
  }
  const ad = newAd('Imported responsive search ad');
  ['finalUrl','displayPath1','displayPath2'].forEach(k => { if (string(input[k])) (ad as unknown as Record<string,unknown>)[k] = input[k]; });
  ad.headlines = (input.headlines as string[]).map(text => ({ text, pin: '' }));
  ad.descriptions = (input.descriptions as string[]).map(text => ({ text, pin: '' }));
  group.ads = [ad]; c.adGroups = [group];
  c.importNotes.push('Imported from the original simulator. Review the conversion action, bidding, and new settings before publishing.');
  if (input.networkDisplay === true) c.importNotes.push('The original draft included Display Network. This workspace is limited to Search; that setting is recorded here for your review.');
  return validateWorkspace(workspace);
}
export function loadWorkspace(storage: Pick<Storage,'getItem'>): { workspace: Workspace; note: string } {
  const current = storage.getItem(STORAGE_KEY);
  if (current) return { workspace: validateWorkspace(JSON.parse(current)), note: 'Restored your saved workspace.' };
  const legacy = storage.getItem(LEGACY_KEY);
  if (legacy) {
    try { return { workspace: migrateLegacy(JSON.parse(legacy)), note: 'Imported your earlier draft. Its original browser copy was kept.' }; }
    catch { return { workspace: createWorkspace(), note: 'An earlier browser entry could not be imported. Its original copy was kept.' }; }
  }
  return { workspace: createWorkspace(), note: '' };
}
export const saveWorkspace = (storage: Pick<Storage,'setItem'>, workspace: Workspace) => storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
export const projectJson = (workspace: Workspace) => JSON.stringify({ format: 'mark4360-search-ads', schemaVersion: 2, exportedAt: new Date().toISOString(), workspace }, null, 2);
