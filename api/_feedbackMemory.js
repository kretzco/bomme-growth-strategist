export const FEEDBACK_MEMORY = {
  title_patterns: [
    {
      id: 'comparison-decision',
      pattern_type: 'comparison',
      title_template: '{A} vs {B}: Cost, Quality, and Production Tradeoffs',
      contexts: ['bomme-studio', 'bommesport'],
      page_types: ['comparison page'],
      preferred_for_intents: ['commercial', 'buyer'],
      approved_count: 0,
      rejected_count: 0,
      ctr_signal: 0,
      conversion_signal: 0,
      last_used: null,
      notes: 'Strong for decision-stage searches.'
    },
    {
      id: 'commercial-outcome',
      pattern_type: 'commercial',
      title_template: '{keyword}: Cost, MOQ, and What Brands Need to Know',
      contexts: ['bomme-studio'],
      page_types: ['landing page', 'article'],
      preferred_for_intents: ['buyer', 'commercial'],
      approved_count: 0,
      rejected_count: 0,
      ctr_signal: 0,
      conversion_signal: 0,
      last_used: null,
      notes: 'Good for commercial manufacturing topics.'
    },
    {
      id: 'asset-led',
      pattern_type: 'asset',
      title_template: '{keyword} for Fashion Brands and Product Developers',
      contexts: ['bomme-studio'],
      page_types: ['downloadable asset'],
      preferred_for_intents: ['commercial', 'informational'],
      approved_count: 0,
      rejected_count: 0,
      ctr_signal: 0,
      conversion_signal: 0,
      last_used: null,
      notes: 'Best for templates, planners, and guides.'
    },
    {
      id: 'product-quality-angle',
      pattern_type: 'product',
      title_template: '{keyword}: Fit, Weight, and Quality Signals That Matter',
      contexts: ['bommesport'],
      page_types: ['article', 'landing page'],
      preferred_for_intents: ['commercial', 'research'],
      approved_count: 0,
      rejected_count: 0,
      ctr_signal: 0,
      conversion_signal: 0,
      last_used: null,
      notes: 'Useful for BOMMESPORT product-discovery content.'
    }
  ],

  rejected_phrases: [
    'complete guide to',
    'what is the best',
    'ultimate guide to',
    'everything you need to know'
  ],

  approved_phrases: [
    'cost, moq, and production considerations',
    'for brands and product developers',
    'cost, quality, and tradeoffs',
    'what brands need to know'
  ],

  content_outcomes: [
    // Example record:
    // {
    //   url: '/french-terry-vs-fleece-hoodies',
    //   keyword: 'french terry vs fleece for hoodies',
    //   business_context: 'bomme-studio',
    //   page_type: 'comparison page',
    //   title: 'French Terry vs Fleece for Hoodies: Cost, Weight, and Comfort Compared',
    //   approved: true,
    //   impressions_28d: 0,
    //   clicks_28d: 0,
    //   ctr_28d: 0,
    //   avg_position_28d: 0,
    //   leads_28d: 0,
    //   revenue_28d: 0,
    //   notes: ''
    // }
  ],

  gap_outcomes: [
    // Example record:
    // {
    //   target_keyword: 'los angeles clothing manufacturer',
    //   recommendation: 'Build a commercial landing page',
    //   implemented: false,
    //   business_context: 'bomme-studio',
    //   priority_score: 82,
    //   leads_generated: 0,
    //   revenue_generated: 0,
    //   notes: ''
    // }
  ],

  scoring_overrides: {
    phrase_boosts: {
      'cost': 1.1,
      'moq': 1.15,
      'production': 1.1,
      'for brands': 1.08,
      'comparison': 1.1
    },
    phrase_penalties: {
      'complete guide': 0.8,
      'ultimate guide': 0.75,
      'everything you need to know': 0.7
    }
  }
};

export function getTitlePatternScore(pattern) {
  const approvals = pattern.approved_count || 0;
  const rejections = pattern.rejected_count || 0;
  const ctr = pattern.ctr_signal || 0;
  const conversion = pattern.conversion_signal || 0;

  return (
    approvals * 2 -
    rejections * 2 +
    ctr * 10 +
    conversion * 15
  );
}

export function isRejectedPhrase(title = '') {
  const lower = String(title).toLowerCase();
  return FEEDBACK_MEMORY.rejected_phrases.some((phrase) => lower.includes(phrase));
}

export function getPhraseAdjustment(title = '') {
  const lower = String(title).toLowerCase();
  let multiplier = 1;

  for (const [phrase, boost] of Object.entries(FEEDBACK_MEMORY.scoring_overrides.phrase_boosts)) {
    if (lower.includes(phrase)) multiplier *= boost;
  }

  for (const [phrase, penalty] of Object.entries(FEEDBACK_MEMORY.scoring_overrides.phrase_penalties)) {
    if (lower.includes(phrase)) multiplier *= penalty;
  }

  return multiplier;
}

export function getRelevantTitlePatterns({ businessContext, pageType, intent }) {
  return FEEDBACK_MEMORY.title_patterns
    .filter((pattern) => {
      const contextMatch = pattern.contexts.includes(businessContext);
      const pageTypeMatch = pattern.page_types.includes(pageType);
      const intentMatch = pattern.preferred_for_intents.includes(intent);
      return contextMatch && pageTypeMatch && intentMatch;
    })
    .sort((a, b) => getTitlePatternScore(b) - getTitlePatternScore(a));
}

export function getTopWinningTitles({ businessContext, minCtr = 0.03 }) {
  return FEEDBACK_MEMORY.content_outcomes
    .filter((item) => item.business_context === businessContext && (item.ctr_28d || 0) >= minCtr)
    .sort((a, b) => (b.ctr_28d || 0) - (a.ctr_28d || 0))
    .slice(0, 10);
}
