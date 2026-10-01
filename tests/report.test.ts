import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createWorkspace, newAd, newGroup } from '../types.ts';
import { parseKeywords, publishWorkspace } from '../lib/campaign.ts';

test('submission rendering includes all groups, all ad assets and the selected historical version', async () => {
  const server = await createServer({server:{middlewareMode:true,watch:null,hmr:false,host:'127.0.0.1'}});
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
