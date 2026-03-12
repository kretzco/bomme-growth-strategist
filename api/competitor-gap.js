import { calculateOpportunityScore } from './_scoring.js';

function inferIntent(keyword = '') {
  const k = String(keyword).toLowerCase();

  if (
    /manufacturer|manufacturing|private label|supplier|production|cut and sew|full package|factory|wholesale/i.test(k)
  ) return 'buyer';

  if (
    /best|top|vs|compare|comparison|cost|pricing|price|review|reviews|near me/i.test(k)
  ) return 'commercial';

  if (
    /how to|guide|what is|meaning|definition|explained|learn/i.test(k)
  ) return 'informational';

  if (
    /ideas|inspiration|trend|trends/i.test(k)
  ) return 'research';

  return 'mixed';
}

function pickChannelKey(keyword = '', businessContext = 'bomme-studio') {
  const k = String(keyword).toLowerCase();

  if (businessContext === 'bommesport') {
    if (/amazon|marketplace/.test(k)) return 'bommesport_amazon';
    return 'bommesport_dtc';
  }

  if (/sample|sampling|prototype|tech pack|development/.test(k)) {
    return 'studio_development';
  }

  if (/template|checklist|planner|calendar|guide|costing/.test(k)) {
    return 'digital_assets';
  }

  return 'studio_production';
}

function classifyPageType(keyword = '') {
  const k = String(keyword).toLowerCase();

  if (/vs|compare|comparison/.test(k)) return 'comparison page';
  if (/template|checklist|planner|calendar|guide|costing/.test(k)) return 'downloadable asset';
  if (/calculator|tool|estimator|generator/.test(k)) return 'tool';
  if (/directory|list of|suppliers|manufacturers/.test(k)) return 'directory';
  if (/manufacturer|private label|production|sampling|development|tech pack/.test(k)) return 'landing page';
  if (/what is|meaning|definition|explained/.test(k)) return 'article';

  return 'article';
}

function classifyOpportunity(keyword = '', businessContext = 'bomme-studio') {
  const k = String(keyword).toLowerCase();

  if (/vs|compare|comparison/.test(k)) return 'comparison';
  if (/template|checklist|planner|calendar|guide|costing/.test(k)) return 'digital asset';
  if (/calculator|tool|estimator|generator/.test(k)) return 'tool';
  if (/directory|list of|suppliers|manufacturers/.test(k)) return 'directory';

  if (businessContext === 'bommesport') {
    if (/hoodie|sweatshirt|jogger|blank|oversized|heavyweight/.test(k)) return 'product discovery';
    return 'seo content';
  }

  if (/manufacturer|production|private label|sampling|development|tech pack/.test(k)) {
    return 'lead generation';
  }

  return 'seo content';
}

function textBlob(competitors = []) {
  return competitors
    .map(c => `${c.title || ''} ${c.description || ''} ${c.url || ''}`)
    .join(' ')
    .toLowerCase();
}

function detectFormatGaps(competitors = [], targetKeyword = '') {
  const blob = textBlob(competitors);
  const gaps = [];

  if (!/vs|compare|comparison/.test(blob)) {
    gaps.push('No comparison-style pages appear prominent in the SERP.');
  }

  if (!/directory|list of|suppliers|manufacturers/.test(blob)) {
    gaps.push('No strong directory or list-resource format is visible.');
  }

  if (!/calculator|tool|estimator|generator/.test(blob)) {
    gaps.push('No interactive tool or calculator appears to own the SERP.');
  }

  if (!/template|checklist|planner|calendar|download/.test(blob)) {
    gaps.push('No asset-led or downloadable resource format is visible.');
  }

  if (/manufacturer|production|private label/.test(String(targetKeyword).toLowerCase()) && !/manufacturer|production|private label|factory/.test(blob)) {
    gaps.push('SERP does not appear tightly aligned to manufacturer-intent commercial landing pages.');
  }

  return gaps;
}

function detectIntentGaps(competitors = [], targetKeyword = '') {
  const blob = textBlob(competitors);
  const keyword = String(targetKeyword).toLowerCase();
  const gaps = [];

  const keywordLooksCommercial = /manufacturer|production|private label|supplier|factory|wholesale|cost|pricing|vs|compare/.test(keyword);

  if (keywordLooksCommercial && /what is|guide|explained|definition/.test(blob) && !/cost|pricing|compare|manufacturer|private label/.test(blob)) {
    gaps.push('SERP leans educational despite commercial or buyer-adjacent query intent.');
  }

  if (!/cost|pricing|price/.test(blob) && /cost|pricing|price/.test(keyword)) {
    gaps.push('Pricing or cost discussion appears underrepresented relative to query intent.');
  }

  if (!/pros|cons|best|top|compare|comparison/.test(blob) && /best|top|vs|compare|comparison/.test(keyword)) {
    gaps.push('Decision-stage comparison framing is missing or weak.');
  }

  return gaps;
}

