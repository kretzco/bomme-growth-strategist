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
    if (/clothing manufacturer|apparel manufacturer|private label|cut and sew|full package|production/i.test(k)) return 10;
    if (/sampling|development|tech pack/i.test(k)) return 8;
    return 6;
  }

  if (channelKey === 'studio_development') {
    if (/sample|sampling|prototype|product development|tech pack/i.test(k)) return 10;
    return 6;
  }

  if (channelKey === 'digital_assets') {
    if (/template|checklist|guide|costing|calendar|planner/i.test(k)) return 9;
    return 6;
  }

  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    if (/heavyweight|oversized|hoodie|blank|sweatshirt|jogger/i.test(k)) return 9;
    return 6;
  }

  if (businessContext === 'bomme-studio' && /fabric|garment|apparel|manufacturer|sourcing|trim/i.test(k)) return 8;

  return 5;
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
  const intentWeight = BUSINESS_CONFIG.intentWeights[normalizedIntent] ?? 0.5;

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

  const volumeFactor = Math.min(1.5, Math.max(0.4, Math.log10(Math.max(searchVolume, 10)) / 2));

  const raw =
    revenueBase *
    channel.margin *
    channel.channelPriority *
    channel.cashflowModifier *
    intentWeight *
    timeWeight *
    (businessFit / 10) *
    volumeFactor;

  const adjusted = raw / difficultyWeight;

  // Compress to a usable 1–100 score
  const score = Math.max(1, Math.min(100, Math.round(Math.log10(adjusted + 1) * 22)));

  let priority = 'low';
  if (score >= 70) priority = 'high';
  else if (score >= 45) priority = 'medium';

  return {
    score,
    priority,
    channel: channel.label,
    channelKey,
    margin: channel.margin,
    cashflowModifier: channel.cashflowModifier,
    intentWeight,
    difficultyKey,
    difficultyWeight,
    timeHorizon,
    timeWeight,
    businessFit,
    revenueBase
  };
}
