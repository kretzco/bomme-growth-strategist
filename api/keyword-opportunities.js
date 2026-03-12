import axios from 'axios';

function getAuthHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD environment variables.');
  }

  const token = Buffer.from(`${login}:${password}`).toString('base64');
  return `Basic ${token}`;
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
      limit = 50
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

    const keywords = items.map((item) => ({
      keyword: item.keyword,
      search_volume: item.keyword_info?.search_volume ?? null,
      competition_level: item.keyword_info?.competition_level ?? null,
      keyword_difficulty: item.keyword_properties?.keyword_difficulty ?? null,
      cpc: item.keyword_info?.cpc ?? null,
      categories: item.keyword_info?.categories ?? []
    }));

    return res.status(200).json({ keywords });
  } catch (error) {
    const details = error.response?.data || error.message;
    return res.status(500).json({ error: 'DataForSEO request failed', details });
  }
}
