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

function cleanTitle(title = '') {
  return String(title)
    .replace(/\s+/g, ' ')
    .replace(/\|.*$/, '')
    .replace(/-.*$/, '')
    .trim();
}

function extractSerpPatterns(competitors = []) {
  const patterns = {
    comparison: 0,
    guide: 0,
    cost: 0,
    location: 0,
    list: 0,
    manufacturer: 0,
    benefits: 0
  };

  const titleFragments = [];

  for (const c of competitors.slice(0, 10)) {
    const title = cleanTitle(c.title || '');
    const lower = title.toLowerCase();

    if (!title) continue;
    titleFragments.push(title);

    if (/vs|compare|comparison/.test(lower)) patterns.comparison += 1;
    if (/guide|how to|explained|what is/.test(lower)) patterns.guide += 1;
    if (/cost|price|pricing/.test(lower)) patterns.cost += 1;
    if (/los angeles|usa|us|american|california/.test(lower)) patterns.location += 1;
    if (/best|top|\d+\s/.test(lower)) patterns.list += 1;
    if (/manufacturer|factory|private label|production/.test(lower)) patterns.manufacturer += 1;
    if (/benefits|pros|cons|features/.test(lower)) patterns.benefits += 1;
  }

  const dominantPatterns = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0)
    .slice(0, 3)
    .map(([name]) => name);

  return {
    patterns,
    dominant_patterns: dominantPatterns,
    sample_titles: titleFragments.slice(0, 5)
  };
}

function buildTitleCandidates({
  keyword,
  intent,
  pageType,
  businessContext,
  serpPatterns
}) {
  const k = String(keyword).trim();
  const lower = k.toLowerCase();
  const titles = [];

  const add = (title, angle, why) => {
    if (!title) return;
    if (!titles.find(t => t.title.toLowerCase() === title.toLowerCase())) {
      titles.push({ title, angle, why_it_works: why });
    }
  };

  if (pageType === 'comparison page') {
    add(
      `${k}: Cost, Quality, and Production Tradeoffs`,
      'comparison',
      'Matches commercial investigation intent and frames the topic around decision-making.'
    );
    add(
      `${k} for Apparel Brands: Which Option Makes More Sense?`,
      'decision-stage comparison',
      'Moves beyond a generic comparison and speaks to brand operators making production choices.'
    );
  }

  if (pageType === 'landing page') {
    add(
      `${k} for Premium Apparel Brands`,
      'commercial landing page',
      'Aligns with high-intent search while keeping a premium positioning.'
    );
    add(
      `${k}: What Brands Need to Know Before Choosing a Production Partner`,
      'commercial education',
      'Blends conversion intent with authority-building.'
    );
    add(
      `${k} in Los Angeles and the USA: Cost, MOQ, and Fit Considerations`,
      'location + buyer intent',
      'Adds practical buying criteria instead of generic service phrasing.'
    );
  }

  if (pageType === 'downloadable asset') {
    add(
      `${k} for Fashion Brands and Product Developers`,
      'asset-led SEO',
      'Frames the page as a useful working resource, not just content.'
    );
    add(
      `${k}: Free Download for Apparel Costing, Planning, or Sourcing`,
      'lead magnet',
      'Introduces a conversion hook directly into the title angle.'
    );
  }

  if (pageType === 'directory') {
    add(
      `${k}: Suppliers, Manufacturers, and Sourcing Options`,
      'directory',
      'Clarifies the utility of the page and expands relevant decision entities.'
    );
    add(
      `${k}: Best Options by Category, Region, and Production Need`,
      'decision resource',
      'Signals breadth and structured comparison value.'
    );
  }

  if (pageType === 'tool') {
    add(
      `${k}: Free Calculator for Apparel Brands`,
      'tool-led SEO',
      'Makes the interactive nature clear and improves click qualification.'
    );
    add(
      `${k}: Estimate Cost, MOQ, and Production Fit`,
      'utility',
      'Connects the tool to high-value business decisions.'
    );
  }

  if (pageType === 'article') {
    if (intent === 'buyer') {
      add(
        `${k}: Costs, Capabilities, and What to Look For`,
        'buyer education',
        'Serves commercial readers better than a generic explainer.'
      );
      add(
        `${k} for Premium Apparel Production`,
        'commercial authority',
        'Connects the topic to BOMME’s positioning and buyer intent.'
      );
    } else if (intent === 'commercial') {
      add(
        `${k}: Cost, Quality, and Best Use Cases`,
        'commercial investigation',
        'Adds practical evaluation criteria that support clicks and conversions.'
      );
      add(
        `${k} for Brands: Pros, Cons, and Production Considerations`,
        'decision support',
        'Targets operators making real sourcing or product choices.'
      );
    } else {
      add(
        `${k}: Properties, Uses, and Production Considerations`,
        'authority article',
        'More useful than “complete guide” because it signals structured practical value.'
      );
      add(
        `${k} in Apparel Manufacturing: What Actually Matters`,
        'editorial authority',
        'Positions the article around expertise rather than beginner fluff.'
      );
    }
  }

  if (businessContext === 'bommesport' && /hoodie|sweatshirt|jogger|blank|oversized|heavyweight/i.test(lower)) {
    add(
      `${k} for Heavyweight Streetwear and Premium Blanks`,
      'product discovery',
      'Aligns the topic with BOMMESPORT’s positioning instead of generic ecommerce copy.'
    );
    add(
      `${k}: Fit, Weight, and Quality Signals That Matter`,
      'commercial product education',
      'Improves relevance for buyers comparing premium basics.'
    );
  }

  if (serpPatterns.includes('cost')) {
    add(
      `${k}: Cost, Pricing, and Production Factors`,
      'serp-aligned pricing angle',
      'Reflects a pattern already validated in the SERP.'
    );
  }

  if (serpPatterns.includes('manufacturer')) {
    add(
      `${k}: Manufacturer, MOQ, and Production Considerations`,
      'serp-aligned manufacturer angle',
      'Matches a manufacturer-heavy SERP while giving more useful detail.'
    );
  }

  if (serpPatterns.includes('list')) {
    add(
      `Best ${k} Options for Brands, Sourcing Teams, and Product Developers`,
      'list / roundup',
      'Leans into list-style CTR patterns when that format already dominates.'
    );
  }

  return titles.slice(0, 8);
}

