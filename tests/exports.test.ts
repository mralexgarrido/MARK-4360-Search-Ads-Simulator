import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspace, newAd, newGroup } from '../types.ts';
import { publishWorkspace } from '../lib/campaign.ts';
import { downloadFile, keywordsCsv } from '../lib/export.ts';
import { decodeProject, LEGACY_KEY, loadWorkspace, MAX_FILE_BYTES, MAX_FILE_MEGABYTES, migrateLegacy, projectJson, saveWorkspaceIfCurrent, STORAGE_KEY, StorageConflictError, validateWorkspace } from '../lib/storage.ts';
import { assignmentFixture } from './fixture.ts';

test('the comprehensive assignment JSON round trip retains every current and historical setting', () => {
  const w = assignmentFixture();
  assert.deepEqual(decodeProject(projectJson(w)),w);
  assert.equal(w.launches[0].campaign.adGroups[0].ads[0].headlines[14].text,'G1 Ad1 Headline 15');
  assert.equal(w.launches[1].campaign.adGroups[0].ads[0].headlines[14].text,'Revised G1 final headline');
});

test('a large UI-legal non-ASCII campaign retains all ten snapshots when its own export exceeds 32 MiB', () => {
  let w = createWorkspace();
  w.campaign.campaignName = 'Large export acceptance';
  w.campaign.biddingStrategy = 'maximize_clicks';
  w.campaign.budgetAmount = '25';
  w.campaign.businessBrief = '中'.repeat(10000);
  w.campaign.measurementPlan = '中'.repeat(10000);
  w.campaign.rationale = {audience:'中'.repeat(10000),keywords:'中'.repeat(10000),creative:'中'.repeat(10000),budget:'中'.repeat(10000)};
  w.campaign.sitelinks = Array.from({length:20},(_,i) => {
    const base = 'https://example.com/resource-' + i + '?notes=';
    return {id:'large-sitelink-' + i,text:'Tutoring resource ' + i,url:base + 'a'.repeat(2000-base.length),description1:'Explore tutoring details',description2:'Choose a consultation time'};
  });
  w.campaign.adGroups = Array.from({length:20},(_,gi) => {
    const g = newGroup('Group ' + (gi + 1));
    g.intentNote = '中'.repeat(10000);
    g.keywords = Array.from({length:200},(_,ki) => ({id:`large-keyword-${gi}-${ki}`,text:'中'.repeat(70) + ki,matchType:'broad' as const}));
    g.negativeKeywords = Array.from({length:200},(_,ki) => ({id:`large-negative-${gi}-${ki}`,text:'文'.repeat(70) + ki,matchType:'exact' as const}));
    g.ads = Array.from({length:3},(_,ai) => {
      const ad = newAd('Group ' + gi + ' responsive ad ' + ai);
      const base = 'https://example.com/?notes=';
      ad.finalUrl = base + 'a'.repeat(2000-base.length);
      ad.headlines = Array.from({length:15},(_,i) => ({text:`G${gi} A${ai} Headline ${i}`,pin:'' as const}));
      ad.descriptions = Array.from({length:4},(_,i) => ({text:`Group ${gi} Ad ${ai} Description ${i}. Explore tutoring options.`,pin:'' as const}));
      return ad;
    });
    return g;
  });
  for (let i=0;i<10;i++) {
    w.campaign.campaignName = 'Large export version ' + i;
    w = publishWorkspace(w);
  }
  const text = projectJson(w);
  const bytes = new TextEncoder().encode(text).length;
  assert.ok(bytes > 32 * 1024 * 1024);
  assert.ok(bytes < MAX_FILE_BYTES);
  const restored = decodeProject(text);
  assert.deepEqual(restored,w);
  assert.equal(restored.launches.length,10);
  assert.equal(restored.launches[0].campaign.campaignName,'Large export version 0');
  assert.equal(restored.campaign.adGroups[19].keywords[199].text,'中'.repeat(70) + '199');
});

