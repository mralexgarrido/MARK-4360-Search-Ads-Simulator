import React, { useState, useEffect } from 'react';
import { INITIAL_STATE, CampaignData } from './types';
import { 
    Search, CheckCircle, Save, Printer, RefreshCw, X, Plus, 
    HelpCircle, ChevronRight, Info, AlertCircle, ChevronDown, 
    MousePointerClick, Monitor, DollarSign, PenTool, LayoutTemplate, Target,
    MoreVertical, ArrowRight
} from './components/Icons';
import { AdPreview } from './components/AdPreview';
import { PrintView } from './components/PrintView';

// --- Data Constants ---
const AUDIENCE_CATEGORIES = [
    {
        id: 'demographics',
        title: 'Who they are',
        subtitle: 'Detailed demographics',
        items: [
            'Parents: Parents of Infants (0-1 yrs)',
            'Parents: Parents of Toddlers (1-3 yrs)',
            'Parents: Parents of Preschoolers (4-5 yrs)',
            'Marital Status: Single',
            'Marital Status: In a relationship',
            'Marital Status: Married',
            'Education: Current College Students',
            'Education: Bachelor\'s Degree',
            'Education: Advanced Degree',
            'Homeownership: Homeowners',
            'Homeownership: Renters',
            'Employment: Construction Industry',
            'Employment: Education Sector',
            'Employment: Financial Industry',
            'Employment: Real Estate Industry',
            'Employment: Technology Industry'
        ]
    },
    {
        id: 'affinity',
        title: 'What their interests and habits are',
        subtitle: 'Affinity',
        items: [
            'Banking & Finance: Avid Investors',
            'Beauty & Wellness: Beauty Mavens',
            'Food & Dining: Coffee Shop Regulars',
            'Food & Dining: Cooking Enthusiasts',
            'Food & Dining: Foodies',
            'Lifestyles & Hobbies: Business Professionals',
            'Lifestyles & Hobbies: Green Living Enthusiasts',
            'Lifestyles & Hobbies: Outdoor Enthusiasts',
            'Media & Entertainment: Gamers',
            'Media & Entertainment: Movie Lovers',
            'Shoppers: Bargain Hunters',
            'Shoppers: Luxury Shoppers',
            'Shoppers: Shopaholics',
            'Sports & Fitness: Health & Fitness Buffs',
            'Technology: Technophiles',
            'Travel: Business Travelers',
            'Travel: Travel Buffs'
        ]
    },
    {
        id: 'in_market',
        title: 'What they are actively researching or planning',
        subtitle: 'In-market',
        items: [
            'Apparel & Accessories',
            'Autos & Vehicles',
            'Baby & Children\'s Products',
            'Beauty & Personal Care',
            'Business & Industrial Products',
            'Computers & Peripherals',
            'Consumer Electronics',
            'Dating Services',
            'Education',
            'Employment',
            'Financial Services',
            'Gifts & Occasions',
            'Home & Garden',
            'Real Estate',
            'Software',
            'Sports & Fitness',
            'Telecom',
            'Travel'
        ]
    },
    {
        id: 'your_data',
        title: 'How they have interacted with your business',
        subtitle: 'Your data segments',
        items: [
            'Website Visitors: All Visitors (Last 30 Days)',
            'Website Visitors: Converters (Past Buyers)',
            'Website Visitors: Cart Abandoners',
            'Customer List: Email Subscribers',
            'Customer List: Loyalty Program Members'
        ]
    }
];

// --- Reusable UI Components ---

const InfoTooltip = ({ text }: { text: string }) => (
    <button
        type="button"
        className="group relative inline-block ml-1 align-middle rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={text}
        onClick={(e) => e.preventDefault()}
    >
        <HelpCircle size={14} className="text-gray-400 group-hover:text-gray-600 group-focus:text-gray-600 cursor-help" />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed text-left font-normal">
            {text}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></span>
        </span>
    </button>
);