function buildMetaTitle(primaryTitle = '', keyword = '') {
  const k = String(keyword).trim();
  if (primaryTitle.length <= 60) return primaryTitle;
  const fallback = `${k} | Cost, Production, and Buying Guide`;
  return fallback.slice(0, 60);
}

function buildSlug(keyword = '', pageType = '') {
  let slug = String(keyword)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  if (pageType === 'comparison page' && !slug.includes('vs')) {
    slug = `${slug}-comparison`;
  }

  return `/${slug}`;
}

function buildSections(keyword = '', pageType = '', businessContext = 'bomme-studio') {
  const base = [
    `What ${keyword} is and why it matters`,
    `${keyword} cost, pricing, or value drivers`,
    `${keyword} production or sourcing considerations`,
    `Common mistakes and decision criteria`,
    `How this connects to the right BOMME offer`
  ];

  if (pageType === 'comparison page') {
    return [
      `${keyword}: key differences and use cases`,
      `Cost, quality, and performance tradeoffs`,
      `Which option works best by product type`,
      `Production implications and MOQ considerations`,
      `Recommended next step for sourcing or manufacturing`
    ];
  }

  if (pageType === 'landing page') {
    return [
      `Who this service is for`,
      `Capabilities, MOQ, and production fit`,
      `Timeline, costs, and onboarding considerations`,
      `Why brands choose this production approach`,
      `Call to action and qualification path`
    ];
  }

  if (pageType === 'downloadable asset') {
    return [
      `What the asset helps solve`,
      `Who should use it`,
      `What is included`,
      `How to apply it in production or planning`,
      `CTA to download or request related support`
    ];
  }

  if (businessContext === 'bommesport') {
    return [
      `${keyword} fit, weight, and quality signals`,
      `Who it is best for`,
      `Comparison to other premium options`,
      `How to choose the right BOMMESPORT product`,
      `CTA to shop or compare`
    ];
  }

  return base;
}

