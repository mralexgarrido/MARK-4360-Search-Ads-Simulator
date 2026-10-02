import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspace, newGroup } from '../types.ts';
import { adCharacters, assetPositionsAvailable, hasUnpublishedChanges, isWebUrl, landingUrl, parseKeywords, previewAssets, publishWorkspace, recordActivity, requirements } from '../lib/campaign.ts';
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

test('technical checks do not grade similar copy, strategy, or student explanations', () => {
  const w = completeWorkspace();
  ['Tutoring Sessions', 'Tutoring Session', 'tutoring sessions'].forEach((text, i) => { w.campaign.adGroups[0].ads[0].headlines[i].text = text; });
  w.campaign.rationale = {audience:'',keywords:'',creative:'',budget:''};
  assert.deepEqual(requirements(w.campaign), []);
  const published = publishWorkspace(w);
  assert.equal(published.status,'enabled');
  assert.equal('grade' in published,false);
  assert.equal('score' in published,false);
});

test('literal duplicate assets within one ad are technical errors, while reuse across ads is allowed', () => {
  const w = completeWorkspace();
  const ad = w.campaign.adGroups[0].ads[0];
  ad.headlines[1].text = '  ' + ad.headlines[0].text + '  ';
  ad.descriptions[1].text = ad.descriptions[0].text;
  assert.ok(requirements(w.campaign).some(e => e.adId === ad.id && e.message.includes('duplicate headline')));
  assert.ok(requirements(w.campaign).some(e => e.adId === ad.id && e.message.includes('duplicate description')));
  assert.throws(() => publishWorkspace(w), /requirements/);
  ad.headlines[1].text = 'Book Your Session';
  ad.descriptions[1].text = 'Learn about our SAT preparation services.';
  ad.headlines.push({ text: '', pin: '' }, { text: ' ', pin: '' });
  w.campaign.adGroups[0].ads.push({ ...JSON.parse(JSON.stringify(ad)), id: 'another-ad' });
  assert.deepEqual(requirements(w.campaign), []);
  assert.equal(publishWorkspace(w).status, 'enabled');
});

test('three ads per group can publish and extra imported ads remain editable and exportable', () => {
  const w = completeWorkspace();
  const group = w.campaign.adGroups[0];
  const ad = group.ads[0];
  for (let i = 1; i < 3; i++) group.ads.push({ ...JSON.parse(JSON.stringify(ad)), id: 'ad-' + i });
  assert.deepEqual(requirements(w.campaign), []);
  assert.equal(publishWorkspace(w).status, 'enabled');
  group.ads.push({ ...JSON.parse(JSON.stringify(ad)), id: 'extra-ad' });
  assert.ok(requirements(w.campaign).some(e => e.groupId === group.id && e.message.includes('at most 3 responsive')));
  assert.throws(() => publishWorkspace(w), /requirements/);
  const reopened = decodeProject(projectJson(w));
  assert.equal(reopened.campaign.adGroups[0].ads.length, 4);
  assert.equal(reopened.campaign.adGroups[0].ads[3].headlines[0].text, ad.headlines[0].text);
});