test('projects beyond the shared 128 MiB byte limit receive a clear rejection before parsing', () => {
  assert.equal(MAX_FILE_MEGABYTES,128);
  const oversized = '中'.repeat(Math.floor(MAX_FILE_BYTES / 3) + 1);
  assert.throws(() => decodeProject(oversized),/no larger than 128 MB/);
});

test('long URLs and ad names from older supported drafts remain recoverable through import and export', () => {
  const w = createWorkspace();
  w.campaign.adGroups[0].ads[0].name = 'A'.repeat(10000) + ' (copy)';
  w.campaign.adGroups[0].ads[0].finalUrl = 'https://example.com/?notes=' + 'a'.repeat(9970);
  w.campaign.sitelinks.push({id:'long-url',text:'Details',url:'https://example.com/?notes=' + 'b'.repeat(9970),description1:'',description2:''});
  assert.deepEqual(decodeProject(projectJson(w)),w);
});

test('malformed nested import rows, empty identifiers and invalid record dates produce a guided rejection', () => {
  for (const damage of [
    (w: ReturnType<typeof createWorkspace>) => { (w.campaign.adGroups as unknown[]).push(null); },
    (w: ReturnType<typeof createWorkspace>) => { (w.campaign.adGroups[0].ads as unknown[]).push(null); },
    (w: ReturnType<typeof createWorkspace>) => { w.campaign.adGroups[0].id = ''; },
    (w: ReturnType<typeof createWorkspace>) => { w.updatedAt = 'not a date'; },
    (w: ReturnType<typeof createWorkspace>) => { w.activity.push({id:'event',at:'not a date',action:'Action',detail:'Detail'}); }
  ]) {
    const w = createWorkspace(); damage(w);
    assert.throws(() => validateWorkspace(w),/supported Search Ads workspace/);
  }
});

function legacy(rawKeywords: string) {
  return {headlines:['One','Two','Three'],descriptions:['First','Second'],biddingFocus:'clicks',rawKeywords,budgetAmount:'20'};
}

test('legacy migration preserves valid match types beside invalid or overlong original keywords', () => {
  const longKeyword = 'a'.repeat(90);
  const migrated = migrateLegacy(legacy('"Spanish tutoring"\n[local tutor]\n[' + longKeyword + ']\n[unfinished'));
  assert.deepEqual(migrated.campaign.adGroups[0].keywords.map(k => [k.text,k.matchType]),[
    ['Spanish tutoring','phrase'],['local tutor','exact'],[longKeyword,'exact'],['[unfinished','broad']
  ]);
  assert.ok(migrated.campaign.importNotes.some(note => note.includes('Every keyword was preserved')));
  assert.deepEqual(decodeProject(projectJson(migrated)),migrated);
});

test('legacy keyword overflow never silently discards entries or replaces the original browser draft', () => {
  const original = JSON.stringify(legacy(Array.from({length:201},(_,i) => 'keyword ' + i).join('\n')));
  assert.throws(() => decodeProject(original),/no keywords were discarded/);
  const memory = new Map([[LEGACY_KEY,original]]);
  const result = loadWorkspace({getItem:key => memory.get(key) ?? null});
  assert.ok(result.note.includes('original copy was kept'));
  assert.equal(memory.get(LEGACY_KEY),original);
  assert.equal(result.workspace.campaign.adGroups[0].keywords.length,0);
});

test('keyword CSV preserves Unicode and neutralizes formulas after leading spaces', () => {
  const w = assignmentFixture();
  w.campaign.adGroups[0].name = '   =SUM(1,2)';
  w.campaign.adGroups[0].keywords[0].text = '\t@SUM(1,2)';
  const csv = keywordsCsv(w);
  assert.ok(csv.startsWith('\uFEFF"Scope"'));
  assert.ok(csv.includes('Tutoría bilingüe'));
  assert.ok(csv.includes('tutoría en español'));
  assert.ok(csv.includes('"\'   =SUM(1,2)"'));
  assert.ok(csv.includes('"\'\t@SUM(1,2)"'));
  assert.ok(csv.includes('"Campaign","","free","broad","Negative"'));
});

