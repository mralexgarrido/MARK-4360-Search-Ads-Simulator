import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspace, newGroup } from '../types.ts';
import { adCharacters, hasUnpublishedChanges, isWebUrl, landingUrl, parseKeywords, previewAssets, publishWorkspace, recordActivity, requirements } from '../lib/campaign.ts';
import { decodeProject, LEGACY_KEY, loadWorkspace, projectJson, saveWorkspace, STORAGE_KEY, validateWorkspace } from '../lib/storage.ts';
import { keywordsCsv } from '../lib/export.ts';

function completeWorkspace() {
  const w = createWorkspace();
  const c = w.campaign;
  c.campaignName = 'Campus tutoring Search';
  c.conversionAction = 'Booking completed';
  c.budgetAmount = '20';
  c.adGroups[0].keywords = parseKeywords('tutoring\n"SAT tutoring"\n[SAT tutor McAllen]');
  const ad = c.adGroups[0].ads[0];
  ad.finalUrl = 'https://example.com/tutoring?offer=fall#booking';
  ad.headlines = ['Local Tutoring','Book Your Session','SAT Preparation'].map(text => ({text,pin:'' as const}));
  ad.descriptions = ['Explore tutoring options and book a session.','Learn about our SAT preparation services.'].map(text => ({text,pin:'' as const}));
  return w;
}

test('empty drafts and invalid budgets cannot publish', () => {
  const w = createWorkspace();
  assert.ok(requirements(w.campaign).some(e => e.step === 'campaign'));
  assert.ok(requirements(w.campaign).some(e => e.step === 'ads'));
  assert.throws(() => publishWorkspace(w), /requirements/);
  const complete = completeWorkspace();
  for (const budget of ['', '0', '-10', 'Infinity', 'not a number']) {
    complete.campaign.budgetAmount = budget;
    assert.ok(requirements(complete.campaign).some(e => e.step === 'budget'));
  }
});

test('technical checks do not grade duplicated copy, strategy, or student explanations', () => {
  const w = completeWorkspace();
  w.campaign.adGroups[0].ads[0].headlines.forEach(a => { a.text = 'Identical headline'; });
  w.campaign.rationale = {audience:'',keywords:'',creative:'',budget:''};
  assert.deepEqual(requirements(w.campaign), []);
  const published = publishWorkspace(w);
  assert.equal(published.status,'enabled');
  assert.equal('grade' in published,false);
  assert.equal('score' in published,false);
});

test('every group and every ad must meet the structural requirements', () => {
  const w = completeWorkspace();
  const second = newGroup('A different customer intention');
  w.campaign.adGroups.push(second);
  assert.ok(requirements(w.campaign).some(e => e.groupId === second.id && e.step === 'groups'));
  assert.ok(requirements(w.campaign).some(e => e.adId === second.ads[0].id));
  assert.throws(() => publishWorkspace(w));
});

test('bid-specific requirements ignore values belonging to inactive strategies', () => {
  const w = completeWorkspace();
  w.campaign.cpcLimit = '-3';
  assert.deepEqual(requirements(w.campaign),[]);
  w.campaign.biddingStrategy = 'maximize_clicks';
  assert.ok(requirements(w.campaign).some(e => e.step === 'bidding'));
  w.campaign.cpcLimit = '';
  w.campaign.conversionAction = '';
  assert.deepEqual(requirements(w.campaign),[]);
  w.campaign.biddingStrategy = 'target_cpa';
  assert.ok(requirements(w.campaign).some(e => e.step === 'campaign'));
  assert.ok(requirements(w.campaign).some(e => e.step === 'bidding'));
  w.campaign.biddingStrategy = 'manual_cpc';
  assert.ok(requirements(w.campaign).some(e => e.step === 'groups'));
});

test('keyword imports preserve explicit match types and reject partial syntax', () => {
  assert.deepEqual(parseKeywords(' tutoring \n“SAT prep”\n[local tutor]').map(k => [k.text,k.matchType]),
    [['tutoring','broad'],['SAT prep','phrase'],['local tutor','exact']]);
  for (const text of ['valid\n[unclosed','"unclosed','[nested[term]]','""'])
    assert.throws(() => parseKeywords(text));
});

