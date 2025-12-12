import React from 'react';
import { CampaignData } from '../types';
import { AdPreview } from './AdPreview';

interface PrintViewProps {
  data: CampaignData;
}

export const PrintView: React.FC<PrintViewProps> = ({ data }) => {
  return (
    <div className="print-only p-12 max-w-[21cm] mx-auto text-gray-800 bg-white">
      <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-[#0b57d0]">Search Ads Simulator</h1>
          <p className="text-sm text-gray-500 mt-1">MARK 4360 - Campaign Submission</p>
        </div>
        <div className="text-right">
            <p className="font-bold text-xl">{data.studentName || 'Unknown Student'}</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-sm font-bold border-b border-gray-300 mb-2 pb-1 text-gray-700 uppercase">1. Settings</h2>
            <div className="text-sm space-y-2">
                 <div className="flex justify-between"><span className="text-gray-600">Campaign Name:</span> <span className="font-medium">{data.campaignName}</span></div>
                 <div className="flex justify-between"><span className="text-gray-600">Bidding Focus:</span> <span className="font-medium capitalize">{data.biddingFocus.replace('_', ' ')}</span></div>
                 <div className="flex justify-between"><span className="text-gray-600">Target CPA:</span> <span className="font-medium">{data.setTargetCpa ? `$${data.targetCpaAmount}` : 'None'}</span></div>
                 <div className="flex justify-between"><span className="text-gray-600">Daily Budget:</span> <span className="font-medium">${data.budgetAmount}</span></div>
                 <div className="flex justify-between"><span className="text-gray-600">Networks:</span> <span className="font-medium">{data.networkSearchPartners ? 'Search Partners' : ''} {data.networkDisplay ? '+ Display' : ''}</span></div>
                 <div className="flex justify-between"><span className="text-gray-600">Location:</span> <span className="font-medium capitalize">{data.locationOption} {data.locationOption === 'custom' && `(${data.customLocations.join(', ')})`}</span></div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold border-b border-gray-300 mb-2 pb-1 text-gray-700 uppercase">2. Strategy</h2>
            <p className="text-sm italic text-gray-700 leading-relaxed border-l-2 border-gray-200 pl-3">
                {data.strategyDescription || 'No strategy provided.'}
            </p>
          </div>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-bold border-b border-gray-300 mb-4 pb-1 text-gray-700 uppercase">3. Audience Segments</h2>
        <div className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
             Setting: {data.audienceTargetingSetting === 'targeting' ? 'Targeting' : 'Observation'}
        </div>
        <div className="flex flex-wrap gap-2">
            {data.audienceSegments.length > 0 ? data.audienceSegments.map((k, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">{k}</span>
            )) : <span className="text-gray-400 text-sm">No audience segments selected.</span>}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold border-b border-gray-300 mb-4 pb-1 text-gray-700 uppercase">4. Keywords ({data.keywords.length})</h2>
        <div className="flex flex-wrap gap-2">
            {data.keywords.length > 0 ? data.keywords.map((k, i) => (
                <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-700">{k}</span>
            )) : <span className="text-gray-400 text-sm">No keywords selected.</span>}
        </div>
      </section>

      <section className="break-inside-avoid">
        <h2 className="text-sm font-bold border-b border-gray-300 mb-4 pb-1 text-gray-700 uppercase">5. Ad Creative</h2>
        
        <div className="grid grid-cols-2 gap-8">
            <div className="text-sm space-y-3">
                <div>
                    <span className="font-bold text-gray-500 text-xs uppercase block">Final URL</span>
                    <span className="text-blue-600 underline">{data.finalUrl}</span>
                    { (data.displayPath1 || data.displayPath2) && <span className="ml-2 text-gray-500">({data.displayPath1}/{data.displayPath2})</span>}
                </div>
                <div>
                    <span className="font-bold text-gray-500 text-xs uppercase block">Headlines</span>
                    <ul className="list-disc pl-4 text-gray-800">
                        {data.headlines.map((h,i) => <li key={i}>{h}</li>)}
                    </ul>
                </div>
                <div>
                    <span className="font-bold text-gray-500 text-xs uppercase block">Descriptions</span>
                    <ul className="list-disc pl-4 text-gray-800">
                        {data.descriptions.map((h,i) => <li key={i}>{h}</li>)}
                    </ul>
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase mb-2">Mobile Preview</span>
                <div className="transform scale-75 origin-top border border-gray-300 rounded-3xl p-2 bg-gray-50">
                    <AdPreview data={data} />
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};