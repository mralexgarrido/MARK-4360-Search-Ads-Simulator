import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createWorkspace, newAd, newGroup } from '../types.ts';
import { parseKeywords, publishWorkspace } from '../lib/campaign.ts';
import { reportHtml } from '../lib/export.ts';
import { assignmentFixture } from './fixture.ts';

test('submission rendering includes all groups, all ad assets and the selected historical version', async () => {
  const server = await createServer({server:{middlewareMode:true,watch:null,hmr:false,host:'127.0.0.1'},optimizeDeps:{noDiscovery:true,include:[]}});
  try {
    const { PrintView } = await server.ssrLoadModule('/components/PrintView.tsx');
    const w = createWorkspace();
    const c = w.campaign;
    c.campaignName = 'Original launch name'; c.budgetAmount = '25';
    c.conversionAction = 'Completed booking'; c.studentName = 'Practice Student';
    c.measurementPlan = 'Test a completed booking event';
    c.rationale.creative = 'The instructor reads this explanation';
    c.trackingEnabled = true;
    c.adGroups.push(newGroup('Second intent group'));
    c.adGroups.forEach((g,gi) => {
      g.keywords = parseKeywords('[example keyword ' + gi + ']');
      g.ads.push(newAd('Second responsive ad'));
      g.ads.forEach((a,ai) => {
        a.finalUrl = 'https://example.com/group-' + gi + '/ad-' + ai + '?offer=fall#book';
        a.headlines = [0,1,2,3].map(i => ({text:'Group '+gi+' Ad '+ai+' Headline '+i,pin:i === 0 ? '1' as const : '' as const}));
        a.descriptions = [0,1,2].map(i => ({text:'Group '+gi+' Ad '+ai+' Description '+i,pin:'' as const}));
      });
    });
    const published = publishWorkspace(w);
    published.campaign.campaignName = 'New working name';
    published.campaign.studentName = 'Current student identity';
    published.campaign.rationale.creative = 'New working explanation';
    const historical = renderToStaticMarkup(React.createElement(PrintView,{workspace:published,snapshot:published.launches[0]}));
    assert.ok(historical.includes('Original launch name'));
    assert.ok(historical.includes('Current student identity'));
    assert.ok(historical.includes('The instructor reads this explanation'));
    assert.ok(!historical.includes('New working explanation'));
    assert.ok(historical.includes('Second intent group'));
    assert.ok(historical.includes('Group 1 Ad 1 Headline 3'));
    assert.ok(historical.includes('Group 1 Ad 1 Description 2'));
    assert.ok(historical.includes('Pinned to position 1'));
    assert.ok(historical.includes('utm_source=google'));
    assert.ok(historical.includes('Test a completed booking event'));
    assert.ok(historical.includes('Published practice campaign'));
    assert.ok(historical.includes('The instructor evaluates this submission'));
    const current = renderToStaticMarkup(React.createElement(PrintView,{workspace:published}));
    assert.ok(current.includes('New working name'));
    assert.ok(current.includes('New working explanation'));
  } finally { await server.close(); }
});

test('the offline assignment report contains every configured asset, scope, setting and complete long rationale', async () => {
  const server = await createServer({server:{middlewareMode:true,watch:null,hmr:false,host:'127.0.0.1'},optimizeDeps:{noDiscovery:true,include:[]}});
  try {
    const { PrintView } = await server.ssrLoadModule('/components/PrintView.tsx');
    const w = assignmentFixture();
    const markup = renderToStaticMarkup(React.createElement(PrintView,{workspace:w,preview:true}));
    const html = reportHtml(markup,w.campaign.campaignName);
    for (const text of [
      'Acceptance Test Student','MARK 4360. Acceptance','McAllen, Texas','Edinburg, Texas',
      'Outside the fictional service area','English, Spanish','Presence','Observation','America/Chicago',
      'Mon, Wed, Fri 08:00','20:00','2026-10-05','2026-11-05','Confirmed tutoring consultation',
      'Test', 'utm_campaign=fall-tutoring-acceptance','Tutoring resource 5',
      'Revised G1 final headline','G2 Ad2 Headline 15','Group 2 Ad 2 Description 4',
      'Pinned to position 1','Pinned to position 2','Pinned to position 3','free worksheet',
      'answer key','Bilingual Support','Local Tutors','Flexible Sessions',
      'The instructor evaluates this submission','2 saved launch snapshots',
      'Report dates use the viewing device'
    ]) assert.ok(html.includes(text),'Missing report content: ' + text);
    assert.ok(html.includes(w.campaign.rationale.creative.trim()));
    assert.ok(html.includes('<p class="preserve-lines"><strong>Search-intent note:</strong> ' + w.campaign.adGroups[0].intentNote + '</p>'));
    assert.equal((html.match(/<h3>Ad \d:/g) || []).length,4);
    assert.equal((html.match(/All headline assets/g) || []).length,4);
    assert.equal((html.match(/All description assets/g) || []).length,4);
    assert.ok(html.includes('Print / Save PDF'));
    assert.ok(html.includes('default-src &#39;none&#39;') || html.includes("default-src 'none'"));
    assert.ok(!/<(?:script|link)[^>]+(?:src|href)=/i.test(html));
    assert.ok(html.includes('Tutoría bilingüe'));
    assert.ok(html.includes('report-preview'));
    const original = renderToStaticMarkup(React.createElement(PrintView,{workspace:w,snapshot:w.launches[0]}));
    assert.ok(original.includes('G1 Ad1 Headline 15'));
    assert.ok(!original.includes('Revised G1 final headline'));
  } finally { await server.close(); }
});

test('unfinished draft reports remain readable and escape student input instead of executing it', async () => {
  const server = await createServer({server:{middlewareMode:true,watch:null,hmr:false,host:'127.0.0.1'},optimizeDeps:{noDiscovery:true,include:[]}});
  try {
    const { PrintView } = await server.ssrLoadModule('/components/PrintView.tsx');
    const w = createWorkspace();
    w.campaign.businessBrief = '<script>alert("student text")</script>';
    w.campaign.rationale.creative = 'First line\nSecond line';
    const markup = renderToStaticMarkup(React.createElement(PrintView,{workspace:w}));
    const html = reportHtml(markup,'A <script> title & report');
    assert.ok(html.includes('&lt;script&gt;alert('));
    assert.ok(!html.includes('<script>alert('));
    assert.ok(html.includes('<title>A &lt;script&gt; title &amp; report'));
    assert.ok(html.includes('No local activity recorded.'));
    assert.ok(html.includes('No sitelinks entered.'));
    assert.ok(html.includes('No keywords entered'));
    assert.ok(html.includes('Enter a campaign name.'));
    assert.ok(html.includes('First line\nSecond line'));
  } finally { await server.close(); }
});