test('publication snapshots remain intact when the working campaign changes', () => {
  const w = completeWorkspace();
  const published = publishWorkspace(w);
  assert.equal(w.launches.length,0);
  assert.equal(hasUnpublishedChanges(published),false);
  published.campaign.adGroups[0].ads[0].headlines[0].text = 'Changed headline';
  published.campaign.budgetAmount = '30';
  assert.equal(published.launches[0].campaign.budgetAmount,'20');
  assert.equal(published.launches[0].campaign.adGroups[0].ads[0].headlines[0].text,'Local Tutoring');
  assert.equal(hasUnpublishedChanges(published),true);
  assert.equal(publishWorkspace(published).launches.length,2);
});

test('project export and import preserve campaign, notes, pins, negatives, and snapshots', () => {
  const w = completeWorkspace();
  w.campaign.studentName = 'Practice Student';
  w.campaign.languages = ['English','Spanish'];
  w.campaign.locationOption = 'custom';
  w.campaign.locations = ['McAllen, TX'];
  w.campaign.excludedLocations = ['Outside service radius'];
  w.campaign.negativeKeywords = parseKeywords('"free tutoring"');
  w.campaign.adGroups[0].ads[0].headlines[0].pin = '1';
  w.campaign.rationale.creative = 'Student-written explanation\nWith another line.';
  w.campaign.sitelinks = [{id:'sit-1',text:'Book a Session',url:'https://example.com/book',description1:'',description2:''}];
  w.campaign.schedules = [{id:'sch-1',days:['Mon','Wed'],start:'09:00',end:'17:00'}];
  const published = publishWorkspace(w);
  assert.deepEqual(decodeProject(projectJson(published)),published);
});

test('malformed, unsupported, duplicate-ID and incomplete imports are rejected', () => {
  assert.throws(() => decodeProject('{not-json'), /valid JSON/);
  assert.throws(() => decodeProject('{"schemaVersion":3}'));
  assert.throws(() => decodeProject(JSON.stringify({format:'mark4360-search-ads',schemaVersion:3,workspace:createWorkspace()})), /version/);
  const w = completeWorkspace();
  (w.campaign.adGroups[0].ads[0].headlines as unknown[]) = [null];
  assert.throws(() => validateWorkspace(w));
  const duplicate = completeWorkspace();
  duplicate.campaign.adGroups.push(duplicate.campaign.adGroups[0]);
  assert.throws(() => validateWorkspace(duplicate));
  const enabled = createWorkspace(); enabled.status = 'enabled';
  assert.throws(() => validateWorkspace(enabled));
});

test('legacy drafts retain their original assets, bidding and explanatory text', () => {
  const original = {
    campaignName:'Old campaign',studentName:'Practice Student',budgetAmount:'-10',
    biddingFocus:'conversions',setTargetCpa:true,targetCpaAmount:'15',
    rawKeywords:'"SAT tutoring"\n[local tutor]',headlines:['One','Two','Three'],
    descriptions:['First description','Second description'],finalUrl:'https://example.com',
    displayPath1:'SAT',displayPath2:'local',strategyDescription:'Original explanation',
    networkSearchPartners:false,networkDisplay:true,locationOption:'custom',customLocations:['McAllen'],
    languages:['Spanish'],audienceSegments:['Education'],audienceTargetingSetting:'targeting'
  };
  const memory = new Map([[LEGACY_KEY,JSON.stringify(original)]]);
  const migrated = loadWorkspace({getItem:key => memory.get(key) ?? null}).workspace;
  assert.equal(memory.get(LEGACY_KEY),JSON.stringify(original));
  assert.equal(migrated.campaign.rationale.budget,original.strategyDescription);
  assert.equal(migrated.campaign.biddingStrategy,'target_cpa');
  assert.equal(migrated.campaign.targetCpa,'15');
  assert.deepEqual(migrated.campaign.languages,['Spanish']);
  assert.equal(migrated.campaign.adGroups[0].ads[0].headlines[2].text,'Three');
  assert.ok(migrated.campaign.importNotes.some(n => n.includes('Display Network')));
  assert.ok(requirements(migrated.campaign).some(e => e.step === 'budget'));
});

