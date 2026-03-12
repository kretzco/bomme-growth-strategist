import axios from 'axios';
import { calculateOpportunityScore } from './_scoring.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { keywords = [], business_context = 'bomme-studio' } = req.body || {};

  const results = keywords.map(keyword => {
    const channelKey = /hoodie|sweatshirt|jogger|blank/.test(keyword)
      ? 'bommesport_dtc'
      : /template|checklist|planner|calendar|guide/.test(keyword)
      ? 'digital_assets'
      : /sample|development|tech pack/.test(keyword)
      ? 'studio_development'
      : 'studio_production';

    const scoring = calculateOpportunityScore({
      channelKey,
      keyword,
      intent: 'commercial',
      opportunityType: 'seo content',
      pageType: 'landing page',
      searchVolume: 100,
      businessContext: business_context
    });

    return {
      keyword,
      channel: scoring.channel,
      priority_score: scoring.score,
      priority: scoring.priority,
      time_horizon: scoring.timeHorizon,
      revenue_estimate: scoring.revenueBase
    };
  });

  results.sort((a,b)=>b.priority_score-a.priority_score);

  res.json({ opportunities: results });
}
