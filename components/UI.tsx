import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle, Plus, X } from './Icons';
import type { Keyword, MatchType, TextAsset } from '../types';
import { adCharacters, parseKeywords } from '../lib/campaign';

export function HelpButton({ onClick, label = 'Open guidance' }: { onClick: () => void; label?: string }) {
  return <button type="button" className="icon-button help-button" onClick={onClick} aria-label={label} title={label}><HelpCircle size={18}/></button>;
}
export function Section({ title, children, help, description }: { title: string; children: React.ReactNode; help?: () => void; description?: string }) {
  const id = useId();
  return <section className="panel" aria-labelledby={id}>
    <header className="panel-heading"><h2 id={id}>{title}</h2>{help && <HelpButton onClick={help} label={'Learn about ' + title}/>}</header>
    {description && <p className="panel-description">{description}</p>}
    <div className="panel-body">{children}</div>
  </section>;
}
export function Field({ label, value, onChange, hint, type = 'text', multiline, maxLength, required, placeholder, min, max }: {
  label: string; value: string; onChange: (value: string) => void; hint?: string; type?: string;
  multiline?: boolean; maxLength?: number; required?: boolean; placeholder?: string; min?: number; max?: number;
}) {
  const id = useId(), hintId = id + '-hint';
  const common = { id, value, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    'aria-describedby': hint ? hintId : undefined, maxLength: maxLength ?? 10000, placeholder };
  return <div className="field">
    <label htmlFor={id}>{label}{required && <span className="required-label">Required</span>}</label>
    {multiline ? <textarea {...common} rows={4}/> : <input {...common} type={type} min={min} max={max} step={type === 'number' ? 'any' : undefined}/>}
    {hint && <p id={hintId} className="field-hint">{hint}</p>}
  </div>;
}
export function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string;
}) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={e => onChange(e.target.value)} aria-describedby={hint ? id + '-hint' : undefined}>
      {options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}
    </select>{hint && <p className="field-hint" id={id + '-hint'}>{hint}</p>}
  </div>;
}
export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return <div className="check-field"><label htmlFor={id}><input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-describedby={hint ? id + '-hint' : undefined}/><span>{label}</span></label>
    {hint && <p className="field-hint" id={id + '-hint'}>{hint}</p>}
  </div>;
}
export function InfoBox({ title, children, action, tone = 'blue' }: { title: string; children: React.ReactNode; action?: () => void; tone?: 'blue' | 'amber' | 'neutral' }) {
  return <div className={'info-box ' + tone}><div><strong>{title}</strong><div>{children}</div></div>{action && <HelpButton onClick={action} label={'Read more: ' + title}/>}</div>;
}
export function Modal({ title, children, onClose, side = false }: { title: string; children: React.ReactNode; onClose: () => void; side?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); active?.focus(); };
  }, []);
  return <dialog ref={ref} className={side ? 'modal learning-modal' : 'modal'} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }}>
    <header className="modal-heading"><h2 id={id}>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={22}/></button></header>
    <div className="modal-body">{children}</div>
  </dialog>;
}
export function StringList({ label, items, onChange, placeholder, limit = 50 }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string; limit?: number }) {
  const [text, setText] = useState(''), [error, setError] = useState('');
  const id = useId();
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const incoming = text.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    const unique = [...items];
    incoming.forEach(item => { if (!unique.some(s => s.toLowerCase() === item.toLowerCase())) unique.push(item); });
    if (unique.length > limit) { setError('Use up to ' + limit + ' entries in this list.'); return; }
    onChange(unique); setText(''); setError('');
  };
  return <div className="field"><label htmlFor={id}>{label}</label>
    <form className="inline-form" onSubmit={add}><input id={id} value={text} onChange={e => setText(e.target.value)} maxLength={500} placeholder={placeholder}/><button type="submit" className="button secondary"><Plus size={16}/>Add</button></form>
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="chips">{items.map((item,i) => <span className="chip" key={item + i}>{item}<button type="button" aria-label={'Remove ' + item} onClick={() => onChange(items.filter((_,j) => i !== j))}><X size={14}/></button></span>)}</div>
  </div>;
}
export function KeywordEditor({ label, keywords, onChange, negative = false }: { label: string; keywords: Keyword[]; onChange: (keywords: Keyword[]) => void; negative?: boolean }) {
  const [bulk, setBulk] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState('');
  const id = useId();
  const add = () => {
    try {
      const incoming = parseKeywords(bulk);
      const unique = [...keywords];
      incoming.forEach(k => { if (!unique.some(existing => existing.text.toLowerCase() === k.text.toLowerCase() && existing.matchType === k.matchType)) unique.push(k); });
      if (unique.length > 200) throw new Error('Keep this list at or below 200 keywords.');
      onChange(unique); setBulk(''); setError(''); setMessage('Added ' + (unique.length - keywords.length) + ' keywords. Identical text and match-type duplicates were kept once.');
    } catch (e) { setError((e as Error).message); }
  };
  return <div className="keyword-editor">
    <div className="field"><label htmlFor={id}>{label}</label><textarea id={id} rows={4} value={bulk} onChange={e => setBulk(e.target.value)} maxLength={20000}
      placeholder={'One per line: tutoring\n"SAT tutoring"\n[SAT tutor McAllen]'} aria-describedby={id + '-hint'}/>
      <p className="field-hint" id={id + '-hint'}>Plain text = broad. Quotation marks = phrase. Brackets = exact.{negative && ' Negative match types have their own exclusion rules; open the guide for examples.'}</p>
    </div><button className="button secondary" type="button" onClick={add}><Plus size={16}/>Add keywords</button>
    {error && <p role="alert" className="error-text">{error}</p>}{message && <p role="status" className="field-hint">{message}</p>}
    {keywords.length > 0 && <div className="keyword-rows" aria-label={label + ' list'}>
      <div className="keyword-row column-labels"><span>Keyword text</span><span>Match type</span><span/></div>
      {keywords.map((k,i) => <div className="keyword-row" key={k.id}>
        <input aria-label={(negative ? 'Negative keyword ' : 'Keyword ') + (i+1)} value={k.text} maxLength={80} onChange={e => onChange(keywords.map(item => item.id === k.id ? {...item,text:e.target.value} : item))}/>
        <select aria-label={'Match type for keyword ' + (i+1)} value={k.matchType} onChange={e => onChange(keywords.map(item => item.id === k.id ? {...item,matchType:e.target.value as MatchType} : item))}>
          <option value="broad">Broad</option><option value="phrase">Phrase</option><option value="exact">Exact</option>
        </select><button type="button" className="icon-button" aria-label={'Remove keyword ' + (i+1)} onClick={() => onChange(keywords.filter(item => item.id !== k.id))}><X size={18}/></button>
      </div>)}
    </div>}
    <p className="field-hint">{keywords.length} {negative ? 'negative ' : ''}keywords entered. Your instructor evaluates their relevance.</p>
  </div>;
}
export function AssetEditor({ label, assets, onChange, limit, maximum, minimum }: {
  label: string; assets: TextAsset[]; onChange: (assets: TextAsset[]) => void; limit: number; maximum: number; minimum: number;
}) {
  const headline = label === 'Headlines';
  return <div className="asset-editor"><div className="section-row"><h3>{label}</h3><span className="field-hint">{minimum}–{maximum} assets · {limit} characters each</span></div>
    {assets.map((a,i) => {
      const count = adCharacters(a.text), name = (headline ? 'Headline ' : 'Description ') + (i+1);
      return <div className="asset-row" key={i}><div className="asset-input">
        <label className="sr-only" htmlFor={label + '-' + i}>{name}</label>
        <input id={label + '-' + i} value={a.text} maxLength={limit} placeholder={name} aria-describedby={label + '-count-' + i} aria-invalid={count > limit || undefined}
          onChange={e => onChange(assets.map((item,j) => i === j ? {...item,text:e.target.value} : item))}/>
        <span className={count > limit ? 'counter error-text' : 'counter'} id={label + '-count-' + i}>{count}/{limit}</span>
      </div><select aria-label={'Pin ' + name.toLowerCase()} value={a.pin} onChange={e => onChange(assets.map((item,j) => i === j ? {...item,pin:e.target.value as TextAsset['pin']} : item))}>
        <option value="">Unpinned</option><option value="1">Position 1</option><option value="2">Position 2</option>{headline && <option value="3">Position 3</option>}
      </select><button type="button" className="icon-button" aria-label={'Remove ' + name.toLowerCase()} onClick={() => onChange(assets.filter((_,j) => i !== j))}><X size={18}/></button></div>;
    })}
    {assets.length < maximum && <button type="button" className="button text-button" onClick={() => onChange([...assets,{text:'',pin:''}])}><Plus size={16}/>Add {headline ? 'headline' : 'description'}</button>}
    <p className="field-hint">{assets.filter(a => a.text.trim()).length} entered. Asset counts describe completion; they do not score your copy.</p>
  </div>;
}