function detectTopicGaps(competitors = [], targetKeyword = '') {
  const blob = textBlob(competitors);
  const gaps = [];

  if (!/moq|minimum order/.test(blob)) {
    gaps.push('MOQ and minimum-order considerations are not prominently addressed.');
  }

  if (!/timeline|lead time|turnaround/.test(blob)) {
    gaps.push('Lead times and production timeline expectations appear undercovered.');
  }

  if (!/quality|gsm|weight|material|fabric/.test(blob) && /fabric|hoodie|sweatshirt|garment|apparel/.test(String(targetKeyword).toLowerCase())) {
    gaps.push('Material, weight, or quality criteria are not emphasized strongly enough.');
  }

  if (!/sampling|prototype|development|tech pack/.test(blob) && /manufacturer|production|apparel|garment/.test(String(targetKeyword).toLowerCase())) {
    gaps.push('Pre-production workflow topics like sampling or tech packs are weakly covered.');
  }

  if (!/usa|los angeles|california|domestic/.test(blob) && /usa|los angeles|california|domestic/.test(String(targetKeyword).toLowerCase())) {
    gaps.push('Location-specific decision factors appear underrepresented.');
  }

  return gaps;
}

function detectConversionGaps(competitors = [], businessContext = 'bomme-studio') {
  const blob = textBlob(competitors);
  const gaps = [];

  if (!/template|download|checklist|planner|guide/.test(blob)) {
    gaps.push('No obvious lead magnet or downloadable conversion bridge is visible.');
  }

  if (!/quote|contact|consultation|get started|request/.test(blob) && businessContext === 'bomme-studio') {
    gaps.push('Commercial conversion language appears weak or absent.');
  }

  if (!/shop|bundle|compare/.test(blob) && businessContext === 'bommesport') {
    gaps.push('Product comparison or shopping-oriented conversion paths appear weak.');
  }

  return gaps;
}

function detectAuthorityGaps(competitors = []) {
  const blob = textBlob(competitors);
  const gaps = [];

  if (!/data|benchmark|report|study|statistics/.test(blob)) {
    gaps.push('No original data or benchmark-style authority asset appears to dominate.');
  }

  if (!/directory|database|supplier list|manufacturer list/.test(blob)) {
    gaps.push('No strong reference-style directory asset appears to anchor the topic.');
  }

  if (!/tool|calculator|estimator|generator/.test(blob)) {
    gaps.push('No utility-based linkable asset appears present.');
  }

  return gaps;
}

function detectMonetizationGaps(targetKeyword = '', businessContext = 'bomme-studio') {
  const keyword = String(targetKeyword).toLowerCase();
  const gaps = [];

  if (businessContext === 'bomme-studio') {
    if (/fabric|textile|material/.test(keyword)) {
      gaps.push('Traffic could likely be monetized with sourcing guides, costing tools, or production CTAs.');
    }
    if (/manufacturer|production|private label|development|sampling/.test(keyword)) {
      gaps.push('Traffic should likely connect directly into qualification or inquiry flows.');
    }
  }

  if (businessContext === 'bommesport') {
    gaps.push('Traffic may need stronger bridges into product comparisons, bundles, or Amazon validation paths.');
  }

  return gaps;
}