test('a delayed save never replaces a different campaign saved by another tab', () => {
  const memory = new Map<string,string>();
  const storage = {getItem:(key: string) => memory.get(key) ?? null,setItem:(key: string,value: string) => {memory.set(key,value);}};
  const first = createWorkspace(); first.campaign.campaignName = 'First tab';
  const baseline = saveWorkspaceIfCurrent(storage,first,null);
  const second = decodeProject(projectJson(first)); second.campaign.campaignName = 'Second tab edits';
  const secondSaved = saveWorkspaceIfCurrent(storage,second,baseline);
  first.campaign.businessBrief = 'First tab work still in memory';
  assert.throws(() => saveWorkspaceIfCurrent(storage,first,baseline),StorageConflictError);
  assert.equal(memory.get(STORAGE_KEY),secondSaved);
  assert.equal(decodeProject(projectJson(first)).campaign.businessBrief,'First tab work still in memory');
  assert.equal(saveWorkspaceIfCurrent(storage,first,secondSaved),JSON.stringify(first));
});

test('identical concurrent saves are harmless, while cleared storage is treated as a conflict', () => {
  const memory = new Map<string,string>();
  const storage = {getItem:(key: string) => memory.get(key) ?? null,setItem:(key: string,value: string) => {memory.set(key,value);}};
  const w = createWorkspace();
  const saved = saveWorkspaceIfCurrent(storage,w,null);
  assert.equal(saveWorkspaceIfCurrent(storage,w,null),saved);
  memory.clear();
  assert.throws(() => saveWorkspaceIfCurrent(storage,w,saved),StorageConflictError);
  assert.equal(memory.has(STORAGE_KEY),false);
});

test('guarded storage failures leave the earlier project intact for recovery', () => {
  const w = createWorkspace(); const original = JSON.stringify(w);
  const memory = new Map([[STORAGE_KEY,original]]);
  w.campaign.businessBrief = 'Unsaved student work';
  const storage = {getItem:(key: string) => memory.get(key) ?? null,setItem:() => {throw new Error('Quota exceeded');}};
  assert.throws(() => saveWorkspaceIfCurrent(storage,w,original),/Quota exceeded/);
  assert.equal(memory.get(STORAGE_KEY),original);
  assert.equal(decodeProject(projectJson(w)).campaign.businessBrief,'Unsaved student work');
});

test('a failed browser download surfaces the failure and still cleans up its temporary resources', () => {
  const originalDocument = globalThis.document;
  let removed = false, revoked = false, scheduled: (() => void) | undefined, delay = 0;
  const anchor = {href:'',download:'',click(){throw new Error('Download blocked');},remove(){removed=true;}};
  globalThis.document = {createElement:() => anchor,body:{appendChild(){}}} as unknown as Document;
  const create = mock.method(URL,'createObjectURL',() => 'blob:test');
  const revoke = mock.method(URL,'revokeObjectURL',() => {revoked=true;});
  const timer = mock.method(globalThis,'setTimeout',(callback: () => void,milliseconds: number) => {scheduled=callback;delay=milliseconds;return 0;});
  try {
    assert.throws(() => downloadFile('project','campaign.json','application/json'),/Download blocked/);
    assert.ok(removed);
    assert.equal(revoked,false);
    assert.equal(delay,60000);
    scheduled?.(); assert.ok(revoked);
  } finally {
    create.mock.restore(); revoke.mock.restore(); timer.mock.restore();
    if (originalDocument) globalThis.document=originalDocument;
    else delete (globalThis as unknown as Record<string,unknown>).document;
  }
});
