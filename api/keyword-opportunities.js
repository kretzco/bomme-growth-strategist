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

function priorityLabel(score) {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function recommendedReason({ channelKey, cashflowModifier, margin }) {
  if (cashflowModifier >= 1 && margin >= 0.8) return 'high-margin direct cashflow';
  if (cashflowModifier >= 1) return 'direct cashflow';
  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    return 'strategic validation and partner confidence';
  }
  return 'longer-term leverage';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      seed_keywords = [],
      location_code = 2840,
      language_code = 'en',
      limit = 50,
      business_context = 'bomme-studio',
      existing_domain = business_context === 'bommesport'
        ? 'bommesport.com'
        : 'bommestudio.com'
    } = req.body || {};

    if (!Array.isArray(seed_keywords) || seed_keywords.length === 0) {
      return res.status(400).json({ error: 'seed_keywords must be a non-empty array.' });
    }

    const payload = [{
      keywords: seed_keywords,
      location_code,
      language_code,
      include_seed_keyword: true,
      limit
    }];

    const response = await axios.post(
      'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live',
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

    const keywords = items.map((item) => {
      const keyword = item.keyword || '';
      const searchVolume = item.keyword_info?.search_volume ?? 0;
      const cpc = item.keyword_info?.cpc ?? null;
      const competitionLevel = item.keyword_info?.competition_level ?? null;
      const keywordDifficulty = item.keyword_properties?.keyword_difficulty ?? null;
      const categories = item.keyword_info?.categories ?? [];

      const intent = inferIntent(keyword);
      const opportunityType = classifyOpportunity(keyword, business_context);
      const pageType = classifyPageType(keyword);
      const channelKey = pickChannelKey(keyword, business_context);

      const domainPresent =
        Array.isArray(item.serp_info?.organic) &&
        item.serp_info.organic.some((r) => String(r.domain || '').includes(existing_domain));

      const scoring = calculateOpportunityScore({
        channelKey,
        keyword,
        intent,
        opportunityType,
        pageType,
        searchVolume,
        businessContext: business_context
      });

      const adjustedScore = Math.max(
        1,
        Math.min(100, scoring.score + (domainPresent ? -10 : 6))
      );

      return {
        keyword,
        search_volume: searchVolume,
        competition_level: competitionLevel,
        keyword_difficulty: keywordDifficulty,
        cpc,
        categories,

        intent,
        opportunity_type: opportunityType,
        page_type: pageType,

        channel_key: channelKey,
        channel_label: scoring.channel,

        priority_score: adjustedScore,
        priority: priorityLabel(adjustedScore),

        business_fit: scoring.businessFit,
        time_horizon: scoring.timeHorizon,
        difficulty_key: scoring.difficultyKey,
        difficulty_weight: scoring.difficultyWeight,
        cashflow_modifier: scoring.cashflowModifier,
        margin: scoring.margin,
        revenue_base: scoring.revenueBase,
        recommended_reason: recommendedReason({
          channelKey,
          cashflowModifier: scoring.cashflowModifier,
          margin: scoring.margin
        }),

        domain_present: domainPresent
      };
    });

    keywords.sort((a, b) => b.priority_score - a.priority_score);

    return res.status(200).json({
      business_context,
      existing_domain,
      keywords
    });
  } catch (error) {
    const details = error.response?.data || error.message;
    return res.status(500).json({ error: 'DataForSEO request failed', details });
  }
}