function buildRecommendedActions({
  targetKeyword,
  businessContext,
  formatGaps,
  intentGaps,
  topicGaps,
  conversionGaps,
  authorityGaps,
  monetizationGaps
}) {
  const all = [];

  const addAction = (action, pageType, opportunityType, reason) => {
    all.push({ action, recommended_page_type: pageType, opportunity_type: opportunityType, reason });
  };

  if (formatGaps.some(g => g.includes('comparison'))) {
    addAction(
      'Build a comparison page targeting decision-stage searchers.',
      'comparison page',
      'comparison',
      'Comparison content is often a fast bridge from research traffic to qualified action.'
    );
  }

  if (formatGaps.some(g => g.includes('downloadable'))) {
    addAction(
      'Create a downloadable asset or lead magnet tied to this topic.',
      'downloadable asset',
      'digital asset',
      'This can capture value from traffic even before service conversion happens.'
    );
  }

  if (formatGaps.some(g => g.includes('directory'))) {
    addAction(
      'Create a structured directory or list resource.',
      'directory',
      'directory',
      'Directory-style content can improve authority and serve link-building goals.'
    );
  }

  if (formatGaps.some(g => g.includes('tool'))) {
    addAction(
      'Consider a simple calculator or evaluator tied to this topic.',
      'tool',
      'tool',
      'A utility asset can differentiate the page and improve linkability.'
    );
  }

  if (intentGaps.length > 0) {
    addAction(
      'Reframe the page to better match buyer or commercial intent.',
      'landing page',
      'lead generation',
      'Mismatch between query intent and page type usually suppresses performance.'
    );
  }

  if (topicGaps.some(g => g.includes('MOQ') || g.includes('Lead times') || g.includes('sampling'))) {
    addAction(
      'Expand topic coverage to include practical production decision criteria.',
      'article',
      'seo content',
      'Operational details often separate useful commercial content from thin educational content.'
    );
  }

  if (conversionGaps.length > 0 && businessContext === 'bomme-studio') {
    addAction(
      'Add stronger conversion architecture from content into development or production inquiries.',
      'landing page',
      'lead generation',
      'Traffic without a conversion bridge will not solve runway pressure.'
    );
  }

  if (authorityGaps.length > 0) {
    addAction(
      'Build an authority asset such as a benchmark, dataset, directory, or tool.',
      'directory',
      'directory',
      'Authority assets can compound SEO and link acquisition over time.'
    );
  }

  if (monetizationGaps.length > 0 && businessContext === 'bomme-studio') {
    addAction(
      'Attach a monetization layer such as a sourcing guide, costing template, or downloadable planner.',
      'downloadable asset',
      'digital asset',
      'High-margin digital products can monetize informational traffic quickly.'
    );
  }

  return all;
}

function scoreActions(actions = [], targetKeyword = '', businessContext = 'bomme-studio') {
  return actions.map((item) => {
    const channelKey = pickChannelKey(targetKeyword, businessContext);
    const intent = inferIntent(targetKeyword);

    const scoring = calculateOpportunityScore({
      channelKey,
      keyword: targetKeyword,
      intent,
      opportunityType: item.opportunity_type,
      pageType: item.recommended_page_type,
      businessContext,
      searchVolume: 100
    });

    return {
      ...item,
      channel_key: channelKey,
      channel_label: scoring.channel,
      priority_score: scoring.score,
      priority: scoring.priority,
      time_horizon: scoring.timeHorizon,
      difficulty_key: scoring.difficultyKey,
      cashflow_modifier: scoring.cashflowModifier,
      margin: scoring.margin,
      business_fit: scoring.businessFit
    };
  }).sort((a, b) => b.priority_score - a.priority_score);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      target_keyword,
      competitors = [],
      business_context = 'bomme-studio'
    } = req.body || {};

    if (!target_keyword) {
      return res.status(400).json({ error: 'target_keyword is required.' });
    }

    const formatGaps = detectFormatGaps(competitors, target_keyword);
    const intentGaps = detectIntentGaps(competitors, target_keyword);
    const topicGaps = detectTopicGaps(competitors, target_keyword);
    const conversionGaps = detectConversionGaps(competitors, business_context);
    const authorityGaps = detectAuthorityGaps(competitors);
    const monetizationGaps = detectMonetizationGaps(target_keyword, business_context);

    const rawActions = buildRecommendedActions({
      targetKeyword: target_keyword,
      businessContext: business_context,
      formatGaps,
      intentGaps,
      topicGaps,
      conversionGaps,
      authorityGaps,
      monetizationGaps
    });

    const prioritizedActions = scoreActions(rawActions, target_keyword, business_context);

    return res.status(200).json({
      target_keyword,
      business_context,
      gap_analysis: {
        format_gaps: formatGaps,
        intent_gaps: intentGaps,
        topic_gaps: topicGaps,
        conversion_gaps: conversionGaps,
        authority_gaps: authorityGaps,
        monetization_gaps: monetizationGaps
      },
      prioritized_actions: prioritizedActions,
      notes: [
        'This endpoint is intentionally broader than simple content-gap logic.',
        'It evaluates not just SEO coverage gaps, but monetization and conversion gaps.',
        'The best opportunities are those that fit both the SERP and BOMME’s current cashflow needs.'
      ]
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to analyze competitor gaps',
      details: error.message
    });
  }
}