test('display path 2 requires display path 1 without assessing the relevance of either path', () => {
  const w = completeWorkspace();
  const ad = w.campaign.adGroups[0].ads[0];
  ad.displayPath2 = 'book';
  assert.ok(requirements(w.campaign).some(e => e.adId === ad.id && e.message.includes('path 1 before')));
  ad.displayPath1 = 'unrelated';
  assert.deepEqual(requirements(w.campaign), []);
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

test('all supported bidding paths can publish with their required settings', () => {
  const strategies = ['maximize_clicks', 'manual_cpc', 'maximize_conversions', 'target_cpa',
    'maximize_conversion_value', 'target_roas', 'target_impression_share'] as const;
  for (const strategy of strategies) {
    const w = completeWorkspace();
    const c = w.campaign;
    c.biddingStrategy = strategy;
    c.targetCpa = '15'; c.targetRoas = '400'; c.cpcLimit = '3'; c.impressionShare = '80';
    c.conversionValue = '25'; c.adGroups[0].defaultCpc = '2';
    assert.deepEqual(requirements(c), [], strategy);
    assert.equal(publishWorkspace(w).status, 'enabled', strategy);
  }
  const valueCampaign = completeWorkspace().campaign;
  valueCampaign.biddingStrategy = 'maximize_conversion_value';
  assert.ok(requirements(valueCampaign).some(e => e.message.includes('conversion value')));
  valueCampaign.conversionValueMode = 'dynamic';
  assert.deepEqual(requirements(valueCampaign), []);
  const shareCampaign = completeWorkspace().campaign;
  shareCampaign.biddingStrategy = 'target_impression_share'; shareCampaign.cpcLimit = '3';
  for (const percentage of ['0', '101', '-1', 'not a percentage']) {
    shareCampaign.impressionShare = percentage;
    assert.ok(requirements(shareCampaign).some(e => e.message.includes('1 to 100%')));
  }
});

test('keyword imports preserve explicit match types and reject partial syntax', () => {
  assert.deepEqual(parseKeywords(' tutoring \n“SAT prep”\n[local tutor]').map(k => [k.text,k.matchType]),
    [['tutoring','broad'],['SAT prep','phrase'],['local tutor','exact']]);
  for (const text of ['valid\n[unclosed','"unclosed','[nested[term]]','""'])
    assert.throws(() => parseKeywords(text));
});

test('keyword entry rejects overlong pasted text before it can create an unreadable saved draft', () => {
  const source = 'x'.repeat(501);
  assert.throws(() => parseKeywords('valid\n' + source), /at most 80 characters/);
  assert.throws(() => parseKeywords('one two three four five six seven eight nine ten eleven'), /at most 10 words/);
  assert.deepEqual(parseKeywords('[' + 'x'.repeat(80) + ']').map(k => k.text), ['x'.repeat(80)]);
  assert.equal(parseKeywords('one two three four five six seven eight nine ten').length, 1);
  assert.deepEqual(parseKeywords('first\r"second"\r\n[third]\n').map(k => [k.text, k.matchType]),
    [['first', 'broad'], ['second', 'phrase'], ['third', 'exact']]);
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

test('assignment documentation edits do not request another platform publication', () => {
  const published = publishWorkspace(completeWorkspace());
  const c = published.campaign;
  c.studentName = 'Student added after publishing';
  c.courseSection = 'MARK 4360, Section 2';
  c.businessName = 'Campus Tutoring';
  c.businessBrief = 'The business context';
  c.measurementPlan = 'The instructor will review the measurement assumption.';
  c.rationale = { audience: 'Audience reasoning', keywords: 'Structure reasoning', creative: 'Copy reasoning', budget: 'Budget reasoning' };
  c.importNotes.push('A documentation note');
  c.adGroups[0].intentNote = 'The customer intention';
  c.adGroups[0].ads[0].name = 'A label used only for class documentation';
  assert.equal(hasUnpublishedChanges(published), false);
  assert.equal(published.launches[0].campaign.studentName, '');
  assert.equal(published.launches[0].campaign.rationale.creative, '');
  c.adGroups[0].name = 'A new platform ad-group name';
  assert.equal(hasUnpublishedChanges(published), true);
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

test('pinning requires enough distinct eligible assets for every platform position', () => {
  const w = completeWorkspace();
  const ad = w.campaign.adGroups[0].ads[0];
  ad.headlines.forEach(a => { a.pin = '1'; });
  ad.descriptions.forEach(a => { a.pin = '2'; });
  assert.equal(assetPositionsAvailable(ad.headlines, 3), false);
  const errors = requirements(w.campaign);
  assert.ok(errors.some(e => e.adId === ad.id && e.message.includes('all 3 headline positions')));
  assert.ok(errors.some(e => e.adId === ad.id && e.message.includes('both description positions')));
  assert.throws(() => publishWorkspace(w), /requirements/);
  ad.headlines[1].pin = '2'; ad.headlines[2].pin = '';
  ad.descriptions[0].pin = '';
  assert.deepEqual(requirements(w.campaign), []);
  ad.headlines.push({ text: 'Alternative first headline', pin: '1' });
  assert.equal(assetPositionsAvailable(ad.headlines, 3), true);
  ad.headlines[2].text = '';
  assert.equal(assetPositionsAvailable(ad.headlines, 3), false);
  assert.ok(requirements(w.campaign).some(e => e.message.includes('all 3 headline positions')));
});

test('incomplete ad previews preserve pinned positions instead of moving text into an earlier slot', () => {
  assert.deepEqual(previewAssets([{ text: 'Only position three', pin: '3' }], 3, 0), ['', '', 'Only position three']);
  assert.deepEqual(previewAssets([{ text: 'Only position two', pin: '2' }], 2, 0), ['', 'Only position two']);
  assert.deepEqual(previewAssets([{ text: '', pin: '1' }], 3, 0), []);
  const pins = ['', '1', '2', '3'] as const;
  for (const first of pins) for (const second of pins) for (const third of pins) {
    const assets = [{ text: 'A', pin: first }, { text: 'B', pin: second }, { text: 'C', pin: third }];
    if (!assetPositionsAvailable(assets, 3)) continue;
    for (let index = 0; index < 4; index++) {
      const preview = previewAssets(assets, 3, index);
      assert.equal(preview.filter(Boolean).length, 3);
      assert.equal(new Set(preview).size, 3);
      preview.forEach((text, position) => {
        const asset = assets.find(a => a.text === text)!;
        assert.ok(!asset.pin || asset.pin === String(position + 1));
      });
    }
  }
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

test('schedules use quarter hours, permit adjacent periods and validate overlap only on shared days', () => {
  const w = completeWorkspace();
  const c = w.campaign;
  c.schedules = [{ id: 'a', days: ['Mon', 'Wed'], start: '09:15', end: '12:30' },
    { id: 'b', days: ['Mon'], start: '12:30', end: '24:00' },
    { id: 'c', days: ['Tue'], start: '10:00', end: '13:00' }];
  assert.deepEqual(requirements(c), []);
  c.schedules[0].start = '09:17';
  assert.ok(requirements(c).some(e => e.message.includes('15-minute increments')));
  c.schedules[0].start = '09:15';
  c.schedules[1].start = '12:15';
  assert.ok(requirements(c).some(e => e.message.includes('Mon: ad schedule periods overlap')));
  assert.ok(!requirements(c).some(e => e.message.includes('Tue: ad schedule periods overlap')));
  assert.throws(() => publishWorkspace(w), /requirements/);
  c.schedules[1].start = '12:30';
  assert.equal(publishWorkspace(w).status, 'enabled');
});

test('the six-period schedule limit counts every row containing the weekday without losing excess rows', () => {
  const w = completeWorkspace();
  w.campaign.schedules = Array.from({ length: 6 }, (_, i) => ({
    id: 'period-' + i, days: ['Mon', 'Tue'], start: '0' + i + ':00', end: '0' + i + ':15'
  }));
  assert.deepEqual(requirements(w.campaign), []);
  w.campaign.schedules.push({ id: 'seventh', days: ['Tue'], start: '06:00', end: '06:15' });
  assert.ok(requirements(w.campaign).some(e => e.message.includes('Tue: use no more than 6')));
  assert.ok(!requirements(w.campaign).some(e => e.message.includes('Mon: use no more than 6')));
  assert.equal(decodeProject(projectJson(w)).campaign.schedules.length, 7);
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
