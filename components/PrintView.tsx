import React from 'react';
import type { CampaignData, LaunchSnapshot, Workspace } from '../types';
import { AdPreview } from './AdPreview';
import { BID_LABELS, keywordSyntax, landingUrl, requirements, usesConversions, usesValue } from '../lib/campaign';
const value = (text: string) => text.trim() || 'Not provided';
const list = (items: string[]) => items.length ? items.join(', ') : 'None';
function Facts({ entries }: { entries: [string,string][] }) {
  return <dl className="facts">{entries.map(([label,text]) => <div key={label}><dt>{label}</dt><dd>{value(text)}</dd></div>)}</dl>;
}
export function CampaignSummary({ campaign: c }: { campaign: CampaignData }) {
  return <div className="campaign-summary"><Facts entries={[
    ['Campaign', c.campaignName], ['Business',c.businessName], ['Campaign type','Search'],
    ['Objective',{leads:'Leads',sales:'Sales',traffic:'Website traffic',no_guidance:"Without a goal's guidance"}[c.objective]],
    ['Bidding',BID_LABELS[c.biddingStrategy]],
    ...(c.biddingStrategy === 'target_cpa' ? [['Target CPA','$' + c.targetCpa] as [string,string]] : []),
    ...(c.biddingStrategy === 'target_roas' ? [['Target ROAS',c.targetRoas + '%'] as [string,string]] : []),
    ...(c.cpcLimit && ['maximize_clicks','target_impression_share'].includes(c.biddingStrategy) ? [['Maximum CPC limit','$' + c.cpcLimit] as [string,string]] : []),
    ...(c.biddingStrategy === 'target_impression_share' ? [['Impression share',c.impressionShare + '%; placement: ' + c.impressionPlacement.replace(/_/g,' ')] as [string,string]] : []),
    ['Average daily budget',c.budgetAmount ? '$' + c.budgetAmount : 'Not provided'],
    ['Networks','Google Search' + (c.networkSearchPartners ? ' + search partners' : '')],
    ['Included locations',c.locationOption === 'custom' ? list(c.locations) : {all:'All countries and territories',us:'United States',us_ca:'United States and Canada'}[c.locationOption]],
    ['Excluded locations',list(c.excludedLocations)],
    ['Location option',c.locationPresence === 'presence' ? 'Presence' : 'Presence or interest'],
    ['Languages',list(c.languages)], ['Audiences',list(c.audienceSegments)], ['Audience setting',c.audienceMode === 'observation' ? 'Observation' : 'Targeting'],
    ['Start / end', (c.startDate || 'Not specified') + ' / ' + (c.endDate || 'No end date')], ['Account time zone',c.timeZone],
    ['Schedule',c.schedules.length ? c.schedules.map(s => s.days.join(', ') + ' ' + s.start + '–' + s.end).join('; ') : 'All days, all hours'],
    ['Conversion action',c.conversionAction],
    ['Conversion value',c.conversionValueMode === 'dynamic' ? 'Transaction-specific values' : c.conversionValue ? '$' + c.conversionValue : 'Not specified'],
    ['Measurement plan',c.measurementPlan],
    ['UTM parameters',c.trackingEnabled ? 'utm_source=' + c.utmSource + '; utm_medium=' + c.utmMedium + '; utm_campaign=' + (c.utmCampaign || c.campaignName) : 'Not added by this workspace']
  ]}/>{usesConversions(c) && <p className="field-hint">The conversion action above is a planning entry. This workspace does not install or verify tracking.</p>}
    {usesValue(c) && <p className="field-hint">Value-based bidding uses the conversion-value assumptions entered above.</p>}
  </div>;
}
export function PrintView({ workspace, snapshot }: { workspace: Workspace; snapshot?: LaunchSnapshot }) {
  const c = snapshot?.campaign || workspace.campaign;
  const errors = requirements(c);
  return <article className="print-only submission-report">
    <header className="report-heading"><div><p className="eyebrow">MARK 4360 · Instructor review</p><h1>Search campaign submission</h1>
      <p>{snapshot ? 'Launch snapshot · ' + new Date(snapshot.at).toLocaleString() : 'Current working campaign'}</p></div>
      <div><strong>{workspace.campaign.studentName || 'Student name not provided'}</strong><p>{workspace.campaign.courseSection}</p></div></header>
    <p className="report-notice">Independent educational workspace. No advertising was purchased. Technical completion does not assess campaign effectiveness or assign a grade. The instructor evaluates this submission.</p>
    <h2>Campaign configuration</h2><CampaignSummary campaign={c}/>
    <h2>Business brief</h2><p className="preserve-lines">{value(c.businessBrief)}</p>
    {c.importNotes.length > 0 && <><h2>Imported draft notes</h2><ul>{c.importNotes.map((n,i) => <li key={i}>{n}</li>)}</ul></>}
    <h2>Campaign negative keywords</h2><p>{list(c.negativeKeywords.map(keywordSyntax))}</p>
    {c.adGroups.map((g,gi) => <section className="report-group" key={g.id}>
      <h2>{gi+1}. {g.name || 'Unnamed ad group'}</h2><p><strong>Search-intent note:</strong> {value(g.intentNote)}</p>
      {c.biddingStrategy === 'manual_cpc' && <p><strong>Default CPC bid:</strong> {'$' + g.defaultCpc}</p>}
      <h3>Keywords</h3><table className="report-table"><thead><tr><th>Keyword text</th><th>Match type</th></tr></thead><tbody>
        {g.keywords.map(k => <tr key={k.id}><td>{keywordSyntax(k)}</td><td>{k.matchType}</td></tr>)}
        {!g.keywords.length && <tr><td colSpan={2}>No keywords entered</td></tr>}
      </tbody></table><h3>Ad-group negative keywords</h3><p>{list(g.negativeKeywords.map(keywordSyntax))}</p>
      {g.ads.map((ad,ai) => <section className="report-ad" key={ad.id}><h3>Ad {ai+1}: {ad.name}</h3>
        <p><strong>Final URL:</strong> <span className="break-word">{value(ad.finalUrl)}</span></p>
        <p><strong>Display paths:</strong> {ad.displayPath1 || '(empty)'} / {ad.displayPath2 || '(empty)'}</p>
        {c.trackingEnabled && <p><strong>URL with UTM parameters:</strong> <span className="break-word">{landingUrl(ad,c)}</span></p>}
        <div className="report-asset-columns"><div><h4>All headline assets</h4><ol>{ad.headlines.map((a,i) => <li key={i}>{value(a.text)}{a.pin && ' [Pinned to position ' + a.pin + ']'}</li>)}</ol></div>
          <div><h4>All description assets</h4><ol>{ad.descriptions.map((a,i) => <li key={i}>{value(a.text)}{a.pin && ' [Pinned to position ' + a.pin + ']'}</li>)}</ol></div></div>
        <div className="report-ad-preview"><AdPreview campaign={c} ad={ad} staticView/></div><p className="field-hint">Illustrative combination. All entered assets are listed above.</p>
      </section>)}
    </section>)}
    <h2>Additional assets</h2>{c.sitelinks.map(s => <div className="report-sitelink" key={s.id}><strong>{value(s.text)}</strong><p className="break-word">{value(s.url)}</p>
      {(s.description1 || s.description2) && <p>{s.description1} / {s.description2}</p>}</div>)}
    <p><strong>Callouts:</strong> {list(c.callouts)}</p>
    <h2>Student rationale for instructor review</h2>{Object.entries(c.rationale).map(([key,text]) =>
      <div key={key}><h3>{{audience:'Audience and targeting',keywords:'Structure and keywords',creative:'Creative and destination',budget:'Bidding and budget'}[key]}</h3><p className="preserve-lines">{value(text)}</p></div>)}
    <h2>Technical requirements at export</h2>{errors.length ? <ul>{errors.map((e,i) => <li key={i}>{e.message}</li>)}</ul> : <p>No missing technical fields detected. Strategic quality is for the instructor to evaluate.</p>}
    <h2>Publication record</h2><p>Status in workspace: {workspace.status}. {workspace.launches.length} saved launch snapshots.</p>
    <ul>{workspace.launches.map((s,i) => <li key={s.id}>Publication {i+1}: {new Date(s.at).toLocaleString()} · {s.campaign.campaignName}</li>)}</ul>
    <h2>Local activity log</h2><table className="report-table"><thead><tr><th>Time</th><th>Action</th><th>Detail</th></tr></thead><tbody>
      {workspace.activity.map(a => <tr key={a.id}><td>{new Date(a.at).toLocaleString()}</td><td>{a.action}</td><td>{a.detail}</td></tr>)}
    </tbody></table><p className="field-hint">Local records are editable and do not prove authorship. The project JSON contains the saved launch configurations.</p>
  </article>;
}
