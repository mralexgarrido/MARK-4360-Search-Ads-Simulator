import React, { useEffect, useRef, useState } from 'react';
import { createWorkspace, makeId, newAd, newGroup } from './types';
import type { AdGroup, BidStrategy, CampaignData, SearchAd, Step, Workspace } from './types';
import { Search, Save, Printer, Plus, X, ChevronRight, ChevronDown, CheckCircle, Info, RefreshCw } from './components/Icons';
import { AssetEditor, Check, Field, HelpButton, InfoBox, KeywordEditor, Modal, Section, SelectField, StringList } from './components/UI';
import { AdPreview } from './components/AdPreview';
import { CampaignSummary, PrintView } from './components/PrintView';
import { BID_LABELS, DAYS, hasUnpublishedChanges, landingUrl, mergeLanguageSelections, publishWorkspace, recordActivity, requirements, usesConversions, usesValue } from './lib/campaign';
import { decodeProject, loadWorkspace, MAX_FILE_BYTES, MAX_FILE_MEGABYTES, projectJson, saveWorkspaceIfCurrent, STORAGE_KEY, StorageConflictError } from './lib/storage';
import { downloadFile, keywordsCsv, reportHtml, REPORT_STYLES, safeFileName } from './lib/export';
import { GUIDES } from './data/guides';
import { AUDIENCE_CATEGORIES } from './data/audiences';
import './styles.css';

const STEPS: { id: Step; title: string; detail: string }[] = [
  {id:'campaign',title:'Campaign',detail:'Objective and measurement'},
  {id:'bidding',title:'Bidding',detail:'Choose the optimization focus'},
  {id:'settings',title:'Campaign settings',detail:'Networks, locations, and audiences'},
  {id:'groups',title:'Ad groups & keywords',detail:'Structure and search intentions'},
  {id:'ads',title:'Ads',detail:'Responsive search ads'},
  {id:'assets',title:'Assets & URL options',detail:'Sitelinks, callouts, and tracking'},
  {id:'budget',title:'Budget',detail:'Average daily spending'},
  {id:'review',title:'Review & publish',detail:'Check the campaign configuration'},
  {id:'submission',title:'Class submission',detail:'Document and export your work'}
];
const options = (pairs: [string,string][]) => pairs.map(([value,label]) => ({value,label}));
const money = (v: number) => Number.isFinite(v) ? v.toLocaleString('en-US',{style:'currency',currency:'USD'}) : 'Enter a budget';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function AudiencePicker({ campaign, onChange }: { campaign: CampaignData; onChange: (segments: string[]) => void }) {
  const [query,setQuery] = useState('');
  const selected = campaign.audienceSegments;
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter(s => s !== value) : [...selected,value]);
  return <div className="audience-widget">
    <div><Field label="Search sample audience segments" value={query} onChange={setQuery} maxLength={100} placeholder="Search the bundled practice list"/>
      <div className="audience-list">{AUDIENCE_CATEGORIES.map(category => {
        const filtered = category.items.filter(item => (item + ' ' + category.title).toLowerCase().includes(query.toLowerCase()));
        if (!filtered.length) return null;
        return <details key={category.id} open={query ? true : undefined}><summary>{category.title}<small>{category.subtitle}</small></summary>
          <div>{filtered.map(item => <Check key={item} label={item} checked={selected.includes(item)} onChange={() => toggle(item)}/>)}</div>
        </details>;
      })}
      {!AUDIENCE_CATEGORIES.some(category => category.items.some(item => (item + ' ' + category.title).toLowerCase().includes(query.toLowerCase()))) && <p>No sample segments match this search.</p>}</div>
    </div><div className="audience-selected"><div className="section-row"><h3>{selected.length} selected</h3>{selected.length > 0 && <button type="button" className="button text-button" onClick={() => onChange([])}>Clear all</button>}</div>
      {!selected.length && <p className="field-hint">Audience selection is optional.</p>}
      <div className="chips">{selected.map(item => <span className="chip" key={item}>{item}<button type="button" aria-label={'Remove ' + item} onClick={() => toggle(item)}><X size={15}/></button></span>)}</div>
    </div>
  </div>;
}

