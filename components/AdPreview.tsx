import React, { useState } from 'react';
import { CampaignData } from '../types';
import { MoreVertical, Globe, Smartphone, Monitor, ArrowRight, ArrowLeft } from './Icons';

interface AdPreviewProps {
  data: CampaignData;
}

export const AdPreview: React.FC<AdPreviewProps> = ({ data }) => {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Logic to rotate headlines/descriptions if multiples exist (simulating Google rotation)
  const displayHeadline = (() => {
    const h = data.headlines;
    if (h.length === 0) return "Headline 1 | Headline 2 | Headline 3";
    if (h.length === 1) return h[0];
    if (h.length === 2) return `${h[0]} | ${h[1]}`;
    return `${h[0]} | ${h[1]} | ${h[2]}`;
  })();

  const displayDescription = (() => {
    const d = data.descriptions;
    if (d.length === 0) return "Description text goes here. Add descriptions to highlight what makes your business unique.";
    return d[0] + (d[1] ? ` ${d[1]}` : '');
  })();

  const displayUrl = data.finalUrl || 'example.com';
  // Strip protocol for display
  const rootDomain = displayUrl.replace(/^https?:\/\//, '').split('/')[0];
  
  // Construct display path
  const fullDisplayPath = [
    rootDomain,
    data.displayPath1,
    data.displayPath2
  ].filter(Boolean).join(' › ');

  return (
    <div className="flex flex-col items-center">
      {/* Device Toggle */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-full no-print">
        <button 
          onClick={() => setDevice('mobile')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${device === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Smartphone size={14} /> Mobile
        </button>
        <button 
          onClick={() => setDevice('desktop')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${device === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Monitor size={14} /> Desktop
        </button>
      </div>

      {/* Preview Container */}
      <div className={`bg-white shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ${device === 'mobile' ? 'w-[360px] rounded-3xl' : 'w-[600px] rounded-lg'}`}>
        
        {/* Fake Browser Bar (Desktop) or Status Bar (Mobile) */}
        {device === 'mobile' ? (
           <div className="bg-white border-b border-gray-100 p-3 flex justify-between items-center text-[10px] text-gray-500 px-5">
              <span className="font-medium">9:41</span>
              <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                 <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
              </div>
           </div>
        ) : null}

        {/* Search Bar Simulation */}
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 shadow-sm px-4 py-2.5">
                <div className="w-5 h-5 flex items-center justify-center text-blue-500 font-bold text-lg">G</div>
                <div className="text-sm text-gray-400">Search keywords...</div>
                <div className="ml-auto text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 2.34 9 4v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </div>
            </div>
        </div>

        {/* Ad Content */}
        <div className={`p-4 bg-white min-h-[300px]`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-black">Sponsored</span>
            <div className="w-0.5 h-0.5 bg-gray-500 rounded-full"></div>
             {/* Favicon simulation */}
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                <Globe size={10} className="text-gray-500" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-[#202124]">{fullDisplayPath}</span>
            </div>
            <div className="ml-auto">
                <MoreVertical size={14} className="text-gray-500" />
            </div>
          </div>

          <div className="mb-1">
            <h3 className="text-lg text-[#190eab] cursor-pointer hover:underline leading-[1.3] font-normal font-arial">
              {displayHeadline}
            </h3>
          </div>

          <div className="text-sm text-[#4d5156] leading-[1.5] font-arial">
            {displayDescription}
          </div>

          {/* Sitelinks Extensions Mockup */}
          <div className="mt-3 flex gap-3 text-sm text-[#190eab] font-arial overflow-x-auto pb-2">
             <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-200 whitespace-nowrap hover:bg-gray-100 cursor-pointer">Contact Us</div>
             <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-200 whitespace-nowrap hover:bg-gray-100 cursor-pointer">Pricing</div>
             <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-200 whitespace-nowrap hover:bg-gray-100 cursor-pointer">About</div>
          </div>
        </div>
      </div>
    </div>
  );
};