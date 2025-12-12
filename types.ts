export interface Demographics {
  age: string[];
  gender: string[];
  income: string[];
}

export interface CampaignData {
  // Campaign Info
  campaignName: string;
  
  // Bidding (Step 1)
  biddingFocus: 'conversions' | 'conversion_value' | 'clicks' | 'impression_share';
  setTargetCpa: boolean;
  targetCpaAmount: string;

  // Settings (Step 2)
  networkSearchPartners: boolean;
  networkDisplay: boolean;
  locationOption: 'all' | 'us_ca' | 'us' | 'custom';
  customLocations: string[]; // For 'custom' option
  languages: string[];
  
  // Audience Segments (Step 2)
  audienceSegments: string[]; // List of selected segment IDs/Names
  audienceTargetingSetting: 'targeting' | 'observation';

  // Keywords (Step 3)
  keywords: string[]; // Parsed list
  rawKeywords: string; // Textarea input

  // Ads (Step 4)
  finalUrl: string;
  displayPath1: string;
  displayPath2: string;
  headlines: string[];
  descriptions: string[];

  // Budget (Step 5)
  budgetAmount: string;

  // Review / Student Info
  studentName: string;
  strategyDescription: string;
}

export const INITIAL_STATE: CampaignData = {
  campaignName: '',
  biddingFocus: 'conversions',
  setTargetCpa: false,
  targetCpaAmount: '',
  networkSearchPartners: true,
  networkDisplay: false, // Default is usually off for search purists, but Google defaults on.
  locationOption: 'us',
  customLocations: [],
  languages: ['English'],
  audienceSegments: [],
  audienceTargetingSetting: 'observation',
  keywords: [],
  rawKeywords: '',
  finalUrl: '',
  displayPath1: '',
  displayPath2: '',
  headlines: [],
  descriptions: [],
  budgetAmount: '',
  studentName: '',
  strategyDescription: ''
};