export default function App() {
  const [initial] = useState(() => {
    try {
      const storage = window.localStorage, storedValue = storage.getItem(STORAGE_KEY);
      const loaded = loadWorkspace({getItem:key => key === STORAGE_KEY ? storedValue : storage.getItem(key)});
      return {...loaded,storedValue,blocked:false};
    }
    catch { return {workspace:createWorkspace(),storedValue:null,note:'The saved draft could not be restored. It has not been replaced. Import a project or start a new campaign to resume saving.',blocked:true}; }
  });
  const [workspace,setWorkspace] = useState<Workspace>(initial.workspace);
  const [step,setStep] = useState<Step>('campaign'), [visited,setVisited] = useState<Set<Step>>(new Set(['campaign']));
  const [groupId,setGroupId] = useState(initial.workspace.campaign.adGroups[0].id);
  const [adId,setAdId] = useState(initial.workspace.campaign.adGroups[0].ads[0].id);
  const [guide,setGuide] = useState<Step|null>(null), [menuOpen,setMenuOpen] = useState(false);
  const [dialog,setDialog] = useState<'publish'|'reset'|null>(null);
  const [deletion,setDeletion] = useState<{kind:'group'|'ad';id:string}|null>(null);
  const [pendingImport,setPendingImport] = useState<Workspace|null>(null);
  const [saving,setSaving] = useState(initial.blocked ? 'Autosave paused' : 'Saved in this browser');
  const [savePaused,setSavePaused] = useState(initial.blocked), [notice,setNotice] = useState(initial.note);
  const [reportId,setReportId] = useState('current');
  const [reportVisible,setReportVisible] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null), heading = useRef<HTMLHeadingElement>(null), latest = useRef(workspace);
  const reportRef = useRef<HTMLDivElement>(null), pendingEntries = useRef(new Map<string,string>());
  const sidebarRef = useRef<HTMLElement>(null), menuButton = useRef<HTMLButtonElement>(null);
  const storedValue = useRef(initial.storedValue), persistedWorkspace = useRef(JSON.stringify(initial.workspace));
  const savePauseReason = useRef<'unreadable'|'conflict'|null>(initial.blocked ? 'unreadable' : null);
  latest.current = workspace;
  const campaign = workspace.campaign;
  const group = campaign.adGroups.find(g => g.id === groupId) || campaign.adGroups[0];
  const ad = group.ads.find(a => a.id === adId) || group.ads[0];
  const missing = requirements(campaign);
  const currentIndex = STEPS.findIndex(s => s.id === step);
  const selectedSnapshot = workspace.launches.find(s => s.id === reportId);
  const reportCampaign = selectedSnapshot?.campaign || campaign;
  const changed = hasUnpublishedChanges(workspace);
  const help = () => setGuide(step);
  const conflictNotice = 'Another simulator tab changed the saved workspace. Autosave is paused here to keep both copies intact. Download this tab\'s project JSON before reloading. Import a project or start a new campaign to resume saving.';
  const persistWorkspace = (candidate: Workspace) => {
    if (savePauseReason.current) return false;
    try {
      const encoded = saveWorkspaceIfCurrent(window.localStorage,candidate,storedValue.current);
      storedValue.current = encoded; persistedWorkspace.current = encoded;
      setSaving('Saved in this browser');
      return true;
    } catch (error) {
      if (error instanceof StorageConflictError) {
        savePauseReason.current = 'conflict'; setSavePaused(true); setSaving('Autosave paused'); setNotice(conflictNotice);
      } else {
        setSaving('Browser save unavailable'); setNotice('Browser storage is unavailable or full. Download your project JSON to keep your work; you can also retry Save now.');
      }
      return false;
    }
  };
  const resumeSaving = () => {
    try { storedValue.current = window.localStorage.getItem(STORAGE_KEY); } catch { storedValue.current = null; }
    savePauseReason.current = null; setSavePaused(false);
  };

  useEffect(() => {
    if (savePaused) return;
    setSaving('Saving…');
    const timeout = window.setTimeout(() => {
      persistWorkspace(workspace);
    },650);
    return () => window.clearTimeout(timeout);
  },[workspace,savePaused]);
  useEffect(() => {
    const flush = () => { persistWorkspace(latest.current); };
    const hidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide',flush); document.addEventListener('visibilitychange',hidden);
    return () => { window.removeEventListener('pagehide',flush); document.removeEventListener('visibilitychange',hidden); };
  },[savePaused]);
  useEffect(() => {
    const pendingWarning = (event: BeforeUnloadEvent) => {
      persistWorkspace(latest.current);
      if (pendingEntries.current.size || JSON.stringify(latest.current) !== persistedWorkspace.current) {event.preventDefault();event.returnValue='';}
    };
    window.addEventListener('beforeunload',pendingWarning);
    return () => window.removeEventListener('beforeunload',pendingWarning);
  },[]);
  useEffect(() => {
    const changedElsewhere = (event: StorageEvent) => {
      if ((event.key !== STORAGE_KEY && event.key !== null) || savePauseReason.current) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
        // Read the latest value because an older storage event may still be queued.
        if (window.localStorage.getItem(STORAGE_KEY) === storedValue.current) return;
      } catch {
        setSaving('Browser save unavailable'); setNotice('Browser storage is unavailable. Download your project JSON to keep your work.');
        return;
      }
      savePauseReason.current = 'conflict'; setSavePaused(true); setSaving('Autosave paused'); setNotice(conflictNotice);
    };
    window.addEventListener('storage',changedElsewhere);
    return () => window.removeEventListener('storage',changedElsewhere);
  },[]);
  useEffect(() => { heading.current?.focus(); },[step]);
  useEffect(() => { if (reportId !== 'current' && !workspace.launches.some(s => s.id === reportId)) setReportId('current'); },[workspace.launches,reportId]);
  useEffect(() => {
    if (!menuOpen) return;
    const sidebar = sidebarRef.current as HTMLElement | null;
    const controls = () => Array.from(sidebar?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
    controls()[0]?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = controls(), first = items[0], last = items[items.length-1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    };
    const resize = () => { if (window.innerWidth > 760) setMenuOpen(false); };
    document.addEventListener('keydown',keys);window.addEventListener('resize',resize);
    return () => {document.removeEventListener('keydown',keys);window.removeEventListener('resize',resize);menuButton.current?.focus();};
  },[menuOpen]);

  const trackEntry = (id: string,label: string) => (pending: boolean) => { if (pending) pendingEntries.current.set(id,label); else pendingEntries.current.delete(id); };
  const entriesAdded = () => {
    if (!pendingEntries.current.size) return true;
    setNotice('You have entries that are not added yet: ' + [...pendingEntries.current.values()].join(', ') + '. Use the Add button beside each field, or clear the field, before continuing or exporting.');
    document.querySelector<HTMLInputElement|HTMLTextAreaElement>('[data-pending-input="true"]')?.focus();
    return false;
  };
  const go = (next: Step, targetGroup?: string, targetAd?: string) => {
    if (!entriesAdded()) return;
    if (targetGroup) setGroupId(targetGroup);
    if (targetAd) setAdId(targetAd);
    setStep(next); setVisited(v => new Set([...v,next])); setMenuOpen(false);
    window.scrollTo({top:0,behavior:'auto'});
  };
  const mutate = (fn: (c: CampaignData) => CampaignData, action?: string, detail = '') => setWorkspace(prev => {
    const next = {...prev,campaign:fn(prev.campaign),updatedAt:new Date().toISOString()};
    return action ? recordActivity(next,action,detail) : next;
  });
  const field = <K extends keyof CampaignData>(key: K, value: CampaignData[K]) => mutate(c => ({...c,[key]:value}));
  const groupField = <K extends keyof AdGroup>(key: K, value: AdGroup[K]) => mutate(c => ({...c,adGroups:c.adGroups.map(g => g.id === group.id ? {...g,[key]:value} : g)}));
  const adField = <K extends keyof SearchAd>(key: K, value: SearchAd[K]) => mutate(c => ({...c,adGroups:c.adGroups.map(g => g.id === group.id ? {...g,ads:g.ads.map(a => a.id === ad.id ? {...a,[key]:value} : a)} : g)}));
  const saveNow = () => {
    if (!entriesAdded()) return;
    if (savePaused) { setNotice(savePauseReason.current === 'conflict' ? conflictNotice : 'Saving is paused to keep the unreadable original entry. Import a project or start a new campaign first.'); return; }
    if (persistWorkspace(workspace)) setNotice('Your current workspace is saved in this browser.');
  };
  const exportProject = () => {
    if (!entriesAdded()) return;
    const next = recordActivity(workspace,'Downloaded project','Exported campaign, class notes, activity, and launch snapshots as JSON.');
    try {
      downloadFile(projectJson(next),safeFileName([campaign.studentName,campaign.campaignName].filter(Boolean).join('-')) + '.search-ads.json','application/json');
      setWorkspace(next);
      setNotice('Project JSON download started. Check your Downloads folder. Import this file here to continue on another device.');
    } catch { setNotice('The project download could not start. Your workspace was kept. Try again, or use the assignment report and PDF options.'); }
  };
  const reportFileName = () => safeFileName([campaign.studentName,reportCampaign.campaignName,selectedSnapshot ? 'launch-' + (workspace.launches.indexOf(selectedSnapshot)+1) : 'current'].filter(Boolean).join('-'));
  const exportReport = () => {
    if (!entriesAdded()) return;
    try {
      if (!reportRef.current) throw new Error('Report unavailable');
      downloadFile(reportHtml(reportRef.current.innerHTML,reportCampaign.campaignName || 'Search campaign assignment'),reportFileName() + '-assignment.html','text/html;charset=utf-8');
      setNotice('Assignment report download started. Open the HTML file in a browser to read it or Print / Save PDF. Submit the report format requested by your instructor.');
    } catch { setNotice('The assignment report download could not start. Your workspace was kept. Try Print / Save PDF or project JSON.'); }
  };
  const exportKeywords = () => {
    if (!entriesAdded()) return;
    try { downloadFile(keywordsCsv({...workspace,campaign:reportCampaign}),reportFileName() + '-keywords.csv','text/csv;charset=utf-8');setNotice('Keyword CSV download started. This supplement contains keywords only; submit the assignment report for the full campaign.'); }
    catch { setNotice('The keyword CSV download could not start. Your workspace was kept. The complete assignment report also includes every keyword.'); }
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('Choose a project file smaller than ' + MAX_FILE_MEGABYTES + ' MB.');
      setPendingImport(decodeProject(await file.text()));
    } catch (e) { setNotice('Import failed: ' + (e as Error).message + ' Your current campaign was kept.'); }
  };
  const addGroup = () => {
    if (!entriesAdded()) return;
    const created = newGroup('Ad group ' + (campaign.adGroups.length+1));
    mutate(c => ({...c,adGroups:[...c.adGroups,created]}),'Added ad group',created.name);
    setGroupId(created.id); setAdId(created.ads[0].id);
  };
  const duplicateGroup = () => {
    if (!entriesAdded()) return;
    const copy = clone(group); copy.id = makeId(); copy.name = group.name + ' (copy)';
    copy.keywords = copy.keywords.map(k => ({...k,id:makeId()})); copy.negativeKeywords = copy.negativeKeywords.map(k => ({...k,id:makeId()}));
    copy.ads = copy.ads.map(a => ({...a,id:makeId()}));
    mutate(c => ({...c,adGroups:[...c.adGroups,copy]}),'Duplicated ad group',copy.name);
    setGroupId(copy.id); setAdId(copy.ads[0].id);
  };
  const addAd = (duplicate = false) => {
    const created = duplicate ? {...clone(ad),id:makeId(),name:ad.name + ' (copy)'} : newAd('Responsive search ad ' + (group.ads.length+1));
    mutate(c => ({...c,adGroups:c.adGroups.map(g => g.id === group.id ? {...g,ads:[...g.ads,created]} : g)}),
      duplicate ? 'Duplicated ad' : 'Added ad',group.name + ' / ' + created.name);
    setAdId(created.id);
  };
  const groupSelector = <SelectField label="Ad group" value={group.id} onChange={id => {if (!entriesAdded()) return;setGroupId(id);setAdId(campaign.adGroups.find(g => g.id === id)!.ads[0].id);}}
    options={campaign.adGroups.map(g => ({value:g.id,label:g.name || 'Unnamed ad group'}))}/>;
  const classRationale = (key: keyof CampaignData['rationale'],label: string) => <details className="class-notes"><summary>Class notes for instructor review</summary>
    <Field label={label} value={campaign.rationale[key]} onChange={value => field('rationale',{...campaign.rationale,[key]:value})} multiline hint="Record your reasoning. Your instructor provides the evaluation."/></details>;

  return <>
    <style>{REPORT_STYLES}</style>
    <a className="skip-link" href="#workspace-main">Skip to campaign workspace</a>
    <div className="app-shell no-print">
      {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Close campaign navigation" tabIndex={-1} onClick={() => setMenuOpen(false)}/>}
      <aside id="campaign-navigation" ref={sidebarRef} className={'sidebar ' + (menuOpen ? 'open' : '')} aria-label="Campaign navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen || undefined}>
        <div className="brand"><span className="brand-symbol"><Search size={24}/></span><div><strong>Search Ads</strong><span>MARK 4360 workspace</span></div></div>
        <button type="button" className="icon-button drawer-close" aria-label="Close campaign navigation" onClick={() => setMenuOpen(false)}><X size={20}/></button>
        <div className="sidebar-label">Create a Search campaign</div>
        <nav aria-label="Campaign steps">{STEPS.map((s,i) => <button type="button" key={s.id} className={'nav-item ' + (step === s.id ? 'active' : '')}
          aria-current={step === s.id ? 'step' : undefined} onClick={() => go(s.id)}>
          <span className={'step-number ' + (visited.has(s.id) ? 'viewed' : '')}>{i+1}</span><span>{s.title}</span>
        </button>)}</nav>
        <div className="sidebar-footer"><strong>Your instructor is the grader.</strong><p>Use the guides to understand the controls. Document the decisions you make.</p>
          <button type="button" className="button secondary" onClick={exportProject}><Save size={16}/>Download project</button></div>
      </aside>
      <div className="workspace-column">
        <header className="topbar"><div className="topbar-title"><button type="button" ref={menuButton} className="icon-button mobile-menu" aria-label="Toggle campaign navigation" aria-controls="campaign-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><ChevronDown size={22}/></button>
          <span className="campaign-breadcrumb">Campaigns <ChevronRight size={14}/><strong>{campaign.campaignName || 'New campaign'}</strong></span>
          <span className={'status-pill ' + workspace.status}>{workspace.status === 'draft' ? 'Draft' : workspace.status === 'enabled' ? 'Enabled · practice' : 'Paused · practice'}</span>
          {changed && <span className="changes-label">Unpublished changes</span>}
        </div><div className="topbar-actions"><span className="save-status" role="status">{saving}</span>
          <button type="button" className="button text-button" onClick={saveNow}><Save size={16}/>Save now</button>
          <button type="button" className="button text-button" onClick={() => {if (entriesAdded()) fileInput.current?.click();}}>Import project</button>
          <button type="button" className="button text-button" onClick={() => {if (entriesAdded()) setDialog('reset');}}><RefreshCw size={15}/>Start new</button>
        </div></header>
        <div className="education-strip"><Info size={16}/><span>Independent educational workspace. Publication stays here; no ads or payments are sent.</span></div>
        {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" className="icon-button" aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={18}/></button></div>}
        <main id="workspace-main" className="main-content">
          <div className="page-heading"><div><p className="eyebrow">Campaign creation · Search</p><h1 tabIndex={-1} ref={heading}>{STEPS[currentIndex].title}</h1><p>{STEPS[currentIndex].detail}</p></div>
            <button type="button" className="button secondary" onClick={help}><Info size={17}/>Step guide</button></div>
          <InfoBox title={GUIDES[step].title} action={help}>{GUIDES[step].intro}</InfoBox>

          {step === 'campaign' && <>
            <Section title="Campaign objective" help={help}>
              <Field label="Campaign name" value={campaign.campaignName} onChange={v => field('campaignName',v)} required maxLength={200} placeholder="A clear name for this campaign"/>
              <fieldset className="objective-fieldset"><legend>What is the goal of your campaign?</legend><div className="objective-grid">
                {options([['leads','Leads'],['sales','Sales'],['traffic','Website traffic'],['no_guidance',"Without a goal's guidance"]]).map(o =>
                  <label className={'objective-card ' + (campaign.objective === o.value ? 'selected' : '')} key={o.value}><input type="radio" name="objective" checked={campaign.objective === o.value} onChange={() => field('objective',o.value as CampaignData['objective'])}/><strong>{o.label}</strong>
                    <span>{{leads:'Encourage inquiries or signups',sales:'Encourage customer purchases',traffic:'Bring visitors to the website',no_guidance:'Choose the settings yourself'}[o.value]}</span></label>)}
              </div></fieldset><p className="field-hint">Campaign type: Search. The objective does not automatically choose your strategy.</p>
            </Section>
            <Section title="Conversion and measurement plan" help={help}>
              <Field label="Primary conversion action" value={campaign.conversionAction} onChange={v => field('conversionAction',v)} required={usesConversions(campaign)} maxLength={200} placeholder="For example: completed booking or submitted inquiry"
                hint="Define the action you would track in the real account."/>
              <SelectField label="How would conversion value be supplied?" value={campaign.conversionValueMode} onChange={v => field('conversionValueMode',v as CampaignData['conversionValueMode'])}
                options={options([['fixed','A fixed value for each conversion'],['dynamic','A transaction-specific value']])}/>
              {campaign.conversionValueMode === 'fixed' && <Field label="Conversion value (USD)" type="number" value={campaign.conversionValue} onChange={v => field('conversionValue',v)} min={0} required={usesValue(campaign)} hint="An assumption for the measurement plan; explain how you obtained it."/>}
              <Field label="Measurement plan" value={campaign.measurementPlan} onChange={v => field('measurementPlan',v)} multiline placeholder="Where would the event be recorded, and how would you test it?"/>
              <InfoBox title="Tracking in a real account" tone="neutral">Conversion-based bidding relies on configured conversion tracking. These entries document a plan for instructor review; they do not install a tag or verify a website.</InfoBox>
            </Section>
            <Section title="Business context for class" description="These notes help your instructor evaluate the campaign.">
              <Field label="Business or organization" value={campaign.businessName} onChange={v => field('businessName',v)} maxLength={200}/>
              <Field label="Business brief and offer" value={campaign.businessBrief} onChange={v => field('businessBrief',v)} multiline placeholder="Describe the offer, intended customer, service area, and desired outcome."/>
            </Section>
          </>}

          {step === 'bidding' && <Section title="Bidding strategy" help={help}>
            <SelectField label="Select a bid strategy" value={campaign.biddingStrategy} onChange={v => field('biddingStrategy',v as BidStrategy)}
              options={Object.entries(BID_LABELS).map(([value,label]) => ({value,label}))}/>
            {campaign.biddingStrategy === 'target_cpa' && <Field label="Target CPA (USD)" type="number" min={0} value={campaign.targetCpa} onChange={v => field('targetCpa',v)} required hint="Desired average cost per conversion. Individual conversions can cost more or less."/>}
            {campaign.biddingStrategy === 'target_roas' && <Field label="Target ROAS (%)" type="number" min={0} value={campaign.targetRoas} onChange={v => field('targetRoas',v)} required hint="400% represents $4 in reported conversion value for each $1 in ad cost."/>}
            {campaign.biddingStrategy === 'target_impression_share' && <>
              <SelectField label="Where do you want your ads to appear?" value={campaign.impressionPlacement} onChange={v => field('impressionPlacement',v as CampaignData['impressionPlacement'])}
                options={options([['anywhere','Anywhere on the results page'],['top','Top of the results page'],['absolute_top','Absolute top of the results page']])}/>
              <Field label="Target impression share (%)" type="number" min={1} max={100} value={campaign.impressionShare} onChange={v => field('impressionShare',v)} required/>
            </>}
            {['maximize_clicks','target_impression_share'].includes(campaign.biddingStrategy) && <Field label="Maximum CPC bid limit (USD)" type="number" min={0} value={campaign.cpcLimit} onChange={v => field('cpcLimit',v)}
              required={campaign.biddingStrategy === 'target_impression_share'} hint={campaign.biddingStrategy === 'maximize_clicks' ? 'Optional maximum click bid.' : 'Upper limit for click bids while pursuing your impression-share target.'}/>}
            {campaign.biddingStrategy === 'manual_cpc' && <InfoBox title="Set bids at the ad-group level">Open Ad groups & keywords to enter each group’s default maximum CPC bid.</InfoBox>}
            {usesConversions(campaign) && <InfoBox title="Connect bidding to measurement">Primary conversion: <strong>{campaign.conversionAction || 'Not yet defined'}</strong>. <button type="button" className="inline-link" onClick={() => go('campaign')}>Review the measurement plan</button></InfoBox>}
            {classRationale('budget','Why does this bidding strategy fit the objective?')}
          </Section>}

          {step === 'settings' && <>
            <Section title="Networks" help={help}><p className="fixed-setting"><CheckCircle size={18}/>Google Search</p>
              <Check label="Include Google search partners" checked={campaign.networkSearchPartners} onChange={v => field('networkSearchPartners',v)} hint="Extend eligibility to partner search properties."/>
            </Section>
            <Section title="Locations and languages" help={help}>
              <SelectField label="Included locations" value={campaign.locationOption} onChange={v => {if (entriesAdded()) field('locationOption',v as CampaignData['locationOption']);}}
                options={options([['all','All countries and territories'],['us_ca','United States and Canada'],['us','United States'],['custom','Enter locations']])}/>
              {campaign.locationOption === 'custom' && <StringList label="Add included locations" items={campaign.locations} onChange={v => field('locations',v)} onPendingChange={trackEntry('locations','included locations')} placeholder="City, region, postal code, or a documented radius"/>}
              <StringList label="Excluded locations" items={campaign.excludedLocations} onChange={v => field('excludedLocations',v)} onPendingChange={trackEntry('excluded','excluded locations')} placeholder="Add an excluded location"/>
              <p className="field-hint">Location entries are planning selections. Check geography and radius coverage in the real platform.</p>
              <SelectField label="Location option" value={campaign.locationPresence} onChange={v => field('locationPresence',v as CampaignData['locationPresence'])}
                options={options([['presence_interest','Presence or interest: people in, regularly in, or interested in included locations'],['presence','Presence: people in or regularly in included locations']])}/>
              <fieldset><legend>Languages</legend><div className="inline-checks">{['English','Spanish'].map(language => <Check key={language} label={language} checked={campaign.languages.includes(language)}
                onChange={checked => field('languages',checked ? [...campaign.languages,language] : campaign.languages.filter(l => l !== language))}/>)}</div></fieldset>
              <StringList label="Additional languages" items={campaign.languages.filter(l => !['English','Spanish'].includes(l))} onChange={v => field('languages',mergeLanguageSelections(campaign.languages.filter(l => ['English','Spanish'].includes(l)),v))} onPendingChange={trackEntry('languages','additional languages')} placeholder="Add a language" limit={20}/>
            </Section>
            <Section title="Dates and ad schedule" help={help}>
              <div className="two-columns"><Field label="Start date" type="date" value={campaign.startDate} onChange={v => field('startDate',v)} hint="Optional in this planning workspace."/>
                <Field label="End date" type="date" value={campaign.endDate} onChange={v => field('endDate',v)} hint="Leave empty for no end date."/></div>
              <SelectField label="Account time zone" value={campaign.timeZone} onChange={v => field('timeZone',v)}
                options={[...new Set([campaign.timeZone,'America/Chicago','America/New_York','America/Denver','America/Los_Angeles','America/Mexico_City','Europe/Madrid','UTC'])].map(value => ({value,label:value}))}
                hint="This is the account context used for schedule times, not an ad delivery switch."/>
              {!campaign.schedules.length && <p className="field-hint">All days and all hours are eligible unless you add a schedule.</p>}
              {campaign.schedules.map((schedule,i) => <div className="schedule-row" key={schedule.id}>
                <fieldset><legend>Schedule {i+1} days</legend><div className="day-buttons">{DAYS.map(day => <label key={day}><input type="checkbox" checked={schedule.days.includes(day)}
                  onChange={e => field('schedules',campaign.schedules.map(s => s.id === schedule.id ? {...s,days:e.target.checked ? [...s.days,day] : s.days.filter(d => d !== day)} : s))}/>{day}</label>)}</div></fieldset>
                <div className="inline-form"><Field label={'Schedule ' + (i+1) + ' start'} type="time" step={900} value={schedule.start} onChange={v => field('schedules',campaign.schedules.map(s => s.id === schedule.id ? {...s,start:v} : s))}/>
                  <Field label={'Schedule ' + (i+1) + ' end'} value={schedule.end} maxLength={5} placeholder="17:00" hint="HH:MM in 15-minute intervals. Use 24:00 for midnight. Up to 6 non-overlapping periods per day." onChange={v => field('schedules',campaign.schedules.map(s => s.id === schedule.id ? {...s,end:v} : s))}/>
                  <button type="button" className="icon-button" aria-label={'Remove schedule ' + (i+1)} onClick={() => field('schedules',campaign.schedules.filter(s => s.id !== schedule.id))}><X size={18}/></button></div>
              </div>)}
              {campaign.schedules.length < 42 && <button type="button" className="button secondary" onClick={() => field('schedules',[...campaign.schedules,{id:makeId(),days:DAYS.slice(0,5),start:'09:00',end:'17:00'}])}><Plus size={16}/>Add schedule</button>}
            </Section>
            <Section title="Audience segments" help={help} description="Explore a bundled sample list, then choose how the selections affect eligibility.">
              <AudiencePicker campaign={campaign} onChange={v => field('audienceSegments',v)}/>
              <SelectField label="Audience setting" value={campaign.audienceMode} onChange={v => field('audienceMode',v as CampaignData['audienceMode'])}
                options={options([['observation','Observation: gather audience reporting without narrowing eligibility'],['targeting','Targeting: restrict eligibility to selected audience segments']])}/>
              {campaign.audienceMode === 'targeting' && !campaign.audienceSegments.length && <InfoBox title="Audience selection" tone="amber">No audience segments have been selected. Review what restriction you intend before publishing.</InfoBox>}
              {classRationale('audience','Explain your audience, location, language, and schedule choices.')}
            </Section>
          </>}

          {step === 'groups' && <>
            <Section title="Ad-group structure" help={help}><div className="group-toolbar">{groupSelector}
              <div className="button-row"><button type="button" className="button secondary" onClick={addGroup} disabled={campaign.adGroups.length >= 20}><Plus size={16}/>Add ad group</button>
                <button type="button" className="button text-button" onClick={duplicateGroup} disabled={campaign.adGroups.length >= 20}>Duplicate group</button>
                <button type="button" className="button text-button danger" disabled={campaign.adGroups.length === 1} onClick={() => {if (entriesAdded()) setDeletion({kind:'group',id:group.id});}}>Remove group</button></div></div>
              <Field label="Ad-group name" value={group.name} onChange={v => groupField('name',v)} maxLength={200} required/>
              <Field label="Search-intent note for class" value={group.intentNote} onChange={v => groupField('intentNote',v)} multiline hint="What customer searches should the ads in this group answer?"/>
              {campaign.biddingStrategy === 'manual_cpc' && <Field label="Default maximum CPC bid (USD)" type="number" min={0} value={group.defaultCpc} onChange={v => groupField('defaultCpc',v)} required/>}
            </Section>
            <Section title="Keywords" help={help}><KeywordEditor key={group.id + '-positive'} label="Add keywords to this ad group" keywords={group.keywords} onChange={v => groupField('keywords',v)} onPendingChange={trackEntry('positive','ad-group keywords')}/></Section>
            <Section title="Negative keywords for this ad group" help={help}><KeywordEditor key={group.id + '-negative'} label="Add ad-group negative keywords" keywords={group.negativeKeywords} onChange={v => groupField('negativeKeywords',v)} onPendingChange={trackEntry('negative','ad-group negative keywords')} negative/></Section>
            <Section title="Campaign negative keywords" help={help}><KeywordEditor label="Add campaign negative keywords" keywords={campaign.negativeKeywords} onChange={v => field('negativeKeywords',v)} onPendingChange={trackEntry('campaign-negative','campaign negative keywords')} negative/>
              {classRationale('keywords','Explain the grouping, match types, and exclusions you chose.')}
            </Section>
          </>}

          {step === 'ads' && <div className="ad-workspace"><div className="ad-form-column">
            <Section title="Responsive search ad" help={help}>
              <div className="two-columns">{groupSelector}<SelectField label="Ad" value={ad.id} onChange={setAdId} options={group.ads.map(a => ({value:a.id,label:a.name || 'Unnamed ad'}))}/></div>
              <div className="button-row"><button type="button" className="button secondary" onClick={() => addAd()} disabled={group.ads.length >= 3}><Plus size={16}/>Add ad</button>
                <button type="button" className="button text-button" onClick={() => addAd(true)} disabled={group.ads.length >= 3}>Duplicate ad</button>
                <button type="button" className="button text-button danger" disabled={group.ads.length === 1} onClick={() => setDeletion({kind:'ad',id:ad.id})}>Remove ad</button></div>
              <Field label="Ad name for class documentation" value={ad.name} onChange={v => adField('name',v)} maxLength={200}/>
              <p className="field-hint">Up to 3 enabled responsive search ads per group. Imported extra ads are kept for editing and export; reduce the working group to 3 before publication.</p>
              <Field label="Final URL" type="url" value={ad.finalUrl} onChange={v => adField('finalUrl',v)} maxLength={2000} required placeholder="https://example.com/relevant-page" hint="Enter the complete destination. This workspace does not fetch the URL."/>
              <div className="two-columns"><Field label="Display path 1" value={ad.displayPath1} onChange={v => adField('displayPath1',v)} maxLength={15} hint="Up to 15 counted characters."/>
                <Field label="Display path 2" value={ad.displayPath2} onChange={v => adField('displayPath2',v)} maxLength={15} hint="Up to 15 counted characters. Requires display path 1."/></div>
            </Section>
            <Section title="Headline and description assets" help={help}><AssetEditor label="Headlines" assets={ad.headlines} onChange={v => adField('headlines',v)} limit={30} minimum={3} maximum={15}/>
              <AssetEditor label="Descriptions" assets={ad.descriptions} onChange={v => adField('descriptions',v)} limit={90} minimum={2} maximum={4}/>
              <button type="button" className="button text-button" onClick={() => setGuide('ads')}>Open copy-planning ideas</button>
              {classRationale('creative','Explain the message, call to action, destination, and any pinned assets.')}
            </Section>
          </div><aside className="preview-column" aria-label="Ad preview"><div className="section-row"><h2>Ad preview</h2><HelpButton onClick={help} label="Learn about responsive ad previews"/></div>
            <AdPreview key={ad.id} campaign={campaign} ad={ad}/></aside></div>}

          {step === 'assets' && <>
            <Section title="Sitelinks" help={help} description="Add links you would configure at the campaign level. Descriptions are optional.">
              {campaign.sitelinks.map((s,i) => <div className="asset-card" key={s.id}><div className="section-row"><h3>Sitelink {i+1}</h3><button type="button" className="icon-button" aria-label={'Remove sitelink ' + (i+1)} onClick={() => field('sitelinks',campaign.sitelinks.filter(item => item.id !== s.id))}><X size={18}/></button></div>
                <div className="two-columns"><Field label={'Sitelink ' + (i+1) + ' text'} value={s.text} maxLength={25} onChange={v => field('sitelinks',campaign.sitelinks.map(item => item.id === s.id ? {...item,text:v} : item))} hint="25 counted characters maximum."/>
                  <Field label={'Sitelink ' + (i+1) + ' final URL'} type="url" value={s.url} maxLength={2000} onChange={v => field('sitelinks',campaign.sitelinks.map(item => item.id === s.id ? {...item,url:v} : item))}/></div>
                <div className="two-columns"><Field label={'Sitelink ' + (i+1) + ' description 1'} value={s.description1} maxLength={35} onChange={v => field('sitelinks',campaign.sitelinks.map(item => item.id === s.id ? {...item,description1:v} : item))}/>
                  <Field label={'Sitelink ' + (i+1) + ' description 2'} value={s.description2} maxLength={35} onChange={v => field('sitelinks',campaign.sitelinks.map(item => item.id === s.id ? {...item,description2:v} : item))}/></div>
              </div>)}
              {campaign.sitelinks.length < 20 && <button type="button" className="button secondary" onClick={() => field('sitelinks',[...campaign.sitelinks,{id:makeId(),text:'',url:'',description1:'',description2:''}])}><Plus size={16}/>Add sitelink</button>}
            </Section>
            <Section title="Callouts" help={help}><p className="field-hint">Short, non-clickable details. 25 counted characters maximum each.</p>
              {campaign.callouts.map((text,i) => <div className="inline-form" key={i}><Field label={'Callout ' + (i+1)} value={text} maxLength={25} onChange={v => field('callouts',campaign.callouts.map((s,j) => i === j ? v : s))}/>
                <button type="button" className="icon-button" aria-label={'Remove callout ' + (i+1)} onClick={() => field('callouts',campaign.callouts.filter((_,j) => i !== j))}><X size={18}/></button></div>)}
              {campaign.callouts.length < 20 && <button type="button" className="button secondary" onClick={() => field('callouts',[...campaign.callouts,''])}><Plus size={16}/>Add callout</button>}
            </Section>
            <Section title="URL options for documentation" help={help}><Check label="Add UTM parameters to the documented destination URL" checked={campaign.trackingEnabled} onChange={v => field('trackingEnabled',v)} hint="This does not configure Google Ads auto-tagging or install analytics."/>
              {campaign.trackingEnabled && <><div className="three-columns"><Field label="utm_source" value={campaign.utmSource} onChange={v => field('utmSource',v)} maxLength={200}/><Field label="utm_medium" value={campaign.utmMedium} onChange={v => field('utmMedium',v)} maxLength={200}/><Field label="utm_campaign" value={campaign.utmCampaign} onChange={v => field('utmCampaign',v)} maxLength={200} hint="Uses the campaign name if empty."/></div>
                <p className="field-hint">Selected ad URL: <span className="break-word">{landingUrl(ad,campaign) || 'Enter a final URL in Ads.'}</span></p></>}
              <InfoBox title="Review the landing page yourself">Check that the destination delivers the offer, works on mobile, and provides a clear conversion action. Record your reasoning in the creative notes.</InfoBox>
            </Section>
          </>}

          {step === 'budget' && <Section title="Average daily budget" help={help}>
            <Field label="Average daily budget (USD)" type="number" min={0} value={campaign.budgetAmount} onChange={v => field('budgetAmount',v)} required placeholder="0.00" hint="Shared by all ad groups in this campaign."/>
            {Number(campaign.budgetAmount) > 0 && <div className="budget-facts"><div><span>Possible daily spending limit</span><strong>{money(Number(campaign.budgetAmount)*2)}</strong></div>
              <div><span>Monthly charging limit with a constant budget</span><strong>{money(Number(campaign.budgetAmount)*30.4)}</strong></div></div>}
            <p className="field-hint">Standard average-daily-budget arithmetic. Budget changes and campaign duration affect spending limits. This is not a performance forecast.</p>
            {classRationale('budget','Explain the budget and bidding assumptions for this business.')}
          </Section>}

          {step === 'review' && <>
            <Section title="Publication status" help={help}><div className="publication-status"><span className={'status-pill ' + workspace.status}>{workspace.status === 'draft' ? 'Draft' : workspace.status === 'enabled' ? 'Enabled in workspace' : 'Paused in workspace'}</span>
              <p>{workspace.launches.length ? 'Latest publication: ' + new Date(workspace.launches[workspace.launches.length-1].at).toLocaleString() : 'This campaign has not been published in the workspace.'}</p></div>
              {changed && <InfoBox title="Changes since publication" tone="amber">Your working campaign differs from its last launch snapshot. Review and publish these changes when ready.</InfoBox>}
              {workspace.status !== 'draft' && <button type="button" className="button secondary" onClick={() => setWorkspace(prev => recordActivity({...prev,status:prev.status === 'enabled' ? 'paused' : 'enabled'},prev.status === 'enabled' ? 'Paused practice campaign' : 'Resumed practice campaign','Changed the locally published campaign status.'))}>{workspace.status === 'enabled' ? 'Pause campaign' : 'Resume campaign'}</button>}
            </Section>
            <Section title="Technical requirements" help={help}>
              {missing.length ? <><p>Resolve these items before publishing. You may still export a draft for class.</p><ul className="requirement-list">{missing.map((item,i) => <li key={i}><span>{item.message}</span><button type="button" className="button text-button" onClick={() => go(item.step,item.groupId,item.adId)}>Edit <ChevronRight size={14}/></button></li>)}</ul></> :
                <InfoBox title="Required platform fields are complete"><p>Your configuration can be published in this workspace. Your instructor evaluates its strategy, creative, and effectiveness.</p></InfoBox>}
              <div className="publish-actions"><button type="button" className="button primary" disabled={missing.length > 0} onClick={() => setDialog('publish')}>{workspace.launches.length ? 'Publish changes' : 'Publish practice campaign'}</button>
                <button type="button" className="button secondary" onClick={() => go('submission')}>Prepare class submission</button></div>
            </Section>
            <Section title="Campaign configuration" help={help}><CampaignSummary campaign={campaign}/></Section>
            <Section title="Ad groups and ads" help={help}><div className="campaign-table-wrap"><table className="campaign-table"><thead><tr><th>Ad group</th><th>Keywords</th><th>Ads</th><th>Actions</th></tr></thead><tbody>{campaign.adGroups.map(g =>
              <tr key={g.id}><td>{g.name}</td><td>{g.keywords.length}</td><td>{g.ads.length}</td><td><button type="button" className="inline-link" onClick={() => go('groups',g.id)}>Keywords</button> · <button type="button" className="inline-link" onClick={() => go('ads',g.id,g.ads[0].id)}>Ads</button></td></tr>)}</tbody></table></div>
              <p className="field-hint">The submission report includes every keyword, exclusion, asset, and ad.</p>
            </Section>
          </>}

          {step === 'submission' && <>
            <Section title="Student and class information" help={help}><div className="two-columns"><Field label="Student name" value={campaign.studentName} onChange={v => field('studentName',v)} maxLength={200}/><Field label="Course and section" value={campaign.courseSection} onChange={v => field('courseSection',v)} maxLength={200}/></div>
              <Field label="Business brief and offer" value={campaign.businessBrief} onChange={v => field('businessBrief',v)} multiline/>
            </Section>
            <Section title="Decision rationale for instructor review" help={help}>
              {([['audience','Audience and targeting'],['keywords','Structure, keywords, and exclusions'],['creative','Creative, destination, and assets'],['budget','Bidding and budget']] as const).map(([key,label]) =>
                <Field key={key} label={label} value={campaign.rationale[key]} onChange={v => field('rationale',{...campaign.rationale,[key]:v})} multiline/>)}
            </Section>
            <Section title="Submission exports" help={help}><SelectField label="Campaign version in the report and CSV" value={reportId} onChange={setReportId}
              options={[{value:'current',label:'Current working campaign (latest notes)'},...workspace.launches.map((s,i) => ({value:s.id,label:'Launch ' + (i+1) + ' · ' + new Date(s.at).toLocaleString()}))]}/>
              <p className="field-hint">Launch reports use the captured configuration and notes. Student name and section use the current submission information.</p>
              <ol className="submission-checklist"><li>Check your name, course section, and written rationale above.</li><li>Preview the complete report below. Use Current working campaign to include your latest notes.</li><li>Save the PDF or download the readable assignment report. Download project JSON as a backup and to reopen your work.</li><li>Open the saved file, check its contents, and upload the files requested by your instructor to your course assignment. Downloads do not submit the assignment.</li></ol>
              <div className="export-actions"><button type="button" className="button primary" onClick={() => {if (!entriesAdded()) return;try {window.print();} catch {setNotice('Printing could not open. Download the assignment report, open it in a browser, and use its Print / Save PDF button.');}}}><Printer size={17}/>Print / Save PDF</button>
                <button type="button" className="button secondary" onClick={exportReport}>Download assignment report</button>
                <button type="button" className="button secondary" onClick={exportProject}><Save size={17}/>Download project JSON</button>
                <button type="button" className="button secondary" onClick={exportKeywords}>Download keyword CSV</button></div>
              <InfoBox title="For your instructor" tone="neutral">The PDF and readable HTML assignment report document all campaign choices and your rationale. Project JSON preserves the entire workspace, including launch snapshots, for reopening. Keyword CSV is a supplement. Your instructor supplies the evaluation and grade.</InfoBox>
              {!campaign.studentName.trim() && <p className="field-hint">Student name is empty. Add it if your assignment requires identification.</p>}
              {selectedSnapshot && <p className="field-hint">You selected a historical launch. To submit your latest notes and changes, choose Current working campaign.</p>}
            </Section>
            <Section title="Complete report preview"><button type="button" className="button secondary" aria-expanded={reportVisible} onClick={() => setReportVisible(v => !v)}>{reportVisible ? 'Hide report preview' : 'Preview assignment report'}</button>
              {reportVisible && <div className="report-preview-frame no-print"><PrintView workspace={workspace} snapshot={selectedSnapshot} preview/></div>}
            </Section>
            <Section title="Local activity log" help={help}>{workspace.activity.length ? <ol className="activity-list">{[...workspace.activity].reverse().map(a => <li key={a.id}><strong>{a.action}</strong><time>{new Date(a.at).toLocaleString()}</time><p>{a.detail}</p></li>)}</ol> : <p className="field-hint">Publication and meaningful workspace actions will appear here.</p>}
              <p className="field-hint">Local records are editable and are not proof of authorship.</p>
            </Section>
          </>}

          <footer className="step-footer"><button type="button" className="button secondary" disabled={currentIndex === 0} onClick={() => go(STEPS[currentIndex-1].id)}>Back</button>
            <span>Step {currentIndex+1} of {STEPS.length}</span>{currentIndex < STEPS.length-1 && <button type="button" className="button primary" onClick={() => go(STEPS[currentIndex+1].id)}>Next <ChevronRight size={17}/></button>}</footer>
        </main>
      </div>
    </div>
    <input type="file" className="hidden-file" ref={fileInput} accept=".json,application/json" onChange={importFile} aria-label="Import a Search Ads project"/>
    <div ref={reportRef}><PrintView workspace={workspace} snapshot={selectedSnapshot}/></div>
    {guide && <Modal title={GUIDES[guide].title} onClose={() => setGuide(null)} side><p className="guide-intro">{GUIDES[guide].intro}</p>
      {GUIDES[guide].sections.map(section => <section className="guide-section" key={section.title}><h3>{section.title}</h3><p>{section.body}</p>{section.example && <div className="guide-example"><strong>Example</strong><p>{section.example}</p></div>}</section>)}
      <p className="guide-footer">Learning context for platform practice. Your instructor supplies the feedback and grade.</p>
    </Modal>}
    {dialog === 'publish' && <Modal title="Publish this practice campaign?" onClose={() => setDialog(null)}>
      <p>This captures the settings, ad groups, keywords, ads, assets, and notes you entered. It enables the campaign in this classroom workspace.</p>
      <InfoBox title="No connection to an advertising account" tone="neutral">No ads are sent and no money is spent. Real platform review, billing, and delivery are separate. Your instructor evaluates the submitted campaign.</InfoBox>
      <div className="button-row"><button type="button" className="button secondary" onClick={() => setDialog(null)}>Keep reviewing</button><button type="button" className="button primary" onClick={() => {
        try { setWorkspace(publishWorkspace(workspace));setDialog(null);setNotice('Practice campaign published. The launch snapshot is saved for your submission.'); }
        catch (e) {setDialog(null);setNotice((e as Error).message);}
      }}>Confirm publication</button></div>
    </Modal>}
    {dialog === 'reset' && <Modal title="Start a new campaign?" onClose={() => setDialog(null)}>
      <p>This replaces the active browser workspace. Download the current project first if you want to keep its campaign and snapshots.</p>
      <div className="button-row"><button type="button" className="button secondary" onClick={exportProject}>Download current project</button><button type="button" className="button secondary" onClick={() => setDialog(null)}>Cancel</button>
        <button type="button" className="button primary" onClick={() => {const fresh=createWorkspace();pendingEntries.current.clear();setWorkspace(fresh);setGroupId(fresh.campaign.adGroups[0].id);setAdId(fresh.campaign.adGroups[0].ads[0].id);setReportId('current');setReportVisible(false);resumeSaving();setDialog(null);setNotice('New campaign started.');go('campaign');setVisited(new Set(['campaign']));}}>Start new campaign</button></div>
    </Modal>}
    {pendingImport && <Modal title="Open the imported project?" onClose={() => setPendingImport(null)}>
      <p>Importing <strong>{pendingImport.campaign.campaignName || 'an unnamed campaign'}</strong> will replace the active workspace. Download your current project if you need to keep it.</p>
      <div className="button-row"><button type="button" className="button secondary" onClick={exportProject}>Download current project</button><button type="button" className="button secondary" onClick={() => setPendingImport(null)}>Cancel</button>
        <button type="button" className="button primary" onClick={() => {const next=recordActivity(pendingImport,'Imported project','Opened a local campaign file.');pendingEntries.current.clear();setWorkspace(next);setGroupId(next.campaign.adGroups[0].id);setAdId(next.campaign.adGroups[0].ads[0].id);setReportId('current');setReportVisible(false);resumeSaving();setPendingImport(null);setNotice('Project imported. Review its campaign settings.');go('campaign');}}>Open project</button></div>
    </Modal>}
    {deletion && <Modal title={deletion.kind === 'group' ? 'Remove this ad group?' : 'Remove this ad?'} onClose={() => setDeletion(null)}>
      <p>This removes the selection from your working campaign. Previously saved launch snapshots keep their original contents.</p>
      <div className="button-row"><button type="button" className="button secondary" onClick={() => setDeletion(null)}>Cancel</button><button type="button" className="button primary" onClick={() => {
        if (deletion.kind === 'group') {mutate(c => ({...c,adGroups:c.adGroups.filter(g => g.id !== deletion.id)}),'Removed ad group',group.name);setGroupId(campaign.adGroups.find(g => g.id !== deletion.id)!.id);}
        else {mutate(c => ({...c,adGroups:c.adGroups.map(g => g.id === group.id ? {...g,ads:g.ads.filter(a => a.id !== deletion.id)} : g)}),'Removed ad',ad.name);setAdId(group.ads.find(a => a.id !== deletion.id)!.id);}
        setDeletion(null);
      }}>Remove</button></div>
    </Modal>}
  </>;
}
