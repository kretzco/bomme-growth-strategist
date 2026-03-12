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
    /manufacturer|manufacturing|private label|supplier|production|cut and sew|full package|factory|wholesale|sample maker|production partner/i.test(k)
  ) {
    return 'buyer';
  }

  if (
    /best|top|vs|compare|comparison|cost|pricing|price|review|reviews|near me|moq|lead time/i.test(k)
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

function isRetailFabricQuery(keyword = '') {
  const k = String(keyword).toLowerCase();

  return (
    /fabric by the yard|quilting fabric|upholstery fabric|craft fabric|joann|jo-ann|joanns|etsy fabric|disney fabric|holiday fabric|theatre fabric|curtain liner|shower curtain liner|legendary toadstools fabric|purple lace fabric|eyelash lace fabric|online fabric shops|fabric shops in my area|farmhouse fabric/i.test(k)
  );
}

function isFabricEducationKeyword(keyword = '') {
  const k = String(keyword).toLowerCase();

  return (
    /fabric|textile|knit fabric|woven fabric|cotton voile|french terry|jersey knit|rib knit|interlock|lining fabric|cotton lining fabric|sheer cotton fabric|fabric types|fabric properties|gsm|fabric weight|material guide/i.test(k)
  );
}

function isManufacturingFabricQuery(keyword = '') {
  const k = String(keyword).toLowerCase();

  return (
    /fabric supplier|fabric sourcing|bulk fabric|wholesale fabric|fabric mill|textile mill|fabric manufacturer|fabric for clothing brand|apparel fabric supplier|custom textile production|sourcing fabric for production/i.test(k)
  );
}

function classifyOpportunity(keyword = '', businessContext = 'bomme-studio', channelKey = '') {
  const k = String(keyword).toLowerCase();

  if (/vs|compare|comparison/.test(k)) return 'comparison';
  if (/template|checklist|planner|calendar|guide|costing|worksheet|spreadsheet/.test(k)) return 'digital asset';
  if (/calculator|tool|estimator|generator/.test(k)) return 'tool';
  if (/directory|list of|suppliers|manufacturers|database/.test(k)) return 'directory';

  if (businessContext === 'bommesport') {
    if (/hoodie|sweatshirt|jogger|blank|oversized|heavyweight/.test(k)) return 'product discovery';
    return 'seo content';
  }

  if (channelKey === 'studio_development') return 'lead generation';
  if (channelKey === 'studio_production') return 'lead generation';
  if (channelKey === 'digital_assets') return 'digital asset';
  if (channelKey === 'seo_authority') return 'seo content';

  return 'seo content';
}

function classifyPageType(keyword = '', channelKey = '') {
  const k = String(keyword).toLowerCase();

  if (/vs|compare|comparison/.test(k)) return 'comparison page';
  if (/template|checklist|planner|calendar|guide|costing|worksheet|spreadsheet/.test(k)) return 'downloadable asset';
  if (/calculator|tool|estimator|generator/.test(k)) return 'tool';
  if (/directory|list of|suppliers|manufacturers|database/.test(k)) return 'directory';

  if (channelKey === 'studio_production' || channelKey === 'studio_development') {
    return 'landing page';
  }

  return 'article';
}

function pickChannelKey(keyword = '', businessContext = 'bomme-studio') {
  const k = String(keyword).toLowerCase();

  if (businessContext === 'bommesport') {
    if (/amazon|marketplace/i.test(k)) return 'bommesport_amazon';
    return 'bommesport_dtc';
  }

  if (/sample|sampling|prototype|tech pack|development|patternmaking|fit sample/i.test(k)) {
    return 'studio_development';
  }

  if (/template|checklist|planner|calendar|guide|costing|worksheet|spreadsheet/i.test(k)) {
    return 'digital_assets';
  }

  if (isManufacturingFabricQuery(k)) {
    return 'studio_production';
  }

  if (
    /clothing manufacturer|apparel manufacturer|garment manufacturer|private label manufacturer|cut and sew manufacturer|full package manufacturer|full package production|clothing factory|production partner|apparel production|private label clothing/i.test(k)
  ) {
    return 'studio_production';
  }

  if (isFabricEducationKeyword(k)) {
    return 'seo_authority';
  }

  return 'studio_production';
}

function priorityLabel(score) {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function recommendedReason({ channelKey, cashflowModifier, margin }) {
  if (channelKey === 'seo_authority') {
    return 'authority-building traffic with indirect monetization potential';
  }

  if (cashflowModifier >= 1 && margin >= 0.8) return 'high-margin direct cashflow';
  if (cashflowModifier >= 1) return 'direct cashflow';

  if (channelKey === 'bommesport_dtc' || channelKey === 'bommesport_amazon') {
    return 'strategic validation and partner confidence';
  }

  return 'longer-term leverage';
}

function shouldFilterKeyword(keyword = '', businessContext = 'bomme-studio') {
  if (businessContext === 'bommesport') return false;
  return isRetailFabricQuery(keyword);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      seed_keyword = [],
      location_code = 2840,
      language_code = 'en',
      limit = 15,
      business_context = 'bomme-studio',
      existing_domain = business_context === 'bommesport'
        ? 'bommesport.com'
        : 'bommestudio.com'
    } = req.body || {};

    if (!Array.isArray(seed_keyword) || seed_keyword.length === 0) {
      return res.status(400).json({ error: 'seed_keyword must be a non-empty array.' });
    }

    if (seed_keyword.length > 1) {
      return res.status(400).json({
        error: 'Use one seed keyword per request for now to avoid DataForSEO timeouts.'
      });
    }

    const safeLimit = Math.min(Number(limit) || 15, 15);

    const payload = [{
      keywords: seed_keyword,
      location_code,
      language_code,
      include_seed_keyword: true,
      limit: safeLimit
    }];

    const response = await axios.post(
      'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live',
      payload,
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json'
        },
        timeout: 90000
      }
    );

    const items = response.data?.tasks?.[0]?.result?.[0]?.items || [];

    const keywords = items
      .map((item) => {
        const keyword = item.keyword || '';

        if (!keyword || shouldFilterKeyword(keyword, business_context)) {
          return null;
        }

        const searchVolume = item.keyword_info?.search_volume ?? 0;
        const cpc = item.keyword_info?.cpc ?? null;
        const competitionLevel = item.keyword_info?.competition_level ?? null;
        const keywordDifficulty = item.keyword_properties?.keyword_difficulty ?? null;
        const categories = item.keyword_info?.categories ?? [];

        const intent = inferIntent(keyword);
        const channelKey = pickChannelKey(keyword, business_context);
        const opportunityType = classifyOpportunity(keyword, business_context, channelKey);
        const pageType = classifyPageType(keyword, channelKey);

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

        const domainAdjustment = domainPresent ? -10 : 6;
        const adjustedScore = Math.max(
          1,
          Math.min(100, scoring.score + domainAdjustment)
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
          volume_factor: scoring.volumeFactor,
          intent_modifier: scoring.intentModifier,
          page_type_modifier: scoring.pageTypeModifier,
          keyword_penalty: scoring.keywordPenalty,
          recommended_reason: recommendedReason({
            channelKey,
            cashflowModifier: scoring.cashflowModifier,
            margin: scoring.margin
          }),

          domain_present: domainPresent
        };
      })
      .filter(Boolean);

    keywords.sort((a, b) => b.priority_score - a.priority_score);

    return res.status(200).json({
      business_context,
      existing_domain,
      seed_keyword,
      limit: safeLimit,
      keywords
    });
  } catch (error) {
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      String(error.message || '').toLowerCase().includes('timeout');

    return res.status(500).json({
      error: 'DataForSEO request failed',
      message: error.message,
      status: error.response?.status || null,
      data: error.response?.data || null,
      suggestion: isTimeout
        ? 'Try one seed keyword per request and keep limit at 15 or lower.'
        : null
    });
  }
}
