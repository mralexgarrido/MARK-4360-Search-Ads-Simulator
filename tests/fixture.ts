import { createWorkspace, newAd, newGroup } from '../types.ts';
import { parseKeywords, publishWorkspace } from '../lib/campaign.ts';

/** Fictional, comprehensive campaign for export/import and browser acceptance checks. */
export function assignmentFixture() {
  const w = createWorkspace();
  const c = w.campaign;
  c.campaignName = 'Class acceptance. Bilingual tutoring';
  c.businessName = 'Fictional Rio Grande Valley Tutors';
  c.studentName = 'Acceptance Test Student';
  c.courseSection = 'MARK 4360. Acceptance';
  c.businessBrief = 'Fictional bilingual tutoring business.\nOffer: a consultation before booking a session.';
  c.objective = 'leads'; c.biddingStrategy = 'target_cpa'; c.targetCpa = '18';
  c.targetRoas = '350'; c.cpcLimit = '3.50'; c.impressionShare = '85'; c.impressionPlacement = 'absolute_top';
  c.conversionAction = 'Confirmed tutoring consultation';
  c.conversionValueMode = 'fixed'; c.conversionValue = '75';
  c.measurementPlan = 'Document the confirmed-booking event.\nVerify the event before buying actual advertising.';
  c.networkSearchPartners = false;
  c.locationOption = 'custom'; c.locations = ['McAllen, Texas','Edinburg, Texas'];
  c.excludedLocations = ['Outside the fictional service area']; c.locationPresence = 'presence';
  c.languages = ['English','Spanish']; c.audienceSegments = ['Education','Tutoring Services']; c.audienceMode = 'observation';
  c.startDate = '2026-10-05'; c.endDate = '2026-11-05'; c.timeZone = 'America/Chicago';
  c.schedules = [{id:'acceptance-hours',days:['Mon','Wed','Fri'],start:'08:00',end:'20:00'}];
  c.negativeKeywords = parseKeywords('free\n"tutoring jobs"\n[answer key]');
  c.adGroups = [newGroup('SAT preparation'),newGroup('Tutoría bilingüe')];
  c.adGroups.forEach((g,gi) => {
    g.intentNote = 'Documented search intent for group ' + (gi + 1) + '\nA second line explains the offer.'; g.defaultCpc = gi ? '2.20' : '1.90';
    g.keywords = parseKeywords(gi ? 'tutoría\n"tutoría en español"\n[tutor McAllen]' : 'SAT tutoring\n"SAT preparation"\n[SAT tutor Edinburg]');
    g.negativeKeywords = parseKeywords('career\n"online jobs"\n[free worksheet]');
    g.ads = [newAd('Consultation message'),newAd('Tutoring services message')];
    g.ads.forEach((ad,ai) => {
      ad.finalUrl = 'https://example.com/tutoring/group-' + gi + '/ad-' + ai + '?offer=fall#book';
      ad.displayPath1 = gi ? 'español' : 'SAT'; ad.displayPath2 = 'consultation';
      ad.headlines = Array.from({length:15},(_,i) => ({text:`G${gi + 1} Ad${ai + 1} Headline ${i + 1}`,pin:i < 3 ? String(i + 1) as '1'|'2'|'3' : '' as const}));
      ad.descriptions = Array.from({length:4},(_,i) => ({text:`Group ${gi + 1} Ad ${ai + 1} Description ${i + 1}. Explore fictional tutoring options.`,pin:i < 2 ? String(i + 1) as '1'|'2' : '' as const}));
    });
  });
  c.sitelinks = [0,1,2,3,4].map(i => ({id:'acceptance-link-' + i,text:'Tutoring resource ' + (i + 1),url:'https://example.com/resource-' + i,description1:'Explore tutoring details',description2:'Choose a consultation time'}));
  c.callouts = ['Bilingual Support','Local Tutors','Flexible Sessions'];
  c.budgetAmount = '25'; c.trackingEnabled = true;
  c.utmSource = 'google'; c.utmMedium = 'cpc'; c.utmCampaign = 'fall-tutoring-acceptance';
  c.rationale = {
    audience:'I selected students seeking tutoring within the fictional service area.\nObservation keeps the audience optional.',
    keywords:'I separated SAT preparation and Spanish-language intentions and documented the exclusions.',
    creative:'I included every headline, description, pin, sitelink, and callout for instructor review.\n' + 'This paragraph is a student explanation that must remain intact in the exported report. '.repeat(32),
    budget:'The daily budget and target CPA are documented assumptions for instructor review.'
  };
  const launched = publishWorkspace(w);
  launched.campaign.adGroups[0].ads[0].headlines[14].text = 'Revised G1 final headline';
  return publishWorkspace(launched);
}
