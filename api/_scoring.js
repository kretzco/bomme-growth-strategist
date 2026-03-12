import { BUSINESS_CONFIG } from './_businessConfig.js';

export function normalizeIntent(intent = '') {
  const i = String(intent).toLowerCase();

  if (i.includes('buyer')) return 'buyer';
  if (i.includes('commercial investigation')) return 'commercial investigation';
  if (i.includes('commercial')) return 'commercial';
  if (i.includes('research')) return 'research';
  if (i.includes('educational')) return 'educational';
  if (i.includes('information')) return 'informational';

  return 'mixed';
}

export function normalizeDifficulty(opportunityType = '', pageType = '') {
  const combined = `${opportunityType} ${pageType}`.toLowerCase();

  if (combined.includes('saas')) return 'saas_platform';
  if (combined.includes('marketplace')) return 'marketplace_system';
  if (combined.includes('directory') || combined.includes('database')) return 'database_directory';
  if (combined.includes('calculator') || combined.includes('tool')) return 'calculator_tool';
  if (combined.includes('asset') || combined.includes('template') || combined.includes('checklist') || combined.includes('pdf')) return 'digital_asset_pdf';
  if (combined.includes('comparison')) return 'comparison_page';
  if (combined.includes('cluster')) return 'content_cluster';
  if (combined.includes('landing')) return 'landing_page';

  return 'simple_seo_page';
}

export function estimateTimeHorizon(opportunityType = '', pageType = '', channelKey = '') {
  const combined = `${opportunityType} ${pageType} ${channelKey}`.toLowerCase();

  if (combined.includes('pattern_vault') || combined.includes('studiolab') || combined.includes('saas')) return 'long';
  if (combined.includes('tool') || combined.includes('directory') || combined.includes('database')) return 'medium';
  if (combined.includes('asset') || combined.includes('pdf') || combined.includes('landing') || combined.includes('comparison')) return 'short';

  return 'short';
}

export function estimateBusinessFit({
  keyword = '',
  channelKey = '',
  businessContext = 'bomme-studio'
}) {
  const k = String(keyword).toLowerCase();

  if (channelKey === 'studio_production') {
    if (/clothing manufacturer|apparel manufacturer|private label manufacturer|private label clothing|cut and sew manufacturer|full package manufacturer|full package production|clothing factory|garment manufacturer|production partner/i.test(k)) return 10;
    if (/sampling|development|tech pack|prototype|sample maker/i.test(k)) return 7;
    if (/fabric|textile|trim|sourcing/i.test(k)) return 5;
    return 4;
  }

  if (channelKey === 'studio_development') {
    if (/sample|sampling|prototype|product development|tech pack|patternmaking|fit sample/i.test(k)) return 10;
    if (/manufacturer|production/i.test(k)) return 6;
    return 4;
  }

  if (channelKey === 'digital_assets') {
    if (/template|checklist|guide|costing|calendar|planner|worksheet|spreadsheet/i.test(k)) return 10;
    if (/fabric|sourcing|production|launch/i.test(k)) return 7;
    return 5;
  }

  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    if (/heavyweight|oversized|hoodie|blank|sweatshirt|jogger|french terry/i.test(k)) return 10;
    if (/streetwear|loungewear|premium basics/i.test(k)) return 8;
    return 5;
  }

  if (businessContext === 'bomme-studio' && /fabric|garment|apparel|manufacturer|sourcing|trim/i.test(k)) return 6;

  return 4;
}

function getVolumeFactor(searchVolume = 0) {
  const sv = Number(searchVolume) || 0;

  if (sv >= 10000) return 1.35;
  if (sv >= 5000) return 1.2;
  if (sv >= 2000) return 1.05;
  if (sv >= 500) return 0.9;
  if (sv >= 100) return 0.75;
  if (sv >= 20) return 0.6;
  return 0.45;
}

function getIntentModifier(intent = 'mixed', channelKey = '') {
  const normalized = normalizeIntent(intent);

  // Strong bias toward cash-driving intent for Studio
  if (channelKey === 'studio_production' || channelKey === 'studio_development') {
    if (normalized === 'buyer') return 1.35;
    if (normalized === 'commercial') return 1.15;
    if (normalized === 'commercial investigation') return 1.0;
    if (normalized === 'research') return 0.75;
    if (normalized === 'informational' || normalized === 'educational') return 0.45;
    return 0.65;
  }

  // Digital assets can monetize informational traffic better
  if (channelKey === 'digital_assets') {
    if (normalized === 'buyer') return 1.0;
    if (normalized === 'commercial') return 1.15;
    if (normalized === 'commercial investigation') return 1.05;
    if (normalized === 'research') return 0.85;
    if (normalized === 'informational' || normalized === 'educational') return 0.8;
    return 0.8;
  }

  // BOMMESPORT can tolerate more research intent, but still not pure fluff
  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    if (normalized === 'buyer') return 1.1;
    if (normalized === 'commercial') return 1.15;
    if (normalized === 'commercial investigation') return 1.05;
    if (normalized === 'research') return 0.9;
    if (normalized === 'informational' || normalized === 'educational') return 0.55;
    return 0.75;
  }

  return 1.0;
}