const SidebarItem = ({ id, label, active, completed, onClick }: any) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-l-4 ${active ? 'bg-blue-50 text-blue-700 border-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100 border-transparent'}`}
    >
        <div className="flex items-center gap-3">
            {completed ? (
                <CheckCircle size={18} className="text-green-600" />
            ) : (
                <div className={`w-4 h-4 rounded-full border-2 ${active ? 'border-blue-600' : 'border-gray-400'}`}></div>
            )}
            {label}
        </div>
    </button>
);

const StepContainer = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl text-[#202124] font-google font-normal mb-6">{title}</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {children}
        </div>
    </div>
);

const FormSection = ({ title, children, isOpen = true }: { title: string, children?: React.ReactNode, isOpen?: boolean }) => (
    <div className="border-b border-gray-200 last:border-0">
        <div className="px-6 py-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50">
            <h3 className="text-base font-medium text-gray-800">{title}</h3>
            <ChevronDown size={20} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        {isOpen && <div className="px-6 pb-8 pt-2">{children}</div>}
    </div>
);

export default function App() {
  const [activeStep, setActiveStep] = useState('bidding');
  const [data, setData] = useState<CampaignData>(INITIAL_STATE);
  
  // UI State for Audience Segment
  const [audienceTab, setAudienceTab] = useState<'search' | 'browse'>('browse');
  const [openAudienceCategory, setOpenAudienceCategory] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('mark4360_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({ ...INITIAL_STATE, ...parsed });
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('mark4360_draft', JSON.stringify(data));
    alert('Progress saved to browser storage!');
  };

  const handleReset = () => {
    if(confirm('Start a new campaign? Current progress will be lost.')) {
        setData(INITIAL_STATE);
        localStorage.removeItem('mark4360_draft');
        setActiveStep('bidding');
    }
  };

  const updateField = (field: keyof CampaignData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Keyword handling
  const handleKeywordChange = (text: string) => {
    updateField('rawKeywords', text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    updateField('keywords', lines);
  };

  // Asset handling
  const addAsset = (type: 'headlines' | 'descriptions', value: string) => {
    if (!value.trim()) return;
    setData(prev => ({ ...prev, [type]: [...prev[type], value] }));
  };
  const removeAsset = (type: 'headlines' | 'descriptions', index: number) => {
    setData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };

  // Audience handling
  const toggleAudienceSegment = (segment: string) => {
    setData(prev => {
        const exists = prev.audienceSegments.includes(segment);
        return {
            ...prev,
            audienceSegments: exists 
                ? prev.audienceSegments.filter(s => s !== segment)
                : [...prev.audienceSegments, segment]
        };
    });
  };

  // Ad Strength Calculation
  const adStrength = Math.min(100, 
    (data.headlines.length * 10) + 
    (data.descriptions.length * 15) + 
    (data.finalUrl ? 10 : 0) +
    (data.keywords.length > 0 ? 10 : 0)
  );

  const getStepStatus = (step: string) => {
      // Simple validation logic for checkboxes
      switch(step) {
          case 'bidding': return !!data.biddingFocus;
          case 'settings': return data.locationOption !== undefined;
          case 'keywords': return data.keywords.length > 0;
          case 'ads': return data.headlines.length >= 3 && data.descriptions.length >= 2;
          case 'budget': return !!data.budgetAmount;
          case 'review': return !!data.studentName;
          default: return false;
      }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-roboto overflow-hidden">
      
      {/* --- Left Sidebar (Google Ads Navigation Style) --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col no-print z-20">
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
             <div className="text-[#5f6368] mr-3"><Search size={24} /></div>
             <span className="font-google text-lg text-gray-700 leading-tight">Mark 4360 <br/><span className="text-xs font-normal">Search Ads Simulator</span></span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
             <div className="px-4 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Steps</div>
             <SidebarItem id="bidding" label="Bidding" active={activeStep === 'bidding'} completed={getStepStatus('bidding')} onClick={setActiveStep} />
             <SidebarItem id="settings" label="Campaign settings" active={activeStep === 'settings'} completed={getStepStatus('settings')} onClick={setActiveStep} />
             <SidebarItem id="keywords" label="Keywords" active={activeStep === 'keywords'} completed={getStepStatus('keywords')} onClick={setActiveStep} />
             <SidebarItem id="ads" label="Ads" active={activeStep === 'ads'} completed={getStepStatus('ads')} onClick={setActiveStep} />
             <SidebarItem id="budget" label="Budget" active={activeStep === 'budget'} completed={getStepStatus('budget')} onClick={setActiveStep} />
             <SidebarItem id="review" label="Review" active={activeStep === 'review'} completed={getStepStatus('review')} onClick={setActiveStep} />
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 mb-3">
                <strong>Educational Mode</strong><br/>
                Hover over <HelpCircle size={10} className="inline text-gray-400"/> icons for context.
            </div>
            <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200">Save</button>
                <button onClick={() => window.print()} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Print PDF</button>
            </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto relative no-print">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-google text-[#202124]">
                {activeStep === 'bidding' && 'Bidding'}
                {activeStep === 'settings' && 'Campaign Settings'}
                {activeStep === 'keywords' && 'Keywords and assets'}
                {activeStep === 'ads' && 'Create ads'}
                {activeStep === 'budget' && 'Budget'}
                {activeStep === 'review' && 'Review'}
            </h1>
            <div className="flex gap-3">
                <button onClick={handleReset} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"><RefreshCw size={14}/> Start Over</button>
            </div>
        </header>

        <div className="p-8 pb-32">
            
            {/* --- Step 1: Bidding --- */}
            {activeStep === 'bidding' && (
                <StepContainer title="Bidding">
                    <FormSection title="Bidding Strategy">
                        <div className="space-y-6 max-w-2xl">
                            <p className="text-sm text-gray-600">Select how you want to pay for your ads. This determines how Google's AI optimizes your campaign.</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">What do you want to focus on? <InfoTooltip text="Conversions = Sales/Leads. Clicks = Traffic to website." /></label>
                                <select 
                                    className="block w-full px-3 py-2.5 bg-white border border-gray-300 rounded hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-gray-900"
                                    value={data.biddingFocus}
                                    onChange={(e) => updateField('biddingFocus', e.target.value)}
                                >
                                    <option value="conversions">Conversions</option>
                                    <option value="conversion_value">Conversion value</option>
                                    <option value="clicks">Clicks</option>
                                    <option value="impression_share">Impression share</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                                        checked={data.setTargetCpa}
                                        onChange={(e) => updateField('setTargetCpa', e.target.checked)}
                                    />
                                    <div>
                                        <span className="text-sm text-gray-800">Set a target cost per action (optional)</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Tell Google the maximum amount you're willing to pay for a conversion.</p>
                                    </div>
                                </label>

                                {data.setTargetCpa && (
                                    <div className="mt-4 ml-7">
                                        <label className="block text-xs text-gray-600 mb-1">Target CPA</label>
                                        <div className="relative w-40">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</div>
                                            <input 
                                                type="number" 
                                                className="block w-full pl-6 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                                                value={data.targetCpaAmount}
                                                onChange={(e) => updateField('targetCpaAmount', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </FormSection>
                </StepContainer>
            )}

            {/* --- Step 2: Settings --- */}
            {activeStep === 'settings' && (
                <StepContainer title="Campaign Settings">
                    <FormSection title="Networks">
                        <div className="space-y-4">
                            <div className="p-4 border border-gray-200 rounded hover:border-blue-500 transition-colors bg-white">
                                <label className="flex gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded bg-white"
                                        checked={data.networkSearchPartners}
                                        onChange={(e) => updateField('networkSearchPartners', e.target.checked)}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-800">Google Search Partners</span>
                                            <span className="text-xs text-gray-500">(Recommended)</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Ads can appear near Google Search results and on other Google sites like YouTube.</p>
                                    </div>
                                </label>
                            </div>

                            <div className="p-4 border border-gray-200 rounded hover:border-blue-500 transition-colors bg-white">
                                <label className="flex gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded bg-white"
                                        checked={data.networkDisplay}
                                        onChange={(e) => updateField('networkDisplay', e.target.checked)}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-800">Google Display Network</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Easy way to get additional conversions at similar or lower costs than Search.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Locations">
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-2">Select locations to target <InfoTooltip text="Targeting 'Presence or Interest' allows people outside the location to see ads if they search for your location."/></p>
                            
                            {[
                                { id: 'all', label: 'All countries and territories' },
                                { id: 'us_ca', label: 'United States and Canada' },
                                { id: 'us', label: 'United States' },
                                { id: 'custom', label: 'Enter another location' }
                            ].map((opt) => (
                                <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="location" 
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 bg-white"
                                        checked={data.locationOption === opt.id}
                                        onChange={() => updateField('locationOption', opt.id)}
                                    />
                                    <span className="text-sm text-gray-800">{opt.label}</span>
                                </label>
                            ))}

                            {data.locationOption === 'custom' && (
                                <div className="ml-7 mt-2">
                                    <div className="flex relative max-w-md">
                                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Enter a location to target or exclude"
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if(val) {
                                                        updateField('customLocations', [...data.customLocations, val]);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {data.customLocations.map((loc, i) => (
                                            <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                                {loc} <button onClick={() => updateField('customLocations', data.customLocations.filter((_, idx) => idx !== i))} aria-label={`Remove ${loc}`} title={`Remove ${loc}`}><X size={12}/></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSection>

                    {/* NEW AUDIENCE SEGMENTS SECTION */}
                    <FormSection title="Audience segments">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Select audience segments to add to your campaign. You can create new data segments in the Tools menu. <InfoTooltip text="Audiences allow you to target people based on who they are, their interests and habits, what they are actively researching, or how they've interacted with your business."/></p>
                            
                            {/* Audience Selection Widget */}
                            <div className="border border-gray-300 rounded bg-white flex h-[500px]">
                                {/* Left Side: Categories */}
                                <div className="w-1/2 border-r border-gray-300 flex flex-col">
                                    <div className="flex border-b border-gray-300">
                                        <button 
                                            className={`flex-1 py-3 text-sm font-medium text-center ${audienceTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                            onClick={() => setAudienceTab('search')}
                                        >
                                            Search
                                        </button>
                                        <button 
                                            className={`flex-1 py-3 text-sm font-medium text-center ${audienceTab === 'browse' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                            onClick={() => setAudienceTab('browse')}
                                        >
                                            Browse
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto bg-white">
                                        {audienceTab === 'browse' ? (
                                            <div>
                                                {AUDIENCE_CATEGORIES.map((cat) => (
                                                    <div key={cat.id} className="border-b border-gray-100 last:border-0">
                                                        <button 
                                                            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 text-left"
                                                            onClick={() => setOpenAudienceCategory(openAudienceCategory === cat.id ? null : cat.id)}
                                                        >
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-800">{cat.title}</div>
                                                                <div className="text-xs text-gray-500">{cat.subtitle}</div>
                                                            </div>
                                                            <ChevronRight size={18} className={`text-gray-400 transition-transform ${openAudienceCategory === cat.id ? 'rotate-90' : ''}`} />
                                                        </button>
                                                        
                                                        {openAudienceCategory === cat.id && (
                                                            <div className="bg-gray-50 px-4 py-2 space-y-1">
                                                                {cat.items.map((item) => (
                                                                    <label key={item} className="flex items-start gap-3 py-2 cursor-pointer group">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                                                                            checked={data.audienceSegments.includes(item)}
                                                                            onChange={() => toggleAudienceSegment(item)}
                                                                        />
                                                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <Search size={20} className="text-gray-400" />
                                                </div>
                                                Search functionality is simplified for educational mode.<br/>Please use the <strong>Browse</strong> tab to explore all available segments.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Selection Summary */}
                                <div className="w-1/2 flex flex-col bg-gray-50">
                                    <div className="p-3 border-b border-gray-300 flex justify-between items-center bg-white h-[45px]">
                                        <span className="text-xs font-medium text-gray-500 uppercase">{data.audienceSegments.length > 0 ? `${data.audienceSegments.length} Selected` : 'None selected'}</span>
                                        {data.audienceSegments.length > 0 && (
                                            <button 
                                                onClick={() => updateField('audienceSegments', [])}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                aria-label="Clear all selected segments"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {data.audienceSegments.length === 0 ? (
                                            <div className="text-sm text-gray-500 mt-10 text-center">
                                                Select one or more segments to observe.
                                            </div>
                                        ) : (
                                            data.audienceSegments.map((seg) => (
                                                <div key={seg} className="flex justify-between items-start bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                    <span className="text-sm text-gray-800">{seg}</span>
                                                    <button onClick={() => toggleAudienceSegment(seg)} className="text-gray-400 hover:text-red-500 ml-2" aria-label={`Remove ${seg}`} title={`Remove ${seg}`}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Targeting Setting */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                    Targeting setting for this campaign <InfoTooltip text="Determines if you want to restrict ads only to these people (Targeting) or just gather data/bid differently for them (Observation)." />
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="audienceTargeting"
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 bg-white"
                                            checked={data.audienceTargetingSetting === 'targeting'}
                                            onChange={() => updateField('audienceTargetingSetting', 'targeting')}
                                        />
                                        <div>
                                            <span className="text-sm text-gray-800 font-medium">Targeting</span>
                                            <p className="text-xs text-gray-500">Narrow the reach of your campaign to the selected segments, with the option to adjust the bids.</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="audienceTargeting"
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 bg-white"
                                            checked={data.audienceTargetingSetting === 'observation'}
                                            onChange={() => updateField('audienceTargetingSetting', 'observation')}
                                        />
                                        <div>
                                            <span className="text-sm text-gray-800 font-medium">Observation (Recommended)</span>
                                            <p className="text-xs text-gray-500">Don't narrow the reach of your campaign, with the option to adjust the bids on the selected segments.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                        </div>
                    </FormSection>
                </StepContainer>
            )}

            {/* --- Step 3: Keywords --- */}
            {activeStep === 'keywords' && (
                <StepContainer title="Keywords and assets">
                    <FormSection title="Keywords">
                         <div className="grid grid-cols-1 gap-6">
                            <p className="text-sm text-gray-600">
                                Enter products or services to advertise. Google matches these keywords with terms people search for. 
                                <InfoTooltip text="Use specific keywords for better targeting. Avoid single broad words like 'shoes'." />
                            </p>
                            
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Enter keywords (one per line)</label>
                                <textarea 
                                    className="w-full h-64 p-4 border border-gray-300 rounded font-mono text-sm leading-6 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-white text-gray-900"
                                    placeholder={`tennis shoes\n"mens tennis shoes"\n[red tennis shoes sale]`}
                                    value={data.rawKeywords}
                                    onChange={(e) => handleKeywordChange(e.target.value)}
                                />
                                <div className="absolute bottom-4 right-4 bg-gray-50 px-2 py-1 border rounded text-xs text-gray-500">
                                    {data.keywords.length} keywords
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded border border-blue-100 flex gap-3">
                                <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-800">
                                    <strong>Match Types:</strong><br/>
                                    keyword = Broad Match (Loose matching)<br/>
                                    "keyword" = Phrase Match (Moderate matching)<br/>
                                    [keyword] = Exact Match (Strict matching)
                                </div>
                            </div>
                        </div>
                    </FormSection>
                </StepContainer>
            )}

            {/* --- Step 4: Ads (Complex Layout) --- */}
            {activeStep === 'ads' && (
                <div className="flex gap-6 max-w-[1600px] mx-auto items-start">
                    {/* Form Column */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Ad Strength Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-google text-gray-800">Create Ad</h2>
                                <p className="text-xs text-gray-500">Responsive Search Ad</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 font-medium">Ad Strength</div>
                                    <div className={`text-sm font-bold ${adStrength > 80 ? 'text-green-600' : adStrength > 40 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                        {adStrength > 80 ? 'Excellent' : adStrength > 40 ? 'Average' : 'Incomplete'}
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full border-4 border-gray-200 relative flex items-center justify-center">
                                     <svg className="absolute inset-0 transform -rotate-90" width="40" height="40">
                                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className={`${adStrength > 80 ? 'text-green-500' : adStrength > 40 ? 'text-yellow-500' : 'text-transparent'}`} strokeDasharray={`${adStrength}, 100`} />
                                     </svg>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Final URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Final URL <InfoTooltip text="The actual page the user lands on."/></label>
                                <input 
                                    type="url" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                                    placeholder="https://www.example.com"
                                    value={data.finalUrl}
                                    onChange={(e) => updateField('finalUrl', e.target.value)}
                                />
                            </div>

                            {/* Display Path */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display path <InfoTooltip text="Part of the URL shown in the ad. Make it relevant to the keywords."/></label>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400">www.example.com /</span>
                                    <input 
                                        type="text" 
                                        maxLength={15}
                                        className="w-32 px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm bg-white text-gray-900"
                                        placeholder=""
                                        value={data.displayPath1}
                                        onChange={(e) => updateField('displayPath1', e.target.value)}
                                    />
                                    <span>/</span>
                                    <input 
                                        type="text" 
                                        maxLength={15}
                                        className="w-32 px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm bg-white text-gray-900"
                                        placeholder=""
                                        value={data.displayPath2}
                                        onChange={(e) => updateField('displayPath2', e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-right text-gray-400 mt-1 max-w-sm">15 chars max each</p>
                            </div>

                            {/* Headlines */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">Headlines <span className="font-normal text-gray-500">(3-15 needed)</span></label>
                                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">View ideas</span>
                                </div>
                                <div className="space-y-3">
                                    {data.headlines.map((h, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input 
                                                readOnly 
                                                value={h} 
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-900 text-sm"
                                            />
                                            <button onClick={() => removeAsset('headlines', i)} className="text-gray-400 hover:text-red-500" aria-label="Remove headline" title="Remove headline"><X size={18} /></button>
                                        </div>
                                    ))}
                                    {data.headlines.length < 15 && (
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                maxLength={30}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                                                placeholder="Enter a headline"
                                                onKeyDown={(e) => {
                                                    if(e.key === 'Enter') {
                                                        addAsset('headlines', e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                id="headline-input"
                                            />
                                            <button 
                                                onClick={() => {
                                                    const el = document.getElementById('headline-input') as HTMLInputElement;
                                                    addAsset('headlines', el.value);
                                                    el.value = '';
                                                }}
                                                className="absolute right-2 top-2 text-blue-600 hover:bg-blue-50 p-0.5 rounded"
                                                aria-label="Add headline"
                                                title="Add headline"
                                            >
                                                <Plus size={18}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">Descriptions <span className="font-normal text-gray-500">(2-4 needed)</span></label>
                                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">View ideas</span>
                                </div>
                                <div className="space-y-3">
                                    {data.descriptions.map((h, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input 
                                                readOnly 
                                                value={h} 
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-900 text-sm"
                                            />
                                            <button onClick={() => removeAsset('descriptions', i)} className="text-gray-400 hover:text-red-500" aria-label="Remove description" title="Remove description"><X size={18} /></button>
                                        </div>
                                    ))}
                                    {data.descriptions.length < 4 && (
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                maxLength={90}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                                                placeholder="Enter a description"
                                                onKeyDown={(e) => {
                                                    if(e.key === 'Enter') {
                                                        addAsset('descriptions', e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                id="desc-input"
                                            />
                                             <button 
                                                onClick={() => {
                                                    const el = document.getElementById('desc-input') as HTMLInputElement;
                                                    addAsset('descriptions', el.value);
                                                    el.value = '';
                                                }}
                                                className="absolute right-2 top-2 text-blue-600 hover:bg-blue-50 p-0.5 rounded"
                                                aria-label="Add description"
                                                title="Add description"
                                            >
                                                <Plus size={18}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Preview Column */}
                    <div className="w-[400px] xl:w-[600px] flex-shrink-0 sticky top-24">
                        <div className="mb-2 text-center text-xs text-gray-500 uppercase font-medium tracking-wide">Ad Preview</div>
                        <AdPreview data={data} />
                        <div className="mt-4 bg-yellow-50 p-4 rounded border border-yellow-100 text-xs text-yellow-800 flex gap-2">
                            <AlertCircle size={16} className="flex-shrink-0"/>
                            <p>For educational purposes only. This preview simulates the Google Search results page appearance.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Step 5: Budget --- */}
            {activeStep === 'budget' && (
                <StepContainer title="Budget">
                    <FormSection title="Daily Budget">
                         <div className="space-y-6 max-w-xl">
                            <p className="text-sm text-gray-600">Enter the average amount you want to spend each day.</p>
                            
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-bold">$</span>
                                </div>
                                <input 
                                    type="number" 
                                    className="block w-full pl-8 pr-12 py-4 border border-gray-300 rounded text-xl text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                    placeholder="0.00"
                                    value={data.budgetAmount}
                                    onChange={(e) => updateField('budgetAmount', e.target.value)}
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-800 mb-2">Monthly Estimate</h4>
                                <div className="text-2xl font-google text-gray-700">
                                    ${((parseFloat(data.budgetAmount) || 0) * 30.4).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-gray-500 font-normal">/ month max</span>
                                </div>
                            </div>
                        </div>
                    </FormSection>
                </StepContainer>
            )}

             {/* --- Step 6: Review --- */}
            {activeStep === 'review' && (
                <StepContainer title="Review">
                    <div className="p-6">
                        <div className="bg-green-50 border border-green-100 p-4 rounded-lg mb-8 flex items-center gap-3">
                            <CheckCircle size={24} className="text-green-600" />
                            <div>
                                <h3 className="text-sm font-medium text-green-900">Campaign Ready to Publish</h3>
                                <p className="text-xs text-green-700">Review your settings below before submitting.</p>
                            </div>
                        </div>

                        <div className="grid gap-6 mb-8">
                            <div className="bg-white border border-gray-200 rounded p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white text-gray-900"
                                    placeholder="Enter campaign name (e.g. Summer Sale)"
                                    value={data.campaignName}
                                    onChange={(e) => updateField('campaignName', e.target.value)}
                                />
                            </div>

                             <div className="bg-white border border-gray-200 rounded p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Student Name (Required for submission)</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white text-gray-900"
                                    placeholder="Enter your full name"
                                    value={data.studentName}
                                    onChange={(e) => updateField('studentName', e.target.value)}
                                />
                            </div>

                            <div className="bg-white border border-gray-200 rounded p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Strategy Explanation</label>
                                <textarea 
                                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white text-gray-900"
                                    placeholder="Explain why you chose this bidding strategy and these specific keywords..."
                                    value={data.strategyDescription}
                                    onChange={(e) => updateField('strategyDescription', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={() => window.print()}
                                className="bg-[#0b57d0] hover:bg-blue-700 text-white px-6 py-3 rounded font-medium shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Printer size={18} /> Generate PDF Report
                            </button>
                        </div>
                    </div>
                </StepContainer>
            )}

            {/* Bottom Navigation for Steps */}
            <div className="mt-8 flex justify-between items-center max-w-4xl mx-auto pt-6 border-t border-gray-200">
                 <button 
                    disabled={activeStep === 'bidding'}
                    onClick={() => {
                        const steps = ['bidding', 'settings', 'keywords', 'ads', 'budget', 'review'];
                        const curr = steps.indexOf(activeStep);
                        if(curr > 0) setActiveStep(steps[curr-1]);
                    }}
                    className="text-gray-600 font-medium px-6 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
                 >
                     Back
                 </button>
                 <button 
                    onClick={() => {
                        const steps = ['bidding', 'settings', 'keywords', 'ads', 'budget', 'review'];
                        const curr = steps.indexOf(activeStep);
                        if(curr < steps.length - 1) setActiveStep(steps[curr+1]);
                    }}
                    className={`bg-[#0b57d0] text-white font-medium px-8 py-2.5 rounded hover:shadow-md transition-shadow ${activeStep === 'review' ? 'hidden' : ''}`}
                 >
                     Next
                 </button>
            </div>

        </div>
      </main>

      <PrintView data={data} />
    </div>
  );
}