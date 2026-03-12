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
      keyword,
      location_code = 2840,
      language_code = 'en',
      depth = 10
    } = req.body || {};

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'keyword is required.' });
    }

    const payload = [{
      keyword,
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

    const results = items.map((item) => ({
      rank: item.rank_group,
      type: item.type,
      title: item.title,
      url: item.url,
      domain: item.domain,
      description: item.description
    }));

    return res.status(200).json({ results });
  } catch (error) {
    const details = error.response?.data || error.message;
    return res.status(500).json({ error: 'DataForSEO request failed', details });
  }
}