function buildInternalLinks({ businessContext, pageType, keyword }) {
  if (businessContext === 'bommesport') {
    return [
      'Core product collection pages',
      'Relevant category / comparison pages',
      'Amazon product pages where appropriate',
      'Brand story or quality standard pages'
    ];
  }

  const links = [
    'Homepage money page',
    'Relevant BOMME Academy guide',
    'Relevant service landing page'
  ];

  if (/fabric|textile|material/i.test(keyword)) {
    links.push('Fabric Dictionary hub');
  }

  if (pageType === 'downloadable asset') {
    links.push('Related sourcing or costing guide pages');
  }

  return links;
}

function buildMonetizationHook({ businessContext, pageType, keyword }) {
  if (businessContext === 'bommesport') {
    return 'Drive users into product comparison, bundle logic, and direct product pages.';
  }

  if (pageType === 'downloadable asset') {
    return 'Use this page to capture email leads or sell a high-margin digital product.';
  }

  if (/fabric|textile|material/i.test(keyword)) {
    return 'Bridge educational traffic into sourcing guidance, BOMME services, or downloadable assets.';
  }

  return 'Use the page to qualify traffic into development or production inquiries.';
}

function wordCountByPageType(pageType = '') {
  if (pageType === 'landing page') return 1400;
  if (pageType === 'comparison page') return 1800;
  if (pageType === 'directory') return 2200;
  if (pageType === 'downloadable asset') return 1200;
  if (pageType === 'tool') return 1000;
  return 1700;
}

function titleFeedbackPlaceholder(candidates = []) {
  return candidates.map((c) => ({
    ...c,
    feedback_ready: true,
    future_signals: {
      approved: null,
      ctr_signal: null,
      conversion_signal: null
    }
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      keyword,
      competitors = [],
      business_context = 'bomme-studio'
    } = req.body || {};

    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required.' });
    }

    const intent = inferIntent(keyword);
    const pageType = classifyPageType(keyword);
    const opportunityType = classifyOpportunity(keyword, business_context);
    const channelKey = pickChannelKey(keyword, business_context);

    const serpInsights = extractSerpPatterns(competitors);
    const titleCandidates = buildTitleCandidates({
      keyword,
      intent,
      pageType,
      businessContext: business_context,
      serpPatterns: serpInsights.dominant_patterns
    });

    const scored = calculateOpportunityScore({
      channelKey,
      keyword,
      intent,
      opportunityType,
      pageType,
      businessContext: business_context,
      searchVolume: 100
    });

    const enrichedTitles = titleFeedbackPlaceholder(titleCandidates);
    const primaryTitle = enrichedTitles[0]?.title || `${keyword}: Cost, Use Cases, and Decision Factors`;
    const metaTitle = buildMetaTitle(primaryTitle, keyword);
    const slug = buildSlug(keyword, pageType);

    const brief = {
      keyword,
      intent,
      page_type: pageType,
      opportunity_type: opportunityType,
      channel_key: channelKey,
      channel_label: scored.channel,
      priority_score: scored.score,
      priority: scored.priority,
      time_horizon: scored.timeHorizon,

      title_recommendations: enrichedTitles,
      recommended_h1: primaryTitle,
      recommended_meta_title: metaTitle,
      recommended_slug: slug,

      sections: buildSections(keyword, pageType, business_context),
      recommended_word_count: wordCountByPageType(pageType),
      internal_links_to_add: buildInternalLinks({
        businessContext: business_context,
        pageType,
        keyword
      }),
      monetization_hook: buildMonetizationHook({
        businessContext: business_context,
        pageType,
        keyword
      }),

      serp_insights: serpInsights,
      improvement_notes: [
        'Avoid generic “complete guide” phrasing unless the SERP strongly favors it.',
        'Bias toward titles that reflect a decision, outcome, or production relevance.',
        'Keep commercial relevance visible when the keyword can support leads or revenue.'
      ]
    };

    return res.status(200).json({ brief });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to build content brief',
      details: error.message
    });
  }
}
