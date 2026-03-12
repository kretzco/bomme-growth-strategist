import axios from 'axios';
import { calculateOpportunityScore } from './_scoring.js';

function getAuthHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD environment variables.');
  }

  const token = Buffer.from(`${login}:${password}`).toString('base64');
  return `Basic ${token}`;
}

function inferIntent(keyword = '') {
  const k = String(keyword).toLowerCase();

  if (
    /manufacturer|manufacturing|private label|supplier|production|cut and sew|full package|factory|wholesale/i.test(k)
  ) {
    return 'buyer';
  }

  if (
    /best|top|vs|compare|comparison|cost|pricing|price|review|reviews|near me/i.test(k)
  ) {
    return 'commercial';
  }

  if (
    /how to|guide|what is|meaning|definition|explained|learn/i.test(k)
  ) {
    return 'informational';
  }

  if (
    /ideas|inspiration|trend|trends/i.test(k)
  ) {
    return 'research';
  }

  return 'mixed';
}

function classifyPageTypeFromKeyword(keyword = '') {
  const k = String(keyword).toLowerCase();

  if (/vs|compare|comparison/.test(k)) return 'comparison page';
  if (/template|checklist|planner|calendar|guide|costing/.test(k)) return 'downloadable asset';
  if (/calculator|tool|estimator|generator/.test(k)) return 'tool';
  if (/directory|list of|suppliers|manufacturers/.test(k)) return 'directory';
  if (/manufacturer|private label|production|sampling|development|tech pack/.test(k)) return 'landing page';
  if (/what is|meaning|definition|explained/.test(k)) return 'article';

  return 'article';
}

function classifyOpportunityFromKeyword(keyword = '', businessContext = 'bomme-studio') {
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

function detectSerpPattern(competitors = []) {
  const counts = {
    comparison: 0,
    guide: 0,
    article: 0,
    landing: 0,
    directory: 0,
    tool: 0
  };

  for (const item of competitors) {
    const text = `${item.title || ''} ${item.description || ''} ${item.url || ''}`.toLowerCase();

    if (/vs|compare|comparison/.test(text)) counts.comparison += 1;
    if (/guide|how to|explained|what is/.test(text)) counts.guide += 1;
    if (/directory|list of|suppliers|manufacturers/.test(text)) counts.directory += 1;
    if (/calculator|tool|estimator|generator/.test(text)) counts.tool += 1;
    if (/manufacturer|private label|production|services|factory/.test(text)) counts.landing += 1;
    if (!/vs|compare|comparison|guide|how to|explained|what is|directory|list of|suppliers|manufacturers|calculator|tool|estimator|generator|manufacturer|private label|production|services|factory/.test(text)) {
      counts.article += 1;
    }
  }

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'article';
  return { counts, dominant };
}

function getRecommendationType({ dominantSerpType, keyword = '' }) {
  const k = String(keyword).toLowerCase();

  if (/vs|compare|comparison/.test(k)) {
    return {
      action: 'build_or_expand_comparison_page',
      recommended_page_type: 'comparison page',
      opportunity_type: 'comparison'
    };
  }

  if (/template|checklist|planner|calendar|guide|costing/.test(k)) {
    return {
      action: 'build_digital_asset',
      recommended_page_type: 'downloadable asset',
      opportunity_type: 'digital asset'
    };
  }

  if (/manufacturer|private label|production|sampling|development|tech pack/.test(k)) {
    return {
      action: 'build_or_improve_landing_page',
      recommended_page_type: 'landing page',
      opportunity_type: 'lead generation'
    };
  }

  if (dominantSerpType === 'comparison') {
    return {
      action: 'build_or_expand_comparison_page',
      recommended_page_type: 'comparison page',
      opportunity_type: 'comparison'
    };
  }

  if (dominantSerpType === 'landing') {
    return {
      action: 'build_or_improve_landing_page',
      recommended_page_type: 'landing page',
      opportunity_type: 'lead generation'
    };
  }

  if (dominantSerpType === 'directory') {
    return {
      action: 'build_directory_or_list_resource',
      recommended_page_type: 'directory',
      opportunity_type: 'directory'
    };
  }

  if (dominantSerpType === 'tool') {
    return {
      action: 'consider_tool_or_calculator',
      recommended_page_type: 'tool',
      opportunity_type: 'tool'
    };
  }

  return {
    action: 'expand_or_reposition_article',
    recommended_page_type: 'article',
    opportunity_type: 'seo content'
  };
}

function getRecommendedReason({ channelKey, cashflowModifier, margin }) {
  if (cashflowModifier >= 1 && margin >= 0.8) return 'high-margin direct cashflow';
  if (cashflowModifier >= 1) return 'direct cashflow';
  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    return 'strategic validation and partner confidence';
  }
  return 'longer-term leverage';
}

function estimateGapSignals({ targetUrl = '', competitors = [] }) {
  const target = String(targetUrl).toLowerCase();

  const topDomains = competitors.slice(0, 5).map(c => c.domain).filter(Boolean);
  const topTitles = competitors.slice(0, 5).map(c => c.title).filter(Boolean);

  return {
    competitor_count: competitors.length,
    top_domains: topDomains,
    top_titles: topTitles,
    target_appears_in_serp: competitors.some(c => String(c.url || '').toLowerCase() === target)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      url,
      target_keyword,
      location_code = 2840,
      language_code = 'en',
      depth = 10,
      business_context = 'bomme-studio'
    } = req.body || {};

    if (!url || !target_keyword) {
      return res.status(400).json({ error: 'url and target_keyword are required.' });
    }

    const payload = [{
      keyword: target_keyword,
      location_code,
      language_code,
      device: 'desktop',
      os: 'windows',
      depth
    }];

    const response = await axios.post(
      'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
      payload,
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const items = response.data?.tasks?.[0]?.result?.[0]?.items || [];

    const competitors = items.map((item) => ({
      rank: item.rank_group,
      type: item.type,
      title: item.title,
      url: item.url,
      domain: item.domain,
      description: item.description
    }));

    const serpPattern = detectSerpPattern(competitors);
    const recommendation = getRecommendationType({
      dominantSerpType: serpPattern.dominant,
      keyword: target_keyword
    });

    const intent = inferIntent(target_keyword);
    const channelKey = pickChannelKey(target_keyword, business_context);
    const scoring = calculateOpportunityScore({
      channelKey,
      keyword: target_keyword,
      intent,
      opportunityType: recommendation.opportunity_type,
      pageType: recommendation.recommended_page_type,
      businessContext: business_context,
      searchVolume: 100
    });

    const gapSignals = estimateGapSignals({
      targetUrl: url,
      competitors
    });

    const recommendations = [
      {
        action: recommendation.action,
        recommended_page_type: recommendation.recommended_page_type,
        opportunity_type: recommendation.opportunity_type,
        channel_key: channelKey,
        channel_label: scoring.channel,
        priority_score: scoring.score,
        priority: scoring.priority,
        time_horizon: scoring.timeHorizon,
        difficulty_key: scoring.difficultyKey,
        cashflow_modifier: scoring.cashflowModifier,
        margin: scoring.margin,
        business_fit: scoring.businessFit,
        recommended_reason: getRecommendedReason({
          channelKey,
          cashflowModifier: scoring.cashflowModifier,
          margin: scoring.margin
        })
      }
    ];

    return res.status(200).json({
      target_url: url,
      target_keyword,
      intent,
      serp_pattern: serpPattern,
      gap_signals: gapSignals,
      competitors,
      recommendations
    });
  } catch (error) {
    const details = error.response?.data || error.message;
    return res.status(500).json({ error: 'DataForSEO request failed', details });
  }
}