function getPageTypeModifier(pageType = '', opportunityType = '', channelKey = '') {
  const combined = `${pageType} ${opportunityType}`.toLowerCase();

  if (channelKey === 'studio_production' || channelKey === 'studio_development') {
    if (combined.includes('landing')) return 1.3;
    if (combined.includes('comparison')) return 1.1;
    if (combined.includes('directory')) return 0.95;
    if (combined.includes('tool')) return 0.7;
    if (combined.includes('article')) return 0.65;
  }

  if (channelKey === 'digital_assets') {
    if (combined.includes('downloadable asset')) return 1.3;
    if (combined.includes('tool')) return 0.8;
    if (combined.includes('article')) return 0.8;
  }

  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    if (combined.includes('landing')) return 1.1;
    if (combined.includes('comparison')) return 1.15;
    if (combined.includes('article')) return 0.85;
  }

  return 1.0;
}

function getKeywordPenalty(keyword = '', channelKey = '', businessContext = 'bomme-studio') {
  const k = String(keyword).toLowerCase();

  // Penalize low-intent fabric glossary traffic for Studio if it lacks commercial bridge
  if (
    businessContext === 'bomme-studio' &&
    channelKey === 'studio_production' &&
    /fabric by the yard|cotton voile|lining fabric|sheer cotton fabric|disney fabric|winter holiday fabric|strawberry fabric|purple lace fabric|theatre fabric/i.test(k)
  ) {
    return 0.45;
  }

  // Penalize decorative / hobbyist fabric traffic
  if (
    /joann|quilting|upholstery|craft fabric|legendary toadstools fabric|fabric by the yard/i.test(k)
  ) {
    return 0.35;
  }

  return 1.0;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function calculateOpportunityScore({
  channelKey,
  keyword = '',
  intent = 'mixed',
  opportunityType = '',
  pageType = '',
  estimatedRevenue = null,
  searchVolume = 0,
  businessContext = 'bomme-studio'
}) {
  const channel = BUSINESS_CONFIG.channels[channelKey];
  if (!channel) {
    throw new Error(`Unknown channelKey: ${channelKey}`);
  }

  const normalizedIntent = normalizeIntent(intent);
  const difficultyKey = normalizeDifficulty(opportunityType, pageType);
  const difficultyWeight = BUSINESS_CONFIG.difficultyWeights[difficultyKey] ?? 3;
  const timeHorizon = estimateTimeHorizon(opportunityType, pageType, channelKey);
  const timeWeight = BUSINESS_CONFIG.timeHorizonWeights[timeHorizon] ?? 1.0;

  const revenueBase = Number.isFinite(Number(estimatedRevenue))
    ? Number(estimatedRevenue)
    : channel.avgRevenue;

  const businessFit = estimateBusinessFit({
    keyword,
    channelKey,
    businessContext
  });

  const volumeFactor = getVolumeFactor(searchVolume);
  const intentModifier = getIntentModifier(normalizedIntent, channelKey);
  const pageTypeModifier = getPageTypeModifier(pageType, opportunityType, channelKey);
  const keywordPenalty = getKeywordPenalty(keyword, channelKey, businessContext);

  // Core business-weighted score before compression
  const raw =
    revenueBase *
    channel.margin *
    channel.channelPriority *
    channel.cashflowModifier *
    (businessFit / 10) *
    volumeFactor *
    intentModifier *
    pageTypeModifier *
    keywordPenalty *
    timeWeight;

  // More meaningful penalty for difficult work
  const adjusted = raw / Math.pow(difficultyWeight, 1.15);

  // Wider score spread
  const score = clamp(Math.round(Math.sqrt(adjusted) / 6), 1, 100);

  let priority = 'low';
  if (score >= 60) priority = 'high';
  else if (score >= 30) priority = 'medium';

  return {
    score,
    priority,
    channel: channel.label,
    channelKey,
    margin: channel.margin,
    cashflowModifier: channel.cashflowModifier,
    normalizedIntent,
    intentModifier,
    difficultyKey,
    difficultyWeight,
    timeHorizon,
    timeWeight,
    businessFit,
    volumeFactor,
    pageTypeModifier,
    keywordPenalty,
    revenueBase,
    raw,
    adjusted
  };
}