test('browser saves use the new namespace and surface failure without deleting earlier drafts', () => {
  const memory = new Map([[LEGACY_KEY,'original text']]);
  const w = completeWorkspace();
  saveWorkspace({setItem:(key,value) => {memory.set(key,value);}},w);
  assert.equal(memory.get(LEGACY_KEY),'original text');
  assert.deepEqual(loadWorkspace({getItem:key => memory.get(key) ?? null}).workspace,w);
  assert.throws(() => saveWorkspace({setItem:() => {throw new Error('Quota exceeded');}},w), /Quota/);
  memory.set(STORAGE_KEY,'corrupted saved entry');
  assert.throws(() => loadWorkspace({getItem:key => memory.get(key) ?? null}));
  assert.equal(memory.get(STORAGE_KEY),'corrupted saved entry');
});

test('pinning governs illustrative combinations and double-width text uses counted limits', () => {
  const assets = [{text:'Always first',pin:'1' as const},{text:'Second option',pin:'' as const},{text:'Third only',pin:'3' as const}];
  assert.deepEqual(previewAssets(assets,2,0),['Always first','Second option']);
  assert.deepEqual(previewAssets(assets,3,1),['Always first','Second option','Third only']);
  assert.equal(adCharacters('SAT tutor'),9);
  assert.equal(adCharacters('中文'),4);
  const w = completeWorkspace(); w.campaign.adGroups[0].ads[0].headlines[0].text = '中'.repeat(16);
  assert.ok(requirements(w.campaign).some(e => e.message.includes('30 counted')));
});

test('documented tracking URLs preserve existing parameters and fragments and reject executable schemes', () => {
  const w = completeWorkspace(); w.campaign.trackingEnabled = true;
  const url = new URL(landingUrl(w.campaign.adGroups[0].ads[0],w.campaign));
  assert.equal(url.searchParams.get('offer'),'fall');
  assert.equal(url.searchParams.get('utm_campaign'),w.campaign.campaignName);
  assert.equal(url.hash,'#booking');
  for (const value of ['javascript:alert(1)','data:text/html,test','https://user:password@example.com','not a URL'])
    assert.equal(isWebUrl(value),false);
});

test('invalid calendar dates, schedules and optional assets block publication', () => {
  const w = completeWorkspace();
  w.campaign.startDate = '2026-02-30';
  w.campaign.schedules = [{id:'a',days:['Mon'],start:'25:00',end:'99:00'}];
  w.campaign.callouts = ['a'.repeat(26)];
  w.campaign.sitelinks = [{id:'s',text:'Contact',url:'javascript:alert(1)',description1:'one line',description2:''}];
  const errors = requirements(w.campaign);
  assert.ok(errors.some(e => e.step === 'settings'));
  assert.ok(errors.some(e => e.step === 'assets'));
});

test('keyword CSV includes campaign and group negatives and escapes spreadsheet formulas', () => {
  const w = completeWorkspace();
  w.campaign.adGroups[0].name = '=SUM(1,2)';
  w.campaign.negativeKeywords = parseKeywords('"free tutoring"');
  w.campaign.adGroups[0].negativeKeywords = parseKeywords('[jobs]');
  const csv = keywordsCsv(w);
  assert.ok(csv.includes('""free tutoring""'));
  assert.ok(csv.includes('"Campaign"'));
  assert.ok(csv.includes('"[jobs]"'));
  assert.ok(csv.includes("\"'=SUM(1,2)\""));
});

test('retention bounds preserve the latest ten publications and one hundred activity entries', () => {
  let w = completeWorkspace();
  for (let i = 0; i < 12; i++) {w.campaign.campaignName = 'Version ' + i;w = publishWorkspace(w);}
  assert.equal(w.launches.length,10);
  assert.equal(w.launches[0].campaign.campaignName,'Version 2');
  for (let i = 0; i < 110; i++) w = recordActivity(w,'Action '+i,'Detail');
  assert.equal(w.activity.length,100);
  assert.equal(w.activity[99].action,'Action 109');
});
