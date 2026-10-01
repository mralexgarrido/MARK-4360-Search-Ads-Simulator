export type Step = 'campaign' | 'bidding' | 'settings' | 'groups' | 'ads' | 'assets' | 'budget' | 'review' | 'submission';
export type MatchType = 'broad' | 'phrase' | 'exact';
export type BidStrategy = 'maximize_clicks' | 'manual_cpc' | 'maximize_conversions' | 'target_cpa' | 'maximize_conversion_value' | 'target_roas' | 'target_impression_share';
export interface Keyword { id: string; text: string; matchType: MatchType }
export interface TextAsset { text: string; pin: '' | '1' | '2' | '3' }
export interface SearchAd {
  id: string; name: string; finalUrl: string; displayPath1: string; displayPath2: string;
  headlines: TextAsset[]; descriptions: TextAsset[];
}
export interface AdGroup {
  id: string; name: string; intentNote: string; defaultCpc: string;
  keywords: Keyword[]; negativeKeywords: Keyword[]; ads: SearchAd[];
}
export interface Sitelink { id: string; text: string; url: string; description1: string; description2: string }
export interface Schedule { id: string; days: string[]; start: string; end: string }
export interface CampaignData {
  id: string; campaignName: string; businessName: string;
  objective: 'leads' | 'sales' | 'traffic' | 'no_guidance';
  businessBrief: string; studentName: string; courseSection: string;
  biddingStrategy: BidStrategy; targetCpa: string; targetRoas: string;
  cpcLimit: string; impressionShare: string; impressionPlacement: 'anywhere' | 'top' | 'absolute_top';
  conversionAction: string; conversionValueMode: 'fixed' | 'dynamic'; conversionValue: string;
  measurementPlan: string; networkSearchPartners: boolean;
  locationOption: 'all' | 'us_ca' | 'us' | 'custom'; locations: string[]; excludedLocations: string[];
  locationPresence: 'presence' | 'presence_interest'; languages: string[];
  audienceSegments: string[]; audienceMode: 'observation' | 'targeting';
  startDate: string; endDate: string; timeZone: string; schedules: Schedule[];
  negativeKeywords: Keyword[]; adGroups: AdGroup[]; sitelinks: Sitelink[]; callouts: string[];
  budgetAmount: string; trackingEnabled: boolean; utmSource: string; utmMedium: string; utmCampaign: string;
  rationale: { audience: string; keywords: string; creative: string; budget: string };
  importNotes: string[];
}
export interface Activity { id: string; at: string; action: string; detail: string }
export interface LaunchSnapshot { id: string; at: string; campaign: CampaignData }
export interface Workspace {
  schemaVersion: 2; campaign: CampaignData; status: 'draft' | 'enabled' | 'paused';
  activity: Activity[]; launches: LaunchSnapshot[]; updatedAt: string;
}
export const makeId = () => globalThis.crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
export const blankAsset = (): TextAsset => ({ text: '', pin: '' });
export const newAd = (name = 'Responsive search ad 1'): SearchAd => ({
  id: makeId(), name, finalUrl: '', displayPath1: '', displayPath2: '',
  headlines: Array.from({ length: 3 }, blankAsset), descriptions: Array.from({ length: 2 }, blankAsset)
});
export const newGroup = (name = 'Ad group 1'): AdGroup => ({
  id: makeId(), name, intentNote: '', defaultCpc: '', keywords: [], negativeKeywords: [], ads: [newAd()]
});
export const createWorkspace = (): Workspace => ({
  schemaVersion: 2, status: 'draft', activity: [], launches: [], updatedAt: new Date().toISOString(),
  campaign: {
    id: makeId(), campaignName: '', businessName: '', objective: 'leads', businessBrief: '', studentName: '', courseSection: 'MARK 4360',
    biddingStrategy: 'maximize_conversions', targetCpa: '', targetRoas: '', cpcLimit: '',
    impressionShare: '80', impressionPlacement: 'top', conversionAction: '', conversionValueMode: 'fixed',
    conversionValue: '', measurementPlan: '', networkSearchPartners: true,
    locationOption: 'us', locations: [], excludedLocations: [], locationPresence: 'presence_interest', languages: ['English'],
    audienceSegments: [], audienceMode: 'observation', startDate: '', endDate: '', timeZone: 'America/Chicago', schedules: [],
    negativeKeywords: [], adGroups: [newGroup()], sitelinks: [], callouts: [], budgetAmount: '',
    trackingEnabled: false, utmSource: 'google', utmMedium: 'cpc', utmCampaign: '',
    rationale: { audience: '', keywords: '', creative: '', budget: '' }, importNotes: []
  }
});
