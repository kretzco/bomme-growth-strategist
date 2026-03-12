import type { VercelRequest, VercelResponse } from "@vercel/node";

type QueryPerformance = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
};

type PagePerformance = {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  top_queries: QueryPerformance[];
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const start_date =
      typeof req.query.start_date === "string" ? req.query.start_date : "2026-01-01";
    const end_date =
      typeof req.query.end_date === "string" ? req.query.end_date : "2026-03-12";

    const pages: PagePerformance[] = [
      {
        url: "https://www.bommestudio.com/",
        clicks: 820,
        impressions: 18400,
        ctr: 0.0446,
        avg_position: 11.2,
        top_queries: [
          {
            query: "clothing manufacturer",
            clicks: 210,
            impressions: 5200,
            ctr: 0.0404,
            avg_position: 9.8
          },
          {
            query: "apparel manufacturer",
            clicks: 95,
            impressions: 1900,
            ctr: 0.05,
            avg_position: 12.1
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/streetwear-clothing-manufacturers",
        clicks: 270,
        impressions: 6100,
        ctr: 0.0443,
        avg_position: 10.4,
        top_queries: [
          {
            query: "streetwear clothing manufacturers",
            clicks: 120,
            impressions: 2200,
            ctr: 0.0545,
            avg_position: 8.9
          }
        ]
      }
    ];

    return res.status(200).json({
      ok: true,
      source: "google_search_console_mock",
      date_range: {
        start_date,
        end_date
      },
      pages
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
