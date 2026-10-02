import React, { useState } from 'react';
import type { CampaignData, SearchAd } from '../types';
import { Globe, Monitor, Smartphone, RefreshCw } from './Icons';
import { isWebUrl, previewAssets } from '../lib/campaign';
export function AdPreview({ campaign, ad, staticView = false }: { campaign: CampaignData; ad: SearchAd; staticView?: boolean }) {
  const [device,setDevice] = useState<'mobile'|'desktop'>('mobile');
  const [combination,setCombination] = useState(0), [compact,setCompact] = useState(false);
  const headlines = previewAssets(ad.headlines,compact ? 2 : 3,combination);
  const descriptions = previewAssets(ad.descriptions,compact ? 1 : 2,combination);
  const domain = isWebUrl(ad.finalUrl) ? new URL(ad.finalUrl).hostname : 'example.com';
  return <div className="ad-preview">
    {!staticView && <div className="preview-tools"><div className="segmented">
      <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={15}/>Mobile</button>
      <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor size={15}/>Desktop</button></div>
      <button type="button" className="button text-button" onClick={() => setCombination(i => i+1)}><RefreshCw size={15}/>Next combination</button>
    </div>}
    <div className={'search-preview ' + (staticView ? 'print-preview' : device)}>
      {!staticView && <div className="search-bar"><span className="google-g">G</span><span>{campaign.adGroups.find(g => g.ads.some(a => a.id === ad.id))?.keywords[0]?.text || 'Search query'}</span><span aria-hidden="true">⌕</span></div>}
      <div className="search-ad-content"><div className="sponsored">Sponsored</div>
        <div className="search-domain"><span className="globe-circle"><Globe size={18}/></span><div><strong>{domain}</strong>
          <div>{[domain,ad.displayPath1,ad.displayPath2].filter(Boolean).join(' › ')}</div></div></div>
        <div className="search-headline">{headlines.length ? headlines.map((text,i) => text || '[Headline ' + (i+1) + ' unavailable]').join(' | ') : 'Your headlines appear here'}</div>
        <div className="search-description">{descriptions.length ? descriptions.map((text,i) => text || '[Description ' + (i+1) + ' unavailable]').join(' ') : 'Your descriptions appear here.'}</div>
        {campaign.callouts.filter(Boolean).length > 0 && <div className="search-callouts">{campaign.callouts.filter(Boolean).join(' · ')}</div>}
        {campaign.sitelinks.filter(s => s.text.trim()).length > 0 && <div className="search-sitelinks">{campaign.sitelinks.filter(s => s.text.trim()).slice(0,4).map(s =>
          <div key={s.id}><span>{s.text}</span>{s.description1 && <small>{s.description1}<br/>{s.description2}</small>}</div>)}</div>}
      </div>
    </div>
    {!staticView && <><label className="preview-option"><input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)}/>Preview fewer headline and description positions</label>
      <p className="field-hint">One possible combination. Actual formats and asset delivery vary. Preview content is not an effectiveness score.</p></>}
  </div>;
}
